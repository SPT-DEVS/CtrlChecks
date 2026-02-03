# LinkedIn OAuth Integration Setup Guide

This guide will walk you through setting up LinkedIn OAuth integration so users can connect their LinkedIn accounts and perform LinkedIn operations in workflows.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Create LinkedIn App](#step-1-create-linkedin-app)
3. [Step 2: Configure LinkedIn App Settings](#step-2-configure-linkedin-app-settings)
4. [Step 3: Get LinkedIn Credentials](#step-3-get-linkedin-credentials)
5. [Step 4: Configure Supabase LinkedIn OAuth](#step-4-configure-supabase-linkedin-oauth)
6. [Step 5: Test the Integration](#step-5-test-the-integration)
7. [Troubleshooting](#troubleshooting)
8. [Required Permissions/Scopes](#required-permissionsscopes)

---

## Prerequisites

- A LinkedIn account with access to LinkedIn Developer Portal
- A Supabase project (your application is already using Supabase)
- Admin access to your Supabase dashboard
- **For local testing**: You can use your Supabase callback URL (no need for a custom domain)

---

## Step 1: Create LinkedIn App

1. **Go to LinkedIn Developer Portal**
   - Visit: https://www.linkedin.com/developers
   - Sign in with your LinkedIn account

2. **Create a New App**
   - Click **"Create app"** button
   - Fill in the required information:
     - **App name**: Your application name (e.g., "CtrlChecks")
     - **LinkedIn Page**: Select or create a LinkedIn Company Page (required)
     - **Privacy Policy URL**: 
       - ✅ **You can use your Supabase URL**: `https://YOUR_PROJECT_REF.supabase.co/privacy`
       - ✅ **Works for both local and production** (LinkedIn requires HTTPS)
       - ✅ Your app already has a privacy policy page at `/privacy`
       - Example: `https://nvrrqvlqnnvlihtlgmzn.supabase.co/privacy`
       - Or use your custom domain if you have one: `https://yourdomain.com/privacy`
     - **App logo**: Upload your app logo (optional but recommended)
   - Accept the LinkedIn API Terms of Use
   - Click **"Create app"**

3. **Verify Your App**
   - LinkedIn may require email verification
   - Check your email and verify your account if prompted

---

## Step 2: Configure LinkedIn App Settings

1. **Navigate to Auth Tab**
   - In your LinkedIn app dashboard, click on the **"Auth"** tab

2. **Add Redirect URLs**
   - Under **"Redirect URLs"**, click **"Add redirect URL"**
   - **For local testing and production**: Add your Supabase callback URL:
     ```
     https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
     ```
   - Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference
   - You can find your Supabase project reference in your Supabase dashboard URL or settings
   - **Example**: `https://nvrrqvlqnnvlihtlgmzn.supabase.co/auth/v1/callback`
   
   - ⚠️ **Important for local testing**: 
     - You only need the Supabase callback URL above (not localhost)
     - LinkedIn redirects to Supabase, which then redirects to your local app
     - Your local app's callback route (`http://localhost:5173/auth/linkedin/callback`) is handled automatically
     - The Supabase callback URL works for both local and production environments
   
   - Click **"Update"** to save

3. **Request Required Products**
   - Go to the **"Products"** tab
   - Request access to:
     - **Sign In with LinkedIn using OpenID Connect** (required for OAuth)
     - **Marketing Developer Platform** (for posting content)
   - Wait for approval (usually instant for basic products, may take time for advanced features)

---

## Step 3: Get LinkedIn Credentials

1. **Get Client ID and Client Secret**
   - Go back to the **"Auth"** tab
   - Under **"Application credentials"**, you'll see:
     - **Client ID**: Copy this value
     - **Client Secret**: Click **"Show"** and copy this value
   - ⚠️ **Important**: Keep these credentials secure and never commit them to version control

2. **Note Your Callback URL**
   - The callback URL you'll use in Supabase is:
     ```
     https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
     ```
   - This is the same URL you added in Step 2

---

## Step 4: Configure Supabase LinkedIn OAuth

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to: **Authentication** → **Providers**

2. **Enable LinkedIn Provider** ⚠️ **CRITICAL STEP**
   - Scroll down to find **"LinkedIn"** in the providers list
   - Toggle **"LinkedIn enabled"** to **ON** (should turn green)
   - ⚠️ **This is required!** If this is not enabled, you'll get error: "Unsupported provider: provider is not enabled"
   - Make sure the toggle is actually ON (green), not just visible

3. **Enter LinkedIn Credentials**
   - **API Key**: Paste your LinkedIn **Client ID** here
   - **API Secret Key**: Paste your LinkedIn **Client Secret** here
   - ⚠️ Make sure there are no extra spaces or characters

4. **Configure Additional Settings**
   - **Allow users without an email**: 
     - Leave this **OFF** (unchecked) if you require email addresses
     - Turn it **ON** if you want to allow users without email addresses
   - **Callback URL**: 
     - This is automatically generated by Supabase
     - It should match: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
     - Copy this URL - you'll need it for LinkedIn redirect URLs if you haven't added it yet

5. **Save Configuration**
   - Click **"Save"** or the configuration will auto-save
   - You should see a success message

---

## Step 5: Test the Integration

### For Local Development

**Yes, you can use the Supabase URL for local testing!** Here's how it works:

1. **OAuth Flow for Local Testing**:
   - User clicks "Connect" in your local app (e.g., `http://localhost:8081`)
   - App calls Supabase OAuth which redirects to: `https://yourproject.supabase.co/auth/v1/authorize?provider=linkedin&redirect_to=...`
   - **This Supabase URL** handles the OAuth initiation and redirects you to LinkedIn
   - User is redirected to LinkedIn for authorization (you'll see LinkedIn's login/consent page)
   - After approving, LinkedIn redirects to **Supabase callback URL** (e.g., `https://yourproject.supabase.co/auth/v1/callback`)
   - Supabase handles the OAuth token exchange
   - Supabase redirects back to your **local app's callback route** (`http://localhost:8081/auth/linkedin/callback`)
   - Your app saves the tokens and shows "Connected"

2. **What the Authorization URL Does**:
   - The URL `https://nvrrqvlqnnvlihtlgmzn.supabase.co/auth/v1/authorize?provider=linkedin&...` is **normal and expected**
   - This is Supabase's OAuth authorization endpoint
   - It will automatically redirect you to LinkedIn's login page
   - You should see LinkedIn's authorization screen asking you to approve permissions
   - **This is the correct flow!** Just follow the prompts

2. **What You Need**:
   - ✅ Supabase callback URL in LinkedIn redirect URLs (already configured in Step 2)
   - ✅ Your local app running (e.g., `npm run dev`)
   - ✅ Supabase credentials configured in your `.env` file
   - ❌ **You do NOT need** to add `localhost` URLs to LinkedIn redirect URLs

### Testing Steps

1. **Start Your Application**
   - Make sure your frontend application is running locally (e.g., `npm run dev`)
   - Ensure your Supabase connection is properly configured in `.env`

2. **Test LinkedIn Connection**
   - Log in to your application
   - Navigate to the **Workflows** page or wherever the **Connections** button is located
   - Click the **"Connections"** button (purple button with plug icon)
   - In the **Integrations** popup, you should see:
     - **LinkedIn** section showing "Not connected"
     - A **"Connect"** button next to LinkedIn

3. **Connect LinkedIn Account**
   - Click the **"Connect"** button next to LinkedIn
   - You should be redirected to LinkedIn's authorization page
   - Sign in to LinkedIn if prompted
   - Review and approve the permissions requested
   - Click **"Allow"** to authorize

4. **Verify Connection**
   - After authorization, you should be redirected back to your application
   - The LinkedIn status should now show **"Connected"** with a green checkmark
   - You should see a success toast notification

5. **Test LinkedIn Operations**
   - Create a workflow with a LinkedIn node
   - Configure the LinkedIn node (you shouldn't need to manually enter an access token)
   - Run the workflow to test LinkedIn operations (e.g., create a post)

---

## Troubleshooting

### Issue: "Unsupported provider: provider is not enabled" (Error 400)

**This is the most common error!** Even if LinkedIn shows as "Enabled" in Supabase, you might still get this error if credentials are missing.

**Solutions:**

1. **Check if Credentials are Filled In** ⚠️ **MOST IMPORTANT**
   - Go to Supabase Dashboard → **Authentication** → **Providers** → **LinkedIn**
   - Click on the LinkedIn row to open the configuration panel
   - **Verify BOTH fields are filled:**
     - ✅ **API Key** (Client ID) - Must have a value
     - ✅ **API Secret Key** (Client Secret) - Must have a value
   - ⚠️ **Even if the toggle is ON, if these fields are empty, you'll get this error!**

2. **Enter/Update Credentials**
   - **API Key**: Paste your LinkedIn **Client ID** from LinkedIn Developer Portal
   - **API Secret Key**: Paste your LinkedIn **Client Secret** from LinkedIn Developer Portal
   - Make sure there are **no extra spaces** before or after the values
   - Make sure you're copying the **Client Secret**, not the Client ID again

3. **Save Configuration**
   - Click **"Save"** button (if visible)
   - Or wait for auto-save (usually happens automatically)
   - Look for a success message or check mark

4. **Verify the Toggle is ON**
   - The **"LinkedIn enabled"** toggle should be **green/ON**
   - If it's gray/OFF, toggle it ON

5. **Wait a Few Seconds**
   - Sometimes Supabase needs a moment to process the configuration
   - Wait 5-10 seconds after saving

6. **Clear Browser Cache (if still not working)**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache and try again

7. **Double-Check LinkedIn App Configuration**
   - Go to LinkedIn Developer Portal → Your App → **Auth** tab
   - Verify your **Client ID** and **Client Secret** are correct
   - Make sure the redirect URL is added: `https://nvrrqvlqnnvlihtlgmzn.supabase.co/auth/v1/callback`

8. **Try Again**
   - Go back to your app and try connecting LinkedIn again
   - The error should be resolved

### Issue: "LinkedIn OAuth error" or "Failed to initiate LinkedIn authentication"

**Solutions:**
- Verify that LinkedIn OAuth is enabled in Supabase (see above)
- Check that Client ID and Client Secret are correct (no extra spaces)
- Ensure the redirect URL in LinkedIn matches your Supabase callback URL exactly
- Check browser console for detailed error messages

### Issue: "Redirect URI mismatch"

**Solutions:**
- Go to LinkedIn Developer Portal → Auth tab
- Verify the redirect URL is exactly: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- Make sure there are no trailing slashes or typos
- Update the redirect URL in LinkedIn if needed

### Issue: "Invalid client credentials"

**Solutions:**
- Double-check that you copied the Client ID and Client Secret correctly
- Make sure you're using the Client Secret (not the Client ID) in the "API Secret Key" field
- Regenerate the Client Secret in LinkedIn if needed (this will invalidate the old one)

### Issue: "Insufficient permissions" or "Scope not granted"

**Solutions:**
- Verify you've requested the required products in LinkedIn Developer Portal
- Check that the scopes requested match what's needed:
  - `openid` - For OpenID Connect authentication
  - `profile` - For basic profile information
  - `email` - For email access
  - `w_member_social` - For posting to personal profile
  - `w_organization_social` - For posting to company pages
- Re-authorize the connection if you've updated scopes

### Issue: "Token not found" when running workflows

**Solutions:**
- Verify the connection was successful (check Connections panel)
- Check that tokens are being saved in the `linkedin_oauth_tokens` table
- Ensure the user who created the workflow has connected their LinkedIn account
- Try disconnecting and reconnecting LinkedIn

### Issue: LinkedIn posts not working

**Solutions:**
- Verify you have the correct permissions (`w_member_social` for personal, `w_organization_social` for company)
- Check that you're using the correct Organization ID (URN) for company page posts
- Ensure your LinkedIn app has been approved for Marketing Developer Platform access
- Check the workflow execution logs for specific error messages

---

## Required Permissions/Scopes

The application requests the following LinkedIn OAuth scopes:

- **`openid`**: Required for OpenID Connect authentication
- **`profile`**: Access to basic profile information
- **`email`**: Access to user's email address
- **`w_member_social`**: Permission to post content to personal LinkedIn profile
- **`w_organization_social`**: Permission to post content to LinkedIn company pages

### Additional Permissions (if needed)

If you need additional LinkedIn features, you may need to request:
- **`r_organization_social`**: Read organization posts and analytics
- **`r_liteprofile`**: Read basic profile information (legacy)
- **`r_basicprofile`**: Read basic profile information (legacy)

---

## Security Best Practices

1. **Never commit credentials to version control**
   - Use environment variables or Supabase secrets
   - Keep Client Secret secure

2. **Use HTTPS in production**
   - LinkedIn requires HTTPS for OAuth callbacks
   - Ensure your Supabase project uses HTTPS

3. **Regularly rotate credentials**
   - Regenerate Client Secret periodically
   - Update Supabase configuration when credentials change

4. **Monitor OAuth usage**
   - Check LinkedIn Developer Portal for API usage
   - Monitor Supabase logs for authentication issues

5. **Implement proper error handling**
   - The application already handles token refresh and expiration
   - Monitor for authentication failures

---

## Next Steps

After setting up LinkedIn OAuth:

1. **Test all LinkedIn operations** in your workflows:
   - Create personal posts
   - Create company page posts
   - Retrieve posts
   - Get engagement metrics

2. **Document for your users**:
   - How to connect their LinkedIn accounts
   - What permissions are required
   - How to use LinkedIn nodes in workflows

3. **Monitor usage**:
   - Track successful connections
   - Monitor API rate limits
   - Check for any authentication issues

---

## Support Resources

- **LinkedIn Developer Documentation**: https://learn.microsoft.com/en-us/linkedin/
- **LinkedIn OAuth Guide**: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
- **Supabase Auth Documentation**: https://supabase.com/docs/guides/auth
- **Supabase OAuth Providers**: https://supabase.com/docs/guides/auth/social-login/auth-linkedin

---

## Quick Reference Checklist

- [ ] Created LinkedIn app in Developer Portal
- [ ] Added redirect URL to LinkedIn app
- [ ] Requested required products (Sign In with LinkedIn, Marketing Developer Platform)
- [ ] Copied Client ID and Client Secret
- [ ] Enabled LinkedIn provider in Supabase
- [ ] Entered Client ID in Supabase "API Key" field
- [ ] Entered Client Secret in Supabase "API Secret Key" field
- [ ] Verified callback URL matches in both places
- [ ] Tested connection from application
- [ ] Verified tokens are saved in database
- [ ] Tested LinkedIn workflow operations

---

**Last Updated**: 2024
**Version**: 1.0
