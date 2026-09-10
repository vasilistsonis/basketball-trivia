# Hoops Trivia on iOS

The existing React app is packaged as an iOS app with Capacitor and Swift Package Manager. The web and iOS versions share game rules, question content and UI. The native project is `ios/App/App.xcodeproj`; the shared scheme is `App`.

This repository can be prepared and checked on Windows. A Mac with Xcode is required to compile, run an iOS simulator, sign a device build, archive and upload to TestFlight. A passing web build or local preflight does not verify those native steps.

## Project settings

| Setting | Value |
| --- | --- |
| Display name | Hoops Trivia |
| Bundle identifier | `com.hoopstrivia.app` |
| Version / initial build | `1.0.0` / `1` |
| Minimum system | iOS / iPadOS 15 |
| iPhone orientation | Portrait |
| iPad orientations | Portrait and landscape, including upside-down portrait |
| Interface appearance | Light, with the app's paper / orange / ink palette |
| Dependency manager | Swift Package Manager; CocoaPods is not required |
| App icon | Opaque 1024 × 1024 RGB PNG, generated from the basketball mark |
| Launch screen | Native adaptive layout with paper background and 1× / 2× / 3× basketball assets |

The app uses `viewport-fit=cover` and CSS safe-area padding. Capacitor's `contentInset` is `never` so the same top and bottom insets are not applied twice. The status bar starts with dark text; the app switches its style for dark screens. Keep `UIViewControllerBasedStatusBarAppearance` enabled for the Status Bar plugin.

## Prepare the bundled app

Use Node.js 22.12 or newer and the repository's committed lockfile. Run these commands from the `basketball-trivia` directory:

```sh
npm ci
npm run build
npx cap sync ios
node scripts/ios-check.mjs
```

The production build is copied into `ios/App/App/public`. Rebuild and sync after changing TypeScript, CSS, fonts, content or build-time environment variables. A shipped app loads this local bundle; it must not have a `server.url` pointing to a development server. `ios-check.mjs` compares every copied web asset against `dist`, checks bundle freshness and native settings, and detects service-role tokens in shipped text assets without printing their values.

The bundled question pack supports play without a Supabase deployment. If a remote question source is configured, set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your local environment before building. These values are public client configuration. Confirm the remote database uses the repository's read-only policies. Never use a service-role key or `sb_secret_` key in any `VITE_` variable; seeding credentials belong only to the local administrative tools.

`cap sync` updates `ios/App/CapApp-SPM/Package.swift` with the installed plugins. Keep that file under version control; do not hand-edit its generated package list. Generated `public`, `capacitor.config.json` and `config.xml` files remain ignored and are recreated by sync.

Capacitor 8.4.1 generates Windows backslashes in local Swift package paths when sync runs on Windows. The repository's `capacitor:sync:after` and `capacitor:update:after` hooks automatically run `scripts/ios-normalize.mjs`, which converts only those generated local package paths to forward slashes. This also covers a direct `npx cap sync ios` or `npx cap update ios`; on macOS the normalizer leaves already-correct paths unchanged. Preflight rejects remaining backslashes and verifies that every local package resolves to an installed `Package.swift` inside the project. If a hook was bypassed, run `node scripts/ios-normalize.mjs` before preflight. Normalization makes the manifest portable; native compilation still requires Xcode.

For native-source checks before a web build:

```sh
node scripts/ios-check.mjs --source-only
```

Regenerate the bundled icon and launch images only when changing their artwork:

```sh
node scripts/ios-assets.mjs
```

The generator uses Node's standard library and needs no network, image editor or downloaded fonts. The launch asset filenames are retained from the original Capacitor catalog, but their actual dimensions are 128, 256 and 384 pixels for a consistent 128-point mark.

## Compile and run on a Mac

Install Xcode 26 or newer with its iOS platform support. Select it as the active developer directory if several Xcode versions are installed. Complete Xcode's first-launch setup, then rerun the prepare commands above on the Mac.

```sh
xcodebuild -resolvePackageDependencies -project ios/App/App.xcodeproj -scheme App
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
npx cap open ios
```

The command-line build checks native compilation without device signing. In Xcode, select the `App` scheme and an installed iPhone simulator, then press Run. Also run an iPad simulator because this app supports both device families. Xcode may need network access to resolve the Capacitor Swift packages on the first build.

For a physical iPhone, sign in to Xcode with your Apple ID, select the `App` target, and set **Signing & Capabilities → Team** to your team. Automatic signing is enabled, but no developer team or certificate is embedded in the repository. If your team needs a different bundle identifier, change it in `capacitor.config.ts` and in the Xcode target for both configurations, then sync and run preflight again. Enable Developer Mode on the device when prompted by iOS.

## Device acceptance checks

Run these checks on the installed native app, with at least a small iPhone, a device with a home indicator / Dynamic Island, and an iPad in both orientations:

- Cold-launch in airplane mode. The title font, icons, rules, setup, categories and bundled questions must appear without network access.
- Start a two-team match; edit long team names with the software keyboard and verify the form can scroll to its controls.
- Answer correctly and incorrectly. Verify score, turn changes, double points, the question counter and the final result.
- Use each power-up, cancel and resume a question where supported, finish a match, share its result and play again. Dismissing the system share sheet must leave the result intact.
- Background the app and lock the screen after selecting an answer and again after revealing it. Resume and verify the selected answer, power-up and score remain unchanged, with no duplicate award.
- Relaunch with a saved match and verify that it resumes correctly. Start a new match from setup, confirm the replacement message, and verify old scores and used powers are cleared after Tip Off.
- Verify headers, sheets and bottom controls clear the notch, status bar and home indicator. On iPad, rotate during setup, a question and results; verify every control stays reachable.
- Enable VoiceOver, larger text and Reduce Motion. Check button labels, question focus, answer feedback and focus returning when sheets close. Check native haptic feedback and verify the physical silent switch does not affect gameplay.
- If remote content is configured, test reachable, slow, unavailable and empty responses. Confirm the app can continue using its bundled content and never waits indefinitely.
- Read the in-app privacy information. After replacing a saved match with a new one, relaunch and confirm only the new match is offered for resume.

The exact iOS keyboard, safe areas, status-bar transitions, haptics, suspension and sharing behavior require this device check even after browser QA passes.

## Privacy and App Store metadata

`App/PrivacyInfo.xcprivacy` is included in the app's Resources build phase. It declares no tracking, no app-level collected-data categories and no app-level required-reason API use. The shipped game has no sign-in, ads or analytics. Team names and match progress stay on the device unless a player explicitly shares a result; they are not sent with question requests. Native SDKs supply their own privacy declarations through their Swift packages.

If Supabase is enabled, the device sends ordinary HTTPS requests to that deployment. The hosting provider can process network metadata such as IP addresses in access logs. Before release, verify the actual provider configuration, retention and purpose against Apple's App Privacy questions and your published policy. Update both the policy and manifest if the shipping app or its services collect data; the app manifest alone does not determine App Store privacy answers. Adding analytics, accounts, advertising or a plugin that accesses a required-reason API requires another privacy review of the actual code and SDK manifests.

The encryption setting `ITSAppUsesNonExemptEncryption = NO` reflects the current app's use of platform-provided HTTPS and no custom encryption. Revisit it if cryptographic functionality changes.

In App Store Connect, supply an owner-controlled public privacy-policy URL, a support URL/contact, the app description, the appropriate age-rating answers and screenshots captured from the real iPhone and iPad app. Do not publish placeholder contact information or assume an existing domain belongs to your team. The in-app privacy text must agree with that public policy. Review any licensed question content, team names and marks used in the submitted app.

## Archive and TestFlight

1. Create or select the App Store Connect record for the final bundle identifier. App Store / TestFlight distribution requires an Apple Developer Program membership.
2. Set a new build number (`CURRENT_PROJECT_VERSION`) for each uploaded archive. Keep `MARKETING_VERSION` in both Xcode configurations and `package.json` aligned when the release version changes.
3. Run the build, sync and preflight commands again. Confirm the resulting app includes the intended production question source and no development server.
4. In Xcode, choose a generic iOS device destination and **Product → Archive**. The shared `App` scheme archives the Release configuration.
5. In Organizer, validate the archive. Inspect its privacy report and resolve any signing, SDK, icon or manifest issues Xcode reports. Use **Distribute App → App Store Connect** when ready to upload.
6. Install the processed TestFlight build on a physical iPhone and repeat the acceptance checks against that build before submitting it for App Review.

No native archive, signing, upload or App Store approval is produced by the Windows preparation steps.
