# Exposing Localhost for LinkedIn OAuth Testing

## Quick Solution: Use ngrok

### Step 1: Install ngrok
1. Download from: https://ngrok.com/download
2. Extract the executable
3. Or install via package manager:
   ```powershell
   # Using Chocolatey (if installed)
   choco install ngrok
   
   # Or download directly from ngrok.com
   ```

### Step 2: Start your frontend
```powershell
cd ctrl_checks
npm run dev
# Your app should be running on http://localhost:8080
```

### Step 3: Expose with ngrok
```powershell
# In a new terminal/PowerShell window
ngrok http 8080
```

### Step 4: Copy the public URL
ngrok will give you a URL like:
```
https://abc123def456.ngrok.io
```

### Step 5: Use in LinkedIn App
- **Privacy Policy URL**: `https://abc123def456.ngrok.io/privacy`
- **Website URL**: `https://abc123def456.ngrok.io`

**Note**: The ngrok URL changes each time you restart ngrok (free tier). For production, use your actual domain.

## Alternative: Use a Temporary Public URL Service

### Option A: localtunnel
```powershell
npm install -g localtunnel
lt --port 8080
```

### Option B: serveo.net
```powershell
ssh -R 80:localhost:8080 serveo.net
```

## For Production
When ready for production:
- Deploy your app to a hosting service (Vercel, Netlify, etc.)
- Use your production domain: `https://yourdomain.com/privacy`
