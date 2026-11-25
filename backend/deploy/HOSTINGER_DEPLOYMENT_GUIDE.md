# VARELLION — Hostinger VPS Backend Production Deployment Guide

> **Target Architecture:** Standalone Spring Boot 3.3.4 (Java 21) REST Backend with Nginx Reverse Proxy on Hostinger VPS  
> **API Subdomain:** `https://api.<YOUR_DOMAIN>`  
> **Target OS:** Ubuntu 22.04 / 24.04 LTS  
> **Container Engine:** Docker & Docker Compose v2  

---

## 1. Architecture Overview

```
                                  Internet
                                     │
                                     ▼ HTTPS (443) / HTTP (80)
                       [Hostinger VPS (Ubuntu Linux)]
                       ┌────────────────────────────┐
                       │ UFW Firewall: 22, 80, 443  │
                       │                            │
                       │  Docker: varellion-backend │
                       │  ┌───────────────────────┐ │
                       │  │ Nginx (api.domain)    │ │
                       │  │ - TLS / Certbot       │ │
                       │  │ - Rate Limiting IP    │ │
                       │  │ - /actuator/health    │ │
                       │  └───────────┬───────────┘ │
                       │              │ Port 8080   │
                       │              ▼ (internal)  │
                       │  ┌───────────────────────┐ │
                       │  │ Spring Boot 3.3.4     │ │
                       │  │ - OpenJDK 21 Runtime  │ │
                       │  │ - HikariCP (Pool: 10) │ │
                       │  │ - Non-Root (appuser)  │ │
                       │  └───────────┬───────────┘ │
                       └──────────────┼─────────────┘
                                      │ TLS (JDBC) :6543
                                      ▼
                        [Supabase PostgreSQL 17]
```

---

## 2. Phase 1 — VPS Initial Preparation

Connect to your Hostinger VPS via SSH:
```bash
ssh root@<YOUR_HOSTINGER_VPS_IP>
```

### 1.1 Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw apt-transport-https ca-certificates gnupg lsb-release
```

### 1.2 Install Docker Engine & Docker Compose
```bash
# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable Docker on boot
sudo systemctl enable --now docker
```

### 1.3 Configure UFW Firewall
```bash
# Default policies: Deny incoming, allow outgoing
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (Port 22), HTTP (Port 80), and HTTPS (Port 443)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable Firewall
sudo ufw --force enable
sudo ufw status verbose
```
> ⚠️ **Note:** Port 8080 is intentionally **NOT** opened in UFW. Spring Boot communicates strictly within the internal Docker bridge network (`172.28.0.0/24`) and is exposed exclusively through Nginx.

---

## 3. Phase 2 — DNS Configuration

In your DNS provider (Hostinger DNS Zone / Cloudflare / Namecheap):
* Create an **A Record**:
  * **Type:** `A`
  * **Name / Host:** `api` (resolves to `api.<YOUR_DOMAIN>`)
  * **IPv4 Address:** `<YOUR_HOSTINGER_VPS_IP>`
  * **TTL:** Automatic or 300 seconds

Verify DNS propagation before configuring SSL:
```bash
dig +short api.<YOUR_DOMAIN>
# Should return your Hostinger VPS IP address
```

---

## 4. Phase 3 — SSL / TLS Certificate Automation

Install Certbot on the host to obtain a free, auto-renewing Let's Encrypt certificate:
```bash
sudo apt install -y certbot

# Obtain certificate via standalone mode (ensure port 80 is temporarily free)
sudo certbot certonly --standalone -d api.<YOUR_DOMAIN> --agree-tos -m admin@<YOUR_DOMAIN> --non-interactive
```

Certificates will be generated at:
* `/etc/letsencrypt/live/api.<YOUR_DOMAIN>/fullchain.pem`
* `/etc/letsencrypt/live/api.<YOUR_DOMAIN>/privkey.pem`

Set up automatic renewal cron:
```bash
sudo systemctl enable certbot.timer
```

---

## 5. Phase 4 — Deploying the Backend Application

### 5.1 Create Directory Structure
```bash
sudo mkdir -p /opt/varellion-backend
cd /opt/varellion-backend
```

### 5.2 Transfer Backend Files
Copy the following files from this repository to `/opt/varellion-backend/` on your VPS:
* `backend/Dockerfile`
* `backend/pom.xml`
* `backend/src/` (Entire source code)
* `backend/deploy/compose.prod.yml`
* `backend/deploy/nginx.conf`
* `backend/deploy/.env.production.example` (Rename to `.env`)

### 5.3 Configure Production Environment (`.env`)
```bash
cp .env.production.example .env
nano .env
```
Fill in the real production values:
* `SPRING_DATASOURCE_URL`: Supabase pooler URL (`sslmode=require&prepareThreshold=0`)
* `SPRING_DATASOURCE_USERNAME`: `postgres.<YOUR_PROJECT_REF>`
* `SPRING_DATASOURCE_PASSWORD`: Supabase database password
* `JWT_SECRET`: Base64 256-bit+ random secret (`openssl rand -base64 64`)
* `FRONTEND_URL`: URL of your deployed Next.js frontend (e.g. `https://varellion.luxury`)
* `GOOGLE_CLIENT_ID`: Google OAuth Client ID
* `ADMIN_EMAILS`: Authorized administrator email(s)

Secure the `.env` file permissions:
```bash
chmod 600 .env
```

---

## 6. Phase 5 — Starting the Services

Run Docker Compose to build and start the containers in detached mode:
```bash
docker compose -f compose.prod.yml up -d --build
```

### Verify Service Status
```bash
docker compose -f compose.prod.yml ps
```
Both `varellion-backend-prod` and `varellion-backend-proxy` should show state `Up (healthy)`.

---

## 7. Phase 6 — Verification & Health Checks

### 7.1 Local Health Check
```bash
curl -I http://localhost/actuator/health
# Expected: HTTP/1.1 200 OK
# Body: {"status":"UP"}
```

### 7.2 Remote Domain Health Check
```bash
curl -I https://api.<YOUR_DOMAIN>/actuator/health
# Expected: HTTP/1.1 200 OK
```

### 7.3 Public Catalog API Verification
```bash
curl -s https://api.<YOUR_DOMAIN>/api/categories | head -n 20
```

### 7.4 Security Sanity Check (Actuator Shield)
```bash
curl -I https://api.<YOUR_DOMAIN>/actuator/env
# Expected: HTTP/1.1 404 Not Found (Blocked by Nginx & Actuator exposure settings)
```

---

## 8. Phase 7 — Maintenance, Updates & Rollback

### 8.1 View Real-Time Logs
```bash
# Backend Spring Boot logs:
docker compose -f compose.prod.yml logs -f backend

# Nginx access & error logs:
docker compose -f compose.prod.yml logs -f proxy
```

### 8.2 Zero-Downtime Code Update Procedure
```bash
cd /opt/varellion-backend

# 1. Pull latest code or copy updated src/
git pull origin main

# 2. Rebuild backend image
docker compose -f compose.prod.yml build backend

# 3. Graceful in-place restart
docker compose -f compose.prod.yml up -d --no-deps backend

# 4. Confirm health
docker compose -f compose.prod.yml ps
```

### 8.3 Rollback Procedure
If a regression occurs after deploying a new version:
```bash
# Revert to previous Git commit or tag
git checkout <PREVIOUS_STABLE_TAG_OR_COMMIT>

# Rebuild and restart
docker compose -f compose.prod.yml up -d --build backend
```
