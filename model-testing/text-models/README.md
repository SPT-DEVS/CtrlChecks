# 📝 Text Models Testing

This folder contains test cases for text processing models.

## Available Models

1. **Mistral-7B-Instruct** (`mistral-7b/`)
2. **Zephyr-7B-Beta** (`zephyr-7b/`)
3. **Llama-3-70B (via Groq)** (`llama-70b-groq/`)

## Test Categories

### 1. Question & Answering (Q&A)
- **Purpose:** Test model's ability to answer questions accurately
- **Input Format:** Natural language questions
- **Expected Output:** Coherent, relevant answers

### 2. Text Summarization
- **Purpose:** Test model's ability to condense long text
- **Input Format:** Long paragraphs or articles
- **Expected Output:** Concise summaries (2-3 sentences)

### 3. Information Extraction
- **Purpose:** Test model's ability to extract structured data
- **Input Format:** Unstructured text with embedded information
- **Expected Output:** Structured data (JSON-like format)

### 4. Translation
- **Purpose:** Test model's multilingual capabilities
- **Input Format:** Text in source language
- **Expected Output:** Translated text in target language

### 5. Data Analysis
- **Purpose:** Test model's analytical reasoning
- **Input Format:** Data sets or reports
- **Expected Output:** Insights and analysis

## Common Issues

### Issue: Fallback Response
**Symptoms:** Output starts with "Processed:" or "[AI Processing]"
**Solutions:**
- Verify `HUGGINGFACE_API_KEY` is set correctly
- Check API quota hasn't been exceeded
- Ensure model endpoint is accessible

### Issue: Timeout Errors
**Symptoms:** Request times out after 30+ seconds
**Solutions:**
- Check network connectivity
- Verify API endpoint is responding
- Try a different model provider

### Issue: Invalid Output Format
**Symptoms:** Output doesn't match expected structure
**Solutions:**
- Review prompt formatting
- Check model-specific requirements
- Verify input format matches model expectations

## API Requirements

- **HuggingFace API Key** (Required for Mistral, Zephyr)
- **Groq API Key** (Required for Llama-70B)
- **Replicate API Token** (Not used for text models)

