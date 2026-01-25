# BLIP Image Captioning Test Cases

## Model Information

- **Model Name:** `Salesforce/blip-image-captioning-base`
- **Provider:** HuggingFace
- **Endpoint:** `https://router.huggingface.co/models/Salesforce/blip-image-captioning-base`
- **Free Limit:** 30,000 tokens/month
- **Capabilities:** Generate descriptive captions for images

## Test Case 1: Simple Object Captioning

### Input
- **Image:** A photo of a red apple on a white table
- **Image Format:** JPEG/PNG
- **Image Size:** Any (model will resize)

### Expected Output
```
a red apple sitting on a white table
```

**OR**

```
a red apple on a white table
```

### Success Criteria
- ✅ Caption describes the main object (apple)
- ✅ Caption mentions color (red)
- ✅ Caption mentions location (table)
- ✅ Response time < 10 seconds

---

## Test Case 2: Complex Scene Captioning

### Input
- **Image:** A photo of a busy city street with cars, people, and buildings
- **Image Format:** JPEG/PNG
- **Image Size:** Any

### Expected Output
```
a busy city street with cars, people walking, and tall buildings
```

**OR**

```
a street scene with vehicles, pedestrians, and urban architecture
```

### Success Criteria
- ✅ Caption identifies multiple elements
- ✅ Caption describes the scene context
- ✅ Caption is grammatically correct
- ✅ Response time < 12 seconds

---

## Test Case 3: Action Captioning

### Input
- **Image:** A photo of a person playing guitar
- **Image Format:** JPEG/PNG
- **Image Size:** Any

### Expected Output
```
a person playing a guitar
```

**OR**

```
someone playing guitar
```

### Success Criteria
- ✅ Caption identifies the action
- ✅ Caption mentions the object (guitar)
- ✅ Caption is concise and accurate
- ✅ Response time < 10 seconds

---

## Test Case 4: Nature Scene Captioning

### Input
- **Image:** A photo of a mountain landscape with trees and a lake
- **Image Format:** JPEG/PNG
- **Image Size:** Any

### Expected Output
```
a mountain landscape with trees and a lake
```

**OR**

```
a scenic view of mountains, forest, and water
```

### Success Criteria
- ✅ Caption identifies natural elements
- ✅ Caption describes the scene type (landscape)
- ✅ Caption mentions key features
- ✅ Response time < 12 seconds

---

## Debugging Guide

### Common Errors

1. **"Image format not supported"**
   - Ensure image is JPEG or PNG
   - Check image file is not corrupted
   - Verify image can be loaded

2. **"Image too large"**
   - Resize image to max 1024x1024
   - Compress image if needed
   - Check file size < 10MB

3. **"Model timeout"**
   - Image processing can take 5-15 seconds
   - Increase timeout to 20 seconds
   - Check HuggingFace API status

4. **"Invalid caption"**
   - Model may return generic captions
   - Try different images
   - Check image quality

### Verification Steps

1. ✅ API key is set: `HUGGINGFACE_API_KEY`
2. ✅ Image is valid (can be opened)
3. ✅ Image format is JPEG or PNG
4. ✅ Caption is generated (not error)
5. ✅ Caption describes the image accurately

### Expected Response Format

The model should return a JSON response like:
```json
{
  "success": true,
  "output": "a red apple sitting on a white table",
  "isFallback": false,
  "caption": "a red apple sitting on a white table"
}
```

**If `isFallback: true`**, the model is not working correctly.

### Image Requirements

- **Formats:** JPEG, PNG
- **Max Size:** 10MB recommended
- **Dimensions:** Any (model auto-resizes)
- **Quality:** Clear, well-lit images work best

### Caption Quality Checklist

- ✅ Caption is grammatically correct
- ✅ Caption describes main subjects
- ✅ Caption includes relevant details
- ✅ Caption is concise (5-15 words typically)
- ✅ Caption matches the image content

