# Respond to Webhook Node — User Guide

## 1. Node Overview

### What Is the Respond to Webhook Node?
The Respond to Webhook node sends a response back to the system or application that triggered a webhook. It is used to confirm receipt, return success or error messages, and send structured responses (JSON).

This node does **not** trigger webhooks — it replies to an already‑received webhook request.

### What Problems It Solves
- Prevents webhook timeouts
- Confirms successful processing
- Returns data to external systems
- Enables two‑way communication via webhooks

### Common Real‑World Use Cases
- Responding to form submissions
- Acknowledging payment events
- Returning AI‑generated responses
- Sending validation results
- Webhook‑based approvals

---

## 2. Prerequisites

Before using this node, make sure you have:
- A **Webhook** trigger earlier in the workflow
- An external system that expects a response
- Knowledge of the required response format (usually JSON)

Important: This node must be used only after a Webhook trigger.

---

## 3. Input Fields – Detailed Explanation (All Fields)

The Respond to Webhook node has three fields.

### 3.1 Status Code
**Description:** HTTP status code returned to the caller.  
**Required:** Yes  
**Default:** `200`

**Common Values**
- 200 – Success  
- 201 – Created  
- 400 – Bad request  
- 401 – Unauthorized  
- 404 – Not found  
- 500 – Server error  

**How to choose**
- Use 200 for successful processing
- Use 400+ when validation fails or errors occur

---

### 3.2 Response Body (JSON)
**Description:** Response content returned to the webhook caller.  
**Required:** Optional  
**Format:** JSON  

**Example**
```
{
  "status": "success",
  "message": "Order processed"
}
```

**Tip:** Use template variables like `{{input}}` to include workflow data.

---

### 3.3 Custom Headers (JSON)
**Description:** Optional response headers.  
**Required:** Optional  
**Format:** Key–value pairs in JSON  

**Example**
```
{
  "Content-Type": "application/json",
  "Cache-Control": "no-cache"
}
```

---

## 4. Example Configurations

### Example 1: Simple Acknowledgment
**Inputs**
- Status Code: 200  
- Response Body:
```
{"message": "OK"}
```

**Result**
- External system receives `OK`

---

### Example 2: JSON API Response
**Inputs**
- Status Code: 200  
- Response Body:
```
{
  "success": true,
  "id": "{{workflow.executionId}}"
}
```

**Result**
- Caller receives structured JSON response

---

## 5. Output Explanation

The Respond to Webhook node returns:
- Status code
- Response body
- Response headers
- Execution status

---

## 6. Common Errors & Fixes

### No Response
**Cause:** Node not connected after Webhook trigger  
**Fix:** Place Respond to Webhook directly after a Webhook trigger path

### Invalid JSON
**Cause:** Syntax error in response body  
**Fix:** Validate JSON before submitting

### Timeout
**Cause:** Long processing before response  
**Fix:** Keep response lightweight or respond earlier in the flow

---

## 7. Best Practices

- Always send a response to avoid timeouts
- Keep response payload small
- Match expected content type
- Use JSON for APIs
- Log errors internally, not in responses
