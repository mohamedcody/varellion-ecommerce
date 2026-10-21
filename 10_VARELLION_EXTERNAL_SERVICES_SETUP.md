# VARELLION Accessories — External Services Setup & Verification

> **Document ID:** `10_VARELLION_EXTERNAL_SERVICES_SETUP.md`  
> **Version:** 1.0.0  
> **Status:** Setup checklist — accounts, credentials, origins, and production verification remain owner/team tasks  
> **Project:** VARELLION Accessories  
> **Technical authority:** file `08_VARELLION_BACKEND_DATABASE_SECURITY_SPEC.md` owns backend behavior and secret-handling requirements; this file tracks setup and evidence only.

---

## 1. Purpose and Safety Rules

This file records how to prepare and verify external services required by the approved release. It does **not** contain real passwords, API secrets, OAuth client secrets, database credentials, or production tokens.

**Never commit real credentials.** Keep values in local `.env` files ignored by Git and in the production hosting provider's secret manager. Do not paste secrets into AI prompts, issue trackers, screenshots, logs, frontend code, `NEXT_PUBLIC_*` variables, or Markdown documents.

Mark a service `READY` only after configuration has been applied to the intended environment and the verification test below has passed. Creating an account alone is not enough.

### Status vocabulary

- `NOT STARTED`
- `IN PROGRESS`
- `BLOCKED — OWNER ACTION`
- `CONFIGURED — NOT VERIFIED`
- `READY — VERIFIED IN [environment]`
- `NOT REQUIRED FOR APPROVED SCOPE`

## 2. Integration Inventory

| Service | Intended use | Current status | Must be true before claiming it is live |
|---|---|---|---|
| Cloudinary | Product image uploads and image asset metadata | `NOT STARTED / OWNER TO UPDATE` | Server-side credentials configured, upload constraints and access policy tested, asset metadata persisted, failure cleanup tested |
| Google OAuth / OIDC | Optional administrator Google sign-in, restricted to the pre-approved admin identity | `NOT STARTED / OWNER TO UPDATE` | Correct authorized origins/redirect URI, token validation, audience/issuer checks, admin allowlist, negative security tests |
| SMTP/mail provider | Password-reset link and related approved admin recovery flow | `NOT STARTED / OWNER TO UPDATE` | Sender/domain/provider configured, TLS and authentication verified, single-use expiring reset flow tested, secrets kept server-side |
| Frontend hosting/domain | Public website and canonical URL | `NOT SELECTED` | HTTPS, correct canonical URL, locale routing and environment configuration verified |
| Spring Boot hosting | Backend API | `NOT SELECTED` | HTTPS/reverse-proxy behavior, health checks, logs, environment secrets, CORS, cookies and CSRF verified |
| PostgreSQL hosting | Production database | `NOT SELECTED` | Secure connectivity, migration procedure, backup and restore verified |

Do not enable a feature in the UI while its status is not `READY — VERIFIED IN [environment]`.

## 3. Cloudinary Setup

### Owner/team tasks

1. Create or select the official VARELLION Cloudinary account and record who owns administrative access in the team's password manager.
2. Determine the account's usage/plan limits and image storage/transform needs before launch; do not assume a free quota will always be sufficient.
3. Create credentials appropriate for the backend upload design.
4. Add the configuration to the Spring Boot runtime's secret store, not to the frontend build.
5. Restrict allowed file types and maximum upload size in the application. Treat browser-provided MIME types and filenames as untrusted; verify content server-side.
6. Store Cloudinary asset ID, secure URL, and approved metadata in PostgreSQL, never the binary image itself.
7. Keep the storage provider behind the storage-service abstraction described in file `08`.

### Configuration names

Use the names in file `08` unless the actual repository deliberately defines a documented equivalent:

```text
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

All three values are backend-only. `CLOUDINARY_API_SECRET` must never be prefixed with `NEXT_PUBLIC_` or returned to the browser.

### Verification checklist

- [ ] Correct environment account and cloud name confirmed.
- [ ] Authenticated test upload succeeds in local/staging.
- [ ] Non-image, oversized, malformed, or disallowed files are rejected safely.
- [ ] API secret does not appear in frontend assets, logs, responses, or Git.
- [ ] Asset ID and secure URL are saved correctly.
- [ ] Failed database persistence or deletion scenarios do not leave uncontrolled orphaned assets.
- [ ] Image replacement/archival does not break historical orders or unrelated assets.

## 4. Google OAuth / OIDC for the Administrator

Google sign-in is only for the pre-approved administrator identity. It is not public registration and must never automatically grant ADMIN access to any Google account.

### Owner/team tasks

1. Register the intended web OAuth/OIDC client in the chosen Google project.
2. Register the exact development and production authorized origins and redirect URIs produced by the implemented authentication flow. Do not guess URLs before the hosting domain and callback route are known.
3. Store the client ID in the correct runtime configuration and any client secret only in the backend secret store when required by the selected OAuth flow.
4. Configure the one pre-approved administrator identity using the backend's explicit allowlist/bootstrap process.
5. Verify issuer, audience, token signature/expiry, and identity allowlist on the server according to file `08`.
6. Keep local, staging, and production OAuth clients/origins separate where appropriate.

### Configuration names

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET= # only if required by the chosen backend OAuth flow; server-only
```

The client ID is configuration, not proof that an account is authorized to administer the site. The allowlist and backend session creation are the authorization boundary.

### Verification checklist

- [ ] Approved admin identity can sign in in the intended environment.
- [ ] An unrelated Google account is denied admin access.
- [ ] Invalid, expired, wrong-audience, or wrong-issuer tokens are rejected.
- [ ] Callback and redirect URLs match the real deployed URLs exactly.
- [ ] Logout clears the server-managed session appropriately.
- [ ] No private client secret or admin session token appears in browser storage, logs, or Git.

## 5. SMTP / Email Provider for Password Recovery

The backend specification excludes email/SMS order notifications from v1 but plans expiring single-use password-reset links once a provider is configured. Do not build or advertise password recovery as operational before the backend flow is implemented and tested.

### Owner/team tasks

1. Choose a provider and confirm sender/domain requirements, authentication method, rate limits, and costs.
2. Configure verified sender identity and TLS/secure transport.
3. Add credentials to the backend environment or secret manager.
4. Implement generic, non-enumerating password-reset request responses, expiring single-use tokens, safe token storage, and a controlled recovery procedure as required by file `08`.
5. Do not log reset links or tokens. Never place reusable secrets in query logs or analytics.

### Configuration names

Use the names supported by the actual application; current names anticipated by file `08` are:

```text
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=
```

The exact sender address and provider are `NOT SELECTED`. Never add credentials to this document or to committed `.env.example` files.

### Verification checklist

- [ ] Sender/domain is verified with the selected provider.
- [ ] Email delivery works in staging and failure behavior is safe.
- [ ] Reset link expires and is single-use.
- [ ] Repeated requests are rate-limited and responses do not reveal whether an email account exists.
- [ ] Tokens and full reset links are not logged.
- [ ] Recovery does not bypass the administrator allowlist or other security checks.

## 6. Environment Variable Handling

The canonical configuration contract belongs in file `08` and must match the actual code. File `10` is a tracking guide, not a competing configuration source.

### Suggested `.env.example` shape

Use safe placeholder values only; actual variable names must match the application's configuration mapping.

```dotenv
SPRING_PROFILES_ACTIVE=local
DATABASE_URL=jdbc:postgresql://localhost:5432/varellion
DATABASE_USERNAME=replace-locally
DATABASE_PASSWORD=replace-locally
APP_PUBLIC_BASE_URL=http://localhost:3000
FRONTEND_ORIGINS=http://localhost:3000

CLOUDINARY_CLOUD_NAME=replace-locally
CLOUDINARY_API_KEY=replace-locally
CLOUDINARY_API_SECRET=replace-locally

GOOGLE_CLIENT_ID=replace-locally
GOOGLE_CLIENT_SECRET=replace-locally

MAIL_HOST=replace-locally
MAIL_PORT=587
MAIL_USER=replace-locally
MAIL_PASSWORD=replace-locally
MAIL_FROM=replace-locally

ORDER_RESERVATION_HOURS=24
LOW_STOCK_THRESHOLD=replace-locally
```

Important: `replace-locally` is an example placeholder, not a valid credential. `.env.example` is committed only if it contains no usable secrets; the actual `.env` must be in `.gitignore`. Adapt names and defaults to the real implementation. Do not expose any server secret to Next.js.

### Required repository checks

- [ ] `.env` and all environment-specific secret files are ignored by Git.
- [ ] No production secrets appear in history; rotate any secret that was accidentally committed.
- [ ] Frontend variables are limited to deliberately public values.
- [ ] Local, test, staging, and production settings/data are separated.
- [ ] Errors and health endpoints do not reveal secret values or connection strings.
- [ ] Startup fails safely when a required production secret is absent, rather than silently using a sample credential.

## 7. Deployment and Ownership Register

Update this register only with non-secret metadata. Do not put private keys, full credential values, reset URLs, passwords, or database connection strings here.

| Decision/record | Value | Owner | Status/date |
|---|---|---|---|
| Cloudinary account owner/reference | `NOT PROVIDED` | `NOT ASSIGNED` | `NOT STARTED` |
| Google Cloud project / OAuth client label | `NOT PROVIDED` | `NOT ASSIGNED` | `NOT STARTED` |
| Approved admin email (store only in the private operational config where appropriate; do not publish) | `NOT RECORDED HERE` | `OWNER` | `NEEDS SECURE CONFIGURATION` |
| Mail provider and verified sender | `NOT SELECTED` | `NOT ASSIGNED` | `NOT STARTED` |
| Frontend public domain | `NOT SELECTED` | `OWNER/TEAM` | `BLOCKED` |
| Backend hosting/runtime | `NOT SELECTED` | `OWNER/TEAM` | `BLOCKED` |
| PostgreSQL hosting and region | `NOT SELECTED` | `OWNER/TEAM` | `BLOCKED` |
| Backup retention and restore drill evidence | `NOT VERIFIED` | `OWNER/TEAM` | `BLOCKED BEFORE LAUNCH` |

## 8. Release Gates

### Milestone A — public storefront

Cloudinary, Google OAuth, and SMTP are not inherently required to build the public storefront. Do not delay unrelated Milestone A layout and browsing work because these accounts are not ready, but do not show fake products or unverified business claims.

### Milestone B — commerce and protected admin

Before claiming the relevant feature is ready:

- [ ] File `06` contains approved business data and purchase-model decision.
- [ ] File `04` records the approved admin route/locale strategy and file `09` UX requirements have been accepted.
- [ ] API contract and real backend implementation are aligned and tested.
- [ ] Cloudinary is verified before product image upload is enabled.
- [ ] Google OAuth is verified before its sign-in button is enabled.
- [ ] SMTP and password-reset workflow are verified before password recovery is enabled.
- [ ] Production host/domain, HTTPS, CORS, CSRF, secure cookies, and secret storage are verified.
- [ ] Required security, database migration, backup/restore, and production smoke tests passed.

Keep a record of the command/test, environment, date, and outcome for each claim of readiness. A local success does not prove production is configured.

> **Governing rule:** Configuration is not verification; an account is not an integration; and a visible button is not a working feature.
