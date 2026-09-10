# Hoops Trivia · iOS

A two-team, pass-and-play basketball trivia game for iPhone and iPad, built with React, TypeScript, Vite and Capacitor 8. The existing web project and native Xcode project share one implementation.

## Play locally

Use Node.js 22.12 or later (Node 24 LTS recommended).

```bash
npm ci
npm run dev
```

No account or backend setup is required. A bundled bank of 56 questions makes every board tile playable on the first launch, even offline. The board keeps the original 14 tiles across five categories, so each team has seven turns.

## What is included

- A responsive paper-and-orange interface, iPhone safe areas, touch targets and offline fonts.
- Team names/colors, alternating turns, scoring, Double Up and Fifty Fifty.
- A saved match with the exact selection, revealed result, score and power-ups. The home screen offers Resume Game after relaunch. Starting a new match replaces it at Tip Off.
- Once-only scoring, duplicate-tap and stale-request guards, validated local saves and an error recovery screen.
- Accessible sheets for questions, instructions, category previews and privacy, with focus management and reduced-motion support.
- Native iOS haptics, status-bar styling and a result share sheet.
- Branded app icon and launch screen, an app privacy manifest and a shared Xcode build/archive scheme.

Fifty Fifty removes two wrong answers and awards half points, rounded up; Double Up awards twice the points. Each is usable once per team, and they cannot be combined on a question.

## Optional online questions

The app can read a larger question bank from Supabase. Copy `.env.example` to `.env` and set only the public `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the client.

These values are embedded when you build. Rebuild and sync after changing them. Requests use the read-only `questions` table; see `supabase/schema.sql` for its RLS policy. Refreshes paginate, validate and cache content without blocking play. A failed connection keeps the bundled or previously cached questions available. Image-dependent remote questions are excluded until image caching is supported.

The bundled content is a separate curated starter bank in `src/data/questions.ts`. The current game UI and bundled content are English.

`npm run seed` is an administrative tool that replaces database content. Run it only when that replacement is intended. Its service-role key belongs only in local server tooling and must never have a `VITE_` prefix.

## Prepare iOS

```bash
npm run ios:sync
```

This builds the production web app, copies it into the native iOS project, registers native plugins and checks configuration and asset consistency. It runs on Windows, macOS and Linux.

On a Mac with a compatible Xcode installation:

```bash
npm ci
npm run ios:sync
npm run ios:open
```

Open the **App** scheme, select your Apple development team under **Signing & Capabilities**, choose an iPhone simulator or device, and run. The bundle identifier is `com.hoopstrivia.app`; the minimum deployment target is iOS 15.

For device testing, archiving, TestFlight and App Store metadata, follow [the iOS release guide](docs/IOS_RELEASE.md). The project is prepared for Xcode; compiling/signing an iOS binary and validating device behavior require a Mac. A synchronized web bundle is not a signed IPA.

## Checks

```bash
npm run typecheck
npm test
npm run test:ui
npm run ios:sync
```

The unit suite checks scoring, power-ups, persistence validation and offline/remote question-bank behavior. Browser tests exercise 375px, 390px and 768px layouts, accessible sheets, team setup, resume/relaunch and complete matches while blocking external HTTP. They use Chromium; install its test browser once with `npx playwright install chromium`.

`npm run ios:check` verifies native identifiers/version, package alignment, icon size/opacity, privacy manifest registration, plugin registration, copied asset equality and fresh build output. `npm run ios:assets` regenerates the native artwork. These checks complement the real-device checklist in the release guide.

Privacy information is available offline inside the app. Publish an owner-reviewed privacy policy and support URL for App Store Connect before submission; the app does not depend on an unverified external policy link.
