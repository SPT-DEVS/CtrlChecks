# Docker Node — User Guide

## 1. Node Overview

### What Is the Docker Node?
The Docker node allows your workflow to interact with Docker containers and images programmatically. It lets you automate tasks such as running containers, stopping containers, pulling images, and managing the container lifecycle without manually typing Docker commands in a terminal.

### What Problems It Solves
- Eliminates manual Docker command execution
- Automates container management
- Simplifies DevOps workflows
- Helps run background services automatically
- Ensures consistent environments

### Common Real-World Use Cases
- Start a container when a workflow runs
- Stop or remove containers automatically
- Pull latest images from Docker Hub
- Run batch jobs inside containers
- Execute scripts inside running containers
- Manage test or staging environments

---

## 2. Prerequisites

Before using the Docker node, ensure:
- Docker is installed on the machine/server
- Docker daemon is running
- You have permission to access Docker
- Docker socket or API is accessible

---

## 3. Authentication & Credentials Setup

### Authentication Method
The Docker node typically uses local Docker access via:
- Docker Socket
- Docker Host URL (Remote Docker)

### Supported Connection Types
**Local Docker (Recommended)**
- Uses local Docker daemon
- No API key required

**Remote Docker Host**
- Connects to Docker over TCP
- Requires Docker API access

### Required Credential Fields
**Docker Host**
- Address of Docker daemon  
**Example:**  
`unix:///var/run/docker.sock`  
or  
`tcp://localhost:2375`

**TLS Configuration (Optional)**
- Used when connecting to remote Docker securely.

### Common Authentication Mistakes
- Docker daemon not running
- Incorrect socket path
- Docker permissions denied
- TLS misconfiguration

---

## 4. Input Fields – Detailed Explanation (Core Section)

Below are all input fields commonly available in the Docker node.

### 4.1 Docker Host
**Description:** Address of Docker daemon.  
**Required:** Yes  
**Example:** `localhost` or `unix:///var/run/docker.sock`

---

### 4.2 Port
**Description:** Docker API port for TCP connections.  
**Required:** Optional  
**Example:** `2375` (TCP), `2376` (TLS)

---

### 4.3 Operation / Action
**Description:** Action to perform.  
**Required:** Yes  

**Common Operations**
- List Containers
- List Images
- Build Image
- Tag Image
- Push Image
- Pull Image
- Remove Image
- Start Container
- Stop Container
- Get Container Logs
- Inspect Container

---

### 4.4 Container ID / Name
**Description:** Unique ID or name of an existing container.  
**Required:** Required for container actions (start/stop/logs/inspect)  
**Example:** `f3a1c9b8e123` or `web-server`

**How to get this value**
- Run `docker ps`
- Copy the container ID or name
- Or view container details in Docker UI

---

### 4.5 Image Name
**Description:** Docker image to use.  
**Required:** Required for pull/build/tag/remove  
**Example:** `nginx:latest`

**How to get this value**
- Go to Docker Hub
- Search for the image
- Copy the image name and tag

---

### 4.6 Dockerfile Path
**Description:** Path to Dockerfile for build operations.  
**Required:** Required for Build Image  
**Example:** `./Dockerfile`

---

### 4.7 Build Context
**Description:** Folder used as build context.  
**Required:** Required for Build Image  
**Example:** `.`

---

### 4.8 Tag
**Description:** Image tag used for tag/push/pull operations.  
**Required:** Required for Tag / Push / Pull  
**Example:** `myimage:v1.0.0`

---

### 4.9 Source Tag
**Description:** Source image tag used when tagging another image.  
**Required:** Required for Tag Image  
**Example:** `myimage:latest`

---

### 4.10 Registry
**Description:** Container registry URL.  
**Required:** Optional  
**Example:** `docker.io` or `registry.example.com`

---

### 4.11 Registry Username
**Description:** Username for registry authentication.  
**Required:** Optional  

---

### 4.12 Registry Password
**Description:** Password/token for registry authentication.  
**Required:** Optional  

---

## 5. Example Configurations

### Example 1: List Containers
**Inputs**
- Operation: List Containers
- Docker Host: localhost
- Port: 2375

**Result**
- List of running containers

---

### Example 2: Stop a Container
**Inputs**
- Operation: Stop Container
- Container ID: f3a1c9b8e123

**Result**
- Container stopped successfully

---

### Example 3: Pull Docker Image
**Inputs**
- Operation: Pull Image
- Image Name: node:18

**Result**
- Image downloaded locally

---

## 6. Output Explanation

The Docker node returns:
- Container ID
- Container name
- Image name
- Container status (running/stopped)
- Execution logs (if applicable)
- Success or failure status

---

## 7. Common Errors & Fixes

### Docker Daemon Not Running
**Cause:** Docker service stopped  
**Fix:** Start Docker service

### Permission Denied
**Cause:** User lacks Docker access  
**Fix:** Add user to Docker group

### Image Not Found
**Cause:** Incorrect image name or tag  
**Fix:** Verify image on Docker Hub

### Port Already in Use
**Cause:** Port conflict on host  
**Fix:** Use a different host port

---

## 8. Best Practices

- Use official Docker images when possible
- Keep containers lightweight
- Use environment variables for secrets
- Avoid running containers as root
- Clean unused containers and images
- Monitor resource usage
- Use restart policies wisely

---

## Final Summary

The Docker node allows you to automate container and image management, enabling reliable, repeatable, and scalable workflows. This guide covers all input fields, authentication, examples, errors, and best practices in a clear, non-technical format.
