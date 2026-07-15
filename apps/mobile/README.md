# @lifelike/mobile

The Expo / React Native app — one codebase for Android (your Moto G Play) and the web
(your Windows PC, as an installable PWA). It consumes `@lifelike/core` for the sun/theme
engine, tokens, schema, and capture logic.

## Run it

From the repo root:

```bash
npm install            # installs the whole workspace
npm run web            # opens the web build (fastest to see it on your PC)
# or:
npm run android        # with an Android emulator or a device + Expo Go / dev build
```

The first `npm install` pulls the Expo SDK and native modules and is large; give it a
minute.

## What's here (Phase 1 skeleton)

- **Sun-driven theme** — `ThemeProvider` recomputes the theme every minute from
  `computeTheme(now, coords)`; colors interpolate across the day exactly like the design
  preview. Location is auto-derived (defaults until `expo-location` provides one).
- **Two shapes, one shell** — `AppShell` renders the phone layout (capture bar locked to
  the top, bottom tabs) below ~900px and the web layout (sidebar, top command bar,
  columns) above it.
- **Today / Home** — greeting + phase, routine ring, outstanding, next up, and the
  "Today's river" recent log.
- **AI capture → review → commit** — the top capture bar parses an utterance (offline
  `HeuristicCaptureEngine` for now) and opens the editable review sheet; nothing writes
  until you confirm. The Anthropic tool-use engine lands in Phase 2.
- **Phone-only sections** — Medical & Substances show locked on the web build.
- **Biometric wrapper** — `src/auth/biometric.ts` (Android BiometricPrompt), wired to the
  encrypted store in a later phase.

## Fonts

Fraunces (display) + IBM Plex Sans (body/data) + IBM Plex Mono, all via the
`@expo-google-fonts/*` packages (SIL OFL) — loaded in `src/fonts.ts` under the family
names defined in `@lifelike/core` `tokens.ts`. If a font ever fails to load, the app
falls back to the platform default rather than crashing.

## Status / caveat

This app was authored in a cloud container **without an Android device or a full Expo
install**, so it has **not yet been run end-to-end here** — treat this commit as the
scaffold. The shared logic it depends on (`@lifelike/core`) *is* verified (typechecks +
unit tests). Run `npm run web` locally to bring it up; expect small first-run fixes,
which are quick to iterate on.
