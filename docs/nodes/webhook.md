# Webhook Node — User Guide

## 1. Node Overview

### What Is the Webhook Node?
The Webhook node starts a workflow when an external system sends an HTTP request to your unique webhook URL. It’s the easiest way to connect outside tools to your automation without writing code.

In simple terms: send a request to the webhook URL and your workflow begins.

### What Problems It Solves
- Starts workflows from external systems
- Captures incoming data automatically
- Eliminates manual triggers
- Enables real‑time integrations

### Common Real‑World Use Cases
- Receive events from apps (orders, signups, alerts)
- Trigger workflows from monitoring tools
- Connect third‑party services via webhooks
- Build custom integrations

---

## 2. Prerequisites

Before using the Webhook node, ensure:
- The workflow is saved
- You can access the webhook URL
- The sender can make HTTP requests to that URL

---

## 3. Authentication & Credentials Setup

### Authentication Support
The current Webhook node does not include built‑in authentication fields. If you need authentication, use one of these approaches:
- Add a secret token in the request body and validate it in a later node
- Restrict access on the sender side (recommended)
- Use HTTPS only (default for production endpoints)

---

## 4. Input Fields – Detailed Explanation (Core Section)

The Webhook node has one configurable field in the node panel, plus webhook settings for enabling the URL.

### 4.1 HTTP Method
**Description:** Method used to receive incoming requests.  
**Required:** Yes  
**Supported Values:** GET, POST, PUT  

**Tip:** Use **POST** for most webhook integrations.

---

### 4.2 Webhook URL (Auto‑Generated)
**Description:** The endpoint URL that external systems call.  
**Required:** Auto‑generated  

**How to get this value**
- Open the **Webhook** settings dialog
- Enable the webhook
- Copy the generated URL

**Note:** The workflow must be saved and active for the URL to work.

---

## 5. Example Configurations

### Example 1: Standard POST Webhook
**Inputs**
- HTTP Method: POST

**Result**
- Any POST request to the URL triggers the workflow

---

## 6. Output Explanation

The Webhook node outputs structured request data, typically including:
- HTTP method
- Request headers
- Query parameters
- Body payload (parsed JSON when possible)

This data becomes the input for the next node.

---

## 7. Common Errors & Fixes

### Webhook Not Triggering
**Cause:** Workflow not saved or webhook not enabled  
**Fix:** Save the workflow and enable the webhook URL

### Wrong HTTP Method
**Cause:** Sender used GET but webhook expects POST  
**Fix:** Match the sender’s method to the node’s method

---

## 8. Best Practices

- Use POST for most integrations
- Keep webhook URLs private
- Validate inputs before using them
- Log incoming payloads during testing
- Use HTTPS endpoints only for production
