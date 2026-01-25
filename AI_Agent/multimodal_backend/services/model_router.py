"""
Model Router Service
Manages model loading and routing to appropriate models based on task
"""

import logging
from typing import Dict, Optional, Tuple
import os

logger = logging.getLogger(__name__)


class ModelRouter:
    """
    Routes tasks to appropriate free models
    
    Models are loaded lazily (only when needed)
    """
    
    def __init__(self):
        self.loaded_models: Dict[str, any] = {}
        self.model_configs = {
            "summarize": {
                "model_name": "facebook/bart-large-cnn",
                "provider": "huggingface",
                "type": "summarization"
            },
            "translate": {
                "model_name": "Helsinki-NLP/opus-mt-en-es",  # Default: English to Spanish
                "provider": "huggingface",
                "type": "translation"
            },
            "sentiment": {
                "model_name": "distilbert-base-uncased-finetuned-sst-2-english",
                "provider": "huggingface",
                "type": "sentiment"
            },
            "qa": {
                "model_name": "deepset/roberta-base-squad2",
                "provider": "huggingface",
                "type": "qa"
            },
            "generate": {
                "model_name": "google/flan-t5-large",
                "provider": "huggingface",
                "type": "text-generation"
            },
            "image_caption": {
                "model_name": "Salesforce/blip-image-captioning-base",
                "provider": "huggingface",
                "type": "image-to-text"
            },
            "image_ocr": {
                "model_name": "tesseract",
                "provider": "local",
                "type": "ocr"
            }
        }
    
    def get_loaded_models(self) -> list:
        """Get list of currently loaded models"""
        return list(self.loaded_models.keys())
    
    def get_model_config(self, task: str) -> Optional[Dict]:
        """Get model configuration for a task"""
        return self.model_configs.get(task)
    
    async def load_model(self, task: str) -> Tuple[any, str]:
        """
        Load model for a task (lazy loading)
        
        Returns: (model, model_name)
        """
        config = self.get_model_config(task)
        if not config:
            raise ValueError(f"No model configuration for task: {task}")
        
        model_name = config["model_name"]
        
        # Check if already loaded
        if model_name in self.loaded_models:
            logger.info(f"Using cached model: {model_name}")
            return self.loaded_models[model_name], model_name
        
        # Load model based on provider
        logger.info(f"Loading model: {model_name} for task: {task}")
        
        if config["provider"] == "huggingface":
            model = await self._load_huggingface_model(model_name, config["type"])
        elif config["provider"] == "local":
            model = await self._load_local_model(model_name, config["type"])
        else:
            raise ValueError(f"Unknown provider: {config['provider']}")
        
        # Cache model
        self.loaded_models[model_name] = model
        
        return model, model_name
    
    async def _load_huggingface_model(self, model_name: str, model_type: str):
        """Load HuggingFace model via API (no local model loading)"""
        # For HuggingFace, we use the Inference API, not local models
        # This avoids loading heavy models in memory
        return {
            "model_name": model_name,
            "provider": "huggingface",
            "type": model_type,
            "api_key": os.getenv("HUGGINGFACE_API_KEY")
        }
    
    async def _load_local_model(self, model_name: str, model_type: str):
        """Load local model (e.g., Tesseract for OCR)"""
        if model_name == "tesseract":
            try:
                import pytesseract
                from PIL import Image
                return {
                    "model_name": "tesseract",
                    "provider": "local",
                    "type": "ocr",
                    "pytesseract": pytesseract,
                    "Image": Image
                }
            except ImportError:
                raise ImportError("pytesseract and Pillow required for OCR. Install: pip install pytesseract pillow")
        
        raise ValueError(f"Unknown local model: {model_name}")

