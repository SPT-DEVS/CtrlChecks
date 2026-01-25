"""
Workflow Generation Worker Service
Runs on EC2, processes workflow generation jobs asynchronously
Calls Ollama locally at http://localhost:11434 (no Cloudflare tunnel needed)
"""

import asyncio
import logging
import os
import time
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import redis
from supabase import create_client, Client
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Workflow Generation Worker", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OLLAMA_LOCAL_URL = os.getenv("OLLAMA_LOCAL_URL", "http://localhost:11434")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "300"))  # 5 minutes
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
WORKER_ID = os.getenv("WORKER_ID", f"worker-{uuid.uuid4().hex[:8]}")
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
RETRY_DELAY_BASE = float(os.getenv("RETRY_DELAY_BASE", "1.0"))  # Base delay in seconds

# Initialize clients
supabase: Optional[Client] = None
redis_client: Optional[redis.Redis] = None
ollama_client: Optional[httpx.AsyncClient] = None

# Initialize Supabase client
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    logger.info("Supabase client initialized")
else:
    logger.warning("Supabase credentials not provided, worker will not function properly")

# Initialize Redis client (optional, falls back to in-memory queue)
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    logger.info("Redis client initialized")
except Exception as e:
    logger.warning(f"Redis not available, using in-memory queue: {e}")
    redis_client = None

# In-memory job queue (fallback if Redis unavailable)
in_memory_queue: List[str] = []
queue_lock = asyncio.Lock()

# Initialize Ollama client
ollama_client = httpx.AsyncClient(
    base_url=OLLAMA_LOCAL_URL,
    timeout=httpx.Timeout(OLLAMA_TIMEOUT),
    limits=httpx.Limits(max_connections=10)
)

# ============================================
# Models
# ============================================

class JobStatus(BaseModel):
    id: str
    status: str
    progress_percentage: int
    current_phase: Optional[str] = None
    workflow_result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: str
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    duration_ms: Optional[int] = None

class WorkflowRequest(BaseModel):
    prompt: str
    mode: str = "create"
    current_workflow: Optional[Dict[str, Any]] = None
    execution_history: Optional[List[Dict[str, Any]]] = []
    config: Optional[Dict[str, Any]] = {}

# ============================================
# Helper Functions
# ============================================

async def update_job_status(
    job_id: str,
    status: str,
    progress: Optional[int] = None,
    phase: Optional[str] = None,
    error_message: Optional[str] = None,
    workflow_result: Optional[Dict[str, Any]] = None,
    observability: Optional[Dict[str, Any]] = None
):
    """Update job status in Supabase"""
    if not supabase:
        logger.error("Supabase client not initialized")
        return
    
    update_data: Dict[str, Any] = {"status": status}
    
    if progress is not None:
        update_data["progress_percentage"] = progress
    if phase:
        update_data["current_phase"] = phase
    if error_message:
        update_data["error_message"] = error_message
    if workflow_result:
        update_data["workflow_result"] = workflow_result
    if observability:
        update_data["observability"] = observability
    
    if status in ["completed", "failed", "cancelled"]:
        update_data["finished_at"] = datetime.utcnow().isoformat()
    
    try:
        result = supabase.table("workflow_generation_jobs").update(update_data).eq("id", job_id).execute()
        logger.info(f"Updated job {job_id} status to {status}")
    except Exception as e:
        logger.error(f"Failed to update job status: {e}")

async def add_progress_log(job_id: str, message: str, progress: Optional[int] = None, phase: Optional[str] = None):
    """Add progress log to job"""
    if not supabase:
        return
    
    try:
        # Get current logs
        job = supabase.table("workflow_generation_jobs").select("progress_logs").eq("id", job_id).execute()
        if job.data:
            logs = job.data[0].get("progress_logs", [])
            logs.append({
                "timestamp": datetime.utcnow().isoformat(),
                "message": message,
                "progress": progress,
                "phase": phase
            })
            
            supabase.table("workflow_generation_jobs").update({
                "progress_logs": logs,
                "progress_percentage": progress or 0,
                "current_phase": phase
            }).eq("id", job_id).execute()
    except Exception as e:
        logger.error(f"Failed to add progress log: {e}")

async def call_ollama_chat(
    model: str,
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 2048,
    stream: bool = False
) -> Dict[str, Any]:
    """
    Call Ollama chat API with retry and exponential backoff
    """
    url = f"{OLLAMA_LOCAL_URL}/api/chat"
    payload = {
        "model": model,
        "messages": messages,
        "stream": stream,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
        }
    }
    
    attempt = 0
    last_error = None
    
    while attempt < MAX_RETRIES:
        try:
            if stream:
                # Streaming mode
                full_content = ""
                async with ollama_client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        raise Exception(f"Ollama error {response.status_code}: {error_text.decode()[:200]}")
                    
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                chunk = json.loads(line)
                                if chunk.get("message", {}).get("content"):
                                    full_content += chunk["message"]["content"]
                                if chunk.get("done"):
                                    break
                            except json.JSONDecodeError:
                                continue
                
                return {"message": {"content": full_content}, "response": full_content}
            else:
                # Non-streaming mode
                response = await ollama_client.post(url, json=payload)
                if response.status_code != 200:
                    error_text = response.text[:200]
                    raise Exception(f"Ollama error {response.status_code}: {error_text}")
                
                return response.json()
        
        except Exception as e:
            last_error = e
            attempt += 1
            
            if attempt < MAX_RETRIES:
                delay = RETRY_DELAY_BASE * (2 ** (attempt - 1))  # Exponential backoff
                logger.warning(f"Ollama call failed (attempt {attempt}/{MAX_RETRIES}), retrying in {delay}s: {e}")
                await asyncio.sleep(delay)
            else:
                logger.error(f"Ollama call failed after {MAX_RETRIES} attempts: {e}")
                raise
    
    raise Exception(f"Ollama call failed after {MAX_RETRIES} attempts: {last_error}")

def ensure_complete_workflow_json(workflow: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure workflow has complete JSON structure"""
    if not workflow or not isinstance(workflow, dict):
        raise ValueError("Invalid workflow: must be an object")
    
    # Ensure required fields
    if "nodes" not in workflow or not isinstance(workflow["nodes"], list):
        workflow["nodes"] = []
    if "edges" not in workflow or not isinstance(workflow["edges"], list):
        workflow["edges"] = []
    if "name" not in workflow or not isinstance(workflow["name"], str):
        workflow["name"] = workflow.get("name") or "Generated Workflow"
    if "summary" not in workflow or not isinstance(workflow["summary"], str):
        workflow["summary"] = workflow.get("summary") or "AI-generated workflow"
    
    # Validate and fix nodes
    for i, node in enumerate(workflow["nodes"]):
        if not isinstance(node, dict):
            workflow["nodes"][i] = {"id": f"node_{i+1}", "type": "noop", "position": {"x": 250 + i*300, "y": 100}, "config": {}}
            continue
        
        if "id" not in node:
            node["id"] = f"node_{i+1}"
        if "type" not in node:
            node["type"] = "noop"
        if "position" not in node:
            node["position"] = {"x": 250 + i*300, "y": 100}
        if "config" not in node:
            node["config"] = {}
    
    # Validate edges
    for i, edge in enumerate(workflow["edges"]):
        if not isinstance(edge, dict):
            raise ValueError(f"Invalid edge at index {i}: must be an object")
        if "id" not in edge:
            edge["id"] = f"edge_{i+1}"
        if "source" not in edge or "target" not in edge:
            raise ValueError(f"Invalid edge at index {i}: missing source or target")
    
    # Validate JSON is complete
    json_str = json.dumps(workflow)
    json.loads(json_str)  # Throws if invalid
    
    return workflow

# ============================================
# Workflow Generation Logic
# ============================================

async def generate_workflow(job_id: str, request: WorkflowRequest):
    """Generate workflow using Ollama"""
    start_time = time.time()
    observability = {
        "model_load_time_ms": 0,
        "inference_time_ms": 0,
        "total_time_ms": 0,
        "input_tokens": 0,
        "output_tokens": 0,
    }
    
    try:
        await update_job_status(job_id, "processing", progress=0, phase="analyze")
        await add_progress_log(job_id, "Starting workflow generation", progress=0, phase="analyze")
        
        # Phase 1: Analyze (using mistral:7b)
        await add_progress_log(job_id, "Analyzing requirements...", progress=10, phase="analyze")
        analysis_prompt = f"""Analyze this workflow request and provide a JSON summary:
        
User Prompt: {request.prompt}
Mode: {request.mode}

Return JSON with: summary, requirements (array), triggerType, requiredNodes (array), dataFlow, outputAction."""

        analysis_messages = [
            {"role": "system", "content": "You are a workflow analysis assistant. Return only valid JSON."},
            {"role": "user", "content": analysis_prompt}
        ]
        
        analysis_start = time.time()
        analysis_response = await call_ollama_chat(
            model="mistral:7b",
            messages=analysis_messages,
            temperature=0.7,
            max_tokens=1024,  # Reduced for analyze phase
            stream=False
        )
        analysis_time = (time.time() - analysis_start) * 1000
        observability["model_load_time_ms"] = int(analysis_time * 0.2)  # Estimate
        observability["inference_time_ms"] = int(analysis_time * 0.8)
        
        analysis_content = analysis_response.get("message", {}).get("content", "") or analysis_response.get("response", "")
        
        # Extract JSON from analysis
        try:
            if "```json" in analysis_content:
                analysis_content = analysis_content.split("```json")[1].split("```")[0].strip()
            elif "```" in analysis_content:
                analysis_content = analysis_content.split("```")[1].split("```")[0].strip()
            analysis_result = json.loads(analysis_content)
        except:
            analysis_result = {"summary": "Analysis completed", "requirements": []}
        
        await add_progress_log(job_id, "Analysis complete", progress=30, phase="workflow_generation")
        
        # Phase 2: Generate workflow (using qwen2.5:7b)
        await add_progress_log(job_id, "Generating workflow structure...", progress=40, phase="workflow_generation")
        
        generation_prompt = f"""Generate a complete workflow JSON based on this analysis:

Analysis: {json.dumps(analysis_result, indent=2)}

User Request: {request.prompt}
Mode: {request.mode}

Return ONLY valid JSON with this structure:
{{
  "name": "Workflow name",
  "summary": "Brief description",
  "nodes": [{{"id": "...", "type": "...", "position": {{"x": 0, "y": 0}}, "config": {{}}}}],
  "edges": [{{"id": "...", "source": "...", "target": "..."}}]
}}

Return ONLY JSON, no markdown, no explanations."""

        generation_messages = [
            {"role": "system", "content": "You are a workflow generation expert. Return ONLY valid JSON, no markdown."},
            {"role": "user", "content": generation_prompt}
        ]
        
        generation_start = time.time()
        generation_response = await call_ollama_chat(
            model="qwen2.5:7b",
            messages=generation_messages,
            temperature=0.7,
            max_tokens=4096,
            stream=True  # Use streaming for long responses
        )
        generation_time = (time.time() - generation_start) * 1000
        
        generation_content = generation_response.get("message", {}).get("content", "") or generation_response.get("response", "")
        
        # Extract and validate JSON
        try:
            if "```json" in generation_content:
                generation_content = generation_content.split("```json")[1].split("```")[0].strip()
            elif "```" in generation_content:
                generation_content = generation_content.split("```")[1].split("```")[0].strip()
            
            workflow = json.loads(generation_content)
        except json.JSONDecodeError as e:
            # Try to extract JSON from partial response
            logger.warning(f"JSON parse error, attempting recovery: {e}")
            # Find first { and last }
            start_idx = generation_content.find("{")
            end_idx = generation_content.rfind("}")
            if start_idx >= 0 and end_idx > start_idx:
                workflow = json.loads(generation_content[start_idx:end_idx+1])
            else:
                raise ValueError(f"Could not extract valid JSON from response: {e}")
        
        # Ensure complete JSON structure
        workflow = ensure_complete_workflow_json(workflow)
        
        total_time = (time.time() - start_time) * 1000
        observability["total_time_ms"] = int(total_time)
        observability["output_tokens"] = len(generation_content.split())  # Rough estimate
        
        await add_progress_log(job_id, "Workflow generation complete", progress=90, phase="validation")
        
        # Phase 3: Validation
        await add_progress_log(job_id, "Validating workflow...", progress=95, phase="validation")
        
        # Final validation
        json.dumps(workflow)  # Ensure it's serializable
        
        await update_job_status(
            job_id,
            "completed",
            progress=100,
            phase="validation",
            workflow_result=workflow,
            observability=observability
        )
        
        logger.info(f"Job {job_id} completed successfully in {total_time:.2f}ms")
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Job {job_id} failed: {error_msg}", exc_info=True)
        
        await update_job_status(
            job_id,
            "failed",
            error_message=error_msg,
            observability=observability
        )

# ============================================
# API Endpoints
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "worker_id": WORKER_ID,
        "ollama_url": OLLAMA_LOCAL_URL,
        "redis_available": redis_client is not None
    }

@app.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str) -> JobStatus:
    """Get job status (for polling)"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase client not initialized")
    
    try:
        result = supabase.table("workflow_generation_jobs").select("*").eq("id", job_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = result.data[0]
        return JobStatus(**job)
    except Exception as e:
        logger.error(f"Failed to get job status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/jobs/{job_id}/process")
async def process_job(job_id: str, background_tasks: BackgroundTasks):
    """Process a job (called by backend or scheduler)"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase client not initialized")
    
    try:
        # Get job from database
        result = supabase.table("workflow_generation_jobs").select("*").eq("id", job_id).eq("status", "pending").execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found or already processed")
        
        job = result.data[0]
        
        # Mark as processing
        await update_job_status(job_id, "processing", phase="analyze")
        
        # Create request object
        request = WorkflowRequest(
            prompt=job["prompt"],
            mode=job["mode"],
            current_workflow=job.get("current_workflow"),
            execution_history=job.get("execution_history", []),
            config=job.get("config", {})
        )
        
        # Process in background
        background_tasks.add_task(generate_workflow, job_id, request)
        
        return {"status": "processing", "job_id": job_id, "worker_id": WORKER_ID}
    
    except Exception as e:
        logger.error(f"Failed to process job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/jobs/poll")
async def poll_pending_jobs():
    """Poll for pending jobs and process them"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase client not initialized")
    
    try:
        # Get oldest pending job
        result = supabase.table("workflow_generation_jobs")\
            .select("*")\
            .eq("status", "pending")\
            .order("created_at", desc=False)\
            .limit(1)\
            .execute()
        
        if not result.data:
            return {"status": "no_jobs", "count": 0}
        
        job = result.data[0]
        job_id = job["id"]
        
        # Process job
        request = WorkflowRequest(
            prompt=job["prompt"],
            mode=job["mode"],
            current_workflow=job.get("current_workflow"),
            execution_history=job.get("execution_history", []),
            config=job.get("config", {})
        )
        
        # Process synchronously (or use background task)
        await generate_workflow(job_id, request)
        
        return {"status": "processed", "job_id": job_id}
    
    except Exception as e:
        logger.error(f"Failed to poll jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Background Worker
# ============================================

async def worker_loop():
    """Background worker that polls for jobs"""
    logger.info(f"Worker {WORKER_ID} started, polling for jobs...")
    
    while True:
        try:
            if not supabase:
                await asyncio.sleep(5)
                continue
            
            # Get pending job
            result = supabase.table("workflow_generation_jobs")\
                .select("*")\
                .eq("status", "pending")\
                .order("created_at", desc=False)\
                .limit(1)\
                .execute()
            
            if result.data:
                job = result.data[0]
                job_id = job["id"]
                
                logger.info(f"Processing job {job_id}")
                
                request = WorkflowRequest(
                    prompt=job["prompt"],
                    mode=job["mode"],
                    current_workflow=job.get("current_workflow"),
                    execution_history=job.get("execution_history", []),
                    config=job.get("config", {})
                )
                
                await generate_workflow(job_id, request)
            else:
                # No jobs, wait a bit
                await asyncio.sleep(2)
        
        except Exception as e:
            logger.error(f"Worker loop error: {e}", exc_info=True)
            await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    """Start background worker on startup"""
    asyncio.create_task(worker_loop())
    logger.info("Background worker started")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
