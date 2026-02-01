# Discord Webhook Node — User Guide

## 1. Node Overview

### What Is the Discord Webhook Node?
The Discord Webhook node sends a message to a Discord channel using a webhook URL. It’s the simplest way to post notifications or updates into Discord from a workflow.

### What Problems It Solves
- Sends automated alerts to Discord
- Posts updates from workflows or systems
- Reduces manual status messages

### Common Real‑World Use Cases
- Post workflow completion alerts
- Send error notifications
- Announce deployments
- Forward form submissions to a channel

---

## 2. Prerequisites

Before using the Discord Webhook node, ensure:
- You have a Discord server and channel
- You can create webhooks for that channel

---

## 3. Authentication & Credentials Setup

Discord webhooks use the **Webhook URL** as the credential. No API keys are required.

### How to Get a Discord Webhook URL
1. Open your Discord server  
2. Go to **Server Settings → Integrations → Webhooks**  
3. Click **New Webhook** (or choose an existing one)  
4. Select a channel and name  
5. Click **Copy Webhook URL**  

---

## 4. Input Fields – Detailed Explanation (Core Section)

The Discord Webhook node has four inputs.

### 4.1 Webhook URL
**Description:** The Discord webhook endpoint URL.  
**Required:** Yes  
**Example:** `https://discord.com/api/webhooks/...`

---

### 4.2 Message
**Description:** The message text to send.  
**Required:** Yes  

**Example**
```
✅ Workflow completed successfully!
```

**Tip:** Supports Discord markdown like **bold**, *italic*, and `code`.

---

### 4.3 Username
**Description:** Optional custom sender name for this message.  
**Required:** Optional  
**Example:** `CtrlChecks Bot`

---

### 4.4 Avatar URL
**Description:** Optional avatar image URL for this message.  
**Required:** Optional  
**Example:** `https://example.com/avatar.png`

---

## 5. Example Configurations

### Example 1: Basic Alert
**Inputs**
- Webhook URL: (your Discord webhook)
- Message: `✅ Workflow completed`

**Result**
- Message posted to the channel

---

### Example 2: Custom Bot Name + Avatar
**Inputs**
- Webhook URL: (your Discord webhook)
- Message: `🚀 Deployment finished`
- Username: `Deploy Bot`
- Avatar URL: `https://example.com/deploy.png`

**Result**
- Message posted with custom name and avatar

---

## 6. Output Explanation

The Discord Webhook node returns:
- Response status (success / failure)
- Message metadata (if available)

---

## 7. Common Errors & Fixes

### Webhook URL Invalid
**Cause:** Wrong or expired webhook URL  
**Fix:** Regenerate the webhook URL in Discord

### Message Not Delivered
**Cause:** Missing required message field  
**Fix:** Ensure the Message field is filled

---

## 8. Best Practices

- Keep webhook URLs private
- Use a dedicated channel for automation
- Keep messages short and clear
- Add emojis for quick scanning
