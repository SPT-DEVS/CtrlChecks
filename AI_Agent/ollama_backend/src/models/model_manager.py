"""
Model Manager - Manages multiple Ollama models with load balancing
"""

from typing import Dict, List, Optional
import yaml
import os
from pathlib import Path
from .ollama_client import OllamaClient, OllamaConfig
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging

logger = logging.getLogger(__name__)

class ModelManager:
    """Manages multiple Ollama models with load balancing"""
    
    def __init__(self, config_path: str = "config/models.yaml"):
        self.config = self._load_config(config_path)
        self.client = OllamaClient(
            OllamaConfig(base_url=self.config["ollama"]["base_url"])
        )
        self.available_models = self.config["ollama"]["models"]
        self._executor = ThreadPoolExecutor(max_workers=4)
        self._model_health = {}
    
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from YAML, with OLLAMA_BASE_URL env var override"""
        # Try multiple paths for flexibility
        possible_paths = [
            Path(__file__).parent.parent.parent / config_path,  # From src/models/
            Path(config_path),  # Absolute path
            Path.cwd() / config_path,  # Current working directory
        ]
        
        config = None
        for config_file in possible_paths:
            if config_file.exists():
                with open(config_file, 'r') as f:
                    config = yaml.safe_load(f)
                    break
        
        # If no config found, return default with remote endpoint
        if config is None:
            logger.warning(f"Config file not found at {config_path}, using defaults")
            config = {
                "ollama": {
                    "base_url": "https://ollama-api.ctrlchecks.ai",
                    "models": {
                        "qwen2_5_7b": {"name": "qwen2.5:7b", "temperature": 0.7, "top_p": 0.9, "context_window": 32768},
                        "llama3_8b": {"name": "llama3:8b", "temperature": 0.8, "top_p": 0.95, "context_window": 8192},
                        "mistral_7b": {"name": "mistral:7b", "temperature": 0.5, "top_p": 0.9, "context_window": 32768},
                    }
                }
            }
            logger.info(f"Using default remote endpoint: {config['ollama']['base_url']}")
        
        # Allow localhost for local development, remote for production
        ollama_base_url = os.getenv("OLLAMA_BASE_URL")
        if ollama_base_url:
            logger.info(f"Using OLLAMA_BASE_URL from environment: {ollama_base_url}")
            config["ollama"]["base_url"] = ollama_base_url
        else:
            # Default: try localhost first for local development
            # Fallback to remote if localhost not available
            config["ollama"]["base_url"] = "http://localhost:11434"
            logger.info(f"Using default local endpoint: {config['ollama']['base_url']}")
        
        return config
    
    async def initialize_models(self):
        """Initialize and verify all configured models"""
        logger.info("Initializing Ollama models...")
        
        # Check Ollama health with detailed error reporting
        is_healthy, error_message = await self.client.health_check()
        if not is_healthy:
            # Log detailed error but allow server to start (models will fail on first use)
            logger.warning(f"⚠️  Ollama health check failed: {error_message}")
            logger.warning("⚠️  Server will start, but model requests will fail until Ollama is accessible.")
            # Don't raise - allow server to start, errors will be handled on first request
            return
        
        # List available models
        installed_models = await self.client.list_models()
        installed_names = {m["name"] for m in installed_models}
        
        # Pull missing models
        for model_id, model_config in self.available_models.items():
            model_name = model_config["name"]
            if model_name not in installed_names:
                logger.info(f"Pulling model: {model_name}")
                async for progress in self.client.pull_model(model_name):
                    if "status" in progress:
                        logger.info(f"Download progress: {progress['status']}")
        
        logger.info("All models initialized successfully")
    
    async def get_model_response(
        self,
        model_id: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> Dict:
        """Get response from specific model"""
        # Handle both model_id (qwen2_5_7b) and model name (qwen2.5:7b)
        if model_id not in self.available_models:
            # Try to find by model name
            found = False
            for mid, config in self.available_models.items():
                if config.get("name") == model_id:
                    model_id = mid
                    found = True
                    break
            if not found:
                raise ValueError(f"Model {model_id} not configured. Available: {list(self.available_models.keys())}")
        
        model_config = self.available_models[model_id]
        
        # Merge model defaults with provided kwargs
        options = {
            "temperature": model_config.get("temperature", 0.7),
            "top_p": model_config.get("top_p", 0.9),
            **kwargs
        }
        
        result = await self.client.generate(
            model=model_config["name"],
            prompt=prompt,
            system_prompt=system_prompt,
            stream=False,
            **options
        )
        
        return {
            "response": result.get("response", ""),
            "model": model_config["name"],
            "done": result.get("done", True)
        }
    
    async def get_chat_response(
        self,
        model_id: str,
        messages: list,
        images: list = None,
        **kwargs
    ) -> Dict:
        """Get chat completion response with optional image support"""
        # Handle both model_id (qwen2_5_7b) and model name (qwen2.5:7b)
        if model_id not in self.available_models:
            # Try to find by model name
            found = False
            for mid, config in self.available_models.items():
                if config.get("name") == model_id:
                    model_id = mid
                    found = True
                    break
            if not found:
                raise ValueError(f"Model {model_id} not configured. Available: {list(self.available_models.keys())}")
        
        model_config = self.available_models[model_id]
        
        options = {
            "temperature": model_config.get("temperature", 0.7),
            "top_p": model_config.get("top_p", 0.9),
            **kwargs
        }
        
        result = await self.client.chat(
            model=model_config["name"],
            messages=messages,
            images=images,
            stream=False,
            **options
        )
        
        return {
            "message": result.get("message", {}),
            "model": model_config["name"],
            "done": result.get("done", True)
        }
    
    async def stream_model_response(
        self,
        model_id: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ):
        """Stream response from model"""
        if model_id not in self.available_models:
            raise ValueError(f"Model {model_id} not configured")
        
        model_config = self.available_models[model_id]
        
        options = {
            "temperature": model_config.get("temperature", 0.7),
            "top_p": model_config.get("top_p", 0.9),
            **kwargs
        }
        
        async for chunk in self.client.generate(
            model=model_config["name"],
            prompt=prompt,
            system_prompt=system_prompt,
            stream=True,
            **options
        ):
            yield chunk
    
    def get_available_models(self) -> List[Dict]:
        """Get list of available models with metadata"""
        return [
            {
                "id": model_id,
                "name": config["name"],
                "context_window": config["context_window"],
                "supports_images": config.get("supports_images", False)
            }
            for model_id, config in self.available_models.items()
        ]
    
    async def close(self):
        """Cleanup resources"""
        await self.client.close()
        self._executor.shutdown()
