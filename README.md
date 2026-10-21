# Piano Grind — hostable PWA

## Deploy to GitHub Pages

1. Unzip this package. Keep the folder structure exactly as shipped: `index.html`, `manifest.webmanifest`, `sw.js`, and the `icons/` directory must sit together.
2. Upload/commit every file to the root of your `piano-grind` repository (replace the old `index.html`; add the manifest, service worker, and icons).
3. In GitHub → Settings → Pages, enable Pages for the branch/folder you use. Wait until the HTTPS site is published.
4. Open `https://saptakmp3.github.io/piano-grind/` and refresh. In Chrome/Android use **Install app** / **Add to Home screen**. On iPhone/iPad, open in Safari → Share → **Add to Home Screen**.
5. For an existing installation, fully close and reopen the app after deployment. If an older cached version persists, unregister the previous service worker or clear the site data once, then reopen.

## What is included

- The full Piano Grind single-file app, with Peep the chick’s face corrected to front-facing eyes, a centred orange bill, and a clean head outline with no curved stroke crossing the eyes; the headphone band sits behind the head.
- The Core → Spotlight transition label: **SPOTLIGHT STARTS NEXT**.
- A web app manifest configured for a GitHub Pages project subpath.
- A service worker for offline app-shell caching and timer-completion push-notification display/click handling.
- PNG icons for 16/32/96/180/192/512 px.

## Validation performed

- JavaScript syntax checked on every inline script and `sw.js`.
- Manifest JSON parsed; manifest icon dimensions and all local linked asset paths checked.
- HTML parsed and duplicate static element IDs checked.
- All 28 generated mascot SVG variants (7 mascots × idle/happy/win/sleepy) rendered successfully.
- Static check confirmed the final Core block changes the “Up Next” label to “SPOTLIGHT STARTS NEXT”.

A full browser install/offline-navigation test could not be completed in the build environment because its browser runner blocks local and `file://` navigation. After deployment, confirm that the browser offers **Install app** and test one offline reopen. The site must be served over HTTPS (GitHub Pages does this) for installability, service workers, and web push. Push delivery also depends on the existing external push worker endpoint configured in the app; this package cannot guarantee that service’s uptime or end-to-end delivery.
