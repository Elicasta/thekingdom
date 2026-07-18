# Changelog

## 1.2.0

- Bound the build to Supabase project `jxddmdtwcosxljjkzcvc`.
- Added support for current publishable and secret API key names while keeping legacy aliases.
- Fixed new `sb_secret_...` keys being sent as invalid bearer JWTs.
- Added a public server-state fallback for cross-network control when Realtime is unavailable.
- Reduced fallback slide-sync latency to roughly 300 ms on visible screens.
- Avoided rerendering unchanged state responses.
- Added a public aggregate poll-results fallback.
- Fixed the admin API clamping the new 33-slide deck to the old 23-slide limit.
- Added an idempotent Supabase repair script and live-sync tests.

## 1.1.0

- Updated the lesson to the Egypt/Jerusalem two-kingdom structure.
- Expanded the slide deck from 23 slides to 33 slides.
- Added Pharaoh’s question from Exodus 5 and the Red Sea warning from Exodus 14.
- Added the Relief or Surrender poll and Pride as a drift option.
- Replaced the reflection questions with the new seven-section question set.
- Updated Supabase setup to allow slides 0 through 32 and seed all four polls.

## 1.0.1

- Fixed Vercel 404 responses on `/projector` and all permanent presentation routes.
- Added explicit route rewrites instead of relying on one broad catch-all rule.
- Added physical route entry files so static hosts can serve each screen without SPA rewrite support.
- Added a `404.html` application fallback.
- Added route-file checks to the smoke test.


## 1.0.0

- Rebuilt the project as a presentation and conference control system.
- Restored dedicated projector, scripture, confidence, OBS, admin, remote, poll, and question routes.
- Removed attendee login while preserving protected presenter access.
- Added all 23 slides for "When the Kingdom Falls."
- Added three live anonymous polls and presenter result controls.
- Added anonymous audience questions and presenter moderation.
- Added private on-device reflection answers.
- Added Supabase realtime state synchronization and secure server-side admin writes.
- Replaced the previous visual treatment with the supplied text-free storm background and its navy, cream, and burnt-orange palette.
- Removed duplicate title rendering from the title slide.
