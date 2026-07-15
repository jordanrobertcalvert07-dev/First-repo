# Stack & architecture

Decisions approved in Phase 0. This is the source of truth for how LifeLike is built;
update it when a decision changes.

## The core tradeoff

Same data on web **and** phone, encrypted so the server can never read a field. Those
two goals do not conflict — E2EE sync delivers both. What conflicts is **hardware-grade
key protection** and **web**:

- On phone, the encryption key lives in the Secure Enclave / Android Keystore. The OS
  never hands the key to a process — it only gates access to it behind biometrics.
- The browser has **no equivalent**. While the app is unlocked, the key sits in
  JavaScript memory and the decrypted data is in the JS heap. No web API can wall that
  off from a malicious extension, an XSS bug, or someone at the unlocked machine.

**Conclusion:** web is a genuinely weaker vault than the phone, and that gap is a
platform limitation, not something engineering can close. This is *why* the most
sensitive sections are phone-only (below).

## 1. Cross-platform — single Expo codebase

One Expo / React Native codebase targets iOS, Android, and Web (shipped as an
installable PWA). Layouts are **deliberately divergent**, not stretched:

- **Phone / narrow:** one column, bottom-tab navigation, and the AI capture bar locked
  to the top (always reachable; content scrolls under it).
- **Web / wide:** left sidebar, multi-column, top command-bar capture, keyboard
  shortcuts, wide charts.

The theme follows the sun on the device's clock automatically — there is **no in-app
theme switcher**, and sunrise/sunset are auto-derived from location (no manual latitude).

The **design system is shared** (tokens, type scale, sun logic, color interpolation as
plain data/logic); **component implementations are per-shape**.

The core (`packages/core`: schema, validation, crypto, sync, AI parsing, sun/theme
math, tokens) is kept **UI-agnostic** so the web build can later graduate into its own
Vite app reusing 100% of the core, with no rewrite — the decision stays reversible
toward a two-UI split if web polish ever demands it.

## 2. Encryption at rest

**Phone.** SQLCipher via **op-sqlite** — AES-256 whole-database-file encryption. A
random 256-bit DB key is generated on-device and stored in Keychain (Secure
Enclave-backed) / Android Keystore, gated by biometrics.

**Web.** SQLite-WASM in **OPFS** with a WebCrypto (AES-GCM) encrypted layer — same
SQLite schema and queries as phone, a different vault. The wrapping key is unlocked by a
**WebAuthn passkey using the PRF extension** where available (same Face ID / fingerprint
on supported devices; key material never leaves the authenticator boundary), falling
back to an **Argon2id passphrase**. The key lives in memory only and is wiped on
lock/timeout.

- **What web encryption protects:** data at rest if someone copies browser storage
  without unlocking (ciphertext only); the sync server (E2EE); a locked / powered-off
  machine when the key is not cached.
- **What it does not protect:** anything while unlocked — a malicious extension, app
  XSS, or someone at the unlocked machine can reach the in-memory key and decrypted
  data. No hardware isolation. This is the unavoidable gap.

## 3. Biometric unlock

**Phone.** `expo-local-authentication` (Face ID / Touch ID / Android BiometricPrompt)
gates the hardware-held DB key. The **Medical subsection** gets a *second*, separate
biometric gate even after app unlock, with a short auto-relock, and OS-level exclusion
from screenshots and the app-switcher preview (`FLAG_SECURE` on Android; hide-on-
background on iOS).

**Web.** WebAuthn passkeys — the same finger/face on a supported device, but a
**different security model**: WebAuthn proves presence and (with PRF) yields key
material, but the browser is still the trust boundary. No secure-display guarantee;
screenshot / app-switcher exclusion essentially does not exist on web (best effort is
blur-on-blur, which a determined screenshot beats). This is another reason the sensitive
sections default to phone-only.

## 4. Sync (end-to-end encrypted) + recovery

**Backbone: Evolu** — a local-first library that is SQLite + CRDT + built-in E2EE + a
mnemonic recovery phrase as the master key, with React Native and web support. The
server only ever stores/relays ciphertext. Evolu's text merge is last-write-wins per
field, so a small **Yjs text-CRDT** layer is added on just the long-form fields
(journals, the medical "story" fields) to satisfy the "keep both same-day versions, let
me merge" requirement.

Offline-first on both platforms — everything works with no connection except the AI
interface. Conflict handling never silently picks a winner on long-form text.

### Recovery — understand before committing

Because the server can never read the data, it can **never help recover it**. The key is
protected on each device by biometrics / passkey, and the only portable escape hatch is
a **recovery phrase written down once, offline** (a BIP39-style mnemonic — Evolu's
"owner" model). With it, data restores onto a new device.

**Lose every device *and* the phrase → the data is gone, permanently, by design.** There
is no "forgot password"; there fundamentally cannot be one without breaking E2EE. Paired
with periodic **encrypted export files** as a belt-and-suspenders backup.

## 5. Phone-only sensitive sections

A first-class per-section setting: `syncScope: device-local | phone-only-sync | all-devices`.

- **Medical + all Substance sections default to `device-local`** — encrypted under a key
  the browser is never provisioned, change-ops tagged so the sync layer never delivers
  them to a web device. On web they render an "Available on phone only" locked state.
- Any section's scope is changeable later.

## 6. AI interface

Anthropic API, **tool-use** pattern: a natural-language utterance + strict per-section
schemas → the model returns *proposed structured writes* → the app shows a **preview /
diff per target section, editable and rejectable per field → the user commits**. Never a
silent write. Handles backfill / relative time; returns a clarifying question instead of
guessing when genuinely ambiguous.

- **Key storage:** Keychain / Keystore on phone; on web there is no OS keychain, so the
  key lives **encrypted in the app store** (never source, never plaintext config) —
  honestly weaker, and documented as such.
- **Context controls:** a setting for what context is sent, and a hard toggle that keeps
  the medical profile out of every API call.
- **Voice:** on-device STT on phone (iOS Speech / Android SpeechRecognizer); on web,
  truly on-device transcription is limited (Web Speech is often cloud-backed) — the app
  is explicit about what is local vs not.

## Phasing

1. **Skeleton** — monorepo, UI-agnostic core, sun/theme engine with live interpolation,
   both navigation shells, encrypted SQLite + biometric unlock, and the **Today/Home**
   screen + **AI capture bar** built for real. ← Phase-1 checkpoint.
2. Capture wiring + Today + Daily routine.
3. Health hub + Medical (double-locked) + Biometrics.
4. Substance sections.
5. Journals + cross-referencing.
6. Contacts, Ideas, Goals.
7. E2EE sync + device list/revoke + conflict-merge UI + recovery. *(Schema is
   sync-aware from Phase 1, so this is not a retrofit.)*
8. Insights / correlations, global search, timeline, export/import, accessibility polish.
