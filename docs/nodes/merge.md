# Merge Node — User Guide

## 1. Node Overview

### What Is the Merge Node?
The Merge node combines data from two or more workflow branches into a single output. It is typically used after IF, Switch, or parallel paths to bring data back together so the workflow can continue as one.

### What Problems It Solves
- Re-joins split workflows
- Combines results from multiple nodes
- Handles parallel execution outputs
- Prevents duplicated workflow steps

### Common Real‑World Use Cases
- Merge True & False paths from an IF node
- Combine data from multiple APIs
- Join user data with transaction data
- Collect results from parallel processing
- Consolidate success and failure results

---

## 2. Prerequisites

Before using the Merge node:
- At least two input connections are connected
- Data exists on each incoming path (unless you handle missing inputs in your flow)

No credentials or authentication required.

---

## 3. How the Merge Node Works (Simple Explanation)

1. Waits for data from multiple inputs  
2. Combines data using the selected merge mode  
3. Outputs the merged result as one stream  

---

## 4. Input Fields – Detailed Explanation (Core Section)

The Merge node has **two** input fields.

### 4.1 Mode
**Description:** How incoming data is combined.  
**Required:** Yes  

**Supported Values**
- Merge Objects
- Append to Array
- Key‑based Merge
- Wait All
- Concatenate Arrays

**How to choose**
- **Merge Objects** → combine fields into one object  
- **Append to Array** → collect items into a list  
- **Key‑based Merge** → merge matching records by a key  
- **Wait All** → wait for all inputs before continuing  
- **Concatenate Arrays** → join arrays together  

---

### 4.2 Merge Key
**Description:** Field used when Mode = Key‑based Merge.  
**Required:** Only for Key‑based Merge  
**Example:** `id`

**How to get this value**
- Inspect previous node output
- Choose a field common to all inputs

---

## 5. Example Configurations

### Example 1: Merge IF True & False Paths
**Mode:** Append to Array  
**Result:** All data continues to the next node

---

### Example 2: Merge by User ID
**Mode:** Key‑based Merge  
**Merge Key:** `user_id`

**Input 1**
```
{ "user_id": 1, "name": "Alex" }
```

**Input 2**
```
{ "user_id": 1, "orders": 5 }
```

**Output**
```
{ "user_id": 1, "name": "Alex", "orders": 5 }
```

---

## 6. Output Explanation

The Merge node outputs:
- Combined data object or list
- Original fields from all inputs
- Execution metadata

---

## 7. Common Errors & Fixes

### Data Overwritten
**Cause:** Same field names in Merge Objects  
**Fix:** Use Key‑based Merge or rename fields earlier

### Null Values
**Cause:** Uneven input sizes in array merges  
**Fix:** Use Append to Array instead

### No Output
**Cause:** One input never runs  
**Fix:** Ensure all branches execute or use a different flow

---

## 8. Best Practices

- Choose the simplest merge strategy
- Use Append for unrelated data
- Use Key‑based merge for related data
- Name input connections clearly
