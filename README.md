# GAA Career

A level-up career game for Gaelic football. Start out with your club's
Junior B side and work your way up through the grades — Junior A,
Intermediate, Senior — then get called up to the county panel, fight
through the All-Ireland series, and chase Sam Maguire and an All Star.

## How it works

- **Play Match** — simulates a match at your current level. Wins (and
  Man of the Match performances) earn training points and reputation;
  losses still earn a little training points. Costs energy.
- **Rest** — recovers energy when you're too tired to play well.
- **Attributes** — spend training points to level up Kicking, High
  Fielding, Tackling, Pace, Physicality, Stamina and Free-Taking.
  Higher-rated attributes cost more to upgrade further.
- **Reputation** — build enough reputation (and a high enough overall
  rating) at your current grade to get promoted to the next one.
- **All-Ireland Final** — once you've broken into the county team and
  fought through the All-Ireland series, you'll reach Croke Park. Win
  it to bring Sam Maguire home, and strong individual form gives you a
  shot at an All Star. Career loops into a new season afterwards, so
  you can chase more medals.

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
- `styles.css` — all styling
- `data.js` — game data & pure logic (attributes, tiers, match
  simulation, promotions, the All-Ireland Final)
- `app.js` — rendering and save/load (localStorage)
