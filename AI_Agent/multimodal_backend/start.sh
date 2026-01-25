#!/bin/bash

# Start script for Multimodal AI Backend

echo "🚀 Starting CtrlChecks Multimodal AI Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check for API key
if [ -z "$HUGGINGFACE_API_KEY" ]; then
    echo "⚠️  WARNING: HUGGINGFACE_API_KEY not set!"
    echo "   Set it with: export HUGGINGFACE_API_KEY='your_key'"
fi

# Start server
echo "✅ Starting FastAPI server on http://localhost:8000"
echo "📖 API docs available at http://localhost:8000/docs"
echo ""
python main.py

