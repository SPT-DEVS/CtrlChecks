# PagerDuty Node — User Guide

## 1. Node Overview

### What Is the PagerDuty Node?
The PagerDuty node lets your workflow create, manage, and retrieve incidents in PagerDuty automatically. It helps teams respond faster to critical issues by automating alerts, escalations, acknowledgments, and resolutions.

### What Problems It Solves
- Eliminates manual incident creation
- Automates alerting and on-call workflows
- Ensures faster incident response
- Reduces human error during outages
- Integrates monitoring, apps, and workflows with PagerDuty

### Common Real-World Use Cases
- Create incidents when errors occur
- Trigger alerts from monitoring systems
- Acknowledge or resolve incidents automatically
- Assign incidents to the correct service or escalation policy
- Sync alerts from applications, logs, or AI systems
- Retrieve incident status for dashboards

---

## 2. Prerequisites

Before using the PagerDuty node, ensure:
- You have a PagerDuty account
- You have access to a PagerDuty service
- API access is enabled
- You have permission to create and manage incidents
- You can generate an API token

---

## 3. Authentication & Credentials Setup

### Authentication Method
The PagerDuty node uses API Token authentication.

### Required Credential Fields
**API Token**  
A secure token that authorizes the node to access PagerDuty APIs.

### Step-by-Step: How to Get a PagerDuty API Token
1. Log in to PagerDuty  
2. Go to User Settings → API Access  
3. Click Create New API Token  
4. Give the token a name (e.g., “Automation Workflow”)  
5. Copy and securely save the token  

Important: You will not be able to view the token again once you leave the page.

### Common Authentication Mistakes
- Using an expired or revoked token
- Using a token without incident permissions
- Copying extra spaces in the token

---

## 4. Input Fields – Detailed Explanation (Core Section)

Below are all common input fields used in the PagerDuty node.

### 4.1 API Token
**Description:** Token used to authenticate with PagerDuty.  
**Required:** Yes

---

### 4.2 Operation / Action
**Description:** Action to perform.  
**Required:** Yes  

**Common Operations**
- List Incidents
- Get Incident
- Create Incident
- Update Incident
- Acknowledge Incident
- Resolve Incident
- List On-Calls
- Get On-Call
- List Schedules
- Get Schedule

---

### 4.3 Incident ID
**Description:** Unique identifier of an incident.  
**Required:** Required for update, acknowledge, resolve  
**Example:** `QWER456`

**How to get this value**
- Open the incident in PagerDuty
- Copy the ID from the URL or incident details

---

### 4.4 Incident Title
**Description:** Short summary of the incident.  
**Required:** Yes (Create Incident)  
**Example:** `Database connection failure`

---

### 4.5 Service ID
**Description:** Identifies which PagerDuty service the incident belongs to.  
**Required:** Required for creating incidents  
**Example:** `PABC123`

**How to get this value**
- Open PagerDuty → Services
- Click the service
- Copy the ID from the URL or service details

---

### 4.6 Urgency
**Description:** Severity level of the incident.  
**Required:** Optional  
**Accepted Values:** `high`, `low`

---

### 4.7 Status
**Description:** Current state of the incident.  
**Required:** Optional  
**Accepted Values:** `triggered`, `acknowledged`, `resolved`

---

### 4.8 Escalation Policy ID
**Description:** Escalation policy used for the incident.  
**Required:** Optional  
**Example:** `EP12345`

**How to get this value**
- Open Escalation Policies
- Click the policy
- Copy the ID from the URL

---

### 4.9 Assignee User ID
**Description:** Assigns the incident to a specific user.  
**Required:** Optional  
**Example:** `U123ABC`

---

### 4.10 Note
**Description:** Note added when acknowledging or resolving an incident.  
**Required:** Optional

---

### 4.11 Schedule ID
**Description:** Used for schedule-related operations.  
**Required:** Optional  

**How to get this value**
- Open PagerDuty → Configuration → Schedules
- Copy the ID from the schedule URL

---

## 5. Example Configurations

### Example 1: Create an Incident
**Inputs**
- Operation: Create Incident
- Service ID: PABC123
- Title: API Down
- Urgency: high

**Result**
- New incident created in PagerDuty

---

### Example 2: Acknowledge an Incident
**Inputs**
- Operation: Acknowledge Incident
- Incident ID: QWER456

**Result**
- Incident marked as acknowledged

---

### Example 3: Resolve an Incident
**Inputs**
- Operation: Resolve Incident
- Incident ID: QWER456

**Result**
- Incident resolved successfully

---

## 6. Output Explanation

The PagerDuty node returns:
- Incident ID
- Incident status
- Service ID
- Assigned user
- Urgency and priority (if applicable)
- Created and updated timestamps
- Success or failure status

---

## 7. Common Errors & Fixes

### Authentication Failed
**Cause:** Invalid API token  
**Fix:** Regenerate token and update credentials

### Service Not Found
**Cause:** Incorrect service ID  
**Fix:** Verify service ID in PagerDuty

### Permission Denied
**Cause:** Token lacks required permissions  
**Fix:** Update API token permissions

### Incident Not Found
**Cause:** Incorrect incident ID  
**Fix:** Copy the correct ID from PagerDuty UI

---

## 8. Best Practices

- Use high urgency only for critical issues
- Keep incident titles clear and actionable
- Automate acknowledgment for known alerts
- Avoid exposing API tokens in logs
- Use escalation policies wisely
- Monitor PagerDuty API rate limits
