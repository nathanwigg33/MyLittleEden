// ===================== Mount Sinai and the mines inside it =====================
'use strict';
// "And mount Sinai was altogether on a smoke, because the LORD descended upon it in fire" (Exodus 19:18)
const SINAI = { base: 28, peak: [32.5, 3], cave: [32, 11], road: [], flash: 0, strikeT: 3, bolt: null };
// the mountain's outline: top edge (in tiles) for a column, and the foot line
function mtnTop(x) { return 3 + Math.pow(Math.abs(x - 32.5) / 30, 1.25) * 23 + Math.sin(x * .9) * .5 + Math.sin(x * .37 + 1) * .9 }
function mtnFoot(x) { return SINAI.base + Math.round(Math.sin(x * .45) * .8) }
function inMountain(x, y) { return y >= mtnTop(x + .5) && y <= mtnFoot(x) }

function genSinai() {
  const R = mulberry(2026), ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const g = World.ground = new Uint8Array(W * H).fill(DIRT), o = World.objs = new Array(W * H).fill(null), pv = World.pave = new Uint8Array(W * H); World.soil = {};
  // the road: up from Bethlehem through the wilderness, then switching back and forth up the mountainside to the cave
  const road = new Set(), seg = (x0, y0, x1, y1) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) road.add(idx(x, y)) };
  seg(31, 53, 32, 40); seg(31, 40, 36, 41); seg(35, 41, 36, 29);           // wilderness stretch
  seg(35, 27, 36, 30); seg(26, 26, 36, 27);                                // first switchback (west)
  seg(26, 21, 27, 27); seg(26, 20, 40, 21);                                // second (east)
  seg(39, 15, 40, 21); seg(32, 14, 40, 15); seg(32, 12, 33, 15);           // third (west) and up to the cave
  SINAI.road = [...road];
  for (const i of road) { pv[i] = 1; g[i] = DIRT }
  // the mountain itself is solid, except the road ledges and the cave mouth
  for (let y = 0; y <= SINAI.base + 1; y++) for (let x = 0; x < W; x++) if ((inMountain(x, y) || y < mtnTop(x + .5)) && !road.has(idx(x, y))) o[idx(x, y)] = { t: 'part', ox: -1, oy: -1 };
  for (const x of [32, 33]) o[idx(x, 11)] = null;
  // an oasis in the wilderness: a spring with grass and palms around it
  for (let y = 36; y <= 48; y++) for (let x = 8; x <= 24; x++) { const d = Math.hypot((x - 15.5) / 7, (y - 42) / 5.5); if (d < .45) g[idx(x, y)] = WATER; else if (d < 1 + (hash(x, y) - .5) * .3) g[idx(x, y)] = GRASS }
  for (const [x, y] of [[11, 39], [20, 40], [12, 45], [19, 45], [16, 37]]) if (g[idx(x, y)] === GRASS) o[idx(x, y)] = { t: 'wild', k: 'tree2', v: ri(0, 3) };
  for (const [x, y] of [[9, 42], [22, 43], [14, 47]]) if (g[idx(x, y)] === GRASS) o[idx(x, y)] = { t: 'bush', v: 0 };
  // Bezalel's camp at the foot of the mountain
  o[idx(39, 32)] = { t: 'campfire' }; o[idx(41, 31)] = { t: 'crate', camp: 1 }; o[idx(40, 31)] = { t: 'barrel' };
  // wilderness: rocks and boulders to break, dry shrubs and a few acacias
  for (let y = 29; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y); if (o[i] || road.has(i) || g[i] !== DIRT) continue;
    const nearRoad = [...[-2, -1, 1, 2]].some(d => road.has(idx(clamp(x + d, 0, W - 1), y)));
    if (nearRoad) continue; const r = R();
    if (r < .045) o[i] = { t: 'rock', v: ri(0, 1) }; else if (r < .06) o[i] = { t: 'boulder' }; else if (r < .085) o[i] = { t: 'bush', v: 0 }; else if (r < .1) o[i] = { t: 'wild', k: 'tree2', v: ri(0, 3) };
  }
  World.place(33, 50, { t: 'sign', text: 'Mount Sinai. “And mount Sinai was altogether on a smoke, because the LORD descended upon it in fire.” (Exodus 19:18)' });
  World.place(37, 29, { t: 'sign', text: 'The road climbs the mountain to the Sinai Mines. Bring your pickaxe and plenty to eat!' });
  World.place(34, 12, { t: 'sign', text: 'Sinai Mines. Copper and stone near the top. Iron, silver, gold and precious stones further down.' });
  fillBorder(R);
  SINAI.img = null;
}

// ---------- drawing the mountain (worked out once, pixel by pixel) ----------
function mountainImage() {
  if (SINAI.img) return SINAI.img;
  const MW = W * 16, MH = (SINAI.base + 2) * 16, c = mkc(MW, MH), q = c.getContext('2d', { willReadFrequently: false }), im = q.createImageData(MW, MH), D = im.data;
  const road = new Set(SINAI.road), isRoad = (px_, py_) => road.has(idx(Math.floor(px_ / 16), Math.floor(py_ / 16)));
  const pal = { out: [58, 30, 18], dark: [92, 50, 32], shade: [126, 70, 44], mid: [165, 98, 62], lit: [196, 130, 86], hi: [222, 166, 116], crack: [76, 40, 26] };
  const set = (x, y, col, a = 255) => { const i = (y * MW + x) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = a };
  for (let x = 0; x < MW; x++) {
    const tx = x / 16, top = Math.round(mtnTop(tx) * 16), foot = (mtnFoot(Math.floor(tx)) + 1) * 16, slope = mtnTop(tx + .25) - mtnTop(tx - .25);
    for (let y = 0; y < Math.min(top, MH); y++) {   // stormy sky behind the peak
      const k = y / Math.max(1, top), n = hash(x >> 3, y >> 3); set(x, y, n > .9 ? [70, 68, 82] : [Math.round(34 + k * 40), Math.round(32 + k * 38), Math.round(48 + k * 40)]) }
    for (let y = Math.max(0, top); y < Math.min(MH, foot); y++) {
      if (isRoad(x, y)) continue;
      const depth = y - top, facet = hash(x >> 4, (y + (x >> 4) * 5) >> 4), strata = ((y + Math.sin(x / 37) * 9 + hash(x >> 5, 1) * 6) % 26) < 2;
      const light = clamp((32.5 - tx) / 14 + (facet - .5) * .9, -1, 1) + ((x + y) % 2 ? .08 : -.08);   // lit from the west, with soft dithering between tones
      let col = light > .45 ? pal.lit : light > -.15 ? pal.mid : light > -.6 ? pal.shade : pal.dark;
      if (strata) col = light > 0 ? pal.shade : pal.dark;
      if (hash(x >> 1, 7) > .965 && depth > 10 && (y + x) % 40 < 26) col = pal.crack;                          // cracks running down
      if (depth < 2) col = pal.out; else if (depth < 4 && slope < 0) col = pal.hi;
      // a cliff face below each road ledge, and a lit lip along its top edge
      if (isRoad(x, y - 1) || isRoad(x, y - 2) || isRoad(x, y - 3)) col = isRoad(x, y - 1) ? pal.out : pal.dark;
      if (isRoad(x, y + 1)) col = pal.hi;
      if (y >= foot - 2) col = pal.out;
      set(x, y, col);
    }
  }
  q.putImageData(im, 0, 0);
  // the cave mouth with a timber frame, a lantern and rails running out
  const cx = 33 * 16, cy = 12 * 16;
  q.fillStyle = '#3a1e12'; q.beginPath(); q.ellipse(cx, cy - 4, 18, 22, 0, Math.PI, 0); q.fill(); q.fillRect(cx - 18, cy - 4, 36, 4);
  q.fillStyle = '#0c0705'; q.beginPath(); q.ellipse(cx, cy - 4, 15, 19, 0, Math.PI, 0); q.fill(); q.fillRect(cx - 15, cy - 4, 30, 4);
  q.fillStyle = '#2e1a0e'; q.fillRect(cx - 17, cy - 24, 5, 24); q.fillRect(cx + 12, cy - 24, 5, 24); q.fillRect(cx - 19, cy - 28, 38, 5);
  q.fillStyle = '#8e5e36'; q.fillRect(cx - 16, cy - 23, 3, 23); q.fillRect(cx + 13, cy - 23, 3, 23); q.fillRect(cx - 18, cy - 27, 36, 3);
  q.fillStyle = '#b07848'; q.fillRect(cx - 16, cy - 23, 1, 23); q.fillRect(cx + 13, cy - 23, 1, 23); q.fillRect(cx - 18, cy - 27, 36, 1);
  q.fillStyle = '#2e1a0e'; q.fillRect(cx + 15, cy - 22, 7, 8); q.fillStyle = '#e2b04a'; q.fillRect(cx + 16, cy - 21, 5, 6); q.fillStyle = '#fff2a0'; q.fillRect(cx + 17, cy - 19, 3, 3);
  return SINAI.img = c;
}
// the summit: fire on the peak, smoke, dark thunderclouds and lightning
function drawSummit(g, t, still) {
  const [px_, py_] = [SINAI.peak[0] * 16, SINAI.peak[1] * 16 + 6];
  // thick dark clouds swirling above the top
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2 + t * .08, rx = 64 + (k % 3) * 24, x = px_ + Math.cos(a) * rx, y = py_ - 40 + Math.sin(a) * 12 - (k % 2) * 6, r = 15 + (k % 4) * 5;
    g.fillStyle = '#2e2c36'; g.beginPath(); g.ellipse(x, y + 3, r + 2, r * .62 + 2, 0, 0, 7); g.fill(); g.fillStyle = k % 3 ? '#46444f' : '#55535e'; g.beginPath(); g.ellipse(x, y, r, r * .6, 0, 0, 7); g.fill() }
  // smoke rising "as the smoke of a furnace" (Exodus 19:18)
  for (let k = 0; k < 9; k++) { const life = (t * .25 + k / 9) % 1, x = px_ + Math.sin(t * .7 + k * 2.1) * 14 * life + (k % 3 - 1) * 12, y = py_ - 40 - life * 50, r = 10 + life * 20;
    g.fillStyle = `rgba(60,56,62,${.55 * (1 - life)})`; g.beginPath(); g.ellipse(x, y, r, r * .7, 0, 0, 7); g.fill() }
  // a great fire on the summit: a glow, then layered flames shaped like a blaze, sparks and embers
  const fw = 46;                                                            // half-width of the blaze
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const [r, a] of [[78, .12], [54, .16], [34, .2]]) { const gr = g.createRadialGradient(px_, py_ - 14, 4, px_, py_ - 14, r); gr.addColorStop(0, `rgba(255,150,40,${a + Math.sin(t * 7) * .03})`); gr.addColorStop(1, 'rgba(255,80,20,0)'); g.fillStyle = gr; g.fillRect(px_ - r, py_ - 14 - r, r * 2, r * 2) }
  g.restore();
  const layer = (w, hMax, col, inset, sp) => { for (let k = 0; k < w * 2; k += 2) { const off = k - w, env = 1 - Math.pow(Math.abs(off) / w, 1.6), fl = (Math.sin(t * sp + k * .9) + Math.sin(t * sp * 1.7 + k * 1.3)) * .5;
      const h = Math.max(0, Math.round(hMax * env * (.72 + fl * .28))); if (h > 0) { g.fillStyle = col; g.fillRect(Math.round(px_ + off), Math.round(py_ + 2 - h - inset), 2, h) } } };
  layer(fw, 52, '#8e1a10', 0, 7); layer(fw - 6, 46, '#d0341a', 2, 8); layer(fw - 14, 36, '#ff7a22', 4, 9); layer(fw - 22, 26, '#ffc23a', 6, 10); layer(fw - 30, 15, '#fff2b0', 8, 11);
  // small fires licking down the slopes on either side
  for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const fx = px_ + sd * (fw - 8 + k * 14), fy = mtnTop(fx / 16) * 16 + 3, h = 8 + ((Math.sin(t * 9 + k + sd) + 1) * 4 | 0); g.fillStyle = '#d0341a'; g.fillRect(Math.round(fx) - 2, Math.round(fy - h), 5, h); g.fillStyle = '#ff9a2a'; g.fillRect(Math.round(fx) - 1, Math.round(fy - h + 3), 3, h - 3); g.fillStyle = '#ffe07a'; g.fillRect(Math.round(fx), Math.round(fy - h + 6), 1, Math.max(1, h - 7)) }
  for (let k = 0; k < 16; k++) { const e = (t * 1.3 + k / 16) % 1, ex = px_ + Math.sin(k * 3.7 + t * 1.5) * (fw * .8) * (1 - e * .4), ey = py_ - 30 - e * 70; g.fillStyle = e < .4 ? '#fff2b0' : e < .7 ? '#ffb340' : '#e0501e'; g.fillRect(Math.round(ex), Math.round(ey), e < .3 ? 2 : 1, e < .3 ? 2 : 1) }   // sparks
  if (still) return;
  // lightning
  const B = SINAI.bolt; if (B && B.t > 0) { g.strokeStyle = `rgba(255,255,230,${Math.min(1, B.t * 5)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(B.pts[0][0], B.pts[0][1]); for (const p of B.pts) g.lineTo(p[0], p[1]); g.stroke();
    g.strokeStyle = `rgba(190,210,255,${Math.min(.6, B.t * 3)})`; g.lineWidth = 5; g.beginPath(); g.moveTo(B.pts[0][0], B.pts[0][1]); for (const p of B.pts) g.lineTo(p[0], p[1]); g.stroke() }
}
function drawMountain(g, x0, y0, x1, y1, t, still) { if (y0 > SINAI.base + 2) return; g.drawImage(mountainImage(), 0, 0); drawSummit(g, t, still) }
function updateSinai(dt) {
  SINAI.flash = Math.max(0, SINAI.flash - dt * 2.5); if (SINAI.bolt) SINAI.bolt.t -= dt;
  SINAI.strikeT -= dt; if (SINAI.strikeT > 0) return; SINAI.strikeT = rnd(3, 8);
  const sx = SINAI.peak[0] * 16 + rnd(-60, 60), pts = [[sx + rnd(-30, 30), -10]]; let x = pts[0][0], y = -10; const ty = SINAI.peak[1] * 16 + rnd(-10, 30);
  while (y < ty) { y += rnd(8, 16); x += rnd(-10, 10) + (sx - x) * .2; pts.push([x, Math.min(y, ty)]) }
  SINAI.bolt = { pts, t: .35 }; SINAI.flash = .55; setTimeout(() => sfx.thunder(), rnd(150, 600));
}

// ---------- the mines ----------
const ORES = {   // node type: hit points, what it drops, sell price of the drop
  stone: { hp: 3, item: 'stone' }, copper: { hp: 4, item: 'ore_copper' }, coal: { hp: 4, item: 'ore_coal' }, iron: { hp: 5, item: 'ore_iron' },
  silver: { hp: 6, item: 'ore_silver' }, gold: { hp: 7, item: 'ore_gold' }, amethyst: { hp: 6, item: 'ore_amethyst' }, emerald: { hp: 7, item: 'ore_emerald' },
  ruby: { hp: 8, item: 'ore_ruby' }, sapphire: { hp: 8, item: 'ore_sapphire' },
};
const MINE_ITEMS = { ore_coal: ['Coal', 15], ore_copper: ['Copper Ore', 20], ore_iron: ['Iron Ore', 35], ore_silver: ['Silver Ore', 60], ore_gold: ['Gold Ore', 110],
  ore_amethyst: ['Amethyst', 120], ore_emerald: ['Emerald', 200], ore_ruby: ['Ruby', 260], ore_sapphire: ['Sapphire', 320] };
function mineItems() { const o = {}; for (const k in MINE_ITEMS) { const [n, price] = MINE_ITEMS[k]; o[k] = { n, icon: k, price, d: `Found in the Sinai Mines. Sells for ₪${price}.` } } return o }
// what you find on each floor (weights)
function oreMix(f) {
  const m = { stone: 60, copper: 14, coal: 10 };
  if (f >= 5) Object.assign(m, { iron: 10 }); if (f >= 10) Object.assign(m, { silver: 7, amethyst: 1.2, copper: 6 });
  if (f >= 15) Object.assign(m, { gold: 5, emerald: 1, coal: 6 }); if (f >= 20) Object.assign(m, { gold: 7, ruby: .8, sapphire: .6, copper: 2 });
  return m;
}
const MINE = { floor: 1, spawn: [32, 20] };
function genMine(f) {
  const R = mulberry(f * 7919 + (state.totalDay || 1) * 13), ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const g = World.ground = new Uint8Array(W * H).fill(WATER), o = World.objs = new Array(W * H).fill(null); World.soil = {}; World.pave = null;
  // a cave: random rock, smoothed into open chambers, keeping the biggest connected one
  const X0 = 14, X1 = 50, Y0 = 12, Y1 = 42; let cell = [];
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) cell[idx(x, y)] = R() < .42 ? 1 : 0;   // 1 = rock
  for (let it = 0; it < 4; it++) { const nx = []; for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; n += xx < X0 || xx > X1 || yy < Y0 || yy > Y1 ? 1 : cell[idx(xx, yy)] } nx[idx(x, y)] = n >= 5 ? 1 : 0 } cell = nx }
  const S = [32, 18]; for (let y = S[1] - 2; y <= S[1] + 2; y++) for (let x = S[0] - 2; x <= S[0] + 2; x++) cell[idx(x, y)] = 0;
  const seen = new Set([idx(S[0], S[1])]), q = [[S[0], S[1]]];
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy, i = idx(xx, yy); if (xx < X0 || xx > X1 || yy < Y0 || yy > Y1 || seen.has(i) || cell[i]) continue; seen.add(i); q.push([xx, yy]) } }
  for (const i of seen) g[i] = DIRT;
  // the ladder you came down, then rocks and ore everywhere else
  o[idx(S[0], S[1] - 1)] = { t: 'ladder_up' }; MINE.spawn = [S[0] + .5, S[1] + .7];
  const mix = oreMix(f), tot = Object.values(mix).reduce((a, b) => a + b, 0), pickOre = () => { let r = R() * tot; for (const k in mix) { r -= mix[k]; if (r <= 0) return k } return 'stone' };
  const spots = [...seen].filter(i => Math.hypot(i % W - S[0], (i / W | 0) - S[1]) > 2.5);
  const rocks = []; for (const i of spots) if (R() < .17) { const k = pickOre(); o[i] = { t: 'node', k }; rocks.push(i) }
  // one rock hides the ladder down; pick one well away from where you start
  rocks.sort((a, b) => Math.hypot(b % W - S[0], (b / W | 0) - S[1]) - Math.hypot(a % W - S[0], (a / W | 0) - S[1]));
  if (rocks.length) o[rocks[ri(0, Math.min(rocks.length - 1, Math.floor(rocks.length / 3)))]].ladder = 1;
  // a few things left behind by miners
  const free = spots.filter(i => !o[i]); for (let k = 0; k < 3 && free.length; k++) { const i = free.splice(ri(0, free.length - 1), 1)[0]; o[i] = { t: k ? 'barrel' : 'minecart' } }
  MINE.floor = f;
}
function nodeDrop(o, cx, cy) {
  const k = o.k; drop(ORES[k].item, k === 'stone' ? ri(1, 2) : 1, cx, cy); if (k !== 'stone' && Math.random() < .5) drop('stone', 1, cx, cy);
  if (k !== 'stone') state.stats.ores = (state.stats.ores || 0) + 1;
  if (o.ladder) { World.place(Math.floor(cx), Math.floor(cy), { t: 'ladder' }); sfx.pop(); toast('You found a ladder down!') }
}
const NODE_CHIP = { stone: '#9a978f', copper: '#d07a3a', coal: '#3a3a44', iron: '#a05a40', silver: '#e8eef6', gold: '#f2c94c', amethyst: '#a960e0', emerald: '#4ad070', ruby: '#e04050', sapphire: '#3aa0e8' };
async function enterMine() {
  if (SINAI.entering) return; SINAI.entering = 1;
  let f = 1; const max = state.mineMax || 1, stops = [1]; for (let k = 5; k <= max; k += 5) stops.push(k);
  if (stops.length > 1) { const v = await say('The mine shaft goes deep into the mountain. Which floor do you want to go to?', stops.slice(-4).map(n => [`Floor ${n}`, n]).concat([['Not now', 0]])); if (!v) { SINAI.entering = 0; player.y += .6; return } f = v }
  await goFloor(f); SINAI.entering = 0;
}
async function goFloor(f) { state.mineFloor = f; state.mineMax = Math.max(state.mineMax || 1, f); genMine(f); storeMap('mine'); await travel('mine', MINE.spawn[0], MINE.spawn[1], 's') }
async function mineAction(o) {
  if (o.t === 'ladder') { sfx.tap(); await goFloor(MINE.floor + 1); if (MINE.floor % 5 === 0) toast(`Floor ${MINE.floor}! You can come straight back here from the mine entrance.`); return }
  if (o.t === 'ladder_up') { const v = await say(`Floor ${MINE.floor}. Climb back up to Mount Sinai?`, [['Climb up', 1], ['Keep mining', 0]]); if (v) await travel('sinai', 33, 12.7, 's'); return }
  if (o.t === 'minecart') say('An old minecart, still full of rubble.');
}
// cave walls and floor; deeper floors change colour
function drawMine(g, x0, y0, x1, y1, t) {
  const f = MINE.floor, band = f < 10 ? 0 : f < 20 ? 1 : 2;
  const P = [{ floor: ['#4a3628', '#433024', '#53402f'], face: ['#5e4636', '#6e5442', '#3a2a20'], top: '#2a1e17' },
    { floor: ['#3c4048', '#363a42', '#454a53'], face: ['#555b66', '#666d79', '#30343b'], top: '#1f2228' },
    { floor: ['#4a2a28', '#432422', '#553230'], face: ['#6a3a32', '#7e4a3e', '#3a1e1a'], top: '#24120f' }][band];
  g.fillStyle = '#080605'; g.fillRect(x0 * 16, y0 * 16, (x1 - x0 + 1) * 16, (y1 - y0 + 1) * 16);
  const fl = (x, y) => inb(x, y) && World.ground[idx(x, y)] === DIRT;
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
    const X = x * 16, Y = y * 16, h = hash(x, y);
    if (fl(x, y)) {
      g.fillStyle = P.floor[h > .7 ? 2 : h > .35 ? 1 : 0]; g.fillRect(X, Y, 16, 16);
      for (let k = 0; k < 3; k++) { const hh = hash(x * 7 + k, y * 3 - k); g.fillStyle = hh > .5 ? P.floor[2] : P.floor[1]; g.fillRect(X + (hh * 97 % 14 | 0), Y + (hh * 31 % 14 | 0), 2, 1) }
    } else if (fl(x, y + 1)) {        // a rock wall facing you
      g.fillStyle = P.face[0]; g.fillRect(X, Y, 16, 16); g.fillStyle = P.face[1]; g.fillRect(X, Y + 2, 16, 2); g.fillRect(X + (h * 9 | 0), Y + 7, 6, 1); g.fillStyle = P.face[2]; g.fillRect(X, Y + 14, 16, 2); g.fillRect(X + (h * 13 | 0), Y + 9, 1, 5);
      g.fillStyle = P.top; g.fillRect(X, Y, 16, 2);
    } else if (fl(x - 1, y) || fl(x + 1, y) || fl(x, y - 1) || fl(x + 1, y + 1) || fl(x - 1, y + 1)) {
      g.fillStyle = P.top; g.fillRect(X, Y, 16, 16); g.fillStyle = P.face[2];
      if (fl(x - 1, y)) g.fillRect(X, Y, 2, 16); if (fl(x + 1, y)) g.fillRect(X + 14, Y, 2, 16); if (fl(x, y - 1)) g.fillRect(X, Y, 16, 2);
    }
  }
}
function drawMineObj(g, o, x, y, t) {
  const X = x * 16, Y = y * 16, cx = X + 8, B = Y + 15, ink = '#1a100a';
  if (o.t === 'node') { const s = AT['node_' + o.k][0], sh = o.shake > 0 ? Math.sin(t * 60) * 1.2 : 0; g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(cx, B, 7, 2.5, 0, 0, 7); g.fill(); g.drawImage(s, Math.round(cx - s.width / 2 + sh), B - s.height + 1);
    if (['amethyst', 'emerald', 'ruby', 'sapphire'].includes(o.k) && Math.sin(t * 2.5 + x) > .7) { g.fillStyle = '#fff'; g.fillRect(cx + 2, Y + 4, 1, 3); g.fillRect(cx + 1, Y + 5, 3, 1) } }
  else if (o.t === 'ladder') { g.fillStyle = ink; g.fillRect(X + 1, Y + 2, 14, 13); g.fillStyle = '#050302'; g.fillRect(X + 2, Y + 3, 12, 11); g.fillStyle = '#8e5e36'; g.fillRect(X + 4, Y + 1, 2, 12); g.fillRect(X + 10, Y + 1, 2, 12); for (let k = 0; k < 3; k++) g.fillRect(X + 4, Y + 3 + k * 4, 8, 1) }
  else if (o.t === 'ladder_up') { g.fillStyle = 'rgba(255,240,200,.16)'; g.beginPath(); g.moveTo(X + 2, Y - 30); g.lineTo(X + 14, Y - 30); g.lineTo(X + 16, B); g.lineTo(X, B); g.fill();
    g.fillStyle = ink; g.fillRect(X + 2, Y - 18, 4, 33); g.fillRect(X + 10, Y - 18, 4, 33); g.fillStyle = '#a06a3e'; g.fillRect(X + 3, Y - 18, 2, 33); g.fillRect(X + 11, Y - 18, 2, 33); for (let k = 0; k < 6; k++) { g.fillStyle = ink; g.fillRect(X + 3, Y - 15 + k * 5, 10, 3); g.fillStyle = '#b07848'; g.fillRect(X + 4, Y - 14 + k * 5, 8, 1) } }
  else if (o.t === 'minecart') { const s = AT.minecart[0]; g.drawImage(s, Math.round(cx - s.width / 2), B - s.height + 3) }
}

// ---------- Bezalel, the craftsman who worked gold, silver and bronze (Exodus 31) ----------
const BEZALEL_ = 1;
const BEZALEL = { id: 'bezalel', name: 'Bezalel', role: 'Craftsman', spot: [41.5, 33], roam: 1.2, look: { hair: 'short', hairCol: 3, skin: 2, shirt: 5, pants: 2 },
  lines: ['I was given skill to work in gold, in silver and in bronze, and in cutting of stones. The mountain is full of them!', 'Copper and stone near the top of the mine. Iron from floor 5, silver from 10, gold from 15.', 'Every rock might hide the ladder down. Keep swinging!', 'Precious stones are rare: amethyst, emerald, ruby, sapphire. They catch the light, so look for the sparkle.', 'When the thunder rolls over the mountain, I remember who gave the Law here.', 'Eat well before you go down. Mining is hungry work.'],
  warm: ['Your hands are getting a miner’s calluses. Good!', 'You’d make a fine craftsman, friend.'] };
VILLAGERS.push(BEZALEL);
