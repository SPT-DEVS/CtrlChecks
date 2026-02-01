# Email Node — User Guide

## 1. Node Overview

The Email node sends emails automatically from your workflow. It is used for notifications, alerts, reports, and confirmations.

### What Problems It Solves
- Sends automated email notifications
- Reduces manual communication
- Delivers reports and updates

### Common Real‑World Use Cases
- Send order confirmations
- Notify teams of failures
- Deliver scheduled reports

---

## 2. Prerequisites

Before using the Email node, ensure:
- Email sending is configured in your environment (SMTP or email service)
- You have permission to send from the configured account

Note: SMTP credentials are usually configured in the system settings, not in the node itself.

---

## 3. Input Fields – Detailed Explanation (Core Section)

The Email node has four inputs.

### 3.1 To
**Description:** Recipient email address.  
**Required:** Yes  
**Example:** `user@example.com`

You can pass a dynamic value: `{{input.email}}`

---

### 3.2 Subject
**Description:** Email subject line.  
**Required:** Yes  
**Example:** `Your Order Has Been Shipped`

---

### 3.3 Text
**Description:** Plain‑text body of the email.  
**Required:** Yes  
**Example:** `Hello, your order is on the way!`

---

### 3.4 HTML (Optional)
**Description:** Rich‑text HTML body.  
**Required:** Optional  

**Example**
```
<h1>Hello</h1><p>Your order is on the way!</p>
```

Tip: Use either Text, HTML, or both.

---

## 4. Example Configuration

**Inputs**
- To: `customer@example.com`  
- Subject: `Order Confirmation`  
- Text: `Thanks for your purchase!`  

**Result**
- Email sent to the recipient

---

## 5. Output Fields

The Email node returns:
- Status (success / failure)
- Message ID (if available)
- Error details (if any)

---

## 6. Common Errors & Fixes

### Authentication Failed
**Cause:** SMTP credentials not configured or invalid  
**Fix:** Verify SMTP settings in your environment

### Invalid Recipient
**Cause:** Incorrect email address format  
**Fix:** Validate recipient address before sending

---

## 7. Best Practices

- Validate email addresses before sending
- Keep subjects clear and short
- Use HTML for rich formatting when needed
- Handle errors and retries in your workflow
