## What changed

- Moved the dashboard code from `admin-dashboard/` to `app/admin-dashboard/` so routes and relative imports align with Next.js app router structure.
- Added `app/admin-dashboard/types.ts` to centralize dashboard shared types (`Session`, `MemoWithRelations`, `ContactFormWithReadBy`).
- Updated dashboard and action imports to use shared types instead of importing from page/client files.
- Removed unreferenced mock and log artifacts from the project root.

## Files removed

- `african_parent_shop_page.html`
- `newpages.html`
- `tap_mockup_for_henry.html`
- `theafricanparent_mockup.html`
- `app.log`
- `prisma_error.txt`
- `prisma_out.txt`
- `prisma_push.txt`

## Notes

- `blogs.csv`, `blogs.json`, and `script.js` were kept because they are tied to seed/data tooling and not safe to remove automatically.
- Full type/lint verification could not be completed because local package executables are not available in this workspace yet.
