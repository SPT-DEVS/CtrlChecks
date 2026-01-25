"""
FastAPI Proxy for Ollama
Proxies requests to local Ollama instance (localhost:11434)
Security: Never exposes Ollama directly via Cloudflare
"""

import httpx
import logging
import time
from fastapi import HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from typing import Optional, Dict, Any
import json

logger = logging.getLogger(__name__)

# Ollama runs on localhost:11434 (NOT exposed via Cloudflare)
OLLAMA_LOCAL_URL = "http://localhost:11434"
OLLAMA_TIMEOUT = 300.0  # 5 minutes timeout

# HTTP client for proxying to Ollama
ollama_client = httpx.AsyncClient(
    base_url=OLLAMA_LOCAL_URL,
    timeout=httpx.Timeout(OLLAMA_TIMEOUT),
    limits=httpx.Limits(max_connections=50)
)


async def proxy_models():
    """
    Proxy GET /models → Ollama /api/tags
    Returns list of available models
    """
    start_time = time.time()
    logger.info("Proxying GET /models → Ollama /api/tags")
    
    try:
        response = await ollama_client.get("/api/tags")
        duration = time.time() - start_time
        
        logger.info(f"Ollama /api/tags responded: {response.status_code} in {duration:.2f}s")
        
        if response.status_code != 200:
            error_text = response.text[:200]  # Limit error message length
            logger.error(f"Ollama error ({response.status_code}): {error_text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Ollama API error: {error_text}"
            )
        
        data = response.json()
        return data
        
    except httpx.TimeoutException:
        duration = time.time() - start_time
        logger.error(f"Ollama request timeout after {duration:.2f}s")
        raise HTTPException(status_code=504, detail="Ollama request timeout (5 minutes)")
    
    except httpx.ConnectError:
        logger.error("Failed to connect to local Ollama instance (localhost:11434)")
        raise HTTPException(
            status_code=503,
            detail="Ollama service unavailable. Ensure Ollama is running on localhost:11434"
        )
    
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"Proxy error after {duration:.2f}s: {e}")
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")


async def proxy_chat(request_body: Dict[str, Any], request: Request):
    """
    Proxy POST /chat → Ollama /api/chat
    Handles both streaming and non-streaming requests
    """
    start_time = time.time()
    
    # Extract streaming flag (default False)
    stream = request_body.get("stream", False)
    
    logger.info(f"Proxying POST /chat → Ollama /api/chat (stream={stream})")
    logger.debug(f"Request body: {json.dumps(request_body, indent=2)}")
    
    try:
        if stream:
            # Streaming response
            async def stream_ollama_response():
                try:
                    async with ollama_client.stream(
                        "POST",
                        "/api/chat",
                        json=request_body,
                        timeout=httpx.Timeout(OLLAMA_TIMEOUT)
                    ) as response:
                        logger.info(f"Ollama /api/chat stream started: {response.status_code}")
                        
                        if response.status_code != 200:
                            error_text = await response.aread()
                            logger.error(f"Ollama stream error ({response.status_code}): {error_text[:200]}")
                            yield f"data: {json.dumps({'error': f'Ollama error: {response.status_code}'})}\n\n"
                            return
                        
                        async for chunk in response.aiter_text():
                            if chunk:
                                yield chunk
                        
                        duration = time.time() - start_time
                        logger.info(f"Ollama /api/chat stream completed in {duration:.2f}s")
                        
                except httpx.TimeoutException:
                    duration = time.time() - start_time
                    logger.error(f"Ollama stream timeout after {duration:.2f}s")
                    yield f"data: {json.dumps({'error': 'Ollama request timeout'})}\n\n"
                
                except Exception as e:
                    duration = time.time() - start_time
                    logger.error(f"Stream error after {duration:.2f}s: {e}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
            return StreamingResponse(
                stream_ollama_response(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        
        else:
            # Non-streaming response
            response = await ollama_client.post("/api/chat", json=request_body)
            duration = time.time() - start_time
            
            logger.info(f"Ollama /api/chat responded: {response.status_code} in {duration:.2f}s")
            
            if response.status_code != 200:
                error_text = response.text[:200]
                logger.error(f"Ollama error ({response.status_code}): {error_text}")
                
                return JSONResponse(
                    status_code=response.status_code,
                    content={"error": f"Ollama API error ({response.status_code}): {error_text}"}
                )
            
            data = response.json()
            return data
    
    except httpx.TimeoutException:
        duration = time.time() - start_time
        logger.error(f"Ollama request timeout after {duration:.2f}s")
        raise HTTPException(status_code=504, detail="Ollama request timeout (5 minutes)")
    
    except httpx.ConnectError:
        logger.error("Failed to connect to local Ollama instance (localhost:11434)")
        raise HTTPException(
            status_code=503,
            detail="Ollama service unavailable. Ensure Ollama is running on localhost:11434"
        )
    
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"Proxy error after {duration:.2f}s: {e}")
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")


async def proxy_generate(request_body: Dict[str, Any], request: Request):
    """
    Proxy POST /api/generate → Ollama /api/generate
    Handles text generation (non-chat)
    """
    start_time = time.time()
    stream = request_body.get("stream", False)
    
    logger.info(f"Proxying POST /api/generate → Ollama /api/generate (stream={stream})")
    
    try:
        if stream:
            # Streaming response
            async def stream_ollama_response():
                try:
                    async with ollama_client.stream(
                        "POST",
                        "/api/generate",
                        json=request_body,
                        timeout=httpx.Timeout(OLLAMA_TIMEOUT)
                    ) as response:
                        logger.info(f"Ollama /api/generate stream started: {response.status_code}")
                        
                        if response.status_code != 200:
                            error_text = await response.aread()
                            logger.error(f"Ollama stream error ({response.status_code}): {error_text[:200]}")
                            yield f"data: {json.dumps({'error': f'Ollama error: {response.status_code}'})}\n\n"
                            return
                        
                        async for chunk in response.aiter_text():
                            if chunk:
                                yield chunk
                        
                        duration = time.time() - start_time
                        logger.info(f"Ollama /api/generate stream completed in {duration:.2f}s")
                        
                except Exception as e:
                    duration = time.time() - start_time
                    logger.error(f"Stream error after {duration:.2f}s: {e}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
            return StreamingResponse(
                stream_ollama_response(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        
        else:
            # Non-streaming response
            response = await ollama_client.post("/api/generate", json=request_body)
            duration = time.time() - start_time
            
            logger.info(f"Ollama /api/generate responded: {response.status_code} in {duration:.2f}s")
            
            if response.status_code != 200:
                error_text = response.text[:200]
                logger.error(f"Ollama error ({response.status_code}): {error_text}")
                
                return JSONResponse(
                    status_code=response.status_code,
                    content={"error": f"Ollama API error ({response.status_code}): {error_text}"}
                )
            
            return response.json()
    
    except httpx.TimeoutException:
        duration = time.time() - start_time
        logger.error(f"Ollama request timeout after {duration:.2f}s")
        raise HTTPException(status_code=504, detail="Ollama request timeout (5 minutes)")
    
    except httpx.ConnectError:
        logger.error("Failed to connect to local Ollama instance (localhost:11434)")
        raise HTTPException(
            status_code=503,
            detail="Ollama service unavailable. Ensure Ollama is running on localhost:11434"
        )
    
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"Proxy error after {duration:.2f}s: {e}")
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")
