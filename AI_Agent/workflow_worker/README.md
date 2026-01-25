# Workflow Generation Worker Service

## Overview

FastAPI worker service that processes workflow generation jobs asynchronously. Runs on EC2 and calls Ollama locally at `http://localhost:11434` (no Cloudflare tunnel needed).

## Architecture

```
Frontend → FastAPI Backend → Creates Job → Returns job_id
                ↓
         Worker Service (EC2)
                ↓
         Ollama (localhost:11434)
                ↓
         Supabase DB (stores results)
                ↓
         Frontend polls /workflow-status/{job_id}
```

## Features

- ✅ Non-blocking job processing
- ✅ Retry with exponential backoff
- ✅ Streaming Ollama responses
- ✅ Phase-based model selection (mistral:7b for analyze, qwen2.5:7b for generation)
- ✅ Complete JSON workflow validation
- ✅ Progress tracking and logging
- ✅ Redis/in-memory job queue
- ✅ Observability metrics (model load time, inference time, token usage)

## Setup

### 1. Install Dependencies

```bash
cd AI_Agent/workflow_worker
pip install -r requirements.txt
```

### 2. Environment Variables

Create `.env` file:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Ollama (local)
OLLAMA_LOCAL_URL=http://localhost:11434
OLLAMA_TIMEOUT=300

# Redis (optional, falls back to in-memory queue)
REDIS_URL=redis://localhost:6379

# Worker
WORKER_ID=worker-ec2-1
MAX_RETRIES=3
RETRY_DELAY_BASE=1.0
```

### 3. Run Worker

```bash
# Development
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

### 4. Run with systemd (Production)

Create `/etc/systemd/system/workflow-worker.service`:

```ini
[Unit]
Description=Workflow Generation Worker
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/workflow-worker
Environment="PATH=/opt/workflow-worker/venv/bin"
ExecStart=/opt/workflow-worker/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable workflow-worker
sudo systemctl start workflow-worker
sudo systemctl status workflow-worker
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "worker_id": "worker-ec2-1",
  "ollama_url": "http://localhost:11434",
  "redis_available": true
}
```

### Get Job Status

```bash
GET /jobs/{job_id}/status
```

Response:
```json
{
  "id": "job_1234567890_abc123",
  "status": "completed",
  "progress_percentage": 100,
  "current_phase": "validation",
  "workflow_result": { ... },
  "created_at": "2024-01-01T00:00:00Z",
  "started_at": "2024-01-01T00:00:01Z",
  "finished_at": "2024-01-01T00:00:45Z",
  "duration_ms": 44000
}
```

### Process Job

```bash
POST /jobs/{job_id}/process
```

Triggers processing of a specific job.

### Poll Pending Jobs

```bash
POST /jobs/poll
```

Worker automatically polls for pending jobs, but this endpoint can be called manually.

## Job Processing Flow

1. **Analyze Phase** (mistral:7b)
   - Analyzes user requirements
   - Generates JSON summary
   - Progress: 0-30%

2. **Generation Phase** (qwen2.5:7b)
   - Generates complete workflow JSON
   - Uses streaming for long responses
   - Progress: 30-90%

3. **Validation Phase**
   - Validates JSON structure
   - Ensures all required fields exist
   - Progress: 90-100%

## Error Handling

- **Retry Logic**: Exponential backoff (1s, 2s, 4s delays)
- **Max Retries**: 3 attempts (configurable)
- **Error Storage**: Errors stored in `error_message` and `error_details` fields
- **Job Status**: Failed jobs marked as `failed` status

## Monitoring

Check logs:

```bash
# systemd logs
sudo journalctl -u workflow-worker -f

# Or if running directly
tail -f /var/log/workflow-worker.log
```

## Database Schema

Jobs are stored in `workflow_generation_jobs` table (see `sql_migrations/13_workflow_generation_jobs.sql`).

## Security

- Worker uses Supabase service role key (full database access)
- RLS policies ensure users can only see their own jobs
- Worker should run on private EC2 instance (not publicly accessible)
- Use VPC security groups to restrict access

## Scaling

- Run multiple worker instances (different `WORKER_ID`)
- Workers automatically poll for pending jobs
- Redis queue (optional) for better job distribution
- Each worker processes one job at a time

## Troubleshooting

### Worker not processing jobs

1. Check Ollama is running: `curl http://localhost:11434/api/tags`
2. Check Supabase connection: `GET /health`
3. Check job exists: Query `workflow_generation_jobs` table
4. Check logs: `sudo journalctl -u workflow-worker -n 100`

### Jobs stuck in "pending"

1. Check worker is running: `GET /health`
2. Check worker can access database
3. Manually trigger: `POST /jobs/{job_id}/process`

### Ollama timeouts

1. Increase `OLLAMA_TIMEOUT` in `.env`
2. Check Ollama model is loaded: `ollama list`
3. Check system resources (CPU, RAM)
