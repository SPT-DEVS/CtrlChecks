# Zoho CRM Node — User Guide

## 1. Node Overview

The Zoho CRM node connects workflows to Zoho CRM so you can create, update, retrieve, delete, and search CRM records automatically.

### Common Use Cases
- Lead capture automation
- Contact & account updates
- Deal management
- CRM data synchronization
- Sales and support workflow automation

---

## 2. Prerequisites

Before using the Zoho CRM node:
- You have a Zoho account
- You have access to Zoho CRM
- Your CRM edition has API access enabled
- Your user has permission to read/write the required modules

---

## 3. Authentication / Credentials Setup

Zoho CRM uses OAuth 2.0.

### Required Credential Fields
- **Access Token**
- **API Domain** (region URL)

---

## 4. Input Fields – Detailed Explanation (Core Section)

The Zoho CRM node includes these inputs:

### 4.1 OAuth2 Access Token
**Description:** Token used for API requests.  
**Required:** Yes  

---

### 4.2 API Domain
**Description:** Region‑specific API domain.  
**Required:** Yes  

**Examples**
- https://www.zohoapis.com  
- https://www.zohoapis.in  
- https://www.zohoapis.eu  

---

### 4.3 Module
**Description:** CRM module to work with.  
**Required:** Yes  

**Examples**
- Leads
- Contacts
- Accounts
- Deals
- Tasks
- Calls
- Events
- Custom Module

---

### 4.4 Custom Module API Name
**Description:** Required only if Module = Custom Module.  
**Required:** Optional  
**Example:** `CustomModule1`

---

### 4.5 Operation
**Description:** Action to perform.  
**Required:** Yes  

**Common Operations**
- Get
- Get Many
- Create
- Update
- Delete
- Search
- Upsert
- Bulk Create
- Bulk Update

---

### 4.6 Record ID
**Description:** Record ID for Get/Update/Delete.  
**Required:** For Get/Update/Delete  
**Example:** `4876876000000123456`

---

### 4.7 Data (JSON)
**Description:** Fields and values for Create/Update.  
**Required:** For Create/Update  

**Example**
```
{
  "Last_Name": "Sharma",
  "First_Name": "Amit",
  "Email": "amit.sharma@example.com"
}
```

---

### 4.8 Search Criteria
**Description:** Criteria used for Search operation.  
**Required:** For Search  

**Example**
```
(Email:equals:amit.sharma@example.com)
```

---

### 4.9 Fields (comma‑separated)
**Description:** Fields to return for Get/Get Many.  
**Required:** Optional  
**Example:** `id,First_Name,Last_Name,Email`

---

### 4.10 Page Number
**Description:** Page number for pagination.  
**Required:** Optional  
**Default:** 1

---

### 4.11 Records Per Page
**Description:** Records per page.  
**Required:** Optional  
**Default:** 200

---

## 5. Example Configurations

### Example 1: Create a Lead
**Operation:** Create  
**Module:** Leads  
**Data:** First_Name, Last_Name, Email  

---

### Example 2: Search by Email
**Operation:** Search  
**Criteria:** `(Email:equals:amit.sharma@example.com)`

---

## 6. Output Fields

The Zoho CRM node returns:
- Record ID
- Success status
- Returned records array (for get/search)
- Error details (if any)

---

## 7. Common Errors & Fixes

### INVALID_TOKEN
**Cause:** Token expired  
**Fix:** Re‑authenticate

### REQUIRED_FIELD_MISSING
**Cause:** Mandatory field empty  
**Fix:** Provide required field values

---

## 8. Best Practices

- Use OAuth refresh tokens (don’t hardcode access tokens)
- Verify module API names
- Use external IDs for upserts
- Handle pagination for large datasets
