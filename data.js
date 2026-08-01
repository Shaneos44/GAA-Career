// Gaelic Hero — game data & pure logic.
// No DOM access here: every function takes the current save-state and
// returns a brand new state (plus log entries). app.js owns rendering.

(function () {
  const S = window.GaaSeason;
  const P = window.GaaProgress;

  const COUNTIES = [
    "Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry", "Donegal",
    "Down", "Dublin", "Fermanagh", "Galway", "Kerry", "Kildare", "Kilkenny",
    "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath",
    "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Tyrone",
    "Waterford", "Westmeath", "Wexford", "Wicklow",
  ];

  const ATTRS = [
    { key: "kicking", label: "Kicking", hint: "Shot power" },
    { key: "fielding", label: "High Fielding", hint: "Catching" },
    { key: "tackling", label: "Tackling", hint: "Turnovers" },
    { key: "speed", label: "Pace", hint: "Solo runs" },
    { key: "strength", label: "Physicality", hint: "Holding out" },
    { key: "stamina", label: "Stamina", hint: "Energy drain" },
    { key: "freeTaking", label: "Free-Taking", hint: "Placed balls" },
    { key: "vision", label: "Vision", hint: "Passing" },
    { key: "reflexes", label: "Reflexes", hint: "Blocks" },
  ];

  // Positions bias which match events you see and which attributes carry them.
  const POSITIONS = [
    { key: "ff", label: "Full-Forward", blurb: "Score-hungry. Lives on shots and frees.",
      weights: { shot: 4, free: 2, catch: 1, pass: 1, sprint: 1, tackle: 0, block: 0 } },
    { key: "hf", label: "Half-Forward", blurb: "Runs hard, links play, chips in scores.",
      weights: { shot: 2, free: 1, catch: 1, pass: 3, sprint: 3, tackle: 1, block: 0 } },
    { key: "mf", label: "Midfield", blurb: "Engine room. Kickouts, catches, box-to-box.",
      weights: { shot: 1, free: 0, catch: 4, pass: 2, sprint: 2, tackle: 2, block: 1 } },
    { key: "hb", label: "Half-Back", blurb: "Wins it back and drives out of defence.",
      weights: { shot: 1, free: 0, catch: 2, pass: 2, sprint: 2, tackle: 3, block: 2 } },
    { key: "fb", label: "Full-Back", blurb: "Last line. Blocks, tackles, no passengers.",
      weights: { shot: 0, free: 0, catch: 2, pass: 1, sprint: 0, tackle: 4, block: 4 } },
  ];

  // The ladder. Promotion comes only from winning your division; finishing
  // bottom sends you down. The top tier has no promotion — only Sam Maguire.
  const TIERS = [
    { key: "jb", label: "Junior B", division: "Junior B Division", level: "Club", oppBase: 28,
      champLabel: "Junior B Championship" },
    { key: "ja", label: "Junior A", division: "Junior A Division", level: "Club", oppBase: 36,
      champLabel: "Junior A Championship" },
    { key: "im", label: "Intermediate", division: "Intermediate Division", level: "Club", oppBase: 45,
      champLabel: "Intermediate Championship" },
    { key: "sr", label: "Senior Club", division: "Senior Club Division", level: "Club", oppBase: 54,
      champLabel: "Senior Club Championship",
      promoNote: "Winning the Senior division earns a call-up to the county panel." },
    { key: "d4", label: "County Div. 4", division: "National League Div. 4", level: "County", oppBase: 61,
      champLabel: "Tailteann Cup" },
    { key: "d3", label: "County Div. 3", division: "National League Div. 3", level: "County", oppBase: 67,
      champLabel: "All-Ireland Qualifiers" },
    { key: "d2", label: "County Div. 2", division: "National League Div. 2", level: "County", oppBase: 73,
      champLabel: "All-Ireland Series" },
    { key: "d1", label: "County Div. 1", division: "National League Div. 1", level: "County", oppBase: 79,
      champLabel: "All-Ireland Championship", isTop: true },
  ];

  const TOP_TIER = TIERS.length - 1;

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function cryptoId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function computeOverall(attributes) {
    const total = ATTRS.reduce((sum, a) => sum + attributes[a.key], 0);
    return Math.round(total / ATTRS.length);
  }

  function upgradeCost(value) {
    if (value >= 99) return Infinity;
    return 1 + Math.floor(value / 20);
  }

  function teamName(state) {
    return TIERS[state.tierIndex].level === "County" ? state.county : state.club;
  }

  function scoreString(s) {
    return `${s.goals}-${String(s.points).padStart(2, "0")}`;
  }

  function pushLog(events, entry) {
    events.push({ id: cryptoId(), ...entry });
  }
  function withLog(state, events) {
    return { ...state, log: [...events.slice().reverse(), ...state.log].slice(0, 40) };
  }

  function createCareer({ name, county, club, positionKey }) {
    const position = POSITIONS.find((p) => p.key === positionKey) || POSITIONS[0];
    const attributes = {};
    ATTRS.forEach((a) => { attributes[a.key] = randInt(30, 40); });

    const cleanName = (name || "").trim() || "New Player";
    const cleanClub = (club || "").trim() || `${county} Gaels`;

    const state = {
      name: cleanName,
      county,
      club: cleanClub,
      position: position.key,
      attributes,
      trainingPoints: 6,
      energy: 100,
      tierIndex: 0,
      season: 1,
      phase: "league",
      championship: null,
      form: [],
      injury: null,
      career: {
        matches: 0, wins: 0, draws: 0, losses: 0, motm: 0,
        goals: 0, points: 0,
        leaguesWon: 0, promotions: 0, relegations: 0,
        championships: 0, allIrelands: 0, allStars: 0,
      },
      achievements: [],
      seenGames: {},                       // mini-games already explained
      settings: { sound: true, haptics: true },
      objective: P.createObjective(0),
      log: [{ id: cryptoId(), type: "info",
        text: `${cleanName} signed on at ${cleanClub}, ${position.label} on the Junior B panel. Ten league games to prove it.` }],
    };
    state.league = S.createLeague(TIERS[0], teamName(state));
    return state;
  }

  /** Records that a mini-game's coach card has been shown. */
  function markGameSeen(state, key) {
    if (state.seenGames && state.seenGames[key]) return state;
    return { ...state, seenGames: { ...(state.seenGames || {}), [key]: true } };
  }

  function toggleSetting(state, key) {
    const settings = { ...(state.settings || {}), [key]: !(state.settings || {})[key] };
    return { ...state, settings };
  }

  /** Awards any achievements the state has just unlocked. */
  function awardAchievements(state, events) {
    const unlocked = P.checkAchievements(state, computeOverall(state.attributes));
    if (!unlocked.length) return state;
    unlocked.forEach((a) => {
      pushLog(events, { type: "trophy", text: `ACHIEVEMENT — ${a.name}: ${a.desc}.` });
    });
    return { ...state, achievements: [...(state.achievements || []), ...unlocked.map((a) => a.key)] };
  }

  // ---------- Match resolution ----------

  /**
   * Turns the mini-game ratings captured during a match into score deltas
   * and a 0-100 skillIndex. Defaults to a neutral contribution so the
   * season can still be driven headlessly in tests.
   */
  function resolvePlayerEvents(events) {
    if (!events || !events.length) {
      return { yourBonus: { goals: 0, points: 0 }, oppBonus: { goals: 0, points: 0 }, skillIndex: 50 };
    }
    let yg = 0, yp = 0, og = 0, op = 0;
    events.forEach((ev) => {
      const s = ev.score;
      switch (ev.type) {
        case "shot":
          if (s >= 85) { if (Math.random() < 0.4) yg += 1; else yp += 1; }
          else if (s >= 60) yp += 1;
          else if (s < 35 && Math.random() < 0.3) op += 1;
          break;
        case "free":
          if (s >= 55) yp += 1;
          break;
        case "catch":
          if (s >= 60 && Math.random() < 0.4) yp += 1;
          else if (s < 35 && Math.random() < 0.35) op += 1;
          break;
        case "pass":
          if (s >= 70 && Math.random() < 0.55) yp += 1;
          else if (s < 35 && Math.random() < 0.3) op += 1;
          break;
        case "sprint":
          if (s >= 75 && Math.random() < 0.5) yp += 1;
          else if (s < 30 && Math.random() < 0.25) op += 1;
          break;
        case "tackle":
          if (s < 35 && Math.random() < 0.5) op += 1;
          else if (s >= 85 && Math.random() < 0.2) yp += 1;
          break;
        case "block":
          if (s >= 60) { if (Math.random() < 0.35) op -= 1; }
          else if (s < 35) { if (Math.random() < 0.4) og += 1; else op += 1; }
          break;
      }
    });
    const skillIndex = Math.round(events.reduce((sum, ev) => sum + ev.score, 0) / events.length);
    return {
      yourBonus: { goals: yg, points: Math.max(0, yp) },
      oppBonus: { goals: Math.max(0, og), points: Math.max(0, op) },
      skillIndex,
    };
  }

  function buildScore(strength, bonus) {
    const s = S.genScoreline(strength);
    s.goals += bonus.goals;
    s.points += bonus.points;
    s.goals = Math.max(0, s.goals);
    s.points = Math.max(0, s.points);
    s.total = s.goals * 3 + s.points;
    return s;
  }

  /**
   * Resolves one match — league or championship — from the player's
   * mini-game contribution, advancing the season as needed.
   */
  function playFixture(state, contribution, meta) {
    const { yourBonus, oppBonus, skillIndex } = contribution || resolvePlayerEvents(null);
    const tier = TIERS[state.tierIndex];
    const overall = computeOverall(state.attributes);
    const fatigue = state.energy < 30 ? 8 : state.energy < 55 ? 3 : 0;

    const yourScore = buildScore(overall - fatigue + randInt(-5, 5), yourBonus);
    const oppScore = buildScore(meta.oppStrength + randInt(-6, 6), oppBonus);

    const result = yourScore.total > oppScore.total ? "win"
      : yourScore.total < oppScore.total ? "loss" : "draw";

    const margin = yourScore.total - oppScore.total;
    const motmChance = 0.1 + Math.max(0, skillIndex - 50) / 160 + (margin >= 6 ? 0.12 : 0);
    const motm = result === "win" && Math.random() < motmChance;

    const skillMult = 0.6 + skillIndex / 90;
    const tierMult = 1 + state.tierIndex * 0.13;
    const tpEarned = Math.max(1, Math.round(
      (2 + (result === "win" ? 3 : result === "draw" ? 1 : 0) + (motm ? 2 : 0)) * skillMult * tierMult
    ));

    const staminaRelief = Math.round(state.attributes.stamina / 25);
    const energyCost = Math.max(6, 16 - staminaRelief);

    const events = [];
    const newState = {
      ...state,
      energy: Math.max(0, state.energy - energyCost),
      trainingPoints: state.trainingPoints + tpEarned,
      form: [result === "win" ? "W" : result === "draw" ? "D" : "L", ...state.form].slice(0, 5),
      career: {
        ...state.career,
        matches: state.career.matches + 1,
        wins: state.career.wins + (result === "win" ? 1 : 0),
        draws: state.career.draws + (result === "draw" ? 1 : 0),
        losses: state.career.losses + (result === "loss" ? 1 : 0),
        motm: state.career.motm + (motm ? 1 : 0),
        goals: state.career.goals + yourBonus.goals,
        points: state.career.points + yourBonus.points,
      },
    };

    const verb = result === "win" ? "beat" : result === "loss" ? "lost to" : "drew with";
    pushLog(events, {
      type: result === "win" ? "win" : result === "loss" ? "loss" : "draw",
      text: `${meta.label}: ${teamName(state)} ${scoreString(yourScore)} ${verb} ${meta.oppName} ${scoreString(oppScore)}.`,
    });
    if (motm) pushLog(events, { type: "motm", text: "Man of the Match — you ran the show." });

    // Knocks are more likely when you play on empty.
    if (state.energy < 25 && Math.random() < 0.22) {
      const knock = ["a hamstring strain", "a dead leg", "a rolled ankle", "a rib knock"][randInt(0, 3)];
      newState.injury = { games: randInt(1, 2), label: knock };
      pushLog(events, { type: "loss", text: `You picked up ${knock} — out for ${newState.injury.games} game(s).` });
    }

    return {
      state: newState,
      events,
      summary: { yourScore, oppScore, result, motm, tpEarned, skillIndex, label: meta.label, oppName: meta.oppName },
    };
  }

  // ---------- League ----------

  function nextLeagueFixture(state) {
    const opp = S.currentOpponent(state.league);
    if (!opp) return null;
    return {
      label: `${TIERS[state.tierIndex].division} · Round ${state.league.round + 1}`,
      oppName: opp.name,
      oppStrength: opp.strength,
      atHome: opp.atHome,
    };
  }

  function playLeagueMatch(state, contribution) {
    const meta = nextLeagueFixture(state);
    if (!meta) return state;

    const { state: afterMatch, events, summary } = playFixture(state, contribution, meta);
    const league = JSON.parse(JSON.stringify(afterMatch.league));
    S.recordLeagueRound(league, summary.yourScore.total, summary.oppScore.total);

    let next = { ...afterMatch, league };
    next.lastMatchSummary = { ...summary, kind: "league" };

    if (S.leagueComplete(league)) {
      next = concludeLeague(next, events);
    }
    next = awardAchievements(next, events);
    return withLog(next, events);
  }

  /** End of the 10-game league: decide promotion, relegation, championship seeding. */
  function concludeLeague(state, events) {
    const tier = TIERS[state.tierIndex];
    const pos = S.playerPosition(state.league);
    const won = pos === 1;
    const relegated = pos === S.TEAMS_PER_DIVISION && state.tierIndex > 0;
    const canPromote = state.tierIndex < TOP_TIER;

    pushLog(events, {
      type: won ? "trophy" : "info",
      text: `${tier.division} final table: you finished ${ordinal(pos)} of ${S.TEAMS_PER_DIVISION}.`,
    });

    const career = { ...state.career };
    let pendingTierChange = 0;

    if (won) {
      career.leaguesWon += 1;
      if (canPromote) {
        pendingTierChange = 1;
        career.promotions += 1;
        pushLog(events, { type: "trophy", text: `DIVISION WINNERS! ${tier.promoNote || `Promoted to ${TIERS[state.tierIndex + 1].division}.`}` });
      } else {
        pushLog(events, { type: "trophy", text: "DIVISION 1 LEAGUE CHAMPIONS! Nothing above this but Sam." });
      }
    } else if (relegated) {
      pendingTierChange = -1;
      career.relegations += 1;
      pushLog(events, { type: "loss", text: `Bottom of the table — relegated to ${TIERS[state.tierIndex - 1].division}.` });
    } else {
      pushLog(events, { type: "info", text: "Mid-table finish — no movement. The Championship is your second chance." });
    }

    // The manager's target for the year.
    let trainingPoints = state.trainingPoints;
    if (state.objective) {
      if (P.objectiveMet(state.objective, pos)) {
        trainingPoints += state.objective.reward;
        pushLog(events, { type: "promo",
          text: `Season objective met — "${state.objective.desc}". The manager hands you ${state.objective.reward} extra training points.` });
      } else {
        pushLog(events, { type: "info",
          text: `Season objective missed — "${state.objective.desc}".` });
      }
    }

    pushLog(events, { type: "promo", text: `${tier.champLabel} starts now. Knockout football — win or your season is over.` });

    return {
      ...state,
      trainingPoints,
      career,
      phase: "championship",
      pendingTierChange,
      championship: S.createChampionship(tier, pos),
      leagueFinishPos: pos,
    };
  }

  // ---------- Championship ----------

  function nextChampionshipFixture(state) {
    const tier = TIERS[state.tierIndex];
    const champ = state.championship;
    if (!champ || S.championshipComplete(champ)) return null;
    const opp = S.championshipOpponent(champ, tier, teamName(state));
    return {
      label: `${tier.champLabel} · ${S.championshipStageLabel(champ, tier)}`,
      oppName: opp.name,
      oppStrength: opp.strength,
      isFinal: S.championshipStageLabel(champ, tier).includes("Final"),
    };
  }

  function playChampionshipMatch(state, contribution) {
    const meta = nextChampionshipFixture(state);
    if (!meta) return state;

    const tier = TIERS[state.tierIndex];
    let { state: afterMatch, events, summary } = playFixture(state, contribution, meta);

    // Knockout football: a draw goes to extra time, decided on the day.
    let result = summary.result;
    if (result === "draw") {
      const edge = computeOverall(state.attributes) + summary.skillIndex / 4 - meta.oppStrength;
      const win = Math.random() < 0.5 + Math.max(-0.25, Math.min(0.25, edge / 60));
      result = win ? "win" : "loss";
      if (win) summary.yourScore.points += 1; else summary.oppScore.points += 1;
      summary.yourScore.total = summary.yourScore.goals * 3 + summary.yourScore.points;
      summary.oppScore.total = summary.oppScore.goals * 3 + summary.oppScore.points;
      summary.result = result;
      pushLog(events, { type: "final", text: `Level at full time — settled in extra time.` });
    }

    const champ = JSON.parse(JSON.stringify(afterMatch.championship));
    S.recordChampionshipResult(champ, result === "win");

    let next = { ...afterMatch, championship: champ };
    next.lastMatchSummary = { ...summary, kind: "championship", stageLabel: meta.label };

    if (champ.won) {
      const career = { ...next.career, championships: next.career.championships + 1 };
      if (tier.isTop) {
        career.allIrelands += 1;
        pushLog(events, { type: "trophy", text: `SAM MAGUIRE IS COMING HOME! ${state.county} are All-Ireland Champions.` });
      } else {
        pushLog(events, { type: "trophy", text: `${tier.champLabel} WINNERS! Silverware for ${teamName(state)}.` });
      }
      next = { ...next, career, doubleWon: next.doubleWon || state.leagueFinishPos === 1 };
      next.lastMatchSummary.championshipWon = true;
      next.lastMatchSummary.allIreland = !!tier.isTop;
    } else if (champ.eliminated) {
      pushLog(events, { type: "loss", text: `Knocked out of the ${tier.champLabel}. Season over.` });
      next.lastMatchSummary.eliminated = true;
    }

    if (S.championshipComplete(champ)) {
      next = { ...next, phase: "offseason" };
    }
    next = awardAchievements(next, events);
    return withLog(next, events);
  }

  // ---------- Off-season ----------

  function startNextSeason(state) {
    const events = [];
    const oldTier = TIERS[state.tierIndex];
    const overall = computeOverall(state.attributes);
    const change = state.pendingTierChange || 0;
    const newTierIndex = Math.max(0, Math.min(TOP_TIER, state.tierIndex + change));

    // All Stars are a season-long award, weighted by level and what you won.
    const champ = state.championship || {};
    const levelBonus = state.tierIndex >= 4 ? (state.tierIndex - 3) * 0.06 : -0.15;
    const allStarChance = Math.min(0.75, Math.max(0, (overall - 58) / 80 + levelBonus
      + (champ.won ? 0.2 : 0) + (state.leagueFinishPos === 1 ? 0.12 : 0)));
    const wonAllStar = Math.random() < allStarChance;

    const career = { ...state.career, allStars: state.career.allStars + (wonAllStar ? 1 : 0) };
    if (wonAllStar) {
      pushLog(events, { type: "trophy", text: `ALL STAR! You're named in the Team of the Year at ${oldTier.level.toLowerCase()} level.` });
    }

    if (change > 0) pushLog(events, { type: "promo", text: `Season ${state.season + 1}: up to ${TIERS[newTierIndex].division}.` });
    else if (change < 0) pushLog(events, { type: "loss", text: `Season ${state.season + 1}: down to ${TIERS[newTierIndex].division}.` });
    else pushLog(events, { type: "info", text: `Season ${state.season + 1} begins in ${TIERS[newTierIndex].division}.` });

    let next = {
      ...state,
      tierIndex: newTierIndex,
      season: state.season + 1,
      phase: "league",
      championship: null,
      pendingTierChange: 0,
      leagueFinishPos: null,
      energy: 100,
      injury: null,
      form: [],
      career,
      trainingPoints: state.trainingPoints + 6,
      lastSeasonAllStar: wonAllStar,
      doubleWon: false,
      objective: P.createObjective(newTierIndex),
    };
    next.league = S.createLeague(TIERS[newTierIndex], teamName(next));
    pushLog(events, { type: "info", text: `Manager's target: ${next.objective.desc}.` });
    next = awardAchievements(next, events);
    return withLog(next, events);
  }

  /**
   * Repairs a save that stalled between phases. If a phase transition ever
   * fails part-way, the save can point at a stage with no fixtures left,
   * which strands the player on a screen with no way forward. Called on load
   * so a stuck career heals itself instead of needing a reset.
   */
  function reconcile(state) {
    if (!state || !state.league) return state;
    const events = [];
    let next = state;

    if (next.phase === "league" && S.leagueComplete(next.league)) {
      next = concludeLeague(next, events);
    }
    if (next.phase === "championship" &&
        (!next.championship || S.championshipComplete(next.championship))) {
      next = { ...next, phase: "offseason" };
    }
    if (!["league", "championship", "offseason"].includes(next.phase)) {
      next = { ...next, phase: "league" };
    }
    return events.length ? withLog(next, events) : next;
  }

  // ---------- Player actions ----------

  function upgradeAttribute(state, key) {
    const value = state.attributes[key];
    const cost = upgradeCost(value);
    if (!Number.isFinite(cost) || state.trainingPoints < cost) return state;
    const label = (ATTRS.find((a) => a.key === key) || {}).label || key;
    const events = [];
    pushLog(events, { type: "train", text: `${label} up to ${value + 1}.` });
    const upgraded = awardAchievements({
      ...state,
      trainingPoints: state.trainingPoints - cost,
      attributes: { ...state.attributes, [key]: value + 1 },
    }, events);
    return withLog(upgraded, events);
  }

  function restUp(state) {
    const events = [];
    const recovery = 35 + Math.round(state.attributes.stamina / 4);
    const injury = state.injury
      ? (state.injury.games > 1 ? { ...state.injury, games: state.injury.games - 1 } : null)
      : null;
    if (state.injury && !injury) pushLog(events, { type: "info", text: "Passed fit — you're available again." });
    else if (injury) pushLog(events, { type: "info", text: `Still carrying ${injury.label}. ${injury.games} game(s) to go.` });
    else pushLog(events, { type: "info", text: "Recovery week — legs feel fresh again." });
    return withLog({ ...state, energy: Math.min(100, state.energy + recovery), injury }, events);
  }

  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  window.GaaCareer = {
    COUNTIES, ATTRS, POSITIONS, TIERS, TOP_TIER,
    computeOverall, upgradeCost, createCareer, teamName, scoreString, ordinal,
    resolvePlayerEvents,
    nextLeagueFixture, playLeagueMatch,
    nextChampionshipFixture, playChampionshipMatch,
    startNextSeason,
    upgradeAttribute, restUp,
    markGameSeen, toggleSetting, awardAchievements, reconcile,
  };
})();
