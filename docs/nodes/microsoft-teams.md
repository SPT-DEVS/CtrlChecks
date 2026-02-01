# Microsoft Teams Node — User Guide

## 1. Node Overview

The Microsoft Teams node sends a message to a Teams channel using an **Incoming Webhook URL**. This node is for notifications only; it does not create channels, add members, or read messages.

### What Problems It Solves
- Sends workflow notifications to Teams
- Posts updates to channels automatically
- Reduces manual status updates

### Common Real‑World Use Cases
- Notify teams when a workflow completes
- Send alerts for errors or incidents
- Post deployment status updates

---

## 2. Prerequisites

Before using the Teams node, ensure:
- You have access to a Teams workspace
- You can create an Incoming Webhook for a channel

---

## 3. Authentication / Credentials Setup

This node uses a **Webhook URL** for authentication. No OAuth or bot tokens are required.

### How to Get an Incoming Webhook URL
1. Open Microsoft Teams  
2. Go to the target channel  
3. Click **Connectors** (or **Workflows/Apps**, depending on your Teams UI)  
4. Choose **Incoming Webhook**  
5. Name it and copy the Webhook URL  
6. Paste it into the node  

---

## 4. Input Fields – Detailed Explanation (Core Section)

The Microsoft Teams node has three inputs.

### 4.1 Webhook URL
**Description:** The Teams Incoming Webhook URL.  
**Required:** Yes  
**Example:** `https://outlook.office.com/webhook/...`

---

### 4.2 Title
**Description:** Title shown at the top of the message card.  
**Required:** Optional  
**Example:** `Workflow Notification`

---

### 4.3 Message
**Description:** The message content sent to Teams.  
**Required:** Yes  
**Example:** `Hello Team, task completed!`

---

## 5. Example Configuration

**Inputs**
- Webhook URL: (your Teams webhook URL)
- Title: `Workflow Notification`
- Message: `✅ Task completed successfully`

**Result**
- Message posted to the selected Teams channel

---

## 6. Output Fields

The Teams node returns:
- Status (success / failure)
- Response message (if available)

---

## 7. Common Errors & Fixes

### Webhook URL Invalid
**Cause:** Wrong or expired webhook URL  
**Fix:** Regenerate the webhook in Teams and update the node

### Message Not Delivered
**Cause:** Missing message field  
**Fix:** Ensure the Message field is filled

---

## 8. Best Practices

- Use webhooks for simple notifications
- Keep messages short and clear
- Test with a sample message before production use
