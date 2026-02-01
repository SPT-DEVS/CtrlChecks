# Salesforce Node — User Guide

## 1. Node Overview

The Salesforce node connects workflows to Salesforce CRM so you can create, update, retrieve, delete, and query records automatically. It is used for CRM automation and syncing data between systems.

### What Problems It Solves
- Automates lead and contact management
- Syncs data across tools
- Reduces manual CRM updates
- Supports sales and support workflows

### Common Real‑World Use Cases
- Create or update leads
- Sync contacts or accounts
- Track opportunities
- Run SOQL queries for reporting

---

## 2. Prerequisites

Before using the Salesforce node:
- You have a Salesforce account and Org access
- API access is enabled
- Your user has permission to read/write the objects

---

## 3. Authentication / Credentials Setup

The Salesforce node uses OAuth 2.0.

### Required Credential Fields
- **Instance URL**
- **Access Token**

These are usually provided after OAuth authentication.

---

## 4. Input Fields – Detailed Explanation (Core Section)

The Salesforce node has these inputs:

### 4.1 Instance URL
**Description:** Your Salesforce instance URL.  
**Required:** Yes  
**Example:** `https://yourinstance.salesforce.com`

---

### 4.2 OAuth2 Access Token
**Description:** Access token used for API requests.  
**Required:** Yes  

---

### 4.3 Resource / Object
**Description:** Salesforce object to work with.  
**Required:** Yes  

**Common Values**
- Account
- Contact
- Lead
- Opportunity
- Case
- Campaign
- Product2
- Task
- Event
- Custom Object

---

### 4.4 Custom Object API Name
**Description:** Required only when Resource is Custom Object.  
**Required:** Optional  
**Example:** `CustomObject__c`

---

### 4.5 Operation
**Description:** Action to perform.  
**Required:** Yes  

**Common Operations**
- Query (SOQL)
- Search (SOSL)
- Get
- Create
- Update
- Delete
- Upsert
- Bulk Create/Update/Delete/Upsert

---

### 4.6 SOQL Query
**Description:** Query for the **Query** operation.  
**Required:** For Query  

**Example**
```
SELECT Id, Name, Email FROM Contact WHERE Email != null
```

---

### 4.7 SOSL Search Query
**Description:** Search query for the **Search** operation.  
**Required:** For Search  

---

### 4.8 Record ID
**Description:** Record identifier for Get/Update/Delete.  
**Required:** For Get/Update/Delete  
**Example:** `0035g00000ABCDe`

---

### 4.9 Fields (JSON)
**Description:** Data fields to create or update.  
**Required:** For Create/Update  

**Example**
```
{
  "FirstName": "John",
  "LastName": "Doe",
  "Email": "john.doe@example.com"
}
```

---

### 4.10 External ID Field + Value
**Description:** Used for Upsert.  
**Required:** For Upsert  
**Examples:**  
External ID Field: `Email`  
External ID Value: `john.doe@example.com`

---

## 5. Example Configurations

### Example 1: Create a Lead
**Operation:** Create  
**Resource:** Lead  
**Fields:** FirstName, LastName, Email  

---

### Example 2: Query Contacts
**Operation:** Query  
**SOQL:** `SELECT Id, Name FROM Contact LIMIT 10`

---

## 6. Output Fields

The Salesforce node returns:
- Record ID
- Success status
- Returned records (for queries)
- Error details (if any)

---

## 7. Common Errors & Fixes

### Invalid Session ID
**Cause:** Token expired  
**Fix:** Re‑authenticate

### Required Field Missing
**Cause:** Missing mandatory fields  
**Fix:** Provide all required fields

---

## 8. Best Practices

- Use OAuth authentication instead of passwords
- Use External ID for upserts
- Limit fields returned for performance
- Validate SOQL before running
