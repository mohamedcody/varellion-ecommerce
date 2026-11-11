# VARELLION — Feature Test Guide: Authentication & Session Management

**Feature:** Authentication, Session Lifecycle, and Security Controls  
**Package:** `com.varellion.store.security`  
**Base URL:** `{{baseUrl}}/api/auth`  
**Bruno Directory:** `bruno/01-authentication/`  
**Target Environment:** Local (`http://localhost:8080`) / Test Profile  

---

## 1. Feature Architecture & Contract Overview

The authentication module handles user sign-up, login, token rotation, and logout using stateless JSON Web Tokens (JJWT 0.12.6) coupled with secure, HTTP-Only cookies for refresh tokens.

### Key Implemented Guarantees:
* **Stateless Tokens:** Access tokens expire in 15 minutes (`900000ms`); Refresh tokens expire in 7 days (`604800000ms`).
* **Anti-Brute Force Account Lockout:** 5 consecutive failed login attempts lock the account for 15 minutes (`LockedException` ➔ HTTP `423 Locked`).
* **Anti-Enumeration Uniform Error:** `BadCredentialsException` always outputs `"Invalid username or password"`, preventing attackers from guessing whether an email exists.
* **Auto-Provisioning:** Registration and login automatically trigger `customerService.getOrCreateCustomerForUser()` ensuring a synchronized profile in `public.customers`.
* **Rate Limiting:** `RateLimitFilter` allows max 10 requests/minute per client IP on `/api/auth/login`.

---

## 2. Test Cases Specification

### TC-AUTH-01: User Registration — Happy Path
* **Test File:** `01-Register-Success.bru`
* **Endpoint:** `POST /api/auth/register`
* **Objective:** Verify that a new visitor can register with valid username, email, and password.
* **Test Type:** Positive / Functional
* **Risk/Requirement:** Core business entrypoint. Failure blocks customer onboarding.
* **Source Evidence:** `AuthController.java:39`, `AuthService.java:105`, `RegisterRequest.java`
* **Prerequisites:** Backend running (`http://localhost:8080`), active database.
* **Input:**
  ```json
  {
    "username": "{{dynUsername}}",
    "email": "{{dynEmail}}",
    "password": "{{testPassword}}"
  }
  ```
* **Expected Result:**
  * HTTP Status: `200 OK`
  * Response Body contains `accessToken`, `refreshToken`, `role: "USER"`, `message: "Registration successful"`.
  * Response Header includes `Set-Cookie` with `refresh_token; HttpOnly; SameSite=Lax; Path=/`.
* **Automated Assertions (Bruno):**
  * `res.status == 200`
  * `res.body.accessToken` is defined
  * `res.body.refreshToken` is defined
  * `res.body.role == "USER"`
* **Manual Checks:** Verify in Bruno console that `accessToken` and `refreshToken` environment variables are populated.
* **Limitations:** Does not verify external email verification inbox delivery (future feature).

---

### TC-AUTH-02: User Registration — Duplicate Email Conflict
* **Test File:** `02-Register-Duplicate-Email-Conflict.bru`
* **Endpoint:** `POST /api/auth/register`
* **Objective:** Verify that registering an already registered email is rejected.
* **Test Type:** Negative / Data Integrity
* **Risk/Requirement:** Prevents account hijacking and duplicate unique key violations in PostgreSQL.
* **Source Evidence:** `AuthService.java:109` (`userRepository.existsByEmail(email)`), `GlobalExceptionHandler.java:36`
* **Prerequisites:** An account with `{{testEmail}}` must already exist.
* **Expected Result:**
  * HTTP Status: `400 Bad Request`
  * Error Body: `error: "Bad Request"`, message: `"Email is already registered: ..."`
* **Automated Assertions (Bruno):**
  * `res.status == 400`
  * `res.body.error == "Bad Request"`
  * `res.body.message` contains `"already registered"`

---

### TC-AUTH-03: User Registration — Weak Password Validation
* **Test File:** `03-Register-Validation-Weak-Password.bru`
* **Endpoint:** `POST /api/auth/register`
* **Objective:** Verify that passwords with fewer than 8 characters are rejected by Bean Validation.
* **Test Type:** Security / Input Validation
* **Risk/Requirement:** OWASP requirement to enforce minimum credential length.
* **Source Evidence:** `RegisterRequest.java:19` (`@Size(min = 8, max = 100)`), `GlobalExceptionHandler.java:49`
* **Input:** `"password": "123"`
* **Expected Result:**
  * HTTP Status: `400 Bad Request`
  * Error Body: `error: "Validation Failed"`, `validationErrors.password` is defined.
* **Automated Assertions (Bruno):**
  * `res.status == 400`
  * `res.body.error == "Validation Failed"`
  * `res.body.validationErrors.password` is defined.

---

### TC-AUTH-04: User Registration — Invalid Email Format
* **Test File:** `04-Register-Validation-Invalid-Email.bru`
* **Endpoint:** `POST /api/auth/register`
* **Objective:** Verify that syntactically malformed email addresses are rejected.
* **Test Type:** Security / Input Validation
* **Source Evidence:** `RegisterRequest.java:12` (`@Email`), `GlobalExceptionHandler.java:49`
* **Input:** `"email": "not-an-email-address"`
* **Expected Result:**
  * HTTP Status: `400 Bad Request`
  * Error Body: `error: "Validation Failed"`, `validationErrors.email` is defined.
* **Automated Assertions (Bruno):**
  * `res.status == 400`
  * `res.body.validationErrors.email` is defined.

---

### TC-AUTH-05: User Login — Happy Path
* **Test File:** `05-Login-Success.bru`
* **Endpoint:** `POST /api/auth/login`
* **Objective:** Verify that a registered customer can log in with either email or username and obtain JWT tokens.
* **Test Type:** Positive / Core Security
* **Source Evidence:** `AuthController.java:29`, `AuthService.java:43`
* **Input:**
  ```json
  {
    "identifier": "{{testEmail}}",
    "password": "{{testPassword}}"
  }
  ```
* **Expected Result:**
  * HTTP Status: `200 OK`
  * Response Body contains `accessToken`, `refreshToken`, `email`, `role`, `message: "Login successful"`.
  * `refresh_token` set in HTTP-Only cookie.
* **Automated Assertions (Bruno):**
  * `res.status == 200`
  * `res.body.accessToken` is defined
  * `res.body.refreshToken` is defined
  * `res.body.message == "Login successful"`

---

### TC-AUTH-06: User Login — Invalid Password Security
* **Test File:** `06-Login-Invalid-Password.bru`
* **Endpoint:** `POST /api/auth/login`
* **Objective:** Verify that supplying an incorrect password fails with uniform 401 Unauthorized.
* **Test Type:** Security / Authentication Failure
* **Source Evidence:** `AuthService.java:62` (`passwordEncoder.matches`), `GlobalExceptionHandler.java:67`
* **Input:** `"password": "WrongPassword999!"`
* **Expected Result:**
  * HTTP Status: `401 Unauthorized`
  * Error Body: `message: "Invalid username or password"`
* **Automated Assertions (Bruno):**
  * `res.status == 401`
  * `res.body.message == "Invalid username or password"`

---

### TC-AUTH-07: User Login — Nonexistent User (Anti-Enumeration)
* **Test File:** `07-Login-Nonexistent-User.bru`
* **Endpoint:** `POST /api/auth/login`
* **Objective:** Verify that attempting to log in with an unknown email produces the EXACT same error as an invalid password.
* **Test Type:** Security / Information Disclosure Prevention
* **Risk/Requirement:** Prevents attackers from harvesting valid customer emails via login error differences.
* **Source Evidence:** `AuthService.java:47` (Uniform `BadCredentialsException`), `GlobalExceptionHandler.java:67`
* **Expected Result:**
  * HTTP Status: `401 Unauthorized`
  * Error Body: `message: "Invalid username or password"` (Identical to TC-AUTH-06).
* **Automated Assertions (Bruno):**
  * `res.status == 401`
  * `res.body.message == "Invalid username or password"`

---

### TC-AUTH-08: Token Refresh — Happy Path
* **Test File:** `08-Refresh-Token-Success.bru`
* **Endpoint:** `POST /api/auth/refresh`
* **Objective:** Verify that a valid refresh token issues a new access token without re-entering credentials.
* **Test Type:** Session Management / Token Rotation
* **Source Evidence:** `AuthController.java:59`, `AuthService.java:199`
* **Input:** `{"refreshToken": "{{refreshToken}}"}`
* **Expected Result:**
  * HTTP Status: `200 OK`
  * Response Body contains refreshed `accessToken` and `refreshToken`.
* **Automated Assertions (Bruno):**
  * `res.status == 200`
  * `res.body.accessToken` is defined
  * `res.body.refreshToken` is defined

---

### TC-AUTH-09: Token Refresh — Malformed Token Rejection
* **Test File:** `09-Refresh-Token-Invalid.bru`
* **Endpoint:** `POST /api/auth/refresh`
* **Objective:** Verify that a tampered or expired refresh token is rejected with 401 Unauthorized.
* **Test Type:** Security / Integrity
* **Source Evidence:** `AuthService.java:206`, `JwtService.java:107`
* **Input:** `{"refreshToken": "malformed.or.tampered.token.payload"}`
* **Expected Result:**
  * HTTP Status: `401 Unauthorized`
* **Automated Assertions (Bruno):**
  * `res.status == 401`

---

### TC-AUTH-10: Logout — Session Revocation
* **Test File:** `10-Logout-Success.bru`
* **Endpoint:** `POST /api/auth/logout`
* **Objective:** Verify that logging out immediately expires the refresh token cookie (`Max-Age=0`).
* **Test Type:** Session Lifecycle
* **Source Evidence:** `AuthController.java:77` (`buildRefreshTokenCookie("", 0)`)
* **Expected Result:**
  * HTTP Status: `200 OK`
  * Response Body: `{"message": "Logged out successfully"}`
  * Set-Cookie: `refresh_token=; Max-Age=0`
* **Automated Assertions (Bruno):**
  * `res.status == 200`
  * `res.body.message == "Logged out successfully"`
* **Post-Response Action:** Clears Bruno local `accessToken` and `refreshToken` environment variables.

---

### TC-AUTH-11: Google OAuth2 Login Verification
* **Test File:** `11-Google-Login-Verification.bru`
* **Endpoint:** `POST /api/auth/google`
* **Objective:** Verify Google Identity Provider authentication endpoint.
* **Test Type:** Integration / External Identity
* **Source Evidence:** `AuthController.java:49`, `AuthService.java:146`, `GoogleTokenVerifier.java`
* **External Verification Required:** Requires a live, freshly minted Google ID token from a frontend Google OAuth button.
* **Limitations:** Mocking Google ID token verification in Bruno alone is not feasible without a real Google client session.

---

### TC-AUTH-12: Rate Limiting & Anti-Brute Force Protection
* **Test File:** `12-Security-Rate-Limiter.bru`
* **Endpoint:** `POST /api/auth/login`
* **Objective:** Verify that rapid burst login attempts (>10 requests within 60s) trigger HTTP 429 Too Many Requests.
* **Test Type:** Security / DoS & Brute Force Defense
* **Source Evidence:** `RateLimitFilter.java:55`
* **Expected Result:**
  * Rapid firing in Bruno triggers HTTP `429 Too Many Requests` with retry headers.
