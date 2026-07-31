// Gaelic Hero — season structure: a 10-game divisional league (double
// round-robin between six teams), then a knockout championship.
//
// Promotion is earned only by winning your division. Finishing bottom
// relegates you. Pure logic — no DOM, no randomness beyond Math.random,
// so app.js/match.js can drive it and tests can drive it headlessly.

(function () {
  const TEAMS_PER_DIVISION = 6;
  const LEAGUE_ROUNDS = (TEAMS_PER_DIVISION - 1) * 2; // 10 games

  const CLUB_PREFIX = [
    "St. Brigid's", "Ballina", "Kilmacud", "Naomh Padraig", "Clonmel",
    "Ardnaree", "Rathmore", "Glenbeigh", "Carrickmore", "Ballyhaunis",
    "Dromore", "Killeenan", "Corofin", "Moycullen", "Castlebar",
  ];
  const CLUB_SUFFIX = [
    "Gaels", "Rovers", "Sarsfields", "Emmets", "Shamrocks", "Rangers",
    "Harps", "Wanderers", "Mitchels", "O'Connells", "Parnells", "Crokes",
  ];
  const COUNTY_POOL = [
    "Kerry", "Dublin", "Mayo", "Tyrone", "Donegal", "Galway", "Armagh",
    "Derry", "Cork", "Monaghan", "Kildare", "Roscommon", "Meath", "Clare",
    "Louth", "Cavan", "Down", "Westmeath", "Offaly", "Sligo", "Limerick",
  ];

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  function genTeamNames(count, isCounty, excludeName) {
    const names = new Set();
    const pool = isCounty ? COUNTY_POOL : null;
    let guard = 0;
    while (names.size < count && guard++ < 500) {
      const n = isCounty ? pick(pool) : `${pick(CLUB_PREFIX)} ${pick(CLUB_SUFFIX)}`;
      if (n !== excludeName) names.add(n);
    }
    return [...names].slice(0, count);
  }

  /** Standard circle-method round robin. Returns rounds of [i, j] pairs. */
  function roundRobin(n) {
    const rounds = [];
    const arr = [...Array(n).keys()];
    for (let r = 0; r < n - 1; r++) {
      const pairs = [];
      for (let i = 0; i < n / 2; i++) pairs.push([arr[i], arr[n - 1 - i]]);
      rounds.push(pairs);
      const fixed = arr[0];
      const rest = arr.slice(1);
      rest.unshift(rest.pop());
      arr.splice(0, arr.length, fixed, ...rest);
    }
    return rounds;
  }

  /** Builds a fresh 10-round fixture list. The player is always team 0. */
  function buildFixtures() {
    const first = roundRobin(TEAMS_PER_DIVISION);
    const fixtures = [];
    first.forEach((pairs) => {
      fixtures.push(pairs.map(([a, b]) => ({ home: a, away: b })));
    });
    first.forEach((pairs) => {
      fixtures.push(pairs.map(([a, b]) => ({ home: b, away: a })));
    });
    return fixtures;
  }

  function blankRow(name, strength, isPlayer) {
    return { name, strength, isPlayer: !!isPlayer, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, pts: 0 };
  }

  /** Creates the league for a tier: table rows, fixtures, round pointer. */
  function createLeague(tier, playerTeamName) {
    const isCounty = tier.level === "County";
    const names = genTeamNames(TEAMS_PER_DIVISION - 1, isCounty, playerTeamName);
    const table = [blankRow(playerTeamName, tier.oppBase, true)];
    names.forEach((n) => {
      table.push(blankRow(n, tier.oppBase + randInt(-7, 7), false));
    });
    return { table, fixtures: buildFixtures(), round: 0 };
  }

  function genScoreline(strength) {
    const total = Math.max(3, Math.round(strength / 4) + randInt(-4, 5));
    const maxGoals = Math.min(3, Math.floor(total / 6));
    const goals = maxGoals > 0 ? randInt(0, maxGoals) : 0;
    const points = Math.max(0, total - goals * 3);
    return { goals, points, total: goals * 3 + points };
  }

  function applyResult(row, forTotal, againstTotal) {
    row.p += 1;
    row.f += forTotal;
    row.a += againstTotal;
    if (forTotal > againstTotal) { row.w += 1; row.pts += 2; }
    else if (forTotal === againstTotal) { row.d += 1; row.pts += 1; }
    else { row.l += 1; }
  }

  function sortTable(table) {
    return [...table].sort((x, y) =>
      y.pts - x.pts ||
      (y.f - y.a) - (x.f - x.a) ||
      y.f - x.f ||
      x.name.localeCompare(y.name)
    );
  }

  function playerPosition(league) {
    return sortTable(league.table).findIndex((r) => r.isPlayer) + 1;
  }

  /** Who the player faces in the current league round. */
  function currentOpponent(league) {
    const round = league.fixtures[league.round];
    if (!round) return null;
    const fx = round.find((f) => f.home === 0 || f.away === 0);
    if (!fx) return null;
    const oppIdx = fx.home === 0 ? fx.away : fx.home;
    return { name: league.table[oppIdx].name, strength: league.table[oppIdx].strength, atHome: fx.home === 0 };
  }

  /**
   * Records the player's league result and simulates the other fixtures in
   * that round, then advances the round pointer.
   */
  function recordLeagueRound(league, yourTotal, oppTotal) {
    const round = league.fixtures[league.round];
    if (!round) return league;
    round.forEach((fx) => {
      const home = league.table[fx.home];
      const away = league.table[fx.away];
      if (fx.home === 0 || fx.away === 0) {
        const playerIsHome = fx.home === 0;
        const hFor = playerIsHome ? yourTotal : oppTotal;
        const aFor = playerIsHome ? oppTotal : yourTotal;
        applyResult(home, hFor, aFor);
        applyResult(away, aFor, hFor);
      } else {
        const hs = genScoreline(home.strength + 3).total; // slight home advantage
        const as = genScoreline(away.strength).total;
        applyResult(home, hs, as);
        applyResult(away, as, hs);
      }
    });
    league.round += 1;
    return league;
  }

  function leagueComplete(league) {
    return league.round >= LEAGUE_ROUNDS;
  }

  // ---------- Championship ----------

  const CHAMP_STAGES = ["Quarter-Final", "Semi-Final", "Final"];

  function createChampionship(tier, seedPosition) {
    // A strong league finish earns an easier draw.
    const handicap = Math.max(-6, 4 - seedPosition * 2);
    return {
      stageIndex: 0,
      eliminated: false,
      won: false,
      handicap,
      opponent: null,
    };
  }

  function championshipStageLabel(champ, tier) {
    if (tier.isTop && CHAMP_STAGES[champ.stageIndex] === "Final") return "All-Ireland Final";
    return CHAMP_STAGES[champ.stageIndex] || "Final";
  }

  function championshipOpponent(champ, tier, playerTeamName) {
    if (champ.opponent) return champ.opponent;
    const isCounty = tier.level === "County";
    const name = genTeamNames(1, isCounty, playerTeamName)[0];
    // Opposition sharpens as the rounds go on.
    const strength = tier.oppBase + 3 + champ.stageIndex * 4 - champ.handicap;
    champ.opponent = { name, strength };
    return champ.opponent;
  }

  function recordChampionshipResult(champ, won) {
    champ.opponent = null;
    if (!won) {
      champ.eliminated = true;
      return champ;
    }
    if (champ.stageIndex >= CHAMP_STAGES.length - 1) {
      champ.won = true;
      return champ;
    }
    champ.stageIndex += 1;
    return champ;
  }

  function championshipComplete(champ) {
    return champ.eliminated || champ.won;
  }

  window.GaaSeason = {
    TEAMS_PER_DIVISION,
    LEAGUE_ROUNDS,
    CHAMP_STAGES,
    createLeague,
    sortTable,
    playerPosition,
    currentOpponent,
    recordLeagueRound,
    leagueComplete,
    genScoreline,
    createChampionship,
    championshipStageLabel,
    championshipOpponent,
    recordChampionshipResult,
    championshipComplete,
    genTeamNames,
  };
})();
