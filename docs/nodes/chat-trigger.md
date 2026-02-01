# Chat Trigger Node — User Guide

## 1. Node Overview

### What Is the Chat Trigger Node?
The Chat Trigger node is a starting node that activates a workflow when a user sends a chat message. It listens for incoming messages from a chat interface and passes the message content and related context into the workflow.

In simple terms: when a user types something in chat, this node starts the automation.

### What Problems It Solves
- Starts workflows based on user conversations
- Captures chat input automatically
- Enables conversational automation
- Removes need for manual form submissions
- Acts as an entry point for AI or chatbot workflows

### Common Real-World Use Cases
- AI chatbot conversations
- Customer support automation
- Lead qualification through chat
- FAQ bots
- Command-based workflows (e.g., “create task”, “check status”)
- Conversational data collection

---

## 2. Prerequisites

Before using the Chat Trigger node, ensure you have:
- A chat interface enabled in your application or tool
- A workflow that starts with user interaction
- Basic understanding of how chat messages flow
- Optional: session or user identification setup

Note: No API keys or external authentication required.

---

## 3. Authentication & Credentials Setup

### Does the Chat Trigger Node Require Authentication?
No. The Chat Trigger works internally and activates when a chat message is received.

### When Authentication Is Not Needed
- Internal chat systems
- Embedded chat widgets
- AI conversation workflows

### Common Misunderstandings
- Expecting API keys → Not required
- Trying to manually call the trigger → It activates automatically
- Using it mid-workflow → Must be used as a starting node

---

## 4. Input Fields – Detailed Explanation (Core Section)

Below are all common input fields in the Chat Trigger node.

### 4.1 Trigger Mode
**Description:** Determines how the chat trigger activates.  
**Required:** Yes  

**Common Values**
- On Message Received
- On First Message
- On New Conversation
- On Every Message

**Example Value:** `On Message Received`

**How to choose:** Use **On Message Received** for general chat workflows. Use **On First Message** if you only want to start once per session.

---

### 4.2 Allowed Message Types
**Description:** Filters which chat messages trigger the workflow.  
**Required:** Optional  

**Common Values**
- Text
- Image
- File
- Voice
- All

**Example Value:** `Text`

**Tip:** Choose **All** if you want every kind of message to trigger the workflow.

---

### 4.3 Message Content
**Description:** The actual text sent by the user.  
**Required:** Automatically captured  
**Example Value:** `I want to track my order`

**How to use it:** Pass this value into AI or logic nodes to understand intent, extract data, or respond.

---

### 4.4 User ID / Sender ID
**Description:** Unique identifier of the chat user.  
**Required:** Automatically captured  
**Example Value:** `user_839204`

**How to get this value**
- Automatically provided by the chat system
- Can be used for user-specific logic (e.g., check account status)

---

### 4.5 Session ID / Conversation ID
**Description:** Identifies a unique chat session.  
**Required:** Automatically captured  
**Example Value:** `session_20260201_001`

**Why it matters:** Use it to keep multi-step conversations organized.

---

### 4.6 Username / Display Name
**Description:** Name shown for the user in chat.  
**Required:** Optional  
**Example Value:** `Sai Kiran`

---

### 4.7 Channel / Chat Source
**Description:** Identifies where the message came from.  
**Required:** Optional  

**Example Values**
- Web Chat
- Mobile App
- Internal Chat
- Support Widget

---

### 4.8 Message Timestamp
**Description:** Date and time when the message was sent.  
**Required:** Auto-generated  
**Example Value:** `2026-02-01T10:45:32Z`

---

### 4.9 Language (Optional)
**Description:** Detected or specified language of the message.  
**Required:** Optional  

**Example Values**
- English
- Hindi
- Spanish

**Tip:** Use this to route messages or select the right response language.

---

### 4.10 Message Metadata
**Description:** Additional information related to the message.  
**Required:** Optional  

**Example Value**
```
{
  "browser": "Chrome",
  "device": "Mobile",
  "os": "Android"
}
```

---

### 4.11 Variables / Context Fields
**Description:** Stores extracted or remembered values from chat.  
**Required:** Optional  

**Example Values**
- user_intent
- order_id
- previous_question

**Tip:** Use these fields to maintain context across multiple messages.

---

### 4.12 Trigger Conditions (Optional)
**Description:** Conditions to decide whether the workflow should start.  
**Required:** Optional  

**Example Conditions**
- Message contains “order”
- Message starts with “/help”
- Message length > 5

---

### 4.13 Allow Multiple Triggers
**Description:** Whether the same user can trigger repeatedly.  
**Required:** Optional  

**Values**
- Yes
- No

---

### 4.14 Rate Limiting (Optional)
**Description:** Limits how often chat can trigger workflows.  
**Required:** Optional  
**Example Value:** `1 trigger per 5 seconds`

---

## 5. Example Configurations

### Simple Example – Start Workflow on Any Message
**Inputs**
- Trigger Mode: On Message Received
- Allowed Message Type: Text

**What Happens**
- Any chat message starts the workflow
- Message text becomes available to next nodes

---

### Advanced Example – Command-Based Trigger
**Inputs**
- Trigger Mode: On Message Received
- Trigger Condition: Message starts with `/status`

**User Message**
`/status order123`

**Output**
- Workflow starts
- Command and order ID extracted

---

## 6. Output Explanation

The Chat Trigger node outputs structured data including:
- Message text
- User ID
- Session ID
- Timestamp
- Chat source
- Metadata
- Extracted variables

This data is passed to the next node in the workflow.

---

## 7. Common Errors & Fixes

### Workflow Not Triggering
**Cause:** Trigger condition too strict  
**Fix:** Relax or remove conditions

### Trigger Fires Too Often
**Cause:** No rate limit  
**Fix:** Enable rate limiting

### Wrong Message Type
**Cause:** Message type filter mismatch  
**Fix:** Allow correct message types

### Context Missing
**Cause:** Variables not stored  
**Fix:** Enable variable extraction

---

## 8. Best Practices

- Always use Chat Trigger as the first node
- Keep trigger conditions simple
- Store session ID for multi-step conversations
- Use rate limits to prevent spam
- Log chat inputs for debugging
- Handle empty or short messages gracefully
- Design clear conversational flows
- Combine with AI or logic nodes for best results
