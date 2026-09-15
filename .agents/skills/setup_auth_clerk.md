# Skill: setup_auth_clerk

## Purpose
Integrate Clerk authentication with the team's own custom-designed landing page and role-picker UI, supporting four roles: officer, vendor, consumer, headquarters.

## Critical Version Note
Use Clerk's **Custom Flows** (hooks-based, current as of Clerk Core 3, March 2026) — NOT Clerk Elements, which is deprecated. If any generated code or referenced tutorial uses `@clerk/elements`, stop and flag it; that library is no longer the recommended path.

## Architecture
1. **Landing page** (`app_build/metra/src/app/page.tsx`): 100% custom markup from the team's HTML/design source — role-picker cards (Officer / Vendor / Consumer / Headquarters). No Clerk component appears on this page.
2. **Sign-in/sign-up pages** (`src/app/sign-in/`, `src/app/sign-up/`): custom markup matching the design source, wired to Clerk's Custom Flow hooks for whichever auth method is enabled in the Clerk Dashboard (confirm with the team which method — email+password, Google, etc. — before implementing, since the exact hook code differs per method; fetch the current Clerk custom-flow guide for that specific method rather than assuming).
3. **Role storage:** `publicMetadata.role` on the Clerk user object. This is only writable via Clerk's Backend API (server-side), never directly by the client — this is what prevents a vendor from self-elevating to officer.
   - Vendor/Consumer: role set at self-service signup (backend sets it immediately after Clerk account creation).
   - Officer/Headquarters: role set only via an admin-provisioning action — never exposed as a self-selectable option in the public signup flow.
4. **Route protection:** `clerkMiddleware()` (Next.js) checks the session and `publicMetadata.role`, redirecting to the correct dashboard or denying access to a mismatched one.
5. **Backend verification:** configure a custom JWT template in the Clerk Dashboard that includes the role claim. FastAPI verifies this JWT on every request (via Clerk's JWKS endpoint) and checks the role claim before returning role-scoped data — every backend endpoint must state which role(s) it's valid for.

## Rules
- Never trust a role value sent from the client in a request body/header — always derive it from the verified JWT claim.
- Never make `publicMetadata` client-writable.
- Every new backend endpoint spec (via `write_specs`) must state its required role(s) explicitly.
- Consumer-facing endpoints (health report, product lookup) may remain unauthenticated per the project's existing consumer_health_report scope — don't force a login where the team already decided one isn't needed.
