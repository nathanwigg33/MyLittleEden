# Eden: The First Garden

A cozy pixel-art farming game set in the Garden of Eden, made to play on an iPhone (or any browser). It plays like the classic farm-sim games: a toolbar of tools, an energy bar, crops you water daily, a shipping crate that sells overnight, and a fishing minigame. All the art is original pixel art drawn in code. God gives the tutorial using Genesis verses. You gather and craft, farm through the seasons, name every creature, build a home, and keep the one command.

## How it plays
A simple, one-handed farm game in the style of Mini Mini Farm, set in the Garden of Eden.
- Use the joystick or tap to walk. Walk into things to gather them; walk over soil to plant and through ripe crops to harvest.
- Fill the angel Shamar's requests to earn Blessings, and spend them on seeds, tools and opening new lands.
- 25 lands to open, 42 things to discover and 27 creatures to name add up to an Exploration percentage.
- Build and decorate your home land with the hammer button, and upgrade your bower to a cottage and a house.
- Energy runs down as you work; sleeping at home restores it and grows your crops.

The earlier, larger version of the game is still at `/classic.html`.

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

## Art credit
Most of the pixel art is from **Sunnyside World** by danieldiggle (https://danieldiggle.itch.io/sunnyside), used under its license for free and commercial projects. The packed sprite sheet is in `art/`. Angels, the serpent, most wild animals and a few buildings are drawn in code for this game.
