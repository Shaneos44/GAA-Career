// GAA Career — how-to-play content, shared by three places: the Guide tab,
// the first-time coach card shown in-match, and practice mode.
//
// One source of truth, so an instruction never drifts from the game it
// describes.

(function () {
  const GUIDE = [
    {
      key: "shot", icon: "⚽", name: "Shot at Goal",
      attr: "Kicking · Free-Taking",
      how: "A ball sweeps back and forth across the bar. Tap <b>STRIKE</b> when it's over the bright green centre.",
      tip: "You do this twice for every shot — once for <b>power</b>, then again for <b>placement</b>. Two good hits is a point; two near-perfect hits can be a goal.",
    },
    {
      key: "free", icon: "🎯", name: "Free Kick",
      attr: "Free-Taking",
      how: "Press on the ball and <b>drag backwards</b>, like pulling back a slingshot, then let go.",
      tip: "The gold dashed ring is your target — match both its <b>direction</b> and its <b>distance</b> from the ball. Drag further for more power.",
    },
    {
      key: "catch", icon: "🙌", name: "High Ball",
      attr: "High Fielding",
      how: "<b>Press and hold</b> to rise for the ball. The bar fills while you hold. <b>Release</b> when it reaches the green zone.",
      tip: "Let go too early and you jump short; hold too long and the bar overruns the zone entirely. Time your leap for the apex.",
    },
    {
      key: "tackle", icon: "🛡️", name: "Tackle",
      attr: "Tackling",
      how: "Same sweeping bar as a shot, but faster and with a tighter window. Tap to commit to the hit.",
      tip: "Mistime it and you're beaten for a score. Raising <b>Tackling</b> widens the window.",
    },
    {
      key: "sprint", icon: "🏃", name: "Solo Run",
      attr: "Pace",
      how: "<b>Tap the button as fast as you can</b> for three seconds to burst clear of the defender chasing you.",
      tip: "Watch the shield closing along the bottom — you need to fill the bar before it catches you. Higher <b>Pace</b> means fewer taps needed.",
    },
    {
      key: "block", icon: "🧤", name: "Block",
      attr: "Reflexes",
      how: "The pad says <b>HOLD…</b>. The instant it turns red and says <b>NOW!</b>, tap it.",
      tip: "Tapping before it turns is a guessed dive and scores almost nothing — wait for the signal. Higher <b>Reflexes</b> gives you more time to react.",
    },
    {
      key: "pass", icon: "👁️", name: "Pick the Pass",
      attr: "Vision",
      how: "Several players drift around the pitch. <b>Tap the green one</b> — the runner in space — before the timer bar empties.",
      tip: "Blue players are marked; hitting one is a turnover. Picking the right runner quickly scores highest. Tougher divisions add more decoys.",
    },
  ];

  const byKey = {};
  GUIDE.forEach((g) => { byKey[g.key] = g; });

  const RULES = [
    {
      title: "The league",
      body: "Every season is 10 league games against the five other teams in your division, home and away. Two points for a win, one for a draw.",
    },
    {
      title: "Going up",
      body: "You are promoted <b>only</b> by finishing 1st in your division. A good championship run will not do it — the league is what moves you up the ladder.",
    },
    {
      title: "Going down",
      body: "Finish 6th and bottom and you are relegated. It cascades — drop out of the National League divisions and you're back playing club football.",
    },
    {
      title: "The championship",
      body: "After the league comes knockout football: Quarter-Final, Semi-Final, Final. Lose once and your season is over. Finishing high in the league earns you an easier draw. Level games go to extra time.",
    },
    {
      title: "Energy & injuries",
      body: "Every match drains energy. Play on empty and you perform worse and risk a knock that rules you out for a game or two. <b>Rest Up</b> to recover — there's no limit on how often you rest.",
    },
    {
      title: "Training",
      body: "Matches earn training points, scaled by how well you actually played. Spend them on attributes in the <b>Player</b> tab. Each level costs more than the last, and higher attributes widen the timing windows in every mini-game.",
    },
    {
      title: "The top",
      body: "Reach National League Div. 1 and win its championship to bring home Sam Maguire. All Stars are awarded at the end of a season, weighted by your rating, the level you played at, and what you won.",
    },
  ];

  /** Full-screen coach card shown the first time a mini-game comes up. */
  function coachCard(g) {
    return new Promise((resolve) => {
      const el = document.createElement("div");
      el.className = "gf-coach";
      el.innerHTML = `
        <div class="gf-coach-card">
          <div class="gf-coach-icon">${g.icon}</div>
          <div class="gf-coach-tag">New situation</div>
          <h2>${g.name}</h2>
          <p class="gf-coach-how">${g.how}</p>
          <p class="gf-coach-tip">${g.tip}</p>
          <button class="btn btn-primary btn-lg" data-action="coach-ok">Got it</button>
        </div>
      `;
      document.body.appendChild(el);
      el.querySelector('[data-action="coach-ok"]').addEventListener("click", () => {
        el.remove();
        resolve();
      });
    });
  }

  window.GaaGuide = { GUIDE, byKey, RULES, coachCard };
})();
