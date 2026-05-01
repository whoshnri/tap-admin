## What changed

- Updated `app/actions/authOps.ts` to handle transient database connectivity failures during login.
- Added targeted retry behavior for retryable DB/network errors (including `EAI_AGAIN` and `P1001`) when fetching the admin by email.
- Removed the broad catch-and-null behavior in admin verification flow.
- Added explicit login error messaging for temporary DB connectivity issues instead of returning invalid-credentials responses.

## Outcome

- Transient DNS/database hiccups no longer look like wrong email/password.
- Login now retries briefly and returns a clearer error when the DB is temporarily unreachable.
