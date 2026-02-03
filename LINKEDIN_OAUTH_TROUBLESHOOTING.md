# LinkedIn OAuth 400 Error - Step-by-Step Fix

If you're getting `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`, follow these steps **in order**:

## ✅ Step-by-Step Verification

### Step 1: Verify You're in the Correct Supabase Project
1. Go to https://supabase.com/dashboard
2. Make sure you're in the project that matches your URL: `nvrrqvlqnnvlihtlgmzn.supabase.co`
3. Check the project name/ID matches

### Step 2: Open LinkedIn Configuration Panel
1. In Supabase Dashboard, go to: **Authentication** → **Providers**
2. Scroll down to find **"LinkedIn (OIDC)"**
3. **Click on the LinkedIn row** (click anywhere on the row, or the arrow on the right)
4. This opens the configuration panel

### Step 3: Verify Toggle is ON
- Look for **"LinkedIn enabled"** toggle
- It should be **GREEN/ON** (not gray)
- If it's gray, toggle it ON

### Step 4: Fill in API Key (Client ID) ⚠️ CRITICAL
1. Find the **"API Key"** field
2. Go to LinkedIn Developer Portal: https://www.linkedin.com/developers
3. Select your app → Go to **"Auth"** tab
4. Under **"Application credentials"**, copy the **Client ID**
5. Paste it into the **"API Key"** field in Supabase
6. ⚠️ **Make sure it's not empty!**

### Step 5: Fill in API Secret Key (Client Secret) ⚠️ CRITICAL
1. Find the **"API Secret Key"** field
2. In LinkedIn Developer Portal → **"Auth"** tab
3. Under **"Application credentials"**, click **"Show"** next to Client Secret
4. Copy the **Client Secret**
5. Paste it into the **"API Secret Key"** field in Supabase
6. ⚠️ **Make sure it's not empty!**

### Step 6: Save Configuration
1. Click **"Save"** button (if visible)
2. Or wait for auto-save (watch for a checkmark or success message)
3. **Wait 5-10 seconds** for Supabase to process

### Step 7: Verify Both Fields Are Still Filled
1. Refresh the page or close and reopen the LinkedIn configuration
2. Verify both **API Key** and **API Secret Key** still have values
3. If they're empty, fill them again and save

### Step 8: Check for Error Messages
- Look for any red error messages in the configuration panel
- Common errors:
  - "API Secret Key is required" → Fill in the secret key
  - "Invalid credentials" → Check that you copied correctly

### Step 9: Test Again
1. Go back to your app (`http://localhost:8081`)
2. Try connecting LinkedIn again
3. The error should be resolved

## 🔍 Common Issues

### Issue: Toggle is ON but still getting error
**Solution**: The credentials are missing. Even if toggle is ON, you MUST fill in both API Key and API Secret Key.

### Issue: Fields keep getting cleared
**Solution**: 
- Make sure you're clicking "Save" or waiting for auto-save
- Don't navigate away before saving
- Check if there are validation errors preventing save

### Issue: "API Secret Key is required" error
**Solution**: 
- The API Secret Key field is empty
- Fill it in with your LinkedIn Client Secret
- Make sure you're copying the **Client Secret**, not the Client ID again

### Issue: Wrong project
**Solution**: 
- Verify the Supabase project URL matches: `nvrrqvlqnnvlihtlgmzn.supabase.co`
- Make sure you're configuring LinkedIn in the correct project

## 📋 Quick Checklist

Before testing, verify:
- [ ] You're in the correct Supabase project
- [ ] LinkedIn toggle is ON (green)
- [ ] API Key (Client ID) is filled in
- [ ] API Secret Key (Client Secret) is filled in
- [ ] Configuration is saved
- [ ] No error messages in the panel
- [ ] Waited 5-10 seconds after saving

## 🆘 Still Not Working?

If you've verified all the above and still get the error:

1. **Try disabling and re-enabling**:
   - Turn LinkedIn toggle OFF
   - Save
   - Wait 5 seconds
   - Turn LinkedIn toggle ON
   - Fill in credentials again
   - Save

2. **Check LinkedIn App Status**:
   - Go to LinkedIn Developer Portal
   - Make sure your app is approved and active
   - Verify Client ID and Secret are correct

3. **Clear Browser Cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear cache completely

4. **Try Incognito/Private Window**:
   - Open your app in an incognito/private browser window
   - This rules out cache/cookie issues

5. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Logs
   - Look for any authentication errors

## 📞 Need More Help?

If none of the above works, check:
- Your Supabase project is active (not paused)
- You have the correct permissions in Supabase
- LinkedIn app is not in development mode restrictions
- Network/firewall isn't blocking the connection
