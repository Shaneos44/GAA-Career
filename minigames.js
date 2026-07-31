// GAA Career — the skill layer. Six distinct touch-first mini-games.
//
// Every game resolves to { score, rating } where score is 0-100, so match.js
// can treat them interchangeably. All input is pointer-based (one code path
// for touch and mouse); the keyboard is only ever a convenience alias.

(function () {
  const A = window.GaaAudio;

  const RATING_LABELS = { perfect: "PERFECT!", great: "GREAT!", good: "OK", miss: "MISS!" };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function rate(score) {
    if (score >= 88) return "perfect";
    if (score >= 66) return "great";
    if (score >= 38) return "good";
    return "miss";
  }

  let hapticsOn = true;

  function buzz(rating) {
    if (!hapticsOn || !navigator.vibrate) return;
    if (rating === "perfect") navigator.vibrate([18, 40, 18]);
    else if (rating === "miss") navigator.vibrate(90);
    else navigator.vibrate(14);
  }

  /** Shared shell: mounts the game, then resolves after showing its rating. */
  function shell(card, html, setup) {
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "gf-challenge";
      wrap.innerHTML = html;
      card.appendChild(wrap);

      let settled = false;
      function finish(score) {
        if (settled) return;
        settled = true;
        const clamped = clamp(Math.round(score), 0, 100);
        const rating = rate(clamped);

        cleanup();
        wrap.classList.add("resolved");
        if (rating === "perfect") A.perfect();
        else if (rating === "miss") A.miss();
        else A.tick();
        buzz(rating);

        const pop = document.createElement("div");
        pop.className = `gf-rating-pop r-${rating}`;
        pop.textContent = RATING_LABELS[rating];
        wrap.appendChild(pop);

        setTimeout(() => {
          wrap.remove();
          resolve({ score: clamped, rating });
        }, 520);
      }

      const cleanup = setup(wrap, finish) || (() => {});
    });
  }

  // ---------- 1. Timing bar — sweep a marker into the zone ----------

  function timingBar({ card, label, sub, zoneWidthPct, periodMs, timeoutMs = 3400, icon = "⚽" }) {
    const zoneCenter = 22 + Math.random() * 56;
    const perfectHalf = zoneWidthPct * 0.35;
    const greatHalf = zoneWidthPct;
    const goodHalf = zoneWidthPct * 1.9;

    return shell(card, `
      <div class="gf-challenge-label">${label}${sub ? `<span>${sub}</span>` : ""}</div>
      <div class="gf-timing-track">
        <div class="gf-zone good" style="left:${clamp(zoneCenter - goodHalf, 0, 100)}%;width:${goodHalf * 2}%"></div>
        <div class="gf-zone great" style="left:${clamp(zoneCenter - greatHalf, 0, 100)}%;width:${greatHalf * 2}%"></div>
        <div class="gf-zone perfect" style="left:${clamp(zoneCenter - perfectHalf, 0, 100)}%;width:${perfectHalf * 2}%"></div>
        <div class="gf-timing-marker">${icon}</div>
      </div>
      <button class="btn btn-primary gf-action-btn">STRIKE<span class="gf-key-hint">tap</span></button>
    `, (wrap, finish) => {
      const marker = wrap.querySelector(".gf-timing-marker");
      const btn = wrap.querySelector(".gf-action-btn");
      const start = performance.now();
      let raf, done = false;

      // Travel is inset to 3-97% so the marker never half-overflows the track.
      (function tick(now) {
        const t = (now || performance.now()) - start;
        marker.style.left = 50 + 47 * Math.sin((2 * Math.PI * t) / periodMs) + "%";
        if (!done) raf = requestAnimationFrame(tick);
      })();

      function strike(timedOut) {
        if (done) return;
        done = true;
        const pos = parseFloat(marker.style.left) || 50;
        const dist = Math.abs(pos - zoneCenter);
        let score;
        if (timedOut) score = 6;
        else if (dist <= perfectHalf) score = 100 - (dist / Math.max(perfectHalf, 0.001)) * 8;
        else if (dist <= greatHalf) score = 88 - ((dist - perfectHalf) / (greatHalf - perfectHalf)) * 20;
        else if (dist <= goodHalf) score = 64 - ((dist - greatHalf) / (goodHalf - greatHalf)) * 26;
        else score = Math.max(4, 30 - (dist - goodHalf));
        marker.classList.add("locked");
        finish(score);
      }

      const timer = setTimeout(() => strike(true), timeoutMs);
      const onKey = (e) => { if (e.code === "Space") { e.preventDefault(); strike(false); } };
      btn.addEventListener("pointerdown", (e) => { e.preventDefault(); strike(false); });
      document.addEventListener("keydown", onKey);

      return () => {
        done = true;
        clearTimeout(timer);
        cancelAnimationFrame(raf);
        document.removeEventListener("keydown", onKey);
      };
    });
  }

  // ---------- 2. Swipe kick — drag back and release to strike a free ----------

  function swipeKick({ card, label, sub, tolerance }) {
    const targetAngle = -90 + (Math.random() * 50 - 25); // degrees, up-ish
    const targetPower = 55 + Math.random() * 35;         // % of max drag

    return shell(card, `
      <div class="gf-challenge-label">${label}${sub ? `<span>${sub}</span>` : ""}</div>
      <div class="gf-swipe-area">
        <div class="gf-swipe-target" style="transform:rotate(${targetAngle + 90}deg) translateY(-${targetPower}%)"></div>
        <div class="gf-swipe-hint">drag from the ball &amp; release</div>
        <svg class="gf-swipe-line" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="50" y1="88" x2="50" y2="88" stroke="#F2C94C" stroke-width="1.4" stroke-linecap="round" />
        </svg>
        <div class="gf-swipe-ball">⚽</div>
      </div>
    `, (wrap, finish) => {
      const area = wrap.querySelector(".gf-swipe-area");
      const line = wrap.querySelector(".gf-swipe-line line");
      let dragging = false, origin = null;

      const maxDrag = () => Math.min(area.clientWidth, area.clientHeight) * 0.55;

      function down(e) {
        dragging = true;
        origin = { x: e.clientX, y: e.clientY };
        area.setPointerCapture && area.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
      function move(e) {
        if (!dragging) return;
        const dx = e.clientX - origin.x;
        const dy = e.clientY - origin.y;
        const r = area.getBoundingClientRect();
        // Aim is opposite the drag, like pulling back a slingshot.
        line.setAttribute("x2", clamp(50 - (dx / r.width) * 100, 0, 100));
        line.setAttribute("y2", clamp(88 - (dy / r.height) * 100, 0, 100));
        e.preventDefault();
      }
      function up(e) {
        if (!dragging) return;
        dragging = false;
        const dx = e.clientX - origin.x;
        const dy = e.clientY - origin.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 12) return; // a stray tap isn't a strike
        const angle = (Math.atan2(-dy, -dx) * 180) / Math.PI;
        const power = clamp((dist / maxDrag()) * 100, 0, 130);

        let angleErr = Math.abs(angle - targetAngle);
        if (angleErr > 180) angleErr = 360 - angleErr;
        const powerErr = Math.abs(power - targetPower);

        const angleScore = clamp(100 - (angleErr / tolerance.angle) * 100, 0, 100);
        const powerScore = clamp(100 - (powerErr / tolerance.power) * 100, 0, 100);
        finish(angleScore * 0.6 + powerScore * 0.4);
      }

      area.addEventListener("pointerdown", down);
      area.addEventListener("pointermove", move);
      area.addEventListener("pointerup", up);
      area.addEventListener("pointercancel", () => { dragging = false; });
      const timer = setTimeout(() => finish(8), 6000);

      return () => {
        clearTimeout(timer);
        area.removeEventListener("pointerdown", down);
        area.removeEventListener("pointermove", move);
        area.removeEventListener("pointerup", up);
      };
    });
  }

  // ---------- 3. Tap rush — mash to burst clear ----------

  function tapRush({ card, label, sub, targetTaps, durationMs = 3200 }) {
    return shell(card, `
      <div class="gf-challenge-label">${label}${sub ? `<span>${sub}</span>` : ""}</div>
      <div class="gf-rush-track">
        <div class="gf-rush-you" style="left:0%">🏃</div>
        <div class="gf-rush-def" style="left:0%">🛡️</div>
      </div>
      <div class="gf-bar-track"><div class="gf-bar-fill gf-rush-fill" style="width:0%"></div></div>
      <button class="btn btn-primary gf-action-btn gf-mash-btn">TAP! TAP! TAP!<span class="gf-key-hint">go</span></button>
    `, (wrap, finish) => {
      const btn = wrap.querySelector(".gf-mash-btn");
      const fill = wrap.querySelector(".gf-rush-fill");
      const you = wrap.querySelector(".gf-rush-you");
      const def = wrap.querySelector(".gf-rush-def");
      const start = performance.now();
      let taps = 0, raf, done = false;

      function onTap(e) {
        if (done) return;
        if (e) e.preventDefault();
        taps += 1;
        const pct = clamp((taps / targetTaps) * 100, 0, 100);
        fill.style.width = pct + "%";
        you.style.left = clamp(pct * 0.88, 0, 88) + "%";
        btn.classList.remove("pulse");
        void btn.offsetWidth;
        btn.classList.add("pulse");
      }

      (function tick(now) {
        const t = ((now || performance.now()) - start) / durationMs;
        def.style.left = clamp(t * 88, 0, 88) + "%";
        if (t >= 1) {
          done = true;
          finish(clamp((taps / targetTaps) * 100, 0, 100));
          return;
        }
        raf = requestAnimationFrame(tick);
      })();

      const onKey = (e) => { if (e.code === "Space") { e.preventDefault(); onTap(null); } };
      btn.addEventListener("pointerdown", onTap);
      document.addEventListener("keydown", onKey);

      return () => {
        done = true;
        cancelAnimationFrame(raf);
        btn.removeEventListener("pointerdown", onTap);
        document.removeEventListener("keydown", onKey);
      };
    });
  }

  // ---------- 4. Reaction — tap the instant the shot comes ----------

  function reactionTap({ card, label, sub, goodMs }) {
    const delay = 900 + Math.random() * 1800;
    return shell(card, `
      <div class="gf-challenge-label">${label}${sub ? `<span>${sub}</span>` : ""}</div>
      <div class="gf-reaction-pad" role="button" tabindex="0">
        <div class="gf-reaction-state">HOLD…</div>
        <div class="gf-reaction-sub">tap the moment it turns</div>
      </div>
    `, (wrap, finish) => {
      const pad = wrap.querySelector(".gf-reaction-pad");
      const stateEl = wrap.querySelector(".gf-reaction-state");
      const subEl = wrap.querySelector(".gf-reaction-sub");
      let armed = false, firedAt = 0, done = false;

      const armTimer = setTimeout(() => {
        armed = true;
        firedAt = performance.now();
        pad.classList.add("live");
        stateEl.textContent = "NOW!";
        subEl.textContent = "";
        A.tick();
        if (hapticsOn && navigator.vibrate) navigator.vibrate(12);
      }, delay);

      function tap(e) {
        if (done) return;
        if (e) e.preventDefault();
        if (!armed) {
          // Went too early — dived the wrong way.
          done = true;
          stateEl.textContent = "TOO EARLY!";
          finish(10);
          return;
        }
        done = true;
        const ms = performance.now() - firedAt;
        stateEl.textContent = Math.round(ms) + "ms";
        finish(clamp(100 - ((ms - goodMs) / goodMs) * 70, 0, 100));
      }

      const missTimer = setTimeout(() => { if (!done && armed) { done = true; finish(6); } }, delay + 1400);
      const onKey = (e) => { if (e.code === "Space") { e.preventDefault(); tap(null); } };
      pad.addEventListener("pointerdown", tap);
      document.addEventListener("keydown", onKey);

      return () => {
        done = true;
        clearTimeout(armTimer);
        clearTimeout(missTimer);
        pad.removeEventListener("pointerdown", tap);
        document.removeEventListener("keydown", onKey);
      };
    });
  }

  // ---------- 5. Pick the pass — tap the runner in space ----------

  function pickThePass({ card, label, sub, decoys, windowMs }) {
    const total = decoys + 1;
    const targetIdx = randInt(0, total - 1);
    const dots = Array.from({ length: total }, (_, i) => {
      const top = 12 + Math.random() * 62;
      const left = 8 + Math.random() * 74;
      const dur = 2.2 + Math.random() * 1.8;
      return `<button class="gf-runner ${i === targetIdx ? "open" : ""}" data-i="${i}"
                style="top:${top}%;left:${left}%;animation-duration:${dur}s">
                ${i === targetIdx ? "🟢" : "🔵"}
              </button>`;
    }).join("");

    return shell(card, `
      <div class="gf-challenge-label">${label}${sub ? `<span>${sub}</span>` : ""}</div>
      <div class="gf-pass-field">${dots}
        <div class="gf-pass-timer"><div class="gf-pass-timer-fill"></div></div>
      </div>
    `, (wrap, finish) => {
      const fillEl = wrap.querySelector(".gf-pass-timer-fill");
      fillEl.style.transition = `width ${windowMs}ms linear`;
      requestAnimationFrame(() => { fillEl.style.width = "0%"; });

      const start = performance.now();
      let done = false;

      function onPick(e) {
        if (done) return;
        e.preventDefault();
        done = true;
        const i = Number(e.currentTarget.dataset.i);
        if (i !== targetIdx) {
          e.currentTarget.classList.add("wrong");
          finish(12);
          return;
        }
        e.currentTarget.classList.add("hit");
        const elapsed = performance.now() - start;
        // Reward picking the open runner quickly.
        finish(clamp(100 - (elapsed / windowMs) * 55, 40, 100));
      }

      const runners = [...wrap.querySelectorAll(".gf-runner")];
      runners.forEach((r) => r.addEventListener("pointerdown", onPick));
      const timer = setTimeout(() => { if (!done) { done = true; finish(8); } }, windowMs);

      return () => {
        done = true;
        clearTimeout(timer);
        runners.forEach((r) => r.removeEventListener("pointerdown", onPick));
      };
    });
  }

  // ---------- 6. Hold & release — judge a long kickout ----------

  function holdAndRelease({ card, label, sub, zoneWidthPct, fillMs }) {
    const zoneCenter = 30 + Math.random() * 50;
    return shell(card, `
      <div class="gf-challenge-label">${label}${sub ? `<span>${sub}</span>` : ""}</div>
      <div class="gf-timing-track gf-hold-track">
        <div class="gf-zone great" style="left:${clamp(zoneCenter - zoneWidthPct, 0, 100)}%;width:${zoneWidthPct * 2}%"></div>
        <div class="gf-zone perfect" style="left:${clamp(zoneCenter - zoneWidthPct * 0.4, 0, 100)}%;width:${zoneWidthPct * 0.8}%"></div>
        <div class="gf-hold-fill"></div>
      </div>
      <button class="btn btn-primary gf-action-btn gf-hold-btn">HOLD TO CHARGE<span class="gf-key-hint">release on target</span></button>
    `, (wrap, finish) => {
      const btn = wrap.querySelector(".gf-hold-btn");
      const fill = wrap.querySelector(".gf-hold-fill");
      let holding = false, start = 0, raf, done = false, pct = 0;

      function loop(now) {
        if (!holding || done) return;
        pct = clamp((((now || performance.now()) - start) / fillMs) * 100, 0, 100);
        fill.style.width = pct + "%";
        if (pct >= 100) { release(); return; }
        raf = requestAnimationFrame(loop);
      }
      function press(e) {
        if (done || holding) return;
        e.preventDefault();
        holding = true;
        start = performance.now();
        btn.textContent = "RELEASE!";
        raf = requestAnimationFrame(loop);
      }
      function release(e) {
        if (done || !holding) return;
        if (e) e.preventDefault();
        done = true;
        holding = false;
        cancelAnimationFrame(raf);
        const dist = Math.abs(pct - zoneCenter);
        let score;
        if (dist <= zoneWidthPct * 0.4) score = 100 - (dist / (zoneWidthPct * 0.4)) * 10;
        else if (dist <= zoneWidthPct) score = 86 - ((dist - zoneWidthPct * 0.4) / (zoneWidthPct * 0.6)) * 22;
        else score = clamp(60 - (dist - zoneWidthPct) * 2.2, 4, 60);
        finish(score);
      }

      btn.addEventListener("pointerdown", press);
      btn.addEventListener("pointerup", release);
      btn.addEventListener("pointerleave", release);
      const timer = setTimeout(() => { if (!done) { done = true; finish(6); } }, fillMs + 3000);

      return () => {
        done = true;
        clearTimeout(timer);
        cancelAnimationFrame(raf);
        btn.removeEventListener("pointerdown", press);
        btn.removeEventListener("pointerup", release);
        btn.removeEventListener("pointerleave", release);
      };
    });
  }

  window.GaaMinigames = {
    timingBar, swipeKick, tapRush, reactionTap, pickThePass, holdAndRelease, rate,
    setHaptics(v) { hapticsOn = !!v; },
  };
})();
