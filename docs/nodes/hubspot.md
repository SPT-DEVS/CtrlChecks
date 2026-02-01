# HubSpot Node — User Guide

## 1. Node Overview

### What Is the HubSpot Node?
The HubSpot node lets your workflow connect to HubSpot CRM and automatically create, update, retrieve, or search CRM data. Instead of manually working inside HubSpot, this node pushes and pulls CRM data in real time.

### What Problems It Solves
- Eliminates manual CRM data entry
- Keeps HubSpot data always updated
- Automates lead and customer management
- Syncs data from forms, chats, websites, and apps
- Improves sales, marketing, and support workflows

### Common Use Cases
- Create or update contacts automatically
- Manage companies and deals
- Track leads from forms or chatbots
- Create support tickets
- Log calls, emails, and notes
- Sync CRM data with databases or sheets

---

## 2. Prerequisites

Before using the HubSpot node, ensure:
- You have a HubSpot account
- API access is enabled
- You have required permissions for CRM objects

---

## 3. Authentication & Credentials

### Required Authentication
The HubSpot node requires authentication.

### Supported Authentication Types
- Private App Access Token (Recommended)
- OAuth (if supported)

### Required Credential Fields
**Access Token**
- Generated from a HubSpot Private App
- Used to authorize all API requests

### Common Authentication Issues
- Invalid or expired token
- Insufficient permissions on the token
- Using old API keys (deprecated by HubSpot)

---

## 4. Input Fields – Detailed Explanation (Core Section)

Below are all common input fields used in the HubSpot node.

### 4.1 Authentication Type
**Description:** How the node authenticates with HubSpot.  
**Required:** Yes  

**Supported Values**
- API Key
- OAuth2 Access Token

**Tip:** Use Private App tokens when possible for better security and control.

---

### 4.2 API Key
**Description:** HubSpot API key (if using API Key authentication).  
**Required:** Only if Authentication Type = API Key  
**Example Value:** `your-hubspot-api-key`

---

### 4.3 OAuth2 Access Token
**Description:** Access token for OAuth2 (if using OAuth).  
**Required:** Only if Authentication Type = OAuth  
**Example Value:** `your-oauth-access-token`

---

### 4.4 Object Type (Resource)
**Description:** Defines which HubSpot object you want to work with.  
**Required:** Yes  

**Supported Values**
- Contact
- Company
- Deal
- Ticket
- Product
- Line Item
- Quote
- Call
- Email
- Meeting
- Note
- Task
- Owner
- Pipeline

**How to choose:** Pick the CRM object that matches the record you want to create, update, or retrieve.

---

### 4.5 Operation / Action
**Description:** What action should be performed on the selected object.  
**Required:** Yes  

**Common Operations**
- Get
- Get Many
- Create
- Update
- Delete
- Search
- Batch Create
- Batch Update
- Batch Delete

---

### 4.6 Object ID (Resource ID)
**Description:** Unique ID of the HubSpot object.  
**Required:** Required for Get, Update, Delete  
**Example Value:** `123456789`

**How to get this value**
- From a previous HubSpot node output
- From HubSpot record URL
- From a Search operation result

---

### 4.7 Properties (JSON)
**Description:** Data fields for the selected object.  
**Required:** Yes for Create / Update  

**Example (Contact)**
```
{
  "email": "user@example.com",
  "firstname": "John",
  "lastname": "Doe"
}
```

**Tip:** Use HubSpot’s internal field names for properties.

---

### 4.8 Search Query
**Description:** Text query used for Search operations.  
**Required:** Required for Search  
**Example Value:** `email:test@example.com`

---

### 4.9 Limit
**Description:** Number of records to return.  
**Required:** Optional  
**Example Value:** `10`

---

### 4.10 After (Pagination)
**Description:** Token used for fetching the next page of results.  
**Required:** Optional  
**Example Value:** `paging_token`

---

## 5. Example Configurations

### Example 1: Create Contact
**Inputs**
- Object Type: Contact
- Operation: Create
- Properties:
```
{
  "email": "user@example.com",
  "firstname": "John",
  "lastname": "Doe"
}
```

**Output**
- New contact created in HubSpot

---

### Example 2: Update Deal
**Inputs**
- Object Type: Deal
- Operation: Update
- Object ID: 987654
- Properties:
```
{
  "dealstage": "closedwon"
}
```

**Output**
- Deal updated successfully

---

### Example 3: Search Contact by Email
**Inputs**
- Object Type: Contact
- Operation: Search
- Search Query: `email:user@example.com`

**Output**
- Matching contact details

---

## 6. Output Explanation

The HubSpot node returns:
- Object ID
- Properties (all fields)
- Created and updated timestamps
- Associations (if enabled)
- Status (success / failure)

---

## 7. Common Errors & Fixes

### Authentication Failed
**Cause:** Invalid or expired token  
**Fix:** Regenerate access token

### Property Not Found
**Cause:** Incorrect property name  
**Fix:** Use HubSpot internal field name

### Permission Denied
**Cause:** Token lacks required scopes  
**Fix:** Enable permissions in Private App

### Duplicate Contact
**Cause:** Same email already exists  
**Fix:** Use Search + Update logic

---

## 8. Best Practices

- Always use email as unique identifier for contacts
- Validate data before sending to HubSpot
- Use Search before Create to avoid duplicates
- Use associations to maintain clean CRM relationships
- Handle pagination for large data
- Log API errors for debugging
- Respect HubSpot API rate limits
