# VARELLION — Production Deployment & Infrastructure Audit

**Audit Phase:** Phases Nine & Ten — Production Deployment Discovery & Architecture Proposal  
**Audit Date:** 2026-11-04  
**Auditor:** Senior DevOps Engineer & Software Architect  
**Scope:** Containerization, CI/CD, Production Configuration, Reverse Proxy, SSL, Supabase Pooler, Database Migrations, Multi-Stage Dockerization  

---

## 1. Ground-Truth Discovery of Existing Infrastructure

An exhaustive scan across the repository was conducted to identify existing deployment, containerization, and automation files.

### 1.1 Discovery Inventory

| Infrastructure Artifact | Expected Location | Actual Status in Repository | Verified Evidence |
|---|---|---|---|
| **Frontend Dockerfile** | `frontend/Dockerfile` or `Dockerfile.frontend` | **MISSING** | `find . -name "*Dockerfile*"` yielded zero application Dockerfiles (only vendored in `_references/`). |
| **Backend Dockerfile** | `backend/Dockerfile` or `Dockerfile.backend` | **MISSING** | Zero application Dockerfiles exist. |
| **Docker Compose** | `docker-compose.yml` or `compose.yaml` | **MISSING** | Zero compose manifests exist in project root. |
| **CI/CD Pipelines** | `.github/workflows/*.yml` | **MISSING** | `.github` directory does not exist in root. |
| **Reverse Proxy Config** | `nginx.conf` or `Caddyfile` | **MISSING** | Zero reverse proxy configurations exist. |
| **Deployment Scripts** | `deploy.sh` or similar | **MISSING** | Only `check_db.sh` exists in root. |
| **Frontend Env Template** | `frontend/.env.example` | **EXISTING & VERIFIED** | [frontend/.env.example](file:///home/mohamed-saad/Desktop/BRAND/frontend/.env.example) |
| **Backend Configuration**| `backend/src/main/resources/application.properties` | **EXISTING & VERIFIED** | Configured with environment variable placeholders for port, datasource, JWT, CORS. |
| **Database Migrations** | `backend/src/main/resources/db/migration/` | **EXISTING & VERIFIED** | 11 Flyway migration files (V1 through V11) present and passing. |

### 1.2 Verdict on Current Operational State
**The project is currently operated purely in a local development environment.**  
Developers run:
- Frontend: `npm run dev` (Node.js/Next.js development server on port 3000).
- Backend: `mvn spring-boot:run` (Spring Boot development daemon on port 8080).

**Running development servers (`next dev` or `mvn spring-boot:run`) in a public customer-facing production environment is strictly prohibited** due to high memory overhead, un-minified bundles, lack of restart policies, and potential information disclosure.

---

## 2. Production Runtime Verification

### 2.1 Frontend Verification
- **Production Build (`npm run build`):**
  - **Verdict:** **READY FOR BUILD**.
  - All 13 routes compile cleanly. Next.js App Router prerenders static marketing pages and server-renders dynamic routes.
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL`: Correctly isolated.
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Public browser identifier.
  - **Security Rule Maintained:** Zero private secrets (database passwords, JWT secret) are referenced in frontend bundles.

### 2.2 Backend Verification
- **Java 21 Runtime:** Runs cleanly on OpenJDK 21. `pom.xml` targets Java 17 bytecode compatibility, allowing seamless deployment on Java 17 or Java 21 containers.
- **Supabase Cloud Pooler (Port 6543):**
  - HikariCP pool settings in `application.properties:20-27` were recently tuned for cloud pooler stability:
    ```properties
    spring.datasource.hikari.maximum-pool-size=10
    spring.datasource.hikari.minimum-idle=2
    spring.datasource.hikari.idle-timeout=60000
    spring.datasource.hikari.max-lifetime=120000
    spring.datasource.hikari.keepalive-time=30000
    spring.datasource.hikari.connection-timeout=10000
    spring.datasource.hikari.validation-timeout=3000
    ```
  - This prevents connection drops when idle, resolving transaction aborts during checkout.
- **Actuator & Error Sanitization:**
  - `management.endpoints.web.exposure.include=health,info` (Restricted).
  - `management.endpoint.health.show-details=never` (Prevents system reconnaissance).
  - `server.error.include-stacktrace=never` (Suppresses stacktraces from leaking in HTTP responses).

### 2.3 Database Migration Safety
- **Flyway Migrations (`db/migration/V1..V11`):**
  - Schema changes are append-only.
  - `spring.jpa.hibernate.ddl-auto=validate` guarantees that Hibernate never alters or drops database tables dynamically at startup.

---

## 3. Production Deployment Architecture Proposal

### 3.1 Recommended Production Stack
For a cost-effective, maintainable, and high-performance launch:

```mermaid
flowchart TB
    Client[Browser / Customer Mobile Device] -->|HTTPS :443| Nginx[Nginx Reverse Proxy / SSL Termination]
    
    subgraph Host["Production VPS (e.g., Ubuntu 24.04 LTS)"]
        Nginx -->|/api/* & /actuator/*| SpringBoot["Spring Boot 3.3.4 (Jar Container) :8080"]
        Nginx -->|/* (Storefront & Assets)| NextJS["Next.js 15 Standalone (Node Container) :3000"]
    end
    
    SpringBoot -->|SSL Port 6543| Supabase["Supabase Cloud Managed PostgreSQL"]
```

### 3.2 Proposed Production Dockerization

#### A. Backend Multi-Stage Dockerfile (`backend/Dockerfile`):
```dockerfile
# Stage 1: Build JAR with Maven & Eclipse Temurin JDK 21
FROM maven:3.9.8-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal Distroless / Temurin JRE 21 Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=builder /app/target/varellion-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

#### B. Frontend Multi-Stage Dockerfile (`frontend/Dockerfile`):
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Runner (Standalone output)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1
CMD ["node", "server.js"]
```

#### C. Production Docker Compose (`compose.prod.yml`):
```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      - SERVER_PORT=8080
      - SPRING_DATASOURCE_URL=${SPRING_DATASOURCE_URL}
      - SPRING_DATASOURCE_USERNAME=${SPRING_DATASOURCE_USERNAME}
      - SPRING_DATASOURCE_PASSWORD=${SPRING_DATASOURCE_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
    networks:
      - internal-net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
      - NEXT_PUBLIC_USE_MOCK_API=false
    networks:
      - internal-net

  proxy:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
      - frontend
    networks:
      - internal-net

networks:
  internal-net:
    driver: bridge
```

---

## 4. Unknown Information Required From Project Owner

Per the mandatory execution rules (**UNKNOWN — DO NOT ASSUME**), the following infrastructure facts cannot be determined from code and must be supplied by the project owner:

1. **Target Production Server / Cloud Provider:** (e.g., Hetzner Cloud, AWS EC2, DigitalOcean Droplet, Railway, or VPS).
2. **Production Domain Name & DNS Registrar:** (e.g., `varellion.com` or `varellionstore.com`).
3. **SSL/TLS Certificate Authority:** (e.g., Let's Encrypt Certbot or Cloudflare Origin CA).
4. **Production Google Cloud Console Authorized JavaScript Origins:** Must add the production domain to authorized redirect URIs.
5. **SMTP / Email Gateway Credentials:** If customer email confirmation receipts are desired.

**Strict Security Rule:** Never commit actual passwords, private keys, or credentials into repository files or Docker images.
