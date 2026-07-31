// Bundles the game into a single self-contained page, then stages it as the
// Capacitor web directory.
//
//   node build.js
//
// Produces:
//   gaelic-hero.html   standalone single file — double-click to play
//   www/index.html    the same bundle, plus PWA manifest + service worker
//   www/manifest.webmanifest
//   www/sw.js         offline cache, versioned by content hash
//   www/privacy.html  privacy policy (both stores require a reachable copy)
//
// The webfont @import is stripped and the font tokens re-pointed at system
// faces, so the app never waits on — or silently falls back from — a font CDN
// that is unreachable offline or blocked inside a native WebView.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DIR = __dirname;
const WWW = path.join(DIR, "www");
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");
const write = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
};

const APP_NAME = "Gaelic Hero";
const APP_DESC =
  "A skill-based Gaelic football career game. Win your division, survive the championship, " +
  "and climb from Junior B club football to an All-Ireland and an All Star.";
const THEME = "#0E1116";
const CONTACT = "CONTACT_EMAIL_HERE";

const SYSTEM_FONTS = `
/* Bundled build: system faces only — no network requests. */
:root {
  --font-display: ui-sans-serif, system-ui, -apple-system, "Segoe UI Variable Display", "Segoe UI", Roboto, sans-serif;
  --font-body:    ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono:    ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
}
`;

// native.js goes last: its back-button handler reaches into the rendered DOM,
// so the app must already be wired up.
const SCRIPTS = [
  "season.js", "progress.js", "data.js", "guide.js",
  "audio.js", "confetti.js", "minigames.js", "match.js", "app.js",
  "native.js",
];

const css = read("styles.css").replace(/^@import url\([^)]*\);\s*$/m, "") + SYSTEM_FONTS;
const scripts = SCRIPTS.map((f) => `<script>\n${read(f)}\n</script>`).join("\n");

const head = (extra) => `<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<title>${APP_NAME} — Junior B to All-Ireland</title>
<meta name="description" content="${APP_DESC}" />
<meta name="theme-color" content="${THEME}" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="${APP_NAME}" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="format-detection" content="telephone=no" />
${extra}<style>
${css}
</style>`;

const body = `<div id="app"></div>
${scripts}`;

// ---- 1. Standalone single file -------------------------------------------

const standalone = `<!doctype html>
<html lang="en">
<head>
${head("")}
</head>
<body>
${body}
</body>
</html>
`;
write(path.join(DIR, "gaelic-hero.html"), standalone);

// ---- 2. Web manifest ------------------------------------------------------

const manifest = {
  name: APP_NAME,
  short_name: APP_NAME,
  description: APP_DESC,
  start_url: ".",
  scope: ".",
  display: "standalone",
  orientation: "portrait",
  background_color: THEME,
  theme_color: THEME,
  categories: ["games", "sports"],
  icons: [
    { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
write(path.join(WWW, "manifest.webmanifest"), JSON.stringify(manifest, null, 2) + "\n");

// ---- 3. Privacy policy ----------------------------------------------------

write(path.join(WWW, "privacy.html"), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${APP_NAME} — Privacy Policy</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0 auto; padding: 32px 20px 64px; max-width: 40rem;
         background: ${THEME}; color: #EDF0F4; line-height: 1.6;
         font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  h1 { font-size: 1.7rem; margin: 0 0 4px; letter-spacing: -0.02em; }
  h2 { font-size: 1.05rem; margin: 28px 0 6px; color: #6FCF97; }
  p, li { color: #C7CED8; }
  .updated { color: #8A93A2; font-size: .9rem; margin: 0 0 24px; }
  a { color: #6FCF97; }
</style>
</head>
<body>
<h1>Privacy Policy</h1>
<p class="updated">${APP_NAME} · last updated ${new Date().toISOString().slice(0, 10)}</p>

<p><strong>${APP_NAME} does not collect, transmit, or share any personal data.</strong>
The game runs entirely on your device.</p>

<h2>What is stored</h2>
<p>Your career progress — player name, club, county, attributes, season and
match history, achievements and settings — is saved in your device's local
storage so the game can resume where you left off. It never leaves your device.</p>

<h2>What is not collected</h2>
<ul>
  <li>No accounts, sign-in, email address or contact details.</li>
  <li>No analytics, tracking, advertising identifiers or third-party SDKs.</li>
  <li>No location, contacts, camera, microphone, photos or health data.</li>
  <li>No network requests — the game works fully offline.</li>
</ul>

<h2>Children</h2>
<p>The game is suitable for all ages and collects nothing from anyone,
including children under 13.</p>

<h2>Deleting your data</h2>
<p>Use <em>Retire &amp; start a new career</em> in the Player tab to clear your
save, or uninstall the app. Uninstalling removes all stored data permanently.</p>

<h2>Changes</h2>
<p>If this policy changes, the updated version will be published here with a
new date.</p>

<h2>Contact</h2>
<p>Questions about this policy: <a href="mailto:${CONTACT}">${CONTACT}</a></p>
</body>
</html>
`);

// ---- 4. App page + service worker ----------------------------------------

const appPage = `<!doctype html>
<html lang="en">
<head>
${head(`<link rel="manifest" href="manifest.webmanifest" />
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png" />
<link rel="icon" href="icons/favicon-32.png" sizes="32x32" />
`)}
</head>
<body>
${body}
<script>
  // Only meaningful on the web/PWA build: the native shell already ships the
  // assets on-device, and file:// has no service worker support.
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
</script>
</body>
</html>
`;
write(path.join(WWW, "index.html"), appPage);

// Version the cache by content so a rebuild always invalidates the old shell.
const version = crypto.createHash("sha256").update(appPage).digest("hex").slice(0, 12);
write(path.join(WWW, "sw.js"), `// Generated by build.js — do not edit.
const CACHE = "gaelic-hero-${version}";
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest", "./privacy.html",
  "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/maskable-192.png", "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png", "./icons/favicon-32.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first: the whole game is one bundled page, so there is nothing to
// revalidate mid-session. A new build lands on the next activation.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).catch(() =>
      e.request.mode === "navigate" ? caches.match("./index.html") : Response.error()
    ))
  );
});
`);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1) + " KB";
console.log(`gaelic-hero.html         ${kb(standalone)}`);
console.log(`www/index.html           ${kb(appPage)}   (cache ${version})`);
console.log("www/manifest.webmanifest, www/sw.js, www/privacy.html");
