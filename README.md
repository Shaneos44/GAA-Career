# GAA Career

A level-up career game for Gaelic football. Start out with your club's
Junior B side and work your way up through the grades — Junior A,
Intermediate, Senior — then get called up to the county panel, fight
through the All-Ireland series, and chase Sam Maguire and an All Star.

## How it works

Matches aren't simulated behind your back — you **play** the key moments.

### Match Day

Every match drops you onto an animated pitch and puts you through a
sequence of timing-based skill challenges:

- **Shot at goal** — two bars, one for **power** and one for
  **placement**. Nail both and you bury a goal or split the posts.
  Miss and you pull it wide, or get blocked down and turned over.
- **High ball in** — time your jump to win the clean catch.
- **Time your hit** — land the tackle to force a turnover, or get
  beaten and hand over a scoring chance.

A ball marker sweeps across a target zone; hit **STRIKE!** (or the
spacebar) when it's over the green. You're graded PERFECT / GREAT / OK /
MISS on each attempt.

Your attributes directly change the difficulty: a higher **Kicking**
rating widens the shooting target zone, **High Fielding** widens the
catch zone, and so on. Higher grades swing the marker faster, and
playing on low energy speeds it up further.

Everything you hit or miss feeds into the real scoreline, plus a
0–100 performance rating that drives your training points, reputation,
Man of the Match odds, and All Star chances.

### Career progression

- **Attributes** — spend training points to level up Kicking, High
  Fielding, Tackling, Pace, Physicality, Stamina and Free-Taking.
  Higher-rated attributes cost more to upgrade further.
- **Reputation** — build enough reputation (and a high enough overall
  rating) at your current grade to get promoted to the next one.
- **Rest** — recovers energy when you're too tired to play well.
- **All-Ireland Final** — once you've broken into the county team and
  fought through the All-Ireland series, you'll reach Croke Park. Win
  it to bring Sam Maguire home, and strong individual form gives you a
  shot at an All Star. The career loops into a new season afterwards,
  so you can chase more medals.

Progress is saved automatically to your browser's local storage.

## Running it

No build step — it's plain HTML/CSS/JS. Either open `index.html`
directly in a browser, or serve the folder locally, e.g.:

```
python3 -m http.server 8080
```

then visit `http://localhost:8080`.

## Files

- `index.html` — page shell
- `styles.css` — all styling and animations
- `data.js` — game data & pure logic (attributes, tiers, scorelines,
  promotions, the All-Ireland Final). No DOM access.
- `match.js` — Match Day engine: the animated pitch and the timing-based
  skill challenges
- `audio.js` — procedural sound effects (WebAudio, no audio files)
- `confetti.js` — canvas confetti burst for trophy moments
- `app.js` — career-screen rendering and save/load (localStorage)
