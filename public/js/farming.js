// Farming: tilled soil, watering, seeds, crops that grow day by day, and the merchant's seed cart.
'use strict';
const CROPS = {   // seasons: 0 spring, 1 summer, 2 autumn, 3 winter (Bethlehem's mild, rainy winter)
  radish: { n: 'Radishes', sn: 'Radish', days: 3, seed: 15, sell: 28, seasons: [0] },
  wheat: { n: 'Wheat', days: 4, seed: 12, sell: 25, seasons: [0, 1] },
  barley: { n: 'Barley', days: 5, seed: 18, sell: 35, seasons: [0, 2] },
  onion: { n: 'Onions', sn: 'Onion', days: 5, seed: 25, sell: 45, seasons: [0] },
  leek: { n: 'Leeks', sn: 'Leek', days: 6, seed: 25, sell: 50, seasons: [0, 3] },
  garlic: { n: 'Garlic', days: 7, seed: 38, sell: 75, seasons: [0, 3] },
  cabbage: { n: 'Cabbage', days: 9, seed: 60, sell: 125, seasons: [0, 3] },
  carrot: { n: 'Carrots', sn: 'Carrot', days: 4, seed: 20, sell: 38, seasons: [1, 2] },
  coriander: { n: 'Coriander', days: 5, seed: 30, sell: 62, seasons: [1, 2] },
  flax: { n: 'Flax', days: 6, seed: 40, sell: 82, seasons: [1] },
  melon: { n: 'Melons', sn: 'Melon', days: 10, seed: 90, sell: 210, seasons: [1] },
  beet: { n: 'Beets', sn: 'Beet', days: 6, seed: 30, sell: 66, seasons: [2] },
  turnip: { n: 'Turnips', sn: 'Turnip', days: 5, seed: 25, sell: 52, seasons: [3] },
  mustard: { n: 'Mustard Greens', sn: 'Mustard', days: 4, seed: 18, sell: 40, seasons: [3] },
  gourd: { n: 'Gourds', sn: 'Gourd', days: 11, seed: 95, sell: 240, seasons: [2] },
};
const CAN_MAX = 40;
function farmItems() {
  const o = {
    hoe: { n: 'Hoe', icon: 'ic_hoe', tool: 'hoe', d: 'Digs up the ground so you can plant seeds.' },
    can: { n: 'Watering Can', icon: 'ic_can', tool: 'can', d: 'Water your crops every day or they won’t grow. Refill it at the pond.' },
  };
  for (const k in CROPS) {
    const c = CROPS[k];
    o['seed_' + k] = { n: (c.sn || c.n) + ' Seeds', icon: 'seed_' + k, seed: k, price: Math.floor(c.seed / 2), d: `Plant in tilled soil and water every day. Ready in ${c.days} days. Grows in ${c.seasons.map(s => SEASONS[s]).join(' and ')}.` };
    o[k] = { n: c.n, icon: 'item_' + k, price: c.sell, d: `Fresh from your field. Sells for ₪ ${c.sell}.` };
  }
  return o;
}

// ---------- soil ----------
World.soil = {};
const soilAt = (x, y) => inb(x, y) ? World.soil[idx(x, y)] : null;
const canTill = (x, y) => World.cur === 'farm' && inb(x, y) && World.ground[idx(x, y)] !== WATER && !World.objs[idx(x, y)] && !World.soil[idx(x, y)] && !(state.paths && state.paths[idx(x, y)]);
const canPlant = (x, y) => { const s = soilAt(x, y); return s && !s.c };
const needsWater = (x, y) => { const s = soilAt(x, y); return s && !s.w };
const isWater = (x, y) => inb(x, y) && World.ground[idx(x, y)] === WATER;
const isReady = (x, y) => { const s = soilAt(x, y); return s && s.c && (s.c.dead || s.c.g >= CROPS[s.c.id].days) };
// best cell for a farming action: the one in front first, then the closest good one in that direction
function findCell(ok) {
  const [fx, fy] = facingCell(); if (ok(fx, fy)) return { x: fx, y: fy };
  let best = null, bd = 1.3; const [dx, dy] = faceVec();
  for (let y = Math.floor(player.y) - 2; y <= Math.floor(player.y) + 1; y++) for (let x = Math.floor(player.x) - 2; x <= Math.floor(player.x) + 2; x++) {
    if (!ok(x, y)) continue; const vx = x + .5 - player.x, vy = y + .55 - player.y, d = Math.hypot(vx, vy);
    const ahead = (vx * dx + vy * dy) / (d || 1); if (ahead < .3) continue;
    const score = d - ahead * .45; if (d < 1.5 && score < bd) { bd = score; best = { x, y } }
  }
  return best;
}
const harvestTarget = () => findCell(isReady);
// what the selected item would act on (for the highlight square and the action)
function toolCell(it) {
  if (!it) return null;
  if (it.seed) return findCell(canPlant);
  if (it.fert) return findCell((x, y) => { const s = soilAt(x, y); return s && (s.f || 0) < it.fert });
  if (it.tool === 'hoe') { const [fx, fy] = facingCell(); if (state.paths && state.paths[idx(fx, fy)]) return null; return findCell(canTill) }   // a path right in front: lift it instead
  if (it.tool === 'can') return findCell(needsWater) || (state.can < canMax() ? findCell(isWater) : null);
  return null;
}
function till(c) { World.soil[idx(c.x, c.y)] = { w: 0, c: null }; sfx.dig(); chips(c.x + .5, c.y + .6, '#9a6a3e', 6) }
function water(c) {
  if (isWater(c.x, c.y)) { state.can = canMax(); sfx.splash(); chips(c.x + .5, c.y + .5, '#bfe6ff', 8); toast('Watering can filled.'); return }
  if (state.can <= 0) { toast('Your watering can is empty. Refill it at the pond.'); sfx.no(); return }
  const s = soilAt(c.x, c.y); if (!s) return; s.w = 1; state.can--; sfx.water(); for (let k = 0; k < 6; k++) parts.push({ x: c.x + .5 + rnd(-.3, .3), y: c.y + .6, z: .6, vx: rnd(-.4, .4), vy: rnd(-.2, .2), vz: rnd(.5, 1.5), col: '#7ec8f2', life: rnd(.3, .6) });
}
function plant(c, slot) {
  const it = state.inv[slot], k = ITEMS[it.id].seed, cr = CROPS[k];
  if (!cr.seasons.includes(state.season)) { toast(`${cr.n} can’t grow in ${SEASONS[state.season]}.`); sfx.no(); return }
  World.soil[idx(c.x, c.y)].c = { id: k, g: 0 }; it.n--; if (it.n <= 0) state.inv[slot] = null; sfx.plant(); state.stats.planted = (state.stats.planted || 0) + 1;
}
function harvest(c) {
  const s = soilAt(c.x, c.y), cr = s.c; s.c = null; delete s.f; delete s.fp;
  if (cr.dead) { chips(c.x + .5, c.y + .6, '#8a6a3a', 6); sfx.swish(); return }
  drop(cr.id, Math.random() < farmDouble() ? 2 : 1, c.x + .5, c.y + .6); gainXP('farm', cropXP(cr.id)); sfx.pop(); leaves(c.x + .5, c.y + .3, 4);
  state.stats.harvested = (state.stats.harvested || 0) + 1;
}
// overnight: watered crops grow a day; crops out of season wither; everything dries out
function growNight(seasonChanged) {
  let died = 0;
  for (const i in World.soil) {
    const s = World.soil[i];
    if (s.c && !s.c.dead) { if (seasonChanged && !CROPS[s.c.id].seasons.includes(state.season)) { s.c.dead = 1; died++ } else if (s.w) { s.c.g++; if (s.f) { s.fp = (s.fp || 0) + (s.f === 2 ? .5 : .34); if (s.fp >= 1) { s.fp -= 1; if (s.c.g < CROPS[s.c.id].days) s.c.g++ } } } }
    // empty soil you don't plant or water goes back to grass after a couple of nights
    if (!s.c) { s.idle = s.w ? 0 : (s.idle || 0) + 1; if (s.idle >= 2 && Math.random() < .4) { delete World.soil[i]; continue } } else delete s.idle;
    s.w = 0;
  }
  return died;
}

// ---------- drawing ----------
// tilled soil: dark earth with furrows, joined up with neighbouring tilled cells; darker when watered
function drawSoil(g, x0, y0, x1, y1) {
  const has = (x, y) => !!soilAt(x, y);
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
    const s = World.soil[idx(x, y)]; if (!s) continue;
    const L = has(x - 1, y), R = has(x + 1, y), U = has(x, y - 1), D = has(x, y + 1), px = x * 16, py = y * 16;
    const l = L ? 0 : 1, r = R ? 16 : 15, t = U ? 0 : 1, b = D ? 16 : 15;
    const base = s.w ? '#5c3b26' : '#8c5c38', dark = s.w ? '#432918' : '#6e4428', lite = s.w ? '#6e4a30' : '#a8744a';
    g.fillStyle = 'rgba(40,24,12,.35)'; g.fillRect(px + l, py + t + 1, r - l, b - t);
    g.fillStyle = base; g.fillRect(px + l, py + t, r - l, b - t);
    for (const fy of [3, 8, 13]) { g.fillStyle = dark; g.fillRect(px + l + (L ? 0 : 1), py + fy, r - l - (L ? 0 : 1) - (R ? 0 : 1), 1); g.fillStyle = lite; g.fillRect(px + l + (L ? 0 : 1), py + fy + 1, r - l - (L ? 0 : 1) - (R ? 0 : 1), 1) }
    g.fillStyle = dark; if (!U) g.fillRect(px + l, py + t, r - l, 1); if (!L) g.fillRect(px + l, py + t, 1, b - t); if (!R) g.fillRect(px + r - 1, py + t, 1, b - t);
    if (!D) { g.fillStyle = 'rgba(30,16,8,.45)'; g.fillRect(px + l, py + b - 1, r - l, 1) }
    if (s.w && (x * 7 + y * 3) % 5 === 0) { g.fillStyle = 'rgba(160,210,240,.35)'; g.fillRect(px + 5, py + 5, 2, 1) }
  }
}
const deadCache = {};
function drawCrop(g, s, x, y, t) {
  const c = s.c, cr = CROPS[c.id], fr = AT['crop_' + c.id]; let spr;
  const ready = c.g >= cr.days, stage = ready ? 3 : Math.min(2, Math.floor(c.g / cr.days * 3));
  if (c.dead) { const k = c.id; spr = deadCache[k] || (deadCache[k] = tintCanvas(fr[2], [.75, .55, .35], [30, 18, 4])) } else spr = fr[stage];
  const sway = ready ? Math.round(Math.sin(t * 2 + x * 1.3) * .6) : 0;
  g.drawImage(spr, Math.round(x * 16 + 8 - spr.width / 2 + sway), Math.round(y * 16 + 14 - spr.height));
  if (ready && !c.dead && AT.glint && Math.sin(t * 1.7 + x * 2.1 + y) > .82) { const gl = AT.glint[Math.floor(t * 10) % AT.glint.length]; g.drawImage(gl, x * 16 + 8 - gl.width / 2, y * 16 - gl.height / 2) }
}

// ---------- merchant's cart ----------
const CART = (() => {
  const c = mkc(44, 34), g = c.getContext('2d'), R = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h) };
  const D = '#3a2014', W1 = '#8a5530', W2 = '#a8703e', W3 = '#c9905a';
  R('rgba(24,20,37,.45)', 3, 30, 38, 3);
  // posts and striped canopy
  R(D, 5, 6, 3, 20); R(D, 36, 6, 3, 20); R(W2, 6, 7, 1, 18); R(W2, 37, 7, 1, 18);
  R(D, 1, 1, 42, 8); for (let k = 0; k < 8; k++) R(k % 2 ? '#f4e6c4' : '#c8443a', 2 + k * 5, 2, 5, 6); R('rgba(0,0,0,.18)', 2, 7, 40, 1);
  for (let k = 0; k < 8; k++) { R(k % 2 ? '#f4e6c4' : '#c8443a', 2 + k * 5, 8, 5, 2); R(D, 2 + k * 5 + 1, 10, 3, 1) }
  // goods: sacks and a crate of produce
  R(D, 9, 13, 9, 9); R('#d9c08a', 10, 14, 7, 7); R('#b89a62', 10, 19, 7, 2); R('#7a5a30', 12, 14, 3, 1);
  R(D, 18, 15, 8, 7); R('#e2cf98', 19, 16, 6, 5); R('#c7b07a', 19, 20, 6, 1);
  R(D, 26, 14, 9, 8); R(W2, 27, 15, 7, 6); R('#e8c25a', 28, 15, 2, 2); R('#6fae3a', 30, 15, 2, 2); R('#c8443a', 32, 16, 2, 2); R(W1, 27, 18, 7, 1);
  // cart bed
  R(D, 2, 21, 40, 8); R(W2, 3, 22, 38, 3); R(W1, 3, 25, 38, 3); R(W3, 3, 22, 38, 1); [12, 22, 32].forEach(x => R(W1, x, 22, 1, 3));
  // wheels
  const wheel = cx => { R(D, cx - 4, 24, 9, 9); R('#6a4024', cx - 3, 25, 7, 7); R(W3, cx - 1, 27, 3, 3); R(D, cx, 28, 1, 1) }; wheel(10); wheel(34);
  // little seed-bag sign
  R(D, 17, 2, 10, 5); R('#f4e6c4', 18, 3, 8, 3); R('#6fae3a', 19, 4, 2, 1); R('#e8c25a', 22, 4, 2, 1);
  return c;
})();
function ensureCart() {
  if (World.objs.some(o => o && o.t === 'cart')) return; const T = World.TENT;
  for (const [dx, dy] of [[5, 5], [-5, 5], [6, 3], [-6, 3], [4, 6], [-4, 6], [7, 6]]) {
    const x = T.x + dx, y = T.y + dy; let ok = true;
    for (let xx = x - 1; xx <= x + 1; xx++) { const o = World.get(xx, y); if (!inb(xx, y) || World.ground[idx(xx, y)] === WATER || (o && !OBJ[o.t].tool) || World.soil[idx(xx, y)]) ok = false }
    if (ok) { for (let xx = x - 1; xx <= x + 1; xx++) World.place(xx, y, null); World.footprint(x, y, 3, 1, { t: 'cart' }); return }
  }
}
function openShop() { menuOpen = true; boxMode = 'shop'; $('#binM .ttl').textContent = "Merchant's Cart"; $('#binM').classList.add('on'); sfx.tap(); renderShop() }
function renderShop() {
  const b = $('#binM .mbody');
  let h = `<div class="binhead"><span>Seeds for sale</span><b>₪ ${state.money.toLocaleString()}</b></div><p class="muted" style="margin:2px 0 8px">“Shalom! Fine seeds from Bethlehem, until the market there opens for you.”</p>`;
  for (const k in CROPS) {
    if (CROPS[k].un) continue;   // the cart only carries the basic seeds; the rest are at Tobiah's market
    const c = CROPS[k], inS = c.seasons.includes(state.season), id = 'seed_' + k;
    h += `<div class="shoprow ${inS ? '' : 'off'}"><img src="${iconURL(id)}"><div class="si"><b>${ITEMS[id].n}</b><div class="muted">${c.days} days · ${c.seasons.map(s => SEASONS[s]).join(', ')} · sells ₪ ${c.sell}</div></div><div class="sb"><span class="pr">₪ ${seedPrice(k)}</span><button class="btn alt" data-buy="${k}" data-n="1" ${inS && state.money >= seedPrice(k) ? '' : 'disabled'}>+1</button><button class="btn" data-buy="${k}" data-n="5" ${inS && state.money >= seedPrice(k) * 5 ? '' : 'disabled'}>+5</button></div></div>`;
  }
  b.innerHTML = h;
  b.querySelectorAll('[data-buy]').forEach(el => el.onclick = () => {
    const k = el.dataset.buy, n = +el.dataset.n, cost = seedPrice(k) * n; if (state.money < cost) { sfx.no(); return }
    if (addItem('seed_' + k, n)) { toast('Your bag is full.'); sfx.no(); return }
    state.money -= cost; sfx.pick(); renderShop();
  });
}
// first time farming: tools and starter seeds
function giveStarter(existing) {
  if (state.farmStart) return; state.farmStart = 1; state.can = CAN_MAX;
  for (const id of ['hoe', 'can']) if (!state.inv.some(s => s && s.id === id)) { const i = state.inv.indexOf(null); if (i >= 0) state.inv[i] = { id, n: 1 } }
  const e = state.chest.indexOf(null); if (e >= 0) state.chest[e] = { id: 'seed_wheat', n: 15 };
  if (existing) setTimeout(() => say('A neighbor from Bethlehem stopped by! You now have a hoe and a watering can, and there are 15 wheat seeds waiting in your storage chest. More seeds are sold at the market in Bethlehem: follow the road east off your farm.'), 1600);
}

// the market in town replaces the old seed cart
function removeCart() {
  let had = false;
  World.objs.forEach((o, i) => { if (o && (o.t === 'cart' || (o.t === 'part' && World.objs[idx(o.ox, o.oy)] && World.objs[idx(o.ox, o.oy)].t === 'cart'))) { if (o.t === 'cart') had = true } });
  if (!had) return false;
  const cells = []; World.objs.forEach((o, i) => { if (o && o.t === 'cart') cells.push(i) });
  for (const i of cells) { const x = i % W, y = Math.floor(i / W); for (let xx = x - 1; xx <= x + 1; xx++) if (inb(xx, y)) World.objs[idx(xx, y)] = null }
  return true;
}

// ---------- the land grows back if you don't keep up with it ----------
// Every night on the farm: weeds and grass creep in (mostly next to weeds that are already there), a rock or two
// turns up, now and then a twig, and sometimes a young tree sprouts near the woods. Saplings grow into full trees
// in about a week if you leave them. Winter is quieter. Nothing grows on paths, soil, or right next to your things.
const KEEP_CLEAR = ['bench', 'mach', 'chest2', 'fwell', 'fence', 'sfence', 'gate', 'decor', 'bin', 'tent', 'bld', 'sign', 'cart', 'crate', 'campfire', 'part', 'barrel', 'torch'];
const CLUTTER = ['weed', 'grass', 'rock', 'twig', 'boulder', 'sapling', 'oak', 'olive', 'stump'];
function regrowFarm() {
  const O = World.objs, winter = state.season === 3, R = Math.random;
  // saplings grow up first
  O.forEach((o, i) => { if (o && o.t === 'sapling') { o.g = (o.g || 0) + (winter ? 0 : 1); if (o.g >= 8) O[i] = { t: R() < .55 ? 'oak' : 'olive', v: ri(0, 3) } } });
  let clutter = 0; for (const o of O) if (o && CLUTTER.includes(o.t)) clutter++;
  if (clutter > 1500) return;   // already very overgrown: let it be
  const free = (x, y) => {
    if (x < 2 || y < 2 || x > W - 3 || y > H - 3) return false; const i = idx(x, y);
    if (O[i] || World.ground[i] !== GRASS || World.soil[i] || (state.paths && state.paths[i])) return false;
    if (Math.hypot(x - World.TENT.x, y - World.TENT.y) < 4.5 || Math.hypot(x - World.EXIT.x, y - World.EXIT.y) < 3) return false;
    for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) { const o = World.get(xx, yy); if (o && KEEP_CLEAR.includes(o.t)) return false }
    return true;
  };
  const randomCell = () => { for (let k = 0; k < 60; k++) { const x = ri(2, W - 3), y = ri(2, H - 3); if (free(x, y)) return [x, y] } return null };
  const nextTo = kinds => {   // a free cell beside something of this kind, so things spread naturally
    for (let k = 0; k < 80; k++) { const i = ri(0, O.length - 1), o = O[i]; if (!o || !kinds.includes(o.t)) continue;
      const x = i % W + ri(-1, 1), y = Math.floor(i / W) + ri(-1, 1); if (free(x, y)) return [x, y] } return null };
  const put = (c, o) => { if (c) O[idx(c[0], c[1])] = o };
  const weeds = winter ? ri(1, 3) : ri(6, 10);
  for (let k = 0; k < weeds; k++) put(R() < .6 ? nextTo(['weed', 'grass']) || randomCell() : randomCell(), R() < .5 ? { t: 'weed', v: ri(0, 3) } : { t: 'grass', v: ri(0, 7) });
  for (let k = ri(1, 2); k > 0; k--) { const r = R(); put(randomCell(), r < .6 ? { t: 'rock', v: 1 } : r < .95 ? { t: 'rock', v: 0 } : { t: 'boulder' }) }
  if (R() < .5) put(randomCell(), { t: 'twig' });
  if (!winter && R() < .35) put(nextTo(['oak', 'olive']) || randomCell(), { t: 'sapling', g: 0 });
}
// a young tree: a little sprout, then a sapling, then (after about a week) a full tree
function drawSapling(g, cx, by, gr, t) {
  const P = (c, a, b, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(cx + a), Math.round(by + b), w, h) }, sway = Math.round(Math.sin(t * 1.6 + cx) * .6);
  const ink = '#1e3a1e', L = ['#2f6a2a', '#4a9a3a', '#7ac458', '#a8e070'];
  g.fillStyle = 'rgba(30,20,10,.2)'; g.beginPath(); g.ellipse(cx, by, gr < 3 ? 3 : 5, 1.5, 0, 0, 7); g.fill();
  if (gr < 3) { P(ink, -1, -6, 3, 6); P(L[1], 0, -6, 1, 6); P(ink, -4 + sway, -8, 4, 3); P(L[2], -3 + sway, -7, 3, 1); P(ink, 1 + sway, -9, 4, 3); P(L[2], 1 + sway, -8, 3, 1); P(L[3], 2 + sway, -8, 1, 1); return }
  P('#3a2418', -1, -9, 3, 9); P('#8a5a3a', 0, -9, 1, 9);
  for (const [x, y, w, h] of [[-5, -18, 11, 8], [-6, -15, 13, 5], [-3, -20, 7, 3]]) P(ink, x + sway, y, w, h);
  for (const [x, y, w, h] of [[-4, -17, 9, 6], [-5, -14, 11, 3], [-2, -19, 5, 2]]) P(L[1], x + sway, y, w, h);
  P(L[2], -3 + sway, -17, 4, 2); P(L[2], -4 + sway, -14, 3, 1); P(L[3], -2 + sway, -17, 2, 1); P(L[0], 1 + sway, -12, 4, 1);
}
