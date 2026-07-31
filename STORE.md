# Shipping GAA Career to the App Store and Google Play

The project is configured and both native projects are scaffolded and syncing.
What is left needs your hardware and your developer accounts.

---

## ⚠️ Read this before you submit: the name is a legal risk

**"GAA" is a registered trademark of the Gaelic Athletic Association**, and so
are most of the competition names this game currently uses. Right now the app
ships as **GAA Career** and refers to the *All-Ireland*, *Sam Maguire*, *All
Stars* and the *Tailteann Cup*.

Both stores act on intellectual-property complaints:

- Apple **App Review Guideline 5.2.1** — apps using third-party trademarks
  without permission are rejected.
- Google Play **Impersonation and Intellectual Property** policy — same, and
  Play also removes apps after launch on a rights-holder complaint.

The realistic outcomes are rejection at review, or — worse — approval followed
by a takedown once someone at Croke Park notices. I have **not** renamed
anything, because that is your call and you may already have permission or be
willing to take the risk. But if you do not have written permission, change
these before you submit:

| Currently | Safer |
|---|---|
| App name **GAA Career** | *Gaelic Football Career*, *Parish to Province*, *The Championship* |
| App ID `ie.gaacareer.game` | something without `gaa`, e.g. `ie.yourdomain.gaelicfootball` |
| *All-Ireland Championship* | *The National Championship* |
| *Sam Maguire* | *the Cup* / *the big one* |
| *All Star* | *Team of the Year* (the game already uses this phrasing in places) |
| *Tailteann Cup* | *The Second Tier Cup* |

County names themselves are geographic and much lower risk.

Whatever you land on, add a disclaimer to the store listing and the Guide tab:

> Not affiliated with, endorsed by, or connected to the Gaelic Athletic
> Association.

Changing the app ID **must** happen before your first upload — the ID is
permanent once a build is submitted. The name can change later; the ID cannot.

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
