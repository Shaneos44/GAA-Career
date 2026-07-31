# Shipping Gaelic Hero to the App Store and Google Play

The project is configured and both native projects are scaffolded and syncing.
What is left needs your hardware and your developer accounts.

---

## Naming — settled

The app is **Gaelic Hero**, ID **`ie.gaelichero.app`**. That resolves the one
thing that was worth worrying about: nothing in the store listing, the name or
the ID suggests an official GAA product any more.

Not legal advice, but for the record on where the remaining risk sits — it is
low:

- The in-game terminology is deliberately kept. ***All-Ireland*** is geographic
  and descriptive, ***All Star*** is generic sports vocabulary used worldwide
  (NBA, MLB and so on), and no registration for either turned up. ***Sam
  Maguire*** and the ***Tailteann Cup*** name a real trophy and a real
  competition, which is nominative use, not passing off.
- What the GAA actually registered and enforces is its **logo and the county
  crests** — 35 successful actions in 2020, mostly against crested merchandise.
  **This game uses no crest, logo or badge anywhere**, which is the single
  biggest point in its favour. Keep it that way: do not add county colours as
  crests, and do not use the GAA logo in screenshots or the listing.
- County names are geographic and lower risk again.

**`ie.gaelichero.app` is permanent from your first upload.** Change it now if
you would rather tie it to a domain you own — after that it is fixed for the
life of the listing.

One free bit of belt-and-braces — put this in the store listing description:

> Not affiliated with, endorsed by, or connected to the Gaelic Athletic
> Association.

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

## 1. Identity (already set)

Edit `capacitor.config.json`:

```json
{ "appId": "ie.gaelichero.app", "appName": "Gaelic Hero" }
```

This is already set. Only change it if you want the ID tied to a domain you
own — and only before your first upload.

If you do change it, re-scaffold so it reaches the native projects (then
re-apply the SDK and orientation edits noted at the end of this file):

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
which puts it at `https://<user>.github.io/GaelicHero/www/privacy.html`.

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
`Gaelic Hero` — 11 chars, so it fits under a home-screen icon without
truncating. No separate short label needed.

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

Free, with no ads and no in-app purchases. No account, no tracking,
no internet needed — it works completely offline.
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
