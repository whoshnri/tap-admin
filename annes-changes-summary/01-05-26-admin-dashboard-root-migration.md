## What changed

- Migrated dashboard routes from `app/admin-dashboard/*` to `app/(dashboard)/*` so URLs are now root-level (`/orders`, `/blogs`, `/memos`, etc.).
- Updated dashboard navigation and internal links to use root paths instead of `/admin-dashboard/...`.
- Updated login success redirect to `/`.
- Updated middleware route allowlist to include all dashboard root routes.
- Added middleware redirect from legacy `/admin-dashboard/*` URLs to their new root equivalents (308 redirect).
- Updated server action references to new route invalidation paths and moved dashboard types import path.
- Removed `app/page.tsx` so the dashboard home page from the new route group owns `/`.

## Outcome

- The dashboard is now the main app route structure.
- Old `/admin-dashboard/*` links still work via redirect to preserve compatibility.
