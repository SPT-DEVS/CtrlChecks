# IF Node — User Guide

## 1. Node Overview

### What Is the IF Node?
The IF node evaluates a condition and splits the workflow into two paths:
- **True path** → condition is met  
- **False path** → condition is not met

It works like: **IF this condition is true → do this, ELSE → do that**.

### What Problems It Solves
- Adds decision‑making logic to workflows
- Handles success vs failure scenarios
- Prevents unnecessary steps from running
- Makes workflows easier to read and maintain

### Common Real‑World Use Cases
- Check if payment is successful
- Validate user input
- Confirm data exists before processing
- Compare values (amounts, status, dates)
- Branch logic based on API responses

---

## 2. Prerequisites

Before using the IF node:
- You must have data from a previous node
- You must know what value you want to check

No credentials or authentication required.

---

## 3. How the IF Node Works (Simple Explanation)

1. Reads a value from incoming data  
2. Compares it against a condition  
3. If true → routes to **True** output  
4. If false → routes to **False** output  

---

## 4. Input Fields – Detailed Explanation (Core Section)

The IF node has a single input field.

### 4.1 Condition
**Description:** JavaScript expression that evaluates to true or false.  
**Required:** Yes  

**Examples**
```
{{input.value}} > 10
{{input.status}} === "active"
{{input.count}} >= 5
```

**How to build this**
- Use `{{input.field}}` from previous nodes
- Compare with `==`, `!=`, `>`, `<`, `>=`, `<=`
- Combine rules with `&&` or `||` if needed

---

## 5. Example Configurations

### Example 1: Age Validation
**Condition**
```
{{user.age}} >= 18
```

**Result**
- Age ≥ 18 → True path  
- Age < 18 → False path  

---

### Example 2: Status Check
**Condition**
```
{{order.status}} === "completed"
```

---

## 6. Output Explanation

The IF node outputs:
- **True** branch: condition satisfied
- **False** branch: condition not satisfied

Input data passes through unchanged.

---

## 7. Common Errors & Fixes

### Always False
**Cause:** Type mismatch or wrong field  
**Fix:** Verify field name and data type

### Null Value
**Cause:** Missing input field  
**Fix:** Add an exists check or validate earlier

### Invalid Syntax
**Cause:** Incorrect expression  
**Fix:** Double‑check operators and quotes

---

## 8. Best Practices

- Keep conditions simple
- Always handle the false path
- Validate input before comparison
- Avoid deeply nested IF nodes
