// Bundles the game into a single self-contained gaa-career.html that runs
// from a file:// double-click or any static host, with no network access.
//
//   node build.js
//
// The webfont @import is stripped and the font tokens are re-pointed at
// system faces, so the bundle never waits on (or silently falls back from)
// a font CDN that may be blocked.

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");

const SYSTEM_FONTS = `
/* Single-file build: system faces only — no network requests. */
:root {
  --font-display: ui-sans-serif, system-ui, -apple-system, "Segoe UI Variable Display", "Segoe UI", Roboto, sans-serif;
  --font-body:    ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono:    ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
}
`;

const css = read("styles.css")
  .replace(/^@import url\([^)]*\);\s*$/m, "")
  .concat(SYSTEM_FONTS);

const scripts = ["season.js", "data.js", "audio.js", "confetti.js", "minigames.js", "match.js", "app.js"]
  .map((f) => `<script>\n${read(f)}\n</script>`)
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<meta name="mobile-web-app-capable" content="yes" />
<title>GAA Career — Junior B to All-Ireland</title>
<meta name="description" content="A level-up career game: start at Junior B club football and work your way to a county All-Ireland and an All Star." />
<meta name="theme-color" content="#0E1116" />
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
${scripts}
</body>
</html>
`;

fs.writeFileSync(path.join(DIR, "gaa-career.html"), html);
console.log(`Built gaa-career.html (${(html.length / 1024).toFixed(1)} KB)`);
