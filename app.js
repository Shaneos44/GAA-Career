// GAA Career — rendering & save/load. Talks to window.GaaCareer for all
// game logic; this file only turns state into HTML and wires up clicks.

(function () {
  const SAVE_KEY = "gaa-career-save-v1";
  const G = window.GaaCareer;
  const app = document.getElementById("app");

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage unavailable — game still works, just won't persist */
    }
  }

  function setState(next) {
    state = next;
    save();
    render();
  }

  function esc(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Setup screen ----------

  function renderSetup() {
    const options = G.COUNTIES.map((c) => `<option value="${c}">${c}</option>`).join("");
    app.innerHTML = `
      <div class="gf-wrap gf-setup">
        <h1>GAA Career</h1>
        <p class="dim">Start out with your club's Junior B side and work your way up — Junior A, Intermediate,
          Senior, the county panel, and eventually a shot at the All-Ireland and an All Star. Train up your
          attributes, play matches, and climb the ladder.</p>
        <div class="panel">
          <div class="field">
            <label for="f-name">Player name</label>
            <input id="f-name" type="text" placeholder="e.g. Cian Walsh" maxlength="30" />
          </div>
          <div class="field">
            <label for="f-county">County</label>
            <select id="f-county">${options}</select>
          </div>
          <div class="field">
            <label for="f-club">Club name</label>
            <input id="f-club" type="text" placeholder="e.g. St. Brigid's" maxlength="30" />
          </div>
          <button class="btn btn-primary" data-action="start" style="margin-top:6px">Start Career</button>
        </div>
      </div>
    `;
  }

  // ---------- Game screen ----------

  function tierLadderHtml() {
    return G.TIERS.map((tier, i) => {
      let cls = "gf-ladder-step";
      if (i < state.tierIndex) cls += " done";
      else if (i === state.tierIndex) cls += " current";
      return `<div class="${cls}"><span class="dot"></span>${esc(tier.label)}</div>`;
    }).join("");
  }

  function attrsHtml() {
    return G.ATTRS.map((a) => {
      const value = state.attributes[a.key];
      const cost = G.upgradeCost(value);
      const affordable = state.trainingPoints >= cost && Number.isFinite(cost);
      return `
        <div class="gf-attr">
          <div class="gf-attr-head">
            <span class="name">${esc(a.label)}</span>
            <span class="val">${value}/99</span>
          </div>
          <div class="gf-attr-row">
            <div class="gf-bar-track"><div class="gf-bar-fill" style="width:${value}%"></div></div>
            <button class="gf-upgrade-btn" data-action="upgrade" data-key="${a.key}"
              ${affordable ? "" : "disabled"} title="Spend ${Number.isFinite(cost) ? cost : "—"} training pts">+</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function logHtml() {
    return state.log
      .map((entry) => `<div class="gf-log-item ${entry.type}">${esc(entry.text)}</div>`)
      .join("");
  }

  function actionOrFinalHtml() {
    if (state.readyForFinal) {
      return `
        <div class="gf-final-panel">
          <h2>🏆 All-Ireland Final Day</h2>
          <p>${esc(state.county)} have reached Croke Park. Throw-in is minutes away.</p>
          <button class="btn btn-primary" data-action="final">Play the Final</button>
        </div>
      `;
    }
    const tier = G.TIERS[state.tierIndex];
    const repPct = Math.min(100, Math.round((state.reputation / tier.repNeeded) * 100));
    const canPlay = state.energy >= 15;
    return `
      <div class="panel">
        <div class="gf-row-between">
          <span class="k">${esc(tier.label)} <span class="dim">· ${esc(tier.level)}</span></span>
          <span class="v">${state.reputation}/${tier.repNeeded} rep</span>
        </div>
        <div class="gf-bar-track"><div class="gf-bar-fill" style="width:${repPct}%"></div></div>
        <div class="gf-ladder">${tierLadderHtml()}</div>
      </div>
      <div class="panel">
        <div class="gf-row-between">
          <span class="k">Energy</span>
          <span class="v">${state.energy}/100</span>
        </div>
        <div class="gf-bar-track"><div class="gf-bar-fill energy ${state.energy < 30 ? "low" : ""}" style="width:${state.energy}%"></div></div>
        <div class="gf-actions">
          <button class="btn btn-primary" data-action="match" ${canPlay ? "" : "disabled"}>${canPlay ? "Play Match" : "Need energy"}</button>
          <button class="btn" data-action="rest">Rest</button>
        </div>
      </div>
    `;
  }

  function render() {
    if (!state) {
      renderSetup();
      wireSetup();
      return;
    }

    const overall = G.computeOverall(state.attributes);
    const c = state.career;

    app.innerHTML = `
      <div class="gf-wrap">
        <div class="gf-header">
          <div>
            <div class="gf-title">${esc(state.name)}</div>
            <div class="gf-sub">${esc(state.club)} · ${esc(state.county)} · Season ${state.season} · Overall ${overall}</div>
          </div>
          <button class="btn btn-quiet btn-sm" data-action="reset">Reset</button>
        </div>

        <div class="gf-trophies">
          <div class="gf-trophy"><div class="n">${c.allIrelands}</div><div class="l">All-Irelands</div></div>
          <div class="gf-trophy"><div class="n">${c.allStars}</div><div class="l">All Stars</div></div>
          <div class="gf-trophy"><div class="n">${c.wins}/${c.matches}</div><div class="l">Career W/P</div></div>
        </div>

        ${actionOrFinalHtml()}

        <div class="panel">
          <div class="gf-row-between">
            <span class="k">Attributes</span>
            <span class="gf-tp">⚡ ${state.trainingPoints} training pts</span>
          </div>
          ${attrsHtml()}
        </div>

        <div class="panel">
          <div class="gf-row-between"><span class="k">Match News</span></div>
          <div class="gf-log">${logHtml()}</div>
        </div>
      </div>
    `;

    wireGame();
  }

  // ---------- Event wiring ----------

  function wireSetup() {
    app.querySelector('[data-action="start"]').addEventListener("click", () => {
      const name = document.getElementById("f-name").value;
      const county = document.getElementById("f-county").value;
      const club = document.getElementById("f-club").value;
      setState(G.createCareer({ name, county, club }));
    });
  }

  function wireGame() {
    const matchBtn = app.querySelector('[data-action="match"]');
    if (matchBtn) matchBtn.addEventListener("click", () => window.GaaMatch.start(state, G, false, setState));

    const restBtn = app.querySelector('[data-action="rest"]');
    if (restBtn) restBtn.addEventListener("click", () => setState(G.restUp(state)));

    const finalBtn = app.querySelector('[data-action="final"]');
    if (finalBtn) finalBtn.addEventListener("click", () => window.GaaMatch.start(state, G, true, setState));

    app.querySelectorAll('[data-action="upgrade"]').forEach((btn) => {
      btn.addEventListener("click", () => setState(G.upgradeAttribute(state, btn.dataset.key)));
    });

    const resetBtn = app.querySelector('[data-action="reset"]');
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm("Retire this player and start a brand new career? This cannot be undone.")) {
          localStorage.removeItem(SAVE_KEY);
          setState(null);
        }
      });
    }
  }

  render();
})();
