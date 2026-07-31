// GAA Career — Match Day engine. Renders a full-screen sequence of
// timing-based skill challenges (shooting, high-fielding, tackling),
// then hands the resulting contribution to data.js to resolve the match.

(function () {
  const A = window.GaaAudio;
  const C = window.GaaConfetti;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const RATING_LABELS = { perfect: "PERFECT!", great: "GREAT!", good: "OK", miss: "MISS!" };

  function classify(dist, zoneWidthPct) {
    const perfectHalf = zoneWidthPct * 0.35;
    const greatHalf = zoneWidthPct;
    const goodHalf = zoneWidthPct * 1.9;
    if (dist <= perfectHalf) return { rating: "perfect", score: Math.round(100 - (dist / Math.max(perfectHalf, 0.001)) * 6) };
    if (dist <= greatHalf) return { rating: "great", score: Math.round(90 - ((dist - perfectHalf) / (greatHalf - perfectHalf)) * 18) };
    if (dist <= goodHalf) return { rating: "good", score: Math.round(64 - ((dist - greatHalf) / (goodHalf - greatHalf)) * 26) };
    return { rating: "miss", score: Math.max(4, Math.round(28 - (dist - goodHalf))) };
  }

  /**
   * Runs a single timing challenge inside the given card element.
   * Resolves with { rating, score }.
   */
  function runTimingChallenge({ card, label, sub, zoneWidthPct, periodMs, timeoutMs = 3200 }) {
    return new Promise((resolve) => {
      const zoneCenterPct = 22 + Math.random() * 56;
      const perfectHalf = zoneWidthPct * 0.35;
      const greatHalf = zoneWidthPct;
      const goodHalf = zoneWidthPct * 1.9;

      const wrap = document.createElement("div");
      wrap.className = "gf-challenge";
      wrap.innerHTML = `
        <div class="gf-challenge-label">${label}${sub ? `<span>${sub}</span>` : ""}</div>
        <div class="gf-timing-track">
          <div class="gf-zone good" style="left:${clamp(zoneCenterPct - goodHalf, 0, 100)}%;width:${goodHalf * 2}%"></div>
          <div class="gf-zone great" style="left:${clamp(zoneCenterPct - greatHalf, 0, 100)}%;width:${greatHalf * 2}%"></div>
          <div class="gf-zone perfect" style="left:${clamp(zoneCenterPct - perfectHalf, 0, 100)}%;width:${perfectHalf * 2}%"></div>
          <div class="gf-timing-marker">⚽</div>
        </div>
        <button class="btn btn-primary gf-strike-btn">STRIKE!<span class="gf-key-hint">space</span></button>
      `;
      card.appendChild(wrap);

      const marker = wrap.querySelector(".gf-timing-marker");
      const strikeBtn = wrap.querySelector(".gf-strike-btn");
      const start = performance.now();
      let raf = null;
      let done = false;

      // Travel is inset to 3–97% so the marker never half-overflows the track.
      function tick(now) {
        const t = now - start;
        const pos = 50 + 47 * Math.sin((2 * Math.PI * t) / periodMs);
        marker.style.left = pos + "%";
        if (!done) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);

      const timeout = setTimeout(() => finish(true), timeoutMs);

      function finish(timedOut) {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        cancelAnimationFrame(raf);
        document.removeEventListener("keydown", onKey);
        strikeBtn.disabled = true;

        const pos = parseFloat(marker.style.left) || 50;
        const dist = Math.abs(pos - zoneCenterPct);
        const result = timedOut ? { rating: "miss", score: 8 } : classify(dist, zoneWidthPct);

        marker.classList.add("locked", `r-${result.rating}`);
        wrap.classList.add("resolved");
        if (result.rating === "perfect") { A.perfect(); flashShake(card, "good"); }
        else if (result.rating === "miss") { A.miss(); flashShake(card, "bad"); }
        else A.tick();

        const ratingTag = document.createElement("div");
        ratingTag.className = `gf-rating-pop r-${result.rating}`;
        ratingTag.textContent = RATING_LABELS[result.rating];
        wrap.appendChild(ratingTag);

        setTimeout(() => {
          wrap.remove();
          resolve(result);
        }, 550);
      }

      function onKey(e) {
        if (e.code === "Space") {
          e.preventDefault();
          finish(false);
        }
      }
      document.addEventListener("keydown", onKey);
      strikeBtn.addEventListener("click", () => finish(false));
    });
  }

  function flashShake(card, kind) {
    card.classList.remove("shake-good", "shake-bad");
    void card.offsetWidth; // restart animation
    card.classList.add(kind === "good" ? "shake-good" : "shake-bad");
  }

  function difficultyFor(state, attrKey, speedBase) {
    const attrVal = state.attributes[attrKey];
    const zoneWidthPct = clamp(7 + attrVal * 0.17, 7, 24);
    let speed = speedBase * (1 + state.tierIndex * 0.09);
    if (state.energy < 30) speed *= 1.2;
    return { zoneWidthPct, periodMs: 1000 / speed };
  }

  async function runShotEvent(card, state, momentTicker) {
    const power = difficultyFor(state, "kicking", 0.8);
    const powerResult = await runTimingChallenge({ card, label: "SHOT AT GOAL", sub: "POWER", ...power });
    const place = difficultyFor(state, "freeTaking", 0.95);
    const placeResult = await runTimingChallenge({ card, label: "SHOT AT GOAL", sub: "PLACEMENT", ...place });
    const score = Math.round((powerResult.score + placeResult.score) / 2);
    let text, log;
    if (score >= 85) {
      const goal = Math.random() < 0.35;
      text = goal ? "GOAL!!! 🥅" : "PERFECT — POINT!";
      log = goal ? "You buried it in the net — GOAL!" : "Clinical finish — over the bar for a point.";
    } else if (score >= 60) {
      text = "POINT!";
      log = "Good strike, splits the posts for a point.";
    } else if (score >= 35) {
      text = "WIDE!";
      log = "Dragged it wide — no score.";
    } else {
      text = "BLOCKED DOWN!";
      log = "Charged down and turned over — dangerous.";
    }
    showMoment(card, text, score >= 60 ? "good" : "bad");
    logMoment(momentTicker, log);
    return { type: "shot", score };
  }

  async function runCatchEvent(card, state, momentTicker) {
    const diff = difficultyFor(state, "fielding", 1.05);
    const result = await runTimingChallenge({ card, label: "HIGH BALL IN — TIME YOUR JUMP", ...diff });
    let text, log;
    if (result.score >= 70) { text = "CLEAN CATCH!"; log = "Fielded it clean at full stretch — great possession won."; }
    else if (result.score >= 40) { text = "SECURED"; log = "Scrappy, but you came away with it."; }
    else { text = "SPILLED IT!"; log = "Dropped under the dropping ball — turned over."; }
    showMoment(card, text, result.score >= 40 ? "good" : "bad");
    logMoment(momentTicker, log);
    return { type: "catch", score: result.score };
  }

  async function runTackleEvent(card, state, momentTicker) {
    const diff = difficultyFor(state, "tackling", 1.25);
    const result = await runTimingChallenge({ card, label: "TIME YOUR HIT", ...diff });
    let text, log;
    if (result.score >= 70) { text = "TURNOVER WON!"; log = "Textbook tackle — won the ball back clean."; }
    else if (result.score >= 40) { text = "SLOWED THEM DOWN"; log = "Not pretty, but you got a hand in and slowed the attack."; }
    else { text = "BEATEN!"; log = "Missed the tackle — big scoring chance for the opposition."; }
    showMoment(card, text, result.score >= 40 ? "good" : "bad");
    logMoment(momentTicker, log);
    return { type: "tackle", score: result.score };
  }

  function showMoment(card, text, kind) {
    const el = document.createElement("div");
    el.className = `gf-moment-flash ${kind === "good" ? "good" : "bad"}`;
    el.textContent = text;
    card.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  function logMoment(ticker, text) {
    const line = document.createElement("div");
    line.className = "gf-ticker-line";
    line.textContent = text;
    ticker.prepend(line);
    while (ticker.children.length > 4) ticker.removeChild(ticker.lastChild);
  }

  function buildOverlay(state, isFinal, G) {
    const tier = G.TIERS[state.tierIndex];
    const overlay = document.createElement("div");
    overlay.className = "gf-match-overlay";
    overlay.innerHTML = `
      <div class="gf-match-card">
        <div class="gf-match-head">
          <div class="gf-match-tier">${isFinal ? "ALL-IRELAND FINAL · CROKE PARK" : tier.label.toUpperCase()}</div>
          <div class="gf-match-vs">
            <span class="team you">${state.club || state.county}</span>
            <span class="vs">v</span>
            <span class="team rival" id="gf-rival-name">Opponents</span>
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
    await new Promise((r) => setTimeout(r, 900));
    intro.remove();
  }

  function renderFullTime(overlay, { isFinal, summary, skillIndex, G, onContinue }) {
    const card = overlay.querySelector(".gf-match-card");
    const you = summary.yourScore;
    const opp = summary.oppScore;
    const win = isFinal ? summary.win : summary.result === "win";
    const draw = !isFinal && summary.result === "draw";

    if (win) A.cheer();
    const trophyMoment = isFinal ? summary.win || summary.wonAllStar : summary.promoted;
    if (trophyMoment) {
      A.trophy();
      C.burst({});
    }

    card.innerHTML = `
      <div class="gf-fulltime">
        <div class="gf-fulltime-label">FULL TIME</div>
        <div class="gf-score-final">
          <span>${G.scoreString(you)} <small>(${you.total})</small></span>
          <span class="dim">—</span>
          <span>${G.scoreString(opp)} <small>(${opp.total})</small></span>
        </div>
        <div class="gf-result-banner ${win ? "win" : draw ? "draw" : "loss"}">
          ${win ? (isFinal ? "CHAMPIONS!" : "WIN") : draw ? "DRAW" : "DEFEAT"}
        </div>
        ${summary.motm ? `<div class="gf-motm-banner">⭐ MAN OF THE MATCH</div>` : ""}
        ${isFinal && summary.wonAllStar ? `<div class="gf-motm-banner gold">🏆 ALL STAR AWARDED</div>` : ""}
        ${!isFinal && summary.promoted ? `<div class="gf-motm-banner gold">🎉 PROMOTED!</div>` : ""}
        ${!isFinal && summary.readyForFinal ? `<div class="gf-motm-banner gold">🏟️ ALL-IRELAND FINAL AWAITS!</div>` : ""}
        <div class="gf-skill-index">
          <div class="l">Your performance rating — ${skillIndex}</div>
          <div class="gf-bar-track"><div class="gf-bar-fill" style="width:${skillIndex}%"></div></div>
        </div>
        <div class="gf-rewards">
          <div class="gf-reward"><div class="n">+${summary.trainingPointsEarned}</div><div class="l">Training pts</div></div>
          ${!isFinal ? `<div class="gf-reward"><div class="n">+${summary.repEarned}</div><div class="l">Reputation</div></div>` : ""}
        </div>
        <button class="btn btn-primary" data-action="match-continue">Continue</button>
      </div>
    `;
    card.querySelector('[data-action="match-continue"]').addEventListener("click", () => {
      overlay.remove();
      onContinue();
    });
  }

  async function start(state, G, isFinal, onComplete) {
    A.unlock();
    const overlay = buildOverlay(state, isFinal, G);
    const pitchEl = overlay.querySelector(".gf-pitch");
    const cardInner = overlay.querySelector(".gf-card-inner");
    const ticker = overlay.querySelector(".gf-moment-ticker");
    const rivalNames = ["Gaels", "O'Connells", "Emmets", "Rovers", "Sarsfields", "Parnells", "St. Brigid's", "Shamrocks"];
    overlay.querySelector("#gf-rival-name").textContent = isFinal
      ? "Rival County"
      : rivalNames[randInt(0, rivalNames.length - 1)];

    await playIntro(pitchEl);

    const plan = shuffle(["catch", "tackle", "shot"]);
    plan.push(["shot", "catch", "tackle"][randInt(0, 2)]);
    if (isFinal) plan.push(["shot", "catch", "tackle"][randInt(0, 2)], "shot");

    const events = [];
    for (const kind of plan) {
      let ev;
      if (kind === "shot") ev = await runShotEvent(cardInner, state, ticker);
      else if (kind === "catch") ev = await runCatchEvent(cardInner, state, ticker);
      else ev = await runTackleEvent(cardInner, state, ticker);
      events.push(ev);
      await new Promise((r) => setTimeout(r, 260));
    }

    const contribution = G.resolvePlayerEvents(events);
    let newState;
    let summary;
    if (isFinal) {
      newState = G.playAllIrelandFinal(state, contribution);
      summary = newState.lastFinalSummary;
    } else {
      newState = G.playMatch(state, contribution);
      summary = newState.lastMatchSummary;
    }

    renderFullTime(overlay, {
      isFinal,
      summary,
      skillIndex: contribution.skillIndex,
      G,
      onContinue: () => onComplete(newState),
    });
  }

  window.GaaMatch = { start };
})();
