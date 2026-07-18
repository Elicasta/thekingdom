# Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**, paste `setup.sql`, and run it once.
3. Open **Project Settings → API**.
4. Copy the project URL and the **publishable** key into `../config.js`.
5. Deploy the folder and test one poll from two different browsers.

Do not place a `service_role`, secret, or database password in `config.js`.

The app uses no login. A random UUID stored in each browser is used only to keep one current response per poll. Because there is no identity check, this blocks casual duplicate voting from the same browser, not deliberate ballot stuffing.

The in-app clear button removes votes tied to that browser’s device ID. Use `reset-polls.sql` only when you intentionally want to erase every poll result for everyone.
