# Basketball Trivia (Hoops Trivia)

A two-team basketball trivia game. React + Vite + TypeScript frontend, wrapped
with Capacitor for iOS. The app talks **directly to Supabase** using the anon
key — there is no backend server in the shipped app.

## Architecture

- `src/api/client.ts` — fetches questions from Supabase PostgREST with the anon key
- Security model: RLS is enabled on `questions` with a single SELECT-only policy;
  the anon role has no write grants (see `supabase/schema.sql`)
- `server/seed.ts` + `server/db.ts` — **local seeding tool only** (uses the
  service role key from `.env`, never shipped)

## Run locally (web)

```bash
npm install
npm run dev
```

Requires `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
(see `.env.example`). These are baked into the bundle at **build time** —
if you change them, rebuild.

## iOS (Capacitor)

```bash
npm run build        # produces dist/ with env vars baked in
npx cap sync ios     # copies dist/ into ios/App/App/public
npx cap open ios     # opens Xcode (macOS only)
```

Bundle ID is `com.hoopstrivia.app` (`capacitor.config.ts`) — keep it in sync
with App Store Connect. iPhone is portrait-locked in `Info.plist`.

## Seeding the database

```bash
npm run seed
```

Uses `SUPABASE_SERVICE_ROLE_KEY` from `.env`. **Warning:** the seed replaces
all rows (`DELETE` then `INSERT`). Never commit `.env`; never prefix the
service key with `VITE_`.

## Privacy

The app links to https://hoopstrivia.com/privacy.html (Home + Game Over
screens). The same URL goes in App Store Connect metadata.
