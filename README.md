# The Kingdom Presentation System

A single-lesson conference presentation hub for **Lesson Two: When the Kingdom Falls**, now framing Egypt and Jerusalem beside each other as two kingdoms responding to the voice of God.

This build restores the presentation-system structure of the original project rather than treating the lesson like a marketing page.

## What is included

- Public lesson hub with no attendee login
- 33 remotely controlled presentation slides
- Four anonymous live polls
- Anonymous audience questions
- Private reflection answers saved only in the attendee's browser
- Presenter admin login
- Mobile presenter remote
- Main projector output
- Dedicated scripture output
- Confidence monitor
- OBS lower-third output
- OBS full-slide output
- Live poll result display on the projector
- Supabase realtime synchronization across devices
- Same-computer BroadcastChannel fallback

## Routes

| Route | Purpose |
|---|---|
| `/` | Public lesson hub, polls, questions, and private reflections |
| `/admin` | Full presenter command center |
| `/remote` | Mobile presenter remote |
| `/projector` | Main full-screen slide output |
| `/scriptures` | Dedicated KJV scripture output |
| `/confidence` | Current slide, next slide, notes, timer, and active scripture |
| `/obslowerthirds` | Transparent OBS lower third |
| `/obslowerthirds?green=1` | Green-screen OBS lower third |
| `/obsslides` | Full slide feed for OBS |
| `/questions` | Presenter question inbox |
| `/polls` | Presenter poll results dashboard |

Double-click any output route to enter or leave browser fullscreen.

## Poll projector repair for existing projects

If Supabase was configured before version 1.3.0, run `supabase/fix-poll-projector.sql` once. It adds the `poll_prompt_visible` state field used to put a launched poll on the projector.

## Supabase setup

This build is already bound to project `jxddmdtwcosxljjkzcvc`.

1. Open the project in Supabase.
2. Open **SQL Editor**.
3. For a fresh project, run `supabase/setup.sql` in full.
4. For an existing project, run `supabase/fix-cross-network-sync.sql` in full.
5. In **Settings → API Keys**, copy the publishable key and secret key.
6. Add these environment variables to Vercel:

```text
SUPABASE_URL=https://jxddmdtwcosxljjkzcvc.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
SUPABASE_SECRET_KEY=sb_secret_YOUR_SERVER_KEY
ADMIN_PASSWORD=choose-a-long-admin-password
SESSION_SECRET=choose-a-different-long-random-secret
```

Legacy `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` names still work. New `sb_secret_...` keys are sent only through the `apikey` header. They are never exposed to browser code.

After changing Vercel environment variables, redeploy the project. Old deployments do not receive the new values.

### Live-sync behavior

- Supabase Realtime is the primary path for slide changes across networks.
- A 300 ms server-state poll runs as a fallback when the WebSocket is unavailable.
- Poll result screens also have a server fallback, so they do not depend on the browser publishable key.
- The admin API now allows all 33 slides instead of clamping the deck at slide 23.

## Route behavior

Every permanent screen route now exists in two forms:

- An explicit Vercel rewrite to `index.html`
- A physical `/<route>/index.html` fallback

This prevents `/projector`, `/admin`, `/remote`, and the other presentation screens from returning a platform 404 when a host ignores SPA rewrites or a project is imported with static routing.

## Vercel deployment

1. Upload the **contents of this folder at the repository root**. `vercel.json`, `index.html`, `app.js`, and the route folders must all sit at the root.
2. Add all five environment variables.
3. Deploy.
4. Open `/admin` and sign in with `ADMIN_PASSWORD`.
5. Open `/projector` directly and confirm the standby screen appears before connecting the other outputs.
6. Open each remaining output route on the intended screen.

The browser receives only the public Supabase URL and publishable key from `/api/config`. Admin writes go through signed, HTTP-only presenter sessions and server-side API routes.

## Recommended live setup

- Laptop browser tab 1: `/admin`
- Phone: `/remote`
- Main projector browser or ProPresenter web source: `/projector`
- Scripture display: `/scriptures`
- Stage display: `/confidence`
- OBS browser source: `/obslowerthirds` or `/obsslides`

Set OBS browser-source backgrounds to transparent for `/obslowerthirds`. Use `?green=1` when chroma key is preferred.

## Quick verification

After deployment, open these routes on separate devices and networks:

```text
/admin
/remote
/projector
```

The connection pill should read **Live Sync** or **Synced**. Launch a poll from `/admin`, then open `/` on another phone. The poll should appear without a refresh.

If admin actions return `Supabase is not configured`, the server secret key is missing in Vercel. If the connection pill stays offline, run `supabase/fix-cross-network-sync.sql` and redeploy after checking the publishable key.

## Audience data behavior

- No attendee account or login exists.
- Reflection answers are stored only in local browser storage.
- Poll votes use an anonymous device token to prevent repeat votes from the same browser.
- Audience questions contain only the submitted text and timestamp.
- Raw poll voter tokens and audience questions are not publicly readable through Supabase RLS.

## Editing the lesson

All lesson content is in `lesson.js`:

- slides
- presenter notes
- poll definitions
- scripture bank
- reflection questions

The visual system is in `styles.css`. The title and standby background is `assets/kingdom-bg.png`.

## Test

```bash
npm test
```

The smoke test checks the slide count, route surface, Supabase files, API files, and removal of old visible branding.
