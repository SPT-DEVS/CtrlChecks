# Deployment Checklist for ctrlckecks.ai

## ✅ Completed Steps

- [x] Nginx configuration updated with domain `ctrlckecks.ai`
- [x] SSL certificate paths configured for Let's Encrypt

## 📋 Remaining Steps

### 1. Update Environment Variables

Run the helper script:
```powershell
.\scripts\update-env-for-domain.ps1 -Domain "ctrlckecks.ai"
```

Or manually update `.env` file:
```env
VITE_PUBLIC_BASE_URL=https://ctrlckecks.ai
```

### 2. Configure DNS Records

Point your domain to your server's IP address:

- **A Record**: `ctrlckecks.ai` → `YOUR_SERVER_IP`
- **A Record**: `www.ctrlckecks.ai` → `YOUR_SERVER_IP`

Wait for DNS propagation (usually 5-30 minutes, can take up to 48 hours).

### 3. Build Frontend

```powershell
npm run build
```

This creates the production build in the `dist/` directory.

### 4. Set Up SSL Certificate

**On your server**, run:

```bash
# Install certbot (if not already installed)
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d ctrlckecks.ai -d www.ctrlckecks.ai

# Test auto-renewal
sudo certbot renew --dry-run
```

### 5. Deploy with Docker

**Option A: Using Docker directly**

```bash
# Build the image
docker build -t ctrlchecks-frontend .

# Run the container
docker run -d \
  --name ctrlchecks-frontend \
  -p 80:80 \
  -p 443:443 \
  -v $(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  -v /var/www/certbot:/var/www/certbot:ro \
  --restart unless-stopped \
  ctrlchecks-frontend
```

**Option B: Using Docker Compose**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ctrlchecks-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
    restart: unless-stopped
```

Then run:
```bash
docker-compose up -d
```

### 6. Verify Deployment

1. **Test HTTP redirect**:
   - Visit `http://ctrlckecks.ai` (should redirect to HTTPS)

2. **Test HTTPS**:
   - Visit `https://ctrlckecks.ai` (should load the app)

3. **Check SSL**:
   - Verify SSL certificate is valid
   - Check security headers are present

4. **Test SPA routing**:
   - Navigate to different routes to ensure they work

### 7. Update Backend URLs (if needed)

If your backend API is on a different domain or subdomain, update:

```env
VITE_API_URL=https://api.ctrlckecks.ai
# or
VITE_PYTHON_BACKEND_URL=https://api.ctrlckecks.ai
```

## 🔧 Troubleshooting

### SSL Certificate Issues

- **Certificate not found**: Ensure certificate paths in nginx.conf match Let's Encrypt paths
- **Certificate expired**: Run `sudo certbot renew` to renew
- **ACME challenge fails**: Ensure port 80 is open and DNS is properly configured

### 502 Bad Gateway

- Check if container is running: `docker ps`
- Check nginx logs: `docker logs ctrlchecks-frontend`
- Verify build output exists: `docker exec ctrlchecks-frontend ls -la /usr/share/nginx/html`

### Domain Not Loading

- Verify DNS: `nslookup ctrlckecks.ai`
- Check firewall: Ensure ports 80 and 443 are open
- Check nginx: `docker exec ctrlchecks-frontend nginx -t`

### Mixed Content Warnings

- Ensure all API URLs use HTTPS
- Update `VITE_API_URL` and backend URLs to use `https://`
- Check browser console for specific errors

## 📝 Notes

- SSL certificates from Let's Encrypt expire every 90 days
- Set up automatic renewal: `sudo certbot renew --dry-run`
- Keep nginx and Docker images updated
- Monitor logs regularly: `docker logs -f ctrlchecks-frontend`

## 🔗 Useful Commands

```bash
# View nginx logs
docker logs ctrlchecks-frontend

# Test nginx configuration
docker exec ctrlchecks-frontend nginx -t

# Reload nginx
docker exec ctrlchecks-frontend nginx -s reload

# Check SSL certificate
sudo certbot certificates

# Renew SSL certificate manually
sudo certbot renew
```
