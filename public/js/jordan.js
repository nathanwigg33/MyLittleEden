// ===================== the Jordan River, Galilee Bay and fishing =====================
'use strict';
const JORDAN = { name: 'The Jordan', bay: 39 };
const shoreY = x => 40 + Math.round(Math.sin(x / 6.5) * 1.6 + Math.sin(x / 2.7 + 1) * .7);   // first water row of the bay in column x

// smooth curve through control points (Catmull-Rom), returned as many small steps
function spline(P, step = .2) {
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.ceil(L / step));
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t, f = (a, b, c, d) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]) }
  }
  out.push(P[P.length - 1]); return out;
}
function genJordan() {
  const R = mulberry(31337), ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const g = World.ground = new Uint8Array(W * H).fill(GRASS), o = World.objs = new Array(W * H).fill(null); World.soil = {}; World.pave = null;
  const at = (x, y) => inb(x, y) ? idx(x, y) : -1;
  // rivers: stamped along a smooth curve, widening as they go
  const carve = (P, w0, w1) => { const S = spline(P); S.forEach(([cx, cy], i) => { const r = (w0 + (w1 - w0) * i / S.length) / 2 + (hash(Math.round(cx * 2), Math.round(cy * 2)) - .5) * .5;
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) if (inb(x, y) && Math.hypot(x + .5 - cx, y + .5 - cy) <= r) g[idx(x, y)] = WATER }) };
  // the Jordan snakes down from the north-west in a big S; a creek joins it from the east
  carve([[12, -3], [13, 5], [19, 10], [28, 11], [37, 14], [41, 20], [37, 25], [28, 27], [21, 30], [18, 35], [20, 40], [22, 45]], 2.6, 4.4);
  carve([[67, 27], [60, 26], [53, 24], [47, 22], [42, 21]], 1.6, 2.4);
  // Galilee Bay along the bottom, with a sandy beach above it
  for (let x = 0; x < W; x++) { const s = shoreY(x); for (let y = s; y < H; y++) g[idx(x, y)] = WATER; for (let y = s - 3 - (hash(x, 9) > .5 ? 1 : 0); y < s; y++) if (g[idx(x, y)] === GRASS) g[idx(x, y)] = DIRT }
  // bridges: lay one across each run of water along a row (h) or column (v), resting on the banks
  const bridgeV = (xs, y0, y1) => { let run = null; const lay = (a, b) => { for (let y = a - 1; y <= b + 1; y++) xs.forEach((x, k) => { o[idx(x, y)] = { t: 'bridge', d: 'v', side: xs.length === 1 ? 0 : k === 0 ? -1 : 1, end: y === a - 1 ? 'a' : y === b + 1 ? 'b' : '' }; if (g[idx(x, y)] !== WATER) g[idx(x, y)] = DIRT }) };
    for (let y = y0; y <= y1 + 1; y++) { const wet = y <= y1 && xs.some(x => g[idx(x, y)] === WATER); if (wet && run === null) run = y; if (!wet && run !== null) { lay(run, y - 1); run = null } } };
  const bridgeH = (y, x0, x1) => { let a = -1, b = -1; for (let x = x0; x <= x1; x++) if (g[idx(x, y)] === WATER) { if (a < 0) a = x; b = x } if (a < 0) return;
    for (let x = a - 1; x <= b + 1; x++) { o[idx(x, y)] = { t: 'bridge', d: 'h', side: 0, end: x === a - 1 ? 'a' : x === b + 1 ? 'b' : '' }; if (g[idx(x, y)] !== WATER) g[idx(x, y)] = DIRT } };
  // the road down from Bethlehem
  for (let y = 0; y < shoreY(34) - 1; y++) for (const x of [34, 35]) if (g[idx(x, y)] !== WATER) g[idx(x, y)] = DIRT;
  for (const x of [33, 36]) for (let y = 0; y < 3; y++) g[idx(x, y)] = DIRT;
  bridgeV([34, 35], 0, shoreY(34) - 2);
  // smaller footbridges along the river and creek, with little trails to them
  bridgeH(4, 8, 19); bridgeH(35, 13, 26); bridgeV([55], 19, 31); bridgeV([24], 5, 16);
  // the dock: out from the beach into the bay, with a wider end, and Peter's boat tied up beside it
  const d0 = shoreY(30) - 2;
  for (let y = d0; y <= 48; y++) for (const x of [30, 31]) o[idx(x, y)] = { t: 'dock', end: y >= 47 };
  for (let x = 28; x <= 33; x++) for (const y of [47, 48]) o[idx(x, y)] = { t: 'dock', end: true };
  for (let x = 32; x <= 33; x++) g[idx(x, d0)] = DIRT;
  // Peter's hut on the beach
  const hutY = Math.min(shoreY(38), shoreY(39), shoreY(40)) - 3;
  for (let y = hutY - 2; y <= hutY + 1; y++) for (let x = 37; x <= 41; x++) if (g[idx(x, y)] === WATER) g[idx(x, y)] = DIRT;
  placeBld(38, hutY, 'houseD'); for (let x = 38; x <= 40; x++) g[idx(x, hutY + 1)] = DIRT;
  JORDAN.hut = [39.5, hutY + 1.6]; JORDAN.dock = [32.5, d0 - .3]; JORDAN.boat = [35.6, 48.1];
  // little boats, ducks, signs
  World.place(26, 46, { t: 'coracle', v: 2 }); World.place(45, 45, { t: 'coracle' });
  for (const [x, y] of [[14, 2], [28, 11], [39, 18], [58, 26], [19, 33]]) if (g[idx(x, y)] === WATER && !o[idx(x, y)]) World.place(x, y, { t: 'duck', v: ri(0, 3) });
  World.place(36, 2, { t: 'sign', text: 'The Jordan River. Follow the road south to the beach and Galilee Bay. North leads back to Bethlehem.' });
  World.place(29, d0 - 1, { t: 'sign', text: 'Peter’s dock. Hop in the rowing boat at the end and sail south past the bay to find the deep sea.' });
  // reeds by the water, trees and tall grass on the banks, rocks and driftwood on the sand
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y); if (o[i] || g[i] === WATER) continue;
    const nearW = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) >= 0 && g[at(x + dx, y + dy)] === WATER), nearRoad = x >= 26 && x <= 37;
    if (g[i] === DIRT) { if (!nearRoad && y > 30 && R() < .03) o[i] = { t: 'rock' }; else if (!nearRoad && y > 30 && R() < .02) o[i] = { t: 'twig' }; continue }
    if (nearW && R() < .4) o[i] = { t: 'deco', v: ri(0, 7) };
    else if (!nearW && !(x >= 32 && x <= 37) && R() < .07) o[i] = { t: 'wild', k: pick(['olive', 'olive', 'oak', 'tree2']), v: ri(0, 3) };
    else if (!(x >= 32 && x <= 37) && R() < .05) o[i] = { t: 'grass', v: ri(0, 3) };
  }
  fillBorder(R);
}
// the open sea south of the bay: shallow near the top, a big patch of dark deep water further out, and two little islands
const SEA = { deep: null };
function seaDepth(x, y) { return Math.hypot((x - 33) / 21, (y - 36) / 13) + (hash(x >> 1, y >> 1) - .5) * .18 }   // under 1 = deep sea
function genSea() {
  const g = World.ground = new Uint8Array(W * H).fill(WATER), o = World.objs = new Array(W * H).fill(null); World.soil = {}; World.pave = null;
  // islands are drawn tile by tile:  ~ water  . sand  , grass   on grass: O oak  T olive  P cypress  B bush  g tall grass  H hut
  //                                  on sand: R rock  b boulder  W old boat  C campfire  X crate  S sign  d driftwood   D dock over water
  const stamp = (x0, y0, rows) => rows.forEach((row, r) => [...row].forEach((ch, c) => {
    const x = x0 + c, y = y0 + r; if (!inb(x, y)) return; const i = idx(x, y);
    g[i] = ch === '~' || ch === 'D' ? WATER : '.RbWCXSd'.includes(ch) ? DIRT : GRASS;
    const put = { O: { t: 'wild', k: 'oak' }, T: { t: 'wild', k: 'olive' }, P: { t: 'wild', k: 'tree2' }, B: { t: 'bush', v: 0 }, g: { t: 'grass', v: (x * y) % 4 }, R: { t: 'rock' }, b: { t: 'boulder' },
      W: { t: 'wreck' }, C: { t: 'campfire' }, X: { t: 'crate', camp: 1 }, d: { t: 'twig' }, D: { t: 'dock' }, S: { t: 'sign', text: '' } }[ch];
    if (put) o[i] = Object.assign({ v: (x + y) % 4 }, put);
  }));
  // Gull Island: a round island with a grassy middle, a fishing camp on the south beach and a pier for your boat
  stamp(5, 8, [
    '~~~~~~~.....~~~~~~~',
    '~~~~.....S.....~~~~',
    '~~~...,,,,,,,....~~',
    '~~..,,O,,,,P,,,...~',
    '~..,,,,,,B,,,,T,,.~',
    '~.,,T,,g,,,,,,,,,.~',
    '..,,,,,,,,,O,,g,,..',
    '.W.,,B,,,,,,,,,,..~',
    '~..,,,,,P,,,,B,,.R~',
    '~~..,,g,,,,,,,,..~~',
    '~~~...,,,,,,,....~~',
    '~~~~.C.X....d...~~~',
    '~~~~~~~.....~~~~~~~',
    '~~~~~~~~~D~~~~~~~~~',
    '~~~~~~~~~D~~~~~~~~~',
    '~~~~~~~~~D~~~~~~~~~']);
  o[idx(14, 9)].text = 'Gull Island. Fishermen camp here on long trips. Look for seashells on the beach.';
  o[idx(14, 23)].end = true; SEA.pier = [15.6, 22.6];
  // Cove Island: a horseshoe of land around a calm lagoon you can row into, with a little hut
  stamp(39, 3, [
    '~~~~~~~......~~~~~~~~',
    '~~~~..S..,,,,....~~~~',
    '~~~..,,,P,,,,,O,,..~~',
    '~~..,,,,,,,,B,,,,,..~',
    '~..,,O,,,,,,,,,P,,..~',
    '~.,,,,,,,,,,,,,,,,b.~',
    '..,,P,,,,~~D~~,,,,,.~',
    '.,,g,,,.~~~D~~~.,,,..',
    '..,,,,..~~~~~~~~.,P..',
    '~.,B,,.~~~~~~~~~.,,.~',
    '~..,,..~~~~~~~~~..g.~',
    '~~.R..~~~~~~~~~~~...~',
    '~~~..~~~~~~~~~~~~~.d~',
    '~~~~~~~~~~~~~~~~~~~~~']);
  o[idx(45, 4)].text = 'Cove Island. The lagoon is calm, even on windy days.';
  o[idx(50, 10)].end = true;
  placeBld(46, 7, 'houseD');                         // the hut, standing on the grass north of the lagoon
  // the lighthouse on its rocky islet
  for (let y = 41; y <= 47; y++) for (let x = 47; x <= 55; x++) if (Math.hypot((x + .5 - 51) / 3.4, (y + .5 - 44.2) / 2.6) + (hash(x * 3, y * 5) - .5) * .2 < 1) g[idx(x, y)] = DIRT;
  SEA.deep = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) SEA.deep[idx(x, y)] = g[idx(x, y)] === WATER && seaDepth(x, y) < 1 ? 1 : 0;
  o[idx(51, 43)] = { t: 'lighthouse' }; o[idx(49, 44)] = { t: 'boulder' }; o[idx(53, 45)] = { t: 'rock' };
  for (const [x, y] of [[28, 6], [52, 12], [6, 30]]) o[idx(x, y)] = { t: 'duck', v: 1 };
  spawnShells();
}
// seashells wash up on the island beaches each day
function spawnShells() {
  const m = World.maps.sea || World; if (!m.objs) return; const R = mulberry(state ? state.totalDay * 7 + 3 : 3);
  for (let i = 0; i < W * H; i++) if (m.objs[i] && m.objs[i].t === 'shell') m.objs[i] = null;
  for (let n = 0, tries = 0; n < 5 && tries < 400; tries++) { const x = Math.floor(R() * W), y = Math.floor(R() * H), i = idx(x, y); if (m.ground[i] === DIRT && !m.objs[i]) { m.objs[i] = { t: 'shell', v: Math.floor(R() * 3) }; n++ } }
}
function drawSeaObj(g, o, x, y, t) {
  const X = x * 16, Y = y * 16, ink = '#2e1a0e';
  if (o.t === 'shell') { const s = AT.ic_shell[0]; g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(X + 4, Y + 12, 8, 2); g.save(); g.translate(X + 8, Y + 10); if (o.v === 1) g.rotate(.5); if (o.v === 2) g.scale(-1, 1); g.drawImage(s, -6, -6); g.restore(); if (Math.sin(t * 3 + x * 7) > .93) { g.fillStyle = '#fff'; g.fillRect(X + 10, Y + 5, 1, 3); g.fillRect(X + 9, Y + 6, 3, 1) } }
  else if (o.t === 'wreck') { const s = AT.coracle_land[0]; g.drawImage(s, Math.round(X + 8 - s.width / 2), Y + 16 - s.height) }
  else if (o.t === 'lighthouse') {
    const cx = X + 8, B = Y + 15; g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(cx + 2, B, 11, 4, 0, 0, 7); g.fill();
    g.fillStyle = ink; g.fillRect(cx - 8, B - 6, 17, 7); g.fillStyle = '#9a958c'; g.fillRect(cx - 7, B - 5, 15, 5);                       // stone base
    for (let k = 0; k < 6; k++) { const yy = B - 6 - (k + 1) * 7, w = 12 - Math.floor(k / 2); g.fillStyle = ink; g.fillRect(cx - w / 2 - 1, yy, w + 2, 8); g.fillStyle = k % 2 ? '#c9392a' : '#f2ead8'; g.fillRect(cx - w / 2, yy, w, 7); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(cx + w / 2 - 3, yy, 3, 7) }   // striped tower
    const ty = B - 6 - 6 * 7; g.fillStyle = ink; g.fillRect(cx - 7, ty - 2, 15, 3); g.fillRect(cx - 5, ty - 11, 11, 10); g.fillStyle = '#ffe58a'; g.fillRect(cx - 4, ty - 10, 9, 8);
    g.fillStyle = ink; g.fillRect(cx - 6, ty - 15, 13, 5); g.fillStyle = '#c9392a'; g.fillRect(cx - 5, ty - 14, 11, 3); g.fillStyle = ink; g.fillRect(cx, ty - 18, 1, 4);
    const [dark] = dayLight(); if (dark > .2) { const a = t * 1.2, k = Math.min(1, (dark - .2) * 2); g.save(); g.globalAlpha = .28 * k; g.fillStyle = '#fff4b0'; g.beginPath(); g.moveTo(cx, ty - 6); g.arc(cx, ty - 6, 140, a - .12, a + .12); g.closePath(); g.fill(); g.beginPath(); g.moveTo(cx, ty - 6); g.arc(cx, ty - 6, 140, a + Math.PI - .12, a + Math.PI + .12); g.closePath(); g.fill(); g.restore() }
  }
}

// ---------- fish ----------
// where: pond (your farm), river (the Jordan and its creek), shore (the bay, from the beach or dock), sea (from Peter's boat)
// diff 0 = junk (no reeling) · lb = weight range in pounds
const WHERE = { pond: 'your farm pond', river: 'the Jordan River', shore: 'the shore of Galilee Bay', offshore: 'the open sea', sea: 'the deep sea' };
const FISH = {
  carp: { n: 'Carp', price: 30, diff: 1, where: ['pond'], w: 10, lb: [2, 14] },
  perch: { n: 'Perch', price: 36, diff: 2, where: ['pond'], w: 7, lb: [.3, 1.6] },
  catfish: { n: 'Catfish', price: 80, diff: 3, where: ['pond', 'river'], w: 5, night: true, lb: [3, 25] },
  garra: { n: 'Jordan Garra', price: 24, diff: 1, where: ['river'], w: 10, lb: [.05, .3] },
  barbel: { n: 'Jordan Barbel', price: 48, diff: 2, where: ['river'], w: 8, lb: [1, 8] },
  eel: { n: 'River Eel', price: 70, diff: 3, where: ['river'], w: 4, lb: [1, 6] },
  sardine: { n: 'Sardine', price: 18, diff: 1, where: ['shore'], w: 10, lb: [.1, .3] },
  crab: { n: 'Blue Crab', price: 40, diff: 1, where: ['shore'], w: 5, lb: [.5, 2] },
  tilapia: { n: 'St. Peter’s Fish', price: 55, diff: 2, where: ['shore'], w: 7, lb: [.5, 3] },
  mullet: { n: 'Mullet', price: 62, diff: 3, where: ['shore'], w: 5, lb: [1, 6] },
  bream: { n: 'Sea Bream', price: 95, diff: 3, where: ['shore'], w: 3, seasons: [1, 2], lb: [1, 5] },
  mackerel: { n: 'Mackerel', price: 65, diff: 2, where: ['offshore'], w: 10, lb: [.5, 3] },
  flounder: { n: 'Flounder', price: 78, diff: 2, where: ['offshore'], w: 7, lb: [1, 8] },
  seabass: { n: 'Sea Bass', price: 92, diff: 3, where: ['offshore'], w: 6, lb: [2, 12] },
  squid: { n: 'Squid', price: 110, diff: 3, where: ['offshore'], w: 4, night: true, lb: [.5, 4] },
  snapper: { n: 'Red Snapper', price: 120, diff: 3, where: ['sea'], w: 9, lb: [2, 18] },
  tuna: { n: 'Tuna', price: 150, diff: 3, where: ['sea'], w: 8, lb: [40, 250] },
  grouper: { n: 'Grouper', price: 190, diff: 4, where: ['sea'], w: 5, lb: [10, 60] },
  swordfish: { n: 'Swordfish', price: 320, diff: 5, where: ['sea'], w: 2.5, lb: [60, 400] },
  bigfish: { n: 'Great Fish', price: 800, diff: 5, where: ['sea'], w: .35, lb: [900, 2000] },
  sandal: { n: 'Old Sandal', price: 3, diff: 0, where: ['pond', 'river', 'shore', 'offshore', 'sea'], w: 1, junk: 1 },
};
// rods: Peter sells the better ones · zone = extra width of the green catch zone · bite = how fast fish bite
const RODS = [null, { n: 'Fishing Rod', zone: 0, bite: 1 }, { n: 'Sturdy Rod', zone: .05, bite: .85, price: 800, fiber: 30, d: 'Strong enough for the deep sea. A wider catch zone, too.' },
  { n: 'Master Rod', zone: .1, bite: .7, price: 2500, fiber: 60, d: 'Fish bite faster and the catch zone is widest.' }];
const rodLv = () => state.rodLv || 1;
function fishItems() {
  const o = { rod: { n: 'Fishing Rod', icon: 'ic_rod', tool: 'rod', d: 'Face the water and use it to cast. Wait for a bite, then reel the fish in.' },
    shell: { n: 'Seashell', icon: 'ic_shell', price: 15, d: 'A pretty shell from the island beaches. New ones wash up every day.' },
    bait: { n: 'Bait Minnows', icon: 'fish_garra', price: 1, d: 'Little minnows. One is used each time you cast, and fish bite twice as fast.' } };
  for (const k in FISH) { const f = FISH[k]; o['fish_' + k] = { n: f.n, icon: 'fish_' + k, price: f.price, d: f.junk ? 'Someone lost this a long time ago.' : `Caught in ${f.where.map(w => WHERE[w]).join(' and ')}${f.night ? ' at night' : ''}${f.seasons ? ' in ' + f.seasons.map(i => SEASONS[i]).join(' and ') : ''}. Sells for ₪${f.price}.` } }
  return o;
}
function setRodName() { const r = RODS[rodLv()]; ITEMS.rod.n = r.n; ITEMS.rod.d = r.d || ITEMS.rod.d }

// ---------- Peter's tackle shop ----------
function openTackle() { if (!shopOpen('tackle')) { say(closedMsg('tackle')); return } openShopModal('Peter’s Tackle', renderTackle) }
function renderTackle() {
  const b = $('#binM .mbody'), lv = rodLv();
  let h = `<div class="binhead"><span>Rods and bait</span>${money()}</div><p class="muted" style="margin:2px 0 8px">“A good rod makes all the difference out on the deep sea.” Your rod: <b>${RODS[lv].n}</b></p>`;
  for (let k = 2; k < RODS.length; k++) {
    const r = RODS[k], have = lv >= k, ready = lv === k - 1, ok = ready && state.money >= r.price && count('fiber') >= r.fiber;
    h += `<div class="shoprow ${have || ready ? '' : 'off'}"><img src="${iconURL('ic_rod')}"><div class="si"><b>${r.n}</b><div class="muted">${r.d}</div>${have ? '<div class="req ok">You have this ✓</div>' : `<div class="req"><span class="${state.money >= r.price ? 'ok' : 'no'}">₪ ${r.price.toLocaleString()}</span> · <span class="${count('fiber') >= r.fiber ? 'ok' : 'no'}">${r.fiber} fiber</span>${ready ? '' : ' · needs the rod before it'}</div>`}</div>${have ? '' : `<div class="sb"><button class="btn" data-rod="${k}" ${ok ? '' : 'disabled'}>Buy</button></div>`}</div>`;
  }
  h += `<div class="shoprow"><img src="${iconURL('fish_garra')}"><div class="si"><b>Bait ×10</b><div class="muted">Fish bite twice as fast. One is used each cast. You have ${count('bait')}.</div></div><div class="sb"><span class="price">₪ 30</span><button class="btn alt" data-bait="1" ${state.money >= 30 ? '' : 'disabled'}>Buy</button></div></div>`;
  b.innerHTML = h;
  b.querySelectorAll('[data-rod]').forEach(el => el.onclick = () => { const k = +el.dataset.rod, r = RODS[k]; if (rodLv() !== k - 1 || state.money < r.price || count('fiber') < r.fiber) return;
    state.money -= r.price; takeItem('fiber', r.fiber); state.rodLv = k; setRodName(); if (!count('rod')) addItem('rod', 1); sfx.pick(); toast(`You got the ${r.n}!`); renderTackle(); updateHUD(); save() });
  b.querySelectorAll('[data-bait]').forEach(el => el.onclick = () => { if (state.money < 30) return; if (addItem('bait', 10)) { toast('Your bag is full.'); sfx.no(); return } state.money -= 30; sfx.pick(); renderTackle(); save() });
}

// ---------- fishing ----------
let fishing = null;
const isNight = () => state.time >= 18 * 60 || state.time < 5 * 60;
// the fishing animations draw the line themselves; it always lands this far from your feet (pixels), to the side you face
const LINE_END = [29.5, 21];
function lineSpot(side) {
  const wx = player.x + side * LINE_END[0] / 16, wy = player.y + LINE_END[1] / 16, x = Math.floor(wx), y = Math.floor(wy);
  if (!inb(x, y)) return null; const o = World.objs[idx(x, y)];
  return World.ground[idx(x, y)] === WATER && !(o && (o.t === 'dock' || o.t === 'bridge')) ? { x, y, wx, wy } : null;
}
// facing up or down: the bobber lands a couple of tiles straight ahead
function lineSpotNS(dir) {
  for (const d of dir === 's' ? [2, 1.6, 2.5] : [2.5, 2.1, 3]) {
    const wx = player.x + .05, wy = player.y + (dir === 's' ? d : -d), x = Math.floor(wx), y = Math.floor(wy);
    if (!inb(x, y)) continue; const o = World.objs[idx(x, y)];
    if (World.ground[idx(x, y)] === WATER && !(o && (o.t === 'dock' || o.t === 'bridge'))) return { x, y, wx, wy };
  }
  return null;
}
function fishWhere(c) { return World.cur === 'farm' ? 'pond' : World.cur === 'sea' ? (SEA.deep[idx(c.x, c.y)] ? 'sea' : 'offshore') : World.cur === 'jordan' ? (c.y >= JORDAN.bay ? 'shore' : 'river') : 'river' }
function onDockEnd() { const o = World.objs[idx(Math.floor(player.x), Math.floor(player.y))]; return !!(o && o.t === 'dock' && o.end) }
function startFishing() {
  if (isInside() || World.cur === 'mine') { sfx.no(); return }
  // cast the way you face: straight ahead when facing up or down (or to either side if there's no water ahead)
  const ns = player.dir === 'n' || player.dir === 's' ? player.dir : null;
  let side = 0, c = ns ? lineSpotNS(ns) : null, dir = c ? ns : null;
  if (!c) { const pref = player.dir === 'l' ? [-1] : player.dir === 'r' ? [1] : [player.side || 1, -(player.side || 1)]; for (const sd of pref) { c = lineSpot(sd); if (c) { side = sd; break } } }
  if (!c) { toast('Stand at the edge of the water, facing it, to cast.'); sfx.no(); return }
  if (state.energy < 2) { toast('Too tired to fish… go and sleep.'); sfx.no(); return }
  const where = fishWhere(c);
  if (where === 'sea' && rodLv() < 2) { say('Your line would snap out here in the deep sea. Deep-sea fish need a Sturdy Rod. Peter sells them at the dock.'); sfx.no(); return }
  state.energy -= 2; if (!dir) { player.side = side; player.dir = side < 0 ? 'l' : 'r' }
  const bait = count('bait') > 0; if (bait) takeItem('bait', 1);
  fishing = { phase: 'cast', t: 0, tx: c.wx, ty: c.wy, dir, where, speed: RODS[rodLv()].bite * (bait ? .5 : 1) }; sfx.swish();
}
function stopFishing() { fishing = null; for (const id of ['#fishgame', '#catchpop']) { const el = $(id); if (el) el.remove() } return true }
function chooseFish() {
  const f = fishing, pool = [];
  for (const k in FISH) {
    const d = FISH[k]; if (!d.where.includes(f.where)) continue;
    let w = d.w; if (d.night && !isNight()) w = 0; if (d.seasons && !d.seasons.includes(state.season)) w = 0;
    if (w > 0) pool.push([k, w]);
  }
  let r = Math.random() * pool.reduce((a, p) => a + p[1], 0); for (const [k, w] of pool) { r -= w; if (r <= 0) return k } return pool[0][0];
}
function fishAction() {
  const f = fishing; if (!f) return;
  if (f.phase === 'wait') { stopFishing(); sfx.swish(); return }                      // reel in early
  if (f.phase === 'bite') { f.fish = chooseFish(); if (FISH[f.fish].junk) catchIt(); else startReel(); return }
  if (f.phase === 'game') reelTap();
  if (f.phase === 'show') closeCatch();
}
function updateFishing(dt) {
  const f = fishing; f.t += dt;
  if (f.phase === 'cast') { if (f.t >= .72 && !f.splashed) { f.splashed = 1; sfx.splash(); ripple(f.tx, f.ty) } if (f.t >= 1) { f.phase = 'wait'; f.t = 0; f.biteAt = rnd(1.6, 5.5) * f.speed } }
  else if (f.phase === 'wait' && f.t >= f.biteAt) { f.phase = 'bite'; f.t = 0; sfx.pop(); ripple(f.tx, f.ty) }
  else if (f.phase === 'bite' && f.t >= .95) { toast('It got away…'); stopFishing() }
  else if (f.phase === 'game') { reelUpdate(dt); if (Math.random() < dt * 4) ripple(f.tx + rnd(-.2, .2), f.ty) }
  else if (f.phase === 'caught') { if (f.t >= .4 && !f.yanked) { f.yanked = 1; sfx.splash(); ripple(f.tx, f.ty); ripple(f.tx, f.ty) } if (f.t >= 1.55) showCatch() }
}
function ripple(x, y) { for (let k = 0; k < 7; k++) parts.push({ x: x + rnd(-.2, .2), y, z: .1, vx: rnd(-.8, .8), vy: rnd(-.3, .3), vz: rnd(1, 2), col: '#d8f0ff', life: rnd(.3, .6) }) }

// the reeling game: a hook swings along a bar; tap when it's over the green
function startReel() {
  const f = fishing, d = FISH[f.fish].diff; f.phase = 'game'; f.t = 0;
  f.game = { pos: 0, dir: 1, speed: .7 + d * .28, zone: Math.max(.12, .36 - d * .05) + RODS[rodLv()].zone, need: d <= 1 ? 1 : d <= 3 ? 2 : 3, hits: 0, miss: 0, zc: rnd(.25, .75) };
  const el = document.createElement('div'); el.id = 'fishgame';
  el.innerHTML = `<div class="fg-card"><div class="fg-title">A bite! Reel it in!</div><div class="fg-bar"><div class="fg-zone"></div><div class="fg-needle"></div></div><div class="fg-pips">${'<i></i>'.repeat(f.game.need)}</div><div class="fg-hint">Tap when the hook is in the green</div></div>`;
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); reelTap() });
  document.body.appendChild(el); reelDraw(); sfx.tap();
}
function reelUpdate(dt) { const G = fishing.game; G.pos += G.dir * G.speed * dt; if (G.pos > 1) { G.pos = 2 - G.pos; G.dir = -1 } if (G.pos < 0) { G.pos = -G.pos; G.dir = 1 } reelDraw() }
function reelDraw() {
  const G = fishing.game, el = $('#fishgame'); if (!el) return;
  el.querySelector('.fg-needle').style.left = (G.pos * 100) + '%';
  const z = el.querySelector('.fg-zone'); z.style.left = ((G.zc - G.zone / 2) * 100) + '%'; z.style.width = (G.zone * 100) + '%';
  el.querySelectorAll('.fg-pips i').forEach((p, i) => p.className = i < G.hits ? 'on' : '');
}
function reelTap() {
  const f = fishing; if (!f || f.phase !== 'game') return; const G = f.game, el = $('#fishgame');
  if (Math.abs(G.pos - G.zc) <= G.zone / 2) {
    G.hits++; sfx.pick(); el.querySelector('.fg-bar').classList.remove('bad'); void el.offsetWidth; el.querySelector('.fg-bar').classList.add('good');
    if (G.hits >= G.need) { el.remove(); catchIt(); return }
    G.zc = rnd(.2, .8); G.speed *= 1.12;
  } else {
    G.miss++; sfx.no(); el.querySelector('.fg-bar').classList.remove('good'); void el.offsetWidth; el.querySelector('.fg-bar').classList.add('bad');
    el.querySelector('.fg-hint').textContent = G.miss >= 3 ? '' : `Careful! ${3 - G.miss} more slip${3 - G.miss === 1 ? '' : 's'} and it’s gone.`;
    if (G.miss >= 3) { el.remove(); toast('The fish slipped off the hook!'); stopFishing(); return }
  }
  reelDraw();
}
function catchIt() {
  const f = fishing, k = f.fish, d = FISH[k]; f.phase = 'caught'; f.t = 0; sfx.pick();
  f.lb = d.lb ? Math.round(rnd(d.lb[0], d.lb[1]) * (d.lb[1] < 1 ? 100 : 10)) / (d.lb[1] < 1 ? 100 : 10) : 0;
  const left = addItem('fish_' + k, 1); if (left) drop('fish_' + k, 1, player.x, player.y + .4);
  state.stats.fish = (state.stats.fish || 0) + 1; const log = state.fishLog = state.fishLog || {};
  f.first = !d.junk && !log[k]; f.record = !d.junk && !f.first && f.lb > log[k]; if (!d.junk) log[k] = Math.max(log[k] || 0, f.lb);
}
// the catch window: picture, name, weight and price
function showCatch() {
  const f = fishing; if (f.phase === 'show') return; f.phase = 'show'; const d = FISH[f.fish];
  const el = document.createElement('div'); el.id = 'catchpop';
  const badge = f.first ? '<div class="cp-badge">New fish!</div>' : f.record ? '<div class="cp-badge">Biggest yet!</div>' : '';
  const lbs = f.lb >= 10 ? f.lb.toFixed(0) : f.lb.toFixed(f.lb < 1 ? 2 : 1);
  el.innerHTML = `<div class="cp-card">${badge}<div class="cp-pic"><img src="${iconURL('fish_' + f.fish)}"></div><div class="cp-name">${d.junk ? 'Hmm… an ' + d.n : d.n}</div>
    ${d.junk ? '<div class="cp-sub">Not quite a fish.</div>' : `<div class="cp-stats"><div><b>${lbs} lb</b><span>Weight</span></div><div><b>₪ ${d.price}</b><span>Value</span></div></div>`}
    <button class="btn">Nice!</button></div>`;
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); closeCatch() });
  document.body.appendChild(el); sfx.pop(); if (f.fish === 'bigfish') banner('The Great Fish!');
}
function closeCatch() { sfx.tap(); stopFishing() }
// float, splashes, the fish leaping out on the yank, and the "!" (world pixels, drawn with the player)
function drawFishing(g) {
  const f = fishing; if (!f) return; const p = player, bx = f.tx * 16, by = f.ty * 16;
  if (f.dir) {   // facing up or down the line is drawn here, from the rod tip to the bobber
    const tip = ATMETA.char.rodtip[f.dir], x0 = p.x * 16 + tip[0], y0 = p.y * 16 + tip[1];
    let x1 = bx, y1 = by, show = ['wait', 'bite', 'game'].includes(f.phase);
    if (f.phase === 'cast') { const k = clamp((f.t - .45) / .55, 0, 1); show = k > 0; x1 = x0 + (bx - x0) * k; y1 = y0 + (by - y0) * k - Math.sin(k * Math.PI) * 10;
      if (show && k < 1) { g.fillStyle = '#2a1a10'; g.fillRect(Math.round(x1) - 1, Math.round(y1) - 1, 3, 3); g.fillStyle = '#e8402a'; g.fillRect(Math.round(x1), Math.round(y1) - 1, 1, 2) } }
    if (show) { g.fillStyle = 'rgba(245,245,245,.85)'; const n = Math.max(4, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
      for (let i = 0; i <= n; i++) { const k = i / n, sag = Math.sin(k * Math.PI) * (f.phase === 'game' ? 1 : 4); g.fillRect(Math.round(x0 + (x1 - x0) * k), Math.round(y0 + (y1 - y0) * k + sag), 1, 1) } }
  }
  const float = (dip) => { const y = Math.round(by + dip), x = Math.round(bx); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(x, y + 1, 3.5 + Math.sin(GT * 3) * .6, 1.3, 0, 0, 7); g.fill(); g.fillStyle = '#2a1a10'; g.fillRect(x - 2, y - 4, 4, 5); g.fillStyle = '#e8392a'; g.fillRect(x - 1, y - 4, 2, 2); g.fillStyle = '#fff'; g.fillRect(x - 1, y - 2, 2, 2) };
  if (f.phase === 'wait') float(Math.sin(GT * 3) * .7);
  if (f.phase === 'bite') float(2 + Math.sin(GT * 30));
  if (f.phase === 'game') { const sx = Math.sin(GT * 9) * 3; g.fillStyle = 'rgba(30,50,70,.45)'; g.beginPath(); g.ellipse(bx + sx, by + 2, 6, 2, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(bx + sx, by + 1, 4 + Math.sin(GT * 14), 1.4, 0, 0, 7); g.fill() }
  if (f.phase === 'bite' || f.phase === 'game') { const y = p.y * 16 - 40 - Math.abs(Math.sin(GT * 12)) * 2, x = Math.round(p.x * 16); g.fillStyle = '#2a1a10'; g.fillRect(x - 2, Math.round(y) - 1, 5, 11); g.fillStyle = '#ffd34a'; g.fillRect(x - 1, Math.round(y), 3, 6); g.fillRect(x - 1, Math.round(y) + 7, 3, 2) }
  if (f.phase === 'caught' || f.phase === 'show') {
    // the fish thrashes at the surface, then flies up in an arc to above your head
    const ic = AT['fish_' + f.fish][0], hx = p.x * 16, hy = p.y * 16 - 36, k = clamp((f.t - .4) / .55, 0, 1), e = 1 - (1 - k) * (1 - k);
    let x, y, rot;
    if (f.phase === 'show' || f.t >= .95) { x = hx; y = hy - Math.sin(GT * 4) * 1.5; rot = 0 }
    else if (f.t < .4) { x = bx + Math.sin(GT * 30) * 2; y = by - 3; rot = Math.sin(GT * 25) * .5 }
    else { x = bx + (hx - bx) * e; y = by + (hy - by) * e - Math.sin(k * Math.PI) * 28; rot = (1 - k) * p.side * 4 }
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(rot); if (p.side < 0) g.scale(-1, 1); g.drawImage(ic, -Math.round(ic.width / 2), -Math.round(ic.height / 2)); g.restore();
    if (f.t >= .4 && f.t < .95) for (let i = 0; i < 2; i++) { g.fillStyle = 'rgba(220,240,255,.85)'; g.fillRect(Math.round(x - p.side * (5 + i * 4)), Math.round(y + 2 + i * 3), 2, 2) }   // water drips
  }
}
function fishAnim() {
  const f = fishing;
  const d = f.dir ? '_' + f.dir : '';
  if (f.phase === 'cast') return ['casting' + d, Math.min(14, Math.floor(f.t * 15))];
  if (f.phase === 'game') return ['reeling' + d, Math.floor(GT * 12)];
  if (f.phase === 'caught') return ['caught' + d, Math.min(8, Math.floor(f.t / .95 * 9))];
  if (f.phase === 'show') return ['caught' + d, 8];
  return ['waiting' + d, Math.floor(GT * 8)];
}

// ---------- drawing the dock, bridge, boats and ducks ----------
function drawFloorObj(g, o, x, y) {
  const X = x * 16, Y = y * 16, ink = '#3a2414';
  if (o.t === 'dock') {
    const water = (dx, dy) => inb(x + dx, y + dy) && World.ground[idx(x + dx, y + dy)] === WATER && !(World.objs[idx(x + dx, y + dy)] || {}).t?.startsWith?.('dock');
    g.fillStyle = 'rgba(20,40,60,.35)'; g.fillRect(X, Y + 3, 16, 16);                                            // shadow on the water
    for (let k = 0; k < 4; k++) { g.fillStyle = ink; g.fillRect(X, Y + k * 4, 16, 4); g.fillStyle = (k + x) % 2 ? '#b07a48' : '#a06c3e'; g.fillRect(X, Y + k * 4, 16, 3); g.fillStyle = '#c99260'; g.fillRect(X + ((k * 5 + x * 3) % 9), Y + k * 4, 5, 1) }
    if (water(-1, 0)) { g.fillStyle = ink; g.fillRect(X, Y, 1, 16) } if (water(1, 0)) { g.fillStyle = ink; g.fillRect(X + 15, Y, 1, 16) }
    if (water(0, 1)) { g.fillStyle = ink; g.fillRect(X, Y + 15, 16, 1); for (const px of [X + 1, X + 12]) { g.fillStyle = ink; g.fillRect(px, Y + 15, 3, 4); g.fillStyle = '#6a4426'; g.fillRect(px + 1, Y + 15, 1, 3) } }
    if ((x === 28 || x === 33) && y === 47) { g.fillStyle = ink; g.fillRect(X + 6, Y - 4, 4, 7); g.fillStyle = '#8e5e36'; g.fillRect(X + 7, Y - 3, 2, 5) }     // mooring posts
  } else if (o.t === 'bridge') {
    const v = o.d !== 'h', onWater = World.ground[idx(x, y)] === WATER;
    // planks run across the direction of travel
    for (let k = 0; k < 4; k++) { const c = (k + (v ? y : x)) % 2 ? '#b98352' : '#a87444';
      if (v) { g.fillStyle = c; g.fillRect(X, Y + k * 4, 16, 3); g.fillStyle = ink; g.fillRect(X, Y + k * 4 + 3, 16, 1); g.fillStyle = '#d09a62'; g.fillRect(X + 3 + ((k * 3 + y) % 6), Y + k * 4, 4, 1) }
      else { g.fillStyle = c; g.fillRect(X + k * 4, Y, 3, 16); g.fillStyle = ink; g.fillRect(X + k * 4 + 3, Y, 1, 16); g.fillStyle = '#d09a62'; g.fillRect(X + k * 4, Y + 3 + ((k * 3 + x) % 6), 1, 4) } }
    // railings on the outer edges, with posts
    const rail = (rx, ry, rw, rh) => { g.fillStyle = ink; g.fillRect(rx, ry, rw, rh); g.fillStyle = '#7a4a2a'; g.fillRect(rx + (v ? 1 : 0), ry + (v ? 0 : 1), v ? rw - 2 : rw, v ? rh : rh - 2); g.fillStyle = '#a06a3e'; g.fillRect(rx + (v ? 1 : 0), ry + (v ? 0 : 1), v ? 1 : rw, v ? rh : 1) };
    const post = (px_, py_) => { g.fillStyle = ink; g.fillRect(px_ - 1, py_ - 1, 6, 5); g.fillStyle = '#8e5e36'; g.fillRect(px_, py_, 4, 3); g.fillStyle = '#b07848'; g.fillRect(px_, py_, 4, 1) };
    const edges = o.side === 0 ? [-1, 1] : [o.side];
    for (const e of edges) {
      if (v) { const rx = e < 0 ? X : X + 12; if (onWater) { g.fillStyle = 'rgba(20,40,60,.35)'; g.fillRect(e < 0 ? X - 3 : X + 16, Y, 3, 16) } rail(rx, Y, 4, 16); post(rx, Y + 2); post(rx, Y + 10) }
      else { const ry = e < 0 ? Y - 2 : Y + 12; if (onWater && e > 0) { g.fillStyle = 'rgba(20,40,60,.35)'; g.fillRect(X, Y + 16, 16, 3) } rail(X, ry, 16, 4); post(X + 2, ry); post(X + 10, ry) }
    }
    if (o.end) { g.fillStyle = ink; if (v) g.fillRect(X, o.end === 'a' ? Y : Y + 15, 16, 1); else g.fillRect(o.end === 'a' ? X : X + 15, Y, 1, 16) }
  }
}
// ---------- the rowing boat you can sail ----------
// state.boat = where it is tied up (map, x, y, dir) · state.inBoat = you're sitting in it
let boatV = [0, 0];
function boatHome() { return { map: 'jordan', x: JORDAN.boat[0], y: JORDAN.boat[1], dir: 'r' } }
function boat() { return state.boat || (state.boat = boatHome()) }
// a cached top-down sprite of the hull, bow pointing right (44 x 20)
let BOAT_SPR = null;
function boatSprite() {
  if (BOAT_SPR) return BOAT_SPR;
  const c = mkc(44, 20), g = c.getContext('2d'), P = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x + 22, y + 10, w, h) };
  const L = r => -16 + Math.round(Math.pow(Math.abs(r) / 8.5, 3) * 4), R = r => 12 + Math.round((1 - Math.pow(Math.abs(r) / 8.5, 2)) * 8);
  for (let r = -8; r <= 8; r++) P('#2e1a0e', L(r), r, R(r) - L(r) + 1);                                     // outline
  for (let r = -7; r <= 7; r++) P(Math.abs(r) > 5 ? '#7e3326' : '#9a3b2a', L(r) + 1, r, R(r) - L(r) - 1);       // red-painted hull
  for (let r = -6; r <= 6; r++) P('#efe2c0', L(r) + 2, r, R(r) - L(r) - 3);                                     // cream gunwale
  for (let r = -5; r <= 5; r++) P(Math.abs(r) % 2 ? '#c08a54' : '#b47e4a', L(r) + 3, r, R(r) - L(r) - 5);       // floorboards
  for (let x = -11; x < 12; x += 4) for (let r = -5; r <= 5; r++) if (x > L(r) + 3 && x < R(r) - 2) P('#8e5a32', x, r);   // ribs
  for (const sx of [-8, 4]) { P('#2e1a0e', sx - 1, -6, 5, 13); P('#6a4426', sx, -6, 3, 13); P('#8e5e36', sx, -6, 1, 13) }   // two seats
  P('#d9a868', 13, -2, 4, 5); P('#2e1a0e', 13, -2, 4, 1);                                                       // little bow deck
  P('#c9a06a', -13, -2, 3, 3); P('#8e6a3a', -12, -1, 1, 1);                                                    // coil of rope
  P('#ffffff55', L(-6) + 3, -6, R(-6) - L(-6) - 6, 1);                                                          // shine
  return BOAT_SPR = c;
}
function boatPose(g, cx, cy, dir) { g.translate(Math.round(cx), Math.round(cy)); if (dir === 'l') g.scale(-1, 1); else if (dir === 'n') g.rotate(-Math.PI / 2); else if (dir === 's') g.rotate(Math.PI / 2) }
function drawOars(g, t, rowing) { const a = rowing ? Math.sin(t * 9) * 4 : 0;
  for (const sd of [-1, 1]) { const ex = -7 + a, ey = sd * 14; g.strokeStyle = '#2e1a0e'; g.lineWidth = 3; g.beginPath(); g.moveTo(-1, sd * 5); g.lineTo(ex, ey); g.stroke(); g.strokeStyle = '#c99460'; g.lineWidth = 1; g.beginPath(); g.moveTo(-1, sd * 5); g.lineTo(ex, ey); g.stroke();
    g.fillStyle = '#2e1a0e'; g.fillRect(Math.round(ex) - 2, ey - (sd < 0 ? 4 : 0), 5, 5); g.fillStyle = '#d9a868'; g.fillRect(Math.round(ex) - 1, ey - (sd < 0 ? 3 : -1), 3, 3) } }
// layer 'all' = the whole boat; 'under' + 'over' sandwich you sitting in it ('over' is the part in front of your legs)
function drawRowboat(g, cx, cy, dir, t, rowing, layer = 'all') {
  const spr = boatSprite(), bob = Math.round(Math.sin(t * 2) * .6);
  if (layer !== 'over') {   // ripples around the hull
    g.fillStyle = 'rgba(255,255,255,.28)'; const v = dir === 'n' || dir === 's'; g.beginPath(); g.ellipse(cx, cy + 2, v ? 11 : 24, v ? 22 : 11, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(10,30,50,.3)'; g.beginPath(); g.ellipse(cx + 1, cy + 4, v ? 10 : 22, v ? 21 : 10, 0, 0, 7); g.fill();
  }
  g.save();
  if (layer === 'over') { g.beginPath(); g.rect(cx - 40, cy + 3 + bob, 80, 40); g.clip() }
  boatPose(g, cx, cy + bob, dir); drawOars(g, t, rowing); g.drawImage(spr, -22, -10); g.restore();
}
// can the boat sit here? every point under the hull has to be open water
function boatFree(x, y, dir) {
  const v = dir === 'n' || dir === 's', pts = v ? [[0, -1.15], [0, 1.0], [-.45, 0], [.45, 0], [0, 0]] : [[-1.0, 0], [1.15, 0], [0, -.45], [0, .45], [0, 0]];
  for (const [dx, dy] of pts) { const cx = Math.floor(x + dx), cy = Math.floor(y + dy); if (!inb(cx, cy) || World.ground[idx(cx, cy)] !== WATER) return false; const o = World.objs[idx(cx, cy)]; if (o && o.t !== 'duck') return false }
  return true;
}
function boatMove(dt, mx, my) {
  const B = boat(), acc = 10, max = 4.8, l = Math.hypot(mx, my);
  if (l > .1) { boatV[0] += mx / Math.max(1, l) * acc * dt; boatV[1] += my / Math.max(1, l) * acc * dt; const nd = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 'l' : 'r') : (my < 0 ? 'n' : 's'); if (nd !== B.dir && boatFree(player.x, player.y, nd)) B.dir = nd }
  const sp = Math.hypot(boatV[0], boatV[1]); if (sp > max) { boatV[0] *= max / sp; boatV[1] *= max / sp }
  boatV[0] *= Math.pow(.25, dt); boatV[1] *= Math.pow(.25, dt);
  const nx = player.x + boatV[0] * dt, ny = player.y + boatV[1] * dt;
  if (boatFree(nx, player.y, B.dir)) player.x = nx; else boatV[0] = 0;
  if (boatFree(player.x, ny, B.dir)) player.y = ny; else boatV[1] = 0;
  B.x = player.x; B.y = player.y; B.map = World.cur; player.dir = B.dir; if (B.dir === 'l' || B.dir === 'r') player.side = B.dir === 'l' ? -1 : 1;
  player.moving = false; player.rowing = Math.hypot(boatV[0], boatV[1]) > .4;
  if (player.rowing && Math.random() < dt * 6) parts.push({ x: player.x + rnd(-.8, .8), y: player.y + .4, z: .05, vx: -boatV[0] * .2, vy: -boatV[1] * .2, vz: .6, col: '#e8f6ff', life: .4 });
}
// the action button near or in the boat: get in, get out, or fish
async function sailTo(map, x, y, dir) { const B = boat(); if (B.sailing) return; B.sailing = 1; boatV = [0, 0]; await travel(map, x, y, dir); B.map = map; B.x = player.x; B.y = player.y; B.dir = dir; B.sailing = 0 }
let boatCool = 0;
function boatAction() {
  const B = boat(); if (performance.now() < boatCool) return state.inBoat; boatCool = performance.now() + 600;
  if (state.inBoat) {
    // step off onto any dock, bridge or bank right next to the boat
    let best = null, bd = 2.1;
    for (let y = Math.floor(player.y) - 2; y <= Math.floor(player.y) + 2; y++) for (let x = Math.floor(player.x) - 2; x <= Math.floor(player.x) + 2; x++) {
      if (!inb(x, y) || World.solid(x, y)) continue; const d = Math.hypot(x + .5 - player.x, y + .5 - player.y); if (d < bd) { bd = d; best = [x, y] } }
    if (best) { state.inBoat = false; boatV = [0, 0]; B.x = player.x; B.y = player.y; player.x = best[0] + .5; player.y = best[1] + .6; sfx.splash(); return true }
    const it = selItem(); if (it && it.id === 'rod') { boatV = [0, 0]; startFishing(); return true }
    toast('Row up to the dock or a beach to step out. Select your rod to fish from the boat.'); return true;
  }
  if (B.map === World.cur && Math.hypot(B.x - player.x, B.y - player.y) < 2.6) {
    state.inBoat = true; boatV = [0, 0]; player.x = B.x; player.y = B.y; player.dir = B.dir; sfx.splash();
    if (!state.boatTip) { state.boatTip = 1; toast('Use the joystick to row. Head south past the bay to find the deep sea!') }
    return true;
  }
  return false;
}
// deep water: darker the further out you go, with glints of light
function drawSeaWater(g, x0, y0, x1, y1, t) {
  // a soft shading layer, worked out once at 4 points per tile and smoothed when drawn
  if (!SEA.shade) { const c = mkc(W * 4, H * 4), q = c.getContext('2d'), im = q.createImageData(W * 4, H * 4);
    for (let y = 0; y < H * 4; y++) for (let x = 0; x < W * 4; x++) { const tx = x / 4, ty = y / 4, d = Math.hypot((tx - 33) / 21, (ty - 36) / 13) + (hash(tx >> 1, ty >> 1) - .5) * .18, a = clamp((1.12 - d) * 1.7, 0, .58), i = (y * W * 4 + x) * 4;
      im.data[i] = 6; im.data[i + 1] = 26; im.data[i + 2] = 74; im.data[i + 3] = World.ground[idx(tx | 0, ty | 0)] === WATER ? a * 255 : 0 }
    q.putImageData(im, 0, 0); SEA.shade = c }
  const sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = true; g.drawImage(SEA.shade, 0, 0, W * 16, H * 16); g.imageSmoothingEnabled = sm;
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
    if (World.ground[idx(x, y)] !== WATER) continue;
    const h = hash(x, y); if (h > .85) { const k = (t * .5 + h * 10) % 3; if (k < 1) { g.fillStyle = `rgba(255,255,255,${.5 * (1 - Math.abs(k - .5) * 2)})`; g.fillRect(x * 16 + (h * 97 % 12 | 0), y * 16 + (h * 53 % 12 | 0), 4, 1) } }
  }
}

function drawWaterObj(g, o, x, y, t) {
  const X = x * 16 + 8, B = y * 16 + 14;
  if (o.t === 'coracle') { const fr = AT.coracle, f = fr[Math.floor(t * 3 + (o.v || 0)) % fr.length]; g.drawImage(f, Math.round(X - f.width / 2), Math.round(B - f.height + 4)) }
  else if (o.t === 'duck') { const fr = AT.duck, f = fr[Math.floor(t * 4 + (o.v || 0)) % fr.length], dx = Math.sin(t * .4 + o.v) * 5; g.drawImage(f, Math.round(X - f.width / 2 + dx), Math.round(B - f.height)) }
}
// ---------- Peter the fisherman ----------
async function peterGift() {
  if (state.gotRod) return; state.gotRod = 1;
  await say('You don’t have a rod? Here, take my spare. Face the water, cast, and when the float bobs, pull! Then tap when the hook is over the green.', null, { name: 'Peter', frames: npcs.find(n => n.v.id === 'peter').frames });
  if (addItem('rod', 1)) drop('rod', 1, player.x, player.y + .4); sfx.pick(); toast('You got a Fishing Rod!');
}
