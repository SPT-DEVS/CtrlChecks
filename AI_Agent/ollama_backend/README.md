# Ollama Backend - Production-Ready Replacement for Hugging Face

## 🚀 Quick Start

### 1. Install Ollama

```bash
# Linux/Mac
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

### 2. Pull Models

```bash
ollama pull qwen2.5:7b
ollama pull llama3:8b
ollama pull mistral:7b
```

### 3. Start Ollama Server

```bash
ollama serve
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Start API Server

```bash
uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload
```

## 📁 Project Structure

```
ollama_backend/
├── config/
│   └── models.yaml          # Model configurations
├── src/
│   ├── models/
│   │   ├── ollama_client.py  # Core Ollama client
│   │   └── model_manager.py # Model lifecycle management
│   ├── api/
│   │   ├── endpoints.py      # FastAPI endpoints
│   │   └── schemas.py       # Pydantic schemas
│   └── services/
│       └── text_processor_ollama.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── start.sh
```

## 🔧 Configuration

Edit `config/models.yaml` to configure models:

```yaml
ollama:
  base_url: "http://localhost:11434"
  models:
    qwen2_5_7b:
      name: "qwen2.5:7b"
      context_window: 32768
      temperature: 0.7
      top_p: 0.9
```

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### List Models
```bash
GET /models
```

### Completion
```bash
POST /completions
{
  "model": "mistral:7b",
  "prompt": "Hello!",
  "temperature": 0.7,
  "max_tokens": 100
}
```

### Chat Completion
```bash
POST /chat/completions
{
  "model": "mistral:7b",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7
}
```

### Streaming
```bash
POST /stream
{
  "model": "mistral:7b",
  "prompt": "Tell me a story",
  "stream": true
}
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### Manual Build

```bash
docker build -t ollama-backend .
docker run -p 8000:8000 -p 11434:11434 --gpus all ollama-backend
```

## 🌐 Environment Variables

- `OLLAMA_BASE_URL` - Ollama server URL (default: http://localhost:11434)
- `OLLAMA_DEFAULT_MODEL` - Default model (default: mistral:7b)

## 🔍 Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

### Check Ollama
```bash
curl http://localhost:11434/api/tags
```

## 🚨 Troubleshooting

### Ollama Not Starting
```bash
# Check if running
ps aux | grep ollama

# Start manually
ollama serve
```

### Out of Memory
Reduce `num_gpu_layers` in `config/models.yaml`

### Slow Responses
Use quantized models:
```bash
ollama pull mistral:7b:q4_0
```

## 📚 Documentation

See [OLLAMA_MIGRATION_GUIDE.md](../../Debugging/02-Deployment/OLLAMA_MIGRATION_GUIDE.md) for complete migration guide.

## ✅ Benefits

- ✅ Unlimited usage (no API limits)
- ✅ Privacy (local processing)
- ✅ Cost savings (no API fees)
- ✅ GPU acceleration
- ✅ Offline capability
- ✅ Custom models
