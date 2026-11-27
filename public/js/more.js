// More to buy and make: new seasonal seeds, Miriam's seasonal specials, Peter's fish trap, Joseph's grape
// arbor, Jesse's miner's lantern, and new workbench recipes (seed maker, oil lamp, potted olive tree, homing
// dove). Shop items that aren't unlocked yet show greyed out with a hint saying how to unlock them.
'use strict';

// ---------- unlocking (same rules as workbench recipes) ----------
const unl = u => !u || isUnlocked({ un: u });
const lockRow = (icon, name, u, extra = '') => `<div class="shoprow slock"><img class="bimg" src="${iconURL(icon)}"><div class="si"><b>${name}</b><div class="muted">${extra}${unlockHint(u)}</div></div><div class="sb"><span class="lk"></span></div></div>`;

// ---------- new crops (Tobiah sells their seeds in season, once unlocked) ----------
Object.assign(CROPS, {
  cucumber: { n: 'Cucumbers', sn: 'Cucumber', days: 5, seed: 30, sell: 62, seasons: [1], un: ['day', 5] },
  lentils: { n: 'Lentils', sn: 'Lentil', days: 6, seed: 22, sell: 48, seasons: [0, 2], un: ['harvest', 25] },
  fava: { n: 'Fava Beans', sn: 'Fava Bean', days: 8, seed: 45, sell: 100, seasons: [3], un: ['heart', 'boaz', 2] },
  saffron: { n: 'Saffron', sn: 'Saffron Crocus', days: 12, seed: 120, sell: 300, seasons: [2], un: ['heart', 'ruth', 3], jn: 'Saffron Honey' },
});

// ---------- Miriam's seasonal specials (one each season) ----------
Object.assign(FOODS, {
  herbbread: { n: 'Herb Flatbread', cost: 50, e: 70, season: 0, un: ['heart', 'miriam', 1] },
  pomjuice: { n: 'Pomegranate Juice', cost: 45, e: 65, season: 1, un: ['heart', 'miriam', 1] },
  gourdsoup: { n: 'Spiced Gourd Soup', cost: 80, e: 115, season: 2, un: ['heart', 'miriam', 2] },
  datecake: { n: 'Date and Almond Cake', cost: 110, e: 160, season: 3, un: ['heart', 'miriam', 2] },
});

// ---------- new machines ----------
Object.assign(MACH, {
  seedmaker: { n: 'Seed Maker', d: 'Put in any crop. By the next day it gives you 2 or 3 of its seeds, even ones the market isn’t selling this season.', hint: 'Put in any crop.',
    proc: id => CROPS[id] && { out: 'seed_' + id, n: Math.random() < .3 ? 3 : 2, min: 1440 } },
  trap: { n: 'Fish Trap', d: 'Set it in the water of your farm pond. Every morning there’s something inside.', trap: 1 },
});
// ---------- new decorations ----------
Object.assign(CDECOR, {
  oillamp: { n: 'Oil Lamp', d: 'A clay oil lamp on a stone stand. It burns all night.', light: [52, .95] },
  olivetree: { n: 'Potted Olive Tree', d: 'A little olive tree in a big clay pot, silver-green and full of olives.' },
  arbor: { n: 'Grape Arbor', d: 'A wooden arbor covered in grapevines. “Every man under his vine.”' },
});
for (const k of ['oillamp', 'olivetree', 'arbor']) DECOR[k] = Object.assign({ craft: 1, need: {}, fee: 0 }, CDECOR[k]);

// new workbench recipes, each slotted in after the last recipe under the same heading
for (const r of [
  { id: 'm_seedmaker', cat: 'mach', n: 1, need: { wood: 25, stone: 25, bar_copper: 2 }, un: ['harvest', 60] },
  { id: 'dove', cat: 'food', sub: 'Supplies', n: 1, need: { fiber: 5, barley: 2 }, un: ['day', 8] },
  { id: 'decor_oillamp', cat: 'decor', sub: 'Lights', n: 1, need: { stone: 8, bar_copper: 1, ore_coal: 1 }, un: ['day', 10] },
  { id: 'decor_olivetree', cat: 'decor', sub: 'Furniture', n: 1, need: { wood: 10, stone: 15, fiber: 10 }, un: ['heart', 'naomi', 2] },
]) { let at = -1; RECIPES.forEach((q, i) => { if (q.cat === r.cat && (q.sub || '') === (r.sub || '')) at = i }); RECIPES.splice(at < 0 ? RECIPES.length : at + 1, 0, r) }

// Joseph's things for your farm, Peter's trap and Jesse's lantern
CARP_ITEMS.push({ id: 'decor_arbor', d: 'A wooden arbor covered in grapevines. Place it anywhere on your farm.', money: 800, wood: 40, stone: 0, un: ['heart', 'joseph', 2] });
const TRAP = { price: 1500, un: ['fish', 15] };
const LANTERN = { price: 1500, bar: 'bar_iron', n: 2, un: ['mine', 2] };

function moreItems() {
  return {
    dove: { n: 'Homing Dove', icon: 'ic_dove', home: 1, price: 10, d: 'Let it go anywhere and follow it straight home to your farm.' },
    lantern: { n: 'Miner’s Lantern', icon: 'ic_lantern', price: 0, d: 'Lights up much more of the Sinai Caverns around you.' },
  };
}

// ---------- shops: "new in stock" ----------
function shopUnlocks() {
  const L = [];
  for (const k in CROPS) if (CROPS[k].un) L.push(['seed_' + k, CROPS[k].un, 'Tobiah’s market']);
  for (const k in FOODS) if (FOODS[k].un) L.push([k, FOODS[k].un, 'Miriam’s inn']);
  for (const c of CARP_ITEMS) if (c.un) L.push([c.id, c.un, 'Joseph’s workshop']);
  L.push(['m_trap', TRAP.un, 'Peter’s tackle shop'], ['lantern', LANTERN.un, 'Jesse’s forge']);
  return L;
}
function checkShops(silent) {
  if (!state) return; const seen = state.shopSeen = state.shopSeen || {}, first = !state.shopInit; state.shopInit = 1; const got = [];
  for (const [id, u, where] of shopUnlocks()) if (!seen[id] && unl(u)) { seen[id] = 1; if (!first) got.push([id, where]) }
  if (silent || !got.length) return;
  got.slice(0, 2).forEach(([id, where], i) => setTimeout(() => { toast(`New at ${where}: ${ITEMS[id].n}!`); if (i === 0) { tone(523, .09, 'triangle', .04); tone(784, .12, 'triangle', .04, .1) } }, 1500 + i * 900));
}
setInterval(() => { if (state && !paused && mode === 'play') checkShops() }, 3000);

// ---------- the market's seed stall: this season's seeds only ----------
function marketSeedsHTML() {
  const s = state.season, inS = Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(s)).sort((p, q) => !!CROPS[p].un - !!CROPS[q].un || CROPS[p].seed - CROPS[q].seed);
  let h = `<div class="h3 csub">${SEASONS[s]} seeds</div>`;
  for (const k of inS) {
    const c = CROPS[k], id = 'seed_' + k;
    if (!unl(c.un)) { h += lockRow(id, ITEMS[id].n, c.un); continue }
    h += `<div class="shoprow"><img src="${iconURL(id)}"><div class="si"><b>${ITEMS[id].n}</b><div class="muted">${c.days} days · ${c.seasons.map(q => SEASONS[q]).join(', ')} · sells ₪ ${c.sell}</div></div><div class="sb"><span class="pr">₪ ${c.seed}</span><button class="btn alt" data-buy="${k}" data-n="1" ${state.money >= c.seed ? '' : 'disabled'}>+1</button><button class="btn" data-buy="${k}" data-n="5" ${state.money >= c.seed * 5 ? '' : 'disabled'}>+5</button></div></div>`;
  }
  const nx = (s + 1) % 4, soon = Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(nx) && !CROPS[k].seasons.includes(s));
  if (soon.length) h += `<p class="muted soon">Coming in ${SEASONS[nx]}: ${soon.map(k => unl(CROPS[k].un) ? CROPS[k].n.toLowerCase() : '???').join(', ')}.</p>`;
  return h;
}
const seedForSale = k => CROPS[k] && CROPS[k].seasons.includes(state.season) && unl(CROPS[k].un);

// ---------- Miriam's inn: everyday food plus this season's special ----------
function innHTML() {
  let h = '';
  for (const k in FOODS) { const f = FOODS[k]; if (f.season !== undefined) continue; h += foodRow(k) }
  const sp = Object.keys(FOODS).find(k => FOODS[k].season === state.season), nx = Object.keys(FOODS).find(k => FOODS[k].season === (state.season + 1) % 4);
  if (sp) { h += `<div class="h3 csub">Miriam’s ${SEASONS[state.season].toLowerCase()} special</div>`; h += unl(FOODS[sp].un) ? foodRow(sp) : lockRow('ic_' + sp, FOODS[sp].n, FOODS[sp].un) }
  if (nx) h += `<p class="muted soon">Next season: ${unl(FOODS[nx].un) ? FOODS[nx].n : 'a new special'}.</p>`;
  return h;
}
const foodRow = k => { const f = FOODS[k]; return `<div class="shoprow"><img src="${iconURL('ic_' + k)}"><div class="si"><b>${f.n}</b><div class="muted">+${f.e} energy</div></div><div class="sb"><span class="pr">₪ ${f.cost}</span><button class="btn" data-food="${k}" ${state.money >= f.cost ? '' : 'disabled'}>Buy</button></div></div>` };
const foodForSale = k => FOODS[k] && (FOODS[k].season === undefined || (FOODS[k].season === state.season && unl(FOODS[k].un)));

// ---------- Peter's fish trap ----------
function trapHTML() {
  if (!unl(TRAP.un)) return lockRow('mach_trap', 'Fish Trap', TRAP.un);
  return `<div class="shoprow"><img class="bimg" src="${iconURL('mach_trap')}"><div class="si"><b>Fish Trap</b><div class="muted">${MACH.trap.d} Pick it back up any time.</div></div><div class="sb"><span class="pr">₪ ${TRAP.price.toLocaleString()}</span><button class="btn" data-trap="1" ${state.money >= TRAP.price ? '' : 'disabled'}>Buy</button></div></div>`;
}
function buyTrap() {
  if (!unl(TRAP.un) || state.money < TRAP.price) return; if (!canTake('m_trap')) { toast('Your bag is full.'); sfx.no(); return }
  state.money -= TRAP.price; addItem('m_trap', 1); note('m_trap', 1); sfx.pick(); toast('Peter hands you a fish trap. Face the water of your farm pond to set it.'); updateHUD(); save();
}
// pond fish for the trap; now and then something else
function trapCatch() {
  const r = Math.random();
  if (r < .1) return 'shell';
  const pool = Object.keys(FISH).filter(k => !FISH[k].junk && FISH[k].where.includes('pond') && FISH[k].price < 100 && (!FISH[k].seasons || FISH[k].seasons.includes(state.season)));
  if (r < .2) { const junk = Object.keys(FISH).filter(k => FISH[k].junk); if (junk.length) return 'fish_' + junk[ri(0, junk.length - 1)] }
  let tot = pool.reduce((a, k) => a + FISH[k].w, 0), x = Math.random() * tot;
  for (const k of pool) { x -= FISH[k].w; if (x <= 0) return 'fish_' + k }
  return 'fish_carp';
}
function placeTrap(slot) {
  if (World.cur !== 'farm') { toast('Set it in the water of your farm pond.'); sfx.no(); return }
  const [x, y] = facingCell(), i = idx(x, y);
  if (!inb(x, y) || World.ground[i] !== WATER || World.objs[i]) { toast('Face the open water of your pond to set it.'); sfx.no(); return }
  World.place(x, y, { t: 'mach', k: 'trap' }); const s = state.inv[slot]; s.n--; if (s.n <= 0) state.inv[slot] = null;
  sfx.splash(); chips(x + .5, y + .6, '#bfe6ff', 8); toast('You set the fish trap. Check it in the morning.'); updateHUD(); save();
}

// ---------- Jesse's miner's lantern ----------
function lanternHTML() {
  const L = LANTERN;
  if (state.lantern) return `<div class="shoprow"><img src="${iconURL('ic_lantern')}"><div class="si"><b>Miner’s Lantern</b><div class="muted">${ITEMS.lantern.d}</div><div class="req ok">You have this ✓</div></div></div>`;
  if (!unl(L.un)) return lockRow('ic_lantern', 'Miner’s Lantern', L.un);
  const ok = state.money >= L.price && count(L.bar) >= L.n;
  return `<div class="shoprow"><img src="${iconURL('ic_lantern')}"><div class="si"><b>Miner’s Lantern</b><div class="muted">${ITEMS.lantern.d} You carry it with you; it doesn’t take a bag slot.</div><div class="req"><span class="${state.money >= L.price ? 'ok' : 'no'}">₪ ${L.price.toLocaleString()}</span> · <span class="${count(L.bar) >= L.n ? 'ok' : 'no'}">${L.n} ${ITEMS[L.bar].n.toLowerCase()}s</span></div></div><div class="sb"><button class="btn" data-lantern="1" ${ok ? '' : 'disabled'}>Buy</button></div></div>`;
}
function buyLantern() {
  const L = LANTERN; if (state.lantern || !unl(L.un) || state.money < L.price || count(L.bar) < L.n) return;
  state.money -= L.price; takeItem(L.bar, L.n); state.lantern = 1; sfx.rock(); setTimeout(() => { sfx.pick(); toast('Jesse hands you a miner’s lantern. The caves will be much brighter now.') }, 250); updateHUD(); save();
}
const mineLamp = () => state && state.lantern ? 92 : 58;

// ---------- using things: the fish trap goes in water, the homing dove takes you home ----------
const _useCraftItem = useCraftItem;
useCraftItem = function (slot) {
  const s = state.inv[slot], it = s && ITEMS[s.id];
  if (it && it.put && it.put.k === 'trap') { placeTrap(slot); return }
  if (it && it.home) {
    if (World.cur === 'farm') { toast('You’re already home on your farm.'); sfx.no(); return }
    s.n--; if (s.n <= 0) state.inv[slot] = null; updateHUD(); save(); sfx.swish(); toast('The dove flies off, and you follow it home…');
    if (World.cur === 'mine') saveSeen(); travel('farm', World.TENT.x + .5, World.TENT.y + 1.7, 's'); return;
  }
  return _useCraftItem(slot);
};
const _machineAction = machineAction;
machineAction = async function (r) {
  const o = r.o;
  if (o.k !== 'trap') return _machineAction(r);
  if (o.out) {
    if (!roomFor(o.out)) { toast('Your bag is full.'); sfx.no(); return }
    const got = o.out; addItem(got, 1); note(got, 1); sfx.splash(); setTimeout(() => sfx.pick(), 150); delete o.out; delete o.n; delete o.ready; updateHUD(); save(); return;
  }
  const v = await say('Your fish trap. Nothing inside yet. Check it again tomorrow morning.', [['Pick it up', 1], ['OK', 0]]); if (v) pickUp(r, 'm_trap');
};
const _craftNight = craftNight;
craftNight = function () {
  const n = _craftNight(), F = World.maps.farm || World;
  if (F.objs) F.objs.forEach(o => { if (o && o.t === 'mach' && o.k === 'trap' && !o.out) { o.out = trapCatch(); o.n = 1; o.ready = 0 } });
  return n;
};

// ---------- drawing ----------
const _drawMach = drawMach;
drawMach = function (g, k, cx, by, t, o) {
  if (k !== 'seedmaker' && k !== 'trap') return _drawMach(g, k, cx, by, t, o);
  const P = (c, a, b, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(cx + a), Math.round(by + b), w, h) };
  if (k === 'seedmaker') {
    const work = o && machWorking(o);
    P(INK, -8, -15, 16, 15); P(WD[1], -7, -14, 14, 13); P(WD[2], -7, -14, 14, 1); for (const a of [-3, 2]) P(WD[0], a, -13, 1, 12); P(WD[0], -7, -2, 14, 1);
    for (let i = 0; i < 7; i++) { const w = 13 - i * 1.4; P(INK, -w / 2 - 1, -22 + i, w + 2, 1); P(i < 2 ? CU[2] : CU[1], -w / 2, -22 + i, w, 1) }   // copper hopper
    P(INK, -7, -23, 14, 1); P(CU[0], -5, -17, 10, 1);
    for (const [a, c] of [[-4, '#e8c060'], [-1, '#c89040'], [2, '#e8c060']]) P(c, a, -22, 2, 1);                                             // seeds in the hopper
    P(INK, -5, -10, 10, 6); P('#f4ecd8', -4, -9, 8, 4); P('#5aa83a', -2, -9, 1, 3); P('#8ad05a', -1, -9, 2, 1); P('#8ad05a', 0, -8, 1, 1);    // leaf label
    const a = work ? t * 5 : .8, hx = Math.round(Math.cos(a) * 3), hy = Math.round(Math.sin(a) * 3);                                          // crank
    P(INK, 7, -11, 3, 3); P(FE[2], 8, -10, 1, 1); P(INK, 8 + hx, -10 + hy, 2, 2); P(WD[2], 8 + hx, -10 + hy, 1, 1);
    if (o && machReady(o)) { P('#ffffff', -1, -29, 2, 4); P('#ffffff', -1, -24, 2, 1) }
    return;
  }
  // fish trap: a wicker basket half under the water with a red and white float on a rope
  const bob = o ? Math.round(Math.sin(t * 2.2 + cx) * 1) : 0, wet = !!o;
  if (wet) { g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx, by - 5, 8 + Math.sin(t * 2) * .6, 2.2, 0, 0, 7); g.fill() }
  const top = wet ? -9 : -14;
  P(INK, -7, top, 14, wet ? 5 : 13); P('#b8864a', -6, top + 1, 12, wet ? 3 : 11); for (let a = -5; a < 6; a += 3) P('#8a5a2a', a, top + 1, 1, wet ? 3 : 11);
  for (let y = top + 3; y < top + (wet ? 4 : 12); y += 3) P('#d8a868', -6, y, 12, 1); P(INK, -3, top - 1, 6, 1);
  if (wet) { g.fillStyle = 'rgba(40,110,160,.55)'; g.fillRect(Math.round(cx - 7), Math.round(by - 5), 14, 2) }
  P('#e8d8a8', 4, top - 4 + bob, 1, 4);                                                           // rope to the float
  P(INK, 3, top - 9 + bob, 6, 6); P('#e8402a', 4, top - 8 + bob, 4, 2); P('#ffffff', 4, top - 6 + bob, 4, 2); P('#ffb0a0', 4, top - 8 + bob, 1, 1);
  if (o && o.out) { const f = Math.sin(t * 6) > 0; P('#bcd8e8', -3, top - 3 + (f ? 0 : 1), 4, 2); P('#e8f4fa', -3, top - 3 + (f ? 0 : 1), 1, 1); if (Math.sin(t * 3) > .3) P('#ffffff', -5, top - 6, 1, 1) }
};
const _drawCraftDecor = drawCraftDecor;
drawCraftDecor = function (g, k, cx, by, t) {
  if (!['oillamp', 'olivetree', 'arbor'].includes(k)) return _drawCraftDecor(g, k, cx, by, t);
  const P = (c, a, b, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(cx + a), Math.round(by + b), w, h) };
  const blob = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(Math.round(cx + x), Math.round(by + y), r, 0, 7); g.fill() };
  if (k === 'oillamp') {
    P(INK, -5, -3, 10, 3); P(ST[1], -4, -2, 8, 1);
    P(INK, -3, -17, 6, 15); P(ST[2], -2, -16, 4, 14); P(ST[3], -2, -16, 1, 14); P(ST[0], 1, -16, 1, 14);
    P(INK, -6, -20, 12, 4); P(ST[2], -5, -19, 10, 2); P(ST[3], -5, -19, 10, 1);
    P(INK, -6, -24, 11, 5); P(CLAY[1], -5, -23, 9, 3); P(CLAY[2], -5, -23, 5, 1); P(CLAY[0], -5, -21, 9, 1); P(INK, -2, -25, 4, 2); P('#3a2010', -1, -24, 2, 1);
    P(INK, 4, -25, 4, 3); P(CLAY[1], 5, -24, 2, 1);                                               // spout
    const f = Math.sin(t * 11 + cx) > .1; P(f ? '#ffb340' : '#ffd36b', 6, -29, 2, 4); P('#fff4c2', 6, -27, 1, 2); P('#ff7a20', 6, -26, 2, 1);
    return;
  }
  if (k === 'olivetree') {
    P(INK, -2, -24, 4, 16); P('#7a5a3a', -1, -23, 2, 15); P('#5a3e26', 0, -20, 1, 6); P(INK, 1, -21, 5, 2); P('#7a5a3a', 2, -21, 3, 1); P(INK, -5, -19, 4, 2); P('#7a5a3a', -4, -19, 3, 1);
    for (const [x, y, r] of [[-6, -27, 5], [5, -28, 5], [0, -32, 6], [-3, -24, 4], [4, -23, 4]]) blob(x, y, r + 1, INK);
    for (const [x, y, r] of [[-6, -27, 5], [5, -28, 5], [0, -32, 6], [-3, -24, 4], [4, -23, 4]]) blob(x, y, r, '#6f8f5c');
    for (const [x, y, r] of [[-7, -29, 3], [4, -30, 3], [-1, -34, 4]]) blob(x, y, r, '#9ab884');
    for (const [x, y] of [[-6, -31], [1, -35], [5, -31], [-3, -29], [3, -27]]) P('#c8dcb0', x, y, 2, 1);
    for (const [x, y] of [[-4, -25], [6, -26], [0, -29], [-8, -26], [3, -33]]) { P('#3a2a4a', x, y, 2, 2); P('#7a5a8a', x, y, 1, 1) }
    P(INK, -7, -11, 14, 3); P(CLAY[2], -6, -10, 12, 1); P(INK, -6, -9, 12, 9); P(CLAY[1], -5, -8, 10, 8); P(CLAY[2], -5, -8, 3, 7); P(CLAY[0], -5, -2, 10, 1);
    P(CLAY[0], -5, -6, 10, 1); P('#5a3a20', -5, -10, 10, 1);
    return;
  }
  // grape arbor: two posts, a beamed top, vines and hanging grapes
  for (const a of [-14, 11]) { P(INK, a, -34, 4, 34); P(WD[1], a + 1, -33, 2, 33); P(WD[2], a + 1, -33, 1, 33) }
  P(INK, -16, -37, 32, 4); P(WD[2], -15, -36, 30, 1); P(WD[1], -15, -35, 30, 1);
  for (const a of [-12, -6, 0, 6]) { P(INK, a, -40, 3, 4); P(WD[2], a + 1, -39, 1, 3) }
  const leaf = (x, y) => { P(INK, x - 1, y - 1, 5, 4); P('#4a9a3a', x, y, 3, 2); P('#7ac85a', x, y, 1, 1) };
  for (let i = 0; i < 9; i++) leaf(-15 + i * 3.6, -38 + (i % 2) * 2);
  for (let i = 0; i < 4; i++) { leaf(-15 + (i % 2), -29 + i * 6); leaf(10 + (i % 2), -27 + i * 6) }
  const sway = Math.round(Math.sin(t * 1.3 + cx) * .6);
  for (const [x, y] of [[-8, -33], [3, -33], [8, -32]]) {
    P('#3f8a3a', x + 1, y, 1, 2);
    for (const [dx, dy] of [[0, 2], [2, 2], [-1, 4], [1, 4], [3, 4], [0, 6], [2, 6], [1, 8]]) { P(INK, x + dx - 1 + sway, y + dy - 1, 3, 3) }
    for (const [dx, dy] of [[0, 2], [2, 2], [-1, 4], [1, 4], [3, 4], [0, 6], [2, 6], [1, 8]]) { P('#7a3a9a', x + dx + sway, y + dy, 2, 2); P('#b07ad0', x + dx + sway, y + dy, 1, 1) }
  }
};

// ---------- icons: the new things, and clearer art for a few old ones ----------
function moreIcons() {
  const mk = (k, f) => { const c = mkc(16, 16), g = c.getContext('2d'), R = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h) }; f(R, g); AT[k] = [c] };
  const big = (key, f) => { const c = mkc(40, 48), g = c.getContext('2d'); f(g); AT[key] = [trimCanvas(c)] };
  const bowl = (R, soup) => { R(INK, 1, 7, 14, 4); R(INK, 2, 11, 12, 2); R(INK, 4, 13, 8, 2); R('#c47a3e', 2, 9, 12, 2); R('#e09a5a', 3, 9, 10, 1); R('#a85a2a', 3, 11, 10, 2); R('#8a4524', 5, 13, 6, 1); R(soup, 2, 8, 12, 1); R(soup, 3, 7, 10, 1) };
  const steam = R => { R('rgba(255,255,255,.75)', 5, 3, 1, 3); R('rgba(255,255,255,.75)', 6, 2, 1, 1); R('rgba(255,255,255,.75)', 10, 2, 1, 3); R('rgba(255,255,255,.75)', 9, 1, 1, 1) };
  // Miriam's everyday food
  mk('ic_bread', R => { R(INK, 1, 6, 14, 8); R(INK, 2, 5, 12, 10); R(INK, 4, 4, 8, 1); R('#c87a34', 2, 6, 12, 7); R('#e8a050', 3, 5, 10, 3); R('#f8d08a', 4, 5, 6, 1); R('#a85a24', 2, 12, 12, 1); R('#8a4a1a', 3, 13, 10, 1);
    for (const x of [4, 7, 10]) { R('#f8e0b0', x, 8, 2, 1); R('#a85a24', x + 1, 9, 1, 1) } });
  mk('ic_stew', R => { bowl(R, '#c8582a'); for (const [x, y] of [[4, 7], [7, 8], [10, 7], [12, 8], [5, 8]]) R('#f0a060', x, y, 1, 1); R('#6ea83a', 9, 7, 2, 1); steam(R) });
  mk('ic_figcake', R => { R(INK, 1, 8, 14, 7); R('#8a5a30', 2, 9, 12, 5); R('#a87040', 2, 9, 12, 1); R('#6a4020', 2, 13, 12, 1); R('#e8c25a', 2, 11, 12, 1);
    for (const x of [2, 9]) { R(INK, x, 3, 6, 6); R('#6a2a5a', x + 1, 4, 4, 4); R('#e86a8a', x + 2, 5, 2, 3); R('#ffd0a0', x + 2, 6, 1, 1); R('#4a7a2a', x + 2, 3, 1, 1) } });
  // seasonal specials
  mk('ic_herbbread', R => { R(INK, 1, 6, 14, 8); R(INK, 0, 8, 16, 4); R('#e8c080', 1, 7, 14, 6); R('#f8e0b0', 2, 7, 10, 2); R('#c8904a', 1, 12, 14, 1);
    for (const [x, y] of [[3, 9], [6, 8], [9, 10], [12, 8], [5, 11], [11, 11]]) { R('#3f8a3a', x, y, 2, 1); R('#7ac85a', x, y, 1, 1) } for (const [x, y] of [[4, 11], [8, 9], [10, 7]]) R('#b8783a', x, y, 1, 1) });
  mk('ic_pomjuice', R => { R(INK, 1, 3, 8, 12); R('#e0eef4', 2, 4, 6, 10); R('#c0203a', 2, 7, 6, 7); R('#ff6a7a', 3, 8, 1, 4); R('#8a1028', 2, 13, 6, 1); R('#ffffff', 3, 4, 1, 2);
    R(INK, 8, 7, 8, 8); R(INK, 9, 6, 6, 10); R('#c8283a', 9, 8, 6, 6); R('#e8505a', 10, 8, 2, 2); R('#8a1028', 9, 13, 6, 1); R(INK, 10, 4, 4, 3); R('#a8283a', 11, 5, 2, 1) });
  mk('ic_gourdsoup', R => { bowl(R, '#f0902a'); R('#fff0c0', 6, 7, 3, 1); for (const [x, y] of [[4, 8], [10, 7], [12, 8]]) R('#8a3a10', x, y, 1, 1); R('#5a9a3a', 8, 7, 1, 1); steam(R) });
  mk('ic_datecake', R => { R(INK, 1, 7, 14, 8); R('#e8c88a', 2, 8, 12, 6); R('#f8e8c0', 2, 8, 12, 1); R('#c89040', 2, 11, 12, 1); R('#b07830', 2, 13, 12, 1);
    for (const x of [3, 7, 11]) { R(INK, x - 1, 4, 4, 4); R('#7a3a18', x, 5, 2, 2); R('#a85a2a', x, 5, 1, 1) } R('#f0e0c0', 5, 9, 2, 1); R('#f0e0c0', 9, 10, 2, 1) });
  // supplies
  mk('ic_fiber', R => { for (const [x, c] of [[3, '#4a8a3a'], [5, '#6aa84a'], [7, '#8ac85a'], [9, '#6aa84a'], [11, '#4a8a3a']]) { R(INK, x - 1, 1, 3, 14); R(c, x, 2, 1, 12) }
    for (const x of [4, 6, 8, 10]) R('#b8e078', x, 2, 1, 4); R(INK, 1, 8, 14, 3); R('#c89a5a', 2, 9, 12, 1); R('#e8c080', 3, 9, 4, 1) });
  mk('ic_bait', R => { R(INK, 3, 4, 10, 11); R(INK, 2, 6, 12, 8); R(CLAY[1], 3, 6, 10, 8); R(CLAY[2], 3, 6, 3, 7); R(CLAY[0], 3, 13, 10, 1); R(INK, 2, 4, 12, 2); R(CLAY[2], 3, 4, 10, 1);
    R(INK, 4, 1, 4, 3); R('#9ab8c8', 5, 2, 2, 1); R(INK, 9, 0, 4, 4); R('#9ab8c8', 10, 1, 2, 2); R(INK, 7, 2, 2, 1); R('#3aa0e8', 6, 3, 4, 1) });
  const grid = (k, rows, pal) => mk(k, R => rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) R(pal[ch], x, y) })));
  grid('ic_dove', ['', '..kk', '..kWk', '..kWWk', '...kWWk', '...kWWWk...kkk', '....kWWWk.kWWWk', '....kWWWWkWWkWko', '..kkkWWWWWWWWWkG', '.kSWWWWWWWWWWk.g', 'kSSkkWWWWWWWk.gG', '.kk..kSSSSSk..g', '......kkkkk'],
    { k: INK, W: '#ffffff', S: '#c8d0dc', o: '#f0a040', g: '#7ac85a', G: '#3f8a3a' });
  mk('ic_lantern', R => { R(INK, 6, 0, 4, 2); R(INK, 7, 1, 2, 2); R(INK, 3, 3, 10, 2); R(FE[2], 4, 3, 8, 1); R(INK, 3, 5, 10, 9); R('#ffd860', 4, 6, 8, 7); R('#fff4c2', 6, 7, 3, 4); R('#ff9a30', 7, 9, 2, 3);
    for (const x of [4, 11]) R(FE[1], x, 5, 1, 9); R(FE[1], 7, 5, 2, 1); R(INK, 2, 14, 12, 2); R(FE[1], 3, 14, 10, 1) });
  big('mach_seedmaker', g => drawMach(g, 'seedmaker', 20, 47, 0, null));
  big('mach_trap', g => drawMach(g, 'trap', 20, 47, 0, null));
  for (const k of ['oillamp', 'olivetree', 'arbor']) big('decor_' + k, g => drawCraftDecor(g, k, 20, 47, 0));
}
