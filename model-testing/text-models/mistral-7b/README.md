# Mistral-7B-Instruct Test Cases

## Model Information

- **Model Name:** `mistralai/Mistral-7B-Instruct-v0.2`
- **Provider:** HuggingFace
- **Endpoint:** `https://router.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2`
- **Free Limit:** 30,000 tokens/month
- **Capabilities:** Summarization, Analysis, Translation, Q&A

## Test Case 1: Basic Question Answering

### Input
```
What is artificial intelligence? Provide a brief explanation.
```

### Expected Output
```
Artificial intelligence (AI) is a branch of computer science that aims to create systems capable of performing tasks that typically require human intelligence. These tasks include learning, reasoning, problem-solving, perception, and language understanding. AI systems can be trained on large amounts of data to recognize patterns and make decisions or predictions.
```

### Success Criteria
- ✅ Output is coherent and relevant
- ✅ Answer directly addresses the question
- ✅ Output is not a fallback response
- ✅ Response time < 10 seconds

---

## Test Case 2: Text Summarization

### Input
```
Artificial intelligence (AI) is transforming the way we work and live. Machine learning algorithms can now process vast amounts of data to identify patterns and make predictions. Natural language processing enables computers to understand and generate human language. Computer vision allows machines to interpret visual information. These technologies are being applied across industries from healthcare to finance to transportation.
```

### Expected Output
```
AI is revolutionizing multiple industries through machine learning, natural language processing, and computer vision technologies that enable data analysis, language understanding, and visual interpretation.
```

### Success Criteria
- ✅ Summary is concise (1-2 sentences)
- ✅ Key points are preserved
- ✅ Output is not a fallback response
- ✅ Response time < 15 seconds

---

## Test Case 3: Information Extraction

### Input
```
Meeting Details: Date: March 15, 2024, Time: 2:00 PM, Location: Conference Room A, Attendees: John Smith, Jane Doe, Bob Johnson, Topic: Q1 Product Launch Planning
```

### Expected Output
```
Date: March 15, 2024
Time: 2:00 PM
Location: Conference Room A
Attendees: John Smith, Jane Doe, Bob Johnson
Topic: Q1 Product Launch Planning
```

**OR** structured JSON format:
```json
{
  "date": "March 15, 2024",
  "time": "2:00 PM",
  "location": "Conference Room A",
  "attendees": ["John Smith", "Jane Doe", "Bob Johnson"],
  "topic": "Q1 Product Launch Planning"
}
```

### Success Criteria
- ✅ All information is extracted correctly
- ✅ Format is structured (list or JSON)
- ✅ No missing data points
- ✅ Response time < 12 seconds

---

## Test Case 4: Translation

### Input
```
Bonjour, comment allez-vous? Je m'appelle Marie.
```

### Expected Output
```
Hello, how are you? My name is Marie.
```

### Success Criteria
- ✅ Translation is accurate
- ✅ Context is preserved
- ✅ Output is not a fallback response
- ✅ Response time < 10 seconds

---

## Test Case 5: Data Analysis

### Input
```
Sales Report Q1 2024: January: $50,000, February: $65,000, March: $80,000, Total: $195,000. Analyze the trend.
```

### Expected Output
```
The Q1 2024 sales show a strong upward trend with consistent month-over-month growth. January started at $50,000, followed by a 30% increase to $65,000 in February, and another 23% increase to $80,000 in March. The total Q1 revenue of $195,000 represents a 60% increase from January to March, indicating positive momentum for the business.
```

### Success Criteria
- ✅ Analysis identifies the trend
- ✅ Calculations are accurate (if provided)
- ✅ Insights are meaningful
- ✅ Response time < 15 seconds

---

## Debugging Guide

### Common Errors

1. **"Model not found"**
   - Check model name is correct: `mistralai/Mistral-7B-Instruct-v0.2`
   - Verify HuggingFace API key has access

2. **"Rate limit exceeded"**
   - Check monthly quota (30,000 tokens)
   - Wait before retrying
   - Consider upgrading API plan

3. **"Timeout"**
   - Model may be overloaded
   - Retry after a few seconds
   - Check network connectivity

### Verification Steps

1. ✅ API key is set: `HUGGINGFACE_API_KEY`
2. ✅ Model endpoint is accessible
3. ✅ Input format matches model requirements
4. ✅ Output is not a fallback response
5. ✅ Response time is reasonable (< 15s)

### Expected Response Format

The model should return a JSON response like:
```json
{
  "success": true,
  "output": "Model response text here",
  "isFallback": false
}
```

**If `isFallback: true`**, the model is not working correctly.

