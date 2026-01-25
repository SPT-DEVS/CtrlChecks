"""
Ollama Client - Production-grade Ollama client with retry logic and error handling
"""

import httpx
from typing import Dict, Any, Optional, AsyncGenerator
import json
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class OllamaConfig:
    base_url: str = "https://ollama-api.ctrlchecks.ai"
    timeout: int = 300
    max_retries: int = 3

class OllamaClient:
    """Production-grade Ollama client with retry logic and error handling"""
    
    def __init__(self, config: OllamaConfig = None):
        self.config = config or OllamaConfig()
        self.client = httpx.AsyncClient(
            base_url=self.config.base_url,
            timeout=self.config.timeout,
            limits=httpx.Limits(max_connections=100)
        )
        self._models_loaded = set()
        # Detect OpenAI-compatible mode based on URL
        # CRITICAL: ollama-api.ctrlchecks.ai is native Ollama (NOT OpenAI-compatible)
        # Only detect as OpenAI-compatible if explicitly contains /v1/ or is a known OpenAI gateway
        is_native_ollama_tunnel = (
            'ollama-api.ctrlchecks.ai' in self.config.base_url or
            self.config.base_url.startswith('https://ollama-api')
        )
        
        self.is_openai_compatible = (
            not is_native_ollama_tunnel and
            ('/v1/' in self.config.base_url or
             ('api.openai.com' in self.config.base_url or 'gateway' in self.config.base_url.lower()))
        )
        
        # Force native mode for known tunnel endpoints
        if is_native_ollama_tunnel:
            self.is_openai_compatible = False
        
        self._mode_detected = False
    
    async def generate(
        self,
        model: str,
        prompt: str,
        system_prompt: str = None,
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any] | AsyncGenerator:
        """Generate completion from Ollama model"""
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": kwargs.get("temperature", 0.7),
                "top_p": kwargs.get("top_p", 0.9),
                "top_k": kwargs.get("top_k", 40),
                "num_predict": kwargs.get("max_tokens", 2048),
                "repeat_penalty": kwargs.get("repeat_penalty", 1.1),
                "seed": kwargs.get("seed", None)
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        if stream:
            return self._stream_response(payload)
        else:
            return await self._make_request(payload)
    
    async def _make_request(self, payload: Dict, retry_count: int = 0) -> Dict:
        """Make HTTP request with retry logic"""
        try:
            response = await self.client.post("/api/generate", json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            if retry_count < self.config.max_retries:
                logger.warning(f"Request timeout, retrying {retry_count + 1}/{self.config.max_retries}")
                return await self._make_request(payload, retry_count + 1)
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise
    
    async def _stream_response(self, payload: Dict) -> AsyncGenerator:
        """Handle streaming responses"""
        async with self.client.stream("POST", "/api/generate", json=payload) as response:
            async for line in response.aiter_lines():
                if line.strip():
                    try:
                        yield json.loads(line)
                    except json.JSONDecodeError:
                        continue
    
    async def chat(
        self,
        model: str,
        messages: list,
        images: list = None,
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any] | AsyncGenerator:
        """Chat completion (OpenAI-compatible) with optional image support"""
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": kwargs.get("temperature", 0.7),
                "top_p": kwargs.get("top_p", 0.9),
                "top_k": kwargs.get("top_k", 40),
                "num_predict": kwargs.get("max_tokens", 2048),
                "repeat_penalty": kwargs.get("repeat_penalty", 1.1),
            }
        }
        
        # Add images if provided (for vision models)
        if images:
            payload["images"] = images
        
        if stream:
            return self._stream_chat_response(payload)
        else:
            return await self._make_chat_request(payload)
    
    async def _make_chat_request(self, payload: Dict, retry_count: int = 0) -> Dict:
        """Make chat completion request"""
        # Use correct endpoint based on detected mode
        endpoint = "/v1/chat/completions" if self.is_openai_compatible else "/api/chat"
        
        # Convert payload format for OpenAI-compatible endpoint
        if self.is_openai_compatible:
            # Convert native Ollama format to OpenAI-compatible format
            openai_payload = {
                "model": payload["model"],
                "messages": payload["messages"],
                "temperature": payload.get("options", {}).get("temperature", 0.7),
                "max_tokens": payload.get("options", {}).get("num_predict", 2048),
            }
            # Add images if present (some OpenAI-compatible servers support this)
            if "images" in payload:
                openai_payload["images"] = payload["images"]
            payload_to_send = openai_payload
        else:
            payload_to_send = payload
        
        try:
            response = await self.client.post(endpoint, json=payload_to_send)
            response.raise_for_status()
            result = response.json()
            
            # Convert OpenAI-compatible response to native Ollama format
            if self.is_openai_compatible and "choices" in result:
                openai_result = result
                if openai_result.get("choices") and len(openai_result["choices"]) > 0:
                    first_choice = openai_result["choices"][0]
                    return {
                        "model": payload["model"],
                        "message": first_choice.get("message", {}),
                        "done": True,
                    }
            
            return result
        except httpx.TimeoutException:
            if retry_count < self.config.max_retries:
                logger.warning(f"Request timeout, retrying {retry_count + 1}/{self.config.max_retries}")
                return await self._make_chat_request(payload, retry_count + 1)
            raise
        except Exception as e:
            logger.error(f"Chat request failed: {e}")
            raise
    
    async def _stream_chat_response(self, payload: Dict) -> AsyncGenerator:
        """Handle streaming chat responses"""
        # Use correct endpoint based on detected mode
        endpoint = "/v1/chat/completions" if self.is_openai_compatible else "/api/chat"
        
        # Convert payload format for OpenAI-compatible endpoint
        if self.is_openai_compatible:
            openai_payload = {
                "model": payload["model"],
                "messages": payload["messages"],
                "temperature": payload.get("options", {}).get("temperature", 0.7),
                "max_tokens": payload.get("options", {}).get("num_predict", 2048),
                "stream": True,  # Enable streaming for OpenAI-compatible
            }
            if "images" in payload:
                openai_payload["images"] = payload["images"]
            payload_to_send = openai_payload
        else:
            payload_to_send = payload
        
        async with self.client.stream("POST", endpoint, json=payload_to_send) as response:
            async for line in response.aiter_lines():
                if line.strip():
                    try:
                        # OpenAI-compatible streaming format (SSE with data: prefix)
                        if line.startswith("data: "):
                            line = line[6:]  # Remove "data: " prefix
                        if line.strip() == "[DONE]":
                            break
                        yield json.loads(line)
                    except json.JSONDecodeError:
                        continue
    
    async def list_models(self) -> list:
        """List available Ollama models"""
        # Use /v1/models for OpenAI-compatible mode, /api/tags for native Ollama
        endpoint = "/v1/models" if self.is_openai_compatible else "/api/tags"
        response = await self.client.get(endpoint)
        response.raise_for_status()
        data = response.json()
        
        # Handle different response formats
        if self.is_openai_compatible:
            # OpenAI-compatible returns array or { data: [...] }
            if isinstance(data, list):
                return [{"name": m.get("id") or m.get("name") or str(m)} for m in data]
            elif isinstance(data, dict) and "data" in data:
                return [{"name": m.get("id") or m.get("name") or str(m)} for m in data["data"]]
            else:
                return []
        else:
            # Native Ollama returns { models: [...] }
            return data.get("models", [])
    
    async def pull_model(self, model_name: str):
        """Pull a model from Ollama library"""
        async with self.client.stream("POST", "/api/pull", json={"name": model_name}) as response:
            async for line in response.aiter_lines():
                if line.strip():
                    yield json.loads(line)
    
    async def health_check(self) -> tuple:
        """Check if Ollama is running and healthy
        Detects API mode (OpenAI-compatible vs native Ollama) automatically.
        
        Returns:
            tuple: (is_healthy: bool, error_message: str)
        """
        # CRITICAL: ollama-api.ctrlchecks.ai is a native Ollama endpoint (via Cloudflare tunnel)
        # It serves native Ollama API on /api/* endpoints, NOT OpenAI-compatible /v1/* endpoints
        is_native_ollama_tunnel = (
            'ollama-api.ctrlchecks.ai' in self.config.base_url or
            self.config.base_url.startswith('https://ollama-api')
        )
        
        # Always use native Ollama endpoint for known tunnel domains
        if is_native_ollama_tunnel:
            endpoint = "/api/tags"
            fallback_endpoint = None  # No fallback needed for native endpoints
            self.is_openai_compatible = False  # Force native mode
        # For other remote domains, try OpenAI-compatible first
        elif '/v1/' in self.config.base_url or self.is_openai_compatible:
            endpoint = "/v1/models"
            fallback_endpoint = "/api/tags"
        else:
            # Default to native Ollama
            endpoint = "/api/tags"
            fallback_endpoint = "/v1/models"
        
        try:
            # Try primary endpoint
            response = await self.client.get(endpoint, timeout=10)
            
            if response.status_code == 200:
                # Success - confirm mode
                if endpoint == "/v1/models":
                    self.is_openai_compatible = True
                    logger.info(f"[OLLAMA] Detected OpenAI-compatible mode (uses /v1/ endpoints)")
                else:
                    self.is_openai_compatible = False
                    logger.info(f"[OLLAMA] Detected native Ollama mode (uses /api/ endpoints)")
                self._mode_detected = True
                return True, ""
            
            # If 404 or 403 on first attempt, try fallback endpoint (wrong endpoint type)
            elif (response.status_code == 404 or response.status_code == 403) and not self._mode_detected and fallback_endpoint:
                logger.info(f"[OLLAMA] Primary endpoint {endpoint} returned {response.status_code}, trying fallback {fallback_endpoint}")
                try:
                    fallback_response = await self.client.get(fallback_endpoint, timeout=10)
                    if fallback_response.status_code == 200:
                        # Fallback worked - update mode
                        self.is_openai_compatible = (fallback_endpoint == "/v1/models")
                        self._mode_detected = True
                        logger.info(f"[OLLAMA] Detected {'OpenAI-compatible' if self.is_openai_compatible else 'native Ollama'} mode via fallback")
                        return True, ""
                    else:
                        return False, f"Both endpoints failed: {endpoint} ({response.status_code}), {fallback_endpoint} ({fallback_response.status_code})"
                except Exception as fallback_error:
                    return False, f"Primary endpoint {endpoint} returned {response.status_code}, fallback {fallback_endpoint} failed: {str(fallback_error)}"
            
            elif response.status_code == 530:
                return False, f"Cloudflare tunnel error (530): {self.config.base_url} is not accessible. Check if Cloudflare tunnel is running."
            elif response.status_code == 403:
                return False, f"Forbidden (403): Access denied to {self.config.base_url}{endpoint}. Check Cloudflare Access settings or tunnel configuration."
            elif response.status_code == 404:
                return False, f"Endpoint not found (404): {self.config.base_url}{endpoint}. Verify the remote Ollama endpoint is configured correctly."
            else:
                return False, f"HTTP {response.status_code}: {response.text[:200]}"
        except httpx.ConnectError as e:
            return False, f"Connection error: Cannot connect to {self.config.base_url}. Check if Cloudflare tunnel is running and the remote endpoint is accessible."
        except httpx.TimeoutException:
            return False, f"Timeout: {self.config.base_url} did not respond within 10 seconds. The remote endpoint may be slow or unreachable."
        except Exception as e:
            error_msg = str(e) if str(e) else type(e).__name__
            return False, f"Health check failed: {error_msg}"
    
    async def close(self):
        """Cleanup client"""
        await self.client.aclose()
