# Setting Up ngrok Authentication

## Error: ngrok 334 - Authentication Required

ngrok now requires a free account. Here's how to set it up:

## Step 1: Sign Up for Free ngrok Account

1. Go to: **https://dashboard.ngrok.com/signup**
2. Sign up with your email (it's free)
3. Verify your email if required

## Step 2: Get Your Authtoken

1. After signing up, go to: **https://dashboard.ngrok.com/get-started/your-authtoken**
2. Copy your authtoken (it looks like: `2abc123def456ghi789jkl012mno345pq_6r7s8t9u0v1w2x3y4z5`)

## Step 3: Configure ngrok

Run this command in PowerShell (replace `YOUR_AUTHTOKEN` with your actual token):

```powershell
ngrok config add-authtoken YOUR_AUTHTOKEN
```

## Step 4: Run ngrok

```powershell
ngrok http 8080
```

## Step 5: Get Your Public URL

1. Open browser: **http://localhost:4040**
2. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
3. Use in LinkedIn app:
   - **Privacy Policy URL**: `https://abc123.ngrok.io/privacy`
   - **Website URL**: `https://abc123.ngrok.io`

## Quick Command Summary

```powershell
# 1. Configure authtoken (one time only)
ngrok config add-authtoken YOUR_AUTHTOKEN

# 2. Start ngrok tunnel
ngrok http 8080

# 3. Check dashboard for URL
# Open: http://localhost:4040
```

## Alternative: Use localtunnel (No Account Required)

If you don't want to sign up for ngrok:

```powershell
# Install localtunnel
npm install -g localtunnel

# Expose port 8080
lt --port 8080
```

This will give you a URL like: `https://abc123.loca.lt`
