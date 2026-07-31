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

## Other systems

- **Energy** drains each match and recovers with rest. Play on empty and you
  perform worse and risk picking up a knock that rules you out for a game or two.
- **Training points** are earned from matches, scaled by your performance
  rating, and spent levelling attributes. Each level costs more than the last.
- **Form**, a live league table, career records, and a full match-news feed.

Progress saves automatically to your browser.

## Playing it

**Easiest — one file.** Download just `gaa-career.html` and open it. The whole
game is bundled into that single self-contained file: no other downloads, no
network access needed.

**Or host it.** Turn on GitHub Pages (Settings → Pages → Source: *Deploy from
a branch* → `main` / `root`) and play at
`https://<user>.github.io/GAA-Career/`.

**Or run it from source:**

```
python3 -m http.server 8080
```

then visit `http://localhost:8080`.

### Rebuilding the single file

`gaa-career.html` is generated. After editing any source file:

```
node build.js
```

## Files

- `season.js` — league tables, fixtures, promotion/relegation, championship draw
- `data.js` — attributes, positions, the tier ladder, match resolution, career state
- `minigames.js` — the six skill mechanics
- `match.js` — builds each match from your position and runs it
- `app.js` — screens, tabs, save/load
- `audio.js` / `confetti.js` — procedural sound effects and celebrations
- `styles.css` — mobile-first styling
- `build.js` → `gaa-career.html` — single-file bundle (don't edit the output by hand)
