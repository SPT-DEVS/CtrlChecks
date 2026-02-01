# Email Sequence Sender Node — User Guide

## 1. Node Overview

The Email Sequence Sender node automatically sends a series of emails (drip campaigns, follow‑ups, onboarding sequences) to a recipient based on delays between steps.

### What Problems It Solves
- Automates follow‑up email sequences
- Supports onboarding and nurture campaigns
- Reduces manual outreach

### Common Real‑World Use Cases
- Lead nurturing
- Customer onboarding
- Automated reminders
- Marketing campaigns

---

## 2. Prerequisites

Before using the node:
- Email sending is configured in your environment
- You have permission to send emails from the configured account

---

## 3. Input Fields – Detailed Explanation (Core Section)

The Email Sequence Sender node has four inputs.

### 3.1 Recipient (JSON)
**Description:** Recipient object with email and optional name.  
**Required:** Yes  

**Example**
```
{"email": "user@example.com", "name": "John Doe"}
```

---

### 3.2 Sequence Steps (JSON Array)
**Description:** List of email steps with subject, body, delay, and optional condition.  
**Required:** Yes  

**Example**
```
[
  {"step": 1, "subject": "Welcome", "body": "Hello!", "delayAfter": 0},
  {"step": 2, "subject": "Getting Started", "body": "Here are tips...", "delayAfter": 86400}
]
```

**Notes**
- `delayAfter` is in seconds  
- Each step sends after the delay from the previous step  

---

### 3.3 Stop on Reply
**Description:** Stops the sequence if the recipient replies.  
**Required:** Optional  
**Default:** false  

---

### 3.4 Tracking Settings (JSON)
**Description:** Enable open and click tracking.  
**Required:** Optional  

**Example**
```
{"openTracking": true, "clickTracking": true}
```

---

## 4. Example Configurations

### Example 1: Simple 2‑Step Welcome Sequence
**Recipient**
```
{"email": "user@example.com", "name": "John"}
```

**Sequence**
```
[
  {"step": 1, "subject": "Welcome", "body": "Hello John!", "delayAfter": 0},
  {"step": 2, "subject": "Getting Started Tips", "body": "Here are 5 tips...", "delayAfter": 172800}
]
```

---

## 5. Output Fields

The Email Sequence Sender node returns:
- Sequence ID
- Sent count
- Status

---

## 6. Common Errors & Fixes

### Authentication Failed
**Cause:** Email credentials not configured  
**Fix:** Verify SMTP or email provider settings

### Invalid Recipient
**Cause:** Wrong email format  
**Fix:** Validate email address before sending

---

## 7. Best Practices

- Keep sequences short (3–7 steps)
- Use clear subject lines
- Add delays to avoid spam filters
- Stop on reply for engagement‑based flows
