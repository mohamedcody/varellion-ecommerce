# Frontend API Integration & Resilient Customer Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, secure, and production-grade frontend integration between Next.js 15 and the Spring Boot backend covering customer profile management, delivery address syncing, token lifecycle with silent 401 refresh queuing, and seamless checkout prefill.

**Architecture:** A layered frontend architecture where `api.ts` provides a central HTTP interceptor managing memory-only access tokens and single-flight token refresh queues; domain services (`customer.ts`, `auth.ts`) expose typed endpoints; `AuthContext` synchronizes in-memory session state; and React components (`/profile`, `CheckoutForm`, `Header`) deliver responsive, RTL-native luxury UI with instant validation feedback.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5.8, Tailwind CSS 4, Lucide React, Vitest 5, React Testing Library.

**Spec:** Documented contracts from `docs/testing/BACKEND_TEST_INVENTORY.md` and feature guides in `docs/testing/features/`.

---

## Global Constraints

- **Security Floor:** Access tokens MUST remain strictly in memory (`AuthContext` / API closure) and NEVER be written to `localStorage`, `sessionStorage`, or plain client cookies.
- **Refresh Token Transport:** Refresh tokens are exclusively handled via HttpOnly cookies using `credentials: 'include'` on all fetch requests.
- **Concurrency & Replay Safety:** When a 401 occurs, multiple concurrent requests MUST queue and await a single `POST /api/auth/refresh` flight rather than firing duplicate refresh calls.
- **RTL & Egyptian Localization:** Egyptian phone numbers are validated against `^$|^01[0125][0-9]{8}$` (11 digits); address governorates match Egyptian zones; all copy is natural, luxury Arabic.
- **Zero Hydration Mismatches:** Client-only auth checks must be guarded with explicit hydration flags or skeleton loaders.
- **Type Rigor:** `npm run type-check` and `npm run test` must pass with zero errors after every task.

---

## Review Focus

1. **Concurrent 401 Thundering Herd:** When three API calls fire simultaneously after an access token expires, all three must succeed without firing more than one refresh request.
2. **Expired Refresh Token Graceful Degeneracy:** When silent refresh returns a 401/403, the client must clear in-memory state, reject queued promises cleanly, and redirect to `/login?redirect=...` without an infinite loop.
3. **Checkout Address Override vs. Sync:** When an authenticated customer modifies their shipping address during checkout, it must allow one-off shipping without altering their saved profile unless "حفظ كعنوان شحن افتراضي" is checked.
4. **Validation Error Mapping:** Backend `400 Bad Request` responses containing `validationErrors` map must accurately bind to individual form inputs in Arabic.
5. **Delete Address Confirmation & UI State:** Deleting the saved delivery address must optimistically/cleanly clear the UI and prevent phantom address cards on page reload.

---

## File Structure

```text
frontend/src/
├── services/
│   ├── api.ts                       (Modify: add token hooks, single-flight refresh queue, timeout)
│   ├── customer.ts                  (Create: customer profile & address CRUD API calls)
│   └── __tests__/
│       ├── api.test.ts              (Create: unit tests for interceptor & refresh queue)
│       └── customer.test.ts         (Create: unit tests for customer service)
├── lib/
│   └── validations/
│       ├── customer.ts              (Create: profile & address validation helpers)
│       └── __tests__/
│           └── customer.test.ts     (Create: validation unit tests)
├── context/
│   └── AuthContext.tsx              (Modify: bind accessToken to api.ts, expose refresh hook)
├── components/
│   ├── auth/
│   │   ├── AuthGuard.tsx            (Create: protected route wrapper with luxury skeleton)
│   │   └── __tests__/
│   │       └── AuthGuard.test.tsx   (Create: unit tests for route protection)
│   ├── profile/
│   │   ├── PersonalInfoCard.tsx     (Create: full name and Egyptian phone form)
│   │   ├── DeliveryAddressCard.tsx  (Create: delivery address card with edit & delete modal)
│   │   └── DeleteAddressDialog.tsx  (Create: confirmation dialog for address deletion)
│   ├── checkout/
│   │   └── CheckoutForm.tsx         (Modify: auto-prefill from customer profile & save address checkbox)
│   └── layout/
│       └── Header.tsx               (Modify: add account menu/profile link when authenticated)
└── app/
    └── profile/
        ├── page.tsx                 (Create: customer account profile dashboard)
        └── __tests__/
            └── page.test.tsx        (Create: unit tests for profile dashboard)
```

---

## Tasks

### Task 1: Resilient API Interceptor & Single-Flight Refresh Queue

**Files:**
- Modify: `frontend/src/services/api.ts`
- Create: `frontend/src/services/__tests__/api.test.ts`

**Interfaces:**
- Consumes: `ApiError`, `ApiResponse<T>`, `buildEndpointUrl` from `frontend/src/services/api.ts`.
- Produces: `setAccessTokenGetter(fn: () => string | null)`, `setOnAuthExpired(fn: () => void)`, `requestApi<T>(endpoint, options)`.

- [ ] **Step 1: Write the failing test for single-flight refresh queue**

```typescript
// frontend/src/services/__tests__/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestApi, setAccessTokenGetter, setOnAuthExpired, ApiError } from '../api';

describe('requestApi interceptor & refresh queue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('injects Authorization Bearer header when token getter returns token', async () => {
    setAccessTokenGetter(() => 'valid-mock-token');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: 'ok' }),
    });
    global.fetch = mockFetch;

    await requestApi('/test-endpoint');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-mock-token',
        }),
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- frontend/src/services/__tests__/api.test.ts`
Expected: FAIL (getter functions not exported or not injected)

- [ ] **Step 3: Implement token getter and queued silent refresh in `frontend/src/services/api.ts`**

Implement:
1. `let tokenGetter: (() => string | null) | null = null;`
2. `let authExpiredHandler: (() => void) | null = null;`
3. Export `setAccessTokenGetter(fn: () => string | null)` and `setOnAuthExpired(fn: () => void)`.
4. Inject `Authorization: Bearer ${token}` if `tokenGetter?.()` returns a token.
5. In `requestApi`:
   - Add `AbortSignal.timeout(10000)` fallback for network timeouts.
   - On `res.status === 401`:
     - If request was `/auth/refresh` or `/auth/login`, throw `ApiError`.
     - Otherwise, check `isRefreshing` boolean.
     - If not refreshing, set `isRefreshing = true` and call `requestApi<AuthResponse>('/auth/refresh', { method: 'POST' })`.
     - Replay all pending queue subscribers with new token.
     - If refresh fails, call `authExpiredHandler?.()` and reject pending requests.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- frontend/src/services/__tests__/api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/api.ts frontend/src/services/__tests__/api.test.ts
git commit -m "feat(api): implement single-flight silent refresh queue and token injection interceptor"
```

---

### Task 2: Customer Service & Validation Module

**Files:**
- Create: `frontend/src/services/customer.ts`
- Create: `frontend/src/lib/validations/customer.ts`
- Create: `frontend/src/services/__tests__/customer.test.ts`
- Create: `frontend/src/lib/validations/__tests__/customer.test.ts`

**Interfaces:**
- Consumes: `requestApi` from `frontend/src/services/api.ts`.
- Produces:
  - `customerService.getProfile(): Promise<Customer>`
  - `customerService.updateProfile(payload: { fullName: string; phoneNumber?: string }): Promise<Customer>`
  - `customerService.saveAddress(payload: CustomerAddress): Promise<CustomerAddress>`
  - `customerService.deleteAddress(): Promise<{ success: boolean; message: string }>`
  - `validateProfile(values: { fullName: string; phoneNumber?: string }): Record<string, string>`
  - `validateAddress(values: CustomerAddress): Record<string, string>`

- [ ] **Step 1: Write failing tests for validation logic and customer service**

```typescript
// frontend/src/lib/validations/__tests__/customer.test.ts
import { describe, it, expect } from 'vitest';
import { validateProfile, validateAddress } from '../customer';

describe('Customer Profile Validation', () => {
  it('validates Egyptian mobile numbers correctly', () => {
    expect(validateProfile({ fullName: 'أحمد علي', phoneNumber: '01012345678' })).toEqual({});
    expect(validateProfile({ fullName: 'أحمد علي', phoneNumber: '12345' }).phoneNumber).toBeDefined();
    expect(validateProfile({ fullName: 'أحمد علي', phoneNumber: '01412345678' }).phoneNumber).toBeDefined();
    expect(validateProfile({ fullName: 'أحمد علي', phoneNumber: '' })).toEqual({});
  });

  it('enforces full name length constraints (3-150 chars)', () => {
    expect(validateProfile({ fullName: 'أ' }).fullName).toBeDefined();
    expect(validateProfile({ fullName: 'محمد أحمد علي' }).fullName).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- frontend/src/lib/validations/__tests__/customer.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement validation functions and customerService methods**

1. In `frontend/src/lib/validations/customer.ts`:
   - Phone regex: `^$|^01[0125][0-9]{8}$`.
   - Full name check: length between 3 and 150 characters.
   - Address validation: `governorate` non-blank, `cityArea` non-blank, `detailedAddress` min 5 characters.
2. In `frontend/src/services/customer.ts`:
   - Call `requestApi<ApiResponse<Customer>>('/customer/profile')` and unwrap `.data`.
   - Call `requestApi<ApiResponse<Customer>>('/customer/profile', { method: 'PUT', body: ... })`.
   - Call `requestApi<ApiResponse<CustomerAddress>>('/customer/address', { method: 'PUT', body: ... })`.
   - Call `requestApi<ApiResponse<void>>('/customer/address', { method: 'DELETE' })`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm run test -- frontend/src/lib/validations/__tests__/customer.test.ts frontend/src/services/__tests__/customer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/customer.ts frontend/src/lib/validations/customer.ts frontend/src/services/__tests__/customer.test.ts frontend/src/lib/validations/__tests__/customer.test.ts
git commit -m "feat(customer): create customerService API client and Egyptian validation rules"
```

---

### Task 3: AuthContext Sync & Protected Route AuthGuard

**Files:**
- Modify: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/components/auth/AuthGuard.tsx`
- Create: `frontend/src/components/auth/__tests__/AuthGuard.test.tsx`

**Interfaces:**
- Consumes: `setAccessTokenGetter`, `setOnAuthExpired` from `frontend/src/services/api.ts`.
- Produces: `AuthGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode })`.

- [ ] **Step 1: Write failing test for AuthGuard component**

```tsx
// frontend/src/components/auth/__tests__/AuthGuard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthGuard } from '../AuthGuard';
import * as AuthContextModule from '@/context/AuthContext';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/profile',
}));

describe('AuthGuard', () => {
  it('renders children when authenticated and loaded', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { username: 'ahmed', email: 'ahmed@test.com', role: 'USER' },
      accessToken: 'token',
      login: vi.fn(),
      register: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    render(<AuthGuard><div>Protected Content</div></AuthGuard>);
    expect(screen.getByText('Protected Content')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- frontend/src/components/auth/__tests__/AuthGuard.test.tsx`
Expected: FAIL (AuthGuard module not found)

- [ ] **Step 3: Implement AuthGuard and link `AuthContext` with `api.ts`**

1. In `frontend/src/context/AuthContext.tsx`:
   - Call `setAccessTokenGetter(() => accessToken)` whenever `accessToken` changes.
   - Call `setOnAuthExpired(() => { setAccessToken(null); setUser(null); })`.
2. In `frontend/src/components/auth/AuthGuard.tsx`:
   - If `isLoading`, render luxury skeleton loading cards with gold shimmer.
   - If `!isLoading && !isAuthenticated`, trigger `router.push('/login?redirect=' + encodeURIComponent(pathname))` and return `null`.
   - If authenticated, render `{children}`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- frontend/src/components/auth/__tests__/AuthGuard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/context/AuthContext.tsx frontend/src/components/auth/AuthGuard.tsx frontend/src/components/auth/__tests__/AuthGuard.test.tsx
git commit -m "feat(auth): bind memory token to api interceptor and add AuthGuard route protection"
```

---

### Task 4: Customer Profile & Delivery Address Dashboard UI

**Files:**
- Create: `frontend/src/components/profile/PersonalInfoCard.tsx`
- Create: `frontend/src/components/profile/DeliveryAddressCard.tsx`
- Create: `frontend/src/components/profile/DeleteAddressDialog.tsx`
- Create: `frontend/src/app/profile/page.tsx`
- Create: `frontend/src/app/profile/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: `customerService` from `frontend/src/services/customer.ts`, `validateProfile`, `validateAddress` from `frontend/src/lib/validations/customer.ts`.
- Produces: Responsive `/profile` page in Arabic with personal info and address management.

- [ ] **Step 1: Write failing test for profile page**

```tsx
// frontend/src/app/profile/__tests__/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProfilePage from '../page';
import { customerService } from '@/services/customer';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { username: 'ahmed', email: 'ahmed@varellion.com', role: 'USER' },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/profile',
}));

describe('ProfilePage', () => {
  it('renders customer name and address after loading', async () => {
    vi.spyOn(customerService, 'getProfile').mockResolvedValue({
      userId: 'uuid-123',
      fullName: 'أحمد علي',
      phoneNumber: '01012345678',
      email: 'ahmed@varellion.com',
      isActive: true,
      address: {
        governorate: 'Cairo',
        cityArea: 'Nasr City',
        detailedAddress: '10 Abbas El Akkad St',
      },
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('الملف الشخصي')).toBeDefined();
      expect(screen.getByDisplayValue('أحمد علي')).toBeDefined();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- frontend/src/app/profile/__tests__/page.test.tsx`
Expected: FAIL (ProfilePage not found)

- [ ] **Step 3: Implement Profile components and `/profile/page.tsx`**

1. Create `DeleteAddressDialog.tsx`: Modal dialog confirming address deletion with cancel/delete actions.
2. Create `PersonalInfoCard.tsx`: Form for updating Full Name and Egyptian phone number, displaying user's email as read-only badge.
3. Create `DeliveryAddressCard.tsx`:
   - Displays saved address card with Governorate badge, City/Area, Detailed address, and "تعديل" / "حذف" buttons.
   - If no address saved, renders empty state with "إضافة عنوان شحن جديد" CTA.
   - In edit/add mode, renders Egyptian governorate select dropdown and text inputs.
4. Create `frontend/src/app/profile/page.tsx`:
   - Wrapped inside `<AuthGuard>`.
   - Fetches profile on mount via `customerService.getProfile()`.
   - Manages state, success/error banners, and quick links to `/track-order` and `/checkout`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- frontend/src/app/profile/__tests__/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/profile/ frontend/src/app/profile/
git commit -m "feat(profile): implement luxury customer profile and delivery address dashboard"
```

---

### Task 5: Checkout Form Auto-Prefill & Address Syncing

**Files:**
- Modify: `frontend/src/components/checkout/CheckoutForm.tsx`
- Create: `frontend/src/components/checkout/__tests__/CheckoutForm.test.tsx`

**Interfaces:**
- Consumes: `customerService` from `frontend/src/services/customer.ts`.
- Produces: Enhanced `CheckoutForm` prefilling saved address and saving updated addresses on order placement.

- [ ] **Step 1: Write failing test for CheckoutForm profile prefill**

```tsx
// frontend/src/components/checkout/__tests__/CheckoutForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CheckoutForm } from '../CheckoutForm';
import { customerService } from '@/services/customer';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { username: 'ahmed', email: 'ahmed@test.com' },
  }),
}));

describe('CheckoutForm Profile Prefill', () => {
  it('automatically prefills full name, phone and address when customer has saved profile', async () => {
    vi.spyOn(customerService, 'getProfile').mockResolvedValue({
      userId: 'uuid-1',
      fullName: 'محمد عبد الله',
      phoneNumber: '01123456789',
      isActive: true,
      address: {
        governorate: 'Alexandria',
        cityArea: 'Smouha',
        detailedAddress: 'Building 10, Victor Emmanuel St',
      },
    });

    render(<CheckoutForm onSubmit={vi.fn()} isSubmitting={false} />);

    await waitFor(() => {
      expect((screen.getByLabelText(/الاسم بالكامل/i) as HTMLInputElement).value).toBe('محمد عبد الله');
      expect((screen.getByLabelText(/رقم الهاتف/i) as HTMLInputElement).value).toBe('01123456789');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- frontend/src/components/checkout/__tests__/CheckoutForm.test.tsx`
Expected: FAIL (does not fetch profile or prefill address fields)

- [ ] **Step 3: Update `CheckoutForm.tsx` to prefill profile and offer address sync**

1. On mount, if `isAuthenticated`, call `customerService.getProfile()`.
2. Prefill:
   - `customerName` from `profile.fullName || user.username`.
   - `customerPhone` from `profile.phoneNumber`.
   - If `profile.address` exists:
     - `governorate` from `profile.address.governorate`.
     - `cityArea` from `profile.address.cityArea`.
     - `detailedAddress` from `profile.address.detailedAddress`.
3. Add a banner above the form:
   - *"مرحباً بك! تم ملء بيانات الشحن تلقائياً من عنوانك المسجل."*
4. Add checkbox below address fields:
   - *"حفظ هذا العنوان كعنوان شحن افتراضي لطلباتي القادمة"* (default: true for new address, false for existing).
5. In `handleSubmit`, if checkbox is checked and address is valid, invoke `customerService.saveAddress(...)` asynchronously.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- frontend/src/components/checkout/__tests__/CheckoutForm.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/checkout/CheckoutForm.tsx frontend/src/components/checkout/__tests__/CheckoutForm.test.tsx
git commit -m "feat(checkout): auto-prefill customer profile and sync default delivery address"
```

---

### Task 6: Header Account Menu & System Verification

**Files:**
- Modify: `frontend/src/components/layout/Header.tsx`
- Modify: `frontend/src/components/layout/MobileNav.tsx`

**Interfaces:**
- Consumes: `useAuth` from `frontend/src/context/AuthContext`.
- Produces: Header account dropdown with "حسابي / الملف الشخصي" link and logout button.

- [ ] **Step 1: Update Header.tsx and MobileNav.tsx**

1. In `Header.tsx`:
   - Replace simple Login link with an interactive Account Dropdown or direct link to `/profile` displaying user's name or avatar icon when `isAuthenticated`.
   - Add "الملف الشخصي" (`/profile`) and "تسجيل الخروج" options.
2. In `MobileNav.tsx`:
   - Add `/profile` navigation tile for logged-in shoppers.

- [ ] **Step 2: Run frontend test suite**

Run: `cd frontend && npm run test`
Expected: ALL test files pass.

- [ ] **Step 3: Run TypeScript typecheck**

Run: `cd frontend && npm run type-check`
Expected: Exit code 0 with zero type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Header.tsx frontend/src/components/layout/MobileNav.tsx
git commit -m "feat(navigation): integrate customer profile and account shortcuts in Header and MobileNav"
```

---

## Self-Review Checklist

1. **Spec Coverage:**
   - Single-flight refresh token queue in `api.ts`? -> Covered in Task 1.
   - Customer profile & address service with Egyptian validation? -> Covered in Task 2.
   - Memory token sync & protected route guard? -> Covered in Task 3.
   - Dedicated `/profile` page with personal info & address deletion? -> Covered in Task 4.
   - Checkout auto-prefill & saved address update? -> Covered in Task 5.
   - Header navigation shortcut? -> Covered in Task 6.
2. **Step Scan:** Every step specifies exact file, exact test, exact command, and checkable outcome.
3. **Type Consistency:** Types (`Customer`, `CustomerAddress`, `ApiError`, `ApiResponse`) align with `frontend/src/types/index.ts` and backend contracts.
4. **Review Focus Addressed:**
   - Thundering herd refresh queue tested in Task 1.
   - Expired refresh degradation tested in Task 1.
   - Checkout address override vs sync handled in Task 5.
   - Backend validation mapping verified in Task 2 & 4.
   - Address deletion modal and state cleanup handled in Task 4.
5. **Proportion:** Clear, actionable tasks with test assertions and signature references without bloated transcripts.
