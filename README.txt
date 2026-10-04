PIANO GRIND - PWA package

UPLOAD (GitHub): put everything in this folder in the root of your piano-grind repo, replacing what is there:
  index.html   manifest.webmanifest   sw.js   icons/
Then delete the old manifest.json and old icons/icon-180.png (no longer used). Pages takes ~1 min to publish.

iPAD: delete the old Home Screen icon, open https://saptakmp3.github.io/piano-grind/ in Safari,
  Share -> Add to Home Screen, open it from there, Settings -> ENABLE NOTIFICATIONS -> SEND TEST NOTIFICATION.
  (iPadOS only reads the icon and manifest when the app is added, so the re-add matters.)

LATER UPDATES: after uploading a new index.html, bump V ("pg-v8" -> "pg-v9") in sw.js.
