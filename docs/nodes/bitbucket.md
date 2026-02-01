# Bitbucket Node — User Guide

## 1. Node Overview

### What Is the Bitbucket Node?
The Bitbucket node connects your workflow to Bitbucket so you can automate actions on repositories, branches, commits, pull requests, and pipelines. It removes the need to manually perform repetitive tasks inside Bitbucket.

### What Problems It Solves
- Eliminates manual repository management
- Automates code-related workflows
- Tracks development progress automatically
- Integrates CI/CD and approval flows
- Syncs issues and pull requests with other tools

### Common Real-World Use Cases
- Create repositories automatically
- Fetch commits and branches
- Create and manage pull requests
- Track issues and bugs
- Automate approvals and notifications
- Log development activity
- Trigger workflows on repository events

---

## 2. Prerequisites

Before using the Bitbucket node, ensure:
- You have a Bitbucket account
- You have access to a Bitbucket workspace
- You have repository access permissions
- You can create App Passwords (recommended authentication)

---

## 3. Authentication & Credentials Setup

### Supported Authentication
The Bitbucket node uses App Passwords (recommended).

### Required Authentication Fields
**Username**
- Your Bitbucket account username

**App Password**
- Secure password generated from Bitbucket settings
- Used instead of your real password

### Step-by-Step: How to Get an App Password
1. Go to Bitbucket Settings  
2. Open Personal Settings → App Passwords  
3. Click Create App Password  
4. Give it a name (e.g., “Automation Access”)  
5. Enable required permissions:
   - Repositories (Read / Write)
   - Pull Requests
   - Issues (if needed)
   - Workspace access
6. Click Create and copy the password

Important: You cannot view this password again. Save it securely.

### Common Authentication Mistakes
- Using Bitbucket login password instead of App Password
- Missing required permissions
- Using wrong username

---

## 4. Input Fields – Detailed Explanation (Core Section)

Below are all common input fields used in the Bitbucket node.

### 4.1 Username
**Description:** Your Bitbucket account username.  
**Required:** Yes  

**How to get this value**
- Go to bitbucket.org and log in
- Click your profile → Personal settings
- Your username is shown in the account settings and profile URL

---

### 4.2 App Password
**Description:** Secure App Password from Bitbucket settings.  
**Required:** Yes  

---

### 4.3 Operation / Action
**Description:** Action to perform.  
**Required:** Yes  

**Common Operations**
- Get Repository
- List Repositories
- Create Pull Request
- Update Pull Request
- Merge Pull Request
- List Pull Requests
- Get Pull Request
- Add PR Comment
- List PR Comments
- Create Branch
- List Branches
- Get Branch
- Delete Branch
- List Commits
- Get Commit
- Get Commit Status
- Get Pipeline
- List Pipelines

---

### 4.4 Workspace ID
**Description:** Identifies your Bitbucket workspace.  
**Required:** Yes  
**Example:** `my-company-workspace`

**How to get this value**
- Open Bitbucket
- Look at the URL after `bitbucket.org/`
- The first name you see is the workspace ID

---

### 4.5 Repository Name
**Description:** Name of the repository to work with.  
**Required:** Yes  
**Example:** `backend-api`

**How to get this value**
- Open the repository in Bitbucket
- Copy the repository name from the page header or URL

---

### 4.6 Pull Request Title
**Description:** Title of the pull request.  
**Required:** Yes (Create PR)  
**Example:** `Add user authentication`

---

### 4.7 Pull Request Description
**Description:** Detailed explanation of the changes.  
**Required:** Optional

---

### 4.8 Source Branch
**Description:** Branch from which changes originate.  
**Required:** Required for pull requests  
**Example:** `feature/login`

---

### 4.9 Destination Branch
**Description:** Branch where changes will be merged.  
**Required:** Required for pull requests  
**Example:** `main`

---

### 4.10 Pull Request ID
**Description:** Unique ID of a pull request.  
**Required:** Required for update, merge, approve  
**Example:** `42`

**How to get this value**
- Open the pull request
- Copy the number shown in the PR title or URL

---

### 4.11 Comment
**Description:** Comment text to add to a pull request.  
**Required:** Required for Add PR Comment

---

### 4.12 Merge Strategy
**Description:** How the pull request should be merged.  
**Required:** Optional  
**Common Values:** Merge Commit, Squash, Fast Forward

---

### 4.13 Branch Name
**Description:** Name of the branch.  
**Required:** Required for branch-related actions  
**Example:** `main`

---

### 4.14 Target Branch
**Description:** Branch used as a base for creating or listing branches.  
**Required:** Optional  
**Example:** `main`

---

### 4.15 Commit Hash (SHA)
**Description:** Unique identifier for a commit.  
**Required:** Required for commit operations  
**Example:** `a1b2c3d4e5`

**How to get this value**
- Open commit history
- Copy the commit hash shown

---

### 4.16 Pipeline UUID
**Description:** Unique ID of a Bitbucket pipeline run.  
**Required:** Required for Get Pipeline  

**How to get this value**
- Open Pipelines in your repository
- Open a pipeline run
- Copy the UUID from the URL or API response

---

## 5. Example Configurations

### Example 1: Create a Pull Request
**Inputs**
- Workspace ID: my-team
- Repository Name: backend-api
- Operation: Create Pull Request
- Source Branch: feature/login
- Destination Branch: main
- Title: Add login feature

**Output**
- New pull request created in Bitbucket

---

### Example 2: Get All Repositories
**Inputs**
- Workspace ID: my-team
- Operation: List Repositories
- Limit: 10

**Output**
- List of repositories

---

### Example 3: Merge a Pull Request
**Inputs**
- Repository Name: backend-api
- Pull Request ID: 42
- Operation: Merge Pull Request

**Output**
- PR merged successfully

---

## 6. Output Explanation

The Bitbucket node returns:
- Resource ID
- Repository details
- Pull request status
- Commit metadata
- Pipeline data
- API response status (success / failure)

---

## 7. Common Errors & Fixes

### Authentication Failed
**Cause:** Invalid App Password  
**Fix:** Create a new App Password with correct permissions

### Repository Not Found
**Cause:** Incorrect workspace or repository name  
**Fix:** Verify spelling and access rights

### Permission Denied
**Cause:** Missing write or admin permission  
**Fix:** Update App Password scopes

### Invalid Branch
**Cause:** Branch does not exist  
**Fix:** Check branch name in repository

---

## 8. Best Practices

- Always use App Passwords instead of login passwords
- Grant minimum required permissions
- Validate branch and repository names
- Use pull requests instead of direct merges
- Handle pagination for large repositories
- Monitor API rate limits
- Log failures for debugging
