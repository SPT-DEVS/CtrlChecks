"""
CtrlChecks Multimodal AI Backend
FastAPI server for all AI/ML processing using LOCAL models

CRITICAL: All AI processing happens here using BLIP and FLAN-T5 (local CPU models)
Matches the Streamlit implementation exactly
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging
import sys
import base64
import io
import os
from pathlib import Path

# Load environment variables from .env file (if present)
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("[OK] Loaded environment variables from .env file")
except ImportError:
    # python-dotenv not installed, skip .env loading
    pass

# Add services to path
sys.path.append(str(Path(__file__).parent))

from services.image_processor_ollama import ImageProcessor
from services.text_processor_ollama import TextProcessor
# Text-to-image requires Hugging Face - disabled for Ollama-only setup
# from services.text_to_image_processor import TextToImageProcessor
TextToImageProcessor = None  # Disabled - Ollama doesn't support text-to-image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log Ollama configuration on startup
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://ollama-api.ctrlchecks.ai")
logger.info(f"OLLAMA_BASE_URL configured: {OLLAMA_BASE_URL}")
if not OLLAMA_BASE_URL.startswith("https://"):
    logger.warning(f"OLLAMA_BASE_URL is not HTTPS: {OLLAMA_BASE_URL}")

# Initialize FastAPI app
app = FastAPI(
    title="CtrlChecks Multimodal AI Backend",
    description="AI/ML processing backend using local BLIP and FLAN-T5 models",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processors (lazy loading - models load on first use)
from services.audio_processor import AudioProcessor

# Initialize processors (lazy loading - models load on first use)
_image_processor = None
_text_processor = None
_text_to_image_processor = None
_audio_processor = None

def get_image_processor():
    """Lazy load image processor"""
    global _image_processor
    if _image_processor is None:
        logger.info("Initializing ImageProcessor (will load BLIP model)...")
        _image_processor = ImageProcessor()
    return _image_processor

def get_text_processor():
    """Lazy load text processor"""
    global _text_processor
    if _text_processor is None:
        logger.info("Initializing TextProcessor (will load FLAN-T5 model)...")
        _text_processor = TextProcessor()
    return _text_processor

def get_text_to_image_processor():
    """Lazy load text-to-image processor (disabled for Ollama-only setup)"""
    global _text_to_image_processor
    if TextToImageProcessor is None:
        raise HTTPException(
            status_code=501,
            detail="Text-to-image generation is not available. Ollama doesn't support text-to-image. Use image captioning instead."
        )
    if _text_to_image_processor is None:
        logger.info("Initializing TextToImageProcessor (will load Stable Diffusion model)...")
        _text_to_image_processor = TextToImageProcessor()
    return _text_to_image_processor

def get_audio_processor():
    """Lazy load audio processor"""
    global _audio_processor
    if _audio_processor is None:
        logger.info("Initializing AudioProcessor (Whisper + MMS)...")
        _audio_processor = AudioProcessor()
    return _audio_processor


# Request/Response Schemas
class ProcessRequest(BaseModel):
    """Request schema for /process endpoint"""
    task: str = Field(..., description="Task type: image_caption, story, image_prompt, text_to_image, summarize, translate, extract, sentiment, generate, qa, chat, transcribe, text_to_speech")
    image: Optional[str] = Field(None, description="Base64 encoded image for image tasks")
    audio: Optional[str] = Field(None, description="Base64 encoded audio for transcription")
    input: Optional[str] = Field(None, description="Input text for text tasks")
    sentence_count: Optional[int] = Field(5, description="Number of sentences for story mode (2-10)")
    target_language: Optional[str] = Field(None, description="Target language for translation")
    question: Optional[str] = Field(None, description="Question for QA task")
    context: Optional[str] = Field(None, description="Context for QA task")
    steps: Optional[int] = Field(2, description="Number of inference steps for text_to_image (1-4)")
    guidance_scale: Optional[float] = Field(1.0, description="Guidance scale for text_to_image (0.0-1.5)")
    speed: Optional[float] = Field(1.0, description="Audio speed (0.8-1.3)")
    pitch: Optional[float] = Field(0.0, description="Audio pitch semitones (-3 to 3)")
    volume: Optional[float] = Field(1.0, description="Audio volume (0.8-1.5)")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional options")


class ProcessResponse(BaseModel):
    """Response schema for /process endpoint"""
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    model_used: Optional[str] = None
    processing_time: Optional[float] = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "CtrlChecks Multimodal AI Backend",
        "version": "1.0.0",
        "models": "BLIP, FLAN-T5, SD-Turbo, Whisper, MMS-TTS"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "models_loaded": {
            "blip": _image_processor is not None,
            "flan_t5": _text_processor is not None,
            "stable_diffusion": False,  # Disabled - Ollama doesn't support text-to-image
            "audio": _audio_processor is not None
        },
        "available_tasks": [
            "image_caption", "story", "image_prompt",
            "text_to_image", "summarize", "translate",
            "extract", "sentiment", "generate", "qa",
            "transcribe", "text_to_speech"
        ]
    }


@app.post("/process", response_model=ProcessResponse)
async def process_task(request: ProcessRequest):
    """
    Main processing endpoint
    """
    import time
    start_time = time.time()
    
    try:
        logger.info(f"Processing task: {request.task}")
        
        # Validation
        if request.task == "transcribe" and not request.audio:
            raise HTTPException(status_code=400, detail="Audio data required for transcription")
        
        if request.task == "text_to_speech" and not request.input:
            raise HTTPException(status_code=400, detail="Input text required for TTS")

        result = None
        model_used = None
        
        # --- Image Tasks ---
        if request.task == "image_caption":
            processor = get_image_processor()
            result, model_used = await processor.caption_image(request.image, mode="short-note")
        
        elif request.task == "story":
            processor = get_image_processor()
            result, model_used = await processor.generate_story(request.image, request.sentence_count or 5)
        
        elif request.task == "image_prompt":
            processor = get_image_processor()
            result, model_used = await processor.generate_prompt(request.image)
        
        # --- Image Gen ---
        elif request.task == "text_to_image":
            # Text-to-image requires Hugging Face - not available in Ollama-only setup
            raise HTTPException(
                status_code=501,
                detail="Text-to-image generation is not available. Ollama doesn't support text-to-image generation. " +
                       "Use image captioning (image_caption) or image story (story) tasks instead."
            )
            
        # --- Text Tasks ---
        elif request.task == "summarize":
            processor = get_text_processor()
            result, model_used = await processor.summarize(request.input)
        
        elif request.task == "translate":
            processor = get_text_processor()
            result, model_used = await processor.translate(request.input, request.target_language or "es")
        
        elif request.task == "extract":
            processor = get_text_processor()
            result, model_used = await processor.extract(request.input)
        
        elif request.task == "sentiment":
            processor = get_text_processor()
            result, model_used = await processor.analyze_sentiment(request.input)
        
        elif request.task == "generate":
            processor = get_text_processor()
            result, model_used = await processor.generate(request.input)
        
        elif request.task == "qa":
            if not request.question: raise HTTPException(status_code=400, detail="Question required")
            processor = get_text_processor()
            result, model_used = await processor.answer_question(request.question, request.context or request.input)
            
        elif request.task == "chat":
            if not request.input: raise HTTPException(status_code=400, detail="Input required")
            processor = get_text_processor()
            result, model_used = await processor.chat(request.input)

        # --- Audio Tasks ---
        elif request.task == "transcribe":
            processor = get_audio_processor()
            result = await processor.transcribe(request.audio)
            model_used = "openai/whisper-tiny"
            
        elif request.task == "text_to_speech":
            processor = get_audio_processor()
            result = await processor.generate_speech(
                request.input, 
                request.speed or 1.0,
                request.pitch or 0.0,
                request.volume or 1.0
            )
            model_used = "facebook/mms-tts-eng"
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown task: {request.task}")
        
        processing_time = time.time() - start_time
        
        return ProcessResponse(
            success=True,
            output=result,
            model_used=model_used,
            processing_time=round(processing_time, 2)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing task {request.task}: {str(e)}", exc_info=True)
        processing_time = time.time() - start_time
        return ProcessResponse(
            success=False,
            error=str(e),
            processing_time=round(processing_time, 2)
        )


@app.post("/api/agent/execute", response_model=ProcessResponse)
async def execute_agent_tool(request: ProcessRequest):
    """
    Unified entry point for Multi-Agent Tools.
    Routes to /process logic.
    """
    return await process_task(request)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8501)
