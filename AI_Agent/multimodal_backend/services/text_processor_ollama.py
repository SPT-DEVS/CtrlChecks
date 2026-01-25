"""
Text Processor Service - Ollama Version
Handles text processing using Ollama local models
Models: qwen2.5:7b, mistral:7b, llama3:8b
"""

import logging
from typing import Tuple, List, Dict, Any
import os
try:
    import aiohttp
    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False
    import requests
import asyncio

logger = logging.getLogger(__name__)

# Configuration
# Default to remote Ollama API if not set in environment
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://ollama-api.ctrlchecks.ai")
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:8000")  # Use FastAPI backend if available

class TextProcessor:
    """
    Processes text using Ollama local models
    All tasks use Ollama chat completion API
    """
    
    def __init__(self):
        """Initialize Ollama client"""
        self.base_url = OLLAMA_BASE_URL  # Default to direct Ollama
        self.fallback_url = "http://localhost:11434"  # Fallback to localhost
        self.use_api = False  # Will check on first call
        self.default_model = "mistral_7b"  # Fast and efficient
        self._api_checked = False
        self._fallback_used = False  # Track if we've switched to fallback
        
        logger.info(f"TextProcessor initialized with Ollama at {self.base_url}")
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
    
    async def _call_ollama_chat(self, messages: List[Dict[str, str]], model: str = None, max_tokens: int = 2048, temperature: float = 0.7) -> str:
        """Call Ollama chat completion API"""
        # Check API availability on first call
        if not self._api_checked:
            await self._check_api_available()
        
        model = model or self.default_model
        
        # Always use Ollama directly (remote or local) - don't use FastAPI backend
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": model.replace("_", ":"),  # Convert mistral_7b to mistral:7b
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        
        logger.info(f"Calling Ollama API at: {url} (model: {model.replace('_', ':')})")
        
        # Try the primary URL first, fallback to localhost if it fails
        try:
            if not HAS_AIOHTTP:
                # Fallback to requests for sync calls
                import requests
                response = requests.post(url, json=payload, timeout=120)
                if response.status_code != 200:
                    # Check if it's a 530 (Cloudflare Tunnel error) or connection error
                    if response.status_code == 530 or "Cloudflare" in response.text:
                        raise ConnectionError(f"Cloudflare Tunnel error (530): Remote endpoint unavailable")
                    raise Exception(f"Ollama API error ({response.status_code}): {response.text}")
                
                data = response.json()
                logger.info(f"✅ Successfully called Ollama API at: {url} (Response: {response.status_code})")
            else:
                # Use aiohttp for async
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
                            logger.info(f"✅ Successfully called Ollama API at: {url} (Response: {response.status})")
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
                return await self._call_ollama_chat(messages, model, max_tokens, temperature)
            else:
                logger.error(f"❌ Ollama API call failed at {url}: {e}")
                raise Exception(f"Ollama API unavailable. Tried {self.base_url} and fallback failed: {e}")
        except requests.exceptions.Timeout:
            raise Exception("Ollama request timeout (120s)")
        except Exception as e:
            logger.error(f"❌ Ollama API call failed at {url}: {e}")
            raise
        
        # Parse response (same for both)
        if self.use_api:
            # FastAPI backend format
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"]
        else:
            # Direct Ollama format
            if "message" in data and "content" in data["message"]:
                return data["message"]["content"]
            elif "response" in data:
                return data["response"]
        
        raise Exception("Unexpected response format from Ollama")

    def _chunk_text(self, text: str, max_chars: int = 2000) -> List[str]:
        """
        Helper function to chunk text for large documents
        Increased chunk size for Ollama (supports larger context)
        """
        chunks = []
        current = ""

        for line in text.splitlines():
            line = line.strip()

            if not line or len(line) < 3:
                continue

            # Remove URLs & emails
            if "http" in line or "www" in line or "@" in line:
                chunks.append(line)
                continue

            if len(current) + len(line) <= max_chars:
                current += line + " "
            else:
                chunks.append(current.strip())
                current = line + " "

        if current.strip():
            chunks.append(current.strip())

        return chunks

    async def chat(self, prompt: str) -> Tuple[str, str]:
        """Chat Bot Task"""
        try:
            messages = [
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": prompt}
            ]
            response = await self._call_ollama_chat(messages, max_tokens=500, temperature=0.7)
            return response, f"ollama/{self.default_model}"
        except Exception as e:
            logger.error(f"Chat error: {e}")
            raise

    async def generate(self, prompt: str, sentence_count: int = 5) -> Tuple[str, str]:
        """Describe Topic (used for Story/Generate)"""
        try:
            messages = [
                {"role": "system", "content": "Explain topics clearly and simply."},
                {"role": "user", "content": f"Explain this topic:\n{prompt}"}
            ]
            response = await self._call_ollama_chat(messages, max_tokens=600, temperature=0.7)
            return response, f"ollama/{self.default_model}"
        except Exception as e:
            logger.error(f"Generate/Describe error: {e}")
            raise

    async def answer_question(self, question: str, context: str) -> Tuple[str, str]:
        """Document Q&A"""
        try:
            messages = [
                {"role": "system", "content": "You are a question-answering assistant. Answer questions based on the provided context. If the answer is not in the context, say so."},
                {"role": "user", "content": f"Context: {context}\n\nQuestion: {question}\n\nAnswer:"}
            ]
            response = await self._call_ollama_chat(messages, max_tokens=300, temperature=0.3)
            return response, f"ollama/{self.default_model}"
        except Exception as e:
            logger.error(f"QA error: {e}")
            raise

    async def summarize(self, text: str) -> Tuple[str, str]:
        """
        Summarize Large Text using Ollama
        """
        try:
            # Chunk text for very large documents
            chunks = self._chunk_text(text, max_chars=3000)  # Larger chunks for Ollama
            
            if not chunks:
                raise ValueError("No valid text found to summarize.")
            
            logger.info(f"Summarizing {len(chunks)} chunks using Ollama")
            summaries = []
            failed_chunks = []
            
            # Summarize each chunk
            for i, chunk in enumerate(chunks):
                try:
                    messages = [
                        {"role": "system", "content": "You are a text summarizer. Provide a concise summary of the given text."},
                        {"role": "user", "content": f"Summarize the following text:\n\n{chunk}"}
                    ]
                    summary = await self._call_ollama_chat(messages, max_tokens=400, temperature=0.5)
                    
                    if summary and summary.strip() and summary.strip() != chunk.strip():
                        summaries.append(summary.strip())
                    else:
                        logger.warning(f"Chunk {i+1}/{len(chunks)}: Empty or identical result")
                        failed_chunks.append(i + 1)
                        
                except Exception as e:
                    logger.error(f"Chunk {i+1}/{len(chunks)} failed: {e}")
                    failed_chunks.append(i + 1)
            
            if not summaries:
                raise ValueError(f"Summarization failed for all {len(chunks)} chunks.")
            
            # Combine summaries
            final_summary = "\n\n".join(summaries)
            
            # Optional: Two-stage summary for very long documents
            if len(summaries) > 3:
                try:
                    combined = " ".join(summaries)
                    if len(combined) > 4000:
                        combined = combined[:4000] + "..."
                    
                    messages = [
                        {"role": "system", "content": "You are a text summarizer. Provide a concise summary."},
                        {"role": "user", "content": f"Summarize:\n\n{combined}"}
                    ]
                    final_summary = await self._call_ollama_chat(messages, max_tokens=500, temperature=0.5)
                except Exception as compression_error:
                    logger.warning(f"Two-stage compression failed, using merged summary: {compression_error}")
                    pass

            if failed_chunks:
                logger.warning(f"Summarization completed with {len(summaries)}/{len(chunks)} chunks successful. {len(failed_chunks)} chunks failed.")
            
            logger.info(f"Summarization completed successfully: {len(summaries)} chunks → final summary ({len(final_summary)} chars)")
            return final_summary, f"ollama/{self.default_model}"
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Summarization error: {type(e).__name__}: {e}", exc_info=True)
            raise

    async def translate(self, text: str, target_language: str = "es") -> Tuple[str, str]:
        """Translate Text using Ollama"""
        try:
            # Language name mapping
            language_names = {
                "es": "Spanish", "fr": "French", "de": "German", "it": "Italian", "pt": "Portuguese",
                "Hindi": "Hindi", "Tamil": "Tamil", "Telugu": "Telugu", "Kannada": "Kannada", "Malayalam": "Malayalam"
            }
            
            target_lang_name = language_names.get(target_language, target_language)
            
            chunks = self._chunk_text(text, max_chars=2000)
            if not chunks:
                return "Nothing to translate.", f"ollama/{self.default_model}"

            translated_chunks = []

            for chunk in chunks:
                try:
                    messages = [
                        {"role": "system", "content": f"You are a professional translator. Translate the following English text to {target_lang_name}. Only provide the translation, no extra text or explanations."},
                        {"role": "user", "content": chunk}
                    ]
                    translated = await self._call_ollama_chat(messages, max_tokens=800, temperature=0.3)
                    translated_chunks.append(translated)
                except Exception as e:
                    logger.error(f"Translation chunk failed: {e}")
                    translated_chunks.append(f"[Translation Failed: {chunk[:50]}...]")

            return "\n\n".join(translated_chunks), f"ollama/{self.default_model}"

        except Exception as e:
            logger.error(f"Translation error: {e}")
            raise

    async def extract(self, text: str) -> Tuple[str, str]:
        """Extract information using Ollama"""
        try:
            messages = [
                {"role": "system", "content": "Extract key information, entities, and main points from the text. Format as a structured list."},
                {"role": "user", "content": text}
            ]
            response = await self._call_ollama_chat(messages, max_tokens=600, temperature=0.5)
            return response, f"ollama/{self.default_model}"
        except Exception as e:
            logger.error(f"Extraction error: {e}")
            raise

    async def analyze_sentiment(self, text: str) -> Tuple[str, str]:
        """Analyze Sentiment using Ollama"""
        try:
            chunks = self._chunk_text(text, max_chars=2000)
            chunk = chunks[0] if chunks else text[:2000]
            
            messages = [
                {"role": "system", "content": "Analyze the sentiment. Respond with 'positive', 'negative', or 'neutral' and a brief reason."},
                {"role": "user", "content": chunk}
            ]
            response = await self._call_ollama_chat(messages, max_tokens=150, temperature=0.3)
            return response, f"ollama/{self.default_model}"
        except Exception as e:
            logger.error(f"Sentiment error: {e}")
            raise
