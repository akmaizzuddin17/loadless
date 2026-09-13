# LoadLess on Vercel

The Vercel migration uses Next.js App Router, Supabase Auth, PostgreSQL and a private Supabase Storage bucket. Existing planner and social screens are preserved. The old ChatGPT header authentication is removed: every server page and API validates the Supabase user.

## Provision Supabase

1. Create a Supabase project in your own account.
2. Copy `.env.example` to `.env.local`. Fill in the project URL, public publishable key, service-role key and the transaction-pooler PostgreSQL connection string (port 6543). URL-encode the database password. Never commit `.env.local`.
3. Run `npm ci`, then `npm run db:migrate`. This creates the application tables and private `activity-photos` bucket. Application tables deny access from anonymous and browser-authenticated database roles; authenticated API routes enforce per-user ownership and friend visibility using server-only database credentials.
4. Set Supabase Authentication's Site URL to the production Vercel origin. Add `https://YOUR-DOMAIN/auth/callback` to redirect URLs. For local testing, add `http://localhost:3000/auth/callback`.
5. Keep email confirmation enabled. Configure an email delivery provider in Supabase for public registrations (Supabase's default email sender has restricted recipients and limits).

## Deploy Vercel

- Import `akmaizzuddin17/loadless`. The repository root contains `package.json`: Root Directory is `.` (not `app`).
- Framework preset: **Next.js**. Remove previous output-directory overrides such as `dist` or `dist/client`. Build command: `npm run build`. Install command: `npm ci`.
- Add all four keys from `.env.example` to the production environment. Only the two `NEXT_PUBLIC_` keys are public. Database and service-role keys must remain server-only.
- Deploy the migration branch as a preview to check it, then promote/merge the verified version to production. Use a separate Supabase project for previews that need writable test data.

## Verify before sharing

Create two real test accounts and confirm their email addresses. Set unique usernames. Verify task/routine saves survive reload; one account cannot read the other's plan; send and accept a friend request; post a photo; like/comment; share availability and respond to an invitation; sign out and confirm protected pages require sign-in again.

Photos are limited to 3 MB to stay below Vercel's function request-body limit, including multipart overhead. Only signed-in members with profiles can read feed photos. Availability is exposed only to accepted friends. Planner records use optimistic revisions to prevent silent overwrites between tabs.

## Existing data

This code migration does not automatically transfer records from the Sites-managed D1/R2 resources. Supabase accounts have new IDs, so existing profiles, posts and photos require a separate export and identity-mapping migration. Existing Sites data is not deleted. Browser data is origin-specific and will not automatically follow users to the Vercel URL.

## Local checks

`npm run build` builds and type-checks Next.js.

`node scripts/test-migration.mjs` runs the actual API route handlers against local PostgreSQL (PGlite), using test identities and an in-memory photo bucket. It verifies SQL compatibility, ownership, friend visibility, duplicate usernames/reactions, comments, photo deletion, optimistic revisions, origin checks, and restricted database roles. Hosted Supabase authentication and storage still need the two-account live smoke test above.

`node --experimental-strip-types --test lib/*.test.mjs` runs the existing planner tests (some Node versions require an extension-resolving loader for the old extensionless TypeScript imports).

The `db/` and `drizzle/` files are the historical SQLite schema; `supabase/migrations/` is the active PostgreSQL schema.
