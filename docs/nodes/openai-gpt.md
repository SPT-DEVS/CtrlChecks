# OpenAI GPT Node — User Guide

## 1. Node Overview

### What Is the OpenAI GPT Node?
The OpenAI GPT node sends a prompt to an OpenAI model and returns the generated response. It is used for summarization, drafting, classification, and other AI‑assisted tasks inside workflows.

### What Problems It Solves
- Automates text generation and analysis
- Turns unstructured text into structured output
- Adds AI‑powered reasoning to workflows

### Common Real‑World Use Cases
- Summarize user feedback
- Draft emails or reports
- Classify messages by intent
- Extract key data from text

---

## 2. Prerequisites

Before using the OpenAI GPT node, ensure:
- You have an OpenAI API key
- The key has access to the selected model

---

## 3. Authentication & Credentials Setup

The OpenAI GPT node uses an **API Key**.

### How to Get an OpenAI API Key
1. Go to https://platform.openai.com/api-keys  
2. Click **Create new secret key**  
3. Copy the key immediately  
4. Paste it into the API Key field  

Important: You can only view the key once.

---

## 4. Input Fields – Detailed Explanation (Core Section)

The OpenAI GPT node has five inputs.

### 4.1 API Key
**Description:** Your OpenAI API key.  
**Required:** Yes  
**Example:** `sk-...`

---

### 4.2 Model
**Description:** The OpenAI model to use.  
**Required:** Yes  
**Examples:** `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`

**How to choose**
- **gpt-4o** → most capable  
- **gpt-4o-mini** → faster, lower cost  
- **gpt-4-turbo** → strong general performance  

---

### 4.3 System Prompt
**Description:** Instructions that define how the AI should behave.  
**Required:** Yes  

**Example**
```
You are a helpful assistant that summarizes text clearly.
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

### 4.5 Memory
**Description:** Number of conversation turns to remember.  
**Required:** Optional  
**Default:** 10  

**Tip:** Increase only if you need longer context.

---

## 5. Example Configurations

### Example 1: Summarize Text
**Inputs**
- Model: gpt-4o  
- System Prompt: `Summarize the text in 3 bullet points.`  
- Temperature: 0.3  

**Result**
- Short summary returned

---

### Example 2: Classification
**Inputs**
- Model: gpt-4o-mini  
- System Prompt: `Classify this message as positive, neutral, or negative.`  
- Temperature: 0.2  

---

## 6. Output Explanation

The OpenAI GPT node returns:
- Generated response text
- Model and usage metadata (if available)

---

## 7. Common Errors & Fixes

### Authentication Failed
**Cause:** Invalid API key  
**Fix:** Regenerate the key and update the node

### Model Not Found
**Cause:** Model name not available in your account  
**Fix:** Choose a supported model from the dropdown

---

## 8. Best Practices

- Use a clear system prompt
- Lower temperature for reliable output
- Avoid sending sensitive data
- Test with sample inputs before production
