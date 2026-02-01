# Google Sheets Node — User Guide

## 1. Node Overview

### What Is the Google Sheets Node?
The Google Sheets node lets you read, write, append, and update data in Google Sheets automatically. It treats rows and columns like database records so you can sync data between apps and Sheets without manual work.

### What Problems It Solves
- Eliminates manual data entry
- Keeps spreadsheets updated automatically
- Syncs data between apps and Google Sheets
- Turns Sheets into a lightweight database
- Enables reporting and logging

### Common Real‑World Use Cases
- Store form submissions
- Update CRM or lead lists
- Generate reports
- Track orders or payments
- Log workflow executions
- Read configuration values from Sheets

---

## 2. Prerequisites

Before using the Google Sheets node, you need:
- A Google account
- Access to Google Sheets
- A spreadsheet created in Google Drive
- Permission to view/edit the spreadsheet

Note: Admin access is not required, but your account must have access to the file.

---

## 3. Authentication & Credentials Setup

Google Sheets uses OAuth 2.0 authentication.

### Step‑by‑Step: How to Connect
1. Open the workflow tool’s credentials section  
2. Choose **Google Sheets OAuth**  
3. Click **Sign in with Google**  
4. Select your Google account  
5. Grant permissions:
   - View Google Sheets  
   - Edit Google Sheets (if writing data)  
6. Save credentials  

Once connected, the node can access your spreadsheets.

### Common Authentication Mistakes
- Using an account without spreadsheet access
- Spreadsheet owned by another user without sharing
- Read‑only permission when trying to write

---

## 4. Input Fields – Detailed Explanation (Core Section)

Below are all input fields available in the Google Sheets node.

### 4.1 Operation
**Description:** Action to perform on Google Sheets.  
**Required:** Yes  

**Options**
- Read
- Write
- Append
- Update

---

### 4.2 Spreadsheet ID
**Description:** Unique ID of the Google Sheet file.  
**Required:** Yes  

**Example**
```
1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

**How to get this value**
- Open the Google Sheet  
- Copy the ID from the URL:  
  `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

---

### 4.3 Sheet Name (Tab)
**Description:** Name of the tab inside the spreadsheet.  
**Required:** Optional  
**Example:** `Sheet1`

**Tip:** Leave empty to use the first sheet.

---

### 4.4 Range (e.g., A1:D100)
**Description:** Cell range to read/write/update.  
**Required:** Optional (but recommended for write/update)  
**Example:** `A1:D100`

**Tip:** Leave empty to read all used cells.

---

### 4.5 Output Format
**Description:** How read results are formatted.  
**Required:** Optional  

**Options**
- JSON Array
- Key‑Value Pairs
- Plain Text Table

---

### 4.6 Read Direction
**Description:** Whether data is read by rows or columns.  
**Required:** Optional  

**Options**
- Row‑wise (default)
- Column‑wise

---

### 4.7 Allow Write Access
**Description:** Enables write/update operations.  
**Required:** Optional  

**Note:** This may be restricted to admin users.

---

### 4.8 Data to Write (JSON)
**Description:** Data used for Write, Append, and Update.  
**Required:** Yes for Write/Append/Update  

**Example**
```
[
  ["Name", "Email"],
  ["John", "john@example.com"]
]
```

---

## 5. Example Configurations

### Example 1: Append Form Data
**Operation:** Append  
**Sheet:** Sheet1  
**Data to Write:**
```
[
  ["Name", "Email"],
  ["{{form.name}}", "{{form.email}}"]
]
```

---

### Example 2: Read All Records
**Operation:** Read  
**Range:** A1:D  
**Output Format:** JSON Array  

---

### Example 3: Update a Range
**Operation:** Update  
**Range:** A2:C2  
**Data to Write:**
```
[
  ["Status", "Active"]
]
```

---

## 6. Output Explanation

The Google Sheets node returns:
- Retrieved rows
- Updated/appended row count (if applicable)
- Spreadsheet ID
- Sheet name
- Execution status
- Error details (if any)

---

## 7. Common Errors & Fixes

### Permission Denied
**Cause:** Sheet not shared with your account  
**Fix:** Share file with correct permissions

### Invalid Range
**Cause:** Wrong cell range  
**Fix:** Verify range format (e.g., A1:D10)

### Column Mismatch
**Cause:** Data doesn’t match sheet structure  
**Fix:** Ensure headers and data align

---

## 8. Best Practices

- Use header rows for readable data
- Prefer Spreadsheet ID over name
- Avoid hard‑coding ranges when possible
- Validate data before writing
- Keep sheets clean and structured
