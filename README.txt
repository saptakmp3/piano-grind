PIANO GRIND - PWA package (v23)

UPLOAD (GitHub): put everything in this folder in the root of your piano-grind repo, replacing what is there:
  index.html   manifest.webmanifest   sw.js   icons/
Delete the old manifest.json and icons/icon-180.png. Pages takes ~1 min to publish.

iPAD (do all of it, in order):
  1. Delete the old Home Screen icon. Open https://saptakmp3.github.io/piano-grind/ in Safari, Share -> Add to Home Screen.
  2. Open it FROM the Home Screen. Settings -> RUN NOTIFICATION CHECK. It walks the whole chain and tells you which step fails.
  3. iPadOS Settings -> Notifications -> Piano Grind: Allow Notifications ON, Lock Screen ON, Notification Centre ON, Banners ON, Sounds ON.
     Settings -> Focus: switch Do Not Disturb / Sleep off while testing. Web apps can't override Focus or force the screen on; iPadOS decides.
  4. Leave "Background mode" ON in Settings so the timer and sound keep running when you flip to ForScore.

CLOUDFLARE WORKER (needed for alerts while the app is closed):
  - A KV namespace bound to the worker with the variable name  KV
  - A Cron Trigger:  * * * * *
  If either is missing, "Server accepted the alert" passes but no push ever arrives (the check says so).

LATER UPDATES: after uploading a new index.html, bump V ("pg-v9" -> "pg-v10") in sw.js.
