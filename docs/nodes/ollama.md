# Ollama Node — User Guide

## 1. Node Overview

### What Is the Ollama Node?
The Ollama node connects to an Ollama server and sends a prompt to a local model. It returns the generated response so you can use it inside your workflow.

### What Problems It Solves
- Runs AI locally without sending data to third‑party APIs
- Automates text generation and analysis
- Adds AI capabilities to workflows with minimal setup

### Common Real‑World Use Cases
- Summarize internal notes
- Draft messages or reports
- Classify text by category
- Generate code snippets

---

## 2. Prerequisites

Before using the Ollama node, ensure:
- Ollama is installed and running
- The Ollama server is reachable (local or remote)
- The model you want is available on the server

---

## 3. Connection & Setup

### Ollama Server URL
**Description:** The base URL of your Ollama server.  
**Required:** Yes  
**Example:** `http://localhost:11434`

**Tip:** If using a remote server, make sure it is reachable from your workflow environment.

---

## 4. Input Fields – Detailed Explanation (Core Section)

The Ollama node has four inputs.

### 4.1 Ollama Server URL
**Description:** URL of the Ollama server.  
**Required:** Yes  
**Example:** `http://localhost:11434`

---

### 4.2 Model Name
**Description:** The model to use.  
**Required:** Yes  

**Examples**
- `llama3.1:8b`
- `qwen2.5-coder:7b`

**Tip:** The model must already be available on the Ollama server.

---

### 4.3 Prompt
**Description:** The instruction or message sent to the model.  
**Required:** Yes  

**Example**
```
Summarize the following text in 3 bullet points.
```

---

### 4.4 Temperature
**Description:** Controls creativity vs. determinism.  
**Required:** Optional  
**Range:** 0.0 to 2.0  
**Default:** 0.7  

**Guidance**
- 0.0–0.3 → factual, consistent  
- 0.7 → balanced  
- 1.0+ → more creative  

---

## 5. Example Configurations

### Example 1: Summarize Text
**Inputs**
- Server URL: `http://localhost:11434`
- Model: `llama3.1:8b`
- Prompt: `Summarize the text in 3 bullet points.`
- Temperature: 0.3

---

## 6. Output Explanation

The Ollama node returns:
- Generated response text
- Model metadata (if available)

---

## 7. Common Errors & Fixes

### Connection Failed
**Cause:** Ollama server not running or unreachable  
**Fix:** Start Ollama and verify the server URL

### Model Not Found
**Cause:** Model not available on server  
**Fix:** Pull the model on the Ollama server

---

## 8. Best Practices

- Keep prompts clear and specific
- Use lower temperature for reliable output
- Avoid sensitive data if running on shared servers
- Test with sample inputs before production
