# ⚒️ Iron Sharpens Iron — Setup (one time, ~15 minutes)

The app is 100% built. You just create the free backend, paste 6 values, and put it online.

## A. Create the Firebase backend (free)
1. Go to **console.firebase.google.com** → *Add project* → name it `iron-sharpens-iron` (Analytics: off).
2. Left menu **Build → Firestore Database** → *Create database* → Production mode → nearest region (us-east).
3. Firestore → **Rules** tab → replace everything with the contents of `firestore.rules` → **Publish**.
4. **Build → Authentication** → *Get started* → Sign-in method → **Anonymous** → Enable → Save.
5. Project overview → click the **</>** (web) icon → register app (any nickname) → copy the `firebaseConfig` values into **config.js** in this folder.
6. In `config.js`, also change `FAMILY_ID` to your own private word (same on all devices).

## B. Put it online (pick ONE)
**Option 1 — easiest, no coding (2 min):** go to **app.netlify.com/drop** and drag this whole folder in. You get a permanent https link. (Create the free account it offers so the site stays up.)

**Option 2 — Firebase Hosting:** install Node.js, then in this folder:
`npm i -g firebase-tools` → `firebase login` → `firebase init hosting` (choose your project, public dir `.`, no SPA rewrite needed) → `firebase deploy`.
Or paste this folder into **Claude Code** and say: *"Deploy this to Firebase Hosting on my project."*

## C. Install on your devices
- **iPhone:** open the link in Safari → Share → **Add to Home Screen**.
- **Kindle Fire:** open the link in Silk → menu (⋮) → **Add to Home Screen**.
Both devices now share the same live data. It also works offline and syncs when back online.

## D. Good to know
- Data lives in ONE Firestore doc per family — every tap saves within a second, nothing gets deleted between sessions or devices.
- The barcode scanner works on the https link; new products are taught once with the label's numbers, then scan-to-log forever.
- The coach check-ins use the built-in smart coach here. (The Claude-AI coach and AI food estimates are exclusive to the claude.ai version — the two versions don't share data, so pick one as your daily driver.)
- Phase 2 ideas for Claude Code: push notifications (Firebase Cloud Messaging), photo food logging, and a proper login later if you ever want accounts.
