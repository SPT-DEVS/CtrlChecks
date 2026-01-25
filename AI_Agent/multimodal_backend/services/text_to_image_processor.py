"""
Text-to-Image Processor Service
Handles text-to-image generation using Stable Diffusion Turbo (local model)
Matches Streamlit implementation exactly
"""

import logging
import os
import base64
import io
from typing import Tuple
from PIL import Image
import torch
from diffusers import StableDiffusionPipeline

logger = logging.getLogger(__name__)


class TextToImageProcessor:
    """
    Generates images from text using Stable Diffusion Turbo (local CPU)
    Matches the Streamlit implementation exactly
    """
    
    def __init__(self):
        """Initialize Stable Diffusion model (lazy loading)"""
        self.pipe = None
        self._load_model()
    
    def _load_model(self):
        """Load Stable Diffusion Turbo model (matching Streamlit code)"""
        try:
            logger.info("Loading Stable Diffusion Turbo model...")
            
            # Load model (matching Streamlit code)
            # Note: In production, use environment variable for token
            hf_token = os.getenv("HUGGING_FACE_TOKEN")
            
            self.pipe = StableDiffusionPipeline.from_pretrained(
                "stabilityai/sd-turbo",
                torch_dtype=torch.float32,
                safety_checker=None,
                token=hf_token
            )
            self.pipe = self.pipe.to("cpu")
            self.pipe.enable_attention_slicing()
            
            logger.info("[OK] Stable Diffusion Turbo model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Stable Diffusion model: {e}")
            raise
    
    def _encode_image(self, image: Image.Image) -> str:
        """Encode PIL Image to base64 data URL"""
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        image_bytes = buffer.getvalue()
        base64_str = base64.b64encode(image_bytes).decode('utf-8')
        return f"data:image/png;base64,{base64_str}"
    
    async def generate_image(
        self, 
        prompt: str, 
        steps: int = 2, 
        guidance_scale: float = 1.0
    ) -> Tuple[str, str]:
        """
        Generate image from text prompt (matching Streamlit code)
        
        Args:
            prompt: Text prompt for image generation
            steps: Number of inference steps (1-4, default 2)
            guidance_scale: Guidance scale (0.0-1.5, default 1.0)
        
        Returns:
            (base64_image_data_url, model_name)
        """
        if not self.pipe:
            raise ValueError("Stable Diffusion model not loaded")
        
        # Validate parameters (matching Streamlit ranges)
        steps = max(1, min(4, int(steps)))  # Clamp to 1-4
        guidance_scale = max(0.0, min(1.5, float(guidance_scale)))  # Clamp to 0.0-1.5
        
        logger.info(f"Generating image with prompt: {prompt[:50]}... (steps={steps}, guidance={guidance_scale})")
        
        # Generate image (matching Streamlit code)
        with torch.no_grad():
            image = self.pipe(
                prompt,
                num_inference_steps=steps,
                guidance_scale=guidance_scale
            ).images[0]
        
        # Convert to base64 data URL
        image_data_url = self._encode_image(image)
        
        return image_data_url, "stabilityai/sd-turbo"

