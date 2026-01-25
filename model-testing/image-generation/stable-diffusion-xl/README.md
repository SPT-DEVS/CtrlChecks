# Stable Diffusion XL Test Cases

## Model Information

- **Model Name:** `stability-ai/sdxl`
- **Provider:** Replicate
- **Endpoint:** `https://api.replicate.com/v1/predictions`
- **Free Limit:** 500 images/month
- **Capabilities:** High-quality text-to-image generation (1024x1024)

## Test Case 1: Simple Object Generation

### Input
```
A red apple on a white table, photorealistic, high quality
```

### Expected Output
- **Type:** Image (PNG/JPEG)
- **Dimensions:** 1024x1024 pixels
- **Content:** A photorealistic red apple on a white table
- **Quality:** High resolution, clear details

### Success Criteria
- ✅ Image is generated successfully
- ✅ Image matches the description
- ✅ Resolution is 1024x1024
- ✅ Generation time < 30 seconds

---

## Test Case 2: Complex Scene Generation

### Input
```
A futuristic cityscape at sunset, cyberpunk style, neon lights, flying cars, detailed architecture, cinematic lighting
```

### Expected Output
- **Type:** Image (PNG/JPEG)
- **Dimensions:** 1024x1024 pixels
- **Content:** Futuristic city with cyberpunk elements, neon lights, flying vehicles
- **Style:** Cyberpunk aesthetic with cinematic lighting

### Success Criteria
- ✅ Image contains all requested elements
- ✅ Style matches "cyberpunk"
- ✅ Lighting is cinematic
- ✅ Generation time < 45 seconds

---

## Test Case 3: Artistic Style

### Input
```
A serene mountain landscape, watercolor painting style, soft colors, peaceful atmosphere
```

### Expected Output
- **Type:** Image (PNG/JPEG)
- **Dimensions:** 1024x1024 pixels
- **Content:** Mountain landscape in watercolor style
- **Style:** Soft, artistic watercolor aesthetic

### Success Criteria
- ✅ Image is in watercolor style
- ✅ Colors are soft and artistic
- ✅ Landscape is recognizable
- ✅ Generation time < 40 seconds

---

## Test Case 4: Character Generation

### Input
```
A friendly robot character, cartoon style, bright colors, smiling, holding a flower
```

### Expected Output
- **Type:** Image (PNG/JPEG)
- **Dimensions:** 1024x1024 pixels
- **Content:** Cartoon-style robot character with flower
- **Style:** Bright, friendly cartoon aesthetic

### Success Criteria
- ✅ Robot character is clearly visible
- ✅ Style is cartoon-like
- ✅ Character is friendly/smiling
- ✅ Generation time < 35 seconds

---

## Debugging Guide

### Common Errors

1. **"API key invalid"**
   - Verify `REPLICATE_API_TOKEN` is set correctly
   - Check token hasn't expired
   - Ensure token has image generation permissions

2. **"Quota exceeded"**
   - Check monthly limit (500 images)
   - Wait for quota reset or upgrade plan
   - Verify account status on Replicate

3. **"Generation failed"**
   - Check prompt doesn't contain banned content
   - Verify model is available on Replicate
   - Check network connectivity

4. **"Timeout"**
   - Image generation can take 20-60 seconds
   - Increase timeout to 90 seconds
   - Check Replicate service status

### Verification Steps

1. ✅ API token is set: `REPLICATE_API_TOKEN`
2. ✅ Token has sufficient quota
3. ✅ Prompt is clear and descriptive
4. ✅ Image is generated (not error message)
5. ✅ Image dimensions are correct (1024x1024)

### Expected Response Format

The model should return a JSON response like:
```json
{
  "success": true,
  "output": "https://replicate.delivery/.../output.png",
  "isFallback": false,
  "imageUrl": "https://replicate.delivery/.../output.png"
}
```

**If `isFallback: true`**, the model is not working correctly.

### Image Quality Checklist

- ✅ Image is not blurry
- ✅ Colors are accurate
- ✅ Details are clear
- ✅ Composition is good
- ✅ No artifacts or distortions

