## What changed

- Fixed memo type imports to use `app/admin-dashboard/types.ts` in:
  - `app/admin-dashboard/memos/components/NewMemoModal.tsx`
  - `app/admin-dashboard/memos/memoId/page.tsx`
- Updated dynamic route param handling for client pages to use `useParams` in:
  - `app/admin-dashboard/contact/[contactFormId]/page.tsx`
  - `app/admin-dashboard/formdrop/[formId]/page.tsx`
- Moved `RecentActivities` (and activity-icon mapping) out of `app/admin-dashboard/page.tsx` into:
  - `app/admin-dashboard/components/RecentActivities.tsx`
- Updated `app/admin-dashboard/notifications/page.tsx` to import `RecentActivities` from the new shared component file.

## Outcome

- Type/build errors related to memo type exports, dynamic route `params` typing, and invalid extra page exports were resolved.
- `pnpm exec tsc --noEmit` and `pnpm build` now complete successfully.
