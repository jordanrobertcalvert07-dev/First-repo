# LifeLike

A private, single-user **personal life tracker** that breathes with the sun — one
codebase for phone (iOS + Android) and web, with end-to-end-encrypted sync so the
server only ever holds ciphertext.

> **Name.** "LifeLike" is the current working name.

This repository is intentionally **safe to make public**: no personal data lives in
source. Everything personal is seeded on-device into the encrypted local database or
entered through the in-app AI interface.

## Status

Phase 0 complete — stack approved. Phase 1 (skeleton) in progress.

| Phase | Scope | State |
|------:|-------|-------|
| 0 | Stack proposal + approval | ✅ done |
| 1 | Design system + sun engine + navigation shells + **Today/Home** + **AI capture bar** + local encrypted storage + biometric unlock | 🚧 core built & tested; Expo app scaffolded (`apps/mobile`); storage/biometric wiring next |
| 2 | Capture wiring + Today + Daily routine | ⬜ |
| 3 | Health hub + Medical (double-locked) + Biometrics | ⬜ |
| 4 | Substance sections | ⬜ |
| 5 | Journals + cross-referencing | ⬜ |
| 6 | Contacts, Ideas, Goals | ⬜ |
| 7 | E2EE sync + device list + conflict-merge + recovery | ⬜ |
| 8 | Insights, global search, timeline, export/import, a11y polish | ⬜ |

## Layout

```
packages/core   UI-agnostic brain — tokens, sun/theme engine, schema, capture (tested)
apps/mobile     Expo / React Native app — Android + Web (PWA), consumes core
design/         design/preview.html — standalone design-system reference
docs/           STACK.md (architecture) · DESIGN.md (design system)
```

Run: `npm install` then `npm run web` (see [`apps/mobile/README.md`](apps/mobile/README.md)).
Verify the core: `npm run core:check && npm run core:test`.

## The design preview

`design/preview.html` is a **standalone, dependency-free** preview of the shared
design system — the sun engine, the Today/Home screen, and the capture → review →
commit flow, in both the phone shell and the web shell. Open it in any browser.

Query params for deep-linking a state: `?t=<minutes 0–1439>&shape=phone|web&lat=<deg>&demo=review`.

It is a **design reference, not the shipped app** — the real app is Expo / React
Native (see below).

## Approved stack (see [`docs/STACK.md`](docs/STACK.md))

- **Cross-platform:** single Expo / React Native codebase → iOS + Android + Web (PWA),
  with deliberately divergent phone/web layouts and a UI-agnostic core.
- **Storage at rest:** SQLCipher (op-sqlite) on phone with the key in the Secure
  Enclave / Android Keystore; SQLite-WASM + WebCrypto over OPFS on web.
- **Biometric unlock:** `expo-local-authentication` on phone; WebAuthn passkeys on web
  (a genuinely weaker model — documented honestly in the stack doc).
- **Sync:** Evolu (local-first, end-to-end-encrypted SQLite + CRDT + mnemonic
  recovery), with a Yjs text-CRDT layer on long-form journals for "keep both versions".
- **Sensitive data:** Medical + Substance sections default to **phone-only,
  device-local** — never synced to the browser, shown locked on web.
- **AI interface:** Anthropic API via tool-use; every write shown as an editable diff
  before it commits — never a silent write.

## Design direction (see [`docs/DESIGN.md`](docs/DESIGN.md))

The theme is computed from real local sunrise/sunset and interpolated continuously in
OKLCH across the day: bright generous light with sunrise-orange + cyan by day; matte
black with a muted sunset-orange and warm (never pure-white) text by night; real
golden-hour and blue-hour in-between states. One design system, two shapes.

## License

MIT — see [`LICENSE`](LICENSE).
