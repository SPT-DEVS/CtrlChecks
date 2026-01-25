# FastAPI Proxy Security Architecture

## 🛡️ Security Design

### Problem: Direct Ollama Exposure

**Previous Setup (INSECURE):**
```
Cloudflare Tunnel → Ollama (localhost:11434) ❌
```

**Issues:**
- Ollama has no built-in authentication
- No rate limiting
- No request validation
- Direct access to model management
- No audit logging
- Vulnerable to abuse

### Solution: FastAPI Proxy Layer

**New Setup (SECURE):**
```
Cloudflare Tunnel → FastAPI Backend (port 8000) → Ollama (localhost:11434) ✅
```

**Benefits:**
- ✅ Authentication via API keys
- ✅ Request validation and sanitization
- ✅ Rate limiting capability
- ✅ Audit logging
- ✅ Error handling and sanitization
- ✅ No direct Ollama exposure

---

## 📋 Architecture

### Network Flow

```
Internet
  ↓
Cloudflare Tunnel (HTTPS)
  ↓
FastAPI Backend (localhost:8000) ← Only this is exposed
  ↓
Ollama (localhost:11434) ← Internal only, never exposed
```

### Cloudflare Tunnel Configuration

**File:** `cloudflare-tunnel-config.yml`

```yaml
ingress:
  # ONLY FastAPI backend is exposed
  - hostname: coverage-francis-distributor-sauce.trycloudflare.com
    service: http://localhost:8000  # FastAPI, NOT Ollama
  
  # Ollama (port 11434) is NOT in this config
```

**Key Point:** Ollama port 11434 is **never** in the tunnel config.

---

## 🔌 Proxy Endpoints

### GET /models
**Proxies to:** `http://localhost:11434/api/tags`

**Usage:**
```bash
curl https://diego-ski-deutsche-choir.trycloudflare.com/models
```

**Response:** List of available Ollama models

---

### POST /chat
**Proxies to:** `http://localhost:11434/api/chat`

**Usage:**
```bash
curl -X POST https://diego-ski-deutsche-choir.trycloudflare.com/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral:7b",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

**Features:**
- ✅ Supports streaming (`"stream": true`)
- ✅ Supports non-streaming (`"stream": false`)
- ✅ Proper timeout handling (5 minutes)
- ✅ Error passthrough

---

### POST /api/chat
**Same as `/chat`** - Alternative endpoint for Ollama API compatibility

---

### POST /api/generate
**Proxies to:** `http://localhost:11434/api/generate`

**Usage:**
```bash
curl -X POST https://diego-ski-deutsche-choir.trycloudflare.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral:7b",
    "prompt": "Hello!",
    "stream": false
  }'
```

---

## 🔒 Security Features

### 1. API Key Authentication (Optional)

**Enable:**
```bash
export OLLAMA_API_KEY="your-secret-key"
```

**Usage:**
```bash
curl -X POST https://diego-ski-deutsche-choir.trycloudflare.com/chat \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Without API Key:** Endpoints are public (set `OLLAMA_API_KEY=""` or don't set it)

### 2. Request Validation

- ✅ JSON schema validation
- ✅ Model name validation
- ✅ Message format validation
- ✅ Parameter bounds checking

### 3. Error Handling

- ✅ Timeout protection (5 minutes max)
- ✅ Connection error handling
- ✅ Ollama error passthrough (with sanitization)
- ✅ No internal URLs leaked to clients

### 4. Logging

**What's Logged:**
- ✅ Incoming request (method, path, params)
- ✅ Ollama request duration
- ✅ Ollama response status
- ✅ Errors and exceptions

**Example Log:**
```
2026-01-17 10:33:05 INFO Proxying POST /chat → Ollama /api/chat (stream=False)
2026-01-17 10:33:07 INFO Ollama /api/chat responded: 200 in 2.34s
```

---

## 🚫 What's NOT Exposed

### ❌ Direct Ollama Endpoints

These are **NEVER** exposed via Cloudflare:
- `https://diego-ski-deutsche-choir.trycloudflare.com/api/tags` → **403 Forbidden** (expected!)
- Direct Ollama API calls → **Blocked**

### ✅ Only FastAPI Endpoints

These are exposed:
- `https://diego-ski-deutsche-choir.trycloudflare.com/models` → ✅ Works
- `https://diego-ski-deutsche-choir.trycloudflare.com/chat` → ✅ Works
- `https://diego-ski-deutsche-choir.trycloudflare.com/api/chat` → ✅ Works
- `https://diego-ski-deutsche-choir.trycloudflare.com/api/generate` → ✅ Works

---

## 📝 Usage Examples

### Using FastAPI Proxy (Recommended)

**TypeScript/JavaScript:**
```typescript
const response = await fetch('https://diego-ski-deutsche-choir.trycloudflare.com/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY' // Optional
  },
  body: JSON.stringify({
    model: 'mistral:7b',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: false
  })
});

const data = await response.json();
console.log(data.message.content);
```

**Python:**
```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        'https://diego-ski-deutsche-choir.trycloudflare.com/chat',
        json={
            'model': 'mistral:7b',
            'messages': [{'role': 'user', 'content': 'Hello!'}],
            'stream': False
        },
        headers={'Authorization': 'Bearer YOUR_API_KEY'}  # Optional
    )
    data = response.json()
    print(data['message']['content'])
```

**cURL:**
```bash
curl -X POST https://diego-ski-deutsche-choir.trycloudflare.com/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "mistral:7b",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

---

## 🔄 Migration Guide

### Before (Direct Ollama Access)

```typescript
// ❌ OLD - Direct Ollama (blocked by Cloudflare)
const response = await fetch('https://diego-ski-deutsche-choir.trycloudflare.com/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    model: 'mistral:7b',
    messages: [...]
  })
});
```

### After (FastAPI Proxy)

```typescript
// ✅ NEW - FastAPI Proxy
const response = await fetch('https://diego-ski-deutsche-choir.trycloudflare.com/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'mistral:7b',
    messages: [...]
  })
});
```

**Changes:**
- `/api/chat` → `/chat` or `/api/chat` (both work via proxy)
- Same request format (Ollama-compatible)
- Same response format (Ollama-compatible)

---

## ✅ Benefits Summary

| Feature | Direct Ollama | FastAPI Proxy |
|---------|---------------|---------------|
| **Authentication** | ❌ None | ✅ API Key |
| **Rate Limiting** | ❌ None | ✅ Possible |
| **Request Validation** | ❌ None | ✅ Yes |
| **Audit Logging** | ❌ Limited | ✅ Full |
| **Error Handling** | ❌ Basic | ✅ Advanced |
| **Timeout Control** | ❌ Basic | ✅ Configurable |
| **Security** | ❌ Low | ✅ High |

---

## 🎯 Key Takeaways

1. **Ollama (port 11434) is NEVER exposed** via Cloudflare Tunnel
2. **Only FastAPI (port 8000) is exposed** via Cloudflare Tunnel
3. **All clients must use FastAPI endpoints**, not direct Ollama
4. **403 Forbidden on `/api/tags`** is **expected and correct** (Ollama not exposed)
5. **FastAPI proxy endpoints** provide the same functionality with added security

---

## 🔧 Configuration

### Environment Variables

```bash
# FastAPI Backend
OLLAMA_API_KEY="your-secret-key"  # Optional, for authentication
OLLAMA_LOCAL_URL="http://localhost:11434"  # Internal only

# Clients (Backend, Frontend, etc.)
OLLAMA_BASE_URL="https://diego-ski-deutsche-choir.trycloudflare.com"  # Use FastAPI proxy
```

### Cloudflare Tunnel Config

```yaml
ingress:
  - hostname: coverage-francis-distributor-sauce.trycloudflare.com
    service: http://localhost:8000  # FastAPI only, NOT Ollama
```

---

## 📚 Related Files

- **Proxy Implementation:** `src/api/proxy.py`
- **FastAPI Endpoints:** `src/api/endpoints.py`
- **Tunnel Config:** `cloudflare-tunnel-config.yml`
- **Security Guide:** This file

---

**Remember:** The 403 error when accessing Ollama directly is a **security feature**, not a bug! Use the FastAPI proxy endpoints instead.
