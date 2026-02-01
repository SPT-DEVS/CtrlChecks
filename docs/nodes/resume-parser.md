# Resume Parser Node — User Guide

## 1. Node Overview

### What Is the Resume Parser Node?
The Resume Parser node automatically extracts structured information from resume files such as PDF, DOC, or DOCX. Instead of manually reading resumes, this node converts unstructured resume content into organized data fields.

In simple terms: upload a resume and get clean, structured candidate details.

### What Problems It Solves
- Eliminates manual resume screening
- Saves HR and recruiter time
- Converts resumes into structured data
- Standardizes candidate information
- Enables automated hiring workflows

### Common Real-World Use Cases
- Parsing resumes from job applications
- Auto-filling candidate profiles
- Screening candidates using skills/experience
- Storing resume data in databases or spreadsheets
- Ranking or filtering applicants
- Feeding resumes into AI evaluation systems

---

## 2. Prerequisites

Before using the Resume Parser node, ensure you have:
- Resume files in supported formats
- Permission to process candidate data
- Compliance with data privacy laws (recommended)

**Supported File Formats**
- PDF
- DOC
- DOCX
- TXT (optional)

---

## 3. Authentication & Credentials Setup

### Does the Resume Parser Node Require Authentication?
- Internal Resume Parser: No authentication required
- External Resume Parsing Service: API key may be required

If credentials are required, they usually include:
- API Key
- Service Endpoint

### Why Authentication Is Required (If Applicable)
Authentication allows secure access to:
- Resume parsing engines
- AI or NLP-based extraction services

### Common Mistakes
- Using expired API keys
- Uploading unsupported file formats
- Uploading scanned image-only PDFs

---

## 4. Input Fields – Detailed Explanation (Core Section)

Below are all common input fields available in the Resume Parser node.

### 4.1 Operation / Action
**Description:** Defines what the node should do.  
**Required:** Yes  

**Common Values**
- Parse Resume
- Extract Resume Data
- Analyze Resume

---

### 4.2 Resume File
**Description:** The resume document to be parsed.  
**Required:** Yes  

**Accepted Formats**
- PDF
- DOC
- DOCX
- TXT

**Example Value:** `John_Doe_Resume.pdf`

**How to get this value**
- Uploaded by user via Form node
- Selected from file storage
- Received as attachment from email

---

### 4.3 File Source
**Description:** Where the resume file comes from.  
**Required:** Optional  

**Common Values**
- Upload
- URL
- Email Attachment
- Cloud Storage

---

### 4.4 Resume File URL (If Applicable)
**Description:** Public or accessible link to resume file.  
**Required:** Only if source is URL  
**Example Value:** `https://example.com/resumes/john_doe.pdf`

---

### 4.5 Language (Optional)
**Description:** Language of the resume content.  
**Required:** Optional  

**Example Values**
- English
- Hindi
- Spanish

Note: If not provided, language is auto-detected.

---

### 4.6 Enable OCR
**Description:** Extracts text from scanned resumes.  
**Required:** Optional  
**Values:** Yes / No

**When to enable**
- Resume is a scanned image PDF
- Resume text is not selectable

---

### 4.7 Parsing Mode
**Description:** Level of detail in extraction.  
**Required:** Optional  

**Common Values**
- Basic (name, email, phone)
- Standard (skills, education, experience)
- Advanced (projects, certifications, summary)

---

### 4.8 Fields to Extract
**Description:** Select which data fields to extract.  
**Required:** Optional  

**Common Fields**
- Full Name
- Email
- Phone Number
- Address
- Skills
- Education
- Work Experience
- Job Titles
- Companies
- Years of Experience
- Certifications
- Languages

---

### 4.9 Skill Normalization
**Description:** Standardizes skill names.  
**Required:** Optional  

**Example**
- JS → JavaScript  
- Py → Python

---

### 4.10 Experience Calculation
**Description:** Automatically calculates total experience.  
**Required:** Optional  
**Values:** Yes / No

---

### 4.11 Confidence Score
**Description:** Includes confidence level for extracted fields.  
**Required:** Optional  
**Values:** Yes / No

---

### 4.12 Output Format
**Description:** Structure of parsed data.  
**Required:** Optional  

**Common Values**
- JSON
- Key-Value
- Flat Text

---

### 4.13 Metadata / Custom Fields
**Description:** Additional data to attach to parsed result.  
**Required:** Optional  

**Example Value**
```
{
  "job_id": "JD_102",
  "source": "LinkedIn"
}
```

---

## 5. Example Configurations

### Simple Example – Parse Resume
**Inputs**
- Operation: Parse Resume
- Resume File: candidate_resume.pdf

**Output**
- Name
- Email
- Phone
- Skills

---

### Advanced Example – Full Resume Analysis
**Inputs**
- Resume File: senior_dev_resume.docx
- Enable OCR: Yes
- Parsing Mode: Advanced
- Fields to Extract: All
- Experience Calculation: Yes

**Output**
- Structured resume profile
- Total experience
- Skills list
- Education and work history

---

## 6. Output Explanation

The Resume Parser node returns structured data such as:
- Candidate Name
- Email Address
- Phone Number
- Skills (array)
- Education details
- Work experience (company, role, duration)
- Total years of experience
- Certifications
- Confidence score (if enabled)
- Parsing status (success/failure)

---

## 7. Common Errors & Fixes

### Unsupported File Format
**Cause:** Resume not in supported format  
**Fix:** Convert to PDF or DOCX

### Empty Output
**Cause:** Scanned resume without OCR  
**Fix:** Enable OCR option

### Incorrect Skill Extraction
**Cause:** Non-standard skill naming  
**Fix:** Enable skill normalization

### Partial Data Missing
**Cause:** Resume poorly formatted  
**Fix:** Use advanced parsing mode

### Parsing Failed
**Cause:** Corrupted file  
**Fix:** Re-upload or replace file

---

## 8. Best Practices

- Use clean, text-based resumes when possible
- Enable OCR only for scanned resumes
- Always validate extracted data
- Combine with Form node for uploads
- Store parsed results securely
- Respect data privacy laws
- Log parsing failures for review
- Use advanced mode for senior roles
