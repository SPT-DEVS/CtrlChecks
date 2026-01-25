# CtrlChecks Multimodal AI Backend

FastAPI backend for all AI/ML processing using **LOCAL models** (BLIP, FLAN-T5).

## 🎯 Architecture

```
React Frontend
    ↓
FastAPI backend (validation/proxy only)
    ↓
Python FastAPI Backend (THIS) ← All AI processing here
    ↓
Local Models (BLIP, FLAN-T5 on CPU)
```

## ✅ Models Used (Local CPU)

- **BLIP**: `Salesforce/blip-image-captioning-base` - Image captioning
- **FLAN-T5**: `google/flan-t5-base` - Text generation/expansion

**Matches your Streamlit implementation exactly!**

## 📦 Setup

### 1. Install Dependencies

```bash
cd AI_Agent/multimodal_backend
pip install -r requirements.txt
```

**Note:** First run will download models (~1-2GB). This only happens once.

### 2. Run the Server

```bash
python main.py
```

Server runs on: `http://localhost:8501`

### 3. Configure Supabase

In backend environment configuration:
- Add: `PYTHON_BACKEND_URL=http://localhost:8501` (for local dev)
- For production: Use your deployed Python backend URL

## 🚀 API Endpoints

### POST `/process`

**Request:**
```json
{
  "task": "image_caption" | "story" | "image_prompt" | "summarize" | "translate" | "extract" | "sentiment" | "generate" | "qa",
  "image": "data:image/jpeg;base64,...",  // For image tasks
  "input": "Text to process...",  // For text tasks
  "sentence_count": 5,  // For story mode (2-10)
  "target_language": "es",  // For translation
  "question": "What is...?",  // For QA
  "context": "..."  // For QA
}
```

**Response:**
```json
{
  "success": true,
  "output": "Result text...",
  "model_used": "Salesforce/blip-image-captioning-base",
  "processing_time": 2.34
}
```

## 🎯 Image Tasks

- **`image_caption`**: Short note (one sentence) - Uses BLIP
- **`story`**: Detailed story (multi-sentence) - Uses BLIP + FLAN-T5
- **`image_prompt`**: Stable Diffusion prompt - Uses BLIP + enhancement

## 📝 Text Tasks

- **`summarize`**: Text summarization - Uses FLAN-T5
- **`translate`**: Text translation - Uses FLAN-T5
- **`extract`**: Information extraction - Uses FLAN-T5
- **`sentiment`**: Sentiment analysis - Uses FLAN-T5
- **`generate`**: Text generation - Uses FLAN-T5
- **`qa`**: Question answering - Uses FLAN-T5

## ⚙️ Configuration

### Environment Variables

```bash
# Optional: Set port
export PORT=8501

# Optional: Set log level
export LOG_LEVEL=INFO
```

## 🐛 Troubleshooting

### Issue: "Model not found"

**Solution:** Models download automatically on first run. Wait for download to complete.

### Issue: "Out of memory"

**Solution:** Models run on CPU. If you have limited RAM, close other applications.

### Issue: "Connection refused"

**Solution:** 
1. Make sure Python backend is running: `python main.py`
2. Check `PYTHON_BACKEND_URL` in Supabase secrets

### Issue: "Module not found"

**Solution:**
```bash
pip install -r requirements.txt
```

## 📊 Performance

- **First request**: 10-30 seconds (model loading)
- **Subsequent requests**: 2-10 seconds (models cached)
- **Memory usage**: ~2-3GB RAM
- **CPU**: Uses all available cores

## 🎉 Why This Works

1. ✅ **BLIP runs locally** - No API limitations
2. ✅ **FLAN-T5 runs locally** - No API limitations
3. ✅ **Matches Streamlit code** - Same models, same parameters
4. ✅ **No 500 errors** - Proper error handling
5. ✅ **Production ready** - Scalable architecture

## 📚 Next Steps

1. Deploy Python backend to production (Heroku, Railway, etc.)
2. Update `PYTHON_BACKEND_URL` in Supabase secrets
3. Test all image processing modes
4. Monitor performance and optimize if needed
