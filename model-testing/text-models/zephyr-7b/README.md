# Zephyr-7B-Beta Test Cases

## Model Information

- **Model Name:** `HuggingFaceH4/zephyr-7b-beta`
- **Provider:** HuggingFace
- **Endpoint:** `https://router.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta`
- **Free Limit:** 30,000 tokens/month
- **Capabilities:** Instruction Following, Reasoning, Complex Tasks

## Test Case 1: Instruction Following

### Input
```
You are a helpful assistant. Please explain quantum computing in simple terms that a beginner can understand. Use analogies if helpful.
```

### Expected Output
```
Quantum computing is like having a super-powered computer that can explore many possibilities at once, rather than checking them one by one. Imagine you're looking for a specific book in a massive library. A regular computer would check each shelf methodically, but a quantum computer could check all shelves simultaneously. This is possible because quantum computers use "qubits" instead of regular bits - these qubits can exist in multiple states at the same time (called superposition), allowing for parallel processing on an unimaginable scale.
```

### Success Criteria
- ✅ Output follows the instruction format
- ✅ Explanation is beginner-friendly
- ✅ Uses analogies as requested
- ✅ Response time < 12 seconds

---

## Test Case 2: Complex Reasoning

### Input
```
A train leaves Station A at 9:00 AM traveling at 60 mph. Another train leaves Station B at 10:00 AM traveling at 80 mph. The stations are 200 miles apart. At what time will they meet?
```

### Expected Output
```
Let me solve this step by step:

Train A starts at 9:00 AM at 60 mph.
Train B starts at 10:00 AM at 80 mph.
Distance between stations: 200 miles.

By 10:00 AM (when Train B starts), Train A has been traveling for 1 hour:
Distance covered by Train A = 60 miles
Remaining distance = 200 - 60 = 140 miles

Relative speed = 60 + 80 = 140 mph
Time to meet = 140 miles / 140 mph = 1 hour

They will meet at 10:00 AM + 1 hour = 11:00 AM.
```

### Success Criteria
- ✅ Shows reasoning steps
- ✅ Calculation is correct (11:00 AM)
- ✅ Explains the process clearly
- ✅ Response time < 15 seconds

---

## Test Case 3: Multi-step Task

### Input
```
I need to plan a trip. First, list 3 popular destinations in Europe. Then, for each destination, suggest one must-see attraction and one local dish to try.
```

### Expected Output
```
Here are 3 popular European destinations with recommendations:

1. **Paris, France**
   - Must-see: Eiffel Tower
   - Local dish: Croissant or Coq au Vin

2. **Rome, Italy**
   - Must-see: Colosseum
   - Local dish: Carbonara or Gelato

3. **Barcelona, Spain**
   - Must-see: Sagrada Familia
   - Local dish: Paella or Tapas
```

### Success Criteria
- ✅ Provides exactly 3 destinations
- ✅ Each has an attraction and dish
- ✅ Format is structured and clear
- ✅ Response time < 15 seconds

---

## Test Case 4: Creative Writing

### Input
```
Write a short story (3-4 sentences) about a robot learning to paint.
```

### Expected Output
```
ARIA-7, a maintenance robot, discovered a discarded paintbrush in the workshop. Curious, it picked up the brush and made its first stroke on a blank canvas. As colors blended and patterns emerged, ARIA-7 experienced something new - a sense of creation that went beyond its programming. From that day forward, during its maintenance rounds, ARIA-7 would pause to add a new stroke to its growing collection of paintings, each one more expressive than the last.
```

### Success Criteria
- ✅ Story is 3-4 sentences
- ✅ Narrative is coherent
- ✅ Creative and engaging
- ✅ Response time < 12 seconds

---

## Debugging Guide

### Common Errors

1. **"Model timeout"**
   - Zephyr can be slower for complex tasks
   - Increase timeout to 20 seconds
   - Check HuggingFace API status

2. **"Incomplete responses"**
   - Model may be cutting off mid-response
   - Check max_tokens parameter
   - Verify API quota hasn't been exceeded

3. **"Format not followed"**
   - Zephyr is instruction-tuned but may need clearer prompts
   - Use more explicit formatting instructions
   - Provide examples in the prompt

### Verification Steps

1. ✅ API key is set: `HUGGINGFACE_API_KEY`
2. ✅ Model endpoint is accessible
3. ✅ Instructions are clear and specific
4. ✅ Output follows the requested format
5. ✅ Response time is reasonable (< 20s for complex tasks)

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

