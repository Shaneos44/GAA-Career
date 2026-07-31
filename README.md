# GAA Career

A skill-based Gaelic football career game. Start out at your club's Junior B
side and work your way up to a county jersey, an All-Ireland, and an All Star.

Built for phones: one-handed play, bottom tab bar, and every mini-game driven
by touch.

## The season

Each season is a **10-game divisional league** — a double round-robin against
five other teams — followed by a **knockout championship**.

- **Win your division** and you go up. Nothing else earns promotion; a good
  cup run won't save a mid-table league finish.
- **Finish bottom** and you go down. Relegation cascades: lose your place at
  county level and you're back playing club football.
- **The championship** runs after the league — Quarter-Final, Semi-Final,
  Final. Lose once and your season is over. A strong league finish earns an
  easier draw. Draws go to extra time.
- **All Stars** are awarded at the end of a season, weighted by your rating,
  the level you played at, and what you won.

The ladder runs Junior B → Junior A → Intermediate → Senior Club → National
League Div. 4 → Div. 3 → Div. 2 → Div. 1. Win the championship in Div. 1 and
Sam Maguire is coming home.

## The mini-games

Matches are played, not simulated. Six distinct mechanics, all touch-first:

| Mini-game | What it is | Attribute |
|---|---|---|
| **Shot at goal** | Stop a sweeping marker in the zone — twice, for power then placement | Kicking, Free-Taking |
| **Free kick** | Drag back from the ball and release: angle *and* power | Free-Taking |
| **High ball** | Hold to charge your leap, release at the apex | High Fielding |
| **Tackle** | A fast, narrow timing window | Tackling |
| **Solo run** | Tap as fast as you can to outrun the cover | Pace |
| **Block** | Wait for the shot, tap the instant it comes — going early is punished | Reflexes |
| **Pick the pass** | Find the runner in space among drifting decoys before the clock runs out | Vision |

Your **position** decides which situations you face. A Full-Forward lives on
shots and frees; a Full-Back gets blocks and tackles; Midfield sees the widest
mix. Higher attributes widen the timing windows, and higher divisions speed
them up.

## Learning the game

You don't have to read any of this to play — the game teaches itself:

- **Coach cards.** The first time you ever meet a mini-game in a match, play
  pauses and a card explains it. Each one appears exactly once.
- **Guide tab.** Every mini-game written out with what to do and how it's
  scored, plus how promotion, relegation, energy and training all work.
- **Practice mode.** Drill any mini-game on repeat from the Guide tab, with
  nothing at stake and no effect on your career.

## Other systems

- **Energy** drains each match and recovers with rest. Play on empty and you
  perform worse and risk picking up a knock that rules you out for a game or two.
- **Training points** are earned from matches, scaled by your performance
  rating, and spent levelling attributes. Each level costs more than the last.
- **Season objectives.** The manager sets a target each year — top 3, top 2,
  or win the division, depending on your level. Hit it for a training-point bonus.
- **16 achievements**, from your first goal to Sam Maguire.
- **Form**, a live league table, career records, and a full match-news feed.
- **Settings** for sound and vibration, and you can abandon a match at any
  time — it won't be recorded and the fixture stays on your schedule.

Progress saves automatically to your browser.

## Playing it

**Easiest — one file.** Download just `gaa-career.html` and open it. The whole
game is bundled into that single self-contained file: no other downloads, no
network access needed.

**Install it like an app.** Serve `www/` over HTTPS and it installs as a PWA —
standalone, portrait, and fully playable offline via its service worker.

**Or host it.** Turn on GitHub Pages (Settings → Pages → Source: *Deploy from
a branch* → `main` / `root`) and play at
`https://<user>.github.io/GAA-Career/`.

**Or run it from source:**

```
python3 -m http.server 8080
```

then visit `http://localhost:8080`.

### Rebuilding

`gaa-career.html` and everything in `www/` are generated. After editing any
source file:

```
npm run build
```

## iOS and Android

The game is wrapped with [Capacitor](https://capacitorjs.com); `android/` and
`ios/` are scaffolded and ready to build.

```
npm install
npm run android      # build + sync + open Android Studio
npm run ios          # build + sync + open Xcode  (needs macOS)
npm run assets       # regenerate every icon and splash from assets/
```

**See [STORE.md](STORE.md) before submitting** — it covers signing, listing
copy, the data-safety answers, screenshot sizes, and an important trademark
issue with the current app name.

## Files

- `season.js` — league tables, fixtures, promotion/relegation, championship draw
- `progress.js` — achievements and season objectives
- `guide.js` — how-to-play content, shared by the Guide tab and the coach cards
- `data.js` — attributes, positions, the tier ladder, match resolution, career state
- `minigames.js` — the six skill mechanics
- `match.js` — builds each match from your position and runs it
- `app.js` — screens, tabs, save/load
- `audio.js` / `confetti.js` — procedural sound effects and celebrations
- `styles.css` — mobile-first styling
- `native.js` — Capacitor integration (splash, status bar, Android back button); no-ops on the web
- `build.js` → `gaa-career.html` + `www/` — bundle, PWA manifest, service worker, privacy policy
- `tools/make-assets.py` → `assets/`, `www/icons/` — procedurally drawn app icon and splash art
- `capacitor.config.json`, `android/`, `ios/` — the native shells
- `STORE.md` — app store submission guide
