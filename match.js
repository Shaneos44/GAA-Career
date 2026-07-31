// Gaelic Hero — Match Day. Builds a sequence of skill events weighted by the
// player's position, runs them through minigames.js, then hands the combined
// contribution to data.js to resolve the fixture and advance the season.

(function () {
  const A = window.GaaAudio;
  const C = window.GaaConfetti;
  const M = window.GaaMinigames;
  const GD = window.GaaGuide;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  /** Attribute-driven difficulty: better players get a wider window, tougher tiers a faster one. */
  function tuning(state, attrKey, speedBase) {
    const attr = state.attributes[attrKey];
    const zoneWidthPct = clamp(6.5 + attr * 0.17, 6.5, 24);
    let speed = speedBase * (1 + state.tierIndex * 0.075);
    if (state.energy < 30) speed *= 1.18;
    return { zoneWidthPct, periodMs: 1000 / speed };
  }

  // ---------- Event definitions ----------

  const EVENTS = {
    async shot(card, state, ticker) {
      const power = tuning(state, "kicking", 0.8);
      const p1 = await M.timingBar({ card, label: "SHOT AT GOAL", sub: "POWER", ...power });
      const place = tuning(state, "freeTaking", 0.95);
      const p2 = await M.timingBar({ card, label: "SHOT AT GOAL", sub: "PLACEMENT", ...place });
      const score = Math.round((p1.score + p2.score) / 2);
      let text, log;
      if (score >= 85) {
        const goal = Math.random() < 0.4;
        text = goal ? "GOAL!!!" : "SPLIT THE POSTS!";
        log = goal ? "Buried it low to the corner — GOAL!" : "Clean strike, straight over the black spot.";
      } else if (score >= 60) { text = "POINT!"; log = "Over the bar — point."; }
      else if (score >= 35) { text = "WIDE!"; log = "Pulled it wide of the near post."; }
      else { text = "BLOCKED!"; log = "Charged down — turned over in a dangerous spot."; }
      flash(card, text, score >= 60);
      tick(ticker, log);
      return { type: "shot", score };
    },

    async free(card, state, ticker) {
      const skill = state.attributes.freeTaking;
      const r = await M.swipeKick({
        card, label: "FREE KICK", sub: "AIM & POWER",
        tolerance: { angle: clamp(10 + skill * 0.32, 10, 42), power: clamp(14 + skill * 0.36, 14, 50) },
      });
      let text, log;
      if (r.score >= 80) { text = "SPLIT THE POSTS!"; log = "Dead-eye free — never in doubt."; }
      else if (r.score >= 55) { text = "POINT!"; log = "Free converted."; }
      else { text = "MISSED THE FREE"; log = "Dropped the free short and wide. Costly."; }
      flash(card, text, r.score >= 55);
      tick(ticker, log);
      return { type: "free", score: r.score };
    },

    async catch_(card, state, ticker) {
      const skill = state.attributes.fielding;
      const r = await M.holdAndRelease({
        card, label: "HIGH BALL DROPPING IN", sub: "CHARGE YOUR LEAP, RELEASE AT THE APEX",
        zoneWidthPct: clamp(9 + skill * 0.16, 9, 24),
        fillMs: clamp(1500 - state.tierIndex * 60, 900, 1500),
      });
      let text, log;
      if (r.score >= 70) { text = "CLEAN CATCH!"; log = "Rose above the lot of them and plucked it."; }
      else if (r.score >= 40) { text = "BROKE IT DOWN"; log = "Couldn't hold it, but you broke it to a teammate."; }
      else { text = "SPILLED IT!"; log = "Misjudged the flight — turned over under the dropping ball."; }
      flash(card, text, r.score >= 40);
      tick(ticker, log);
      return { type: "catch", score: r.score };
    },

    async tackle(card, state, ticker) {
      const t = tuning(state, "tackling", 1.3);
      const r = await M.timingBar({ card, label: "TIME YOUR TACKLE", icon: "🛡️", ...t });
      let text, log;
      if (r.score >= 70) { text = "TURNOVER!"; log = "Textbook tackle — stripped him clean."; }
      else if (r.score >= 40) { text = "SLOWED HIM"; log = "Got a hand in and slowed the attack."; }
      else { text = "BEATEN!"; log = "Sold a dummy and left for dead."; }
      flash(card, text, r.score >= 40);
      tick(ticker, log);
      return { type: "tackle", score: r.score };
    },

    async sprint(card, state, ticker) {
      const pace = state.attributes.speed;
      const r = await M.tapRush({
        card, label: "SOLO RUN — BURST CLEAR", sub: "TAP AS FAST AS YOU CAN",
        targetTaps: Math.round(clamp(30 - pace * 0.16, 14, 30) + state.tierIndex * 1.4),
        durationMs: 3000,
      });
      let text, log;
      if (r.score >= 75) { text = "BURST CLEAR!"; log = "Left the cover for dead on a driving solo run."; }
      else if (r.score >= 40) { text = "HELD UP"; log = "Got a few yards before the cover arrived."; }
      else { text = "SWALLOWED UP"; log = "No legs — swarmed and dispossessed."; }
      flash(card, text, r.score >= 40);
      tick(ticker, log);
      return { type: "sprint", score: r.score };
    },

    async block(card, state, ticker) {
      const r = await M.reactionTap({
        card, label: "SHOT INCOMING — BLOCK IT", sub: "WAIT FOR IT",
        goodMs: clamp(420 - state.attributes.reflexes * 2.2, 170, 420),
      });
      let text, log;
      if (r.score >= 70) { text = "BLOCKED IT!"; log = "Threw the body on the line — brilliant block."; }
      else if (r.score >= 40) { text = "DEFLECTED"; log = "Got a fingertip to it and put it wide."; }
      else { text = "SCORED PAST YOU"; log = "Too slow off the mark — they scored."; }
      flash(card, text, r.score >= 40);
      tick(ticker, log);
      return { type: "block", score: r.score };
    },

    async pass(card, state, ticker) {
      const vision = state.attributes.vision;
      const r = await M.pickThePass({
        card, label: "PICK THE PASS", sub: "FIND THE RUNNER IN SPACE",
        decoys: clamp(2 + Math.floor(state.tierIndex / 2), 2, 5),
        windowMs: clamp(2600 - state.tierIndex * 90 + vision * 8, 1500, 3200),
      });
      let text, log;
      if (r.score >= 70) { text = "SPLIT THE DEFENCE!"; log = "Picked out the runner with a killer ball."; }
      else if (r.score >= 40) { text = "SAFE BALL"; log = "Took the simple option and kept possession."; }
      else { text = "TURNOVER!"; log = "Hit it straight to a defender — coughed it up."; }
      flash(card, text, r.score >= 40);
      tick(ticker, log);
      return { type: "pass", score: r.score };
    },
  };

  function flash(card, text, good) {
    const el = document.createElement("div");
    el.className = `gf-moment-flash ${good ? "good" : "bad"}`;
    el.textContent = text;
    card.appendChild(el);
    card.classList.remove("shake-good", "shake-bad");
    void card.offsetWidth;
    card.classList.add(good ? "shake-good" : "shake-bad");
    setTimeout(() => el.remove(), 1050);
  }

  function tick(ticker, text) {
    const line = document.createElement("div");
    line.className = "gf-ticker-line";
    line.textContent = text;
    ticker.prepend(line);
    while (ticker.children.length > 3) ticker.removeChild(ticker.lastChild);
  }

  /** Weighted event plan for this position, with a shot guaranteed somewhere. */
  function buildPlan(state, G, count) {
    const pos = G.POSITIONS.find((p) => p.key === state.position) || G.POSITIONS[0];
    const pool = [];
    Object.entries(pos.weights).forEach(([kind, w]) => {
      for (let i = 0; i < w; i++) pool.push(kind);
    });
    const plan = [];
    for (let i = 0; i < count; i++) plan.push(pool[randInt(0, pool.length - 1)]);
    if (!plan.includes("shot") && !plan.includes("free")) plan[randInt(0, plan.length - 1)] = "shot";
    return plan;
  }

  // ---------- Overlay ----------

  function buildOverlay(state, G, meta) {
    const overlay = document.createElement("div");
    overlay.className = "gf-match-overlay";
    overlay.innerHTML = `
      <div class="gf-match-card">
        <div class="gf-match-head">
          <button class="gf-quit" data-action="quit" aria-label="Abandon match">✕</button>
          <div class="gf-match-tier">${meta.label.toUpperCase()}</div>
          <div class="gf-match-vs">
            <span class="team you">${G.teamName(state)}</span>
            <span class="vs">v</span>
            <span class="team rival">${meta.oppName}</span>
          </div>
        </div>
        <div class="gf-pitch">
          <div class="gf-pitch-stripes"></div>
          <div class="gf-goal"></div>
          <div class="gf-card-inner"></div>
        </div>
        <div class="gf-moment-ticker"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  async function playIntro(pitchEl) {
    const intro = document.createElement("div");
    intro.className = "gf-throwin";
    intro.innerHTML = `<div class="gf-throwin-text">THROW IN!</div>`;
    pitchEl.appendChild(intro);
    A.whistle();
    await new Promise((r) => setTimeout(r, 850));
    intro.remove();
  }

  function renderFullTime(overlay, { state, G, summary, onContinue }) {
    const card = overlay.querySelector(".gf-match-card");
    const win = summary.result === "win";
    const draw = summary.result === "draw";

    if (win) A.cheer();
    const bigMoment = summary.championshipWon || summary.allIreland;
    if (bigMoment) { A.trophy(); C.burst({}); }

    const pos = state.league ? window.GaaSeason.playerPosition(state.league) : null;
    const badges = [];
    if (summary.motm) badges.push(`<div class="gf-motm-banner">⭐ MAN OF THE MATCH</div>`);
    if (summary.allIreland) badges.push(`<div class="gf-motm-banner gold">🏆 ALL-IRELAND CHAMPIONS</div>`);
    else if (summary.championshipWon) badges.push(`<div class="gf-motm-banner gold">🏆 CHAMPIONSHIP WINNERS</div>`);
    if (summary.eliminated) badges.push(`<div class="gf-motm-banner">Season over — knocked out.</div>`);

    card.innerHTML = `
      <div class="gf-fulltime">
        <div class="gf-fulltime-label">FULL TIME</div>
        <div class="gf-score-final">
          <span>${G.scoreString(summary.yourScore)} <small>(${summary.yourScore.total})</small></span>
          <span class="dim">—</span>
          <span>${G.scoreString(summary.oppScore)} <small>(${summary.oppScore.total})</small></span>
        </div>
        <div class="gf-result-banner ${win ? "win" : draw ? "draw" : "loss"}">
          ${win ? "WIN" : draw ? "DRAW" : "DEFEAT"}
        </div>
        ${badges.join("")}
        <div class="gf-skill-index">
          <div class="l">Performance rating · ${summary.skillIndex}</div>
          <div class="gf-bar-track"><div class="gf-bar-fill" style="width:${summary.skillIndex}%"></div></div>
        </div>
        <div class="gf-rewards">
          <div class="gf-reward"><div class="n">+${summary.tpEarned}</div><div class="l">Training pts</div></div>
          ${summary.kind === "league" && pos ? `<div class="gf-reward"><div class="n">${G.ordinal(pos)}</div><div class="l">In the table</div></div>` : ""}
        </div>
        <button class="btn btn-primary" data-action="match-continue">Continue</button>
      </div>
    `;
    card.querySelector('[data-action="match-continue"]')
      .addEventListener("click", () => { overlay.remove(); onContinue(); });
  }

  async function start(state, G, kind, onComplete, onSeen) {
    A.unlock();
    onSeen = onSeen || (() => {});
    const meta = kind === "championship" ? G.nextChampionshipFixture(state) : G.nextLeagueFixture(state);
    if (!meta) return;

    const overlay = buildOverlay(state, G, meta);
    const pitchEl = overlay.querySelector(".gf-pitch");
    const cardInner = overlay.querySelector(".gf-card-inner");
    const ticker = overlay.querySelector(".gf-moment-ticker");

    // Abandoning forfeits the fixture — the state is only committed at full time.
    let abandoned = false;
    overlay.querySelector('[data-action="quit"]').addEventListener("click", () => {
      if (!confirm("Abandon this match? It won't be recorded and you'll come back to it.")) return;
      abandoned = true;
      overlay.remove();
    });

    await playIntro(pitchEl);

    const count = kind === "championship" ? (meta.isFinal ? 8 : 7) : 6;
    const plan = buildPlan(state, G, count);

    // Explain each mini-game the first time a player ever meets it.
    let working = state;
    const events = [];
    for (const k of plan) {
      if (abandoned) return;
      const guideKey = k;
      if (GD.byKey[guideKey] && !(working.seenGames || {})[guideKey]) {
        await GD.coachCard(GD.byKey[guideKey]);
        working = G.markGameSeen(working, guideKey);
        onSeen(working);
      }
      if (abandoned) return;
      const fn = k === "catch" ? EVENTS.catch_ : EVENTS[k];
      events.push(await fn(cardInner, working, ticker));
      await new Promise((r) => setTimeout(r, 240));
    }
    if (abandoned) return;
    state = working;

    const contribution = G.resolvePlayerEvents(events);
    const newState = kind === "championship"
      ? G.playChampionshipMatch(state, contribution)
      : G.playLeagueMatch(state, contribution);

    renderFullTime(overlay, {
      state: newState,
      G,
      summary: newState.lastMatchSummary,
      onContinue: () => onComplete(newState),
    });
  }

  /**
   * Runs a single mini-game with nothing at stake, so a player can learn the
   * controls without spending a fixture on it.
   */
  async function practice(state, G, kind) {
    A.unlock();
    const g = GD.byKey[kind];
    const overlay = document.createElement("div");
    overlay.className = "gf-match-overlay";
    overlay.innerHTML = `
      <div class="gf-match-card">
        <div class="gf-match-head">
          <button class="gf-quit" data-action="quit" aria-label="Leave practice">✕</button>
          <div class="gf-match-tier">Practice · no effect on your career</div>
          <div class="gf-match-vs solo"><span class="team you">${g.icon} ${g.name}</span></div>
        </div>
        <div class="gf-pitch">
          <div class="gf-pitch-stripes"></div>
          <div class="gf-goal"></div>
          <div class="gf-card-inner"></div>
        </div>
        <div class="gf-moment-ticker"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    let left = false;
    overlay.querySelector('[data-action="quit"]').addEventListener("click", () => {
      left = true;
      overlay.remove();
    });

    const cardInner = overlay.querySelector(".gf-card-inner");
    const ticker = overlay.querySelector(".gf-moment-ticker");
    const fn = kind === "catch" ? EVENTS.catch_ : EVENTS[kind];

    // Loop until they leave, so they can drill the same skill repeatedly.
    while (!left) {
      const ev = await fn(cardInner, state, ticker);
      if (left) return;
      const rating = M.rate(ev.score);
      const again = document.createElement("div");
      again.className = "gf-practice-again";
      again.innerHTML = `
        <div class="gf-practice-score r-${rating}">${ev.score}<small>/100</small></div>
        <button class="btn btn-primary" data-action="again">Try again</button>
        <button class="btn" data-action="done">Done</button>
      `;
      cardInner.appendChild(again);
      const choice = await new Promise((resolve) => {
        again.querySelector('[data-action="again"]').addEventListener("click", () => resolve("again"));
        again.querySelector('[data-action="done"]').addEventListener("click", () => resolve("done"));
      });
      again.remove();
      if (choice === "done") { overlay.remove(); return; }
    }
  }

  window.GaaMatch = { start, practice };
})();
