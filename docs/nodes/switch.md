# Switch Node — User Guide

## 1. Node Overview

### What Is the Switch Node?
The Switch node routes workflow data into different paths based on a single value. It compares one expression to a list of cases and sends the data to the first matching case.

### What Problems It Solves
- Replaces complex if‑else logic
- Keeps branching logic visual and clean
- Handles multiple conditions without clutter

### Common Real‑World Use Cases
- Route users by status (new / existing)
- Handle API responses by status code
- Process orders by payment method
- Categorize data into multiple branches

---

## 2. Prerequisites

Before using the Switch node:
- You have input data from a previous node
- You know which field/value you want to evaluate
- You understand the possible values

No authentication or credentials are required.

---

## 3. How the Switch Node Works (Simple Explanation)

1. Reads a single value from incoming data  
2. Compares it to each case value  
3. Routes to the first matching case  
4. If no match is found, it goes to the default output

---

## 4. Input Fields – Detailed Explanation (Core Section)

The Switch node has **two** input fields.

### 4.1 Expression
**Description:** The value to evaluate and match against cases.  
**Required:** Yes  
**Example:** `{{input.status}}`

**How to get this value**
- Look at the output of the previous node
- Pick the field you want to check
- Insert it as a template variable

---

### 4.2 Cases (JSON)
**Description:** List of possible matches. Each case creates one output branch.  
**Required:** Yes  

**Format**
```
[
  {"value": "success", "label": "Success"},
  {"value": "failed", "label": "Failed"}
]
```

**How it works**
- `value` must match the expression result exactly
- `label` is the name of the output branch

---

## 5. Example Configurations

### Example 1: Status Routing
**Expression**
```
{{input.status}}
```

**Cases**
```
[
  {"value": "success", "label": "Success"},
  {"value": "failed", "label": "Failed"}
]
```

**Result**
- `success` → Success branch  
- `failed` → Failed branch  
- anything else → Default branch

---

### Example 2: Payment Method
**Expression**
```
{{input.payment_method}}
```

**Cases**
```
[
  {"value": "card", "label": "Card"},
  {"value": "upi", "label": "UPI"},
  {"value": "bank_transfer", "label": "Bank Transfer"}
]
```

---

## 6. Output Explanation

The Switch node outputs:
- The original input data (unchanged)
- The matched case path
- A default path when no case matches

---

## 7. Common Errors & Fixes

### No Output
**Cause:** No default case and no match  
**Fix:** Add a default output branch and handle unmatched values

### Wrong Branch
**Cause:** Case value doesn’t match exactly  
**Fix:** Check spelling and case of the `value`

---

## 8. Best Practices

- Always include a default output
- Keep case labels descriptive
- Match exact values to avoid misrouting
- Order cases from most specific to least
