// GAA Career — long-term goals: achievements and per-season objectives.
// Pure logic; data.js calls in after state changes.

(function () {
  const ACHIEVEMENTS = [
    { key: "debut",      name: "The Debut",        desc: "Play your first match",            test: (c) => c.matches >= 1 },
    { key: "firstwin",   name: "Off the Mark",     desc: "Win your first match",             test: (c) => c.wins >= 1 },
    { key: "firstgoal",  name: "Green Flag",       desc: "Score your first goal",            test: (c) => c.goals >= 1 },
    { key: "motm1",      name: "Star Man",         desc: "Win Man of the Match",             test: (c) => c.motm >= 1 },
    { key: "motm10",     name: "Talisman",         desc: "Win 10 Man of the Match awards",   test: (c) => c.motm >= 10 },
    { key: "league1",    name: "Division Winners", desc: "Win a divisional league",          test: (c) => c.leaguesWon >= 1 },
    { key: "champ1",     name: "Silverware",       desc: "Win a championship",               test: (c) => c.championships >= 1 },
    { key: "double",     name: "The Double",       desc: "Win a league and championship in the same season", test: (c, s) => s.doubleWon },
    { key: "county",     name: "County Call-Up",   desc: "Reach the National League",        test: (c, s) => s.tierIndex >= 4 },
    { key: "div1",       name: "Among the Elite",  desc: "Reach National League Div. 1",     test: (c, s) => s.tierIndex >= 7 },
    { key: "allireland", name: "Sam Maguire",      desc: "Win the All-Ireland",              test: (c) => c.allIrelands >= 1 },
    { key: "allstar",    name: "All Star",         desc: "Be named in the Team of the Year", test: (c) => c.allStars >= 1 },
    { key: "century",    name: "Centurion",        desc: "Play 100 matches",                 test: (c) => c.matches >= 100 },
    { key: "sharp",      name: "Sharpshooter",     desc: "Score 100 career points",          test: (c) => c.points >= 100 },
    { key: "ovr80",      name: "Complete Player",  desc: "Reach an overall rating of 80",    test: (c, s, ovr) => ovr >= 80 },
    { key: "loyal",      name: "Ten Seasons",      desc: "Play ten seasons",                 test: (c, s) => s.season >= 10 },
  ];

  /** Returns any achievements newly unlocked by the current state. */
  function checkAchievements(state, overall) {
    const have = new Set(state.achievements || []);
    return ACHIEVEMENTS.filter((a) => !have.has(a.key) && a.test(state.career, state, overall));
  }

  // Season objectives — the manager's expectation for the year. Targets get
  // harder the higher you climb.
  function createObjective(tierIndex) {
    if (tierIndex === 0) {
      return { target: 3, desc: "Finish in the top 3 of the division", reward: 8 };
    }
    if (tierIndex < 4) {
      return { target: 2, desc: "Finish in the top 2 and push for promotion", reward: 12 };
    }
    return { target: 1, desc: "Win the division", reward: 18 };
  }

  function objectiveMet(objective, finishPos) {
    return !!objective && finishPos <= objective.target;
  }

  window.GaaProgress = { ACHIEVEMENTS, checkAchievements, createObjective, objectiveMet };
})();
