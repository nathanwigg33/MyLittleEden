# Eden: The First Garden

A cozy pixel-art farming game set in the Garden of Eden, made to play on an iPhone (or any browser). It plays like the classic farm-sim games: a toolbar of tools, an energy bar, crops you water daily, a shipping crate that sells overnight, and a fishing minigame. All the art is original pixel art drawn in code. God gives the tutorial using Genesis verses. You gather and craft, farm through the seasons, name every creature, build a home, and keep the one command.

## Controls
- **Phone:** drag to walk, or tap a spot to walk there. Tap something next to you to use your held tool on it (or talk/harvest). **USE** uses the held tool or item (hold to repeat; stronger hoes and cans charge). **ACT** talks, harvests, pets, opens and eats.
- **Keyboard:** WASD to move, C/Space to use, X/F to act, 1–0/-/= to pick a toolbar slot, E/Esc for the menu. Left-click uses the tool at the cursor; right-click acts.

## What's in the game
- **Chapter One:** formed from the dust, you learn to gather, craft, farm, fish and name the animals. The four regions of Eden (the Orchard, Havilah, the Tending Fields and the Wild Wood) open up as you go.
- **Chapter Two:** God makes Eve. She walks with you and helps you water, harvest and gather, or she stays home and tends the garden. Upgrade your bower to a cottage (which has a kitchen) and then a house. Plant fruit trees, care for the animals (they have friendship hearts), and keep the Sabbath.
- **Act Two, East of Eden:** if you eat from the Tree of Knowledge, you're cast out into a land of thorns. Cherubim and a flaming sword guard the gate back. Work takes more effort here, and there's a new set of quests.
- Shamar, the storehouse angel, trades Blessings ✦ for your goods and posts daily requests.
- Three seasons (Spring, Summer, Harvest) of 14 days each, with different crops in each.
- Calm background music, river sounds, and a day/night cycle with whispers that come out at night.

Progress saves in the browser on each device, so there's no account and no database.

## What's in here
- `public/index.html`: the whole game, in one file.
- `public/manifest.webmanifest`, the icons and `sw.js`: let you add it to your iPhone home screen and play offline.
- `wrangler.jsonc`: Cloudflare settings. It's a static site, so Cloudflare just serves the `public` folder.

## Publishing (Cloudflare + GitHub)
Same as Pick'em Club: Cloudflare Workers is connected to this repo, so every push to `main` publishes automatically.

First-time setup:
1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Import a repository** and choose `MyLittleEden`.
2. Leave the build command empty and keep the deploy command `npx wrangler deploy`. Click **Deploy**.
3. The game will be live at `https://mylittleeden.<your-subdomain>.workers.dev`.
4. On your iPhone, open that link in Safari, then tap **Share → Add to Home Screen**.

## Testing locally
`npx wrangler dev` runs it at http://localhost:8787. Opening `public/index.html` directly in a browser works too.
