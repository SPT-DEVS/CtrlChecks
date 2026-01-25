"""
Audio Processor Service
Handles Audio-to-Text (ASR) and Text-to-Audio (TTS)
Uses local Whisper (ASR) and MMS-TTS (TTS) via Transformers Pipelines
"""

import logging
import os
import base64
import io
import tempfile
import soundfile as sf
import librosa
import numpy as np
import torch
from transformers import pipeline

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        self.asr_pipeline = None
        self.tts_pipeline = None
        # Lazy load is handled in methods or we can load here if frequent usage expected
        # To match other processors, we'll try to lazy load or load on init depending on overhead
        # Whisper-tiny is small, MMS is small.
        
    def _load_asr(self):
        if not self.asr_pipeline:
            logger.info("Loading ASR model (openai/whisper-tiny)...")
            self.asr_pipeline = pipeline(
                "automatic-speech-recognition",
                model="openai/whisper-tiny",
                device="cpu"
            )
            
    def _load_tts(self):
        if not self.tts_pipeline:
            logger.info("Loading TTS model (facebook/mms-tts-eng)...")
            self.tts_pipeline = pipeline(
                "text-to-speech",
                model="facebook/mms-tts-eng",
                device="cpu"
            )

    async def transcribe(self, audio_data_base64: str) -> str:
        """
        Transcribe audio file (base64) to text
        """
        try:
            self._load_asr()
            
            # Decode base64
            if "," in audio_data_base64:
                audio_data_base64 = audio_data_base64.split(",")[1]
            
            audio_bytes = base64.b64decode(audio_data_base64)
            
            # Save to temp file for soundfile/pipeline to read (simplest way ensuring format support)
            # Whisper pipeline can take raw numpy but file path is safer for various codecs
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name
            
            # Pipeline handles file loading logic internally roughly, but explicit load is safer for controlling sample rate
            # Let's trust pipeline's file handling or load with sf
            
            # Load with soundfile to ensure valid audio data array
            audio_arr, sample_rate = sf.read(tmp_path)
            
            # Run inference
            result = self.asr_pipeline({"array": audio_arr, "sampling_rate": sample_rate})
            return result["text"]

        except Exception as e:
            logger.error(f"Transcription error: {e}")
            raise


    async def generate_speech(self, text: str, speed: float = 1.0, pitch: float = 0.0, volume: float = 1.0) -> str:
        """
        Generate speech from text, return base64 encoded audio (wav)
        """
        try:
            self._load_tts()
            
            # Inference
            out = self.tts_pipeline(text)
            audio = out["audio"] # numpy array
            sr = out["sampling_rate"]
            
            # Apply Effects (Librosa)
            # 1. Speed (Time Stretch)
            if speed != 1.0:
                audio = librosa.effects.time_stretch(audio, rate=speed)
                
            # 2. Pitch (Shift)
            if pitch != 0:
                audio = librosa.effects.pitch_shift(audio, sr=sr, n_steps=pitch)
                
            # 3. Volume (Scaling + Clipping)
            if volume != 1.0:
                audio = audio * volume
                
            # Sanitize Audio (CRITICAL FIX for SoundFile/Windows)
            # 1. Ensure float32
            audio = np.array(audio, dtype=np.float32)
            
            # 2. Remove batch dim
            if audio.ndim > 1:
                audio = audio.squeeze()
                
            # 3. Remove NaN/Inf
            audio = np.nan_to_num(audio, nan=0.0, posinf=0.0, neginf=0.0)
            
            # 4. Clip to valid range
            audio = np.clip(audio, -1.0, 1.0)
            
            # 5. Convert to PCM16
            audio_int16 = (audio * 32767).astype(np.int16)
            
            # 6. Ensure contiguous memory
            audio_int16 = np.ascontiguousarray(audio_int16)
            
            # Save to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_wav:
                # Write with explicit subtype/format
                sf.write(tmp_wav.name, audio_int16, sr, subtype='PCM_16', format='WAV')
                tmp_wav_path = tmp_wav.name
                
            # Read back as bytes
            with open(tmp_wav_path, "rb") as f:
                wav_bytes = f.read()
                
            # Cleanup
            os.unlink(tmp_wav_path)
            
            # Encode
            wav_b64 = base64.b64encode(wav_bytes).decode('utf-8')
            return f"data:audio/wav;base64,{wav_b64}"
                
        except Exception as e:
            logger.error(f"TTS error: {e}")
            raise
