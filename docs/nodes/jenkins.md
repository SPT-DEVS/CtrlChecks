# Jenkins Node — User Guide

## 1. Node Overview

### What Is the Jenkins Node?
The Jenkins node allows your workflow to connect with a Jenkins server to trigger jobs, monitor builds, fetch build details, and automate CI/CD processes. Instead of manually running jobs inside Jenkins, this node lets your automation control Jenkins programmatically.

### What Problems It Solves
- Eliminates manual job triggering
- Automates build and deployment pipelines
- Integrates Jenkins with other tools
- Enables real-time build monitoring
- Reduces human error in CI/CD workflows

### Common Real-World Use Cases
- Trigger a Jenkins job after code changes
- Pass dynamic parameters to builds
- Monitor build status automatically
- Fetch build logs and results
- Automate deployment pipelines
- Notify teams when builds fail or succeed

---

## 2. Prerequisites

Before using the Jenkins node, ensure:
- You have a Jenkins account
- Jenkins server is running and accessible
- You have permission to trigger jobs
- API access is enabled
- You can create an API token

---

## 3. Authentication & Credentials Setup

### Authentication Method
The Jenkins node uses Basic Authentication with an API token.

### Required Credential Fields
**Jenkins URL**
- Base URL of your Jenkins server  
**Example:** `https://jenkins.example.com`

**Username**
- Your Jenkins username

**API Token**
- Secure token generated from Jenkins  
- Used instead of your password

### Step-by-Step: How to Get a Jenkins API Token
1. Open Jenkins in your browser  
2. Click your username (top-right corner)  
3. Click Configure  
4. Scroll to API Token  
5. Click Add new Token  
6. Give it a name (e.g., “Automation Access”)  
7. Generate and copy the token  

Important: You will not be able to view this token again. Save it securely.

### Common Authentication Mistakes
- Using Jenkins password instead of API token
- Incorrect Jenkins URL (missing protocol)
- User does not have job permissions

---

## 4. Input Fields – Detailed Explanation (Core Section)

Below are all common input fields used in the Jenkins node.

### 4.1 Jenkins URL
**Description:** Base URL of your Jenkins server.  
**Required:** Yes  
**Example:** `https://jenkins.example.com`

---

### 4.2 Username
**Description:** Jenkins username used for authentication.  
**Required:** Yes

---

### 4.3 API Token
**Description:** Jenkins API token used instead of your password.  
**Required:** Yes

---

### 4.4 Operation / Action
**Description:** Action to perform.  
**Required:** Yes  

**Common Operations**
- Get Job
- List Jobs
- Build Job
- Stop Build
- Get Build
- Get Build Log
- Get Build Status
- Poll Build Status

---

### 4.5 Job Name
**Description:** Name of the Jenkins job.  
**Required:** Yes  
**Example:** `deploy-backend`

**How to get this value**
- Open Jenkins dashboard
- Click the job
- Copy the job name shown in the UI or URL

---

### 4.6 Build Number
**Description:** Specific build number of a job.  
**Required:** Required for build-related actions  
**Example:** `25`

**How to get this value**
- Open the Jenkins job
- Look at build history
- Copy the build number

---

### 4.7 Build Parameters (JSON)
**Description:** Parameters passed to a parameterized job.  
**Required:** Optional  

**Example**
```
{
  "ENV": "production",
  "VERSION": "1.2.3"
}
```

---

### 4.8 Poll Interval (seconds)
**Description:** Time interval to check build status.  
**Required:** Optional  
**Example:** `10`

---

### 4.9 Max Poll Attempts
**Description:** Maximum number of polling attempts.  
**Required:** Optional  
**Example:** `60`

---

## 5. Example Configurations

### Example 1: Trigger a Jenkins Job
**Inputs**
- Operation: Build Job
- Job Name: deploy-backend
- Build Parameters:
```
{
  "ENV": "production"
}
```

**Result**
- Jenkins job starts running

---

### Example 2: Get Build Status
**Inputs**
- Operation: Get Build Status
- Job Name: deploy-backend
- Build Number: 25

**Result**
- Build status (SUCCESS / FAILURE / RUNNING)

---

### Example 3: Fetch Build Logs
**Inputs**
- Operation: Get Build Log
- Job Name: deploy-backend
- Build Number: 25

**Result**
- Console output returned

---

## 6. Output Explanation

The Jenkins node returns:
- Job name
- Build number
- Build status
- Build URL
- Start and end time
- Console logs (if enabled)
- Success or failure status

---

## 7. Common Errors & Fixes

### Authentication Failed
**Cause:** Invalid API token or username  
**Fix:** Regenerate token and verify credentials

### Job Not Found
**Cause:** Incorrect job name or folder path  
**Fix:** Verify exact job path in Jenkins

### Permission Denied
**Cause:** User lacks build permission  
**Fix:** Grant job build access in Jenkins

### Build Parameters Ignored
**Cause:** Job is not parameterized  
**Fix:** Enable “This project is parameterized” in job settings

---

## 8. Best Practices

- Always use API tokens instead of passwords
- Limit token permissions to required jobs
- Use parameterized jobs for flexibility
- Enable “Wait for completion” only when needed
- Monitor Jenkins API rate usage
- Secure Jenkins URL with HTTPS
- Log failures for debugging
