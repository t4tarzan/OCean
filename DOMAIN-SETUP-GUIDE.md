# 🌐 OCEAN Domain Setup Guide

**Domain:** ocdevide.com  
**Registrar:** Namecheap  
**Server IP:** 77.42.44.61  
**Date:** January 11, 2026

---

## 📋 Namecheap DNS Configuration

### Step 1: Login to Namecheap
1. Go to https://namecheap.com
2. Login to your account
3. Go to "Domain List"
4. Click "Manage" next to ocdevide.com

### Step 2: Configure DNS Records

Go to **Advanced DNS** tab and add these records:

#### **A Records (Point to Server IP):**
```
Type    Host              Value           TTL
----    ----              -----           ---
A       @                 77.42.44.61     Automatic
A       www               77.42.44.61     Automatic
A       dashboard         77.42.44.61     Automatic
A       api               77.42.44.61     Automatic
A       docs              77.42.44.61     Automatic
A       dev               77.42.44.61     Automatic
A       staging           77.42.44.61     Automatic
```

#### **CNAME Records (Optional - for future use):**
```
Type    Host              Value                   TTL
----    ----              -----                   ---
CNAME   *.dev             dev.ocdevide.com        Automatic
```

### Step 3: Nameservers
**Keep Namecheap's default nameservers:**
- dns1.registrar-servers.com
- dns2.registrar-servers.com

### Step 4: Save Changes
- Click "Save All Changes"
- DNS propagation takes 5-30 minutes (usually faster)

---

## 🗺️ Domain Structure

### **Production URLs:**
```
https://ocdevide.com              → Main landing page (future)
https://www.ocdevide.com          → Same as above
https://dashboard.ocdevide.com    → OCEAN Dashboard (port 3100)
https://api.ocdevide.com          → API Proxy (port 3001)
https://docs.ocdevide.com         → Documentation (future)
```

### **Development URLs:**
```
https://dev.ocdevide.com          → Development dashboard
https://staging.ocdevide.com      → Staging environment
```

### **Direct Access (Fallback):**
```
http://77.42.44.61:3100           → Dashboard (no SSL)
http://77.42.44.61:3001           → API Proxy (no SSL)
```

---

## 🔧 Server Configuration Needed

### 1. **Install Nginx** (Reverse Proxy)
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. **Install Certbot** (SSL Certificates)
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 3. **Configure Firewall**
```bash
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw reload
```

### 4. **Nginx Configuration Files**

#### **Dashboard: /etc/nginx/sites-available/dashboard.ocdevide.com**
```nginx
server {
    listen 80;
    server_name dashboard.ocdevide.com;

    location / {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **API: /etc/nginx/sites-available/api.ocdevide.com**
```nginx
server {
    listen 80;
    server_name api.ocdevide.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **Main Site: /etc/nginx/sites-available/ocdevide.com**
```nginx
server {
    listen 80;
    server_name ocdevide.com www.ocdevide.com;

    location / {
        return 301 https://dashboard.ocdevide.com$request_uri;
    }
}
```

### 5. **Enable Sites**
```bash
sudo ln -s /etc/nginx/sites-available/dashboard.ocdevide.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.ocdevide.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/ocdevide.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. **Get SSL Certificates**
```bash
# Wait for DNS propagation (5-30 minutes)
# Then run:
sudo certbot --nginx -d dashboard.ocdevide.com
sudo certbot --nginx -d api.ocdevide.com
sudo certbot --nginx -d ocdevide.com -d www.ocdevide.com

# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run
```

---

## ✅ Verification Steps

### 1. **Check DNS Propagation**
```bash
# From your local machine:
nslookup dashboard.ocdevide.com
nslookup api.ocdevide.com

# Should return: 77.42.44.61
```

### 2. **Test HTTP (before SSL)**
```bash
curl http://dashboard.ocdevide.com
curl http://api.ocdevide.com
```

### 3. **Test HTTPS (after SSL)**
```bash
curl https://dashboard.ocdevide.com
curl https://api.ocdevide.com
```

### 4. **Browser Test**
- Visit https://dashboard.ocdevide.com
- Should see OCEAN Dashboard with green padlock
- Visit https://api.ocdevide.com/health
- Should see API health status

---

## 🔒 Security Enhancements

### 1. **Update NextAuth Configuration**
```bash
# In /opt/ocean/admin-panel/.env
NEXTAUTH_URL=https://dashboard.ocdevide.com
```

### 2. **Update API Proxy CORS**
```javascript
// In services/api-proxy/src/index.ts
app.use(cors({
  origin: ['https://dashboard.ocdevide.com', 'http://localhost:3100'],
  credentials: true
}));
```

### 3. **Force HTTPS Redirect**
Already configured in Nginx after Certbot runs.

---

## 📊 Environment-Based Routing

### **Production:**
- Dashboard: https://dashboard.ocdevide.com
- API: https://api.ocdevide.com
- Users: user001-050@ocean.dev

### **Development:**
- Dashboard: https://dev.ocdevide.com (port 3200)
- API: https://dev.ocdevide.com/api (port 3002)
- Users: dev001-050@ocean.dev

### **Staging:**
- Dashboard: https://staging.ocdevide.com (port 3300)
- API: https://staging.ocdevide.com/api (port 3003)
- Users: staging001-050@ocean.dev

---

## 🚀 Deployment Workflow

### **Current (Phase 1):**
```
1. Development on local/server
2. Push to Git
3. Deploy to production (dashboard.ocdevide.com)
```

### **Future (Phase 2+):**
```
1. Development → dev.ocdevide.com
2. Testing → staging.ocdevide.com
3. Production → dashboard.ocdevide.com
```

---

## 📝 Update Required Files

### 1. **Dashboard .env**
```bash
NEXTAUTH_URL=https://dashboard.ocdevide.com
NEXTAUTH_SECRET=<existing-secret>
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=OceanSecure2026!DB
NEO4J_URI=bolt://localhost:7687
NEO4J_PASSWORD=OceanNeo4j2026!
REDIS_URL=redis://localhost:6379
```

### 2. **API Proxy .env**
```bash
PORT=3001
DATABASE_URL=postgresql://ocean_user:OceanSecure2026!DB@localhost:5432/ocean_db
ALLOWED_ORIGINS=https://dashboard.ocdevide.com,http://localhost:3100
```

### 3. **Update README.md**
```markdown
## Access

- **Dashboard:** https://dashboard.ocdevide.com
- **API:** https://api.ocdevide.com
- **Server:** 77.42.44.61
```

---

## 🔄 SSL Certificate Renewal

### **Automatic Renewal:**
Certbot sets up automatic renewal via systemd timer:
```bash
# Check renewal status
sudo systemctl status certbot.timer

# Manual renewal test
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal
```

Certificates auto-renew 30 days before expiration.

---

## 🐛 Troubleshooting

### **DNS Not Resolving:**
```bash
# Check DNS propagation
dig dashboard.ocdevide.com
nslookup dashboard.ocdevide.com 8.8.8.8

# Wait 5-30 minutes for propagation
```

### **Nginx Errors:**
```bash
# Check Nginx status
sudo systemctl status nginx

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

### **SSL Certificate Issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew specific domain
sudo certbot renew --cert-name dashboard.ocdevide.com

# Check Let's Encrypt logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### **Port Not Accessible:**
```bash
# Check if service is running
sudo netstat -tlnp | grep 3100
sudo netstat -tlnp | grep 3001

# Check firewall
sudo ufw status

# Check Nginx proxy
curl http://localhost:3100
```

---

## 📈 Next Steps

### **Immediate (Today):**
1. ✅ Configure Namecheap DNS (you do this)
2. ⏳ Wait for DNS propagation (5-30 min)
3. ⏳ Install Nginx on server
4. ⏳ Configure Nginx reverse proxy
5. ⏳ Get SSL certificates with Certbot
6. ⏳ Update .env files
7. ⏳ Test HTTPS access

### **Short-term (This Week):**
1. Set up dev.ocdevide.com environment
2. Set up staging.ocdevide.com environment
3. Configure CI/CD pipeline
4. Add monitoring (Uptime Robot, etc.)

### **Medium-term (Next Week):**
1. Create landing page for ocdevide.com
2. Set up docs.ocdevide.com
3. Add custom error pages
4. Implement rate limiting
5. Set up backup domain

---

## ✅ Summary

**What You Need to Do in Namecheap:**

1. Go to Advanced DNS
2. Add A records for:
   - @ → 77.42.44.61
   - www → 77.42.44.61
   - dashboard → 77.42.44.61
   - api → 77.42.44.61
   - dev → 77.42.44.61
   - staging → 77.42.44.61
   - docs → 77.42.44.61
3. Save changes
4. Wait 5-30 minutes

**What I'll Do on Server:**
1. Install Nginx
2. Configure reverse proxy
3. Get SSL certificates
4. Update environment variables
5. Test everything

After DNS propagates, your dashboard will be accessible at:
**https://dashboard.ocdevide.com** 🎉

---

**Status:** 🟡 Waiting for DNS Configuration  
**Next:** Configure Namecheap DNS, then I'll set up the server
