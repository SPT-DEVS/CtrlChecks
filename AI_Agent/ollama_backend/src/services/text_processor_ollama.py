"""
Text Processor Service - Ollama Version
Replaces Hugging Face Inference API with local Ollama models
"""

import logging
import httpx
import asyncio
from typing import Tuple, List, Dict, Any
import os

logger = logging.getLogger(__name__)

# Ollama configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://ollama-api.ctrlchecks.ai")
DEFAULT_MODEL = os.getenv("OLLAMA_DEFAULT_MODEL", "mistral:7b")

class TextProcessorOllama:
    """
    Processes text using Ollama local models
    Replaces HuggingFace InferenceClient with Ollama API
    """
    
    def __init__(self, base_url: str = OLLAMA_BASE_URL):
        self.base_url = base_url
        self.client = httpx.AsyncClient(base_url=base_url, timeout=300.0)
        
        # Model mappings (Ollama model names)
        self.chat_model = DEFAULT_MODEL
        self.qa_model = DEFAULT_MODEL  # Use same model for QA
        self.summarizer_model = DEFAULT_MODEL
        self.translator_model = DEFAULT_MODEL
        
        self.language_map = {
            "Hindi": "Hindi",
            "Tamil": "Tamil",
            "Telugu": "Telugu",
            "Kannada": "Kannada",
            "Malayalam": "Malayalam",
            "French": "French",
            "German": "German",
            "Spanish": "Spanish",
            "Italian": "Italian",
            "Portuguese": "Portuguese",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "it": "Italian",
            "pt": "Portuguese"
        }

    def _chunk_text(self, text: str, max_chars: int = 800) -> List[str]:
        """Helper function to chunk text"""
        chunks = []
        current = ""

        for line in text.splitlines():
            line = line.strip()

            if not line or len(line) < 3:
                continue

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

    async def _call_ollama(
        self,
        model: str,
        prompt: str,
        system_prompt: str = None,
        **options
    ) -> str:
        """Call Ollama API for text generation"""
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": options.get("temperature", 0.7),
                    "top_p": options.get("top_p", 0.9),
                    "num_predict": options.get("max_tokens", 2048),
                }
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            response = await self.client.post("/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except Exception as e:
            logger.error(f"Ollama API error: {e}")
            raise

    async def _call_ollama_chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        **options
    ) -> str:
        """Call Ollama API for chat completion"""
        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": options.get("temperature", 0.7),
                    "top_p": options.get("top_p", 0.9),
                    "num_predict": options.get("max_tokens", 2048),
                }
            }
            
            response = await self.client.post("/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "")
        except Exception as e:
            logger.error(f"Ollama chat API error: {e}")
            raise

    async def chat(self, prompt: str) -> Tuple[str, str]:
        """Chat Bot Task"""
        try:
            messages = [
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": prompt}
            ]
            response = await self._call_ollama_chat(
                self.chat_model,
                messages,
                max_tokens=300
            )
            return response, self.chat_model
        except Exception as e:
            logger.error(f"Chat error: {e}")
            raise

    async def generate(self, prompt: str, sentence_count: int = 5) -> Tuple[str, str]:
        """Describe Topic (used for Story/Generate)"""
        try:
            system_prompt = "Explain topics clearly and simply."
            user_prompt = f"Explain this topic:\n{prompt}"
            response = await self._call_ollama(
                self.chat_model,
                user_prompt,
                system_prompt=system_prompt,
                max_tokens=400
            )
            return response, self.chat_model
        except Exception as e:
            logger.error(f"Generate/Describe error: {e}")
            raise

    async def answer_question(self, question: str, context: str) -> Tuple[str, str]:
        """Document Q&A"""
        try:
            prompt = f"Context: {context}\n\nQuestion: {question}\n\nAnswer:"
            system_prompt = "Answer the question based on the provided context. If the answer is not in the context, say so."
            response = await self._call_ollama(
                self.qa_model,
                prompt,
                system_prompt=system_prompt,
                max_tokens=300
            )
            return response, self.qa_model
        except Exception as e:
            logger.error(f"QA error: {e}")
            raise

    async def summarize(self, text: str) -> Tuple[str, str]:
        """Summarize Large Text"""
        try:
            chunks = self._chunk_text(text, max_chars=800)
            
            if not chunks:
                raise ValueError("No valid text found to summarize.")
            
            logger.info(f"Summarizing {len(chunks)} chunks using {self.summarizer_model}")
            summaries = []
            
            for i, chunk in enumerate(chunks):
                try:
                    system_prompt = "You are a text summarizer. Provide a concise summary of the given text."
                    response = await self._call_ollama(
                        self.summarizer_model,
                        chunk,
                        system_prompt=system_prompt,
                        max_tokens=200
                    )
                    if response and response.strip():
                        summaries.append(response.strip())
                except Exception as e:
                    logger.warning(f"Chunk {i+1}/{len(chunks)} failed: {e}")
                    continue
            
            if not summaries:
                raise ValueError("All chunks failed to summarize.")
            
            # Combine summaries
            final_summary = "\n\n".join(summaries)
            
            # Two-stage summary for very long documents
            if len(summaries) > 3:
                try:
                    combined = " ".join(summaries)
                    if len(combined) > 2000:
                        combined = combined[:2000] + "..."
                    final_summary = await self._call_ollama(
                        self.summarizer_model,
                        combined,
                        system_prompt="Provide a concise summary of the following text.",
                        max_tokens=300
                    )
                except Exception as e:
                    logger.warning(f"Two-stage compression failed: {e}")
            
            return final_summary, self.summarizer_model
        except Exception as e:
            logger.error(f"Summarization error: {e}")
            raise

    async def translate(self, text: str, target_language: str = "es") -> Tuple[str, str]:
        """Translate Text"""
        try:
            target_lang = self.language_map.get(target_language, target_language)
            chunks = self._chunk_text(text)
            
            if not chunks:
                return "Nothing to translate.", self.translator_model

            translated_chunks = []

            for chunk in chunks:
                try:
                    system_prompt = f"You are a professional translator. Translate the following English text to {target_lang}. Only provide the translation, no extra text."
                    response = await self._call_ollama(
                        self.translator_model,
                        chunk,
                        system_prompt=system_prompt,
                        max_tokens=600
                    )
                    if response and response.strip():
                        translated_chunks.append(response.strip())
                except Exception as e:
                    logger.warning(f"Translation chunk failed: {e}")
                    translated_chunks.append(f"[Translation Failed: {chunk}]")

            return "\n\n".join(translated_chunks), self.translator_model
        except Exception as e:
            logger.error(f"Translation error: {e}")
            raise

    async def extract(self, text: str) -> Tuple[str, str]:
        """Extract information"""
        try:
            system_prompt = "Extract key information, entities, and main points."
            response = await self._call_ollama(
                self.chat_model,
                text,
                system_prompt=system_prompt,
                max_tokens=500
            )
            return response, self.chat_model
        except Exception as e:
            logger.error(f"Extraction error: {e}")
            raise

    async def analyze_sentiment(self, text: str) -> Tuple[str, str]:
        """Analyze Sentiment"""
        try:
            chunks = self._chunk_text(text, max_chars=1000)
            chunk = chunks[0] if chunks else text[:1000]
            
            system_prompt = "Analyze the sentiment. Respond with 'positive', 'negative', or 'neutral' and a brief reason."
            response = await self._call_ollama(
                self.chat_model,
                chunk,
                system_prompt=system_prompt,
                max_tokens=100
            )
            return response, self.chat_model
        except Exception as e:
            logger.error(f"Sentiment error: {e}")
            raise

    async def close(self):
        """Cleanup client"""
        await self.client.aclose()
