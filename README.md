# Where the Moon Meets You

A mobile-first birthday experience for Shrishti (React + Vite + TypeScript, CSS/SVG artwork, hosted on Netlify). The flow is: Secret Door → birthday greeting → Moonlit Garden (5 discoveries) → Sunset Memories → sealed letter → sunset-to-starlight finale → optional voice note → keepsake card + private note. Built against SRS v1.0.

## Run it

```bash
npm install
npm run dev      # local Vite URL
npm test         # progress, storage, and validation unit tests
npm run lint
npm run build    # must pass before deploying (FR-059)
```

## Where things live

| What | Where |
| --- | --- |
| All words: greeting, discovery messages, captions, **letter (provisional)**, wish | `src/content.ts` |
| Photos (`memory-1.jpg` … `memory-6.jpg`) | `public/images/memories/` |
| Music + voice note | `public/audio/` (see README.txt there for names) |
| Scenes / components | `src/scenes/`, `src/components/` |
| Keepsake card drawing (PNG + animated video) | `src/card/` |
| Owner inbox (`/private-inbox`) | `src/inbox/` |
| Database + Edge Function | `supabase/` |

Missing photos show styled placeholders. Missing or blocked audio falls back to silence with a small notice. The core story never depends on the backend, the clock, or any asset.

## Private notes: Supabase setup

The note form stays disabled (and says so) until Supabase is configured. It never fakes success.

1. Create a Supabase project. Run `supabase/migrations/20261028000000_reaction_messages.sql` in the SQL editor.
2. **Owner account:** Authentication → Users → *Add user* with your email. Then run:
   ```sql
   insert into public.inbox_owners (user_id) select id from auth.users where email = 'YOUR_EMAIL';
   ```
3. Authentication → URL Configuration: set Site URL to the Netlify URL and add `https://YOUR-SITE.netlify.app/private-inbox` to Redirect URLs. Consider disabling public sign-ups.
4. Deploy the function and set its secrets:
   ```bash
   supabase functions deploy submit-reaction --no-verify-jwt
   supabase secrets set ALLOWED_ORIGINS=https://YOUR-SITE.netlify.app RATE_LIMIT_SALT=some-long-random-string
   # optional email notification via Resend:
   supabase secrets set RESEND_API_KEY=... OWNER_EMAIL=you@example.com NOTIFY_FROM="Little World <notes@your-domain>"
   ```
5. In Netlify (and `.env.local` for dev), set **only** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`). Never put the service-role key or Resend key in a `VITE_` variable.

Security model: anonymous visitors have no table access at all. Notes go in only through the Edge Function (validation, 1,000-char limit, honeypot, hashed-IP rate limit of 5 per 10 minutes). Reading, status changes, and deletion require a signed-in user listed in `inbox_owners` (RLS). Deleting a note does not retract an email that was already sent.

## The gift card

After the voice note, a gift box opens to reveal a gift card (`src/scenes/GiftScene.tsx`). The wording and amount are in `gift` in `src/content.ts`; leave `amount` empty to hide it. The redeem link points to amazon.in.

- **Safest:** have Amazon email the card to her directly (schedule it for 3 November) and leave the code unset. The site then says the card is waiting in her inbox.
- **Code on the site:** set `VITE_GIFT_CARD_CODE` in Netlify's environment variables only, never in a committed file. Anyone with the link can read it in the page source, even before reaching the end, so only do this if the link goes to her alone.

## Deploy (Netlify)

`netlify.toml` already sets the build command (`npm run build`), publish dir (`dist`), the `/private-inbox` rewrite, `noindex` headers, and asset caching. Connect the repo (or drag-drop `dist`), add the two env vars, and deploy.

## Release checklist (SRS §14.3)

- [ ] Read and approve the letter, captions, and discovery messages in `src/content.ts`
- [ ] Real photos added (only ones you're comfortable sharing by link) and alt text updated
- [ ] Music/voice files added (licensed or your own), or accept silence
- [ ] `npm run build` passes
- [ ] Full journey tested on the **deployed URL** on a phone and a desktop
- [ ] Card downloads (portrait, landscape, animated) open correctly
- [ ] Note form: test send arrives; `/private-inbox` refuses you when signed out
- [ ] Keep the previous Netlify deploy available for rollback

The link is unlisted, not private: anyone who has it can open the site and everything in `/public`.
