#!C:\Program Files\Git\bin\bash.exe

# Production startup script for Ollama Backend

echo "🚀 Starting Ollama Backend..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install it first:"
    echo "   curl -fsSL https://ollama.com/install.sh | sh"
    exit 1
fi

# Start Ollama with GPU support (if available)
echo "📦 Starting Ollama server..."
OLLAMA_NUM_GPU=1 ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to start
echo "⏳ Waiting for Ollama to start..."
sleep 5

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Ollama failed to start"
    exit 1
fi

echo "✅ Ollama is running"

# Pull models in parallel
echo "📥 Pulling models..."
for model in "qwen2.5:7b" "llama3:8b" "mistral:7b"; do
    echo "  Pulling $model..."
    ollama pull $model &
done

# Wait for all models to download
wait
echo "✅ All models downloaded"

# Start API server with production settings
echo "🌐 Starting FastAPI server..."
uvicorn src.api.endpoints:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --log-level info \
    --timeout-keep-alive 300

