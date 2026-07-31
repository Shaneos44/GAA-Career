// Gaelic Hero — native shell integration.
//
// Everything here is optional: on the plain web the Capacitor globals simply
// aren't there and every call short-circuits, so the same bundle runs as a
// website, a PWA, and inside the iOS/Android wrappers.

(function () {
  const cap = window.Capacitor;
  const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const plugin = (name) => (cap && cap.Plugins && cap.Plugins[name]) || null;

  window.GaaNative = { isNative, platform: (cap && cap.getPlatform && cap.getPlatform()) || "web" };

  if (!isNative) return;

  // Hide the launch screen once the first frame is actually up, rather than
  // on a fixed timer that can flash an empty view on a slow device.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const splash = plugin("SplashScreen");
      if (splash) splash.hide().catch(() => {});
    });
  });

  const statusBar = plugin("StatusBar");
  if (statusBar) {
    statusBar.setStyle({ style: "DARK" }).catch(() => {});
    statusBar.setBackgroundColor({ color: "#0E1116" }).catch(() => {});
  }

  // Android hardware back: close whatever is open before leaving the app, so
  // back never drops a player out of the game mid-match by surprise.
  const app = plugin("App");
  if (app && app.addListener) {
    app.addListener("backButton", () => {
      const coach = document.querySelector('[data-action="coach-ok"]');
      if (coach) { coach.click(); return; }

      const cont = document.querySelector('[data-action="match-continue"]');
      if (cont) { cont.click(); return; }

      const quit = document.querySelector(".gf-match-overlay .gf-quit");
      if (quit) { quit.click(); return; }

      // On a career screen: step back to the Season tab before exiting.
      const activeTab = document.querySelector(".gf-tabbtn.on");
      if (activeTab && activeTab.dataset.tab !== "season") {
        const season = document.querySelector('.gf-tabbtn[data-tab="season"]');
        if (season) { season.click(); return; }
      }

      app.exitApp();
    });
  }
})();
