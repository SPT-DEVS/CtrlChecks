# Frontend Architecture Summary

## Current Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)   │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│   Supabase      │  │  Worker Service │
│                 │  │   (FastAPI)     │
│ • Auth          │  │                 │
│ • Database      │  │ • API Endpoints  │
│ • Storage       │  │ • AI Processing │
│                 │  │ • Workflows     │
└─────────────────┘  └─────────────────┘
```

## API Call Flow

### 1. **Authentication & Database**
```
Frontend → Supabase Client → Supabase (Auth & DB)
```
- Uses: `supabase.auth.*` and `supabase.from().*`
- **NOT** using Edge Functions ✅

### 2. **Backend Operations**
```
Frontend → Worker Service (FastAPI) → AWS Services
```
- Uses: `ENDPOINTS.itemBackend` (from `VITE_PYTHON_BACKEND_URL`)
- All API calls go here ✅

## What Each Service Does

### Supabase
- ✅ User authentication (sign in, sign up, sessions)
- ✅ Database queries (workflows, templates, executions)
- ✅ File storage (if used)
- ❌ **NOT** used for Edge Functions

### Worker Service (FastAPI)
- ✅ All API endpoints (`/copy-template`, `/admin-templates`, etc.)
- ✅ AI processing (multimodal, workflows)
- ✅ Business logic
- ✅ Integration with AWS services

## Environment Variables

```env
# Supabase (Auth & Database)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Worker Service (API Calls)
VITE_PYTHON_BACKEND_URL=http://localhost:8000  # or AWS URL
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_USE_DIRECT_BACKEND=false
```

## Key Points

1. **No Edge Functions** - Frontend doesn't use them
2. **Worker Service** - Handles all backend operations
3. **Supabase** - Only for auth & database
4. **Clean Separation** - Frontend → Worker → AWS

## Migration Status

✅ **Already Complete!**
- Frontend uses worker service
- No Edge Function dependencies
- Ready for AWS deployment
