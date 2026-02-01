# HTTP POST Node — User Guide

## 1. Node Overview

### What Is the HTTP POST Node?
The HTTP POST node sends data to an external server or API using the HTTP POST method. POST requests are commonly used to create data, submit forms, send payloads, or trigger actions on another system.

### What Problems It Solves
- Allows integration with any external API
- Sends structured data to servers
- Automates form submissions
- Pushes data to third‑party tools
- Enables webhook-based workflows

### Common Real-World Use Cases
- Send form data to a backend server
- Push data to a webhook URL
- Create records in external systems
- Send AI-generated data to APIs
- Trigger workflows in other tools
- Post events, logs, or notifications

---

## 2. Prerequisites

Before using the HTTP POST node, ensure:
- You have the API endpoint URL
- The API supports POST requests
- You know what data the API expects
- You have authentication details (if required)

---

## 3. Authentication & Credentials Setup

### Authentication Support
Authentication is handled via headers in this node. Common approaches:
- API Key
- Bearer Token
- Basic Authentication
- Custom headers

**Example Authorization Header**
```
Authorization: Bearer YOUR_API_TOKEN
```

**Example API Key Header**
```
x-api-key: abc123xyz
```

### Common Authentication Mistakes
- Forgetting the word `Bearer` before the token
- Sending the token in the wrong header
- Using expired or invalid keys

---

## 4. Input Fields – Detailed Explanation (Core Section)

The HTTP POST node has three inputs.

### 4.1 URL
**Description:** The API endpoint where the POST request is sent.  
**Required:** Yes  
**Example:** `https://api.example.com/create-user`

**How to get this value**
- Provided in the API documentation
- Often labeled as “Endpoint” or “URL”

---

### 4.2 Headers (JSON)
**Description:** Key-value pairs sent with the request (authentication, content type, etc.).  
**Required:** Optional  

**Common Headers**
```
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_TOKEN"
}
```

**How to get this value**
- Refer to API documentation
- Look for “Headers” or “Authentication”

---

### 4.3 Body Template
**Description:** The request body you want to send. Supports template variables.  
**Required:** Yes (most cases)

**Example (JSON)**
```
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Tip:** Use `{{input}}` or `{{input.field}}` to insert values from previous steps.

---

## 5. Example Configurations

### Example 1: Send JSON Data to API
**Inputs**
- URL: `https://api.example.com/users`
- Headers:
```
{
  "Content-Type": "application/json"
}
```
- Body Template:
```
{
  "name": "Alice",
  "role": "Admin"
}
```

**Result**
- User created in external system

---

### Example 2: Submit Form Data
**Inputs**
- URL: `https://api.example.com/login`
- Headers:
```
{
  "Content-Type": "application/x-www-form-urlencoded"
}
```
- Body Template:
```
username=johndoe&password=secret
```

**Result**
- Login request processed

---

### Example 3: Webhook Trigger
**Inputs**
- URL: Webhook URL
- Headers:
```
{
  "Content-Type": "application/json"
}
```
- Body Template:
```
{
  "event": "workflow_complete",
  "data": {{input}}
}
```

**Result**
- External system triggered

---

## 6. Output Explanation

The HTTP POST node returns:
- HTTP status code (200, 201, 400, etc.)
- Response body (JSON or text)
- Response headers
- Execution time
- Success or failure status

---

## 7. Common Errors & Fixes

### 400 Bad Request
**Cause:** Invalid body format  
**Fix:** Match API-required structure

### 401 Unauthorized
**Cause:** Missing or invalid authentication  
**Fix:** Verify headers and token

### 404 Not Found
**Cause:** Incorrect URL  
**Fix:** Verify endpoint path

### 500 Server Error
**Cause:** API-side issue  
**Fix:** Retry or contact API provider

---

## 8. Best Practices

- Always read API documentation carefully
- Use correct Content-Type headers
- Never expose API keys publicly
- Validate payload before sending
- Handle errors gracefully
- Log responses for debugging
