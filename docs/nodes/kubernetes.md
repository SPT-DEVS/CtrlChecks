# Kubernetes Node — User Guide

## 1. Node Overview

### What Is the Kubernetes Node?
The Kubernetes node allows your workflow to interact with a Kubernetes cluster to manage workloads, services, configurations, and resources. Instead of running `kubectl` commands manually, this node lets your automation control Kubernetes resources programmatically.

### What Problems It Solves
- Eliminates manual kubectl commands
- Automates deployment and scaling
- Manages clusters consistently
- Reduces configuration errors
- Enables DevOps and CI/CD automation

### Common Real-World Use Cases
- Deploy applications automatically
- Scale pods up or down
- Restart deployments
- Create or delete Kubernetes resources
- Fetch pod or service status
- Automate rollouts and rollbacks
- Monitor cluster workloads

---

## 2. Prerequisites

Before using the Kubernetes node, ensure:
- You have a Kubernetes cluster (cloud or on‑prem)
- Cluster is running and accessible
- You have a kubeconfig file
- You have required permissions (RBAC)
- Kubernetes API access is enabled

---

## 3. Authentication & Credentials Setup

### Authentication Methods
The Kubernetes node supports:
- Kubeconfig file (recommended)
- Token-based authentication
- Certificate-based authentication

### Required Credential Fields
**Kubernetes API Server URL**  
Example: `https://123.45.67.89:6443`

**Authentication Type**  
Supported values: `Kubeconfig`, `Bearer Token`, `Client Certificate`

### Option 1: Kubeconfig (Recommended)
**What is kubeconfig?**  
A configuration file that contains:
- Cluster URL
- Certificates
- User credentials
- Context details

**How to get kubeconfig**
- From cloud provider (EKS, GKE, AKS)
- From cluster admin
- Usually located at `~/.kube/config`

### Option 2: Bearer Token
**Bearer token** is used for service account authentication.

**How to get token**
- Create a ServiceAccount
- Assign required role
- Extract token from secret

### Option 3: Client Certificates
**Required fields**
- Client Certificate
- Client Key
- CA Certificate

Used for secure enterprise setups.

### Common Authentication Mistakes
- Invalid kubeconfig
- Expired token
- Missing RBAC permissions
- Incorrect API server URL

---

## 4. Input Fields – Detailed Explanation (Core Section)

Below are all common input fields used in the Kubernetes node.

### 4.1 Kubernetes API Server URL
**Description:** URL of the Kubernetes API server.  
**Required:** Yes  
**Example:** `https://123.45.67.89:6443`

---

### 4.2 Bearer Token
**Description:** Token used to authenticate to the cluster.  
**Required:** Yes

---

### 4.3 Operation / Action
**Description:** Action to perform on the selected resource.  
**Required:** Yes  

**Common Operations**
- List Pods
- Get Pod
- List Deployments
- Get Deployment
- Create Deployment
- Update Deployment
- Scale Deployment
- Restart Deployment
- List Services
- Get Service
- Get Pod Logs

---

### 4.4 Namespace
**Description:** Kubernetes namespace.  
**Required:** Yes (except cluster‑wide resources)  
**Example:** `default`

**How to get this value**
- Default namespace is usually `default`
- Or list namespaces in the Kubernetes dashboard or `kubectl`

---

### 4.5 Resource Name
**Description:** Name of the Kubernetes resource.  
**Required:** Required for Get, Update, Delete  
**Example:** `backend-api`

---

### 4.6 Deployment Manifest (JSON)
**Description:** JSON configuration for resource creation or update.  
**Required:** Required for Create / Update  

**Example**
```
{
  "apiVersion": "apps/v1",
  "kind": "Deployment",
  "metadata": {"name": "backend-api"},
  "spec": {"replicas": 2}
}
```

---

### 4.7 Replicas
**Description:** Number of pod replicas.  
**Required:** Required for Scale operation  
**Example:** `3`

---

## 5. Example Configurations

### Example 1: Deploy an Application
**Inputs**
- Operation: Create Deployment
- Namespace: default
- Deployment Manifest: JSON

**Result**
- Application deployed to Kubernetes

---

### Example 2: Scale a Deployment
**Inputs**
- Operation: Scale Deployment
- Resource Name: backend-api
- Replicas: 5

**Result**
- Deployment scaled to 5 pods

---

### Example 3: Get All Pods
**Inputs**
- Operation: List Pods
- Namespace: default

**Result**
- List of running pods

---

## 6. Output Explanation

The Kubernetes node returns:
- Resource name
- Namespace
- Resource status
- Creation timestamp
- Current replicas
- API response status (success / failure)

---

## 7. Common Errors & Fixes

### Authentication Failed
**Cause:** Invalid kubeconfig or token  
**Fix:** Verify credentials and cluster access

### Forbidden (403)
**Cause:** Missing RBAC permissions  
**Fix:** Assign correct role to user/service account

### Resource Not Found
**Cause:** Wrong name or namespace  
**Fix:** Verify resource name and namespace

### Invalid YAML
**Cause:** Incorrect manifest format  
**Fix:** Validate YAML/JSON before submitting

---

## 8. Best Practices

- Use kubeconfig whenever possible
- Grant least‑privilege RBAC permissions
- Use namespaces to isolate workloads
- Validate YAML/JSON before deployment
- Use labels consistently
- Avoid hard‑coding secrets
- Monitor cluster resource usage
