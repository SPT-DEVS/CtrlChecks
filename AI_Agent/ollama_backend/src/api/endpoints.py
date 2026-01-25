"""
FastAPI Endpoints for Ollama API Server
"""

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import json
import logging
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from .schemas import (
    CompletionRequest,
    CompletionResponse,
    ChatRequest,
    ChatResponse,
    ModelInfo
)
from ..models.model_manager import ModelManager
from .proxy import proxy_models, proxy_chat, proxy_generate
from fastapi import Request
from typing import Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# API Key authentication (optional, set OLLAMA_API_KEY env var to enable)
API_KEY = os.getenv("OLLAMA_API_KEY", "")
security = HTTPBearer(auto_error=False)

def verify_api_key(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Verify API key if authentication is enabled"""
    if not API_KEY:
        # Authentication disabled
        return True
    
    if not credentials:
        raise HTTPException(status_code=401, detail="API key required. Provide Authorization header: Bearer <key>")
    
    if credentials.credentials != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return True

app = FastAPI(
    title="Ollama API Server",
    description="Production-ready replacement for Hugging Face",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model manager
model_manager = None

@app.on_event("startup")
async def startup_event():
    """Initialize model manager on startup"""
    global model_manager
    try:
        model_manager = ModelManager()
        await model_manager.initialize_models()
        logger.info("Ollama API Server started")
    except Exception as e:
        logger.error(f"Failed to initialize models: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if model_manager:
        await model_manager.close()

@app.get("/health", response_model=dict)
async def health_check():
    """Health check endpoint (public, no auth required)"""
    return {"status": "healthy", "service": "ollama-api"}

@app.get("/models")
async def list_models():
    """
    List available models (proxy to Ollama /api/tags)
    This is the direct proxy endpoint that forwards to local Ollama
    """
    return await proxy_models()

@app.get("/api/tags")
async def get_tags():
    """
    Direct proxy: GET /api/tags → Ollama /api/tags
    Alternative endpoint for native Ollama API compatibility
    """
    return await proxy_models()

@app.post("/completions", response_model=CompletionResponse)
async def create_completion(request: CompletionRequest, _: bool = Depends(verify_api_key)):
    """Create completion (similar to OpenAI API)"""
    try:
        result = await model_manager.get_model_response(
            model_id=request.model,
            prompt=request.prompt,
            system_prompt=request.system_prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        return CompletionResponse(
            model=request.model,
            choices=[{"text": result.get("response", "")}],
            usage={
                "prompt_tokens": 0,  # Ollama doesn't provide token counts
                "completion_tokens": 0,
                "total_tokens": 0
            }
        )
    except Exception as e:
        logger.error(f"Completion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_endpoint(request: Request, _: bool = Depends(verify_api_key)):
    """
    Direct proxy: POST /chat → Ollama /api/chat
    Native Ollama API endpoint for chat completions
    Supports both streaming and non-streaming
    """
    body = await request.json()
    return await proxy_chat(body, request)

@app.post("/api/chat")
async def api_chat_endpoint(request: Request, _: bool = Depends(verify_api_key)):
    """
    Direct proxy: POST /api/chat → Ollama /api/chat
    Alternative endpoint for native Ollama API compatibility
    """
    body = await request.json()
    return await proxy_chat(body, request)

@app.post("/chat/completions", response_model=ChatResponse)
async def create_chat_completion(request: ChatRequest, _: bool = Depends(verify_api_key)):
    """
    OpenAI-compatible chat completion endpoint
    Uses proxy internally to communicate with Ollama
    """
    try:
        # Convert messages to Ollama format
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Use proxy to call Ollama
        ollama_request = {
            "model": request.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": request.temperature,
                "num_predict": request.max_tokens
            }
        }
        
        result = await proxy_chat(ollama_request, request)
        message_content = result.get("message", {}).get("content", "")
        
        return ChatResponse(
            model=request.model,
            choices=[{
                "message": {
                    "role": "assistant",
                    "content": message_content
                }
            }],
            usage={
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat completion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate")
async def generate_endpoint(request: Request, _: bool = Depends(verify_api_key)):
    """
    Direct proxy: POST /api/generate → Ollama /api/generate
    Native Ollama API endpoint for text generation
    Supports both streaming and non-streaming
    """
    body = await request.json()
    return await proxy_generate(body, request)

@app.post("/stream")
async def stream_completion(request: CompletionRequest, _: bool = Depends(verify_api_key)):
    """Streaming completion endpoint"""
    async def generate():
        try:
            async for chunk in model_manager.stream_model_response(
                model_id=request.model,
                prompt=request.prompt,
                system_prompt=request.system_prompt,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
