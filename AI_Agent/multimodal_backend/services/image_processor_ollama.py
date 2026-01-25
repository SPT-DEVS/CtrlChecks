"""
Image Processor Service - Ollama Version
Handles image processing using Ollama vision models (llava, qwen2.5-vl)
"""

import logging
import base64
import os
import asyncio
from typing import Tuple
try:
    import aiohttp
    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False
    import requests

logger = logging.getLogger(__name__)

# Configuration
# Default to remote Ollama API if not set in environment
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://ollama-api.ctrlchecks.ai")
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:8000")
DEFAULT_VISION_MODEL = "llava"  # or "qwen2.5-vl:7b"

class ImageProcessor:
    """
    Processes images using Ollama vision models
    Replaces BLIP with Ollama vision models (llava, qwen2.5-vl)
    """
    
    def __init__(self):
        """Initialize Ollama client"""
        self.base_url = OLLAMA_BASE_URL
        self.fallback_url = "http://localhost:11434"  # Fallback to localhost
        self.use_api = False
        self.vision_model = DEFAULT_VISION_MODEL
        self._api_checked = False
        self._fallback_used = False  # Track if we've switched to fallback
        
        logger.info(f"ImageProcessor initialized with Ollama at {self.base_url}")
        logger.info(f"OLLAMA_BASE_URL from environment: {os.getenv('OLLAMA_BASE_URL', 'NOT SET - using default')}")
    
    async def _check_api_available(self) -> bool:
        """Check if FastAPI backend is available (optional - disabled by default for remote Ollama)"""
        # Skip FastAPI backend check if using remote Ollama API (HTTPS)
        if self.base_url.startswith("https://"):
            logger.info(f"Skipping local FastAPI backend check - using remote Ollama API: {self.base_url}")
            self._api_checked = True
            self.use_api = False
            return False
        
        if self._api_checked:
            return self.use_api
        
        if not HAS_AIOHTTP:
            self._api_checked = True
            return False
        
        # Only check for local FastAPI backend if using localhost
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{OLLAMA_API_URL}/health", timeout=aiohttp.ClientTimeout(total=2)) as resp:
                    if resp.status == 200:
                        logger.warning(f"Local FastAPI backend detected at {OLLAMA_API_URL}, but using remote Ollama API: {self.base_url}")
                        # Don't switch - keep using remote
                        self._api_checked = True
                        self.use_api = False
                        return False
        except:
            pass
        
        self._api_checked = True
        return False
    
    async def _call_ollama_vision(
        self, 
        image_base64: str, 
        prompt: str, 
        system_prompt: str = None,
        max_tokens: int = 200,
        temperature: float = 0.7
    ) -> str:
        """Call Ollama vision model with image"""
        # Check API availability on first call
        if not self._api_checked:
            await self._check_api_available()
        
        # Prepare image (remove data URL prefix if present)
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        
        # Prepare messages for vision model
        # Ollama format: images are passed in the messages array
        messages = [
            {
                "role": "user",
                "content": prompt,
                "images": [image_base64]  # Base64 encoded image
            }
        ]
        
        # Always use Ollama directly (remote or local) - don't use FastAPI backend
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.vision_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        
        logger.info(f"Calling Ollama Vision API at: {url} (model: {self.vision_model})")
        
        # Try the primary URL first, fallback to localhost if it fails
        try:
            if not HAS_AIOHTTP:
                # Fallback to requests
                import requests
                response = requests.post(url, json=payload, timeout=120)
                if response.status_code != 200:
                    # Check if it's a 530 (Cloudflare Tunnel error) or connection error
                    if response.status_code == 530 or "Cloudflare" in response.text:
                        raise ConnectionError(f"Cloudflare Tunnel error (530): Remote endpoint unavailable")
                    raise Exception(f"Ollama API error ({response.status_code}): {response.text}")
                data = response.json()
                logger.info(f"✅ Successfully called Ollama Vision API at: {url} (Response: {response.status_code})")
            else:
                # Use aiohttp
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=120)) as response:
                            if response.status != 200:
                                error_text = await response.text()
                                # Check if it's a 530 (Cloudflare Tunnel error)
                                if response.status == 530 or "Cloudflare" in error_text:
                                    raise ConnectionError(f"Cloudflare Tunnel error (530): Remote endpoint unavailable")
                                raise Exception(f"Ollama API error ({response.status}): {error_text}")
                            data = await response.json()
                            logger.info(f"✅ Successfully called Ollama Vision API at: {url} (Response: {response.status})")
                except asyncio.TimeoutError:
                    raise Exception("Ollama request timeout (120s)")
                except (aiohttp.ClientError, ConnectionError) as e:
                    raise
        except (ConnectionError, aiohttp.ClientError, requests.exceptions.ConnectionError, requests.exceptions.TimeoutError) as e:
            # If remote endpoint fails and we haven't already switched, try localhost
            if not self._fallback_used and self.base_url != self.fallback_url:
                logger.warning(f"⚠️ Remote Ollama endpoint failed ({url}): {e}")
                logger.info(f"🔄 Attempting fallback to localhost: {self.fallback_url}")
                self.base_url = self.fallback_url
                self._fallback_used = True
                # Retry with localhost
                return await self._call_ollama_vision(image_base64, prompt, system_prompt, max_tokens, temperature)
            else:
                logger.error(f"❌ Ollama Vision API call failed at {url}: {e}")
                raise Exception(f"Ollama API unavailable. Tried {self.base_url} and fallback failed: {e}")
        except requests.exceptions.Timeout:
            raise Exception("Ollama request timeout (120s)")
        except Exception as e:
            logger.error(f"❌ Ollama Vision API call failed at {url}: {e}")
            raise
        
        # Parse response - always use direct Ollama format (not FastAPI backend)
        if "message" in data and "content" in data["message"]:
            return data["message"]["content"]
        elif "response" in data:
            return data["response"]
        
        raise Exception(f"Unexpected response format from Ollama: {list(data.keys())}")
    
    async def caption_image(self, image_base64: str, mode: str = "short-note") -> Tuple[str, str]:
        """
        Generate image caption using Ollama vision model
        
        Args:
            image_base64: Base64 encoded image
            mode: "short-note" for short caption
        
        Returns:
            (caption, model_name)
        """
        try:
            prompt = "Describe this image in a short, concise caption."
            if mode == "detailed":
                prompt = "Describe this image in detail, including objects, people, actions, and setting."
            
            caption = await self._call_ollama_vision(
                image_base64=image_base64,
                prompt=prompt,
                max_tokens=100 if mode == "short-note" else 200,
                temperature=0.7
            )
            
            return caption.strip(), f"ollama/{self.vision_model}"
        except Exception as e:
            logger.error(f"Image captioning error: {e}")
            raise
    
    async def generate_story(self, image_base64: str, sentence_count: int = 5) -> Tuple[str, str]:
        """
        Generate detailed story from image using Ollama vision model
        
        Uses Ollama vision for initial description + Ollama text for expansion
        """
        try:
            # Step 1: Get detailed description using Ollama vision
            vision_prompt = f"Describe this image in detail. Include what you see, the mood, colors, atmosphere, and any interesting details. Use {sentence_count} sentences."
            
            story = await self._call_ollama_vision(
                image_base64=image_base64,
                prompt=vision_prompt,
                max_tokens=300,
                temperature=0.8
            )
            
            return story.strip(), f"ollama/{self.vision_model}"
        except Exception as e:
            logger.error(f"Story generation error: {e}")
            raise
    
    async def generate_prompt(self, image_base64: str) -> Tuple[str, str]:
        """
        Generate Stable Diffusion prompt from image using Ollama vision
        
        Uses Ollama vision to create a detailed prompt
        """
        try:
            prompt = "Describe this image in detail for image generation. Include style, composition, colors, lighting, mood, and technical details. Format as a Stable Diffusion prompt with keywords."
            
            sd_prompt = await self._call_ollama_vision(
                image_base64=image_base64,
                prompt=prompt,
                max_tokens=150,
                temperature=0.7
            )
            
            # Enhance with keywords
            final_prompt = f"{sd_prompt}, ultra realistic, cinematic lighting, high detail, sharp focus, 4k, professional photography"
            
            return final_prompt.strip(), f"ollama/{self.vision_model}"
        except Exception as e:
            logger.error(f"Prompt generation error: {e}")
            raise
