# LinkedIn OAuth Quick Reference

## Quick Setup Steps

### 1. LinkedIn Developer Portal
- Go to: https://www.linkedin.com/developers
- Create app → Fill details → Get **Client ID** and **Client Secret**

### 2. LinkedIn App Configuration
- **Auth Tab** → Add Redirect URL:
  ```
  https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
  ```
  - ✅ **Works for both local and production** (no need for localhost URLs)
  - Supabase handles OAuth, then redirects to your app
- **Products Tab** → Request:
  - Sign In with LinkedIn using OpenID Connect
  - Marketing Developer Platform

### 3. Supabase Configuration
- **Authentication** → **Providers** → **LinkedIn**
- Enable: **ON**
- API Key: Paste **Client ID**
- API Secret Key: Paste **Client Secret**
- Save

### 4. Test
- Open app → Connections → Connect LinkedIn
- Authorize → Should show "Connected"

---

## Required Scopes
```
openid profile email w_member_social w_organization_social
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Redirect URI mismatch | Verify URL matches exactly in LinkedIn app |
| Invalid credentials | Check Client ID/Secret, no extra spaces |
| Token not found | Reconnect LinkedIn account |
| Insufficient permissions | Request required products in LinkedIn |

---

## Callback URL Format
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

**Find your project ref**: Check Supabase dashboard URL or settings

---

## Support
- Full Guide: `LINKEDIN_OAUTH_SETUP_GUIDE.md`
- LinkedIn Docs: https://learn.microsoft.com/en-us/linkedin/
- Supabase Auth: https://supabase.com/docs/guides/auth
