## What changed

- Converted the app to admin-only routing by keeping only `app/login`, `app/admin-dashboard`, and shared app shell files.
- Simplified `app/layout.tsx` to remove marketing-site wrappers and render a single global admin layout.
- Updated `app/page.tsx` to redirect directly to `/login`.
- Updated `app/login/LoginClient.tsx` logo click target to `/login`.
- Simplified `middleware.ts` route allowlist to admin-only prefixes.
- Removed non-admin route folders and unused action files/components not needed by dashboard or login.

## Kept core dependencies

- Actions: `adminOps.ts`, `authOps.ts`, `blogOps.ts`, `formdropOps.ts`, `uploadOps.ts`
- Components: `components/ui`, `components/upload`, `components/editor`
- Runtime directories: `app`, `components`, `lib`, `prisma`, `public`

## Resulting app scope

- Main entry route redirects to `/login`
- Auth route: `/login`
- Dashboard routes: `/admin-dashboard/*`
