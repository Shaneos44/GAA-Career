# Shipping GAA Career to the App Store and Google Play

The project is configured and both native projects are scaffolded and syncing.
What is left needs your hardware and your developer accounts.

---

## ⚠️ Read this before you submit: the app name

Not legal advice — but worth understanding before you upload, because the app
ID cannot be changed afterwards.

**The name "GAA Career" is the part worth thinking about.** The competition
terminology mostly is not:

- ***All-Ireland*** is geographic and descriptive, and ***All Star*** is
  generic sports vocabulary used worldwide (NBA, MLB, and so on). Neither is
  plausibly exclusive to the GAA, and I found no evidence either is
  registered. Describing a fictional competition as an "All-Ireland" in a
  Gaelic football game is ordinary descriptive use.
- ***Sam Maguire*** and ***Tailteann Cup*** are more distinctive, but they name
  a real trophy and a real competition; referring to them in a sports game is
  much closer to nominative use than to passing yourself off as the GAA.
- What the GAA actually registered and actively enforces is its **logo and the
  county crests** — it took 35 successful actions in 2020, mostly against
  merchandise carrying crests. **This game uses no crest, logo or badge**, which
  is the single biggest thing in its favour.

So the real question is not per-word infringement — it is whether the finished
listing gives the impression of an **official GAA product**. "GAA Career" as a
store name, with an app ID of `ie.gaacareer.game`, leans that way. The practical
risk is not a courtroom: it is that both stores act on IP complaints
administratively, and a rights holder's complaint can pull a live app down long
before anyone argues the merits.

Cheap ways to de-risk without gutting the game:

| Consider changing | Why |
|---|---|
| App name **GAA Career** | The organisation's own initialism as your product name is what implies affiliation. *Gaelic Football Career*, *Parish to Province*, *The Championship* all read the same to a player. |
| App ID `ie.gaacareer.game` | Same reasoning, and **this one is permanent after your first upload**. |

Keep the in-game terminology if you want it — it is what makes the game feel
real, and it is the weakest part of any complaint. County names are geographic
and lower risk again.

Either way, add a disclaimer to the store listing (it costs nothing and
undercuts an affiliation claim directly):

> Not affiliated with, endorsed by, or connected to the Gaelic Athletic
> Association.

If you want certainty rather than a judgement call, a short email to the GAA's
commercial department asking about a fan-made, free, no-ads game is a cheaper
answer than a takedown.

Two smaller review risks worth knowing:

- **Apple Guideline 4.2 (minimum functionality)** — web-view-wrapped apps get
  scrutiny. This one should clear it comfortably (real gameplay, fully offline,
  native feel, no browser chrome), but expect it to be looked at.
- **Apple Guideline 2.1** — reviewers must be able to reach everything with no
  account. That is already true here.

---

## What is already done

- Capacitor 6 configured; `android/` and `ios/` scaffolded and syncing.
- App icons, adaptive icons and splash screens generated for every density
  (136 Android assets, 13 iOS) from `assets/`.
- Portrait locked on both platforms, matching the UI.
- `ITSAppUsesNonExemptEncryption = false` in `Info.plist`, so App Store Connect
  stops asking about export compliance on every upload.
- Android `targetSdk` raised to **35** — the Capacitor default of 34 is below
  Google Play's floor and would have been rejected outright.
- Android hardware back button handled: it closes a coach card, a full-time
  screen or a match before it will exit the app.
- Privacy policy generated at `www/privacy.html`.
- PWA manifest and a service worker — verified to load with the network off.

## What you have to do

| | Needs |
|---|---|
| Apple | A Mac with Xcode, an Apple Developer account (€99/yr) |
| Google | Android Studio, a Play Console account ($25 once) |
| Both | Screenshots, listing copy (below), a hosted privacy-policy URL |

---

## 1. Set your identity first

Edit `capacitor.config.json`:

```json
{ "appId": "ie.yourdomain.yourapp", "appName": "Your App Name" }
```

Then re-scaffold so the change reaches the native projects:

```bash
rm -rf android ios
npm install
npx cap add android && npx cap add ios
npm run assets
```

Set the contact address in `build.js` (`CONTACT`), then `npm run build`.

## 2. Host the privacy policy

Both stores require a **public URL**, not a file inside the app. The simplest
route: enable GitHub Pages on this repo (Settings → Pages → `main` / `root`),
which puts it at `https://<user>.github.io/GAA-Career/www/privacy.html`.

## 3. Android

```bash
npm run android          # builds, syncs, opens Android Studio
```

In Android Studio: **Build → Generate Signed App Bundle** → create a keystore.

> Back up the keystore and its passwords somewhere permanent. Lose it and you
> can never update the app again under the same listing.

Then in the Play Console: create the app, upload the `.aab`, and complete the
Data safety form, content rating questionnaire, and store listing (answers
below).

## 4. iOS

```bash
npm run ios              # builds, syncs, opens Xcode
```

In Xcode: select the **App** target → Signing & Capabilities → set your Team.
Bump **Version** and **Build**. Then **Product → Archive** →
**Distribute App** → App Store Connect.

If `pod install` did not run when you scaffolded (it needs macOS):

```bash
cd ios/App && pod install
```

---

## Store listing copy

**App name (30 chars max)**
`GAA Career` — 10 chars. Rename per the warning above.

**Subtitle / short description (30 / 80 chars)**
`Junior B to the All-Ireland` (27)
`Play every match. Win your division. Climb from Junior B to the All-Ireland.` (76)

**Full description**

```
Start out on your club's Junior B team and work your way to a county jersey.

Every match is played, not simulated. Seven touch mini-games decide how you
perform: time your shot, drag back a free kick, hold your leap for a high
ball, mash to burst clear on a solo run, react to block a shot, and pick the
runner in space.

TEN GAMES A SEASON
A full divisional league — home and away against five rivals, with a live
table. Win your division and you go up. Finish bottom and you go down. There
is no other way to climb.

KNOCKOUT CHAMPIONSHIP
After the league comes the championship: quarter-final, semi-final, final.
Lose once and your season is over. Finish high in the league and you get an
easier draw. Level games go to extra time.

BUILD YOUR PLAYER
Nine attributes to level up, and they change how the game feels — a higher
rating literally widens the timing windows. Pick your position and face the
situations that come with it: a full-forward lives on shots and frees, a
full-back on blocks and tackles.

ALSO IN THERE
· Energy, fatigue and injuries
· Season objectives set by your manager
· 16 achievements
· Career records and a full match-news feed

No ads. No in-app purchases. No account. Works completely offline.
```

**Keywords (iOS, 100 chars)**
`gaelic,football,gaa,career,ireland,irish,sport,club,county,championship,league,manager,rpg`

**Category** — Games → Sports (secondary: Simulation or Role Playing)

**Age rating** — Apple 4+, Google "Everyone". No objectionable content.

---

## Data safety / privacy answers

Both stores ask the same thing. The honest answer throughout is **no**:

- Does the app collect or share user data? **No.**
- Analytics, crash reporting, advertising ID? **None.**
- Account required? **No.**
- Data encrypted in transit? **N/A — no data leaves the device.**
- Can users request deletion? **Yes — "Retire & start a new career", or uninstall.**
- Third-party SDKs? **None.** The only dependencies are Capacitor's own
  App, Haptics, Splash Screen and Status Bar plugins.

Google Play also asks for a **content rating questionnaire** — answer "no" to
violence, sexuality, language, controlled substances, gambling and user
interaction. It will come out Everyone / PEGI 3.

### Optional hardening

Android ships with `android.permission.INTERNET` by default. This game never
makes a network request, so you can delete that line from
`android/app/src/main/AndroidManifest.xml` for a cleaner permission list.
Test a release build on a real device afterwards before you rely on it.

---

## Screenshots

Take these on a simulator/emulator at the exact sizes, from a career a few
seasons in so the table and records look populated.

| Store | Required |
|---|---|
| Apple | 6.7" iPhone (1290×2796) **and** 6.5" (1242×2688) — 3 to 10 each. iPad shots too, unless you set the target to iPhone-only in Xcode. |
| Google | 2–8 phone shots, min 1080px on the short side, plus a 1024×500 feature graphic and the 512×512 icon |

Good six: the fixture card before a match · a mini-game mid-play (the timing
bar or pick-the-pass) · the full-time screen with Man of the Match · the league
table · the Player tab with attributes · an All-Ireland win with confetti.

The 512×512 Play icon and the 1024×1024 App Store icon are already at
`assets/icon.png` — resize as needed.

---

## Releasing an update

```bash
npm run build && npx cap sync
```

- **Android** — bump `versionCode` (must increase) and `versionName` in
  `android/app/build.gradle`.
- **iOS** — bump Version and Build in Xcode.

Google Play's target-API floor **moves to API 36 on 31 August 2026**. When you
hit that, upgrade to Capacitor 7 and raise `compileSdkVersion` /
`targetSdkVersion` in `android/variables.gradle` to 36.
