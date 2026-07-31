// Gaelic Hero — UI shell. Renders the career screens and routes actions to
// data.js / match.js. Mobile-first: a bottom tab bar, thumb-reachable
// primary actions, and no hover-dependent affordances.

(function () {
  const SAVE_KEY = "gaa-career-save-v2";
  const G = window.GaaCareer;
  const S = window.GaaSeason;
  const GD = window.GaaGuide;
  const P = window.GaaProgress;
  const app = document.getElementById("app");

  let state = load();
  let tab = "season";

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }
  function setState(next) { state = next; save(); applySettings(); render(); }

  /** Persist without a re-render — used mid-match so the overlay isn't disturbed. */
  function persist(next) { state = next; save(); }

  function applySettings() {
    const st = (state && state.settings) || {};
    window.GaaAudio.setMuted(st.sound === false);
    window.GaaMinigames.setHaptics(st.haptics !== false);
  }

  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str == null ? "" : str;
    return d.innerHTML;
  }

  // ---------- Setup ----------

  function renderSetup() {
    app.innerHTML = `
      <div class="gf-wrap gf-setup">
        <div class="gf-crest">⚽</div>
        <h1>Gaelic Hero</h1>
        <p class="dim">Ten league games a season. Win your division to go up,
          finish bottom and you go down. Then it's knockout championship
          football — all the way to Sam Maguire.</p>

        <div class="panel">
          <div class="field">
            <label for="f-name">Player name</label>
            <input id="f-name" type="text" placeholder="Cian Walsh" maxlength="24" autocomplete="off" />
          </div>
          <div class="field">
            <label for="f-club">Club</label>
            <input id="f-club" type="text" placeholder="St. Brigid's" maxlength="24" autocomplete="off" />
          </div>
          <div class="field">
            <label for="f-county">County</label>
            <select id="f-county">${G.COUNTIES.map((c) => `<option${c === "Mayo" ? " selected" : ""}>${c}</option>`).join("")}</select>
          </div>
        </div>

        <div class="panel">
          <label>Position</label>
          <div class="gf-pos-grid">
            ${G.POSITIONS.map((p, i) => `
              <button class="gf-pos ${i === 0 ? "on" : ""}" data-pos="${p.key}">
                <span class="n">${esc(p.label)}</span>
                <span class="b">${esc(p.blurb)}</span>
              </button>`).join("")}
          </div>
          <p class="dim small" style="margin-top:10px">Your position decides which match situations you face.</p>
        </div>

        <button class="btn btn-primary btn-lg" data-action="start">Start Career</button>
      </div>
    `;

    let chosen = G.POSITIONS[0].key;
    app.querySelectorAll(".gf-pos").forEach((btn) => {
      btn.addEventListener("click", () => {
        chosen = btn.dataset.pos;
        app.querySelectorAll(".gf-pos").forEach((b) => b.classList.toggle("on", b === btn));
      });
    });
    app.querySelector('[data-action="start"]').addEventListener("click", () => {
      setState(G.createCareer({
        name: document.getElementById("f-name").value,
        club: document.getElementById("f-club").value,
        county: document.getElementById("f-county").value,
        positionKey: chosen,
      }));
    });
  }

  // ---------- Shared chrome ----------

  function headerHtml() {
    const tier = G.TIERS[state.tierIndex];
    const overall = G.computeOverall(state.attributes);
    const pos = G.POSITIONS.find((p) => p.key === state.position);
    return `
      <header class="gf-header">
        <div class="gf-id">
          <div class="gf-title">${esc(state.name)}</div>
          <div class="gf-sub">${esc(pos.label)} · ${esc(G.teamName(state))} · ${esc(tier.label)}</div>
        </div>
        <div class="gf-ovr" title="Overall rating"><span>${overall}</span><small>OVR</small></div>
      </header>
      <div class="gf-statstrip">
        <div class="gf-stat"><span class="l">Season</span><span class="v">${state.season}</span></div>
        <div class="gf-stat"><span class="l">All-Irelands</span><span class="v gold">${state.career.allIrelands}</span></div>
        <div class="gf-stat"><span class="l">All Stars</span><span class="v gold">${state.career.allStars}</span></div>
        <div class="gf-stat"><span class="l">Form</span><span class="v">${formHtml()}</span></div>
      </div>
    `;
  }

  function formHtml() {
    if (!state.form.length) return `<span class="dim">—</span>`;
    return state.form.map((r) => `<i class="gf-form ${r.toLowerCase()}">${r}</i>`).join("");
  }

  function energyHtml() {
    const low = state.energy < 30;
    return `
      <div class="panel">
        <div class="gf-row-between">
          <span class="k">Energy${state.injury ? ` <span class="gf-injury">· ${esc(state.injury.label)}</span>` : ""}</span>
          <span class="v">${state.energy}/100</span>
        </div>
        <div class="gf-bar-track"><div class="gf-bar-fill energy ${low ? "low" : ""}" style="width:${state.energy}%"></div></div>
        ${low ? `<p class="dim small" style="margin:8px 0 0">Running on empty — you'll play worse and risk a knock. Rest up.</p>` : ""}
      </div>
    `;
  }

  // ---------- Season tab ----------

  function seasonTabHtml() {
    if (state.phase === "offseason") return offseasonHtml();

    const tier = G.TIERS[state.tierIndex];
    const isChamp = state.phase === "championship";
    const meta = isChamp ? G.nextChampionshipFixture(state) : G.nextLeagueFixture(state);
    const blocked = !!state.injury;

    let fixtureCard;
    if (!meta) {
      fixtureCard = `<div class="panel"><p class="dim">No fixture scheduled.</p></div>`;
    } else {
      fixtureCard = `
        <div class="gf-fixture ${isChamp ? "champ" : ""}">
          <div class="gf-fixture-tag">${isChamp ? "🏆 " : ""}${esc(meta.label)}</div>
          <div class="gf-fixture-teams">
            <span>${esc(G.teamName(state))}</span>
            <span class="vs">v</span>
            <span>${esc(meta.oppName)}</span>
          </div>
          ${!isChamp ? `<div class="gf-fixture-venue">${meta.atHome ? "Home" : "Away"} · Round ${state.league.round + 1} of ${S.LEAGUE_ROUNDS}</div>` : `<div class="gf-fixture-venue">Win or your season is over</div>`}
          ${blocked
            ? `<p class="gf-blocked">Injured — ${esc(state.injury.label)}. Rest to recover (${state.injury.games} game${state.injury.games > 1 ? "s" : ""}).</p>`
            : `<button class="btn btn-primary btn-lg" data-action="${isChamp ? "play-champ" : "play-league"}">Play Match</button>`}
          <button class="btn" data-action="rest">Rest Up</button>
        </div>
      `;
    }

    return `
      ${fixtureCard}
      ${energyHtml()}
      ${!isChamp ? leagueProgressHtml() : ""}
      <div class="panel">
        <div class="gf-row-between"><span class="k">Match News</span></div>
        <div class="gf-log">${state.log.map((e) => `<div class="gf-log-item ${e.type}">${esc(e.text)}</div>`).join("")}</div>
      </div>
    `;
  }

  function leagueProgressHtml() {
    const played = state.league.round;
    const pct = Math.round((played / S.LEAGUE_ROUNDS) * 100);
    const pos = S.playerPosition(state.league);
    return `
      <div class="panel">
        <div class="gf-row-between">
          <span class="k">League progress</span>
          <span class="v">${played}/${S.LEAGUE_ROUNDS} played · ${G.ordinal(pos)}</span>
        </div>
        <div class="gf-bar-track"><div class="gf-bar-fill" style="width:${pct}%"></div></div>
        <p class="dim small" style="margin:10px 0 0">
          Win the division to go up. Finish ${S.TEAMS_PER_DIVISION}th and you go down.
        </p>
        ${state.objective ? `
          <div class="gf-objective ${pos <= state.objective.target ? "met" : ""}">
            <span class="l">Manager's target</span>
            <span class="d">${esc(state.objective.desc)}</span>
            <span class="s">${pos <= state.objective.target ? "On track" : "Off track"}</span>
          </div>` : ""}
      </div>
    `;
  }

  function offseasonHtml() {
    const champ = state.championship || {};
    const tier = G.TIERS[state.tierIndex];
    const change = state.pendingTierChange || 0;
    return `
      <div class="gf-final-panel">
        <h2>Season ${state.season} complete</h2>
        <p>
          Finished ${G.ordinal(state.leagueFinishPos || S.TEAMS_PER_DIVISION)} in ${esc(tier.division)}.
          ${champ.won ? "Championship won." : "Knocked out of the championship."}
        </p>
        ${change > 0 ? `<div class="gf-motm-banner gold">⬆ Promoted to ${esc(G.TIERS[state.tierIndex + 1].division)}</div>` : ""}
        ${change < 0 ? `<div class="gf-motm-banner">⬇ Relegated to ${esc(G.TIERS[state.tierIndex - 1].division)}</div>` : ""}
        <button class="btn btn-primary btn-lg" data-action="next-season">Start Season ${state.season + 1}</button>
      </div>
      <div class="panel">
        <div class="gf-row-between"><span class="k">Season Review</span></div>
        <div class="gf-log">${state.log.map((e) => `<div class="gf-log-item ${e.type}">${esc(e.text)}</div>`).join("")}</div>
      </div>
    `;
  }

  // ---------- Table tab ----------

  function tableTabHtml() {
    const tier = G.TIERS[state.tierIndex];
    const rows = S.sortTable(state.league.table);
    const last = S.TEAMS_PER_DIVISION;
    return `
      <div class="panel">
        <div class="gf-row-between">
          <span class="k">${esc(tier.division)}</span>
          <span class="v">Season ${state.season}</span>
        </div>
        <div class="gf-table-scroll">
          <table class="gf-table">
            <thead>
              <tr><th>#</th><th class="tl">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>+/−</th><th>Pts</th></tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr class="${r.isPlayer ? "me" : ""} ${i === 0 ? "promo" : ""} ${i === last - 1 ? "releg" : ""}">
                  <td>${i + 1}</td>
                  <td class="tl">${esc(r.name)}</td>
                  <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
                  <td>${r.f - r.a > 0 ? "+" : ""}${r.f - r.a}</td>
                  <td class="pts">${r.pts}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <div class="gf-legend">
          <span><i class="sw promo"></i> Promoted</span>
          <span><i class="sw releg"></i> Relegated</span>
        </div>
      </div>
      <div class="panel">
        <div class="gf-row-between"><span class="k">The Ladder</span></div>
        <div class="gf-ladder">
          ${G.TIERS.map((t, i) => `
            <div class="gf-ladder-step ${i < state.tierIndex ? "done" : ""} ${i === state.tierIndex ? "current" : ""}">
              <span class="dot"></span>${esc(t.division)}
            </div>`).join("")}
        </div>
      </div>
    `;
  }

  // ---------- Player tab ----------

  function playerTabHtml() {
    const c = state.career;
    return `
      <div class="panel">
        <div class="gf-row-between">
          <span class="k">Attributes</span>
          <span class="gf-tp">⚡ ${state.trainingPoints} pts</span>
        </div>
        ${G.ATTRS.map((a) => {
          const v = state.attributes[a.key];
          const cost = G.upgradeCost(v);
          const can = Number.isFinite(cost) && state.trainingPoints >= cost;
          return `
            <div class="gf-attr">
              <div class="gf-attr-head">
                <span class="name">${esc(a.label)} <span class="dim">${esc(a.hint)}</span></span>
                <span class="val">${v}</span>
              </div>
              <div class="gf-attr-row">
                <div class="gf-bar-track"><div class="gf-bar-fill" style="width:${v}%"></div></div>
                <button class="gf-upgrade-btn" data-action="upgrade" data-key="${a.key}" ${can ? "" : "disabled"}>
                  +<small>${Number.isFinite(cost) ? cost : "—"}</small>
                </button>
              </div>
            </div>`;
        }).join("")}
      </div>

      <div class="panel">
        <div class="gf-row-between"><span class="k">Career Record</span></div>
        <div class="gf-record">
          ${[
            ["Played", c.matches], ["Won", c.wins], ["Drawn", c.draws], ["Lost", c.losses],
            ["Goals", c.goals], ["Points", c.points], ["MOTM", c.motm],
            ["Leagues", c.leaguesWon], ["Championships", c.championships],
            ["Promotions", c.promotions], ["Relegations", c.relegations],
            ["All-Irelands", c.allIrelands], ["All Stars", c.allStars],
          ].map(([l, v]) => `<div class="gf-rec"><span class="n">${v}</span><span class="l">${l}</span></div>`).join("")}
        </div>
      </div>

      <div class="panel">
        <button class="btn btn-quiet" data-action="reset">Retire &amp; start a new career</button>
      </div>
    `;
  }

  // ---------- Guide tab ----------

  function guideTabHtml() {
    const st = state.settings || {};
    const have = new Set(state.achievements || []);
    const unlocked = P.ACHIEVEMENTS.filter((a) => have.has(a.key)).length;

    return `
      <div class="panel">
        <div class="gf-row-between"><span class="k">How to play the mini-games</span></div>
        <p class="dim small" style="margin:0 0 12px">
          Matches are played, not simulated. Tap <b>Practice</b> on any of these to drill it
          with nothing at stake.
        </p>
        <div class="gf-guide-list">
          ${GD.GUIDE.map((g) => `
            <details class="gf-guide-item">
              <summary>
                <span class="ic">${g.icon}</span>
                <span class="nm">${esc(g.name)}</span>
                <span class="at">${esc(g.attr)}</span>
              </summary>
              <div class="gf-guide-body">
                <p class="how">${g.how}</p>
                <p class="tip">${g.tip}</p>
                <button class="btn btn-primary" data-action="practice" data-kind="${g.key}">Practice ${esc(g.name)}</button>
              </div>
            </details>`).join("")}
        </div>
      </div>

      <div class="panel">
        <div class="gf-row-between"><span class="k">How the career works</span></div>
        <div class="gf-rules">
          ${GD.RULES.map((r) => `
            <div class="gf-rule">
              <div class="t">${esc(r.title)}</div>
              <div class="b">${r.body}</div>
            </div>`).join("")}
        </div>
      </div>

      <div class="panel">
        <div class="gf-row-between">
          <span class="k">Achievements</span>
          <span class="v">${unlocked}/${P.ACHIEVEMENTS.length}</span>
        </div>
        <div class="gf-ach-list">
          ${P.ACHIEVEMENTS.map((a) => `
            <div class="gf-ach ${have.has(a.key) ? "on" : ""}">
              <span class="ic">${have.has(a.key) ? "🏅" : "🔒"}</span>
              <span class="tx"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span>
            </div>`).join("")}
        </div>
      </div>

      <div class="panel">
        <div class="gf-row-between"><span class="k">Settings</span></div>
        <button class="gf-toggle ${st.sound !== false ? "on" : ""}" data-action="toggle" data-key="sound">
          <span>Sound effects</span><i></i>
        </button>
        <button class="gf-toggle ${st.haptics !== false ? "on" : ""}" data-action="toggle" data-key="haptics">
          <span>Vibration</span><i></i>
        </button>
      </div>
    `;
  }

  // ---------- Render ----------

  function render() {
    if (!state) { renderSetup(); return; }
    if (state.phase === "offseason") tab = "season";

    const body = tab === "table" ? tableTabHtml()
      : tab === "player" ? playerTabHtml()
      : tab === "guide" ? guideTabHtml()
      : seasonTabHtml();

    app.innerHTML = `
      <div class="gf-app">
        <div class="gf-wrap">
          ${headerHtml()}
          ${body}
        </div>
        <nav class="gf-tabbar">
          <button class="gf-tabbtn ${tab === "season" ? "on" : ""}" data-tab="season"><span>🏟️</span>Season</button>
          <button class="gf-tabbtn ${tab === "table" ? "on" : ""}" data-tab="table"><span>📊</span>Table</button>
          <button class="gf-tabbtn ${tab === "player" ? "on" : ""}" data-tab="player"><span>👤</span>Player</button>
          <button class="gf-tabbtn ${tab === "guide" ? "on" : ""}" data-tab="guide"><span>📖</span>Guide</button>
        </nav>
      </div>
    `;
    wire();
  }

  function wire() {
    app.querySelectorAll("[data-tab]").forEach((b) => {
      b.addEventListener("click", () => { tab = b.dataset.tab; render(); });
    });

    const on = (sel, fn) => {
      const el = app.querySelector(sel);
      if (el) el.addEventListener("click", fn);
    };

    on('[data-action="play-league"]', () => window.GaaMatch.start(state, G, "league", setState, persist));
    on('[data-action="play-champ"]', () => window.GaaMatch.start(state, G, "championship", setState, persist));
    on('[data-action="rest"]', () => setState(G.restUp(state)));
    on('[data-action="next-season"]', () => setState(G.startNextSeason(state)));
    on('[data-action="reset"]', () => {
      if (confirm("Retire this player and start over? Your career record will be lost.")) {
        localStorage.removeItem(SAVE_KEY);
        state = null;
        tab = "season";
        render();
      }
    });

    app.querySelectorAll('[data-action="upgrade"]').forEach((btn) => {
      btn.addEventListener("click", () => setState(G.upgradeAttribute(state, btn.dataset.key)));
    });

    app.querySelectorAll('[data-action="practice"]').forEach((btn) => {
      btn.addEventListener("click", () => window.GaaMatch.practice(state, G, btn.dataset.kind));
    });

    app.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
      btn.addEventListener("click", () => setState(G.toggleSetting(state, btn.dataset.key)));
    });
  }

  applySettings();
  render();
})();
