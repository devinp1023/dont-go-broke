# Don't Go Broke

Personal finance PWA (single-user, public repo). Replicates core Copilot Money functionality.

## Tech Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS)
- Supabase (Postgres + Auth + Row Level Security)
- Plaid (bank sync — currently Sandbox mode)
- `@supabase/ssr` for auth (not the deprecated `auth-helpers-nextjs`)

## Key Architecture Decisions

- **Next.js 16 breaking changes**: `middleware.ts` is now `proxy.ts`. `cookies()`, `headers()`, `params` are async and must be awaited.
- **Auth**: Supabase magic link (passwordless). Session managed via cookies in `proxy.ts`.
- **Plaid**: All Plaid API calls are server-side only (`lib/plaid.ts` uses `server-only`). Access tokens are never returned to the client.
- **RLS**: Every table has Row Level Security with `auth.uid() = user_id` policy. All tables have a `user_id` column.

## File Structure

- `proxy.ts` — Auth middleware (redirects unauthenticated users to /login)
- `lib/supabase/client.ts` — Browser Supabase client
- `lib/supabase/server.ts` — Server Supabase client (async, uses cookies)
- `lib/supabase/proxy.ts` — Supabase client for proxy/middleware context
- `lib/plaid.ts` — Server-only Plaid client singleton
- `app/api/plaid/` — Three routes: create-link-token, exchange-token, sync
- `app/auth/callback/route.ts` — Magic link callback (exchanges code for session)
- `supabase/migrations/001_initial.sql` — Schema: plaid_items, accounts, transactions

## Security (CRITICAL — READ THIS FIRST)

Security is the #1 priority in every change to this codebase. The GitHub repo is public, but the app handles real financial data. Every PR, every feature, every refactor must be evaluated through a security lens first. When in doubt, choose the more secure option.

### Non-Negotiable Rules

- **Secrets**: All secrets live in `.env.local` (git-ignored). `.env.example` has placeholders only. Before every commit, verify no real keys, tokens, or credentials are included.
- **Server-only**: Plaid access tokens, `SUPABASE_SERVICE_ROLE_KEY`, and `PLAID_SECRET` must NEVER be exposed to the client. Any file using these must import `server-only` or be an API route.
- **RLS always on**: Every new table must have Row Level Security enabled with `auth.uid() = user_id` policies before any data is written. No exceptions.
- **Session verification**: Every API route must verify the user session before executing. Never trust client-side data without server-side validation.
- **No `NEXT_PUBLIC_` on secrets**: Only `SUPABASE_URL` and `SUPABASE_ANON_KEY` may have the `NEXT_PUBLIC_` prefix. Everything else is server-only.
- **Generic errors**: Never return stack traces, Supabase errors, or Plaid error details to the client. Return generic error messages only.
- **Git hygiene**: Never commit database dumps, seed files with real data, Plaid tokens, or Supabase access tokens. Run `git log --all -- .env.local` to verify before pushing.

## Current State

- Phase 1 complete: auth, Plaid Sandbox bank sync, transaction list, PWA manifest
- Not yet built: budgets, charts, net worth tracking, hosting

## Commands

- `npm run dev` — Start dev server
- `npx tsc --noEmit` — Type check
