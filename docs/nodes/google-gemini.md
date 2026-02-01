# Google Gemini Node — User Guide

## 1. Node Overview

### What Is the Google Gemini Node?
The Google Gemini node sends a prompt to a Gemini model and returns the generated response. It is used for summarization, drafting, extraction, and other AI‑assisted tasks inside workflows.

### What Problems It Solves
- Automates text generation and analysis
- Turns unstructured text into structured output
- Adds AI‑powered reasoning to workflows

### Common Real‑World Use Cases
- Summarize documents
- Draft replies or reports
- Extract key fields from text
- Classify messages

---

## 2. Prerequisites

Before using the Google Gemini node, ensure:
- You have a Gemini API key
- The key has access to the selected model

---

## 3. Authentication & Credentials Setup

The Google Gemini node uses an **API Key**.

### How to Get a Gemini API Key
1. Go to https://aistudio.google.com/apikey  
2. Click **Create API Key**  
3. Select or create a Google Cloud project  
4. Copy the key immediately  
5. Paste it into the API Key field  

---

## 4. Input Fields – Detailed Explanation (Core Section)

The Google Gemini node has five inputs.

### 4.1 API Key
**Description:** Your Gemini API key.  
**Required:** Yes  
**Example:** `AIza...`

---

### 4.2 Model
**Description:** The Gemini model to use.  
**Required:** Yes  

**Options**
- gemini-2.5-pro
- gemini-2.5-flash
- gemini-2.5-flash-lite

**How to choose**
- **2.5 Pro** → most capable  
- **2.5 Flash** → balanced speed and quality  
- **2.5 Flash Lite** → fastest, lowest cost  

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

---

## 5. Example Configurations

### Example 1: Summarize Text
**Inputs**
- Model: gemini-2.5-flash  
- System Prompt: `Summarize the text in 3 bullet points.`  
- Temperature: 0.3  

---

### Example 2: Extraction
**Inputs**
- Model: gemini-2.5-pro  
- System Prompt: `Extract names, dates, and action items.`  
- Temperature: 0.2  

---

## 6. Output Explanation

The Google Gemini node returns:
- Generated response text
- Model and usage metadata (if available)

---

## 7. Common Errors & Fixes

### Authentication Failed
**Cause:** Invalid API key  
**Fix:** Regenerate the key and update the node

### Model Not Found
**Cause:** Model name not available  
**Fix:** Choose a supported model from the dropdown

---

## 8. Best Practices

- Use a clear system prompt
- Lower temperature for reliable output
- Avoid sending sensitive data
- Test with sample inputs before production
