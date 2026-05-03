
# Clone tipstik1 into this project

Mirror the `motivationalgen/tipstik1` repo (main branch) file-for-file into this Lovable project, wired to your existing external Supabase project `gohglzrecwdnvoeyxhth`. Lovable Cloud will **not** be enabled.

## What gets built

A sports tipping / predictions web app with:

- **Public pages**
  - Home (`/`) — hero, today's matches, stats cards, "Yesterday" carousel
  - Sport pages (`/sport/:sport`) — filtered match listings
  - Results (`/results`) and date-specific results (`/results/:date`)
  - Match detail (`/match/:id`) — full breakdown with team crests and last-10-days form
  - Pricing (`/pricing`) — subscription tiers
  - Auth (`/auth`) — sign in / sign up
  - Payment callback (`/payment/callback`) — Paystack return handler
  - 404
- **Authenticated pages**
  - Console (`/console`) — admin area to manage matches/tips
- **Shared components**
  - `Header`, `Footer`, `Layout`, `NavLink`
  - `MatchCard`, `TeamCrest`, `StatsCards`, `LastTenDays`, `YesterdayCarousel`
  - All shadcn/ui primitives (already present in this project)
- **Domain types & helpers**
  - `src/types/match.ts`
  - `src/lib/tier.ts` (subscription-tier logic), `src/lib/utils.ts`

## Backend wiring (external Supabase, no Lovable Cloud)

- Add `src/integrations/supabase/client.ts` and `src/integrations/supabase/types.ts` from the source repo.
- Configure the Supabase client with:
  - `VITE_SUPABASE_PROJECT_ID = "gohglzrecwdnvoeyxhth"`
  - URL derived as `https://gohglzrecwdnvoeyxhth.supabase.co`
  - **Publishable (anon) key** — you'll paste this in chat after approval; it's safe to commit since it's a public key.
- The Supabase project itself (tables, RLS, edge functions) is assumed to already exist on your account. The repo's `supabase/migrations/*.sql` and `supabase/functions/paystack-init`, `paystack-webhook` will be copied into the project for reference / future `supabase db push`, but **not** auto-deployed (Lovable Cloud is off, so Lovable won't manage that Supabase project).

## Routes registered in `App.tsx`

```text
/                  → Index
/auth              → Auth
/pricing           → Pricing
/console           → Console (auth-gated)
/results           → Results
/results/:date     → DateResults
/match/:id         → MatchDetail
/sport/:sport      → SportPage
/payment/callback  → PaymentCallback
*                  → NotFound
```

## Technical notes

- All source files are pulled directly from GitHub (`raw.githubusercontent.com/motivationalgen/tipstik1/main/...`) and written verbatim, except:
  - `src/integrations/supabase/client.ts` is rewritten to use this project's Supabase ID + the anon key you provide.
  - `.env`, `bun.lock`, `package-lock.json`, `.lovable/` from the source repo are skipped.
- `package.json` deps in the source repo will be diffed against this project's `package.json`; any missing packages (likely `@supabase/supabase-js`, `date-fns`, `embla-carousel-react`, etc.) get installed via `bun add`.
- `tailwind.config.ts` and `index.css` from the source repo replace this project's versions to preserve the original design tokens / theme.
- `src/pages/Index.tsx` placeholder is replaced with the real home page.

## What I'll need from you after approval

1. The Supabase **publishable (anon) key** for project `gohglzrecwdnvoeyxhth`.
2. Confirmation that the Supabase project already has the schema and edge functions deployed (otherwise the app will load but data calls will fail).

## Out of scope

- Deploying SQL migrations or edge functions to your Supabase project (Lovable Cloud is disabled, so this is on you / your Supabase CLI).
- Configuring Paystack keys in your Supabase project's edge function secrets.
