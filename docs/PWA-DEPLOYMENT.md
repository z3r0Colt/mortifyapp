# PWA deployment and phone checks

Requires Node 24. Run commands from the project folder (use npm.cmd and npx.cmd in Windows PowerShell if script execution is disabled).

1. Run `npm ci`, `npm test`, and `npm run build`.
2. Run `npm run preview`; open http://localhost:4173. Only the production preview includes the service worker. A phone needs HTTPS to use Web Crypto and service workers; a plain LAN HTTP address does not suffice.
3. Replace every PLACEHOLDER in public/content with owner checked content. Add further pack filenames to index.json. Do not launch publicly with placeholder readings. The last afterFallReadings entry is used as the closing assurance reading.
4. Push to `main`. `.github/workflows/pages.yml` runs the tests, builds with `BASE_PATH=/mortifyapp/`, copies `index.html` to `404.html` so deep routes load the app, and publishes to https://z3r0colt.github.io/mortifyapp/. Watch it under the repo's Actions tab. The repo must stay public for free GitHub Pages.
5. To turn on the brethren features, add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_VAPID_PUBLIC_KEY` as repository secrets (Settings > Secrets and variables > Actions), then re-run the workflow. These three are public by design and end up in the site's code. No secret server key belongs in VITE_ variables. To test a subfolder build locally, run the build with `BASE_PATH=/mortifyapp/` set, then `npm run preview` and open http://localhost:4173/mortifyapp/.
6. Open the HTTPS URL, finish onboarding and set a PIN. Add to the home screen on Android using the browser install option. On iPhone use Safari > Share > Add to Home Screen.
7. Wait for the service worker to install (DevTools > Application > Service Workers), close and reopen, turn on airplane mode, and visit Reading, Flee, Examination, Patterns, After a fall, and Settings. Content, fonts, and saves must still work. Reload a deep route offline too.
8. Check light/dark system modes, 320px and 390px screens, landscape, keyboard open, text zoom, and safe areas. Confirm fall screens have no red controls or animation. Check that leaving the app locks private storage.
9. Check PIN on a phone, both answers in Flee, examination save, confession save, and JSON export. Exported text is readable and must be kept private. Use disposable data for forgotten-PIN and delete tests.

Local production builds and encryption tests pass. The connected browser inventory was empty, so visual device checks have not been performed in this environment. The PWA is live on GitHub Pages. `vercel.json` is no longer used.

Sources: [Vite deployment](https://vite.dev/guide/static-deploy.html#github-pages), [PWA install prompts](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt).
