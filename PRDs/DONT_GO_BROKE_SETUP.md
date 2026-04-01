# Personal Finance App — Project Setup PRD

## Project Overview

Build a personal finance web app (PWA) that replicates the core functionality of Copilot Money. This is a **personal-use-only app** that will never be deployed publicly, but the GitHub repo will be public as a portfolio piece. All decisions should reflect this dual reality: private data, public code.

The app will be built with Next.js and use Supabase for the database and auth, Plaid for bank sync, and Recharts for data visualization. During Phase 1, the app runs locally only (`next dev`). Hosting is deferred to a later phase.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Hosting | Local (`next dev`) for Phase 1 — Vercel or VPS deferred |
| Database + Auth | Supabase (Postgres + Row Level Security) |
| Bank Sync | Plaid |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Language | TypeScript |

---

## Phase 1 Scope (This PRD)

Set up the full project scaffold with:

1. Next.js app with TypeScript and Tailwind
2. Supabase client configured with Row Level Security
3. Auth (Supabase magic link — no password needed since this is single-user)
4. Plaid Link integration (Sandbox mode)
5. Transaction sync endpoint
6. Basic transaction list UI
7. PWA manifest so the app is installable on iPhone
8. Environment variable setup and `.gitignore` hardening

Do NOT build budgets, charts, or net worth tracking yet. Get bank sync working end-to-end first.

---

## Security Requirements

These are non-negotiable. The GitHub repo will be public, so the codebase must be safe to open-source without exposing any real data or credentials.

### Environment Variables

- ALL secrets must live in `.env.local` for local development and in Vercel's environment variable UI for production
- `.env.local` must be in `.gitignore` from the very first commit — verify this before any other files are committed
- Never hardcode any key, token, URL, or credential anywhere in the source code
- The `.env.example` file (committed to the repo) must list all required variable names with placeholder values only — no real values ever

Required environment variables to scaffold:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Plaid
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
# When hosting later, update this to your deployed URL (e.g. https://yourapp.vercel.app)
```

Note: `NEXT_PUBLIC_` prefixed vars are exposed to the browser. Only `SUPABASE_URL` and `SUPABASE_ANON_KEY` should be public-facing. `SUPABASE_SERVICE_ROLE_KEY` and all Plaid keys must never have the `NEXT_PUBLIC_` prefix — they must only be used in server-side code (API routes or Server Components).

### Supabase Row Level Security

Every table must have RLS enabled and policies applied before any data is written. The app is single-user, but RLS must still be configured correctly so that even if the Supabase anon key were exposed, no data would be readable.

Apply the following pattern to every table:

```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner only" ON [table_name]
  FOR ALL USING (auth.uid() = user_id);
```

The `user_id` column (UUID, references `auth.users`) must be present on every table.

### API Route Security

- All Plaid API calls must happen in Next.js API routes (server-side), never in client components
- All API routes that access the database or Plaid must verify the user session before executing
- Use `createServerComponentClient` / `createRouteHandlerClient` from `@supabase/auth-helpers-nextjs` — never the anon client in server routes
- Return generic error messages to the client (never expose stack traces, Supabase errors, or Plaid error details)

### Git Hygiene

- The very first commit should be: Next.js scaffold + `.gitignore` + `.env.example` — nothing else
- Verify `.gitignore` covers: `.env`, `.env.local`, `.env.development.local`, `.env.production.local`
- Never commit: database dumps, seed files with real data, Plaid tokens, or Supabase access tokens
- Add a `# Security` section to the README explaining that real credentials must be added via `.env.local` and never committed

---

## Database Schema

Scaffold these tables in a single migration file (`supabase/migrations/001_initial.sql`):

```sql
-- Users table is handled by Supabase Auth (auth.users)
-- All tables reference auth.uid() for RLS

CREATE TABLE plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL, -- store encrypted if possible
  item_id TEXT NOT NULL,
  institution_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id UUID REFERENCES plaid_items(id) ON DELETE CASCADE,
  plaid_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT, -- checking, savings, credit, investment
  subtype TEXT,
  current_balance NUMERIC,
  available_balance NUMERIC,
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  plaid_transaction_id TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL, -- positive = debit, negative = credit
  date DATE NOT NULL,
  name TEXT,
  merchant_name TEXT,
  category TEXT,
  plaid_category JSONB,
  pending BOOLEAN DEFAULT FALSE,
  notes TEXT,
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on all tables
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner only" ON plaid_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owner only" ON accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owner only" ON transactions FOR ALL USING (auth.uid() = user_id);
```

Important: `plaid_items.access_token` is a sensitive Plaid credential. Store it server-side only and never return it to the client in any API response.

---

## Plaid Integration

Use Plaid's **Sandbox** environment for Phase 1. Sandbox uses fake data and test credentials — no real bank connections, no real transactions. This makes it faster to build and debug the integration without dealing with real bank OAuth flows and MFA.

### Sandbox Test Credentials

When Plaid Link opens in Sandbox, use these credentials to simulate a bank connection:
- Username: `user_good`
- Password: `pass_good`
- MFA code (if prompted): `1234`

These are Plaid's official test credentials and will always work in Sandbox.

### Migrating to Development Later

When ready to connect real bank accounts, the only required change is:
1. Get a Plaid Development secret from the Plaid dashboard (separate from the Sandbox secret)
2. Update `.env.local`: set `PLAID_ENV=development` and update `PLAID_SECRET` to the Development secret
3. Re-connect accounts through Plaid Link (Sandbox access tokens don't carry over)

No code changes are needed — the `PLAID_ENV` variable controls which environment the client uses.

### Flow

1. Client calls `POST /api/plaid/create-link-token` → server creates a Plaid link token and returns it
2. Client opens Plaid Link UI using the link token
3. On success, Plaid Link returns a `public_token` to the client
4. Client calls `POST /api/plaid/exchange-token` with the `public_token`
5. Server exchanges it for a permanent `access_token` via Plaid API
6. Server stores the `access_token` in `plaid_items` (never returned to client)
7. Server immediately fetches accounts and recent transactions and stores them

### API Routes to Scaffold

`/api/plaid/create-link-token` (POST)
- Verify user session
- Call `plaidClient.linkTokenCreate()`
- Return `{ link_token }` only

`/api/plaid/exchange-token` (POST)
- Verify user session
- Receive `{ public_token, institution_name }`
- Exchange for `access_token` via `plaidClient.itemPublicTokenExchange()`
- Store `access_token` + `item_id` in `plaid_items`
- Immediately call Plaid accounts and transactions endpoints
- Store results in `accounts` and `transactions` tables
- Return `{ success: true }` — never return the access_token to the client

`/api/plaid/sync` (POST)
- Verify user session
- For each `plaid_item` belonging to the user, fetch latest transactions
- Upsert into `transactions` table using `plaid_transaction_id` as the unique key
- Return `{ synced: number }`

### Plaid Client Setup

Create a singleton Plaid client in `lib/plaid.ts` (server-only file):

```typescript
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
```

This file must never be imported in any client component. Prefix the filename or add a server-only guard if needed.

---

## Hosting (Deferred — Not Part of Phase 1)

For Phase 1, run the app locally with `next dev`. No hosting setup is needed.

When you're ready to access the app from your phone away from home (likely when switching to Plaid Development mode), choose one of these options:

**Option A: Vercel (recommended for simplicity)**
- Connect the GitHub repo to Vercel
- Add all `.env.local` variables to Vercel's environment variable UI — never in the repo
- Vercel handles HTTPS, deploys on every push to `main`
- Free tier is sufficient for personal use

**Option B: VPS (more control, ~$5/month)**
- Hetzner or DigitalOcean droplet
- Run the app with Docker or PM2
- Point a domain at it and handle HTTPS with Caddy or Nginx + Let's Encrypt

Do not configure hosting or add any deployment-specific config in Phase 1. Keep `NEXT_PUBLIC_APP_URL=http://localhost:3000` until a hosting decision is made.

---

## PWA Setup

Add the following to make the app installable on iPhone via Safari "Add to Home Screen":

In `app/manifest.ts` (Next.js 14 metadata API):

```typescript
export default function manifest() {
  return {
    name: 'Finance',
    short_name: 'Finance',
    description: 'Personal finance tracker',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

Add placeholder icons to `/public`. The app must have `display: standalone` so it opens without the Safari chrome when launched from the home screen.

To test PWA install locally on iPhone: connect your phone to the same WiFi as your dev machine, open Safari and navigate to `http://[your-mac-local-ip]:3000`, then use "Add to Home Screen." The local IP can be found in System Settings → WiFi → Details.

---

## Auth

Use Supabase magic link auth (passwordless email). This is appropriate for a single-user personal app — no password to manage, and the session persists in the browser.

- Protect all routes except `/login` using middleware (`middleware.ts`)
- If the user is not authenticated, redirect to `/login`
- The login page should have a single email input and a "Send magic link" button
- After clicking the link, Supabase handles the session automatically

---

## UI — Phase 1

Keep it minimal. The goal is a working data pipeline, not a polished UI.

**Pages to scaffold:**

`/login` — Magic link form

`/` (Dashboard) — For now, just a list of recent transactions pulled from Supabase. Columns: date, merchant name, amount, category. Include a "Connect Bank" button that opens Plaid Link. Include a "Sync" button that calls `/api/plaid/sync`.

No charts, no budgets, no net worth yet.

---

## File Structure

```
/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Dashboard (transaction list)
│   ├── login/page.tsx
│   ├── manifest.ts
│   └── api/
│       └── plaid/
│           ├── create-link-token/route.ts
│           ├── exchange-token/route.ts
│           └── sync/route.ts
├── components/
│   ├── TransactionList.tsx
│   └── PlaidLinkButton.tsx
├── lib/
│   ├── plaid.ts              # Server-only Plaid client
│   └── supabase/
│       ├── client.ts         # Browser client
│       └── server.ts         # Server client
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
├── public/
│   ├── icon-192.png
│   └── icon-512.png
├── .env.example
├── .gitignore
└── README.md
```

---

## README Requirements

The README must include a `## Security` section with:

- A note that this is a personal-use app and no real credentials are committed to the repo
- Instructions to copy `.env.example` to `.env.local` and fill in real values
- A note that Supabase RLS is enabled on all tables
- Links to Plaid and Supabase documentation for getting API keys

---

## Definition of Done

Phase 1 is complete when:

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `.env.local` is confirmed absent from git history (`git log --all -- .env.local` returns nothing)
- [ ] Supabase RLS is enabled and verified on all three tables
- [ ] A bank can be connected via Plaid Link in Sandbox using test credentials (`user_good` / `pass_good`)
- [ ] Sandbox transactions appear in the UI after connecting a test bank
- [ ] The Sync button fetches and stores new transactions
- [ ] The app can be added to iPhone home screen via local IP and opens without Safari chrome
- [ ] No secrets, tokens, or real financial data exist anywhere in the git history
