# Where the Moon Meets You: Project Status

**As of:** 28 October 2026 · **Target release:** 3 November 2026 · **Baseline:** SRS v1.0

This document records what was built against the SRS, how it was verified, what is still pending, and what to do before the birthday link is sent. It is written for Abhishek (project owner) and for anyone (a developer, Codex, a reviewer) picking up the code next.

---

## 1. Summary

| Area | State |
| --- | --- |
| Recipient experience (all scenes, opening to keepsake) | **Built and tested** in a headless browser at phone, desktop, short-screen, and reduced-motion settings |
| Keepsake card (portrait PNG, landscape PNG, animated video) | **Built and tested** (downloads verified in Microsoft Edge) |
| Private note form (frontend) | **Built and tested**, including the failure-and-retry path |
| Supabase database, security rules, Edge Function | **Written, not yet deployed or run** against a real Supabase project |
| Owner inbox `/private-inbox` | **Built**; the signed-out screen is tested, but sign-in and message management are not (they need a live Supabase project) |
| Netlify configuration | **Written**; the site **has not been deployed** |
| Content (letter, captions, discovery messages) | **Provisional drafts.** These need Abhishek's review |
| Real photos, music, voice note | **Not provided yet.** The site uses placeholders and falls back to silence |

**Bottom line:** the code is feature-complete for the SRS. What's left is mostly owner work: final words, real assets, Supabase setup, deployment, and a final test on the live URL.

---

## 2. Starting point

The project began as a Vite + React + TypeScript prototype with a single `App.tsx` and `App.css`. It covered:

- the opening scene, music choice, and Secret Door
- the birthday reveal
- the Moonlit Garden, where only the first discovery (Moonflower) worked

Everything else in the SRS was missing. The prototype was backed up to `.backup/prototype/` before any changes (NFR-009). The folder is **not** a git repository.

---

## 3. What was built

### 3.1 The recipient journey

| # | Scene | What happens | Key requirements |
| --- | --- | --- | --- |
| 1 | **Opening / Secret Door** | Moonlit landscape, title, glowing door, "Would you like to hear this little world?" with *With music* / *In silence*. Tapping the door before choosing gives a gentle nudge instead of doing nothing. No audio before a choice and a tap. | FR-001–FR-006 |
| 2 | **Birthday Reveal** | Door opens, then "Happy Birthday, Shrishti. Tonight, even the moon has something special waiting for you." followed by *Begin the journey*. | FR-008, FR-009 |
| 3 | **Moonlit Garden** | Five markers in order: Moonflower → Starlit Fountain → Wishing Tree → Secret Path → Little Constellation. Each discovery unlocks the next. Tapping a locked one shows a hint. Messages open in a dismissible panel, and the Wishing Tree and Secret Path also reveal a hidden photo. Each discovery triggers a ripple plus a scene-specific effect (flowers glow, mist brightens, fireflies quicken, and so on), and lights a star in a sky constellation. A *Map* panel shows progress ("3 of 5"), each item as *found* or *waiting* in words (not colour alone), plus skip and reset links. *Show me where* highlights the next marker. After 60 seconds without progress, *Reveal the final surprise* appears. A hidden optional secret (a sleeping firefly) adds a small effect and doesn't count toward progress. When all five are found, *Follow the sunset* appears. | FR-010–FR-021 |
| 4 | **Sunset Memories** | Night melts into a peach-pink sunset. Six Polaroids float in a scattered layout with handwritten captions (no dates or locations). Tapping one opens a large viewer with previous/next (wrapping around), arrow keys, Escape, and a "2 / 6" counter. Missing photos show a styled placeholder. | FR-022–FR-028 |
| 5 | **Birthday Letter** | An envelope "for Shrishti" with a wax seal beneath the moon. Tapping the seal unfolds the letter, which starts "Dear Shrishti," and is signed "Abhishek". | FR-029–FR-032 |
| 6 | **Final Reveal** | Over about 10 seconds the sunset fades into starlight, the moon appears, the constellation draws itself, then the exact wish appears: "May life be as gentle with you as you have been with the world, and may you always find a little light waiting for you." followed by Abhishek's handwritten-style signature. | FR-033–FR-035 |
| 7 | **Voice Note** | "There is one more thing: a short voice note from Abhishek. Only if you would like." with *Listen* / *Skip*. Never autoplays. Supports Play, Pause, and Replay, and the background music is paused while it plays. If the file is missing, a gentle fallback line appears and she can continue. | FR-036, FR-037 |
| 8 | **Keepsake & Note** | Live animated card preview with *Replay the stars*. Downloads: portrait PNG (1080×1350), landscape PNG (1600×900), animated video (.mp4 or .webm depending on the browser). Private note form with a privacy notice, optional name, 1,000-character limit with a live counter, and a confirmation after sending. Closing line: "Whenever you need a little escape, this little world will be here." Links: *Read Your Letter Again*, *See the sky change again*, *Start the Journey Again*. | FR-038–FR-045, FR-056 |

**Return visits:** progress is saved in this browser. If the letter has been opened before, the opening scene adds discreet links: *Read Your Letter Again*, *Your card & a note*, and *Start the Journey Again*. The greeting itself still stays behind the door. Restarting always asks for confirmation (FR-019–FR-021).

### 3.2 Cross-cutting behaviour

- **Music (FR-003–FR-005, FR-052, NFR-012):** three scene tracks (ambience → sunset piano → finale) with crossfades. Only one track plays at a time. Track changes happen inside taps so mobile browsers allow them. A *Music on/off* toggle stays visible after the opening. If playback fails, the site continues silently and shows a small notice that can be dismissed. The music choice is **asked again on every visit**, so nothing ever plays without a fresh choice.
- **Reduced motion (FR-007):** with the OS setting on, animations become instant and timed transitions are shortened, without blocking navigation. Tested.
- **Accessibility (FR-058, NFR-004):** all controls are real buttons with accessible names. Dialogs move focus in, close with Escape, and return focus on close (modal ones also keep Tab inside). Each scene moves focus to its heading. Focus outlines are visible, and touch targets are about 44px.
- **Resilience (NFR-003, §11):** missing photos, missing audio, blocked storage, or a backend outage never block the story. Corrupt or blocked saved progress falls back to a fresh start.
- **Date independence (FR-055):** no date logic anywhere. The card date "3 November 2026" is fixed text.
- **Privacy of the link (§10.1):** `noindex` meta tag, `X-Robots-Tag` header, and `robots.txt`. These keep the site out of search engines but are **not** access control.
- **Performance (FR-053, NFR-001):** the Supabase SDK and the inbox are loaded only on `/private-inbox`, so the recipient never downloads them. The main bundle is about 82 KB gzipped. Photos load lazily, and audio loads only once music is chosen.

### 3.3 Private notes and owner inbox

- **Submission path:** browser → Supabase Edge Function `submit-reaction` → database. The function:
  - checks the sender's origin
  - caps request size
  - validates the note (1–1,000 characters) and name (up to 60)
  - silently drops bot submissions caught by a hidden honeypot field
  - rate-limits to 5 notes per 10 minutes per hashed IP
  - saves the note **first**, then optionally emails Abhishek through Resend

  Logs record IDs and status only, never message text (NFR-014).
- **Database security:** anonymous visitors have **no** access to any table. Only users listed in `inbox_owners` can read notes, change their status, or delete them, enforced by Row Level Security. Database constraints repeat the length and status rules.
- **Inbox:** magic-link sign-in limited to pre-created users (`shouldCreateUser: false`). Inbox and Archived tabs, unread count, mark read/unread, archive, move back, and delete forever (with a confirmation that says already-sent emails can't be recalled). Messages are shown as plain text, never as HTML.
- **When Supabase isn't configured:** the form is disabled with an honest message and never fakes success. The inbox explains which settings are missing.

---

## 4. Code map

```
src/
  content.ts              All words, captions, asset paths, constellation shape  ← edit content here
  App.tsx                 Scene flow, saved progress, reset, music per scene
  Root.tsx / main.tsx     Entry point; sends /private-inbox to the lazily loaded inbox
  scenes/                 OpeningScene, BirthdayReveal, MoonlitGarden, SunsetMemories,
                          LetterScene, FinalReveal, KeepsakeScene
  components/             DiscoveryMarker, DiscoveryMessage, ConstellationMap, ConstellationSymbol,
                          PolaroidViewer, PhotoFrame, BirthdayLetter, VoiceNotePrompt,
                          BirthdayCardDownload, ReactionMessageForm, MusicToggle, Notice, ConfirmDialog
  audio/                  AudioProvider (crossfades, fallback) + useAudio hook
  card/                   drawCard (canvas artwork), exportCard (PNG and video export)
  lib/                    progress, storage (versioned key), reaction validation,
                          useModal, useReducedMotion, journey.test.ts
  services/               config (public env vars), reactionMessages (fetch to Edge Function),
                          supabaseClient (lazy), inboxMessages
  inbox/                  PrivateInbox + inbox.css
  styles/                 global.css, scenes.css (prototype styles + garden additions), story.css
supabase/
  migrations/20261028000000_reaction_messages.sql
  functions/submit-reaction/index.ts
public/
  images/memories/        memory-1.jpg … memory-6.jpg go here (README.txt explains)
  audio/music, audio/voice-note   (README.txt explains file names)
  favicon.svg, robots.txt
netlify.toml, .env.example, README.md
.backup/prototype/        Untouched copy of the original prototype (git-ignored)
```

Dependencies added: `@supabase/supabase-js` (inbox only, lazily loaded) and `vitest` (dev). Template leftovers were removed (`src/assets`, `index.css`, `App.css`), and the Vite favicon was replaced with a crescent moon.

---

## 5. Verification performed

### 5.1 Automated checks (all passing)
- `npm run build`: TypeScript plus production build ✅
- `npm run lint` ✅
- `npm test`: 10 unit tests covering discovery order, no duplicates, cleanup of bad saved data, completion, empty/whitespace/1,000/1,001-character validation, name limit, save and load, music not restored, and blocked or corrupt storage ✅
- The built bundle was checked for test URLs and service-role keys; none found ✅

### 5.2 Browser journey tests
These were scripted with Playwright driving Microsoft Edge against the production build. The scripts were temporary and are **not** in the repo.

| Run | Result |
| --- | --- |
| Phone 390×844 | ✅ Full journey |
| Desktop 1366×768 | ✅ Full journey |
| Short phone 360×600 | ✅ Full journey |
| Phone with reduced motion | ✅ Full journey |
| Return visitor, animated card, music failure, inbox signed out | ✅ |

Each run checked:
- no horizontal overflow at any step
- greeting hidden before the door
- door nudge before a music choice
- locked-marker hint
- progress exactly 1 of 5 after reopening the Moonflower
- map shown
- progress kept after a reload
- photo viewer wrap-around (1 → 6 → 1)
- "Dear Shrishti," and the exact wish present
- Skip goes on to the keepsake
- portrait and landscape PNG downloads
- textarea capped at 1,000 characters
- empty-note error
- a failed send keeps the text and shows *Try again*
- reset: Cancel keeps progress, confirming clears it
- the return-visitor shortcuts work
- the animated card downloads as a real .mp4 (about 600 KB)
- choosing music with no audio files shows the notice and the story continues
- `/private-inbox` shows the sign-in form

### 5.3 Bugs found during testing and fixed
1. **The garden slid sideways when a discovery panel opened.** Focus scrolled the garden's hidden-overflow box. Fixed with `overflow: clip` and focus that doesn't scroll.
2. **Story scenes shrank to a narrow column on desktop.** Fixed by giving them an explicit full width.
3. **The Wishing Tree photo was clipped on phones.** Photo panels now get more height.
4. **On desktop, the photo panel's close button sat under the music toggle.** Photo panels are now anchored below it.
5. **On short screens, hints for locked markers were invisible.** Hints now always show.
6. **The discovery ripple appeared in the wrong place** at some screen sizes. It now follows the marker.
7. **The send button said "Try again" after a validation error.** It now says that only after a real delivery failure.
8. **Small visual fixes:** the envelope label overlapped the seal; the card date overlapped the horizon; the mobile sky constellation crowded the markers.

---

## 6. Requirement status (FR-001 – FR-060)

✅ done and tested · 🟡 implemented, not fully verified (needs real assets or live services) · ⏳ pending

| Requirement | Status | Notes |
| --- | --- | --- |
| FR-001–FR-009 Opening, music choice, door, reveal | ✅ | |
| FR-010–FR-016 Garden, five discoveries, progress map | ✅ | |
| FR-017 Hints and skip | ✅ | *Show me where* button, skip after 60s, skip link in the map |
| FR-018 Environmental reactions | ✅ | |
| FR-019–FR-021 Persistence, reset, letter re-entry | ✅ | |
| FR-022–FR-026, FR-028 Sunset, Polaroids, viewer, fallback | ✅ | Placeholders only so far |
| FR-024 Hidden photos | ✅ | Wishing Tree and Secret Path |
| FR-027 Captions | 🟡 | Provisional text, needs approval |
| FR-029–FR-032 Letter | 🟡 | Works; **letter text is a provisional draft** |
| FR-033–FR-035 Finale, exact wish, signature | ✅ | |
| FR-036 Voice note choice | ✅ | |
| FR-037 Voice note controls | 🟡 | Play/pause/replay and missing-file fallback written; not exercised with a real recording |
| FR-038, FR-040 Static cards, celestial only | ✅ | |
| FR-039 Animated card | ✅ / 🟡 | Verified in Edge (.mp4). Safari and Firefox not tested; Firefox will produce .webm |
| FR-041–FR-045 Note form, disclosure, validation, retry, no public feed | ✅ | |
| FR-046 Supabase storage | 🟡 | SQL and function written, not deployed |
| FR-047 Email notification | 🟡 | Resend integration written, not deployed |
| FR-048–FR-050 Inbox route, actions, magic link | 🟡 | Signed-out state tested; live sign-in and RLS not yet tested |
| FR-051 Retention | ✅ | Notes are kept until deleted; email can't be recalled (stated in the UI) |
| FR-052 Scene-aware music | 🟡 | Written; no audio files to test with |
| FR-053–FR-058 Loading, slow network, date independence, replay, no login, labels | ✅ | |
| FR-059 Build passes | ✅ | |
| FR-060 Netlify deploy and HTTPS check | ⏳ | Not deployed |

---

## 7. Pending work

### 7.1 Owner tasks (Abhishek): needed before release
1. **Approve the content** in `src/content.ts`. These are all drafts written to the SRS tone guidance:
   - **the letter** (5 paragraphs; the "light affectionate line" is the one about "a rare skill… I should stop testing it")
   - the six photo captions
   - the five discovery messages
   - the voice-note prompt
   - the alt texts (all currently say "A shared memory"; replace them with short real descriptions)
2. **Add photos:** `public/images/memories/memory-1.jpg` … `memory-6.jpg`. Keep each around 1200px on the long edge and under about 300 KB. Photo 3 also appears at the Wishing Tree and photo 5 at the Secret Path. Choose only images you're comfortable with anyone holding the link seeing.
3. **Add audio (optional):**
   - `public/audio/music/celestial-ambience.mp3`
   - `public/audio/music/sunset-piano.mp3`
   - `public/audio/music/finale.mp3`
   - `public/audio/voice-note/voice-note.mp3`

   Use only licensed or self-made audio. If these are skipped, *With music* will show the "music could not start" notice. Consider removing the music choice in that case.
4. **Set up Supabase** (README → "Private notes: Supabase setup"): run the SQL, create your user, add yourself to `inbox_owners`, set redirect URLs, deploy the function with `--no-verify-jwt`, and set its secrets (`ALLOWED_ORIGINS`, `RATE_LIMIT_SALT`, and optionally `RESEND_API_KEY`, `OWNER_EMAIL`, `NOTIFY_FROM`).
5. **Deploy to Netlify** and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. **Test on the live URL** using the checklist in §8, on your own phone and a laptop.

### 7.2 Technical items not yet verified
| Item | Why it matters | Suggested action |
| --- | --- | --- |
| Edge Function never run | Deno code isn't type-checked by this project's build | Deploy, then send a real note from the live site and check it arrives |
| RLS rules never tested live | Privacy of notes (TC-015) | Signed out, query `reaction_messages` with the anon key and confirm it returns nothing; sign in as the owner and confirm you see notes |
| Inbox sign-in flow | FR-048–FR-050 | Request a magic link, open it **in the same browser**, and check every action |
| Real-device and browser coverage | Only Edge (Chromium) was automated | Try iPhone Safari, Android Chrome, and desktop Firefox and Safari |
| iOS audio | iOS ignores volume changes, so crossfades become hard cuts (acceptable); playback must still start | Test *With music* on an iPhone once tracks exist |
| Animated card on Safari and Firefox | MediaRecorder support differs | If unsupported, the page already hides the button and explains; confirm this |
| Voice note with a real file | FR-037 | Test Listen, Pause, Replay, and Continue |
| Email notification | FR-047 | Confirm the email arrives and the sender domain is verified in Resend |

### 7.3 Known limitations and design choices
- **The link is unlisted, not private.** Anyone with the URL can open the site and download every photo and audio file in `/public`, including the voice note (§10.1–10.2).
- **Notification emails contain the note text**, which is convenient but means a copy lives in your inbox. Deleting the database record doesn't remove that email.
- **The rate limit keys on the IP from `x-forwarded-for`**, so people sharing one network share the limit (5 per 10 minutes).
- **Progress is per browser and device** (localStorage). A different phone starts fresh.
- **The music choice is asked on every visit**, by design, so nothing ever plays without a new choice.
- **Discovery panels are slightly translucent**, so markers behind them show faintly. This is cosmetic.
- **`public/**/README.txt` files are deployed** and publicly readable. They hold no private information; delete them after adding assets if you prefer.
- **Not a git repository.** The SRS (NFR-009) recommends version control. Run `git init` and commit before further changes.

### 7.4 Optional improvements (not required by the SRS)
- Add the Playwright journey tests to the repo (they were temporary) so they can be re-run before release.
- Owner inbox search and export, multilingual text, and a custom domain (SRS §17).

---

## 8. Release checklist (SRS §14.3)

- [ ] Letter, captions, discovery messages, and alt text approved in `src/content.ts`
- [ ] Spelling check: "Shrishti", "Abhishek", "3 November 2026", the wish
- [ ] Real photos in place; layout checked
- [ ] Audio added (or the music choice deliberately left with its fallback)
- [ ] `npm test`, `npm run lint`, `npm run build` all pass
- [ ] Supabase: SQL run, owner added, function deployed, secrets set, redirect URLs set
- [ ] Netlify: deployed over HTTPS, two env vars set
- [ ] Live URL tested on a phone **and** a desktop, start to finish
- [ ] Card downloads (portrait, landscape, animated) open and look right
- [ ] A test note arrives (database plus email); signed out, `/private-inbox` shows no data
- [ ] Test notes deleted from the inbox before sending the link
- [ ] Saved progress cleared on your test devices (or use a private window), so you see her first-visit view
- [ ] Previous Netlify deploy kept for rollback; freeze changes before 3 November

---

## 9. Commands

```bash
npm install          # install dependencies
npm run dev          # local development
npm test             # unit tests
npm run lint         # lint
npm run build        # production build into dist/
npm run preview      # serve the built site locally (http://localhost:4173)
```
