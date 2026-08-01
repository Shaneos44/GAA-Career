// Headless career simulation — the safety net for season progression.
//
//   node tools/test-career.js
//
// Drives whole careers through every phase transition (league → championship
// → off-season → next league) across a wide spread of player skill, so a
// regression in any one path fails here rather than in someone's save.
//
// This exists because a season-rollover crash once shipped: a browser test
// that only ever *won* its championship never exercised the off-season.

const path = require("path");

global.window = {};
require(path.join(__dirname, "..", "season.js"));
require(path.join(__dirname, "..", "progress.js"));
require(path.join(__dirname, "..", "data.js"));

const G = window.GaaCareer;
const S = window.GaaSeason;

/** Spends training points the way a player actually would, cheapest first.
    Without this the simulated player never improves and the difficulty curve
    is measured against a permanent beginner. */
function spendPoints(state) {
  let s = state;
  for (let i = 0; i < 60; i++) {
    const key = G.ATTRS
      .map((a) => a.key)
      .reduce((a, b) => (G.upgradeCost(s.attributes[a]) <= G.upgradeCost(s.attributes[b]) ? a : b));
    const cost = G.upgradeCost(s.attributes[key]);
    if (!Number.isFinite(cost) || s.trainingPoints < cost) break;
    s = G.upgradeAttribute(s, key);
  }
  return s;
}

let failures = 0;
function check(label, ok, detail) {
  if (!ok) {
    failures += 1;
    console.error(`  FAIL  ${label}${detail ? " — " + detail : ""}`);
  }
}

/** Plays `seasons` full seasons at a fixed skill level. Throws are failures. */
function runCareer({ label, skill, positionKey, seasons }) {
  let s = G.createCareer({ name: "Test", county: "Mayo", club: "Ballina", positionKey });
  const seen = { promoted: 0, relegated: 0, champWins: 0, offseasons: 0 };
  const contribution = () => G.resolvePlayerEvents([
    { type: "shot", score: skill }, { type: "catch", score: skill },
    { type: "tackle", score: skill },
  ]);

  let guard = 0;
  const guardLimit = seasons * 400;
  while (s.season <= seasons && guard++ < guardLimit) {
    const before = { phase: s.phase, season: s.season, round: s.league && s.league.round };

    if (s.phase === "league") {
      check(`${label}: league fixture exists`, !!G.nextLeagueFixture(s),
        `season ${s.season} round ${s.league.round}`);
      s = spendPoints(G.playLeagueMatch(s, contribution()));
      // A league match must always consume a round.
      if (before.phase === "league" && s.phase === "league") {
        check(`${label}: league round advances`, s.league.round > before.round);
      }
    } else if (s.phase === "championship") {
      const fx = G.nextChampionshipFixture(s);
      check(`${label}: championship fixture exists`, !!fx, `season ${s.season}`);
      if (!fx) break;
      s = spendPoints(G.playChampionshipMatch(s, contribution()));
    } else if (s.phase === "offseason") {
      seen.offseasons += 1;
      const prevSeason = s.season;
      const prevTier = s.tierIndex;
      const change = s.pendingTierChange || 0;
      if (s.championship && s.championship.won) seen.champWins += 1;

      s = spendPoints(G.startNextSeason(s));   // the transition that once threw

      check(`${label}: season increments`, s.season === prevSeason + 1,
        `${prevSeason} -> ${s.season}`);
      check(`${label}: back to league phase`, s.phase === "league", s.phase);
      check(`${label}: fresh league table`, s.league && s.league.round === 0);
      check(`${label}: tier moved as promised`, s.tierIndex === prevTier + change,
        `expected ${prevTier + change}, got ${s.tierIndex}`);
      check(`${label}: tier stays in range`, s.tierIndex >= 0 && s.tierIndex <= G.TOP_TIER);
      if (change > 0) seen.promoted += 1;
      if (change < 0) seen.relegated += 1;
    } else {
      check(`${label}: known phase`, false, s.phase);
      break;
    }
  }

  check(`${label}: completed without stalling`, guard < guardLimit,
    `hit guard limit at season ${s.season} phase ${s.phase}`);
  check(`${label}: reached the target season`, s.season > seasons,
    `stopped at season ${s.season}`);
  check(`${label}: rolled over every season`, seen.offseasons === seasons,
    `${seen.offseasons} of ${seasons}`);
  return seen;
}

console.log("Career simulation");
const strong = runCareer({ label: "strong player", skill: 92, positionKey: "ff", seasons: 14 });
console.log(`  strong: ${strong.promoted} promotions, ${strong.relegated} relegations, ${strong.champWins} championships`);
check("a strong player is promoted at least once", strong.promoted >= 1);

const weak = runCareer({ label: "weak player", skill: 8, positionKey: "fb", seasons: 10 });
console.log(`  weak:   ${weak.promoted} promotions, ${weak.relegated} relegations, ${weak.champWins} championships`);

const mid = runCareer({ label: "average player", skill: 55, positionKey: "mf", seasons: 12 });
console.log(`  mid:    ${mid.promoted} promotions, ${mid.relegated} relegations, ${mid.champWins} championships`);

// A player parked at the top tier must never try to promote past the ladder.
console.log("Ceiling and floor");
let top = G.createCareer({ name: "Top", county: "Kerry", club: "X", positionKey: "mf" });
// Anyone who has actually climbed to Div. 1 arrives with the attributes to
// match; a rookie parachuted in would just be relegated, which tests nothing.
const eliteAttrs = {};
G.ATTRS.forEach((a) => { eliteAttrs[a.key] = 88; });
top = { ...top, tierIndex: G.TOP_TIER, attributes: eliteAttrs };
top.league = S.createLeague(G.TIERS[G.TOP_TIER], G.teamName(top));
let g2 = 0;
while (top.season <= 4 && g2++ < 2000) {
  if (top.phase === "league") top = spendPoints(G.playLeagueMatch(top, G.resolvePlayerEvents([{ type: "shot", score: 99 }])));
  else if (top.phase === "championship") {
    if (!G.nextChampionshipFixture(top)) break;
    top = spendPoints(G.playChampionshipMatch(top, G.resolvePlayerEvents([{ type: "shot", score: 99 }])));
  } else top = spendPoints(G.startNextSeason(top));
  check("never exceeds the top tier", top.tierIndex <= G.TOP_TIER, String(top.tierIndex));
}
check("a dominant player can win an All-Ireland", top.career.allIrelands >= 1,
  `${top.career.allIrelands} in 4 seasons at the top`);
console.log(`  top tier: ${top.career.allIrelands} All-Ireland(s) in 4 seasons`);

// Relegation must bottom out at Junior B rather than going negative.
let floorState = G.createCareer({ name: "Floor", county: "Mayo", club: "X", positionKey: "ff" });
let g3 = 0;
while (floorState.season <= 6 && g3++ < 3000) {
  if (floorState.phase === "league") floorState = G.playLeagueMatch(floorState, G.resolvePlayerEvents([{ type: "shot", score: 2 }]));
  else if (floorState.phase === "championship") {
    if (!G.nextChampionshipFixture(floorState)) break;
    floorState = G.playChampionshipMatch(floorState, G.resolvePlayerEvents([{ type: "shot", score: 2 }]));
  } else floorState = G.startNextSeason(floorState);
  check("never drops below Junior B", floorState.tierIndex >= 0, String(floorState.tierIndex));
}
console.log(`  floor: ended at ${G.TIERS[floorState.tierIndex].label}`);

// ---- Resting must cost the fixture, not hand out free energy ----
console.log("Resting");
{
  let r = G.createCareer({ name: "Rest", county: "Mayo", club: "X", positionKey: "mf" });
  r = { ...r, energy: 20 };
  const roundBefore = r.league.round;
  const playedBefore = r.league.table.reduce((n, t) => n + t.p, 0);
  r = G.restUp(r);
  check("rest advances the league round", r.league.round === roundBefore + 1,
    `${roundBefore} -> ${r.league.round}`);
  check("rest plays every fixture in the round",
    r.league.table.reduce((n, t) => n + t.p, 0) === playedBefore + S.TEAMS_PER_DIVISION);
  check("rest restores energy", r.energy > 20, String(r.energy));
  check("rest does not count as an appearance", r.career.matches === 0, String(r.career.matches));

  // Resting a whole season must still reach the championship and the off-season.
  let all = G.createCareer({ name: "Rester", county: "Mayo", club: "Y", positionKey: "ff" });
  for (let i = 0; i < S.LEAGUE_ROUNDS; i++) all = G.restUp(all);
  check("resting the full league still concludes it", all.phase === "championship", all.phase);
  let g = 0;
  while (all.phase === "championship" && g++ < 8) all = G.restUp(all);
  check("resting the championship still ends the season", all.phase === "offseason", all.phase);
  all = G.startNextSeason(all);
  check("a fully rested season still rolls over", all.season === 2 && all.phase === "league");
  console.log("  rest advances fixtures, concludes the league and rolls the season over");
}

// ---- Training is capped so points cannot be farmed ----
console.log("Training");
{
  let t = G.createCareer({ name: "Trainer", county: "Mayo", club: "Z", positionKey: "mf" });
  check("starts with a full session allowance", t.trainingSessions === G.SESSIONS_PER_ROUND);
  const tpStart = t.trainingPoints;
  const energyStart = t.energy;

  for (let i = 0; i < G.SESSIONS_PER_ROUND; i++) t = G.trainDrill(t, "shot", 90);
  check("each drill consumes a session", t.trainingSessions === 0, String(t.trainingSessions));
  check("drills earn training points", t.trainingPoints > tpStart);
  check("drills cost energy", t.energy < energyStart);

  const before = t.trainingPoints;
  t = G.trainDrill(t, "shot", 99);
  check("training is blocked with no sessions left", t.trainingPoints === before);

  // Playing a fixture refreshes the allowance.
  t = G.playLeagueMatch(t, G.resolvePlayerEvents([{ type: "shot", score: 60 }]));
  check("a fixture refreshes the allowance", t.trainingSessions === G.SESSIONS_PER_ROUND);

  // A weak drill must be worth less than a sharp one.
  let a = G.createCareer({ name: "A", county: "Mayo", club: "Z", positionKey: "mf" });
  let b = G.createCareer({ name: "B", county: "Mayo", club: "Z", positionKey: "mf" });
  const weak = G.trainDrill(a, "pass", 10).trainingPoints - a.trainingPoints;
  const sharp = G.trainDrill(b, "pass", 95).trainingPoints - b.trainingPoints;
  check("a sharp drill pays more than a sloppy one", sharp > weak, `${sharp} vs ${weak}`);
  console.log(`  sessions capped at ${G.SESSIONS_PER_ROUND}; sloppy drill ${weak} pts, sharp drill ${sharp} pts`);
}

console.log(failures === 0 ? "\nAll career checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
