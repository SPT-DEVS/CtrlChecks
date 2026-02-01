# Slack Incoming Webhook Node — User Guide

## 1. Node Overview

The Slack Incoming Webhook node sends messages into a Slack channel using a secure webhook URL generated from Slack. This node is one‑way only: you can send messages to Slack, but you cannot read messages or fetch data.

### What Problems It Solves
- Sends notifications to Slack automatically
- Replaces manual status updates
- Integrates workflows with Slack channels

### Common Real‑World Use Cases
- Post deployment or build alerts
- Send workflow completion updates
- Notify teams about errors or incidents

---

## 2. Input Fields – Complete List

This node has **two** inputs: Webhook URL and Text. Advanced Slack options (attachments, blocks, threads, mentions, etc.) are not available in this node.

### 2.1 Webhook URL
**Description:** The unique Slack URL where messages are delivered.  
**Required:** Yes  
**Format:** HTTPS URL  

**Example**
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXX
```

**How to get this value**
1. Open Slack  
2. Go to Settings & administration → Manage apps  
3. Search **Incoming WebHooks**  
4. Click **Add to Slack**  
5. Select a channel  
6. Copy the generated Webhook URL  

---

### 2.2 Text
**Description:** The main message sent to Slack.  
**Required:** Yes  
**Format:** Plain text or Slack markdown  

**Example**
```
New user registered successfully 🎉
```

**How to use**
- Write any message text
- Include line breaks and emojis
- Use dynamic variables like `{{input.field}}`

---

## 3. Example Configuration

**Inputs**
- Webhook URL: (your Slack webhook URL)
- Text: `✅ Workflow completed successfully`

**Result**
- Message posted to the selected Slack channel

---

## 4. Output Fields

The Slack Incoming Webhook node returns:
- Status code
- Response message

---

## 5. Common Errors & Fixes

### Webhook URL Invalid
**Cause:** Wrong or expired webhook URL  
**Fix:** Regenerate the webhook URL in Slack

### Message Not Delivered
**Cause:** Missing Text field  
**Fix:** Ensure the Text field is filled

---

## 6. Best Practices

- Keep webhook URLs private
- Use clear, short messages
- Test with a sample message before production use
