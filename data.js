// GAA Career — game data & pure logic.
// No DOM access here: every function takes the current save-state and
// returns a brand new state (plus log entries). app.js owns rendering.

(function () {
  const COUNTIES = [
    "Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry", "Donegal",
    "Down", "Dublin", "Fermanagh", "Galway", "Kerry", "Kildare", "Kilkenny",
    "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath",
    "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Tyrone",
    "Waterford", "Westmeath", "Wexford", "Wicklow",
  ];

  const ATTRS = [
    { key: "kicking", label: "Kicking" },
    { key: "fielding", label: "High Fielding" },
    { key: "tackling", label: "Tackling" },
    { key: "speed", label: "Pace" },
    { key: "strength", label: "Physicality" },
    { key: "stamina", label: "Stamina" },
    { key: "freeTaking", label: "Free-Taking" },
  ];

  // Career path from junior club football up to the inter-county game.
  // oppBase / minOverall scale up each tier; repNeeded is the progress
  // needed at that tier before a promotion is offered.
  const TIERS = [
    { key: "jb", label: "Junior B Championship", level: "Club", oppBase: 28, minOverall: 28, repNeeded: 16,
      promo: "Your club's Junior B side won promotion — you've earned a step up to Junior A!" },
    { key: "ja", label: "Junior A Championship", level: "Club", oppBase: 36, minOverall: 36, repNeeded: 18,
      promo: "Junior A silverware in the bag. The club chairman wants you in the Intermediate team next year." },
    { key: "im", label: "Intermediate Championship", level: "Club", oppBase: 45, minOverall: 45, repNeeded: 20,
      promo: "Intermediate Championship conquered — you're stepping up to the club's Senior team." },
    { key: "sr", label: "Senior Championship", level: "Club", oppBase: 54, minOverall: 54, repNeeded: 22,
      promo: "A standout Senior campaign has caught the county selectors' eye — you've been called into the county development panel!" },
    { key: "cp", label: "County Development Panel", level: "County", oppBase: 60, minOverall: 60, repNeeded: 24,
      promo: "The county manager has promoted you onto the senior Championship panel!" },
    { key: "cs", label: "County Senior Panel", level: "County", oppBase: 66, minOverall: 65, repNeeded: 26,
      promo: "You've nailed down a starting jersey and driven the county deep into the Championship!" },
    { key: "ai", label: "All-Ireland Series", level: "County", oppBase: 72, minOverall: 70, repNeeded: 28,
      promo: "Croke Park, here you come — you've reached the All-Ireland Final!" },
    { key: "aif", label: "All-Ireland Final", level: "Croke Park", oppBase: 78, minOverall: 72, repNeeded: Infinity,
      promo: null },
  ];

  const FINAL_TIER_INDEX = TIERS.length - 1;
  const DEFENDING_TIER_INDEX = TIERS.length - 2; // All-Ireland Series — where a new season restarts

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
    return 1 + Math.floor(value / 25);
  }

  function createCareer({ name, county, club }) {
    const attributes = {};
    ATTRS.forEach((a) => {
      attributes[a.key] = randInt(32, 42);
    });
    const cleanName = (name || "").trim() || "New Player";
    const cleanClub = (club || "").trim() || `${county} Gaels`;
    return {
      name: cleanName,
      county,
      club: cleanClub,
      attributes,
      trainingPoints: 5,
      energy: 100,
      tierIndex: 0,
      reputation: 0,
      readyForFinal: false,
      season: 1,
      week: 1,
      career: {
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        motm: 0,
        allIrelandFinals: 0,
        allIrelands: 0,
        allStars: 0,
      },
      log: [
        { id: cryptoId(), type: "info", text: `${cleanName} laced up for ${cleanClub}'s Junior B side. The journey to Croke Park starts here.` },
      ],
    };
  }

  function genScoreline(strength) {
    const total = Math.max(3, Math.round(strength / 4) + randInt(-4, 5));
    const maxGoals = Math.min(3, Math.floor(total / 6));
    const goals = maxGoals > 0 ? randInt(0, maxGoals) : 0;
    const points = Math.max(0, total - goals * 3);
    return { goals, points, total: goals * 3 + points };
  }

  function scoreString(s) {
    return `${s.goals}-${String(s.points).padStart(2, "0")}`;
  }

  function pushLog(events, entry) {
    events.push({ id: cryptoId(), ...entry });
  }

  function withLog(state, events) {
    const log = [...events.reverse(), ...state.log].slice(0, 30);
    return { ...state, log };
  }

  function upgradeAttribute(state, key) {
    const value = state.attributes[key];
    const cost = upgradeCost(value);
    if (!Number.isFinite(cost) || state.trainingPoints < cost) return state;
    const attrLabel = (ATTRS.find((a) => a.key === key) || {}).label || key;
    const events = [];
    pushLog(events, { type: "train", text: `Training pays off — ${attrLabel} improved to ${value + 1}.` });
    return withLog(
      {
        ...state,
        trainingPoints: state.trainingPoints - cost,
        attributes: { ...state.attributes, [key]: value + 1 },
      },
      events
    );
  }

  function restUp(state) {
    const events = [];
    const energy = Math.min(100, state.energy + 45);
    pushLog(events, { type: "info", text: "A quiet week off — you rested up and recovered energy." });
    return withLog({ ...state, energy, week: state.week + 1 }, events);
  }

  function playMatch(state) {
    if (state.readyForFinal) return state;
    const tier = TIERS[state.tierIndex];
    const overall = computeOverall(state.attributes);
    const fatiguePenalty = state.energy < 30 ? 8 : 0;
    const yourStrength = overall - fatiguePenalty + randInt(-6, 6);
    const oppStrength = tier.oppBase + randInt(-8, 8);

    const yourScore = genScoreline(yourStrength);
    const oppScore = genScoreline(oppStrength);

    let result;
    if (yourScore.total > oppScore.total) result = "win";
    else if (yourScore.total < oppScore.total) result = "loss";
    else result = "draw";

    const margin = yourScore.total - oppScore.total;
    const motm = result === "win" && margin >= 6 && Math.random() < 0.45;

    const scaling = 1 + state.tierIndex * 0.15;
    const trainingPointsEarned = Math.round(
      (2 + (result === "win" ? 3 : result === "draw" ? 1 : 0) + (motm ? 2 : 0)) * scaling
    );
    const repEarned = Math.round(
      ((result === "win" ? 4 : result === "draw" ? 1 : 0) + (motm ? 2 : 0)) * scaling
    );

    const events = [];
    const rivalNames = ["Gaels", "O'Connells", "Emmets", "Rovers", "Sarsfields", "Parnells", "St. Brigid's", "Shamrocks"];
    const rival = rivalNames[randInt(0, rivalNames.length - 1)];

    const verb = result === "win" ? "defeated" : result === "loss" ? "lost to" : "drew with";
    pushLog(events, {
      type: result === "win" ? "win" : result === "loss" ? "loss" : "draw",
      text: `${tier.label}: ${state.club} ${scoreString(yourScore)} (${yourScore.total}) ${verb} ${rival} ${scoreString(oppScore)} (${oppScore.total}).`,
    });
    if (motm) {
      pushLog(events, { type: "motm", text: "Man of the Match! The papers are talking about you." });
    }

    let newState = {
      ...state,
      energy: Math.max(0, state.energy - 15),
      trainingPoints: state.trainingPoints + trainingPointsEarned,
      reputation: state.reputation + repEarned,
      career: {
        ...state.career,
        matches: state.career.matches + 1,
        wins: state.career.wins + (result === "win" ? 1 : 0),
        draws: state.career.draws + (result === "draw" ? 1 : 0),
        losses: state.career.losses + (result === "loss" ? 1 : 0),
        motm: state.career.motm + (motm ? 1 : 0),
      },
    };

    const overallAfter = computeOverall(newState.attributes);
    if (newState.reputation >= tier.repNeeded) {
      if (overallAfter < tier.minOverall) {
        newState.reputation = tier.repNeeded - 1;
        pushLog(events, {
          type: "info",
          text: `The selectors like your form but want a more complete player — build your overall rating to ${tier.minOverall} for the step up.`,
        });
      } else if (state.tierIndex === FINAL_TIER_INDEX - 1) {
        newState = { ...newState, tierIndex: state.tierIndex + 1, reputation: 0, readyForFinal: true };
        pushLog(events, { type: "trophy", text: tier.promo });
      } else if (state.tierIndex < FINAL_TIER_INDEX - 1) {
        newState = { ...newState, tierIndex: state.tierIndex + 1, reputation: 0 };
        pushLog(events, { type: "promo", text: tier.promo });
      }
    }

    return withLog(newState, events);
  }

  function playAllIrelandFinal(state) {
    if (!state.readyForFinal) return state;
    const overall = computeOverall(state.attributes);
    const events = [];

    const simulate = () => {
      const yourScore = genScoreline(overall + randInt(-8, 10));
      const oppScore = genScoreline(78 + randInt(-8, 12));
      return { yourScore, oppScore };
    };

    let { yourScore, oppScore } = simulate();
    let replay = false;
    if (yourScore.total === oppScore.total) {
      replay = true;
      ({ yourScore, oppScore } = simulate());
      if (yourScore.total === oppScore.total) yourScore.total += 1; // sudden-death tiebreak
    }

    const win = yourScore.total > oppScore.total;
    const margin = yourScore.total - oppScore.total;
    const motm = win && margin >= 5 && Math.random() < 0.5;

    pushLog(events, {
      type: "final",
      text: `ALL-IRELAND FINAL${replay ? " (after a replay)" : ""}: ${state.county} ${scoreString(yourScore)} (${yourScore.total}) v ${scoreString(oppScore)} (${oppScore.total}).`,
    });

    if (win) {
      pushLog(events, { type: "trophy", text: `SAM MAGUIRE IS COMING HOME! ${state.county} are All-Ireland Champions and you were on the field for every minute of it.` });
    } else {
      pushLog(events, { type: "loss", text: `Heartbreak in Croke Park — ${state.county} come up short. There's always next year.` });
    }
    if (motm) {
      pushLog(events, { type: "motm", text: "Man of the Match in an All-Ireland Final. Legendary stuff." });
    }

    const allStarChance = Math.min(0.7, Math.max(0.05, (overall - 55) / 70 + (motm ? 0.2 : 0) + (win ? 0.1 : 0)));
    const wonAllStar = Math.random() < allStarChance;
    if (wonAllStar) {
      pushLog(events, { type: "trophy", text: `AN ALL STAR! Your performances this Championship have been recognised with an All Star award.` });
    } else {
      pushLog(events, { type: "info", text: "No All Star this season — but the selectors are watching." });
    }

    const trainingPointsEarned = 12 + (win ? 6 : 0) + (motm ? 4 : 0);

    const newCareer = {
      ...state.career,
      allIrelandFinals: state.career.allIrelandFinals + 1,
      allIrelands: state.career.allIrelands + (win ? 1 : 0),
      allStars: state.career.allStars + (wonAllStar ? 1 : 0),
      motm: state.career.motm + (motm ? 1 : 0),
    };

    pushLog(events, { type: "info", text: `Season ${state.season} complete. Back to training for another Championship campaign.` });

    return withLog(
      {
        ...state,
        readyForFinal: false,
        tierIndex: DEFENDING_TIER_INDEX,
        reputation: 8,
        energy: Math.max(0, state.energy - 25),
        trainingPoints: state.trainingPoints + trainingPointsEarned,
        season: state.season + 1,
        career: newCareer,
      },
      events
    );
  }

  window.GaaCareer = {
    COUNTIES,
    ATTRS,
    TIERS,
    computeOverall,
    upgradeCost,
    createCareer,
    upgradeAttribute,
    restUp,
    playMatch,
    playAllIrelandFinal,
  };
})();
