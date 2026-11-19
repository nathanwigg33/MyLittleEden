# My Little Promise Land

A cozy Stardew Valley–style farming game set on a farm outside Bethlehem, made to play on iPhone (Add to Home Screen) or any browser.

**Step 1 (now):** create your character, explore your overgrown farm, chop trees, break rocks, cut weeds with the scythe, collect wood, stone and fiber. Days run from 6 am to 2 am, seasons last 12 days, and you sleep in your tent to start the next day (the game saves each night).

**Step 2 (farming):** dig soil with the hoe, plant seeds, water every day with the watering can (refill at the pond), harvest when ripe, sell in the shipping bin. Spring crops: wheat, barley, leeks, garlic. Seeds from the merchant's cart by the tent. Storage chest beside the tent.

**Step 3 (Bethlehem):** the road east off the farm leads to town: Tobiah's market (seeds, sell produce), Jesse's forge (Bronze and Iron tool upgrades), Miriam's inn (food for energy), the church (daily verse; Sabbath service restores energy and builds friendship), and seven villagers to befriend. Shops close on the Sabbath, except the inn.

Controls: drag on the left side of the screen to walk, the big button uses your tool (or talks/uses things when a ! shows), the small button switches tools, and the toolbar picks items.

## Files
- `public/index.html` — the page
- `public/css/style.css` — look of menus and HUD
- `public/js/core.js` — art loading, sound
- `public/js/character.js` — character look + creator
- `public/js/world.js` — the farm map and terrain drawing
- `public/js/farming.js` — soil, watering, crops
- `public/js/npc.js` — villagers, friendship, dialogue
- `public/js/town.js` — market, blacksmith, inn, church
- `tools/buildings.py` — pixel-art Bethlehem buildings
- `public/js/game.js` — player, tools, time, HUD, saving
- `public/art/` — sprite sheet built by `tools/build_atlas.py`
- `public/old/` — earlier Eden versions

Hosted on Cloudflare Workers (static assets), deployed automatically on push to `main`.

Art: Sunnyside World by danieldiggle (danieldiggle.itch.io/sunnyside). Pixelify Sans font (SIL Open Font License).
