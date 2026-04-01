# Don't Go Broke

Personal finance app that syncs bank transactions via Plaid and displays them in a clean UI. Built as a single-user PWA.

## Tech Stack

- **Next.js** (App Router, TypeScript)
- **Supabase** (Postgres + Auth + Row Level Security)
- **Plaid** (bank sync, Sandbox mode for development)
- **Tailwind CSS**

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
4. Run the Supabase migration (`supabase/migrations/001_initial.sql`) against your Supabase project via the SQL Editor in the Supabase dashboard
5. Start the dev server:
   ```bash
   npm run dev
   ```

### Getting API Keys

- **Supabase**: Create a project at [supabase.com](https://supabase.com). Find your URL and keys under Settings > API.
- **Plaid**: Sign up at [dashboard.plaid.com](https://dashboard.plaid.com). Use the Sandbox secret for development. Test credentials: `user_good` / `pass_good`.

## Security

This is a personal-use app. The GitHub repo is public, but no real credentials are committed.

- All secrets live in `.env.local` (git-ignored) and are never committed
- Supabase Row Level Security is enabled on all tables — data is only accessible to the authenticated user
- Plaid access tokens are stored server-side only and never returned to the client
- All Plaid API calls happen in server-side route handlers, never in client components

## PWA

The app can be installed on iPhone via Safari "Add to Home Screen". Connect your phone to the same WiFi as your dev machine and navigate to `http://<your-local-ip>:3000`.
