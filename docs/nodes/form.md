# Form Node — User Guide

## 1. Node Overview

### What Is the Form Node?
The Form node allows you to create an interactive form that collects structured input from users. The form is presented to users in a simple UI, and their responses are captured and passed into the workflow.

In simple terms: this node asks users questions and collects their answers.

### What Problems It Solves
- Collects user input without coding
- Replaces manual data collection
- Standardizes user responses
- Prevents missing or invalid data
- Enables guided data entry

### Common Real-World Use Cases
- Lead capture forms
- Feedback or survey forms
- Job application forms
- Support request forms
- Approval or confirmation flows
- Data entry before automation starts

---

## 2. Prerequisites

Before using the Form node, ensure you have:
- A workflow that requires user input
- Clear understanding of what data you want to collect
- Ability to define form questions and types

Note: No API keys or external services required.

---

## 3. Authentication & Credentials Setup

### Does the Form Node Require Authentication?
No. The Form node works internally and does not require API keys or login credentials.

### Common Misunderstandings
- Expecting OAuth or tokens → Not required
- Assuming users need accounts → Optional, depends on usage

---

## 4. Input Fields – Detailed Explanation (Core Section)

Below are all common input fields available in the Form node.

### 4.1 Form Title
**Description:** Title displayed at the top of the form.  
**Required:** Yes  
**Example Value:** `Contact Information`

---

### 4.2 Form Description
**Description:** Short explanation shown below the title.  
**Required:** Optional  
**Example Value:** `Please fill out the details below.`

---

### 4.3 Form Fields (Questions)
Each form consists of one or more fields. For each field, you configure the inputs below.

#### Field Label
**Description:** Question or label shown to the user.  
**Required:** Yes  
**Example Value:** `Email Address`

#### Field Type
**Description:** Defines the type of input.  
**Required:** Yes  

**Common Values**
- Text
- Number
- Email
- Phone
- Password
- Textarea (long text)
- Dropdown
- Radio Buttons
- Checkboxes
- Date
- Time
- File Upload
- Yes / No (Boolean)

#### Field Name / Key
**Description:** Internal identifier used in the workflow.  
**Required:** Yes  
**Example Value:** `email`

Note: Must be unique and contain no spaces.

#### Required Field
**Description:** Whether the user must fill this field.  
**Required:** Optional  
**Values:** Yes / No

#### Placeholder Text
**Description:** Hint shown inside input box.  
**Required:** Optional  
**Example Value:** `Enter your email address`

#### Default Value
**Description:** Pre-filled value shown to the user.  
**Required:** Optional

#### Help Text / Tooltip
**Description:** Additional guidance shown near the field.  
**Required:** Optional  
**Example Value:** `We will never share your email.`

#### Validation Rules
**Description:** Ensures correct input format.  
**Required:** Optional  

**Common Validations**
- Minimum length
- Maximum length
- Email format
- Number range
- File size limit

#### Options (For Dropdown / Radio / Checkbox)
**Description:** List of selectable values.  
**Required:** Yes (for selection fields)  

**Example Value**
```
[
  "Option 1",
  "Option 2",
  "Option 3"
]
```

#### Allow Multiple Selection
**Description:** Allows selecting more than one option.  
**Required:** Optional  
**Values:** Yes / No

#### File Type Allowed (For File Upload)
**Description:** Restricts file types.  
**Required:** Optional  
**Example Values:** PDF, JPG, PNG, DOCX

#### Max File Size
**Description:** Maximum allowed file size.  
**Required:** Optional  
**Example Value:** `5 MB`

#### Visibility Condition (Optional)
**Description:** Shows or hides field based on previous answers.  
**Required:** Optional  
**Example:** Show field if “Yes” selected above

---

### 4.4 Form-Level Settings

#### Submit Button Label
**Description:** Text shown on submit button.  
**Required:** Optional  
**Example Value:** `Submit`

#### Success Message
**Description:** Message shown after submission.  
**Required:** Optional  
**Example Value:** `Thank you! Your response has been submitted.`

#### Allow Multiple Submissions
**Description:** Whether the same user can submit multiple times.  
**Required:** Optional  
**Values:** Yes / No

#### Save Partial Responses
**Description:** Saves progress if user leaves mid-way.  
**Required:** Optional

#### Form Timeout
**Description:** Time before form expires.  
**Required:** Optional  
**Example Value:** `10 minutes`

---

## 5. Example Configurations

### Simple Example – Contact Form
**Fields**
- Name (Text, Required)
- Email (Email, Required)
- Message (Textarea, Optional)

**Output**
- Structured user data sent to the next node

---

### Advanced Example – Job Application Form
**Fields**
- Full Name
- Email
- Phone
- Resume (File Upload, PDF only)
- Experience (Dropdown)

**Output**
- File + structured applicant data

---

## 6. Output Explanation

The Form node outputs:
- Field values entered by the user
- Field keys mapped to responses
- Submission timestamp
- Submission status
- Uploaded file metadata (if applicable)

---

## 7. Common Errors & Fixes

### Required Field Missing
**Cause:** User skipped mandatory field  
**Fix:** Mark field as required

### Invalid Input Format
**Cause:** Validation rule not met  
**Fix:** Adjust validation or help text

### File Upload Failed
**Cause:** File too large or wrong type  
**Fix:** Update file limits

### Form Not Submitting
**Cause:** Missing required fields  
**Fix:** Review required settings

---

## 8. Best Practices

- Keep forms short and simple
- Use clear field labels
- Add help text for clarity
- Validate user input early
- Avoid too many required fields
- Group related questions
- Test form before publishing
- Use meaningful field keys
