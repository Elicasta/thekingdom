# Changelog

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
