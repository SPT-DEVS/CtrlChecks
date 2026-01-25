"""
Task Handlers
Handles specific AI tasks using appropriate models
"""

import logging
import base64
import io
import json
from typing import Tuple, Optional
import aiohttp

logger = logging.getLogger(__name__)


class TaskHandlers:
    """Handles all AI task processing"""
    
    def __init__(self, model_router):
        self.model_router = model_router
        self.huggingface_api_key = None
        self._load_api_key()
    
    def _load_api_key(self):
        """Load HuggingFace API key from environment"""
        import os
        self.huggingface_api_key = os.getenv("HUGGINGFACE_API_KEY")
        if not self.huggingface_api_key:
            logger.warning("HUGGINGFACE_API_KEY not set. Some models may not work.")
    
    async def _call_huggingface_api(
        self, 
        model_name: str, 
        inputs: any, 
        parameters: Optional[dict] = None
    ) -> str:
        """
        Call HuggingFace Inference API
        
        This is the ONLY way we interact with HuggingFace models.
        No local model loading to avoid memory issues.
        """
        if not self.huggingface_api_key:
            raise ValueError("HUGGINGFACE_API_KEY not set. Please configure it.")
        
        url = f"https://api-inference.huggingface.co/models/{model_name}"
        headers = {
            "Authorization": f"Bearer {self.huggingface_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": inputs,
            "parameters": parameters or {},
            "options": {
                "wait_for_model": True
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=120)) as response:
                if response.status == 503:
                    # Model is loading
                    error_data = await response.json()
                    estimated_time = error_data.get("estimated_time", 20)
                    logger.info(f"Model loading, waiting {estimated_time}s...")
                    import asyncio
                    await asyncio.sleep(estimated_time)
                    # Retry
                    return await self._call_huggingface_api(model_name, inputs, parameters)
                
                if not response.ok:
                    error_text = await response.text()
                    raise ValueError(f"HuggingFace API error ({response.status}): {error_text[:200]}")
                
                data = await response.json()
                
                # Handle different response formats
                if isinstance(data, list) and len(data) > 0:
                    result = data[0].get("generated_text") or data[0].get("text") or data[0]
                    return str(result).strip() if result else ""
                
                if isinstance(data, dict):
                    return str(data.get("generated_text") or data.get("text") or data.get("caption") or "").strip()
                
                return str(data).strip()
    
    async def handle_summarize(self, text: str) -> Tuple[str, str]:
        """Summarize text using BART"""
        model, model_name = await self.model_router.load_model("summarize")
        
        result = await self._call_huggingface_api(
            model_name,
            text,
            {"max_length": 142, "min_length": 56, "do_sample": False}
        )
        
        return result, model_name
    
    async def handle_translate(self, text: str, target_language: str = "es") -> Tuple[str, str]:
        """Translate text using Helsinki-NLP models"""
        # Map language codes to model names
        language_models = {
            "es": "Helsinki-NLP/opus-mt-en-es",
            "fr": "Helsinki-NLP/opus-mt-en-fr",
            "de": "Helsinki-NLP/opus-mt-en-de",
            "it": "Helsinki-NLP/opus-mt-en-it",
            "pt": "Helsinki-NLP/opus-mt-en-pt",
            "ru": "Helsinki-NLP/opus-mt-en-ru",
            "zh": "Helsinki-NLP/opus-mt-en-zh",
            "ja": "Helsinki-NLP/opus-mt-en-jap",
        }
        
        model_name = language_models.get(target_language, "Helsinki-NLP/opus-mt-en-es")
        
        result = await self._call_huggingface_api(
            model_name,
            text
        )
        
        return result, model_name
    
    async def handle_extract(self, text: str) -> Tuple[str, str]:
        """Extract key information from text using FLAN-T5"""
        model, model_name = await self.model_router.load_model("generate")
        
        prompt = f"Extract the key information, entities, and main points from the following text:\n\n{text}"
        
        result = await self._call_huggingface_api(
            model_name,
            prompt,
            {"max_length": 200, "temperature": 0.3}
        )
        
        return result, model_name
    
    async def handle_sentiment(self, text: str) -> Tuple[str, str]:
        """Analyze sentiment using DistilBERT"""
        model, model_name = await self.model_router.load_model("sentiment")
        
        result = await self._call_huggingface_api(
            model_name,
            text
        )
        
        # Parse result (usually returns label and score)
        try:
            if isinstance(result, str):
                result = json.loads(result)
            if isinstance(result, list) and len(result) > 0:
                result = result[0]
            
            label = result.get("label", "UNKNOWN")
            score = result.get("score", 0)
            
            return f"Sentiment: {label} (confidence: {score:.2%})", model_name
        except:
            return f"Sentiment analysis: {result}", model_name
    
    async def handle_generate(self, prompt: str) -> Tuple[str, str]:
        """Generate text using FLAN-T5"""
        model, model_name = await self.model_router.load_model("generate")
        
        result = await self._call_huggingface_api(
            model_name,
            prompt,
            {"max_length": 200, "temperature": 0.7}
        )
        
        return result, model_name
    
    async def handle_qa(self, question: str, context: str) -> Tuple[str, str]:
        """Answer question using RoBERTa SQuAD"""
        model, model_name = await self.model_router.load_model("qa")
        
        # Format for QA model
        inputs = {
            "question": question,
            "context": context
        }
        
        result = await self._call_huggingface_api(
            model_name,
            inputs
        )
        
        # Parse answer
        try:
            if isinstance(result, str):
                result = json.loads(result)
            answer = result.get("answer", result)
            return str(answer), model_name
        except:
            return str(result), model_name
    
    async def handle_image_caption(self, image_base64: str) -> Tuple[str, str]:
        """Generate image caption using BLIP"""
        model, model_name = await self.model_router.load_model("image_caption")
        
        # Clean base64 string
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        
        result = await self._call_huggingface_api(
            model_name,
            image_base64,
            {"max_length": 50, "num_beams": 5}
        )
        
        return result, model_name
    
    async def handle_image_ocr(self, image_base64: str) -> Tuple[str, str]:
        """Extract text from image using Tesseract"""
        model_config, _ = await self.model_router.load_model("image_ocr")
        
        # Decode base64 image
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        
        image_data = base64.b64decode(image_base64)
        image = model_config["Image"].open(io.BytesIO(image_data))
        
        # Extract text
        text = model_config["pytesseract"].image_to_string(image)
        
        return text.strip(), "tesseract"

