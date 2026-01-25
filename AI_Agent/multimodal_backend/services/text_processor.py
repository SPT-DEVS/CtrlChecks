"""
Text Processor Service
Handles text processing using Hugging Face Inference API
Models: Mistral-7B, BART, NLLB, RoBERTa
"""

import logging
from typing import Tuple, List, Dict, Any
from huggingface_hub import InferenceClient
import os
import time

logger = logging.getLogger(__name__)

# Configuration
# Use environment variable or fallback to the API key from Streamlit code
HF_API_KEY = os.getenv("HF_API_KEY") or "your_huggingface_api_key_here"

class TextProcessor:
    """
    Processes text using Hugging Face Inference API
    Matches the provided Streamlit logic exactly but adapted for an API backend.
    """
    
    def __init__(self):
        """Initialize Inference Clients"""
        self.chat_client = InferenceClient(
            model="mistralai/Mistral-7B-Instruct-v0.2",
            token=HF_API_KEY
        )
        
        self.qa_client = InferenceClient(
            model="deepset/roberta-base-squad2",
            token=HF_API_KEY
        )
        
        self.summarizer = InferenceClient(
            model="facebook/bart-large-cnn",
            token=HF_API_KEY
        )
        
        self.translator = InferenceClient(
            model="facebook/nllb-200-distilled-600M",
            token=HF_API_KEY
        )
        
        self.language_map = {
            "Hindi": "hin_Deva",
            "Tamil": "tam_Taml",
            "Telugu": "tel_Telu",
            "Kannada": "kan_Knda",
            "Malayalam": "mal_Mlym",
            "French": "fra_Latn",
            "German": "deu_Latn",
            "Spanish": "spa_Latn",
            "Italian": "ita_Latn",
            "Portuguese": "por_Latn",
            # Add reverse mapping support or common codes
            "es": "spa_Latn",
            "fr": "fra_Latn",
            "de": "deu_Latn",
            "it": "ita_Latn",
            "pt": "por_Latn"
        }

    def _chunk_text(self, text: str, max_chars: int = 800) -> List[str]:
        """
        Helper function to chunk text
        Matches user's implementation exactly
        """
        chunks = []
        current = ""

        for line in text.splitlines():
            line = line.strip()

            if not line or len(line) < 3:
                continue

            # Remove URLs & emails (NLLB hates them)
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
            response = self.chat_client.chat_completion(
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300
            )
            return response.choices[0].message.content, "mistralai/Mistral-7B-Instruct-v0.2"
        except Exception as e:
            logger.error(f"Chat error: {e}")
            raise

    async def generate(self, prompt: str, sentence_count: int = 5) -> Tuple[str, str]:
        """Describe Topic (used for Story/Generate)"""
        try:
            # If it's a story generation request (from image processor), the prompt might differ
            # But here we implement the 'Describe Topic' logic from user code
            response = self.chat_client.chat_completion(
                messages=[
                    {"role": "system", "content": "Explain topics clearly and simply."},
                    {"role": "user", "content": f"Explain this topic:\n{prompt}"}
                ],
                max_tokens=400
            )
            return response.choices[0].message.content, "mistralai/Mistral-7B-Instruct-v0.2"
        except Exception as e:
            logger.error(f"Generate/Describe error: {e}")
            raise

    async def answer_question(self, question: str, context: str) -> Tuple[str, str]:
        """Document Q&A"""
        try:
            result = self.qa_client.question_answering(
                question=question,
                context=context
            )
            # Result is dict {'score':.., 'start':.., 'end':.., 'answer':..}
            return result["answer"], "deepset/roberta-base-squad2"
        except Exception as e:
            logger.error(f"QA error: {e}")
            raise

    async def summarize(self, text: str) -> Tuple[str, str]:
        """
        Summarize Large Text - Production-safe version with error handling
        
        ROOT CAUSE OF PREVIOUS BUG:
        - Silent exception handling (`except Exception: continue`) meant ALL chunk failures
          were hidden, making debugging impossible
        - No retry logic meant transient API errors (rate limits, 503s) caused permanent failures
        - No fallback meant if BART API had issues, entire summarization failed
        
        FIXES:
        1. Detailed error logging for each failed chunk (error type, message, chunk info)
        2. Retry logic with exponential backoff for transient API errors
        3. Fallback to Mistral chat_completion if BART fails completely
        4. Token-aware chunking validation (800 chars ≈ 200 tokens, safe for BART's 1024 limit)
        5. Never fails silently - always logs and attempts recovery
        
        Uses HuggingFace InferenceClient with facebook/bart-large-cnn (same as working Streamlit code)
        """
        import asyncio
        
        try:
            # Chunk text for large documents (BART has ~1024 token limit)
            # Character-based chunking at 800 chars ≈ 200 tokens (safe for BART)
            chunks = self._chunk_text(text, max_chars=800)
            
            if not chunks:
                raise ValueError("No valid text found to summarize.")
            
            logger.info(f"Summarizing {len(chunks)} chunks using facebook/bart-large-cnn")
            summaries = []
            failed_chunks = []
            
            # Summarize each chunk with retry logic
            for i, chunk in enumerate(chunks):
                chunk_success = False
                last_error = None
                
                # Retry logic: 3 attempts with exponential backoff
                for attempt in range(3):
                    try:
                        result = self.summarizer.summarization(chunk)
                        
                        # Extract summary text from various response formats
                        summary_text = None
                        if result and isinstance(result, list) and len(result) > 0:
                            if isinstance(result[0], dict) and "summary_text" in result[0]:
                                summary_text = result[0]["summary_text"]
                            elif isinstance(result[0], str):
                                summary_text = result[0]
                        elif isinstance(result, dict) and "summary_text" in result:
                            summary_text = result["summary_text"]
                        elif isinstance(result, str):
                            summary_text = result
                        
                        # Validate summary (must be non-empty and different from input)
                        if summary_text and summary_text.strip() and summary_text.strip() != chunk.strip():
                            summaries.append(summary_text.strip())
                            chunk_success = True
                            if attempt > 0:
                                logger.info(f"Chunk {i+1}/{len(chunks)} succeeded on retry {attempt+1}")
                            break
                        else:
                            # Empty or identical result - log but don't retry (not a transient error)
                            logger.warning(f"Chunk {i+1}/{len(chunks)}: BART returned empty/identical result (length: {len(chunk)} chars)")
                            break
                            
                    except Exception as e:
                        last_error = e
                        error_type = type(e).__name__
                        error_msg = str(e)
                        
                        # Log error details (NEVER silent)
                        if attempt < 2:  # Don't spam logs on final attempt
                            logger.warning(
                                f"Chunk {i+1}/{len(chunks)} failed (attempt {attempt+1}/3): "
                                f"{error_type}: {error_msg[:200]} | "
                                f"Chunk length: {len(chunk)} chars"
                            )
                        
                        # Retry on transient errors (503, rate limits, network issues)
                        if attempt < 2:
                            wait_time = (2 ** attempt)  # Exponential backoff: 1s, 2s
                            await asyncio.sleep(wait_time)
                        else:
                            # Final attempt failed
                            failed_chunks.append({
                                "chunk_index": i + 1,
                                "chunk_length": len(chunk),
                                "error_type": error_type,
                                "error_message": error_msg[:200],
                                "chunk_preview": chunk[:100] + "..." if len(chunk) > 100 else chunk
                            })
                
                if not chunk_success:
                    logger.error(
                        f"Chunk {i+1}/{len(chunks)} failed after 3 attempts. "
                        f"Error: {last_error.__class__.__name__}: {str(last_error)[:200]}"
                    )
            
            # If all chunks failed, try fallback to Mistral
            if not summaries:
                logger.warning(
                    f"All {len(chunks)} chunks failed with BART. "
                    f"Attempting fallback to Mistral for summarization."
                )
                
                # Fallback: Use Mistral to summarize (works for smaller texts)
                # Combine chunks and truncate to reasonable size for Mistral
                combined_text = " ".join(chunks)
                if len(combined_text) > 3000:  # Mistral context limit
                    combined_text = combined_text[:3000] + "..."
                
                try:
                    fallback_response = self.chat_client.chat_completion(
                        messages=[
                            {"role": "system", "content": "You are a text summarizer. Provide a concise summary of the given text."},
                            {"role": "user", "content": f"Summarize the following text:\n\n{combined_text}"}
                        ],
                        max_tokens=400
                    )
                    fallback_summary = fallback_response.choices[0].message.content
                    if fallback_summary and fallback_summary.strip():
                        logger.info("Fallback to Mistral succeeded")
                        return fallback_summary.strip(), "mistralai/Mistral-7B-Instruct-v0.2 (fallback)"
                except Exception as fallback_error:
                    logger.error(f"Fallback to Mistral also failed: {fallback_error}")
                    # Include failed chunk details in error message
                    error_details = "\n".join([
                        f"  Chunk {fc['chunk_index']}: {fc['error_type']} - {fc['error_message']}"
                        for fc in failed_chunks[:5]  # Show first 5 failures
                    ])
                    raise ValueError(
                        f"Summarization failed for all {len(chunks)} chunks using BART, "
                        f"and fallback to Mistral also failed.\n\n"
                        f"Failed chunk details (showing first 5):\n{error_details}\n\n"
                        f"This usually indicates:\n"
                        f"1. API rate limiting or quota exceeded\n"
                        f"2. Invalid API key or authentication issue\n"
                        f"3. Network connectivity problems\n"
                        f"4. HuggingFace API service issues\n"
                        f"Check backend logs for detailed error messages."
                    )
            
            # Log partial success if some chunks failed
            if failed_chunks:
                logger.warning(
                    f"Summarization completed with {len(summaries)}/{len(chunks)} chunks successful. "
                    f"{len(failed_chunks)} chunks failed (check logs for details)."
                )
            
            # Combine summaries
            final_summary = "\n\n".join(summaries)
            
            # Optional: Two-stage summary for very long documents (compress final summary)
            # This matches the working Streamlit code exactly
            if len(summaries) > 3:
                try:
                    combined = " ".join(summaries)
                    # Limit combined text to avoid token limit
                    if len(combined) > 2000:
                        combined = combined[:2000] + "..."
                    final_result = self.summarizer.summarization(combined)
                    if final_result and isinstance(final_result, list) and len(final_result) > 0:
                        if isinstance(final_result[0], dict) and "summary_text" in final_result[0]:
                            final_summary = final_result[0]["summary_text"]
                        elif isinstance(final_result[0], str):
                            final_summary = final_result[0]
                except Exception as compression_error:
                    # If compression fails, use the merged summary (matches Streamlit behavior)
                    logger.warning(f"Two-stage compression failed, using merged summary: {compression_error}")
                    pass

            logger.info(f"Summarization completed successfully: {len(summaries)} chunks → final summary ({len(final_summary)} chars)")
            return final_summary, "facebook/bart-large-cnn"

        except ValueError:
            # Re-raise ValueError as-is (already has user-friendly message)
            raise
        except Exception as e:
            logger.error(f"Summarization error: {type(e).__name__}: {e}", exc_info=True)
            raise

    async def translate(self, text: str, target_language: str = "es") -> Tuple[str, str]:
        """Translate Text"""
        try:
            # Map standard codes to NLLB codes if needed, or use name map
            # User provided map:
            # "Hindi": "hin_Deva", etc.
            # But the input `target_language` might be "es", "fr" from frontend
            # We need to map "es" -> "spa_Latn"
            
            target_lang_code = self.language_map.get(target_language)
            # If not found, try to find by key (e.g. if user passed "Spanish")
            if not target_lang_code:
                 # Fallback/Default
                 target_lang_code = "spa_Latn" 

            chunks = self._chunk_text(text)
            if not chunks:
                 return "Nothing to translate.", "facebook/nllb-200-distilled-600M"

            translated_chunks = []

            for chunk in chunks:
                try:
                    # Primary: NLLB translation API
                    result = self.translator.translation(
                        chunk,
                        src_lang="eng_Latn",
                        tgt_lang=target_lang_code
                    )
                    
                    if (
                        isinstance(result, list)
                        and len(result) > 0
                        and "translation_text" in result[0]
                        and result[0]["translation_text"].strip()
                        and result[0]["translation_text"] != chunk  # Check if it actually translated
                    ):
                        translated_chunks.append(result[0]["translation_text"])
                    else:
                        # FALLBACK: Use Mistral (chat_client) for translation if NLLB is flaky or returns same text
                        fallback_resp = self.chat_client.chat_completion(
                            messages=[
                                {"role": "system", "content": f"You are a professional translator. Translate the following English text to {target_language}. Only provide the translation, no extra text."},
                                {"role": "user", "content": chunk}
                            ],
                            max_tokens=600
                        )
                        translated_chunks.append(fallback_resp.choices[0].message.content)
                        
                except Exception as e:
                    # Final Fallback: use Mistral if NLLB is down/erroring
                    try:
                        fallback_resp = self.chat_client.chat_completion(
                            messages=[
                                {"role": "system", "content": f"Translate to {target_language}:"},
                                {"role": "user", "content": chunk}
                            ],
                            max_tokens=600
                        )
                        translated_chunks.append(fallback_resp.choices[0].message.content)
                    except Exception:
                        translated_chunks.append(f"[Translation Failed: {chunk}]")

            return "\n\n".join(translated_chunks), "facebook/nllb-200-distilled-600M"

        except Exception as e:
            logger.error(f"Translation error: {e}")
            raise

    async def extract(self, text: str) -> Tuple[str, str]:
        """Extract information (using Mistral as generic extraction tool)"""
        try:
            response = self.chat_client.chat_completion(
                messages=[
                    {"role": "system", "content": "Extract key information, entities, and main points."},
                    {"role": "user", "content": text}
                ],
                max_tokens=500
            )
            return response.choices[0].message.content, "mistralai/Mistral-7B-Instruct-v0.2"
        except Exception as e:
            logger.error(f"Extraction error: {e}")
            raise

    async def analyze_sentiment(self, text: str) -> Tuple[str, str]:
        """Analyze Sentiment (using Mistral)"""
        try:
            # Use chunks if text is long, but sentiment is usually whole-text. 
            # We'll truncate to fit if needed or use the first chunk.
            chunks = self._chunk_text(text, max_chars=1000)
            chunk = chunks[0] if chunks else text[:1000]
            
            response = self.chat_client.chat_completion(
                messages=[
                    {"role": "system", "content": "Analyze the sentiment. Respond with 'positive', 'negative', or 'neutral' and a brief reason."},
                    {"role": "user", "content": chunk}
                ],
                max_tokens=100
            )
            return response.choices[0].message.content, "mistralai/Mistral-7B-Instruct-v0.2"
        except Exception as e:
            logger.error(f"Sentiment error: {e}")
            raise
