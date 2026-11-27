// Crafting: the workbench on your farm. Recipes unlock as you play (days on the farm, harvests, fish, mine
// floors, friendships). You can craft machines that turn crops, fish, ore and wood into better things, food,
// supplies, paths, fences, gates, chests, a well, and furniture and decorations for the farm.
'use strict';
const nowMin = () => state.totalDay * 1440 + state.time;
const INK = '#2a1e18', WD = ['#733e39', '#b86f50', '#e4a672', '#ead4aa'], ST = ['#6e6a66', '#8e867c', '#b4ac9f', '#d4ccbe'],
  CU = ['#7a3a1c', '#c8743a', '#f0a868'], FE = ['#3a3a44', '#5a5a64', '#8a8a96', '#c0c0cc'], AU = ['#b07a16', '#eabf40', '#fff0a0'], CLAY = ['#7a3a1c', '#b8582e', '#e08a52'];

// ================= machines =================
// proc(id) → what happens when that item goes in: { use: how many, out, n, min: minutes, extra: other things used }
const FISH_OK = id => id.startsWith('fish_') && FISH[id.slice(5)] && !FISH[id.slice(5)].junk;
const MACH = {
  sprinkler: { n: 'Sprinkler', d: 'Waters the 4 soil tiles touching it every morning.', reach: 4 },
  qsprinkler: { n: 'Quality Sprinkler', d: 'Waters all 8 soil tiles around it every morning.', reach: 8 },
  beehive: { n: 'Beehive', d: 'Bees make honey every 4 days, except in winter. Flowers nearby double it.', hive: 1 },
  jar: { n: 'Preserves Jar', d: 'Put in any crop. In 2 days it becomes preserves worth double, plus ₪30.', hint: 'Put in any crop.', proc: id => CROPS[id] && { out: 'jar_' + id, n: 1, min: 2 * 1440 } },
  press: { n: 'Juice Press', d: 'Put in any crop. In 3 days it becomes juice worth three times as much.', hint: 'Put in any crop.', proc: id => CROPS[id] && { out: 'juice_' + id, n: 1, min: 3 * 1440 } },
  mill: { n: 'Hand Mill', d: 'Grinds wheat or barley into 2 flour in a couple of hours.', hint: 'Put in wheat or barley.', proc: id => (id === 'wheat' || id === 'barley') && { out: 'flour', n: 2, min: 120 } },
  loom: { n: 'Loom', d: 'Weaves flax into fine linen cloth by the next day.', hint: 'Put in flax.', proc: id => id === 'flax' && { out: 'linen', n: 1, min: 1440 } },
  kiln: { n: 'Charcoal Kiln', d: 'Burns 10 wood down into a lump of coal in a few hours.', hint: 'Put in 10 wood.', proc: id => id === 'wood' && { use: 10, out: 'ore_coal', n: 1, min: 180 } },
  furnace: { n: 'Furnace', d: 'Smelts 5 ore and a lump of coal into a bar, just like Jesse does.', hint: 'Put in 5 copper, iron, silver or gold ore (uses 1 coal).',
    proc: id => { const b = Object.keys(SMELT).find(k => SMELT[k] === id); return b && { use: 5, out: b, n: 1, min: 240, extra: { ore_coal: 1 } } } },
  smoker: { n: 'Smokehouse', d: 'Smokes a fish over wood so it sells for twice as much.', hint: 'Put in any fish (uses 2 wood).', proc: id => FISH_OK(id) && { out: 'smoked_' + id.slice(5), n: 1, min: 360, extra: { wood: 2 } } },
};
const machWorking = o => o.out && nowMin() < o.ready;
const machReady = o => MACH[o.k].hive ? state.season !== 3 && nowMin() >= o.ready : o.out && nowMin() >= o.ready;

// ================= items crafted here =================
const MEALS = {
  barley_loaf: { n: 'Barley Loaf', e: 45, price: 50, d: 'A round loaf of barley bread, like the five loaves of the boy by the sea.' },
  veg_roast: { n: 'Roasted Vegetables', e: 55, price: 70, d: 'Carrots and onions roasted over the fire.' },
  gstew: { n: 'Garden Stew', e: 75, price: 110, d: 'Miriam’s recipe: leek, onion and garlic, simmered slowly.' },
  grilled: { n: 'Fish on the Coals', e: 45, price: 60, d: '“Come and have breakfast.” Fish cooked over a fire of coals.' },
  fish_stew: { n: 'Fisherman’s Stew', e: 110, price: 150, d: 'Peter’s favorite: fish with onion and garlic.' },
  salad: { n: 'Melon Salad', e: 90, price: 260, d: 'Cool melon with fresh coriander.' },
  cabsoup: { n: 'Cabbage Soup', e: 85, price: 200, d: 'Warm cabbage and turnip soup for a rainy winter day.' },
  honeycake: { n: 'Honey Cake', e: 120, price: 220, d: 'Like wafers made with honey.' },
  loaves: { n: 'Loaves and Fishes', e: 250, price: 300, d: 'A basket of bread and fish: enough to share with everyone. Restores all your energy.' },
};
const PATHS = { wood: 'Wooden Planks', flag: 'Flagstones', cobble: 'Cobblestones', mat: 'Reed Mat' };
// decorations crafted at the bench (drawn by drawCraftDecor, placed and picked up like Bezalel's)
const CDECOR = {
  torch: { n: 'Torch', d: 'A wooden torch that burns all night.', light: [46, .95] },
  campfire: { n: 'Campfire', d: 'A ring of stones and a crackling fire.', light: [70, 1] },
  bench: { n: 'Garden Bench', d: 'A wooden bench to rest on.' },
  table: { n: 'Table and Stools', d: 'An outdoor table for sharing a meal.' },
  flowerpot: { n: 'Flower Pot', d: 'A clay pot of bright flowers. Bees love them.' },
  haybale: { n: 'Hay Bale', d: 'A bale of golden straw.' },
  barrel: { n: 'Barrel', d: 'A sturdy wooden barrel with iron hoops.' },
  scarecrow: { n: 'Scarecrow', d: 'Keeps an eye on your fields.' },
  sign: { n: 'Wooden Sign', d: 'Write anything you like on it.' },
  jars: { n: 'Stone Water Jars', d: 'Stone water jars, like the six at the wedding in Cana.' },
  manger: { n: 'Manger', d: 'A wooden feeding trough full of hay, like the one in Bethlehem.' },
  birdbath: { n: 'Birdbath', d: 'A stone basin of water. Sparrows stop by to drink.' },
  dovecote: { n: 'Dovecote', d: 'A little house on a pole for white doves.' },
  cross: { n: 'Wooden Cross', d: 'A simple wooden cross with a white cloth.' },
};
for (const k in CDECOR) DECOR[k] = Object.assign({ craft: 1, need: {}, fee: 0 }, CDECOR[k]);

function craftItems() {
  const o = {
    flour: { n: 'Flour', icon: 'ic_flour', price: 30, d: 'Ground from wheat or barley in a hand mill.' },
    honey: { n: 'Honey', icon: 'ic_honey', price: 120, d: 'Sweet golden honey from your beehive.' },
    linen: { n: 'Linen Cloth', icon: 'ic_linen', price: 260, d: 'Fine cloth woven from flax.' },
    fert1: { n: 'Fertilizer', icon: 'ic_fert1', fert: 1, price: 2, d: 'Spread it on tilled soil. Crops there grow about a third faster. Lasts until harvest.' },
    fert2: { n: 'Rich Compost', icon: 'ic_fert2', fert: 2, price: 5, d: 'Spread it on tilled soil. Crops there grow about half again as fast. Lasts until harvest.' },
    cavetorch: { n: 'Cave Torch', icon: 'ic_cavetorch', cavetorch: 1, price: 2, d: 'Place it on the cave floor to light up the Sinai Caverns. Torches stay lit even after you leave. Tap one to pick it back up.' },
    ropeladder: { n: 'Rope Ladder', icon: 'ic_ropeladder', rope: 1, price: 10, d: 'Use it anywhere in the Sinai Caverns to climb straight back out to Mount Sinai.' },
    workbench: { n: 'Workbench', icon: 'ic_workbench', put: { t: 'bench' }, d: 'Your crafting workbench. Place it anywhere on your farm.' },
    chest: { n: 'Chest', icon: 'chest', put: { t: 'chest2' }, d: 'Extra storage. Place it, then tap it to put things in.' },
    farmwell: { n: 'Well', icon: 'well_pack', put: { t: 'fwell' }, d: 'Fill your watering can right where you need it.' },
    fence_wood: { n: 'Wood Fence', icon: 'ic_fence_wood', put: { t: 'fence' }, d: 'Fences join up with their neighbors. Chop with your axe to pick one back up.' },
    fence_stone: { n: 'Stone Wall', icon: 'ic_fence_stone', put: { t: 'sfence' }, d: 'A low stone wall. Break with your pickaxe to pick one back up.' },
    gate: { n: 'Gate', icon: 'ic_gate', put: { t: 'gate' }, d: 'Tap it to open and close. Chop with your axe to pick it back up.' },
  };
  for (const k in PATHS) o['path_' + k] = { n: PATHS[k], icon: 'ic_path_' + k, put: { path: k }, d: 'Place it on the ground to make a path. Weeds won’t grow there. Use your pickaxe to pick it back up.' };
  for (const k in MACH) o['m_' + k] = { n: MACH[k].n, icon: 'mach_' + k, put: { t: 'mach', k }, d: MACH[k].d + ' Place it on your farm.' };
  for (const k in MEALS) o[k] = { n: MEALS[k].n, icon: 'ic_' + k, food: MEALS[k].e, price: MEALS[k].price, d: `${MEALS[k].d} Restores ${MEALS[k].e} energy.` };
  for (const k in CROPS) {
    const c = CROPS[k], nm = (c.sn || c.n);
    o['jar_' + k] = { n: (k === 'melon' || k === 'gourd') ? nm + ' Preserves' : 'Pickled ' + c.n, icon: 'jar_' + k, price: c.sell * 2 + 30, d: `Made in a preserves jar. Sells for ₪${c.sell * 2 + 30}.` };
    o['juice_' + k] = { n: nm + ' Juice', icon: 'juice_' + k, price: c.sell * 3, d: `Pressed in a juice press. Sells for ₪${c.sell * 3}.` };
  }
  for (const k in FISH) if (!FISH[k].junk) o['smoked_' + k] = { n: 'Smoked ' + FISH[k].n, icon: 'smoked_' + k, price: FISH[k].price * 2, d: `Smoked over wood. Sells for ₪${FISH[k].price * 2}.` };
  return o;
}

// ================= recipes =================
// un: how it unlocks → ['start'] · ['day', n] · ['harvest', n] · ['fish', n] · ['mine', floor] · ['heart', villager, hearts]
const CRAFT_TABS = [['farm', 'Farm'], ['mach', 'Machines'], ['food', 'Food'], ['build', 'Build'], ['decor', 'Decor']];
const RECIPES = [
  // farm
  { id: 'fert1', cat: 'farm', n: 5, need: { fiber: 5, any_crop: 1 }, un: ['harvest', 5] },
  { id: 'fert2', cat: 'farm', n: 5, need: { fert1: 5, ore_coal: 1, honey: 1 }, un: ['harvest', 40] },
  { id: 'm_sprinkler', cat: 'farm', n: 1, need: { bar_copper: 1, stone: 5 }, un: ['harvest', 20] },
  { id: 'm_qsprinkler', cat: 'farm', n: 1, need: { bar_iron: 1, bar_gold: 1, ore_coal: 2 }, un: ['mine', 4] },
  { id: 'm_beehive', cat: 'farm', n: 1, need: { wood: 40, fiber: 10, ore_coal: 2 }, un: ['day', 5] },
  { id: 'farmwell', cat: 'farm', n: 1, need: { stone: 50, wood: 20, bar_copper: 1 }, un: ['heart', 'joseph', 2] },
  // machines
  { id: 'm_jar', cat: 'mach', n: 1, need: { wood: 30, stone: 20, ore_coal: 3 }, un: ['harvest', 10] },
  { id: 'm_press', cat: 'mach', n: 1, need: { wood: 40, bar_copper: 1, bar_iron: 1 }, un: ['harvest', 30] },
  { id: 'm_mill', cat: 'mach', n: 1, need: { stone: 40, wood: 20 }, un: ['heart', 'ruth', 2] },
  { id: 'm_loom', cat: 'mach', n: 1, need: { wood: 50, fiber: 30, bar_iron: 1 }, un: ['day', 14] },
  { id: 'm_kiln', cat: 'mach', n: 1, need: { wood: 30, stone: 20 }, un: ['mine', 1] },
  { id: 'm_furnace', cat: 'mach', n: 1, need: { stone: 40, ore_copper: 15, ore_coal: 5 }, un: ['mine', 3] },
  { id: 'm_smoker', cat: 'mach', n: 1, need: { wood: 40, stone: 20, ore_coal: 5 }, un: ['fish', 10] },
  // food
  { id: 'bread', cat: 'food', sub: 'Meals', n: 1, need: { wheat: 3 }, un: ['start'] },
  { id: 'barley_loaf', cat: 'food', sub: 'Meals', n: 1, need: { barley: 3 }, un: ['start'] },
  { id: 'grilled', cat: 'food', sub: 'Meals', n: 1, need: { any_fish: 1, wood: 2 }, un: ['fish', 1] },
  { id: 'veg_roast', cat: 'food', sub: 'Meals', n: 1, need: { carrot: 1, onion: 1, wood: 1 }, un: ['day', 3] },
  { id: 'gstew', cat: 'food', sub: 'Meals', n: 1, need: { leek: 1, onion: 1, garlic: 1 }, un: ['heart', 'miriam', 1] },
  { id: 'fish_stew', cat: 'food', sub: 'Meals', n: 1, need: { any_fish: 2, onion: 1, garlic: 1 }, un: ['heart', 'peter', 2] },
  { id: 'salad', cat: 'food', sub: 'Meals', n: 1, need: { melon: 1, coriander: 1 }, un: ['harvest', 20] },
  { id: 'cabsoup', cat: 'food', sub: 'Meals', n: 1, need: { cabbage: 1, turnip: 1 }, un: ['harvest', 35] },
  { id: 'honeycake', cat: 'food', sub: 'Meals', n: 1, need: { flour: 2, honey: 1 }, un: ['heart', 'miriam', 3] },
  { id: 'loaves', cat: 'food', sub: 'Meals', n: 1, need: { bread: 5, any_fish: 2 }, un: ['fish', 25] },
  { id: 'cavetorch', cat: 'food', sub: 'Supplies', n: 5, need: { wood: 1, fiber: 1 }, un: ['start'] },
  { id: 'bait', cat: 'food', sub: 'Supplies', n: 10, need: { fiber: 6 }, un: ['fish', 3] },
  { id: 'ropeladder', cat: 'food', sub: 'Supplies', n: 1, need: { fiber: 30, wood: 10 }, un: ['mine', 2] },
  // build
  { id: 'path_wood', cat: 'build', sub: 'Paths', n: 5, need: { wood: 5 }, un: ['start'] },
  { id: 'path_flag', cat: 'build', sub: 'Paths', n: 5, need: { stone: 5 }, un: ['start'] },
  { id: 'path_mat', cat: 'build', sub: 'Paths', n: 5, need: { fiber: 10 }, un: ['day', 3] },
  { id: 'path_cobble', cat: 'build', sub: 'Paths', n: 5, need: { stone: 10 }, un: ['day', 7] },
  { id: 'fence_wood', cat: 'build', sub: 'Fences', n: 4, need: { wood: 4 }, un: ['start'] },
  { id: 'gate', cat: 'build', sub: 'Fences', n: 1, need: { wood: 10 }, un: ['start'] },
  { id: 'fence_stone', cat: 'build', sub: 'Fences', n: 4, need: { stone: 8 }, un: ['day', 7] },
  { id: 'chest', cat: 'build', sub: 'Storage', n: 1, need: { wood: 50 }, un: ['start'] },
  // decor
  { id: 'decor_torch', cat: 'decor', sub: 'Lights', n: 1, need: { wood: 2, ore_coal: 1 }, un: ['start'] },
  { id: 'decor_campfire', cat: 'decor', sub: 'Lights', n: 1, need: { wood: 10, stone: 10 }, un: ['start'] },
  { id: 'decor_sign', cat: 'decor', sub: 'Furniture', n: 1, need: { wood: 5 }, un: ['start'] },
  { id: 'decor_bench', cat: 'decor', sub: 'Furniture', n: 1, need: { wood: 15 }, un: ['day', 2] },
  { id: 'decor_table', cat: 'decor', sub: 'Furniture', n: 1, need: { wood: 25 }, un: ['heart', 'joseph', 1] },
  { id: 'decor_barrel', cat: 'decor', sub: 'Furniture', n: 1, need: { wood: 15, ore_iron: 1 }, un: ['mine', 2] },
  { id: 'decor_jars', cat: 'decor', sub: 'Furniture', n: 1, need: { stone: 30 }, un: ['day', 12] },
  { id: 'decor_flowerpot', cat: 'decor', sub: 'Garden', n: 1, need: { stone: 6, fiber: 4 }, un: ['day', 3] },
  { id: 'decor_scarecrow', cat: 'decor', sub: 'Garden', n: 1, need: { wood: 10, fiber: 15, wheat: 2 }, un: ['day', 3] },
  { id: 'decor_haybale', cat: 'decor', sub: 'Garden', n: 1, need: { wheat: 5, fiber: 5 }, un: ['harvest', 10] },
  { id: 'decor_manger', cat: 'decor', sub: 'Garden', n: 1, need: { wood: 20, wheat: 5 }, un: ['day', 6] },
  { id: 'decor_birdbath', cat: 'decor', sub: 'Garden', n: 1, need: { stone: 25 }, un: ['day', 9] },
  { id: 'decor_dovecote', cat: 'decor', sub: 'Garden', n: 1, need: { wood: 25, fiber: 5 }, un: ['heart', 'naomi', 2] },
  { id: 'decor_cross', cat: 'decor', sub: 'Garden', n: 1, need: { wood: 10, linen: 1 }, un: ['heart', 'simeon', 2] },
];
// "any fish" and "any crop": uses whichever you have the most of, cheapest first
const GROUPS = { any_fish: { n: 'any fish', icon: 'fish_carp', ok: FISH_OK }, any_crop: { n: 'any crop', icon: 'item_wheat', ok: id => !!CROPS[id] } };
const haveN = id => GROUPS[id] ? state.inv.reduce((a, s) => a + (s && GROUPS[id].ok(s.id) ? s.n : 0), 0) : count(id);
function takeN(id, n) {
  if (!GROUPS[id]) { takeItem(id, n); return }
  const slots = state.inv.map((s, i) => [s, i]).filter(([s]) => s && GROUPS[id].ok(s.id)).sort((a, b) => (ITEMS[a[0].id].price || 0) - (ITEMS[b[0].id].price || 0));
  for (const [s, i] of slots) { if (n <= 0) break; const k = Math.min(n, s.n); s.n -= k; n -= k; if (s.n <= 0) state.inv[i] = null }
}
const ingName = id => GROUPS[id] ? GROUPS[id].n : ITEMS[id].n.toLowerCase();
const ingIcon = id => GROUPS[id] ? GROUPS[id].icon : ITEMS[id].icon;
const roomFor = id => canTake(id);
const canMake = (r, times = 1) => Object.entries(r.need).every(([id, n]) => haveN(id) >= n * times);

function unlockProgress(u) {
  const S = state.stats || {};
  switch (u[0]) {
    case 'start': return [1, 1];
    case 'day': return [state.totalDay, u[1]];
    case 'harvest': return [S.harvested || 0, u[1]];
    case 'fish': return [S.fish || 0, u[1]];
    case 'mine': return [state.mineMax || 0, u[1]];
    case 'heart': return [heartsOf(u[1]), u[2]];
  }
}
function unlockHint(u) {
  const [have, need] = unlockProgress(u), v = VILLAGERS.find(q => q.id === u[1]);
  switch (u[0]) {
    case 'day': return `Live on your farm for ${need} days (day ${Math.min(have, need)})`;
    case 'harvest': return `Harvest ${need} crops (${Math.min(have, need)}/${need})`;
    case 'fish': return `Catch ${need} fish (${Math.min(have, need)}/${need})`;
    case 'mine': return `Reach the ${CAVES[need].n} in the Sinai Caverns`;
    case 'heart': return `Become friends with ${v ? v.name : u[1]}: ${need} heart${need > 1 ? 's' : ''} (${have}/${need})`;
  }
  return '';
}
const isUnlocked = r => { const [a, b] = unlockProgress(r.un); return a >= b };
// learn any recipes you've just earned and tell the player about them
function checkRecipes(silent) {
  if (!state) return; const known = state.known = state.known || {}, fresh = state.newRec = state.newRec || {}; const got = [];
  for (const r of RECIPES) if (!known[r.id] && isUnlocked(r)) { known[r.id] = 1; fresh[r.id] = 1; got.push(r) }
  if (silent || !got.length) return;
  got.slice(0, 2).forEach((r, i) => setTimeout(() => { toast(`New recipe at your workbench: ${ITEMS[r.id].n}!`); if (i === 0) { tone(660, .09, 'triangle', .04); tone(880, .12, 'triangle', .04, .1) } }, i * 900));
  if (got.length > 2) setTimeout(() => toast(`…and ${got.length - 2} more new recipe${got.length > 3 ? 's' : ''}!`), 1800);
}
setInterval(() => { if (state && !paused && mode === 'play') checkRecipes() }, 2500);

// ================= the workbench menu =================
let craftTab = 'farm', craftOnly = false;
function openCraft() {
  checkRecipes(true); menuOpen = true; boxMode = 'craft'; $('#binM .ttl').textContent = 'Workbench'; $('#binM').classList.add('on'); sfx.tap();
  const fresh = state.newRec || {}, first = CRAFT_TABS.find(([k]) => RECIPES.some(r => r.cat === k && fresh[r.id])); if (first) craftTab = first[0];
  renderCraft();
}
function renderCraft() {
  const b = $('#binM .mbody'), known = state.known || {}, fresh = state.newRec || {}, total = RECIPES.filter(r => known[r.id]).length;
  let h = `<div class="binhead"><span>Recipes: ${total} of ${RECIPES.length}</span>${money()}</div><div class="stabs ctabs">`;
  for (const [k, lab] of CRAFT_TABS) { const rs = RECIPES.filter(r => r.cat === k), nk = rs.filter(r => known[r.id]).length, isNew = rs.some(r => fresh[r.id]);
    h += `<button class="stab${craftTab === k ? ' on' : ''}" data-tab="${k}">${lab}<small>${nk}/${rs.length}</small>${isNew ? '<i class="dot"></i>' : ''}</button>` }
  h += `</div><label class="conly"><input type="checkbox" ${craftOnly ? 'checked' : ''}> Only show what I can make now</label>`;
  let sub = null, shown = 0;
  for (const r of RECIPES.filter(r => r.cat === craftTab)) {
    const k = !!known[r.id], ok = k && canMake(r) && roomFor(r.id); if (craftOnly && !ok) continue;
    if (r.sub && r.sub !== sub) { sub = r.sub; h += `<div class="h3 csub">${sub}</div>` } shown++;
    const it = ITEMS[r.id];
    if (!k) { h += `<div class="shoprow crow lock"><img class="bimg sil" src="${iconURL(it.icon)}"><div class="si"><b>???</b><div class="muted">${unlockHint(r.un)}</div></div><div class="sb"><span class="lk"></span></div></div>`; continue }
    const ings = Object.entries(r.need).map(([id, n]) => { const have = haveN(id); return `<span class="ing ${have >= n ? 'ok' : 'no'}"><img src="${iconURL(ingIcon(id))}">${n} ${ingName(id)}${have < n ? ` <small>(have ${have})</small>` : ''}</span>` }).join('');
    const five = ok && canMake(r, 5);
    h += `<div class="shoprow crow${ok ? '' : ' cant'}"><img class="bimg" src="${iconURL(it.icon)}"><div class="si"><b>${it.n}${r.n > 1 ? ` <span class="xn">×${r.n}</span>` : ''}${fresh[r.id] ? ' <span class="newb">NEW</span>' : ''}</b><div class="muted">${craftDesc(r)}</div><div class="ings">${ings}</div></div>
      <div class="sb cbtns"><button class="btn" data-craft="${r.id}" ${ok ? '' : 'disabled'}>Craft</button>${five ? `<button class="btn alt" data-craft5="${r.id}">×5</button>` : ''}</div></div>`;
  }
  if (!shown) h += `<p class="muted" style="text-align:center;margin:18px 0">${craftOnly ? 'Nothing you can make right now. Gather more materials!' : ''}</p>`;
  b.innerHTML = h;
  b.querySelectorAll('[data-tab]').forEach(el => el.onclick = () => { craftTab = el.dataset.tab; sfx.tap(); renderCraft(); b.scrollTop = 0 });
  b.querySelector('.conly input').onchange = e => { craftOnly = e.target.checked; renderCraft() };
  b.querySelectorAll('[data-craft]').forEach(el => el.onclick = () => doCraft(el.dataset.craft, 1));
  b.querySelectorAll('[data-craft5]').forEach(el => el.onclick = () => doCraft(el.dataset.craft5, 5));
}
function craftDesc(r) {
  const it = ITEMS[r.id]; if (it.food) return `${MEALS[r.id] ? MEALS[r.id].d.replace(/ Restores all your energy\./, '') + ' ' : ''}Restores ${it.food} energy.`;
  if (it.put && it.put.t === 'mach') return MACH[it.put.k].d; if (it.put && it.put.path) return 'A path to walk on. Weeds won’t grow there.';
  if (it.place) return CDECOR[it.place].d; return it.d.split('. ')[0] + '.';
}
function doCraft(id, times) {
  const r = RECIPES.find(q => q.id === id); let made = 0;
  for (let k = 0; k < times; k++) { if (!canMake(r) || !roomFor(id)) break; for (const [i, n] of Object.entries(r.need)) takeN(i, n); addItem(id, r.n); made++ }
  if (!made) { toast('You can’t make that right now.'); sfx.no(); return }
  delete (state.newRec || {})[id]; state.stats.crafted = (state.stats.crafted || 0) + made;
  sfx.chop(); setTimeout(() => sfx.pick(), 160); note(id, r.n * made); renderCraft(); updateHUD(); save();
}

// ================= placing and using crafted things =================
const emptyCell = (x, y, me) => inb(x, y) && World.ground[idx(x, y)] !== WATER && !World.objs[idx(x, y)] && !World.soil[idx(x, y)] && !(me && Math.floor(player.x) === x && Math.floor(player.y) === y);
function useCraftItem(slot) {
  const s = state.inv[slot], it = ITEMS[s.id], used = () => { s.n--; if (s.n <= 0) state.inv[slot] = null; updateHUD(); save() };
  if (it.rope) {
    if (World.cur !== 'mine') { toast('Use it in the Sinai Caverns to climb straight back out.'); sfx.no(); return }
    used(); sfx.swish(); toast('You climb the rope ladder up to the surface…'); saveSeen(); travel('sinai', 33, 12.7, 's'); return;
  }
  if (it.fert) {
    const c = findCell((x, y) => { const q = soilAt(x, y); return q && (q.f || 0) < it.fert });
    if (!c) { toast('Spread it on tilled soil that isn’t fertilized yet.'); sfx.no(); return }
    faceToward(c.x, c.y); const q = soilAt(c.x, c.y); q.f = it.fert; q.fp = q.fp || 0; used(); sfx.dig(); chips(c.x + .5, c.y + .6, it.fert === 2 ? '#3f5a2a' : '#8a6a3e', 7); return;
  }
  const p = it.put; if (!p) return;
  if (World.cur !== 'farm') { toast('You can place this on your farm.'); sfx.no(); return }
  const [x, y] = facingCell(), i = idx(x, y);
  if (p.path) {
    const paths = state.paths = state.paths || {};
    if (!inb(x, y) || World.ground[i] === WATER || World.soil[i] || paths[i] || (World.objs[i] && (OBJ[World.objs[i].t] || {}).solid)) { toast('Face open ground to lay a path.'); sfx.no(); return }
    paths[i] = p.path; used(); sfx.rock(); chips(x + .5, y + .6, p.path === 'wood' ? '#b86f50' : p.path === 'mat' ? '#d8b860' : '#b4ac9f', 5); return;
  }
  if (!emptyCell(x, y, true)) { toast('Face an empty spot to place it.'); sfx.no(); return }
  const o = { t: p.t }; if (p.k) o.k = p.k; if (p.t === 'chest2') o.items = new Array(INV_SIZE).fill(null);
  if (p.t === 'mach' && MACH[p.k].hive) o.ready = nowMin() + 4 * 1440 - state.time + 360;   // first honey in 4 mornings
  World.place(x, y, o); used(); sfx.plant(); chips(x + .5, y + .6, '#d4ccbe', 6);
  if (p.t === 'mach' && MACH[p.k].reach) toast(`It will water the soil ${MACH[p.k].reach === 4 ? 'touching it' : 'all around it'} every morning.`);
}
// picking a path back up with the pickaxe
function removePath() {
  const paths = state.paths || {}; const [fx, fy] = facingCell();
  for (const [x, y] of [[fx, fy], [Math.floor(player.x), Math.floor(player.y)]]) {
    const i = idx(x, y); if (!inb(x, y) || !paths[i]) continue; const k = paths[i]; delete paths[i];
    sfx.rock(); chips(x + .5, y + .6, '#9a978f', 5); drop('path_' + k, 1, x + .5, y + .5); return true;
  }
  return false;
}

// tapping crafted things
async function craftInteract(r) {
  const o = r.o;
  if (o.t === 'bench') { openCraft(); return true }
  if (o.t === 'bezstall') { openWorkshop(); return true }
  if (o.t === 'bezcart') { say('Bezalel’s handcart, loaded with cut stone, acacia beams and a sack of tools.'); return true }
  if (o.t === 'gate') {
    if (o.open && Math.floor(player.x) === r.x && Math.floor(player.y) === r.y) return true;
    o.open = !o.open; tone(o.open ? 300 : 220, .07, 'square', .03); save(); return true;
  }
  if (o.t === 'chest2') { openFarmChest(o, r); return true }
  if (o.t === 'fwell') {
    if (state.can < canMax()) { state.can = canMax(); sfx.splash(); chips(r.x + .5, r.y + .2, '#bfe6ff', 8); toast('You filled your watering can at the well.'); updateHUD(); return true }
    const v = await say('Your well. The water is cool and clear.', [['Pick it up', 1], ['OK', 0]]); if (v) pickUp(r, 'farmwell'); return true;
  }
  if (o.t === 'mach') { await machineAction(r); return true }
  return false;
}
function pickUp(r, id) { if (!roomFor(id)) { toast('Your bag is full.'); sfx.no(); return } World.place(r.x, r.y, null); addItem(id, 1); note(id, 1); sfx.pick(); updateHUD(); save() }
const timeLeft = m => m < 60 ? 'in less than an hour' : m < 1440 ? `in about ${Math.round(m / 60)} hour${Math.round(m / 60) > 1 ? 's' : ''}` : `in about ${Math.round(m / 1440)} day${Math.round(m / 1440) > 1 ? 's' : ''}`;
async function machineAction(r) {
  const o = r.o, M = MACH[o.k], id = 'm_' + o.k;
  if (M.reach) { const v = await say(`${M.n}. ${M.d}`, [['Pick it up', 1], ['OK', 0]]); if (v) pickUp(r, id); return }
  if (M.hive) {
    if (machReady(o)) {
      const flowers = nearDecor(r.x, r.y, 4, ['flowerpot', 'planter']), n = flowers ? 2 : 1;
      if (!roomFor('honey')) { toast('Your bag is full.'); sfx.no(); return }
      addItem('honey', n); note('honey', n); sfx.pick(); o.ready = nowMin() - state.time + 360 + 4 * 1440; updateHUD(); save(); return;
    }
    const msg = state.season === 3 ? 'The bees are resting for the winter. They’ll make honey again in spring.' : `The bees are busy. Honey will be ready ${timeLeft(o.ready - nowMin())}.`;
    const v = await say(msg, [['Pick it up', 1], ['OK', 0]]); if (v) pickUp(r, id); return;
  }
  if (o.out) {
    if (!machReady(o)) { say(`The ${M.n.toLowerCase()} is making ${ITEMS[o.out].n.toLowerCase()}. It will be ready ${timeLeft(o.ready - nowMin())}.`); return }
    if (!roomFor(o.out)) { toast('Your bag is full.'); sfx.no(); return }
    addItem(o.out, o.n); note(o.out, o.n); sfx.pick(); state.stats.made = (state.stats.made || 0) + o.n; delete o.out; delete o.n; delete o.ready; save(); return;
  }
  const s = selItem(), spec = s && M.proc(s.id);
  if (spec) {
    const use = spec.use || 1, extra = spec.extra || {};
    if (s.n < use && count(s.id) < use) { toast(`You need ${use} ${ITEMS[s.id].n.toLowerCase()}.`); sfx.no(); return }
    for (const [e, n] of Object.entries(extra)) if (count(e) < n) { toast(`You also need ${n} ${ITEMS[e].n.toLowerCase()}.`); sfx.no(); return }
    takeItem(s.id, use); for (const [e, n] of Object.entries(extra)) takeItem(e, n);
    o.out = spec.out; o.n = spec.n; o.ready = nowMin() + spec.min; sfx.dig(); toast(`${M.n}: making ${ITEMS[spec.out].n.toLowerCase()}. Ready ${timeLeft(spec.min)}.`); updateHUD(); save(); return;
  }
  const v = await say(`${M.n}. ${M.hint} Select it in your bag, then tap the ${M.n.toLowerCase()}.`, [['Pick it up', 1], ['OK', 0]]); if (v) pickUp(r, id);
}
function nearDecor(x0, y0, rad, kinds) { for (let y = y0 - rad; y <= y0 + rad; y++) for (let x = x0 - rad; x <= x0 + rad; x++) { const o = World.get(x, y); if (o && o.t === 'decor' && kinds.includes(o.k)) return true } return false }

// overnight: sprinklers water the soil around them for the new day
function craftNight() {
  const F = World.maps.farm || World; if (!F.objs) return; let n = 0;
  F.objs.forEach((o, i) => {
    if (!o || o.t !== 'mach' || !MACH[o.k].reach) return; const x = i % W, y = Math.floor(i / W);
    const cells = MACH[o.k].reach === 4 ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (const [dx, dy] of cells) { const s = inb(x + dx, y + dy) && F.soil[idx(x + dx, y + dy)]; if (s) { s.w = 1; n++ } }
  });
  return n;
}

// a chest of your own on the farm
let farmChest = null;
function openFarmChest(o, r) { farmChest = { o, r }; menuOpen = true; boxMode = 'chest2'; $('#binM .ttl').textContent = 'Chest'; $('#binM').classList.add('on'); sfx.tap(); renderFarmChest() }
function renderFarmChest() {
  const { o, r } = farmChest, b = $('#binM .mbody'), slot = (s, attr, i) => `<div class="slot" ${attr}="${i}">${s ? `<img src="${iconURL(ITEMS[s.id].icon)}"><span class="n">${s.n > 1 ? s.n : ''}</span>` : ''}</div>`;
  const empty = o.items.every(s => !s);
  let h = '<p class="muted" style="margin:0 0 6px">Tap something in your bag to store it. Tap something in the chest to take it back.</p><div class="grid binrow">';
  o.items.forEach((s, i) => h += slot(s, 'data-c', i)); h += '</div><div class="h3">Your bag</div><div class="grid">';
  state.inv.forEach((s, i) => h += slot(s, 'data-i', i)); h += '</div>';
  if (empty) h += '<div style="text-align:center;margin-top:10px"><button class="btn alt" id="chestUp">Pick up this chest</button></div>';
  b.innerHTML = h;
  b.querySelectorAll('[data-c]').forEach(el => el.onclick = () => { if (!o.items[+el.dataset.c]) return; if (moveStack(o.items, +el.dataset.c, state.inv)) sfx.pick(); else { toast('Your bag is full.'); sfx.no() } renderFarmChest() });
  b.querySelectorAll('[data-i]').forEach(el => el.onclick = () => { if (!state.inv[+el.dataset.i]) return; if (moveStack(state.inv, +el.dataset.i, o.items)) sfx.pick(); else { toast('The chest is full.'); sfx.no() } renderFarmChest() });
  const up = $('#chestUp'); if (up) up.onclick = () => { if (!roomFor('chest')) { toast('Your bag is full.'); sfx.no(); return } pickUp(r, 'chest'); closeBin() };
}

// the workbench: Joseph leaves one beside your tent
function ensureBench() {
  const F = World.maps.farm; if (!F || state.benchGiven) return false; if (F.objs.some(o => o && o.t === 'bench')) { state.benchGiven = 1; return false } const T = World.TENT;
  for (const [dx, dy] of [[-3, 2], [-4, 2], [-2, 3], [-5, 1], [-4, 3], [4, 2], [5, 1], [-1, 4], [1, 4]]) {
    const x = T.x + dx, y = T.y + dy, i = idx(x, y);
    if (inb(x, y) && !F.objs[i] && F.ground[i] !== WATER && !F.soil[i]) { F.objs[i] = { t: 'bench' }; state.benchGiven = 1; if (state.paths) delete state.paths[i]; return true }
  }
  return false;
}
function benchWelcome() {
  setTimeout(() => say('Joseph the carpenter built you a workbench! It’s beside your tent. Use it to craft machines, food, paths, fences and decorations. New recipes appear as you farm, fish, mine and make friends.'), 1600);
}

// ================= drawing =================
// paths on the farm, drawn under everything else
function pathTile(g, k, px, py, x, y) {
  const R = (c, a, b, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(px + a, py + b, w, h) }, hv = (a, b) => hash(x * 7 + a, y * 13 + b);
  switch (k) {
    case 'wood': R('#b86f50', 0, 0, 16, 16); for (let r = 0; r < 4; r++) { const o = Math.floor(hv(r, 1) * 10) + 3; R('#d0875e', 0, r * 4, 16, 1); R('#8a4e3a', 0, r * 4 + 3, 16, 1); R('#8a4e3a', o, r * 4, 1, 3); R('#5e342a', o === 3 ? 12 : 2, r * 4 + 1, 1, 1) } break;
    case 'flag': R('#8e867c', 0, 0, 16, 16);
      for (const [a, b, w, h] of [[1, 1, 7, 6], [9, 1, 6, 4], [9, 6, 6, 5], [1, 8, 6, 7], [8, 12, 7, 3]]) { const c = hv(a, b) > .5 ? '#c9c1b3' : '#b9b1a3'; R(c, a, b, w, h); R('#ddd6c8', a, b, w, 1); R('#9a9286', a, b + h - 1, w, 1) } break;
    case 'cobble': R('#6e6a66', 0, 0, 16, 16);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const a = c * 4 + (r % 2 ? 2 : 0) - 1, b = r * 4, col = ['#a8a296', '#b8b2a6', '#9a958a'][Math.floor(hv(c, r) * 3)]; R(col, a + 1, b + 1, 3, 2); R('#d0cabe', a + 1, b + 1, 2, 1) } break;
    case 'mat': R('#c9a24e', 0, 0, 16, 16); for (let r = 0; r < 16; r += 2) for (let c = 0; c < 16; c += 4) { const s = ((r >> 1) % 2) * 2; R('#e0be6a', c + s, r, 2, 1); R('#a8823a', c + s + 2, r + 1, 2, 1) } break;
  }
}
function drawPaths(g, x0, y0, x1, y1) {
  if (World.cur !== 'farm' || !state || !state.paths) return; const P = state.paths;
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
    const k = P[idx(x, y)]; if (!k) continue; pathTile(g, k, x * 16, y * 16, x, y);
    const same = (a, b) => inb(a, b) && P[idx(a, b)];
    g.fillStyle = 'rgba(50,30,15,.35)'; if (!same(x, y - 1)) g.fillRect(x * 16, y * 16, 16, 1); if (!same(x - 1, y)) g.fillRect(x * 16, y * 16, 1, 16); if (!same(x + 1, y)) g.fillRect(x * 16 + 15, y * 16, 1, 16);
    if (!same(x, y + 1)) { g.fillStyle = 'rgba(50,30,15,.45)'; g.fillRect(x * 16, y * 16 + 15, 16, 1) }
  }
}
// fertilizer specks on soil
function drawFert(g, x0, y0, x1, y1) {
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
    const s = World.soil[idx(x, y)]; if (!s || !s.f) continue; g.fillStyle = s.f === 2 ? '#7fd0a0' : '#e8c890';
    for (let k = 0; k < 6; k++) g.fillRect(x * 16 + 2 + Math.floor(hash(x + k, y * 3) * 12), y * 16 + 2 + Math.floor(hash(y + k * 5, x) * 12), 1, 1);
  }
}

// fences link up with fences and gates beside them
const fenceAt = (x, y, ...ts) => { const o = World.get(x, y); return !!(o && ts.includes(o.t)) };
function drawCraftObj(g, o, x, y, t) {
  const cx = x * 16 + 8, by = y * 16 + 16, P = (c, a, b, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(cx + a), Math.round(by + b), w, h) };
  const shadow = w => { g.fillStyle = 'rgba(30,20,10,.22)'; g.beginPath(); g.ellipse(cx, by - 2, w, Math.max(2, w * .38), 0, 0, 7); g.fill() };
  const spr = (s, dy = 0) => g.drawImage(s, Math.round(cx - s.width / 2), Math.round(by - s.height + dy));
  switch (o.t) {
    case 'bench': shadow(11); drawWorkbench(g, cx, by, t); break;
    case 'mach': shadow(8); drawMach(g, o.k, cx, by, t, o); if (machReady(o) && !MACH[o.k].reach) drawBubble(g, cx, by - machH(o.k) - 4, MACH[o.k].hive ? 'honey' : o.out, t); break;
    case 'chest2': shadow(7); spr(AT.chest[0], 0); break;
    case 'fwell': shadow(10); spr(AT.well_pack[0], 1); if (AT.bucket) g.drawImage(AT.bucket[0], cx + 6, by - 10); break;
    case 'fence': case 'gate': case 'sfence': if (typeof player !== 'undefined' && Math.abs(player.x - x - .5) < 1.2 && player.y > y - .95 && player.y < y + .35) g.globalAlpha = .45;
      if (o.t === 'sfence') { drawWall(); g.globalAlpha = 1; break } {
      const L = fenceAt(x - 1, y, 'fence', 'gate'), Rt = fenceAt(x + 1, y, 'fence', 'gate'), D = fenceAt(x, y + 1, 'fence', 'gate'), U = fenceAt(x, y - 1, 'fence', 'gate');
      if (o.t === 'fence') {   // slim posts and thin rails, so the ground still shows through
        if (Rt) for (const yy of [-9, -5]) { P(INK, 1, yy - 1, 15, 3); P(WD[2], 1, yy, 15, 1) }
        if (D) { P(INK, -1, -2, 3, 15); P(WD[1], 0, -2, 1, 14) }
        P('rgba(30,20,10,.22)', -2, -1, 5, 2); P(INK, -2, -12, 5, 12); P(WD[1], -1, -11, 3, 11); P(WD[2], -1, -11, 1, 11); P(WD[3], -1, -12, 3, 1);
      } else drawGate(P, o.open, !(L || Rt) && (U || D), t, Rt, D);
      g.globalAlpha = 1; break;
    }
  }
  function drawWall() {
      const Rt = fenceAt(x + 1, y, 'sfence'), Lf = fenceAt(x - 1, y, 'sfence'), D = fenceAt(x, y + 1, 'sfence');
      const a = Lf ? -8 : -5, b = Rt ? 8 : 5;   // a low wall: knee height, so the tile behind it stays in view
      P('rgba(30,20,10,.25)', a, -1, b - a, 2); P(INK, a, -7, b - a, 7); P(ST[1], a + (Lf ? 0 : 1), -6, b - a - (Lf ? 0 : 1) - (Rt ? 0 : 1), 5);
      for (const [yy, off] of [[-6, 0], [-3, 3]]) { P(ST[3], a + 1, yy, b - a - 2, 1); for (let xx = a + 2 + off; xx < b - 1; xx += 6) P(ST[0], xx, yy + 1, 1, 2) }
      P(ST[0], a + 1, -2, b - a - 2, 1); P(INK, a, -9, b - a, 3); P(ST[2], a + 1, -8, b - a - 2, 1);
      if (D) { P(INK, -4, -2, 8, 13); P(ST[1], -3, -2, 6, 12); P(ST[3], -3, -2, 6, 1) }
  }
}
// a gate matches the fence: same posts and rail heights, a picket leaf with a diagonal brace, and it links to the fences beside it
function drawGate(P, open, vertical, t, Rt, D) {
  const post = (x, y = 0) => { P(INK, x - 2, y - 12, 5, 12); P(WD[1], x - 1, y - 11, 3, 11); P(WD[2], x - 1, y - 11, 1, 11); P(WD[3], x - 1, y - 12, 3, 1) };
  if (vertical) {   // in a fence that runs up and down
    if (D) { P(INK, -1, -2, 3, 15); P(WD[1], 0, -2, 1, 14) }
    if (open) {   // swung aside: the picket leaf shows flat beside the gap
      post(0, -8);
      for (const yy of [-17, -13]) { P(INK, 1, yy - 1, 12, 3); P(WD[2], 1, yy, 12, 1) }
      for (const xx of [4, 8]) { P(INK, xx - 1, -19, 3, 9); P(WD[3], xx, -18, 1, 7) }
      return;
    }
    post(0, -8); P(INK, -3, -11, 7, 15); P(WD[3], -2, -10, 5, 13); P(WD[2], 1, -10, 2, 13); for (const yy of [-8, -3, 1]) P(WD[0], -2, yy, 5, 1); P(AU[1], 2, -6, 1, 2);
    return;
  }
  post(-6); post(6);                                                                 // hinge post and latch post, like the fence posts
  if (Rt) for (const yy of [-9, -5]) { P(INK, 8, yy - 1, 8, 3); P(WD[2], 8, yy, 8, 1) }   // rails on to the next fence post
  if (open) {   // swung toward you, hanging off the hinge post
    P(INK, -5, -11, 4, 15); P(WD[2], -4, -10, 2, 13); P(WD[3], -4, -10, 1, 13); for (const yy of [-7, -1]) P(WD[0], -4, yy, 2, 1);
    return;
  }
  for (const yy of [-10, -4]) { P(INK, -4, yy - 1, 9, 3); P(WD[2], -4, yy, 9, 1) }       // top and bottom rails of the leaf
  for (const xx of [-2, 1]) { P(INK, xx - 1, -12, 3, 11); P(WD[3], xx, -11, 1, 9) }     // pickets
  for (let k = 0; k < 6; k++) P(WD[0], -3 + k, -4 - k, 1, 1);                         // diagonal brace
  P(AU[1], 3, -8, 1, 2);                                                              // latch
}
// the "ready" bubble over a machine
function drawBubble(g, cx, y, id, t) {
  const bob = Math.round(Math.sin(t * 3) * 1.5), s = AT[ITEMS[id].icon] && AT[ITEMS[id].icon][0]; y += bob;
  g.fillStyle = INK; g.fillRect(cx - 8, y - 16, 16, 14); g.fillRect(cx - 7, y - 17, 14, 16); g.fillRect(cx - 1, y - 2, 3, 3);
  g.fillStyle = '#fffaf0'; g.fillRect(cx - 7, y - 16, 14, 14); g.fillRect(cx, y - 2, 1, 2);
  if (s) { const k = Math.min(1, 12 / Math.max(s.width, s.height)); g.drawImage(s, Math.round(cx - s.width * k / 2), Math.round(y - 9 - s.height * k / 2), s.width * k, s.height * k) }
}
const machH = k => ({ sprinkler: 12, qsprinkler: 13, beehive: 22, jar: 20, press: 26, mill: 16, loom: 26, kiln: 22, furnace: 26, smoker: 26 })[k] || 20;

function drawWorkbench(g, cx, by, t) {
  const P = (c, a, b, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(cx + a), Math.round(by + b), w, h) };
  // legs and lower shelf
  for (const a of [-10, 7]) { P(INK, a, -12, 4, 12); P(WD[1], a + 1, -12, 2, 11); P(WD[2], a + 1, -12, 1, 11) }
  P(INK, -9, -6, 18, 3); P(WD[0], -8, -5, 16, 1); P(WD[1], -8, -6, 16, 1);
  P('#c8c0b0', -6, -8, 4, 2); P('#9a9286', -6, -7, 4, 1); P(WD[2], 1, -9, 5, 3); P(WD[0], 1, -7, 5, 1);   // a stone and an offcut on the shelf
  // top
  P(INK, -12, -17, 24, 6); P(WD[2], -11, -16, 22, 2); P(WD[1], -11, -14, 22, 2); P(WD[3], -11, -16, 22, 1); for (const a of [-5, 2, 8]) P(WD[0], a, -16, 1, 2);
  // vise on the left end
  P(INK, -14, -16, 4, 5); P(FE[1], -13, -15, 2, 3); P(FE[3], -13, -15, 1, 1); P(INK, -15, -14, 2, 1);
  // saw lying on top
  P(INK, -9, -20, 10, 4); P(FE[2], -8, -19, 8, 2); P(FE[3], -8, -19, 8, 1); for (let k = 0; k < 4; k++) P(FE[1], -8 + k * 2, -17, 1, 1); P(INK, 0, -21, 4, 5); P(WD[1], 1, -20, 2, 3);
  // hammer
  P(INK, 4, -19, 7, 2); P(WD[2], 5, -19, 5, 1); P(INK, 9, -22, 3, 6); P(FE[1], 10, -21, 1, 4); P(FE[3], 10, -21, 1, 1);
  // shavings
  P(WD[3], -6, -1, 2, 1); P(WD[3], 4, 0, 1, 1); P(WD[2], 9, -1, 2, 1);
}

function drawMach(g, k, cx, by, t, o) {
  const P = (c, a, b, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(cx + a), Math.round(by + b), w, h) };
  const work = o && machWorking(o), round = (y0, h, wmax, col, dome) => { for (let i = 0; i < h; i++) { const f = i / (h - 1), w = Math.max(1, Math.round(wmax * (dome ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, f * 1.15), 2))) : Math.sqrt(Math.max(0, 1 - Math.pow(1 - f * 2, 2)) * .85 + .15)))); P(INK, -w - 1, y0 + i, w * 2 + 2, 1); P(typeof col === 'function' ? col(i) : col, -w, y0 + i, w * 2, 1) } };
  const smoke = (sx, sy) => { for (let i = 0; i < 4; i++) { const f = (t * .7 + i / 4) % 1; g.fillStyle = `rgba(220,220,225,${.55 * (1 - f)})`; const r = 1 + f * 3; g.beginPath(); g.arc(cx + sx + Math.sin(t * 2 + i) * 2 * f, by + sy - f * 16, r, 0, 7); g.fill() } };
  switch (k) {
    case 'sprinkler': case 'qsprinkler': {
      const q = k === 'qsprinkler', A = q ? FE : [CU[0], CU[0], CU[1], CU[2]], B = q ? AU : CU;
      P(INK, -5, -4, 10, 4); P(A[2], -4, -3, 8, 2); P(A[3], -4, -3, 8, 1);
      P(INK, -2, -10, 4, 7); P(B[1], -1, -9, 2, 6); P(B[2], -1, -9, 1, 6);
      P(INK, q ? -5 : -4, -13, q ? 10 : 8, 4); P(B[1], q ? -4 : -3, -12, q ? 8 : 6, 2); P(B[2], q ? -4 : -3, -12, q ? 8 : 6, 1);
      for (const a of q ? [-4, -1, 2] : [-3, 2]) P('#3aa0e8', a + (q ? 0 : 0), -11, 1, 1);
      if (o && World.cur === 'farm' && state.time < 420) for (let i = 0; i < 10; i++) { const a = i / 10 * 7 + t * 4, f = (t * 1.5 + i * .37) % 1, r = 3 + f * (q ? 18 : 13); P(`rgba(150,210,255,${.9 - f * .7})`, Math.cos(a) * r, -11 + Math.sin(a) * r * .45 - Math.sin(f * 3.1) * 6, 1, 1) }
      break;
    }
    case 'beehive': {
      for (const a of [-7, 5]) { P(INK, a, -6, 3, 6); P(WD[1], a + 1, -6, 1, 5) } P(INK, -9, -8, 18, 3); P(WD[2], -8, -7, 16, 1);
      round(-21, 14, 7, i => i % 3 === 2 ? '#a8742a' : i % 3 === 0 ? '#e8b85a' : '#d9a24a', 1);
      P(INK, -2, -10, 4, 2); P(INK, -1, -23, 2, 2); P('#a8742a', -1, -22, 2, 1);
      if (o && state.season !== 3) for (let i = 0; i < 3; i++) { const a = t * (2 + i * .6) + i * 2.1, x = Math.cos(a) * (6 + i * 2), y = -14 + Math.sin(a * 1.3) * 5; P(INK, x, y, 1, 1); P('#ffd040', x + 1, y, 1, 1) }
      if (o && machReady(o)) { P('#f0b020', 4, -12, 2, 3); P('#ffd860', 4, -12, 1, 1) }
      break;
    }
    case 'jar': {
      round(-19, 18, 7, i => i < 3 ? CLAY[1] : i > 13 ? CLAY[0] : CLAY[1]); for (let i = 3; i < 14; i++) P(CLAY[2], -5 + (i > 8 ? 1 : 0), -19 + i, 2, 1);
      P(INK, -5, -21, 10, 4); P('#f0e0c0', -4, -20, 8, 2); P('#d0b890', -4, -19, 8, 1); P('#8a5a2a', -5, -18, 10, 1);
      P('#e8d8a8', -3, -12, 6, 5); P(INK, -3, -12, 6, 1); P('#c09048', -2, -10, 4, 2);
      if (work && Math.sin(t * 2) > .7) P('#ffffff', 2, -16, 1, 1); break;
    }
    case 'press': {
      for (const a of [-9, 7]) { P(INK, a, -26, 3, 26); P(WD[1], a + 1, -25, 1, 24) } P(INK, -9, -27, 19, 4); P(WD[2], -8, -26, 17, 2);
      P(INK, -1, -24, 3, 10); P(FE[2], 0, -23, 1, 9); for (let i = 0; i < 4; i++) P(FE[0], 0, -22 + i * 2 + Math.floor(work ? t * 2 % 2 : 0), 1, 1);
      P(INK, -6, -15, 13, 3); P(WD[2], -5, -14, 11, 1);
      P(INK, -7, -12, 15, 12); P(WD[1], -6, -11, 13, 10); for (const a of [-4, -1, 2, 5]) P(WD[0], a, -11, 1, 10); P(FE[1], -6, -9, 13, 1); P(FE[1], -6, -3, 13, 1);
      P(INK, 7, -6, 4, 2); P(WD[2], 8, -6, 2, 1);
      if (work) { const f = (t * 1.5) % 1; P('#b8406a', 10, -4 + f * 4, 1, 2) }
      break;
    }
    case 'mill': {
      P(INK, -8, -5, 16, 5); P(ST[1], -7, -4, 14, 3); P(ST[2], -7, -4, 14, 1);
      P(INK, -7, -10, 14, 6); P(ST[2], -6, -9, 12, 4); P(ST[3], -6, -9, 12, 1); P(ST[0], -6, -6, 12, 1);
      P(INK, -2, -10, 4, 2); P(ST[0], -1, -10, 2, 1);
      const a = work ? t * 4 : .6, hx = Math.cos(a) * 5, hy = Math.sin(a) * 2; P(INK, hx - 1, -17 + hy, 3, 9); P(WD[2], hx, -16 + hy, 1, 7);
      if (work) for (let i = 0; i < 3; i++) P('#f4ecd8', -9 + i * 9 + Math.sin(t * 5 + i) * 1, -2, 1, 1);
      break;
    }
    case 'loom': {
      for (const a of [-9, 7]) { P(INK, a, -26, 3, 26); P(WD[1], a + 1, -25, 1, 24); P(WD[2], a + 1, -25, 1, 1) }
      P(INK, -9, -26, 19, 3); P(WD[2], -8, -25, 17, 1); P(INK, -9, -6, 19, 3); P(WD[2], -8, -5, 17, 1);
      for (let a = -6; a <= 6; a += 2) P('#f4efe2', a, -23, 1, 10);
      P('#e8e0cc', -6, -13, 13, 7); for (let i = 0; i < 3; i++) P('#d6ccb6', -6, -12 + i * 2, 13, 1); P('#5a8ad0', -6, -8, 13, 1);
      const sx = work ? Math.round(Math.sin(t * 2.5) * 6) : -4; P(INK, sx - 2, -15, 5, 3); P(WD[2], sx - 1, -14, 3, 1);
      break;
    }
    case 'kiln': {
      round(-22, 22, 8, i => i < 4 ? CLAY[2] : i > 17 ? CLAY[0] : CLAY[1], 1); for (let i = 4; i < 18; i += 4) P(CLAY[0], -6, -22 + i, 12, 1);
      P(INK, -4, -9, 8, 9); P(work ? '#ff8a30' : '#3a2018', -3, -8, 6, 8); P(work ? '#ffd860' : '#2a1610', -2, -5, 4, 5); P(INK, -2, -24, 4, 3);
      if (work) smoke(0, -24); break;
    }
    case 'furnace': {
      P(INK, -8, -20, 16, 20); P(ST[1], -7, -19, 14, 18); for (const [yy, off] of [[-19, 0], [-15, 3], [-11, 0], [-7, 3], [-3, 0]]) { P(ST[3], -7, yy, 14, 1); for (let xx = -6 + off; xx < 7; xx += 6) P(ST[0], xx, yy + 1, 1, 3) }
      P(INK, 2, -27, 5, 8); P(ST[0], 3, -26, 3, 7); P(INK, -5, -11, 10, 8); P(work ? '#ff7a20' : '#2a1610', -4, -10, 8, 6); P(work ? '#ffd860' : '#3a2018', -3, -7, 6, 3);
      for (let a = -4; a < 5; a += 2) P(FE[0], a, -10, 1, 6);
      if (work) smoke(4, -27); break;
    }
    case 'smoker': {
      P(INK, -8, -16, 16, 16); P(WD[1], -7, -15, 14, 15); for (const a of [-4, 0, 4]) P(WD[0], a, -15, 1, 15);
      for (let i = 0; i < 7; i++) { P(INK, -10 + i, -17 - i, 20 - i * 2, 2); P('#9a3a2a', -9 + i, -17 - i, 18 - i * 2, 1) }
      P(INK, 3, -27, 4, 9); P(ST[1], 4, -26, 2, 8); P(INK, -3, -9, 6, 9); P(WD[0], -2, -8, 4, 8); P(AU[1], 1, -5, 1, 1);
      if (work) smoke(5, -27); break;
    }
  }
}
// crafted decorations (called from drawDecor)
function drawCraftDecor(g, k, cx, by, t) {
  const P = (c, a, b, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(cx + a), Math.round(by + b), w, h) };
  const spr = (s, dy = 0) => g.drawImage(s, Math.round(cx - s.width / 2), Math.round(by - s.height + dy));
  switch (k) {
    case 'torch': spr(AT.torch[0], 0); if (AT.fire) { const f = AT.fire[Math.floor(t * 9 + cx) % AT.fire.length]; g.drawImage(f, Math.round(cx - f.width / 2), Math.round(by - 22 - f.height + 6)) } break;
    case 'campfire': spr(AT.campfire[0], 0); if (AT.fire) { const f = AT.fire[Math.floor(t * 9) % AT.fire.length]; g.drawImage(f, Math.round(cx - f.width / 2), Math.round(by - f.height - 5)) } break;
    case 'barrel': spr(AT.barrel[0], 0); break;
    case 'sign': spr(SIGN, 0); break;
    case 'bench': {   // a garden bench: slatted back, plank seat, armrests — and you can sit on it
      const sit = typeof player !== 'undefined' && player && player.sit && cx === player.sit.x * 16 + 8 && by === player.sit.y * 16 + 15;
      for (const a of [-11, 9]) { P(INK, a, -20, 3, 14); P(WD[0], a + 1, -19, 1, 13) }                              // back posts
      P(INK, -12, -21, 24, 4); P(WD[2], -11, -20, 22, 1); P(WD[1], -11, -19, 22, 1);                                // top rail
      for (const a of [-7, -3, 1, 5]) { P(INK, a - 1, -17, 4, 8); P(WD[1], a, -17, 2, 7); P(WD[2], a, -17, 1, 7) } // back slats
      P(INK, -12, -11, 24, 3); P(WD[1], -11, -10, 22, 1);                                                             // lower back rail
      P(INK, -13, -9, 26, 5); P(WD[3], -12, -8, 24, 1); P(WD[2], -12, -7, 24, 2); for (const a of [-6, 0, 6]) P(WD[1], a, -8, 1, 3);   // seat planks
      if (sit) drawChar(g, look, 'idle_s', 0, cx, by - 4, false, true);
      P(INK, -13, -5, 26, 3); P(WD[1], -12, -4, 24, 1);                                                              // seat front edge
      for (const a of [-12, 9]) { P(INK, a, -3, 4, 3); P(WD[0], a + 1, -3, 2, 3) }                                    // front legs
      for (const a of [-14, 11]) { P(INK, a, -14, 4, 10); P(WD[1], a + 1, -13, 2, 8); P(INK, a - 1, -15, 6, 3); P(WD[2], a, -14, 4, 1) }   // armrests
      if (sit && Math.sin(GT * 1.4) > .6) { g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '700 6px Nunito, sans-serif'; g.fillText('z', cx + 7, by - 26 - (GT * 6 % 4)) }
      break;
    }
    case 'table':
      for (const a of [-13, 10]) { P(INK, a, -7, 5, 7); P(WD[0], a + 1, -6, 3, 6); P(INK, a - 1, -9, 7, 3); P(WD[2], a, -8, 5, 1) }   // stools
      for (const a of [-7, 5]) { P(INK, a, -10, 3, 10); P(WD[1], a + 1, -10, 1, 9) }
      P(INK, -9, -15, 18, 6); P(WD[2], -8, -14, 16, 2); P(WD[1], -8, -12, 16, 2); P(WD[3], -8, -14, 16, 1);
      P(INK, -4, -18, 8, 4); P('#e8e0cc', -3, -17, 6, 2); P('#d94a3a', -2, -19, 2, 2); P('#8ac04a', 0, -19, 2, 2); P('#e8b040', 1, -18, 1, 1); break;
    case 'flowerpot':
      for (const [x, y, c] of [[-4, -16, '#e04a6a'], [0, -19, '#f0d040'], [3, -15, '#9a60e0'], [-1, -14, '#ffffff']]) { P('#3f8a3a', x, y + 2, 1, 6); P(c, x - 1, y, 3, 2); P(c, x, y - 1, 1, 1); P('#fff4', x, y, 1, 1) }
      P('#5aa84a', -5, -10, 3, 2); P('#5aa84a', 2, -10, 3, 2);
      P(INK, -6, -9, 12, 3); P(CLAY[2], -5, -8, 10, 1); P(INK, -5, -7, 10, 7); P(CLAY[1], -4, -6, 8, 6); P(CLAY[2], -4, -6, 2, 5); P(CLAY[0], -4, -1, 8, 1); break;
    case 'haybale':
      P(INK, -9, -12, 18, 12); P('#e0b850', -8, -11, 16, 10); P('#f4d878', -8, -11, 16, 2); for (let a = -7; a < 8; a += 3) P('#b88a30', a, -8, 1, 6);
      for (const a of [-4, 3]) P('#7a4a20', a, -11, 1, 10); P('#f4d878', -9, -6, 1, 1); P('#f4d878', 9, -9, 1, 2); P('#f4d878', 2, -13, 1, 1); break;
    case 'scarecrow': {
      P(INK, -1, -30, 3, 30); P(WD[1], 0, -29, 1, 29);
      P(INK, -10, -22, 21, 3); P(WD[1], -9, -21, 19, 1);
      for (const s of [-1, 1]) { P('#e0c060', s * 10, -22, 1, 3); P('#e0c060', s * 11, -21, 1, 2) }
      P(INK, -5, -21, 11, 13); P('#9a6a3a', -4, -20, 9, 11); P('#b88850', -4, -20, 3, 11); P('#6a8ac0', -4, -14, 9, 1); P('#e0c060', -3, -9, 1, 2); P('#e0c060', 1, -9, 1, 2);
      P(INK, -4, -29, 9, 8); P('#d8b878', -3, -28, 7, 6); P(INK, -2, -26, 1, 1); P(INK, 2, -26, 1, 1); P('#9a3a2a', -1, -24, 3, 1);
      P(INK, -7, -30, 15, 2); P('#e0c060', -6, -30, 13, 1); P(INK, -3, -34, 7, 4); P('#e0c060', -2, -33, 5, 3); P('#c04a3a', -2, -31, 5, 1); break;
    }
    case 'jars':
      for (const [a, h] of [[-8, 14], [-1, 18], [6, 12]]) { const top = -h; P(INK, a - 3, top, 7, h); P(ST[2], a - 2, top + 2, 5, h - 3); P(ST[3], a - 2, top + 2, 1, h - 4); P(ST[0], a - 2, -2, 5, 1);
        P(INK, a - 2, top - 2, 5, 3); P(ST[3], a - 1, top - 1, 3, 1); P('#3f7fb0', a - 1, top, 3, 1) } break;
    case 'manger':
      for (const a of [-9, 7]) { P(INK, a - 1, -10, 2, 10); P(INK, a + 1, -10, 2, 10); P(WD[0], a, -9, 1, 9); P(WD[0], a + 1, -9, 1, 9) }
      P(INK, -10, -14, 20, 8); P(WD[1], -9, -13, 18, 6); P(WD[2], -9, -13, 18, 1); for (const a of [-5, 0, 5]) P(WD[0], a, -12, 1, 5);
      for (let i = 0; i < 14; i++) { const a = -8 + i * 1.2, h = 2 + Math.floor(hash(i, 3) * 3); P(i % 2 ? '#e0b850' : '#f4d878', a, -14 - h, 1, h) } break;
    case 'birdbath': {
      P(INK, -4, -3, 8, 3); P(ST[1], -3, -2, 6, 1); P(INK, -2, -11, 4, 9); P(ST[2], -1, -10, 2, 8);
      P(INK, -9, -15, 18, 5); P(ST[2], -8, -14, 16, 3); P(ST[3], -8, -14, 16, 1); P('#5aa0d8', -7, -14, 14, 1); P('#bfe6ff', -5, -14, 3, 1);
      if (Math.sin(t * .4 + cx) > -.2) { const hop = Math.sin(t * 6) > .8 ? -1 : 0; P(INK, 3, -19 + hop, 5, 4); P('#9a7a5a', 4, -18 + hop, 3, 2); P('#e8d8c0', 4, -17 + hop, 2, 1); P(INK, 7, -18 + hop, 1, 1); P('#e8a030', 8, -17 + hop, 1, 1) }
      break;
    }
    case 'dovecote': {
      P(INK, -1, -24, 3, 24); P(WD[1], 0, -23, 1, 23);
      P(INK, -7, -32, 14, 10); P('#f0e8d8', -6, -31, 12, 8); P(WD[1], -6, -24, 12, 1); for (const a of [-4, 2]) { P(INK, a, -29, 2, 3) }
      for (let i = 0; i < 5; i++) { P(INK, -8 + i, -33 - i, 16 - i * 2, 2); P('#9a3a2a', -7 + i, -33 - i, 14 - i * 2, 1) }
      for (let i = 0; i < 2; i++) { const a = t * 1.3 + i * 3.1, x = Math.cos(a) * 11, y = -34 + Math.sin(a * 2) * 4, fl = Math.sin(t * 14 + i) > 0; P('#ffffff', x - 1, y, 3, 1); P('#ffffff', x + (fl ? -1 : 1), y - 1, 1, 1); P('#c8c8d0', x - 1, y + 1, 2, 1) }
      P('#ffffff', 3, -34, 3, 2); P(INK, 5, -34, 1, 1); break;
    }
    case 'cross':
      P(INK, -2, -30, 4, 30); P(WD[1], -1, -29, 2, 29); P(WD[2], -1, -29, 1, 29);
      P(INK, -9, -24, 18, 4); P(WD[1], -8, -23, 16, 2); P(WD[2], -8, -23, 16, 1);
      P('#f4f0e6', -4, -20, 2, 9); P('#f4f0e6', 2, -20, 2, 7); P('#f4f0e6', -2, -20, 4, 2); P('#d8d2c4', 2, -14, 2, 1); P('#d8d2c4', -4, -12, 2, 1);
      P(INK, -4, -2, 8, 2); P(ST[1], -3, -2, 6, 1); break;
    default: drawCaveDecor(g, k, cx, by, t);
  }
}

// ================= icons =================
function craftIcons() {
  const mk = (k, f, w = 16, h = 16) => { const c = mkc(w, h), g = c.getContext('2d'), R = (col, x, y, ww = 1, hh = 1) => { g.fillStyle = col; g.fillRect(x, y, ww, hh) }; f(R, g); AT[k] = [c] };
  const bowl = (R, soup, top) => { R(INK, 1, 7, 14, 3); R(INK, 2, 10, 12, 3); R(INK, 4, 13, 8, 1); R('#c47a3e', 2, 8, 12, 4); R('#e09a5a', 3, 8, 10, 1); R('#a85a2a', 4, 11, 8, 2); R(soup, 3, 7, 10, 1); top && top() };
  const sack = (R, c1, c2) => { R(INK, 3, 4, 10, 11); R(INK, 2, 6, 12, 8); R(c1, 3, 6, 10, 7); R(c1, 4, 5, 8, 9); R(c2, 4, 12, 8, 2); R(INK, 6, 2, 4, 3); R(c2, 7, 3, 2, 1); R(c1, 5, 1, 1, 2); R(c1, 10, 1, 1, 2) };
  mk('ic_flour', R => { sack(R, '#f0e6d0', '#d0c3a8'); R('#ffffff', 5, 7, 2, 1); R('#c8a070', 6, 9, 4, 1) });
  mk('ic_honey', R => { R(INK, 3, 5, 10, 10); R(INK, 4, 4, 8, 12); R('#e8a020', 4, 6, 8, 8); R('#ffd060', 5, 7, 2, 4); R('#c07810', 4, 12, 8, 2); R(INK, 3, 1, 10, 4); R('#f0e0c0', 4, 2, 8, 2); R('#a06a3a', 4, 4, 8, 1); R('#ffd060', 10, 5, 1, 2) });
  mk('ic_linen', R => { R(INK, 1, 5, 14, 10); R('#f4efe2', 2, 6, 12, 3); R('#d6ccb6', 2, 9, 12, 1); R('#f4efe2', 2, 10, 12, 3); R('#d6ccb6', 2, 13, 12, 1); R('#5a8ad0', 2, 7, 12, 1); R('#5a8ad0', 2, 11, 12, 1) });
  mk('ic_fert1', R => { sack(R, '#9a6a3e', '#7a5030'); R('#5aa83a', 6, 7, 3, 3); R('#8ad05a', 6, 7, 1, 1); R('#3f8a3a', 8, 10, 1, 2) });
  mk('ic_fert2', R => { sack(R, '#4a5a3a', '#34422a'); R('#7fd0a0', 5, 7, 2, 2); R('#7fd0a0', 9, 9, 1, 1); R('#ffe080', 8, 6, 1, 1); R('#ffe080', 6, 11, 1, 1) });
  // backpacks sold at the market: a leather satchel, a bigger satchel, a traveler's pack, a merchant's pack
  const bag = (R, body, dark, light, strap, big) => {
    R(INK, 4, 1, 8, 3); R(strap, 5, 2, 6, 1);                                   // handle
    R(INK, 1, 4, 14, 12); R(body, 2, 5, 12, 10); R(light, 2, 5, 12, 1); R(dark, 2, 14, 12, 1);
    R(INK, 2, 7, 12, 1); R(dark, 2, 8, 12, 1); R(INK, 7, 7, 2, 4); R(AU[1], 7, 8, 2, 2);   // flap and gold clasp
    if (big) { R(INK, 1, 10, 3, 5); R(dark, 2, 11, 1, 3); R(INK, 12, 10, 3, 5); R(dark, 13, 11, 1, 3) }   // side pockets
  };
  mk('ic_bag1', R => bag(R, '#b86f50', '#733e39', '#e4a672', '#733e39', 0));
  mk('ic_bag2', R => { bag(R, '#4a7ab8', '#2c4a7a', '#8ab0e0', '#733e39', 1) });
  mk('ic_bag3', R => { bag(R, '#8a3a6a', '#5a1a44', '#c87aa8', '#b07a16', 1); R(AU[1], 2, 12, 12, 1) });
  mk('ic_ropeladder', R => { for (const x of [3, 11]) { R(INK, x, 0, 3, 16); R('#d8b070', x + 1, 0, 1, 16) } for (let y = 2; y < 16; y += 4) { R(INK, 4, y, 9, 3); R('#b8864a', 5, y + 1, 7, 1) } });
  mk('ic_barley_loaf', R => { R(INK, 2, 6, 12, 8); R(INK, 3, 5, 10, 10); R('#c08a48', 3, 6, 10, 7); R('#dca868', 4, 6, 8, 2); R('#9a6a30', 3, 12, 10, 1); R('#f0d098', 5, 7, 1, 1); for (const x of [5, 8, 11]) R('#9a6a30', x, 9, 1, 2) });
  mk('ic_veg_roast', R => { R(INK, 0, 9, 16, 5); R('#e8e0cc', 1, 10, 14, 3); R('#c8c0ac', 2, 12, 12, 1); R(INK, 3, 6, 7, 4); R('#f08a30', 4, 7, 5, 2); R('#3f8a3a', 2, 6, 2, 2); R(INK, 9, 6, 5, 5); R('#e8d8a8', 10, 7, 3, 3); R('#b89868', 11, 8, 1, 1); R('#5a3a20', 6, 8, 1, 1) });
  mk('ic_gstew', R => bowl(R, '#8ab84a', () => { R('#4a8a2a', 5, 7, 2, 1); R('#f0f0d0', 9, 7, 2, 1); R('rgba(255,255,255,.6)', 6, 3, 1, 3); R('rgba(255,255,255,.6)', 9, 2, 1, 3) }));
  mk('ic_fish_stew', R => bowl(R, '#d8a050', () => { R('#a8b8c8', 5, 7, 4, 1); R(INK, 10, 4, 3, 4); R('#a8b8c8', 11, 5, 1, 2); R('#e04a3a', 4, 7, 1, 1); R('rgba(255,255,255,.6)', 7, 2, 1, 3) }));
  mk('ic_cabsoup', R => bowl(R, '#c8e0a0', () => { R('#7ab84a', 5, 7, 3, 1); R('#e0f0c0', 9, 7, 2, 1); R('rgba(255,255,255,.6)', 6, 3, 1, 3) }));
  mk('ic_salad', R => bowl(R, '#f07a7a', () => { R(INK, 4, 4, 9, 4); R('#f07a7a', 5, 5, 3, 2); R('#8ad05a', 8, 5, 4, 2); R('#3f8a3a', 7, 4, 2, 1); R('#ffd0d0', 5, 5, 1, 1) }));
  mk('ic_grilled', R => { R(INK, 0, 12, 16, 3); R('#3a2a2a', 1, 13, 14, 1); for (const x of [2, 6, 10, 13]) R('#ff7a20', x, 13, 2, 1); R(INK, 2, 5, 12, 6); R('#c88a50', 3, 6, 10, 4); R('#e8b070', 4, 6, 7, 1); R('#7a4a20', 5, 7, 1, 2); R('#7a4a20', 8, 7, 1, 2); R(INK, 12, 4, 3, 8); R('#c88a50', 13, 5, 1, 6); R(INK, 4, 7, 1, 1); R('rgba(255,255,255,.55)', 7, 1, 1, 3) });
  mk('ic_honeycake', R => { R(INK, 1, 6, 14, 9); R('#d8a050', 2, 9, 12, 5); R('#b07a30', 2, 13, 12, 1); R('#f0c050', 2, 7, 12, 2); R('#ffe090', 3, 7, 6, 1); R('#f0c050', 4, 9, 1, 2); R('#f0c050', 10, 9, 1, 3); R('#ffffff', 7, 5, 2, 2) });
  mk('ic_loaves', R => { R(INK, 1, 8, 14, 7); R('#b8864a', 2, 9, 12, 5); for (let x = 2; x < 14; x += 2) R('#8a5a2a', x, 10, 1, 4); R(INK, 2, 3, 6, 6); R('#d9963e', 3, 4, 4, 4); R('#f0bd6a', 3, 4, 3, 1); R(INK, 7, 4, 7, 4); R('#a8b8c8', 8, 5, 4, 2); R('#d8e4f0', 8, 5, 2, 1); R(INK, 13, 3, 2, 2); R(INK, 9, 5, 1, 1) });
  mk('ic_fence_wood', R => { for (const yy of [5, 10]) { R(INK, 0, yy - 1, 16, 3); R(WD[1], 0, yy, 16, 1) } for (const x of [2, 11]) { R(INK, x, 1, 4, 15); R(WD[1], x + 1, 2, 2, 13); R(WD[2], x + 1, 2, 1, 13); R(WD[3], x + 1, 2, 2, 1) } });
  mk('ic_fence_stone', R => { R(INK, 0, 4, 16, 12); R(ST[1], 1, 5, 14, 10); for (const [yy, off] of [[5, 0], [9, 3], [13, 0]]) { R(ST[3], 1, yy, 14, 1); for (let xx = 3 + off; xx < 15; xx += 6) R(ST[0], xx, yy + 1, 1, 3) } R(INK, 0, 3, 16, 2); R(ST[2], 1, 3, 14, 1) });
  mk('ic_gate', R => { const P = (c, a, b, w = 1, h = 1) => R(c, a + 8, b + 15, w, h); drawGate(P, false, false, 0) });
  for (const k in PATHS) mk('ic_path_' + k, (R, g) => { pathTile(g, k, 0, 0, 3, 5); g.strokeStyle = 'rgba(50,30,15,.6)'; g.strokeRect(.5, .5, 15, 15) });
  // machines and crafted decorations: drawn with the real art, then trimmed
  const big = (key, f) => { const c = mkc(40, 48), g = c.getContext('2d'); f(g); AT[key] = [trimCanvas(c)] };
  for (const k in MACH) big('mach_' + k, g => drawMach(g, k, 20, 47, 0, null));
  big('ic_workbench', g => drawWorkbench(g, 20, 47, 0));
  big('ic_cavetorch', g => drawCaveTorch(g, 1, 1.6, .1));
  for (const k in CDECOR) big('decor_' + k, g => drawCraftDecor(g, k, 20, 47, 0));
  // preserves jars, juice and smoked fish: one icon per crop or fish
  const avg = s => { const d = s.getContext ? s.getContext('2d').getImageData(0, 0, s.width, s.height).data : null; if (!d) return '#c04a6a'; let r = 0, gg = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] + d[i + 1] + d[i + 2] > 120) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++ } return n ? `rgb(${r / n | 0},${gg / n | 0},${b / n | 0})` : '#c04a6a' };
  const flat = s => { const c = mkc(s.width, s.height); c.getContext('2d').drawImage(s, 0, 0); return c };
  for (const k in CROPS) {
    const src = AT['item_' + k] && AT['item_' + k][0], col = src ? avg(flat(src)) : '#c04a6a';
    mk('jar_' + k, (R, g) => { R(INK, 3, 3, 10, 13); R(INK, 2, 6, 12, 9); R('#d8e8e0', 3, 6, 10, 8); R(col, 3, 9, 10, 5); R('#ffffff', 4, 7, 1, 3); R(INK, 4, 1, 8, 3); R('#a06a3a', 5, 2, 6, 1); R('#e8d8a8', 5, 9, 6, 3); if (src) g.drawImage(src, 0, 0, src.width, src.height, 5, 8, 6, 6) });
    mk('juice_' + k, R => { R(INK, 4, 1, 8, 15); R(INK, 3, 6, 10, 9); R('#c87a4a', 4, 7, 8, 7); R('#e8a070', 5, 7, 2, 5); R('#9a5a30', 4, 13, 8, 1); R(INK, 6, 0, 4, 3); R(col, 6, 1, 4, 2); R(col, 5, 9, 6, 3); R('#ffffff88', 6, 9, 1, 1); R(INK, 12, 7, 3, 1); R(INK, 14, 7, 1, 5); R(INK, 12, 11, 3, 1) });
  }
  for (const k in FISH) if (!FISH[k].junk && AT['fish_' + k]) mk('smoked_' + k, (R, g) => {
    const s = AT['fish_' + k][0], sc = Math.min(1, 14 / Math.max(s.width, s.height)); g.drawImage(s, Math.round(8 - s.width * sc / 2), Math.round(9 - s.height * sc / 2), s.width * sc, s.height * sc);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(110,55,20,.55)'; g.fillRect(0, 0, 16, 16); g.globalCompositeOperation = 'source-over';
    R('rgba(230,230,235,.8)', 3, 1, 1, 2); R('rgba(230,230,235,.8)', 4, 0, 1, 1); R('rgba(230,230,235,.7)', 11, 2, 1, 2);
  });
}

// ---------- sitting on a garden bench ----------
function sitOn(r) {
  player.sit = { x: r.x, y: r.y }; player.act = null; player.moving = false; player.dir = 's'; player.x = r.x + .5; player.y = r.y + .95; sfx.tap();
  if (!state.satOnce) { state.satOnce = 1; toast('You sit down to rest and get a little energy back. Move to stand up.') }
}
function standUp() {
  const s = player.sit; if (!s) return; player.sit = null;
  for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const x = s.x + dx, y = s.y + dy; if (inb(x, y) && !World.solid(x, y) && World.ground[idx(x, y)] !== WATER) { player.x = x + .5; player.y = y + .55; player.dir = dy > 0 ? 's' : dy < 0 ? 'n' : dx > 0 ? 'r' : 'l'; return } }
}
function sitTick(dt, mx, my) {
  const s = player.sit, o = World.get(s.x, s.y); player.moving = false;
  if (World.cur !== 'farm' || !o || o.t !== 'decor' || o.k !== 'bench') { player.sit = null; return }
  if (mx || my) { standUp(); return }
  state.energy = Math.min(state.maxE, state.energy + dt * 1.5);
}

// ---------- picking up what you've placed by swinging a pickaxe, axe or hoe at it ----------
const MOVABLE = { decor: o => 'decor_' + o.k, mach: o => 'm_' + o.k, chest2: () => 'chest', fwell: () => 'farmwell', fence: () => 'fence_wood', sfence: () => 'fence_stone', gate: () => 'gate', bench: () => 'workbench' };
let toolAim = null;
// which tool wins over tapping: pickaxe, axe or hoe on something you placed (but open full chests and busy machines; the workbench needs the pickaxe)
function toolWins(it) {
  const s = selItem(), tl = s && ITEMS[s.id].tool, o = it.o;
  if (!['pick', 'axe', 'hoe'].includes(tl) || World.cur !== 'farm' || !MOVABLE[o.t] || o.t === 'mach') return false;   // machines: tap and choose “Pick it up”
  if (o.t === 'chest2' && o.items.some(Boolean)) return false; if (o.t === 'mach' && o.out) return false; if (o.t === 'bench' && tl !== 'pick') return false;
  return true;
}
function toolPickUp() {
  if (World.cur !== 'farm') return false; const [x, y] = toolAim ? [toolAim.x, toolAim.y] : facingCell(), o = World.get(x, y); toolAim = null; if (!o || !MOVABLE[o.t]) return false;
  if (o.t === 'mach' || (o.t === 'bench' && !(selItem() && ITEMS[selItem().id].tool === 'pick'))) return false;
  if (o.t === 'mach' && o.out) { toast(machReady(o) ? 'Take out what’s inside first.' : 'It’s still working. Let it finish first.'); sfx.no(); return true }
  if (o.t === 'chest2' && o.items.some(Boolean)) { toast('Empty the chest first.'); sfx.no(); return true }
  if (player.sit && player.sit.x === x && player.sit.y === y) return true;
  World.place(x, y, null); drop(MOVABLE[o.t](o), 1, x + .5, y + .5);
  sfx.chop(); chips(x + .5, y + .6, o.t === 'sfence' || o.t === 'fwell' ? '#b4ac9f' : '#b86f50', 7); save(); return true;
}
