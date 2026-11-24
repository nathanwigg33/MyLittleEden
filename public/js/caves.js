// ---------- the Sinai Caverns ----------
// A hand-made cave system under Mount Sinai, the same in every game. Five sections of chambers joined by tunnels,
// with more than one route through each: dead ends with old miners' chests, things to clear (rubble, a broken bridge,
// a chasm), a mine-cart station in each section you repair once to ride between them, and a boarded-up shortcut you
// can only knock out from the deep side, so it becomes a quick way back. Rocks and ore grow back every day.
'use strict';
const CAVE = { sec: 1, river: new Set(), seen: null, seenSec: 0 };
const CAVE_CACHE = {};
// rooms: [x, y, rx, ry] · links: a ↔ b, tunnel width w, optional bends, optional obstacle (rubble, chasm, bridge, boards, ford)
const CAVES = [null,
  { n: 'Upper Tunnels', pal: 0, ores: { stone: 60, copper: 16, coal: 12 },
    rooms: [[32, 8, 7, 4], [15, 10, 5, 3], [49, 12, 5, 4], [9, 22, 4, 4], [26, 21, 6, 4], [45, 24, 6, 4], [56, 34, 4, 3], [19, 35, 6, 4], [36, 39, 7, 5]],
    links: [{ a: 0, b: 1, w: 3 }, { a: 0, b: 2, w: 3 }, { a: 1, b: 3, w: 2 }, { a: 1, b: 4, w: 3 }, { a: 2, b: 5, w: 3 }, { a: 4, b: 5, w: 2 },
      { a: 5, b: 6, w: 2, ob: 'rubble' }, { a: 4, b: 7, w: 3 }, { a: 7, b: 8, w: 3 }, { a: 8, b: 5, w: 2, ob: 'boards' }],
    up: [32, 5], cart: [38, 8], down: [36, 43], chests: { a: [8, 22], b: [57, 35] },
    loot: { a: [['ore_coal', 6], ['money', 120]], b: [['bar_copper', 3], ['ore_amethyst', 1]] }, fix: { bar: 'bar_copper' } },
  { n: 'Underground River', pal: 1, ores: { stone: 52, copper: 10, coal: 12, iron: 14 }, river: 1,
    rooms: [[32, 8, 6, 3], [14, 15, 5, 4], [49, 15, 6, 4], [58, 7, 3, 3], [24, 36, 6, 4], [38, 42, 6, 4], [52, 37, 5, 4], [8, 44, 3, 3], [38, 24, 6, 3], [28, 30, 5, 3]],   // last two: riverbank grottos for fishing
    links: [{ a: 0, b: 1, w: 3 }, { a: 0, b: 2, w: 3 }, { a: 2, b: 3, w: 2, ob: 'rubble' }, { a: 1, b: 4, w: 3, via: [[20, 24]], ob: 'bridge' },
      { a: 4, b: 5, w: 3 }, { a: 5, b: 6, w: 3 }, { a: 4, b: 7, w: 2 }, { a: 6, b: 2, w: 2, ob: 'boards', ford: 1 }, { a: 0, b: 8, w: 3, via: [[35, 15]] }, { a: 4, b: 9, w: 3 }],
    up: [32, 6], cart: [37, 9], down: [52, 40], chests: { a: [58, 7], b: [8, 44] },
    loot: { a: [['bar_iron', 2], ['money', 250]], b: [['ore_emerald', 1], ['bait', 20]] }, fix: { bar: 'bar_copper' } },
  { n: 'Crystal Grotto', pal: 2, ores: { stone: 44, iron: 10, silver: 12, coal: 8, amethyst: 4, emerald: 2.5 },
    rooms: [[32, 8, 6, 3], [17, 15, 6, 4], [47, 15, 6, 4], [32, 25, 8, 5], [10, 31, 4, 4], [53, 30, 5, 4], [30, 41, 7, 4], [50, 45, 4, 3]],
    links: [{ a: 0, b: 1, w: 3 }, { a: 0, b: 2, w: 3 }, { a: 1, b: 3, w: 3 }, { a: 2, b: 3, w: 3 }, { a: 1, b: 4, w: 2 }, { a: 2, b: 5, w: 3 },
      { a: 3, b: 6, w: 3, ob: 'chasm' }, { a: 5, b: 7, w: 2, via: [[52, 38]] }, { a: 6, b: 1, w: 2, via: [[20, 32]], ob: 'boards' }],
    up: [32, 6], cart: [37, 9], down: [30, 44], chests: { a: [9, 31], b: [51, 46] },
    crystals: [[26, 22], [38, 22], [27, 28], [37, 28], [32, 21], [44, 13], [19, 12], [54, 28], [33, 39]],
    loot: { a: [['ore_amethyst', 3], ['ore_emerald', 2]], b: [['bar_silver', 3], ['money', 400]] }, fix: { bar: 'bar_iron' } },
  { n: 'Old Forge', pal: 3, ores: { stone: 40, iron: 12, silver: 10, gold: 8, coal: 10, ruby: 1.5 }, square: 1,
    rooms: [[32, 8, 6, 3], [14, 16, 6, 4], [50, 16, 6, 4], [32, 23, 9, 5], [9, 32, 4, 3], [50, 32, 6, 4], [32, 41, 8, 4], [57, 44, 3, 3]],
    links: [{ a: 0, b: 1, w: 3 }, { a: 0, b: 2, w: 3 }, { a: 1, b: 3, w: 3 }, { a: 2, b: 3, w: 3 }, { a: 1, b: 4, w: 2 }, { a: 2, b: 5, w: 3 },
      { a: 3, b: 6, w: 3, ob: 'rubble' }, { a: 5, b: 7, w: 2, via: [[57, 38]], ob: 'rubble' }, { a: 6, b: 5, w: 2, ob: 'boards' }],
    up: [32, 6], cart: [37, 9], down: [32, 44], chests: { a: [8, 32], b: [58, 45] },
    forges: [[26, 20], [38, 20]], anvils: [[29, 25], [35, 25]],
    loot: { a: [['bar_gold', 2], ['ore_ruby', 1]], b: [['money', 800], ['bar_iron', 4]] }, fix: { bar: 'bar_iron' } },
  { n: 'Deep Halls', pal: 4, ores: { stone: 36, iron: 8, silver: 8, gold: 10, coal: 6, amethyst: 3, emerald: 3, ruby: 2.5, sapphire: 2 },
    rooms: [[32, 8, 6, 3], [16, 17, 6, 5], [48, 17, 6, 5], [32, 29, 9, 6], [11, 39, 5, 4], [53, 39, 5, 4], [32, 45, 7, 4]],
    links: [{ a: 0, b: 1, w: 3 }, { a: 0, b: 2, w: 3 }, { a: 1, b: 3, w: 3 }, { a: 2, b: 3, w: 3 }, { a: 1, b: 4, w: 2, via: [[12, 30]], ob: 'chasm' },
      { a: 2, b: 5, w: 2, via: [[54, 30]], ob: 'rubble' }, { a: 3, b: 6, w: 3 }, { a: 6, b: 2, w: 2, via: [[44, 40], [46, 28]], ob: 'boards' }],
    up: [32, 6], cart: [37, 9], chests: { a: [11, 40], b: [54, 40], final: [32, 47] },
    pillars: [[27, 26], [37, 26], [27, 32], [37, 32]],
    loot: { a: [['ore_sapphire', 2], ['ore_ruby', 2]], b: [['bar_gold', 4], ['money', 1200]], final: [['money', 3000], ['ore_sapphire', 3], ['ore_ruby', 3], ['ore_emerald', 3]] }, fix: { bar: 'bar_gold' } },
];
const caveState = () => (state.caves = state.caves || { max: 0, carts: { 1: 1 }, short: {}, fixed: {}, loot: {}, seen: {} });
const OB_FIX = { bridge: { need: { wood: 15 }, msg: 'You lay new planks across the river.' }, chasm: { need: { fiber: 25, wood: 10 }, msg: 'You lash a rope bridge across the chasm.' } };
const needList = need => Object.entries(need).map(([k, n]) => `${n} ${ITEMS[k].n.toLowerCase()} (you have ${count(k)})`).join(', ');
const cartFix = sec => ({ wood: 20, stone: 15, [CAVES[sec].fix.bar]: 1 });

// ---------- building a section (same layout every game; rocks are new each day) ----------
function linePts(L, S) { const r = S.rooms; return [[r[L.a][0], r[L.a][1]], ...(L.via || []), [r[L.b][0], r[L.b][1]]] }
function along(pts, step = .4) {   // points along a bent line, with the direction at each
  const out = []; for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], d = Math.hypot(x1 - x0, y1 - y0) || 1;
    for (let s = 0; s < d; s += step) out.push([x0 + (x1 - x0) * s / d, y0 + (y1 - y0) * s / d, (x1 - x0) / d, (y1 - y0) / d]) }
  return out;
}
const inRoom = (S, x, y, pad = 1) => S.rooms.some(([cx, cy, rx, ry]) => S.square ? Math.max(Math.abs(x - cx) / rx, Math.abs(y - cy) / ry) <= pad : ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= pad);
const riverY = x => 27 + 2.2 * Math.sin(x * .2);
function genCave(sec) {
  const S = CAVES[sec], C = caveState(), day = state.totalDay; CAVE.sec = sec;
  const cached = CAVE_CACHE[sec];
  if (cached && cached.day === day) { World.ground = cached.ground; World.objs = cached.objs; World.soil = {}; World.pave = null; CAVE.river = cached.river; loadSeen(sec); return }
  const g = World.ground = new Uint8Array(W * H).fill(WATER), o = World.objs = new Array(W * H).fill(null); World.soil = {}; World.pave = null;
  const hz = (x, y) => hash(x + sec * 101, y + sec * 37), floor = (x, y) => { if (x > 1 && y > 1 && x < W - 2 && y < H - 2) g[idx(x, y)] = DIRT };
  // chambers
  for (const [cx, cy, rx, ry] of S.rooms) for (let y = cy - ry - 2; y <= cy + ry + 2; y++) for (let x = cx - rx - 2; x <= cx + rx + 2; x++) {
    const v = S.square ? Math.max(Math.abs(x - cx) / rx, Math.abs(y - cy) / ry) : ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (v <= 1 + (hz(x, y) - .5) * (S.square ? .15 : .5)) floor(x, y);
  }
  // tunnels
  for (const L of S.links) for (const [x, y] of along(linePts(L, S))) { const r = L.w / 2 + (hz(Math.round(x * 3), Math.round(y * 3)) - .5) * .5;
    for (let yy = Math.floor(y - r - 1); yy <= y + r + 1; yy++) for (let xx = Math.floor(x - r - 1); xx <= x + r + 1; xx++) if (Math.hypot(xx + .5 - x, yy + .5 - y) <= r) floor(xx, yy) }
  // the underground river runs right through the rock
  CAVE.river = new Set();
  if (S.river) for (let x = 0; x < W; x++) { const yc = riverY(x); for (let y = Math.floor(yc - 2); y <= yc + 2; y++) if (Math.abs(y + .5 - yc) <= 1.7) { g[idx(x, y)] = WATER; CAVE.river.add(idx(x, y)) } }
  // features
  const reserved = new Set(), keep = (x, y, r = 1.6) => { for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) reserved.add(idx(xx, yy)) };
  const put = (x, y, obj) => { o[idx(x, y)] = obj; keep(x + .5, y + .5) };
  if (sec === 1) put(S.up[0], S.up[1], { t: 'ladder_up' }); else put(S.up[0], S.up[1], { t: 'stairs_up' });
  if (S.down) put(S.down[0], S.down[1], { t: 'stairs_down' });
  put(S.cart[0], S.cart[1], { t: 'mcart', ok: C.carts[sec] ? 1 : 0 });
  for (const k in S.chests) { const [x, y] = S.chests[k]; put(x, y, { t: 'cchest', id: sec + k, open: C.loot[sec + k] ? 1 : 0, big: k === 'final' ? 1 : 0 }) }
  for (const [x, y] of S.crystals || []) put(x, y, { t: 'crystal', v: (x + y) % 3 });
  for (const [x, y] of S.forges || []) put(x, y, { t: 'oforge' });
  for (const [x, y] of S.anvils || []) put(x, y, { t: 'oanvil' });
  for (const [x, y] of S.pillars || []) put(x, y, { t: 'pillar' });
  for (const i of (C.torches || {})[sec] || []) if (g[i] === DIRT && !o[i]) { o[i] = { t: 'ctorch' }; reserved.add(i) }
  // obstacles, placed across their tunnel
  S.links.forEach((L, li) => {
    if (!L.ob) return; const id = `${sec}:${li}`, pts = along(linePts(L, S), .25);
    let at = Math.floor(pts.length / 2);
    if (L.ob === 'boards') { at = pts.findIndex(([x, y]) => !inRoom(S, x, y, 1.25)); at = Math.min(pts.length - 1, Math.max(0, at) + 6) }
    if (L.ob === 'bridge' || L.ford) {   // where the tunnel meets the river
      const wet = pts.filter(([x, y]) => CAVE.river.has(idx(Math.floor(x), Math.floor(y))));
      for (const [x, y] of wet) for (const dx of [0, 1]) { const i = idx(Math.floor(x) + dx, Math.floor(y)); if (!CAVE.river.has(i)) continue; reserved.add(i);
        if (L.ford) { g[i] = DIRT; CAVE.river.delete(i); o[i] = { t: 'ford' } } else o[i] = C.fixed[id] ? { t: 'cbridge' } : { t: 'bridge_broken', ob: id } }
      if (L.ob === 'bridge') return;
    }
    const [px, py, dx, dy] = pts[at], nx = -dy, ny = dx, cells = new Set();
    for (let s = -3.5; s <= 3.5; s += .25) for (const f of L.ob === 'chasm' ? [0, 1] : [0]) { const x = Math.floor(px + nx * s + dx * f), y = Math.floor(py + ny * s + dy * f); if (g[idx(x, y)] === DIRT) cells.add(idx(x, y)) }
    for (const i of cells) { reserved.add(i); for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) reserved.add(i + ax + ay * W);
      if (L.ob === 'rubble') { if (!C.fixed[id]) o[i] = { t: 'rubble', ob: id, v: i % 3 } }
      else if (L.ob === 'chasm') o[i] = C.fixed[id] ? { t: 'rbridge', vert: Math.abs(dy) > Math.abs(dx) ? 1 : 0 } : { t: 'chasm', ob: id };
      else if (L.ob === 'boards') { if (!C.short[id]) o[i] = { t: 'boards', ob: id, px, py, dx, dy, side: L.a } }
    }
  });
  // rocks and ore: thick in the chambers, sparse in the tunnels, different every day
  const R = mulberry(sec * 7919 + day * 13), mix = S.ores, tot = Object.values(mix).reduce((a, b) => a + b, 0);
  const pick = () => { let r = R() * tot; for (const k in mix) { r -= mix[k]; if (r <= 0) return k } return 'stone' };
  for (let i = 0; i < W * H; i++) { if (g[i] !== DIRT || o[i] || reserved.has(i)) continue; const x = i % W, y = Math.floor(i / W);
    if (R() < (inRoom(S, x + .5, y + .5) ? .15 : .05)) o[i] = { t: 'node', k: pick() } }
  CAVE_CACHE[sec] = { day, ground: g, objs: o, river: CAVE.river }; loadSeen(sec);
}

// ---------- getting around ----------
async function enterMine() { if (SINAI.entering) return; SINAI.entering = 1; await goSection(1, 'top'); SINAI.entering = 0 }
async function goSection(sec, how) {
  const S = CAVES[sec], C = caveState(); saveSeen(); genCave(sec); storeMap('mine');
  const first = sec > (C.max || 0); C.max = Math.max(C.max || 0, sec); state.mineMax = Math.max(state.mineMax || 0, C.max); state.mineFloor = sec;
  const at = how === 'top' || how === 'up' ? [S.up[0] + .5, S.up[1] + 1.8] : how === 'down' ? [S.down[0] + .5, S.down[1] + 1.8] : [S.cart[0] + .5, S.cart[1] + 1.8];
  await travel('mine', at[0], at[1], 's');
  if (first && sec > 1) setTimeout(() => toast(`You found the ${S.n}!`), 900);
  if (first && sec === 1) setTimeout(() => say('The Sinai Caverns. Tunnels wind off in every direction. The old mine cart here still runs on its rails: repair the stations you find deeper down, and you can ride straight back.'), 900);
  if (!C.starter) { C.starter = 1; setTimeout(() => { addItem('cavetorch', 10); note('cavetorch', 10); say('It’s dark down here. Someone left a bundle of torches by the ladder. Place them to light your way: they stay lit even after you leave. You can make more at your workbench.') }, first ? 4200 : 900) }
}
const caveName = () => `Sinai Caverns · ${CAVES[CAVE.sec].n}`;
async function caveAction(r) {
  const o = r.o, S = CAVES[CAVE.sec], C = caveState(), sec = CAVE.sec;
  switch (o.t) {
    case 'ladder_up': { const v = await say('Climb back up to Mount Sinai?', [['Climb up', 1], ['Keep exploring', 0]]); if (v) { saveSeen(); await travel('sinai', 33, 12.7, 's') } return true }
    case 'stairs_up': { const v = await say(`Go back up to the ${CAVES[sec - 1].n}?`, [['Go up', 1], ['Stay', 0]]); if (v) await goSection(sec - 1, 'down'); return true }
    case 'stairs_down': { sfx.tap(); await goSection(sec + 1, 'up'); return true }
    case 'mcart': {
      if (!o.ok) {
        const need = cartFix(sec), has = Object.entries(need).every(([k, n]) => count(k) >= n);
        const v = await say(`A mine-cart station, but the rails are broken. Fixing it takes ${needList(need)}. ${has ? 'You have everything!' : 'Bring the rest and tap it again.'} Then you can ride between stations.`, has ? [['Fix it', 1], ['Not now', 0]] : [['OK', 0]]);
        if (v) { for (const [k, n] of Object.entries(need)) takeItem(k, n); o.ok = 1; C.carts[sec] = 1; sfx.chop(); setTimeout(() => sfx.pick(), 200); toast('The station is working! Ride it from any other station.'); updateHUD(); save() }
        return true;
      }
      const stops = Object.keys(C.carts).map(Number).filter(s => s !== sec && s <= (C.max || 1)).sort();
      if (!stops.length) { say('The mine cart is ready to roll, but there’s no other working station yet. Fix the stations you find deeper in the caverns.'); return true }
      const v = await say('Hop in the mine cart. Where to?', stops.map(s => [s === 1 ? 'Entrance' : CAVES[s].n, s]).concat([['Stay', 0]]));
      if (v) { sfx.swish(); await goSection(v, 'cart') } return true;
    }
    case 'boards': say(boardsSide(o) ? 'Old boards, nailed shut from this side. Your axe would knock them out.' : 'The passage is boarded up from the other side.'); return true;
    case 'bridge_broken': case 'chasm': {
      const F = OB_FIX[o.t === 'chasm' ? 'chasm' : 'bridge'], list = needList(F.need), has = Object.entries(F.need).every(([k, n]) => count(k) >= n);
      const v = await say((o.t === 'chasm' ? `A deep chasm cuts across the tunnel. A rope bridge takes ${list}.` : `The old bridge has rotted away. New planks take ${list}.`) + (has ? ' You have everything!' : ' Bring the rest and tap it again.'), has ? [['Build it', 1], ['Not now', 0]] : [['OK', 0]]);
      if (v) { for (const [k, n] of Object.entries(F.need)) takeItem(k, n); C.fixed[o.ob] = 1; fixObstacle(o.ob, o.t); sfx.chop(); toast(F.msg); updateHUD(); save() }
      return true;
    }
    case 'cchest': {
      if (o.open) { say('Empty. Someone found this already: you!'); return true }
      const L = S.loot[o.id.slice(1)] || []; o.open = 1; C.loot[o.id] = 1; sfx.pop(); tone(660, .1, 'triangle', .04); tone(880, .14, 'triangle', .04, .1);
      for (const [k, n] of L) { if (k === 'money') { state.money += n; toast(`+₪${n}`) } else { addItem(k, n); note(k, n); if (k.startsWith('relic_')) foundRelic(k.slice(6)) } }
      if (o.big) setTimeout(() => say('At the very bottom of the caverns, an old chest wrapped in linen. Whoever hid it here long ago left it for someone patient enough to find it.'), 600);
      updateHUD(); save(); return true;
    }
    case 'crystal': toast('The crystals hum with a soft light.'); return true;
    case 'oforge': say('An ancient smelting furnace, cold for centuries. Soot still darkens the stones.'); return true;
    case 'oanvil': say('An old anvil, worn smooth by hammers long ago.'); return true;
    case 'pillar': toast('A huge carved pillar holds up the ceiling.'); return true;
    case 'minecart': say('An old minecart, still full of rubble.'); return true;
    case 'ctorch': { if (!roomFor('cavetorch')) { toast('Your bag is full.'); sfx.no(); return true } World.place(r.x, r.y, null); setTorch(sec, idx(r.x, r.y), false); addItem('cavetorch', 1); sfx.pick(); updateHUD(); return true }
  }
  return false;
}
function fixObstacle(id, t) {
  World.objs.forEach((o, i) => { if (o && o.ob === id) World.objs[i] = t === 'chasm' ? { t: 'rbridge', vert: World.objs[i - W] && World.objs[i - W].ob === id ? 1 : 0 } : t === 'bridge_broken' ? { t: 'cbridge' } : null });
}
// boards can only be broken from the deep side of the tunnel
function boardsSide(o) { return (player.x - o.px) * o.dx + (player.y - o.py) * o.dy < 0 }
function boardsBroken(o) {
  const C = caveState(); C.short[o.ob] = 1; World.objs.forEach((q, i) => { if (q && q.ob === o.ob) World.objs[i] = null });
  sfx.fall(); toast('You broke through! A shortcut back toward the start of this section.'); save();
}
function rubbleCleared(o) { if (!World.objs.some(q => q && q.ob === o.ob)) { caveState().fixed[o.ob] = 1; toast('The way is clear!'); save() } }

// ---------- what you've explored ----------
function loadSeen(sec) { const s = caveState().seen[sec]; CAVE.seen = new Uint8Array(W * H); CAVE.seenSec = sec; if (s) for (let i = 0; i < s.length; i++) CAVE.seen[i] = s.charCodeAt(i) - 48 }
function saveSeen() { if (!CAVE.seen || !state || !CAVE.seenSec) return; caveState().seen[CAVE.seenSec] = String.fromCharCode(...CAVE.seen.map(v => v + 48)) }
function markSeen() {
  if (World.cur !== 'mine' || !CAVE.seen) return; const px = Math.floor(player.x), py = Math.floor(player.y);
  for (let y = py - 5; y <= py + 5; y++) for (let x = px - 6; x <= px + 6; x++) if (inb(x, y) && (x - px) ** 2 + (y - py) ** 2 <= 34) CAVE.seen[idx(x, y)] = 1;
}
setInterval(() => { if (typeof state !== 'undefined' && state && World.cur === 'mine') { markSeen(); saveSeen() } }, 600);

// ---------- drawing ----------
const CAVE_PAL = [
  { floor: ['#4a3628', '#433024', '#53402f'], face: ['#5e4636', '#6e5442', '#3a2a20'], top: '#2a1e17' },   // Upper Tunnels
  { floor: ['#3c4048', '#363a42', '#454a53'], face: ['#555b66', '#666d79', '#30343b'], top: '#1f2228' },   // Underground River
  { floor: ['#3a3450', '#342e48', '#443d5c'], face: ['#4e4670', '#61588a', '#2c2640'], top: '#1c1828' },   // Crystal Grotto
  { floor: ['#4a2a28', '#432422', '#553230'], face: ['#6a3a32', '#7e4a3e', '#3a1e1a'], top: '#24120f' },   // Old Forge
  { floor: ['#2c4040', '#273a3a', '#334a4a'], face: ['#3e5a58', '#4c6e6a', '#203230'], top: '#141f1f' },   // Deep Halls
];
function drawMine(g, x0, y0, x1, y1, t) {
  const P = CAVE_PAL[CAVES[CAVE.sec].pal];
  g.fillStyle = '#080605'; g.fillRect(x0 * 16, y0 * 16, (x1 - x0 + 1) * 16, (y1 - y0 + 1) * 16);
  const fl = (x, y) => inb(x, y) && World.ground[idx(x, y)] === DIRT, riv = (x, y) => inb(x, y) && CAVE.river.has(idx(x, y));
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
    const X = x * 16, Y = y * 16, h = hash(x, y);
    if (riv(x, y)) {   // dark water, slowly flowing
      g.fillStyle = '#10283c'; g.fillRect(X, Y, 16, 16); g.fillStyle = '#1a3a54';
      for (let k = 0; k < 3; k++) { const ox = ((x * 16 + k * 37 + t * 9) % 16 + 16) % 16; g.fillRect(X + ox, Y + 3 + k * 5, 4, 1) }
      if (!riv(x, y - 1) && !fl(x, y - 1)) { g.fillStyle = P.top; g.fillRect(X, Y, 16, 3) } else if (fl(x, y - 1)) { g.fillStyle = 'rgba(140,190,220,.35)'; g.fillRect(X, Y, 16, 1) }
    } else if (fl(x, y)) {
      g.fillStyle = P.floor[h > .7 ? 2 : h > .35 ? 1 : 0]; g.fillRect(X, Y, 16, 16);
      for (let k = 0; k < 3; k++) { const hh = hash(x * 7 + k, y * 3 - k); g.fillStyle = hh > .5 ? P.floor[2] : P.floor[1]; g.fillRect(X + (hh * 97 % 14 | 0), Y + (hh * 31 % 14 | 0), 2, 1) }
    } else if (fl(x, y + 1) || riv(x, y + 1)) {        // a rock wall facing you
      g.fillStyle = P.face[0]; g.fillRect(X, Y, 16, 16); g.fillStyle = P.face[1]; g.fillRect(X, Y + 2, 16, 2); g.fillRect(X + (h * 9 | 0), Y + 7, 6, 1); g.fillStyle = P.face[2]; g.fillRect(X, Y + 14, 16, 2); g.fillRect(X + (h * 13 | 0), Y + 9, 1, 5);
      g.fillStyle = P.top; g.fillRect(X, Y, 16, 2);
    } else if (fl(x - 1, y) || fl(x + 1, y) || fl(x, y - 1) || fl(x + 1, y + 1) || fl(x - 1, y + 1) || riv(x - 1, y) || riv(x + 1, y)) {
      g.fillStyle = P.top; g.fillRect(X, Y, 16, 16); g.fillStyle = P.face[2];
      if (fl(x - 1, y)) g.fillRect(X, Y, 2, 16); if (fl(x + 1, y)) g.fillRect(X + 14, Y, 2, 16); if (fl(x, y - 1)) g.fillRect(X, Y, 16, 2);
    }
  }
}
function drawCaveObj(g, o, x, y, t) {
  const X = x * 16, Y = y * 16, cx = X + 8, B = Y + 15, ink = '#1a100a', R = (c, a, b, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(X + a, Y + b, w, h) };
  const WD = ['#5a3020', '#8a5232', '#b8784a', '#e0a870'], ST = ['#4e4a46', '#6e6a66', '#8e867c', '#b4ac9f'];
  switch (o.t) {
    case 'stairs_down':   // steps carved down into the dark
      R(ink, 0, 1, 16, 15); for (let k = 0; k < 5; k++) { const c = 70 - k * 13; R(`rgb(${c + 30},${c + 18},${c + 8})`, 1 + k, 2 + k * 3, 14 - k * 2, 2); R('#050302', 1 + k, 4 + k * 3, 14 - k * 2, 1) }
      R('#050302', 6, 14, 4, 2); break;
    case 'stairs_up':
      g.fillStyle = 'rgba(255,240,200,.12)'; g.beginPath(); g.moveTo(X + 2, Y - 26); g.lineTo(X + 14, Y - 26); g.lineTo(X + 16, B); g.lineTo(X, B); g.fill();
      R(ink, 0, 0, 16, 16); for (let k = 0; k < 5; k++) { const c = 150 - k * 18; R(`rgb(${c},${c - 14},${c - 30})`, 5 - k, 13 - k * 3, 6 + k * 2, 2); R('rgba(0,0,0,.35)', 5 - k, 15 - k * 3, 6 + k * 2, 1) } break;
    case 'mcart': {
      R('rgba(0,0,0,.3)', -4, 13, 24, 3);
      for (const yy of [9, 14]) { R(ink, -6, yy - 1, 28, 3); R(o.ok ? '#9aa0aa' : '#6a5a50', -6, yy, 28, 1) }                               // rails
      for (let k = 0; k < 4; k++) { R(ink, -4 + k * 7, 8, 3, 8); R(WD[1], -3 + k * 7, 9, 1, 6) }                                                // ties
      if (!o.ok) R('#050302', 12, 8, 6, 8);   // broken: a gap in the rails
      const s = AT.minecart[0]; g.save(); if (!o.ok) { g.translate(cx - 2, B - 2); g.rotate(-.25); g.drawImage(s, -s.width / 2, -s.height + 3) } else g.drawImage(s, Math.round(cx - s.width / 2), B - s.height + 1); g.restore();
      R(ink, 18, -14, 3, 29); R(WD[1], 19, -13, 1, 28); R(ink, 16, -17, 7, 5); R(o.ok ? '#ffd860' : '#3a3030', 17, -16, 5, 3);   // lantern post
      break;
    }
    case 'rubble': {
      const rk = (a, b, r, c) => { g.fillStyle = ink; g.beginPath(); g.arc(X + a, Y + b, r + 1, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(X + a, Y + b, r, 0, 7); g.fill(); g.fillStyle = ST[3]; g.fillRect(X + a - 1, Y + b - r + 1, 2, 1) };
      const sh = o.shake > 0 ? Math.sin(t * 60) * 1.2 : 0; g.save(); g.translate(sh, 0);
      rk(4, 11, 4, ST[1]); rk(12, 12, 4, ST[2]); rk(8, 6, 4, ST[2]); rk(13, 5, 2.5, ST[1]); R(WD[0], 1, 13, 5, 1); g.restore(); break;
    }
    case 'boards':
      R(ink, 0, -10, 16, 26); for (let k = 0; k < 4; k++) { R(k % 2 ? WD[1] : WD[2], 1 + k * 4, -9, 3, 24); R(WD[0], 3 + k * 4, -9, 1, 24) }
      for (const yy of [-6, 6]) { R(ink, 0, yy, 16, 3); R(WD[1], 0, yy + 1, 16, 1) } for (const [a, b] of [[2, -5], [13, -5], [2, 7], [13, 7]]) R('#c0c0cc', a, b, 1, 1); break;
    case 'bridge_broken':
      for (const a of [1, 13]) { R(ink, a, 0, 3, 16); R(WD[0], a + 1, 1, 1, 14) } R(ink, 3, 6, 6, 3); R(WD[1], 3, 7, 5, 1); R(ink, 9, 9, 4, 2); break;
    case 'cbridge':
      for (const a of [0, 14]) { R(ink, a, 0, 2, 16); R(WD[0], a, 0, 1, 16) } for (let k = 0; k < 4; k++) { R(ink, 1, k * 4, 14, 4); R(WD[2], 2, k * 4 + 1, 12, 2); R(WD[3], 2, k * 4 + 1, 12, 1) } break;
    case 'ford': for (const [a, b] of [[2, 3], [9, 6], [4, 11]]) { R(ink, a, b, 6, 4); R(ST[2], a + 1, b + 1, 4, 2); R(ST[3], a + 1, b + 1, 3, 1) } break;
    case 'chasm': R('#030202', 0, 0, 16, 16); R('#1a120c', 0, 0, 16, 2); R('rgba(255,255,255,.03)', 3, 6, 10, 1); break;
    case 'rbridge':
      R('#030202', 0, 0, 16, 16);
      if (o.vert) { for (const a of [2, 13]) R('#c8a060', a, 0, 1, 16); for (let k = 0; k < 4; k++) { R(ink, 3, k * 4, 10, 3); R(WD[2], 3, k * 4 + 1, 10, 1) } }
      else { for (const b of [3, 12]) R('#c8a060', 0, b, 16, 1); for (let k = 0; k < 4; k++) { R(ink, k * 4, 4, 3, 8); R(WD[2], k * 4 + 1, 4, 1, 8) } } break;
    case 'cchest': { const s = AT.chest[0]; g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(cx, B, 8, 2.5, 0, 0, 7); g.fill();
      if (o.big) { g.save(); g.translate(cx, B); g.scale(1.35, 1.35); g.drawImage(s, -s.width / 2, -s.height); g.restore() } else g.drawImage(s, Math.round(cx - s.width / 2), B - s.height);
      if (o.open) { R('#1a100a', 3, 5, 10, 2) } else if (Math.sin(t * 2.5 + x) > .75) { R('#fff4c0', 12, 1, 1, 3); R('#fff4c0', 11, 2, 3, 1) } break }
    case 'crystal': {
      const cols = [['#7a4ad0', '#b88aff', '#e8d8ff'], ['#2a8ad0', '#7ac8ff', '#d8f0ff'], ['#2ab08a', '#7af0c8', '#d8fff0']][o.v || 0];
      for (const [a, h, w] of [[3, 12, 3], [7, 17, 4], [11, 10, 3]]) { R(ink, a - 1, 15 - h, w + 2, h + 1); R(cols[0], a, 16 - h, w, h - 1); R(cols[1], a, 16 - h, 1, h - 2); R(cols[2], a + (w > 3 ? 1 : 0), 16 - h, 1, 1) }
      if (Math.sin(t * 2 + x * 3) > .6) { R('#ffffff', 8, -3, 1, 3); R('#ffffff', 7, -2, 3, 1) } break;
    }
    case 'oforge':
      R(ink, -1, -12, 18, 28); R(ST[1], 0, -11, 16, 26); for (const [yy, off] of [[-11, 0], [-5, 4], [1, 0], [7, 4]]) { R(ST[2], 0, yy, 16, 1); for (let xx = 2 + off; xx < 15; xx += 8) R(ST[0], xx, yy + 1, 1, 5) }
      R(ink, 3, 3, 10, 9); R('#1a0a06', 4, 4, 8, 8); R(`rgba(255,${110 + Math.sin(t * 3 + x) * 30 | 0},40,.55)`, 5, 9, 6, 3); R(ink, 5, -16, 6, 5); R(ST[0], 6, -15, 4, 4); break;
    case 'oanvil': R(ink, 3, 9, 10, 7); R(WD[0], 4, 10, 8, 6); R(ink, 0, 3, 16, 7); R('#4a4a54', 1, 4, 14, 4); R('#8a8a96', 1, 4, 14, 1); R(ink, 4, 7, 7, 3); break;
    case 'ctorch': drawCaveTorch(g, x, y, t); break;
    case 'pillar':
      R('rgba(0,0,0,.3)', -2, 13, 20, 3); R(ink, 1, -26, 14, 42); R(ST[2], 2, -25, 12, 40); R(ST[3], 3, -25, 2, 40); R(ST[1], 11, -25, 2, 40);
      R(ink, -1, -29, 18, 5); R(ST[3], 0, -28, 16, 3); R(ink, -1, 11, 18, 5); R(ST[2], 0, 12, 16, 3); for (const yy of [-16, -4]) R(ST[1], 2, yy, 12, 1); break;
  }
}
// a soft light from crystals, working stations and the old forges
function caveLight(o, x, y, lamp) {
  if (o.t === 'crystal') lamp(x + .5, y + .2, 44, .7); else if (o.t === 'mcart' && o.ok) lamp(x + 1.6, y - .7, 40, .75); else if (o.t === 'oforge') lamp(x + .5, y + .5, 30, .5);
  else if (o.t === 'stairs_up' || o.t === 'ladder_up') lamp(x + .5, y - .5, 50, .7);
  else if (o.t === 'ctorch') lamp(x + .5, y + .1, 78, .96);
}

// ---------- the cave map (fills in as you explore) ----------
let caveMapSec = 0;
function caveMapTab(b) {
  const C = caveState(), here = CAVE.sec, sec = caveMapSec || here, S = CAVES[sec]; caveMapSec = sec; saveSeen();
  const seen = CAVE.seenSec === sec && CAVE.seen ? CAVE.seen : (() => { const s = C.seen[sec] || '', a = new Uint8Array(W * H); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) - 48; return a })();
  if (sec !== here) genCave(sec);   // build the layout to draw it
  const ground = World.ground, objs = World.objs, river = CAVE.river;
  let h = `<div class="mapbtns">`; for (let s = 1; s <= Math.max(1, C.max || 1); s++) h += `<button class="btn ${s === sec ? '' : 'alt'}" data-cs="${s}">${CAVES[s].n}</button>`;
  h += `<button class="btn alt" data-cs="world">World map</button></div><div class="mapwrap"><div class="mapinner cavemap"></div></div>
    <div class="mapkey"><span><i class="kd you"></i>You</span><span>🚃 Station</span><span>📦 Chest</span><span>⬇ Way down</span></div>
    <p class="muted" style="margin:4px 2px 0">The map fills in as you explore. ${C.carts[sec] ? 'This section’s mine-cart station is working.' : 'Fix this section’s mine-cart station to ride straight here.'}</p>`;
  b.innerHTML = h;
  const c = document.createElement('canvas'); c.width = W * 4; c.height = H * 4; c.className = 'mapart'; const g = c.getContext('2d'); const pal = CAVE_PAL[S.pal];
  g.fillStyle = '#0c0a08'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < W * H; i++) { if (!seen[i]) continue; const x = i % W, y = (i / W) | 0;
    g.fillStyle = river.has(i) ? '#24587e' : ground[i] === DIRT ? pal.floor[2] : pal.top; g.fillRect(x * 4, y * 4, 4, 4);
    const o = objs[i]; if (o && ground[i] === DIRT) { const col = { ctorch: '#ffb030', rubble: '#9a948a', boards: '#b8784a', chasm: '#000', rbridge: '#c8a060', crystal: '#b88aff', pillar: '#b4ac9f' }[o.t]; if (col) { g.fillStyle = col; g.fillRect(x * 4, y * 4, 4, 4) } } }
  const inner = b.querySelector('.mapinner'); inner.appendChild(c);
  const pos = (x, y) => `left:${x / W * 100}%;top:${y / H * 100}%`, lab = (html, x, y, cls = 'sm') => inner.insertAdjacentHTML('beforeend', `<div class="mlab ${cls}" style="${pos(x, y)}">${html}</div>`);
  const seenAt = (x, y) => seen[idx(x, y)];
  if (seenAt(S.cart[0], S.cart[1])) lab(`🚃 ${C.carts[sec] ? 'Station' : 'Broken station'}`, S.cart[0] + 1, S.cart[1] - 1.2);
  if (seenAt(S.up[0], S.up[1])) lab(sec === 1 ? '⬆ To Mount Sinai' : `⬆ ${CAVES[sec - 1].n}`, S.up[0] + .5, S.up[1] - 1.2);
  if (S.down && seenAt(S.down[0], S.down[1])) lab(`⬇ ${CAVES[sec + 1].n}`, S.down[0] + .5, S.down[1] + 2.2);
  for (const k in S.chests) { const [x, y] = S.chests[k]; if (seenAt(x, y)) lab(C.loot[sec + k] ? '▫ Empty chest' : '📦 Chest', x + .5, y - 1) }
  if (sec === here && World.cur === 'mine') inner.insertAdjacentHTML('beforeend', `<div class="pin" style="${pos(player.x, player.y)}"><b></b><span>You</span></div>`);
  if (sec !== here) genCave(here);   // put the section you're in back
  b.querySelectorAll('[data-cs]').forEach(el => el.onclick = () => { sfx.tap(); if (el.dataset.cs === 'world') { caveMapSec = 0; mapTab(b, 'sinai') } else { caveMapSec = +el.dataset.cs; caveMapTab(b) } });
}

// older saves counted mine floors: turn that into how deep into the caverns you've been
function migrateCaves() {
  if (state.caves) return; const f = state.mineMax || 0, C = caveState();
  C.max = f >= 15 ? 4 : f >= 10 ? 3 : f >= 5 ? 2 : f >= 1 ? 1 : 0; state.mineMax = C.max;
  if (f >= 1) setTimeout(() => say('The old Sinai Mines have opened up into the Sinai Caverns: a winding cave system with five sections to explore. You can get straight back to the deepest section you reached once you fix its mine-cart station.'), 2400);
}

// ---------- cave fish: only in the underground river ----------
Object.assign(FISH, {
  loach: { n: 'Cave Loach', price: 45, diff: 2, where: ['cave'], w: 10, lb: [.1, .5] },
  cavefish: { n: 'Blind Cavefish', price: 72, diff: 2, where: ['cave'], w: 7, lb: [.2, 1.2] },
  glowfin: { n: 'Glowfin', price: 140, diff: 3, where: ['cave'], w: 2.5, lb: [.5, 3] },
  ghosteel: { n: 'Ghost Eel', price: 260, diff: 4, where: ['cave'], w: 1, night: true, lb: [2, 9] },
});
// a legendary fish for the farm pond: only in spring, and very rare
FISH.goldcarp = { n: 'Golden Carp', price: 600, diff: 5, where: ['pond'], w: .3, seasons: [0], lb: [4, 22] };
WHERE.cave = 'the underground river in the Sinai Caverns'; FISH.sandal.where.push('cave');

// ---------- ancient relics: rare finds in the caverns, for the church treasury ----------
// r: how often it turns up (higher = more common)
const RELICS = {
  shard: { n: 'Pottery Shard', sec: 1, r: 3, price: 40, d: 'A piece of a painted clay jar, thousands of years old.' },
  oillamp: { n: 'Clay Oil Lamp', sec: 1, r: 2, price: 80, d: 'A small clay lamp. “Your word is a lamp to my feet.”' },
  mite: { n: 'Bronze Coin', sec: 1, r: 3, price: 60, d: 'A tiny bronze coin, like the widow’s two mites.' },
  jarhandle: { n: 'Stamped Jar Handle', sec: 2, r: 3, price: 100, d: 'A jar handle pressed with an old royal seal.' },
  seal: { n: 'Stone Seal', sec: 2, r: 1, price: 150, d: 'A carved stone seal once used to sign letters in clay.' },
  hook: { n: 'Bronze Fishhook', sec: 2, r: 2, price: 90, d: 'An ancient fishhook. Some things never change.' },
  scroll: { n: 'Scroll Fragment', sec: 3, r: 1, price: 250, d: 'A scrap of parchment covered in faded writing.' },
  shofar: { n: 'Ram’s Horn', sec: 3, r: 2, price: 220, d: 'An old shofar, a trumpet made from a ram’s horn.' },
  shekel: { n: 'Silver Shekel', sec: 4, r: 2, price: 300, d: 'A silver coin, heavy and still bright.' },
  bell: { n: 'Golden Bell', sec: 4, r: 1, price: 400, d: 'A little golden bell, like those sewn on the hem of a priest’s robe.' },
  onyx: { n: 'Engraved Onyx', sec: 5, r: 1, price: 500, d: 'A black onyx stone engraved with names, set in gold.' },
  tablet: { n: 'Stone Tablet Fragment', sec: 5, r: .3, price: 800, d: 'A broken piece of a stone tablet, found deep beneath Mount Sinai.' },
};
const RELIC_REWARDS = [[3, 'money', 500], [6, 'decor_relicase', 1], [9, 'money', 2000], [12, 'decor_stainedglass', 1]];
function relicItems() { const o = {}; for (const k in RELICS) o['relic_' + k] = { n: RELICS[k].n, icon: 'relic_' + k, price: RELICS[k].price, relic: k, d: RELICS[k].d + ' Elder Simeon would love to see this.' }; return o }
const relicState = () => { const r = state.relics = state.relics || { given: {}, rewards: {} }; r.found = r.found || Object.assign({}, r.given); return r };
const foundRelic = k => { relicState().found[k] = 1 };
// chests hold one too
CAVES[1].loot.a.push(['relic_oillamp', 1]); CAVES[2].loot.a.push(['relic_seal', 1]); CAVES[3].loot.a.push(['relic_scroll', 1]);
CAVES[4].loot.a.push(['relic_bell', 1]); CAVES[5].loot.final.push(['relic_tablet', 1]);
// breaking rocks in the caverns now and then turns up a relic from this section or one above it
function maybeRelic(o, cx, cy) {
  if (World.cur !== 'mine' || Math.random() > (o.k === 'stone' ? .006 : .016)) return;
  const R = relicState(), pool = Object.keys(RELICS).filter(k => RELICS[k].sec <= CAVE.sec).map(k => [k, RELICS[k].r * (RELICS[k].sec === CAVE.sec ? 2 : 1)]);
  let r = Math.random() * pool.reduce((a, p) => a + p[1], 0); let k = pool[0][0]; for (const [q, w] of pool) { r -= w; if (r <= 0) { k = q; break } }
  drop('relic_' + k, 1, cx, cy); foundRelic(k); toast('Something old glints in the rubble…'); tone(523, .08, 'triangle', .04); tone(784, .12, 'triangle', .04, .09);
}
const newRelics = () => state.inv.filter(s => s && ITEMS[s.id].relic && !relicState().given[ITEMS[s.id].relic]);
function donateRelics() {
  const R = relicState(), got = [];
  for (const s of newRelics()) { const k = ITEMS[s.id].relic; if (R.given[k]) continue; R.given[k] = 1; got.push(k); takeItem(s.id, 1) }
  if (!got.length) return 0;
  const f = (state.friends = state.friends || {}).simeon || (state.friends.simeon = { pts: 0, last: 0, met: 1 }); f.pts = Math.min(200, f.pts + 10 * got.length);
  const n = Object.keys(R.given).length;
  for (const [at, item, amt] of RELIC_REWARDS) if (n >= at && !R.rewards[at]) { R.rewards[at] = 1;
    if (item === 'money') { state.money += amt; setTimeout(() => toast(`Elder Simeon gives you ₪${amt} from the church for your help!`), 700) }
    else { addItem(item, amt); note(item, amt); setTimeout(() => toast(`Elder Simeon gives you a ${ITEMS[item].n}!`), 700) } }
  sfx.pick(); updateHUD(); save(); return got.length;
}
function openTreasury() { menuOpen = true; boxMode = 'treasury'; $('#binM .ttl').textContent = 'Church Treasury'; $('#binM').classList.add('on'); sfx.tap(); renderTreasury() }
function renderTreasury() {
  const R = relicState(), b = $('#binM .mbody'), n = Object.keys(R.given).length, carry = newRelics();
  let h = `<p class="muted" style="margin:0 0 8px">Ancient things found in the Sinai Caverns, kept safe by the church. <b>${n} of 12</b> donated.</p>`;
  if (carry.length) h += `<div style="text-align:center;margin-bottom:8px"><button class="btn" id="donate">Donate ${carry.length} relic${carry.length > 1 ? 's' : ''}</button></div>`;
  h += '<div class="relicgrid">';
  for (const k in RELICS) { const r = RELICS[k], has = R.given[k], held = carry.some(s => ITEMS[s.id].relic === k);
    h += `<div class="relic ${has ? 'got' : held ? 'held' : ''}"><img class="${has || held ? '' : 'sil'}" src="${iconURL('relic_' + k)}"><b>${has || held ? r.n : '???'}</b><small>${has ? 'In the treasury' : held ? 'In your bag' : 'Found in the ' + CAVES[r.sec].n}</small></div>` }
  h += '</div><div class="h3">Thank-you gifts</div>';
  for (const [at, item, amt] of RELIC_REWARDS) h += `<div class="rrow ${R.rewards[at] ? 'done' : ''}"><span>${at} relics</span><span>${item === 'money' ? '₪' + amt.toLocaleString() : ITEMS[item].n}</span><span>${R.rewards[at] ? '✓' : ''}</span></div>`;
  b.innerHTML = h; const d = $('#donate'); if (d) d.onclick = () => { const k = donateRelics(); if (k) toast(`Thank you! ${k} relic${k > 1 ? 's' : ''} added to the treasury.`); renderTreasury() };
}
async function simeonRelics() {
  if (!newRelics().length) return;
  const n = npcs.find(q => q.v.id === 'simeon');
  const v = await say('Is that… an ancient relic? Things like that belong to all of us. Would you place it in the church treasury? I’ll keep it safe.', [['Donate', 1], ['Not yet', 0]], n ? { name: n.v.name, frames: n.frames } : null);
  if (v) { const k = donateRelics(); if (k) { toast(`${k} relic${k > 1 ? 's' : ''} added to the treasury.`); setTimeout(openTreasury, 500) } }
}
// the thank-you decorations
DECOR.relicase = { n: 'Relic Display Case', craft: 1, need: {}, fee: 0, d: 'A glass case for showing off ancient finds.' };
DECOR.stainedglass = { n: 'Stained Glass Window', craft: 1, need: {}, fee: 0, d: 'A freestanding window of coloured glass, a gift from the church.', light: [40, .55] };
function drawCaveDecor(g, k, cx, by, t) {
  const P = (c, a, b, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(cx + a), Math.round(by + b), w, h) }, INK = '#2a1e18';
  if (k === 'relicase') {
    P(INK, -9, -8, 18, 8); P('#8a5232', -8, -7, 16, 7); P('#b8784a', -8, -7, 16, 1);
    P(INK, -9, -22, 18, 15); P('rgba(190,230,255,.35)', -8, -21, 16, 13); P('rgba(255,255,255,.7)', -7, -20, 1, 10);
    P('#b8582e', -5, -12, 4, 3); P('#e08a52', -5, -12, 2, 1); P('#e0b030', 2, -13, 3, 4); P('#fff0a0', 2, -13, 1, 1); P('#9aa0aa', -2, -18, 3, 3);
    P(INK, -9, -23, 18, 2); P('#b8784a', -8, -23, 16, 1);
  } else if (k === 'stainedglass') {
    for (const a of [-9, 7]) { P(INK, a, -2, 3, 2) } P(INK, -8, -30, 16, 29); P('#8a5232', -7, -29, 14, 27);
    const pane = [['#c03a3a', '#e8c040', '#3a6ac0'], ['#3aa06a', '#f4f0e0', '#9a4ac0'], ['#3a6ac0', '#e8c040', '#c03a3a']];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const lit = Math.sin(t * 1.3 + r + c) > .6; P(pane[r][c], -6 + c * 4, -28 + r * 8, 3, 7); if (lit) P('rgba(255,255,255,.35)', -6 + c * 4, -28 + r * 8, 1, 7) }
    P('#f4f0e0', -1, -28, 2, 23); P('#f4f0e0', -5, -21, 10, 2);   // a cross through the middle
  }
}

// ---------- icons: cave fish, relics, gifts ----------
function caveIcons() {
  const mk = (k, f) => { const c = mkc(16, 16), g = c.getContext('2d'), R = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h) }; f(R, g); AT[k] = [c] };
  const I = '#1a1420';
  const fish = (R, body, belly, fin, eye, long) => {
    const L = long ? 13 : 10, x0 = long ? 1 : 3;
    R(I, x0, 6, L, 5); R(I, x0 + 1, 5, L - 2, 7); R(body, x0 + 1, 6, L - 2, 3); R(belly, x0 + 1, 9, L - 2, 2); R(body, x0, 7, 1, 3);
    R(I, x0 + L, 5, 2, 3); R(I, x0 + L, 9, 2, 3); R(fin, x0 + L, 6, 1, 1); R(fin, x0 + L, 10, 1, 1); R(I, x0 + L - 1, 7, 2, 3);   // tail
    R(I, x0 + 3, 4, 4, 1); R(fin, x0 + 4, 5, 3, 1); if (eye) { R(eye, x0 + 2, 7, 1, 1) }
  };
  mk('fish_loach', R => { fish(R, '#a07858', '#d8b898', '#7a5438', I, 1); for (const x of [4, 7, 10]) R('#7a5438', x, 7, 1, 1) });
  mk('fish_cavefish', R => fish(R, '#f0c0c8', '#fbe0e4', '#e0a0aa', null, 0));
  mk('fish_glowfin', R => { fish(R, '#2a3a7a', '#3a5aa0', '#4af0f0', '#ffffff', 0); for (const [x, y] of [[5, 7], [8, 8], [10, 7]]) R('#7affff', x, y, 1, 1) });
  { const c = mkc(16, 16), g = c.getContext('2d'), s = AT.fish_carp[0]; g.drawImage(s, Math.round(8 - s.width / 2), Math.round(8 - s.height / 2));
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(240,190,40,.75)'; g.fillRect(0, 0, 16, 16); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#fff6c0'; g.fillRect(6, 6, 2, 1); g.fillRect(9, 7, 1, 1); AT.fish_goldcarp = [c] }
  mk('fish_ghosteel', R => { fish(R, '#e8eef4', '#ffffff', '#c8d4e0', '#6a7a8a', 1); R('rgba(160,200,230,.6)', 3, 8, 9, 1) });
  const r = {
    shard: R => { R(I, 3, 4, 10, 9); R('#b8582e', 4, 5, 8, 7); R('#e08a52', 4, 5, 3, 2); R('#2a1e18', 4, 8, 8, 1); R(I, 9, 11, 4, 2); R(I, 3, 12, 3, 1) },
    oillamp: R => { R(I, 2, 7, 12, 6); R(I, 4, 6, 7, 1); R('#b8582e', 3, 8, 10, 4); R('#e08a52', 4, 8, 5, 1); R(I, 12, 7, 3, 3); R('#b8582e', 13, 8, 1, 1); R('#3a1e10', 6, 7, 3, 1) },
    mite: R => { R(I, 4, 4, 8, 8); R(I, 3, 5, 10, 6); R('#8a6a3a', 4, 5, 8, 6); R('#5a8a6a', 5, 6, 6, 4); R('#c8a060', 5, 5, 3, 1); R(I, 7, 7, 2, 2) },
    jarhandle: R => { R(I, 3, 3, 4, 11); R(I, 3, 3, 9, 4); R('#b8582e', 4, 4, 7, 2); R('#b8582e', 4, 4, 2, 9); R(I, 9, 5, 5, 5); R('#e08a52', 10, 6, 3, 3); R('#7a3a1c', 11, 7, 1, 1) },
    seal: R => { R(I, 4, 3, 8, 11); R('#8e867c', 5, 4, 6, 9); R('#b4ac9f', 5, 4, 2, 9); for (const y of [6, 9, 11]) R('#4e4a46', 7, y, 3, 1) },
    hook: R => { R(I, 9, 1, 3, 10); R('#c8743a', 10, 2, 1, 8); R(I, 4, 9, 8, 4); R('#c8743a', 5, 10, 6, 1); R(I, 3, 6, 3, 5); R('#c8743a', 4, 7, 1, 3); R('#f0a868', 4, 6, 1, 1) },
    scroll: R => { R(I, 2, 3, 12, 10); R('#e8d8b0', 3, 4, 10, 8); for (const y of [5, 7, 9]) R('#8a6a4a', 4, y, 7, 1); R(I, 1, 2, 3, 12); R('#c8a878', 2, 3, 1, 10); R(I, 12, 2, 3, 12); R('#c8a878', 13, 3, 1, 10) },
    shofar: R => { const P = [[2, 11], [3, 10], [4, 10], [5, 9], [6, 9], [7, 8], [8, 7], [9, 6], [10, 5], [11, 4], [12, 3]]; for (const [x, y] of P) R(I, x - 1, y - 1, 4, 4); P.forEach(([x, y], i) => R(i < 5 ? '#f0e0c0' : i < 8 ? '#c8a070' : '#7a5030', x, y, 2, 2)) },
    shekel: R => { R(I, 4, 3, 8, 10); R(I, 3, 4, 10, 8); R('#c8d0dc', 4, 4, 8, 8); R('#f4f8ff', 5, 4, 3, 1); R('#8a94a4', 6, 6, 4, 1); R('#8a94a4', 7, 7, 2, 3); R('#8a94a4', 6, 10, 4, 1) },
    bell: R => { R(I, 7, 1, 2, 3); R(I, 4, 3, 8, 9); R(I, 3, 9, 10, 3); R('#e0b030', 5, 4, 6, 7); R('#fff0a0', 5, 4, 2, 4); R('#e0b030', 4, 10, 8, 1); R(I, 7, 12, 2, 2); R('#b07a16', 7, 12, 2, 1) },
    onyx: R => { R(I, 3, 2, 10, 12); R('#e0b030', 4, 3, 8, 10); R(I, 5, 4, 6, 8); R('#2a2a34', 5, 4, 6, 8); R('#5a5a6a', 5, 4, 2, 2); for (const y of [6, 8, 10]) R('#e8e8f0', 7, y, 3, 1) },
    tablet: R => { R(I, 3, 2, 10, 13); R(I, 4, 1, 8, 1); R('#b4ac9f', 4, 3, 8, 11); R('#d4ccbe', 4, 2, 8, 2); R('#8e867c', 11, 3, 1, 11); for (const y of [5, 7, 9, 11]) { R('#6e6a66', 5, y, 2, 1); R('#6e6a66', 8, y, 2, 1) } R(I, 9, 12, 4, 3) },
  };
  for (const k in r) mk('relic_' + k, r[k]);
  for (const k of ['relicase', 'stainedglass']) { const c = mkc(40, 48), g = c.getContext('2d'); drawCaveDecor(g, k, 20, 47, 0); AT['decor_' + k] = [trimCanvas(c)] }
}
// the treasury table in the church: donated relics laid out on linen
function drawTreasury(g, o, X, Y, B, w, t) {
  if (o.k !== 'treasury') return false; const R = (c, a, b, ww = 1, hh = 1) => { g.fillStyle = c; g.fillRect(X + a, Y + b, ww, hh) }, I = '#2a1e18';
  R('rgba(60,35,15,.22)', 1, 14, 46, 2);
  for (const a of [2, 43]) { R(I, a, 6, 3, 9); R('#8a5232', a + 1, 6, 1, 8) }
  R(I, 0, -2, 48, 9); R('#f4ecd8', 1, -1, 46, 6); R('#d8ccb0', 1, 5, 46, 1); R('#2c4a9a', 1, 3, 46, 1); R('#b02a2a', 1, 4, 46, 1);
  const given = Object.keys(relicState().given); given.slice(0, 12).forEach((k, i) => { const s = AT['relic_' + k] && AT['relic_' + k][0]; if (s) g.drawImage(s, X + 2 + (i % 6) * 7.5 + (Math.floor(i / 6) ? 3 : 0), Y - 7 + Math.floor(i / 6) * 5, 8, 8) });
  if (!given.length) { g.fillStyle = 'rgba(90,60,30,.6)'; g.font = '700 5px Nunito, sans-serif'; g.fillText('Treasury', X + 14, Y + 3) }
  return true;
}

// ---------- cave torches: cheap to make, and they stay where you put them ----------
function setTorch(sec, i, on) { const C = caveState(), T = (C.torches = C.torches || {}), L = T[sec] = T[sec] || []; const k = L.indexOf(i); if (on && k < 0) L.push(i); if (!on && k >= 0) L.splice(k, 1); save() }
function placeCaveTorch(slot) {
  if (World.cur !== 'mine') { toast('Cave torches are for lighting the Sinai Caverns.'); sfx.no(); return }
  const [x, y] = facingCell(), i = idx(x, y);
  if (!inb(x, y) || World.ground[i] !== DIRT || World.objs[i]) { toast('Face an open spot on the cave floor.'); sfx.no(); return }
  World.objs[i] = { t: 'ctorch' }; setTorch(CAVE.sec, i, true);
  const s = state.inv[slot]; s.n--; if (s.n <= 0) state.inv[slot] = null; sfx.plant(); tone(330, .08, 'triangle', .03); updateHUD();
}
function drawCaveTorch(g, x, y, t) {
  const X = x * 16, Y = y * 16, R = (c, a, b, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(X + a, Y + b, w, h) };
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(X + 8, Y + 15, 3, 1.2, 0, 0, 7); g.fill();
  R('#1a100a', 6, 2, 4, 14); R('#8a5232', 7, 3, 2, 12); R('#b8784a', 7, 3, 1, 12);
  R('#1a100a', 5, 0, 6, 4); R('#c8a878', 6, 1, 4, 2); R('#8a6a4a', 6, 2, 4, 1);
  const f = Math.floor(t * 10 + x * 3) % 3, h = 5 + f;
  R('#e8402a', 6, 1 - h, 4, h); R('#ff9a30', 6, 3 - h, 4, h - 2); R('#ffe27a', 7, 4 - h, 2, h - 3); R('#fff8d8', 7, 0, 2, 1);
  if (f === 1) R('#ffb030', 9, -h - 1, 1, 1);
}

// ---------- the collection book: every fish and relic, with how rare each one is ----------
let bookTab = 'fish';
const FISH_PLACES = [['pond', 'Farm Pond'], ['river', 'Jordan River'], ['shore', 'Galilee Bay Shore'], ['offshore', 'Open Sea'], ['sea', 'Deep Sea'], ['cave', 'Underground River']];
const RARITY = [['Common', 'c'], ['Uncommon', 'u'], ['Rare', 'r'], ['Legendary', 'l']];
function fishRarity(k) {
  const d = FISH[k], pool = Object.keys(FISH).filter(q => !FISH[q].junk && FISH[q].where.includes(d.where[0])), tot = pool.reduce((a, q) => a + FISH[q].w, 0);
  let s = d.w / tot; if (d.night) s /= 2; if (d.seasons) s *= d.seasons.length / 4;
  return RARITY[s >= .2 ? 0 : s >= .1 ? 1 : s >= .035 ? 2 : 3];
}
const relicRarity = k => RARITY[RELICS[k].r >= 3 ? 0 : RELICS[k].r >= 2 ? 1 : RELICS[k].r >= 1 ? 2 : 3];
function collectionTab(b) {
  const log = state.fishLog || {}, cnt = state.fishCount || {}, R = relicState();
  const fishKeys = Object.keys(FISH).filter(k => !FISH[k].junk), nf = fishKeys.filter(k => log[k] !== undefined).length, nr = Object.keys(R.found).length;
  let h = `<div class="stabs"><button class="stab ${bookTab === 'fish' ? 'on' : ''}" data-bt="fish">Fish <small>${nf}/${fishKeys.length}</small></button><button class="stab ${bookTab === 'relics' ? 'on' : ''}" data-bt="relics">Relics <small>${nr}/12</small></button></div>`;
  if (bookTab === 'fish') {
    for (const [w, name] of FISH_PLACES) {
      const ks = fishKeys.filter(k => FISH[k].where[0] === w); if (!ks.length) continue;
      h += `<div class="h3 csub">${name}</div><div class="bookgrid">`;
      for (const k of ks) { const d = FISH[k], got = log[k] !== undefined, [rn, rc] = fishRarity(k);
        const when = [d.night ? 'Night only' : '', d.seasons ? d.seasons.map(s => SEASONS[s]).join(' & ') + ' only' : ''].filter(Boolean).join(' · ');
        h += `<div class="bk ${got ? 'got' : ''}"><img class="${got ? '' : 'sil'}" src="${iconURL('fish_' + k)}"><b>${got ? d.n : '???'}</b><i class="rar ${rc}">${rn}</i>
          <small>${got ? `Caught ${cnt[k] || 1} · Biggest ${log[k]} lb` : when || 'Not caught yet'}</small></div>` }
      h += '</div>';
    }
  } else {
    for (let s = 1; s <= 5; s++) {
      h += `<div class="h3 csub">${CAVES[s].n}</div><div class="bookgrid">`;
      for (const k of Object.keys(RELICS).filter(q => RELICS[q].sec === s)) { const r = RELICS[k], got = R.found[k], [rn, rc] = relicRarity(k);
        h += `<div class="bk ${got ? 'got' : ''}"><img class="${got ? '' : 'sil'}" src="${iconURL('relic_' + k)}"><b>${got ? r.n : '???'}</b><i class="rar ${rc}">${rn}</i>
          <small>${R.given[k] ? 'In the church treasury' : got ? 'Found! Give it to Elder Simeon' : (s > (caveState().max || 0) ? 'Somewhere deeper in the caverns' : 'Not found yet')}</small></div>` }
      h += '</div>';
    }
  }
  b.innerHTML = h; b.querySelectorAll('[data-bt]').forEach(el => el.onclick = () => { bookTab = el.dataset.bt; sfx.tap(); collectionTab(b); b.scrollTop = 0 });
}
