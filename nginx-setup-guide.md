# Nginx Setup Guide for Custom Domain

This guide will help you configure nginx to serve your CtrlChecks frontend on your own domain with SSL/HTTPS support.

## Prerequisites

- A domain name (e.g., `yourdomain.com`)
- A server with nginx installed
- Docker (if using Docker deployment)
- Port 80 and 443 open in your firewall

## Step 1: Update nginx.conf

1. Open `ctrl_checks/nginx.conf`
2. Replace `YOUR_DOMAIN.com` with your actual domain name (3 occurrences)
3. Save the file

## Step 2: Set Up SSL Certificate (Let's Encrypt)

### Option A: Using Certbot (Recommended)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate (nginx will be automatically configured)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option B: Manual Certificate Setup

If you have your own SSL certificates:

1. Place your certificate files:
   - Certificate: `/etc/ssl/certs/yourdomain.com.crt`
   - Private Key: `/etc/ssl/private/yourdomain.com.key`

2. Update nginx.conf:
   ```nginx
   ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
   ssl_certificate_key /etc/ssl/private/yourdomain.com.key;
   ```

## Step 3: Deploy with Docker

### Build and Run

```bash
cd ctrl_checks

# Build the Docker image
docker build -t ctrlchecks-frontend .

# Run with nginx configuration
docker run -d \
  --name ctrlchecks-frontend \
  -p 80:80 \
  -p 443:443 \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  -v /var/www/certbot:/var/www/certbot:ro \
  -v $(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  ctrlchecks-frontend
```

### Using Docker Compose

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

Run:
```bash
docker-compose up -d
```

## Step 4: Configure DNS

Point your domain to your server's IP address:

- **A Record**: `yourdomain.com` → `YOUR_SERVER_IP`
- **A Record**: `www.yourdomain.com` → `YOUR_SERVER_IP`

Wait for DNS propagation (can take up to 48 hours, usually much faster).

## Step 5: Update Environment Variables

Update your frontend `.env` file:

```env
# Update public base URL to your domain
VITE_PUBLIC_BASE_URL=https://yourdomain.com

# Update API URLs if backend is on different domain
VITE_API_URL=https://api.yourdomain.com
# or
VITE_PYTHON_BACKEND_URL=https://api.yourdomain.com
```

Rebuild the frontend after updating environment variables:

```bash
npm run build
```

## Step 6: Verify Configuration

1. Test nginx configuration:
   ```bash
   sudo nginx -t
   ```

2. Reload nginx:
   ```bash
   sudo nginx -s reload
   # or if using Docker
   docker exec ctrlchecks-frontend nginx -s reload
   ```

3. Test your domain:
   - Visit `http://yourdomain.com` (should redirect to HTTPS)
   - Visit `https://yourdomain.com` (should load the app)

## Troubleshooting

### SSL Certificate Issues

- **Certificate not found**: Ensure certificate paths in nginx.conf match your actual certificate locations
- **Certificate expired**: Run `sudo certbot renew` to renew Let's Encrypt certificates

### 502 Bad Gateway

- Check if the frontend container is running: `docker ps`
- Check nginx error logs: `docker logs ctrlchecks-frontend`
- Verify the build output exists in `/usr/share/nginx/html`

### Domain Not Loading

- Verify DNS records are correct: `nslookup yourdomain.com`
- Check firewall allows ports 80 and 443
- Verify nginx is listening: `sudo netstat -tlnp | grep nginx`

### Mixed Content Warnings

- Ensure all API URLs use HTTPS
- Update `VITE_API_URL` and other backend URLs to use `https://`
- Check browser console for specific mixed content errors

## Security Best Practices

1. **Keep SSL certificates updated**: Set up automatic renewal for Let's Encrypt
2. **Regular updates**: Keep nginx and Docker images updated
3. **Firewall**: Only expose ports 80 and 443
4. **Monitor logs**: Regularly check nginx access and error logs
5. **Backup**: Keep backups of your nginx configuration

## Advanced Configuration

### Rate Limiting

Add to nginx.conf inside the `server` block:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of proxy configuration
}
```

### Custom Error Pages

```nginx
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;
```

### Logging

Customize log formats in nginx.conf:

```nginx
log_format custom '$remote_addr - $remote_user [$time_local] '
                  '"$request" $status $body_bytes_sent '
                  '"$http_referer" "$http_user_agent"';

access_log /var/log/nginx/ctrlchecks-access.log custom;
```

## Support

For issues or questions:
- Check nginx error logs: `/var/log/nginx/ctrlchecks-error.log`
- Check Docker logs: `docker logs ctrlchecks-frontend`
- Verify SSL certificate: `sudo certbot certificates`
