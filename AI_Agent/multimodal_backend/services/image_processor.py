"""
Image Processor Service
Handles image processing using BLIP (local model)
Matches Streamlit implementation exactly
"""

import logging
import base64
import io
from typing import Tuple
from PIL import Image
import torch
from transformers import (
    BlipProcessor,
    BlipForConditionalGeneration,
)

logger = logging.getLogger(__name__)


class ImageProcessor:
    """
    Processes images using BLIP model (local CPU)
    Matches the Streamlit implementation exactly
    """
    
    def __init__(self):
        """Initialize BLIP model (lazy loading)"""
        self.blip_processor = None
        self.blip_model = None
        self._load_models()
    
    def _load_models(self):
        """Load BLIP models (matches Streamlit code)"""
        try:
            logger.info("Loading BLIP model...")
            
            # Load BLIP processor and model (matching Streamlit)
            self.blip_processor = BlipProcessor.from_pretrained(
                "Salesforce/blip-image-captioning-base"
            )
            self.blip_model = BlipForConditionalGeneration.from_pretrained(
                "Salesforce/blip-image-captioning-base"
            ).to("cpu")
            
            logger.info("[OK] BLIP model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load BLIP model: {e}")
            raise
    
    def _decode_image(self, image_base64: str) -> Image.Image:
        """Decode base64 image to PIL Image"""
        # Remove data URL prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        
        # Decode base64
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        return image
    
    async def caption_image(self, image_base64: str, mode: str = "short-note") -> Tuple[str, str]:
        """
        Generate image caption using BLIP (matching Streamlit Short Note)
        
        Args:
            image_base64: Base64 encoded image
            mode: "short-note" for short caption
        
        Returns:
            (caption, model_name)
        """
        if not self.blip_processor or not self.blip_model:
            raise ValueError("BLIP model not loaded")
        
        # Decode image
        image = self._decode_image(image_base64)
        
        # Process with BLIP (matching Streamlit code)
        inputs = self.blip_processor(image, return_tensors="pt").to("cpu")
        
        # Generate caption (matching Streamlit parameters for Short Note)
        output = self.blip_model.generate(
            **inputs,
            max_length=30,
            num_beams=3,
            do_sample=True,
            temperature=0.7,
            repetition_penalty=1.5,
            no_repeat_ngram_size=2
        )
        
        caption = self.blip_processor.decode(output[0], skip_special_tokens=True)
        
        return caption, "Salesforce/blip-image-captioning-base"
    
    async def generate_story(self, image_base64: str, sentence_count: int = 5) -> Tuple[str, str]:
        """
        Generate detailed story from image (matching Streamlit Story Description)
        
        Uses BLIP for caption + FLAN-T5 for expansion
        """
        from services.text_processor import TextProcessor
        
        # Step 1: Get base caption using BLIP (matching Streamlit)
        if not self.blip_processor or not self.blip_model:
            raise ValueError("BLIP model not loaded")
        
        image = self._decode_image(image_base64)
        inputs = self.blip_processor(image, return_tensors="pt").to("cpu")
        
        output = self.blip_model.generate(
            **inputs,
            max_length=50,
            num_beams=5,
            do_sample=True,
            temperature=0.8
        )
        base_caption = self.blip_processor.decode(output[0], skip_special_tokens=True)
        
        # Step 2: Expand caption using Ollama (matching Streamlit)
        from services.text_processor_ollama import TextProcessor
        text_processor = TextProcessor()
        prompt = (
            f"Write a creative and detailed description of this scene: {base_caption}. "
            f"Describe what you see, the mood, colors, and atmosphere. "
            f"Use exactly {sentence_count} different sentences. "
            f"Each sentence should describe a different aspect of the scene."
        )
        
        story, _ = await text_processor.generate(prompt, sentence_count)
        
        return story, "Salesforce/blip-image-captioning-base + google/flan-t5-base"
    
    async def generate_prompt(self, image_base64: str) -> Tuple[str, str]:
        """
        Generate Stable Diffusion prompt from image (matching Streamlit Image to Prompt)
        
        Uses BLIP for caption + enhancement
        """
        if not self.blip_processor or not self.blip_model:
            raise ValueError("BLIP model not loaded")
        
        image = self._decode_image(image_base64)
        inputs = self.blip_processor(image, return_tensors="pt").to("cpu")
        
        # Generate base prompt (matching Streamlit)
        output = self.blip_model.generate(
            **inputs,
            max_length=100,  # sentence_count * 25 in Streamlit, using 100 as default
            num_beams=5,
            do_sample=True,
            temperature=0.7
        )
        base_prompt = self.blip_processor.decode(output[0], skip_special_tokens=True)
        
        # Enhance with keywords (matching Streamlit)
        final_prompt = (
            f"{base_prompt}, ultra realistic, cinematic lighting, "
            f"high detail, sharp focus, 4k, professional photography"
        )
        
        return final_prompt, "Salesforce/blip-image-captioning-base"

