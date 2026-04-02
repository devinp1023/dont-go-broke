# Don't Go Broke

Personal finance PWA (single-user, public repo). Replicates core Copilot Money functionality.

## Tech Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Supabase (Postgres + Auth + Row Level Security)
- Plaid (bank sync — currently Sandbox mode)
- Anthropic SDK (`@anthropic-ai/sdk`) for AI-generated financial insights (Claude Haiku)
- Recharts for data visualization (pie charts)
- `@supabase/ssr` for auth (not the deprecated `auth-helpers-nextjs`)

## Key Architecture Decisions

- **Next.js 16 breaking changes**: `middleware.ts` is now `proxy.ts`. `cookies()`, `headers()`, `params` are async and must be awaited.
- **Auth**: Supabase magic link (passwordless). Session managed via cookies in `proxy.ts`.
- **Plaid**: All Plaid API calls are server-side only (`lib/plaid.ts` uses `server-only`). Access tokens are never returned to the client.
- **RLS**: Every table has Row Level Security with `auth.uid() = user_id` policy. All tables have a `user_id` column.

## Design System

All styling goes through the design system. No hardcoded fonts, colors, or sizes in components.

- **Reference**: `style-guide.html` — living visual reference for all tokens and components
- **Tokens**: Defined in `app/globals.css` via Tailwind v4 `@theme inline`
- **Fonts**: DM Serif Display (`font-display`) + DM Sans (`font-body`), loaded via `next/font/google` in `app/layout.tsx`

### Key Tokens
- **Colors**: `sg-50`–`sg-900` (brand green), `neutral-50`–`neutral-900`, `danger-*`, `warning-*`
- **Number colors**: `sg-400` for positive, `danger-400` for negative
- **Type scale**: `text-hero` (47px), `text-display` (33px), `text-heading` (22px), `text-body` (20px), `text-label` (17px), `text-eyebrow` (16px), `text-number` (37px), `text-mono` (19px)
- **Radius**: `rounded-sm` (6px), `rounded-md` (10px), `rounded-lg` (16px), `rounded-xl` (24px)
- **Shadows**: `shadow-card`, `shadow-elevated`, `shadow-modal`

### Component Classes (in globals.css)
Buttons (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.btn-lg`, `.btn-icon`), Inputs (`.input-field`, `.input-label`), Badges, Cards (`.card`, `.card-elevated`, `.card-tinted`, `.card-dark`), Stat cards, Transaction rows (`.tx-row`, `.tx-amount.debit/.credit`), Progress bars, Tabs, Toggles, Avatars, Dividers, Empty states, Toasts, Sidebar (`.sidebar`, `.nav-link`)

### Rules
- **No hardcoded styles**: All colors, fonts, and sizes must use design system tokens or component classes
- **Page titles**: Use `text-hero font-display`
- **Update style-guide.html** when adding new tokens or components

## File Structure

- `proxy.ts` — Auth middleware (redirects unauthenticated users to /login)
- `lib/supabase/client.ts` — Browser Supabase client
- `lib/supabase/server.ts` — Server Supabase client (async, uses cookies)
- `lib/supabase/proxy.ts` — Supabase client for proxy/middleware context
- `lib/plaid.ts` — Server-only Plaid client singleton
- `lib/anthropic.ts` — Server-only Anthropic client factory (reads API key at call time due to Turbopack env quirk)
- `app/api/plaid/` — Three routes: create-link-token, exchange-token, sync
- `app/auth/callback/route.ts` — Magic link callback (exchanges code for session)
- `app/globals.css` — Design system tokens + component classes
- `components/AppShell.tsx` — Layout wrapper (sidebar + main content, hidden on auth pages)
- `components/Sidebar.tsx` — Navigation sidebar (Home, Transactions, Accounts, Net Worth)
- `components/SpendBreakdown.tsx` — Pie chart of expenses by category (recharts)
- `components/TransactionList.tsx` — Transaction row list with design system styling
- `supabase/migrations/001_initial.sql` — Schema: plaid_items, accounts, transactions
- `supabase/migrations/002_insights.sql` — Schema: insights (daily AI-generated financial insights, cached per user per day)

## Pages

- `/` — Home (AI insight, income vs expense chart, spend breakdown pie chart)
- `/transactions` — Transaction list with sync button
- `/accounts` — Sync and Connect Bank buttons (coming soon)
- `/net-worth` — Coming soon
- `/login` — Magic link auth (no sidebar)

## Security (CRITICAL — READ THIS FIRST)

Security is the #1 priority in every change to this codebase. The GitHub repo is public, but the app handles real financial data. Every PR, every feature, every refactor must be evaluated through a security lens first. When in doubt, choose the more secure option.

### Non-Negotiable Rules

- **Secrets**: All secrets live in `.env.local` (git-ignored). `.env.example` has placeholders only. Before every commit, verify no real keys, tokens, or credentials are included.
- **Server-only**: Plaid access tokens, `SUPABASE_SERVICE_ROLE_KEY`, `PLAID_SECRET`, and `ANTHROPIC_API_KEY` must NEVER be exposed to the client. Any file using these must import `server-only` or be an API route.
- **RLS always on**: Every new table must have Row Level Security enabled with `auth.uid() = user_id` policies before any data is written. No exceptions.
- **Session verification**: Every API route must verify the user session before executing. Never trust client-side data without server-side validation.
- **No `NEXT_PUBLIC_` on secrets**: Only `SUPABASE_URL` and `SUPABASE_ANON_KEY` may have the `NEXT_PUBLIC_` prefix. Everything else is server-only.
- **Generic errors**: Never return stack traces, Supabase errors, or Plaid error details to the client. Return generic error messages only.
- **Git hygiene**: Never commit database dumps, seed files with real data, Plaid tokens, or Supabase access tokens. Run `git log --all -- .env.local` to verify before pushing.

## Commands

- `npm run dev` — Start dev server
- `npx tsc --noEmit` — Type check
