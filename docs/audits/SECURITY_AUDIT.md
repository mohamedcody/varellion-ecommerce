# VARELLION — Security & Production Risk Audit

**Audit Phase:** Phase Eleven — Application Security & Threat Modeling Audit  
**Audit Date:** 2026-11-04  
**Auditor:** Senior Security Architect & DevOps Engineer  
**Scope:** Authentication, Authorization, JWT Lifecycle, Session Management, CORS, CSRF, IDOR, Rate Limiting, Input Validation, Sensitive Data Handling  
**Standard:** OWASP Top 10 (2021), ASVS Level 2, Spring Security Hardening Standards  

---

## 1. Executive Security Verdict

The VARELLION application implements strong foundational security architecture (stateless JWT authentication with in-memory access tokens, HttpOnly refresh cookies, IDOR-resistant `@AuthenticationPrincipal` controllers, parameterized SQL queries via Hibernate JPA, strict CSP/HSTS headers, and in-memory IP rate limiting).

However, **several actionable security vulnerabilities and configuration risks were discovered that must be remediated prior to a public production launch**, most notably Next.js wildcard image SSRF exposure, dual-exposure of refresh tokens in JSON bodies, and lack of order submission idempotency.

---

## 2. Severity Classification & Finding Matrix

| Finding ID | Severity | Category | Affected Location | Summary |
|---|---|---|---|---|
| **SEC-01** | **HIGH** | SSRF / Resource Exhaustion | `frontend/next.config.ts:9` | Wildcard remote image pattern (`hostname: '**'`) allows proxying arbitrary external domains. |
| **SEC-02** | **MEDIUM** | Credential Exposure | `backend/.../AuthController.java:36` | Refresh token returned in JSON body alongside HttpOnly cookie, exposing it to client scripts. |
| **SEC-03** | **MEDIUM** | Secret Governance | Root `client_secret_*.json` | Raw Google OAuth client secret JSON file resides in repository workspace root. |
| **SEC-04** | **MEDIUM** | Business Logic / Double-Spend | `backend/.../OrderController.java:31` | `POST /api/orders` lacks an `Idempotency-Key` check, allowing duplicate order creation on network retries. |
| **SEC-05** | **LOW** | Rate Limiter Scalability | `backend/.../RateLimitFilter.java:31` | Rate limiting uses in-memory `ConcurrentHashMap`; will not synchronize across clustered backend nodes. |

---

## 3. Deep-Dive Security Analysis by Threat Category

### 3.1 Authentication & JWT Lifecycle
- **Access Tokens:**
  - **Generation:** `JwtTokenProvider.java` issues HS256 JWTs using `jwt.secret` (requires ≥256-bit key from environment).
  - **Lifetime:** 15 minutes (`jwt.expiration=900000ms`), minimizing window of exposure if intercepted.
  - **Storage:** Held exclusively in React memory state (`AuthContext.tsx:28`), **never written to localStorage or sessionStorage**.
- **Refresh Tokens:**
  - **Lifetime:** 7 days (`jwt.refresh-expiration=604800000ms`).
  - **Cookie Security (`AuthController.java:86-94`):**
    ```java
    ResponseCookie.from("refresh_token", token)
        .httpOnly(true)
        .secure(cookieSecure)
        .path("/")
        .maxAge(7 * 24 * 60 * 60)
        .sameSite("Lax")
        .build();
    ```
  - **Vulnerability (SEC-02):** In `login()`, `register()`, `googleLogin()`, and `refreshToken()`, `response.getRefreshToken()` is included in the JSON response body (`ResponseEntity.ok().body(response)`). Any third-party script, browser extension, or XSS flaw could read the token from JSON, completely defeating the purpose of the HttpOnly flag.
  - **Remediation:** Remove `refreshToken` from the client-facing `AuthResponse` DTO and rely 100% on the HttpOnly cookie.

### 3.2 Authorization & IDOR (Insecure Direct Object Reference)
- **Customer Profile (`CustomerController.java`):**
  - All operations (`GET /profile`, `PUT /profile`, `PUT /address`, `DELETE /address`) derive identity from `@AuthenticationPrincipal UserDetails userDetails`.
  - **Result:** **ZERO IDOR VULNERABILITY**. A customer cannot view or alter another customer's profile by manipulating URL parameters.
- **Order Retrieval (`OrderController.java:56-63`):**
  - `GET /api/orders/{orderNumber}` calls `orderService.getCustomerOrderByNumber(userDetails.getUsername(), orderNumber)`.
  - The repository query verifies ownership (`o.customer.userId = :customerId AND o.orderNumber = :orderNumber`).
  - **Result:** **ZERO IDOR VULNERABILITY**. Unauthorized users receive HTTP 404.
- **Guest Tracking (`GuestOrderLookupController.java:35-42`):**
  - Requires two independent factors: `orderNumber` AND registered `customerPhone`.
  - Phone numbers are normalized and matched against database records. Mismatches return generic 404 without leaking order existence.

### 3.3 Rate Limiting & Brute-Force Protection
- **Implementation (`RateLimitFilter.java`):**
  - Sliding-window in-memory bucket based on client IP.
  - Limits:
    - `/api/auth/**`: 20 requests/minute (preventing credential stuffing).
    - `/api/orders/lookup` & `/api/orders/track`: 15 requests/minute (preventing phone number enumeration).
  - Account lockout: `AuthService.java` locks a user account for 15 minutes after 5 consecutive failed login attempts (`User.failedAttempts >= 5`).
  - **Limitation (SEC-05):** In-memory tracking works well for single-instance deployments, but requires a Redis backing store if the backend is horizontally scaled behind a load balancer.

### 3.4 Server-Side Request Forgery (SSRF) & Remote Images (SEC-01)
- **Vulnerability:** `frontend/next.config.ts:6-15`:
  ```ts
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // WILDCARD MATCHING ALL HOSTS!
      },
    ],
  }
  ```
- **Risk:** Next.js uses its internal server endpoint `/_next/image?url=...` to optimize remote images. Allowing `hostname: '**'` turns Next.js into an open web proxy. Attackers can pass internal IP ranges (e.g. `http://169.254.169.254` or internal microservices) or force the server to download multi-gigabyte files, causing Denial of Service.
- **Remediation:** Whitelist only approved CDN hostnames:
  ```ts
  remotePatterns: [
    { protocol: 'https', hostname: 'images.unsplash.com' },
    { protocol: 'https', hostname: '*.supabase.co' }
  ]
  ```

### 3.5 CORS & CSRF Defense
- **CORS (`CorsConfig.java`):**
  - Binds strictly to `FRONTEND_URL` environment variable (`http://localhost:3000,http://127.0.0.1:3000`).
  - Wildcard origins (`*`) are disallowed when `allowCredentials(true)` is enabled.
- **CSRF:**
  - Disabled in `SecurityConfig.java:37` because the API is stateless. Refresh cookie uses `SameSite=Lax`, preventing third-party cross-site POST requests.

### 3.6 Secret Governance & Workspace Hygiene (SEC-03)
- An active Google Cloud client secret file (`client_secret_1003559537454-*.json`) exists in the project root directory.
- While `.gitignore` may prevent git commits, having unencrypted secret files in the working directory violates zero-trust principles.
- **Action:** Move Google Cloud secrets to environment variables (`GOOGLE_CLIENT_SECRET`) and delete raw JSON credential files from the disk.

---

## 4. Prioritized Security Remediation Action Plan

1. **[P0] Restrict Next.js Image Hostname Wildcard:**
   - Modify `frontend/next.config.ts` to replace `hostname: '**'` with explicit CDN domains (`images.unsplash.com`, Supabase storage).
2. **[P0] Sanitize AuthResponse Refresh Token:**
   - Remove `refreshToken` from `AuthResponse.java` JSON output so it is only transmitted via the HttpOnly cookie.
3. **[P1] Remove Local Google OAuth Client Secret File:**
   - Delete `client_secret_*.json` from the repository working tree and ensure variables are injected via `.env`.
4. **[P1] Implement Idempotency-Key Header on Order Submission:**
   - Add in-memory idempotency check (TTL 15 mins) on `POST /api/orders` to prevent double-charging and duplicate order records.
