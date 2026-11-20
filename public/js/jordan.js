// ===================== the Jordan River, Galilee Bay and fishing =====================
'use strict';
const JORDAN = { name: 'The Jordan', bay: 39 };
const shoreY = x => 40 + Math.round(Math.sin(x / 6.5) * 1.6 + Math.sin(x / 2.7 + 1) * .7);   // first water row of the bay in column x

function genJordan() {
  const R = mulberry(31337), ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const g = World.ground = new Uint8Array(W * H).fill(GRASS), o = World.objs = new Array(W * H).fill(null); World.soil = {}; World.pave = null;
  const at = (x, y) => inb(x, y) ? idx(x, y) : -1;
  // rivers: circles stamped along a path, with a little wobble in the width
  const carve = (pts, wd) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
      for (let s = 0; s <= L; s += .25) {
        const cx = ax + (bx - ax) * s / L, cy = ay + (by - ay) * s / L, r = wd / 2 + (hash(Math.round(cx * 2), Math.round(cy * 2)) - .5) * .7;
        for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) if (inb(x, y) && Math.hypot(x + .5 - cx, y + .5 - cy) <= r) g[idx(x, y)] = WATER;
      }
    }
  };
  carve([[57, -2], [55, 5], [50, 11], [44, 15], [39, 19], [35, 23], [31, 27], [27, 31], [25, 35], [25, 42]], 3.6);     // the Jordan
  carve([[6, -2], [8, 6], [11, 13], [15, 20], [19, 26], [22, 31], [25, 35]], 2.4);                                   // a stream joining it
  // Galilee Bay along the bottom, with a sandy beach above it
  for (let x = 0; x < W; x++) { const s = shoreY(x); for (let y = s; y < H; y++) g[idx(x, y)] = WATER; for (let y = s - 3 - (hash(x, 9) > .5 ? 1 : 0); y < s; y++) if (g[idx(x, y)] === GRASS) g[idx(x, y)] = DIRT }
  // the road down from Bethlehem, with a bridge where it crosses the river
  const wet = []; for (let y = 0; y < shoreY(34) - 1; y++) for (const x of [34, 35]) { if (g[idx(x, y)] === WATER) wet.push(y); else g[idx(x, y)] = DIRT }
  const by0 = Math.min(...wet) - 1, by1 = Math.max(...wet) + 1;
  for (let y = by0; y <= by1; y++) for (const x of [34, 35]) o[idx(x, y)] = { t: 'bridge', side: x === 34 ? -1 : 1, end: y === by0 ? 'top' : y === by1 ? 'bot' : '' };
  for (const x of [33, 36]) for (let y = 0; y < 3; y++) g[idx(x, y)] = DIRT;
  // the dock: out from the beach into the bay, with a wider end
  const d0 = shoreY(30) - 2;
  for (let y = d0; y <= 48; y++) for (const x of [30, 31]) o[idx(x, y)] = { t: 'dock', end: y >= 47 };
  for (let x = 28; x <= 33; x++) for (const y of [47, 48]) o[idx(x, y)] = { t: 'dock', end: true };
  for (let x = 32; x <= 33; x++) g[idx(x, d0)] = DIRT;
  // Peter's hut on the beach
  const hutY = Math.min(shoreY(38), shoreY(39), shoreY(40)) - 3;
  for (let y = hutY - 2; y <= hutY + 1; y++) for (let x = 37; x <= 41; x++) if (g[idx(x, y)] === WATER) g[idx(x, y)] = DIRT;
  placeBld(38, hutY, 'houseD'); for (let x = 38; x <= 40; x++) g[idx(x, hutY + 1)] = DIRT;
  JORDAN.hut = [39.5, hutY + 1.6]; JORDAN.dock = [32.5, d0 - .3];
  // boats, ducks, signs
  World.place(35, 45, { t: 'coracle' }); World.place(26, 46, { t: 'coracle', v: 2 });
  for (const [x, y] of [[49, 12], [41, 18], [12, 15], [27, 33]]) if (g[idx(x, y)] === WATER) World.place(x, y, { t: 'duck', v: ri(0, 3) });
  World.place(36, 2, { t: 'sign', text: 'The Jordan River. Follow the road south to the beach and Galilee Bay. North leads back to Bethlehem.' });
  World.place(29, d0 - 1, { t: 'sign', text: 'Peter’s dock. Big fish bite at the far end.' });
  // reeds by the water, trees and tall grass on the banks, rocks and driftwood on the sand
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y); if (o[i] || g[i] === WATER) continue;
    const nearW = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) >= 0 && g[at(x + dx, y + dy)] === WATER), nearRoad = x >= 26 && x <= 37;
    if (g[i] === DIRT) { if (!nearRoad && y > 30 && R() < .03) o[i] = { t: 'rock' }; else if (!nearRoad && y > 30 && R() < .02) o[i] = { t: 'twig' }; continue }
    if (nearW && R() < .45) o[i] = { t: 'deco', v: ri(0, 7) };
    else if (!nearW && !nearRoad && R() < .07) o[i] = { t: 'wild', k: pick(['olive', 'olive', 'oak', 'tree2']), v: ri(0, 3) };
    else if (!nearRoad && R() < .05) o[i] = { t: 'grass', v: ri(0, 3) };
  }
  fillBorder(R);
}

// ---------- fish ----------
// where: pond (your farm), river, bay · diff 0 = junk (no reeling)
const FISH = {
  sardine: { n: 'Sardine', price: 18, diff: 1, where: ['bay'], w: 10, lb: [.1, .3], cm: [12, 20] },
  carp: { n: 'Carp', price: 30, diff: 1, where: ['pond', 'river'], w: 10, lb: [2, 14], cm: [25, 60] },
  perch: { n: 'Perch', price: 36, diff: 2, where: ['pond'], w: 6, lb: [.3, 1.6], cm: [15, 35] },
  tilapia: { n: 'St. Peter’s Fish', price: 55, diff: 2, where: ['bay', 'river'], w: 6, lb: [.5, 3], cm: [20, 40] },
  barbel: { n: 'Jordan Barbel', price: 48, diff: 2, where: ['river'], w: 7, lb: [1, 8], cm: [25, 55] },
  catfish: { n: 'Catfish', price: 80, diff: 3, where: ['river', 'pond'], w: 5, night: true, lb: [3, 25], cm: [40, 110] },
  mullet: { n: 'Mullet', price: 62, diff: 3, where: ['bay'], w: 5, lb: [1, 6], cm: [25, 50] },
  bream: { n: 'Sea Bream', price: 95, diff: 4, where: ['bay'], w: 3, seasons: [1, 2], lb: [1, 5], cm: [25, 45] },
  bigfish: { n: 'Great Fish', price: 600, diff: 5, where: ['bay'], w: 0, lb: [150, 400], cm: [180, 320] },
  sandal: { n: 'Old Sandal', price: 3, diff: 0, where: ['pond', 'river', 'bay'], w: 1.2, junk: 1 },
};
function fishItems() {
  const o = { rod: { n: 'Fishing Rod', icon: 'ic_rod', tool: 'rod', d: 'Face the water and use it to cast. Wait for a bite, then reel the fish in.' } };
  for (const k in FISH) { const f = FISH[k]; o['fish_' + k] = { n: f.n, icon: 'fish_' + k, price: f.price, d: f.junk ? 'Someone lost this a long time ago.' : `A fish from the ${f.where.map(w => ({ pond: 'farm pond', river: 'Jordan River', bay: 'bay' })[w]).join(' and ')}${f.night ? ', caught at night' : ''}. Sells for ₪${f.price}.` } }
  return o;
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
function fishWhere(c) { return World.cur === 'farm' ? 'pond' : World.cur === 'jordan' ? (c.y >= JORDAN.bay ? 'bay' : 'river') : 'river' }
function onDockEnd() { const o = World.objs[idx(Math.floor(player.x), Math.floor(player.y))]; return !!(o && o.t === 'dock' && o.end) }
function startFishing() {
  if (isInside()) { sfx.no(); return }
  // cast to the side you face; facing up or down, try the side you last faced, then the other
  const pref = player.dir === 'l' ? [-1] : player.dir === 'r' ? [1] : [player.side || 1, -(player.side || 1)];
  let side = 0, c = null; for (const sd of pref) { c = lineSpot(sd); if (c) { side = sd; break } }
  if (!c) { toast('Stand at the edge of the water, facing it, to cast.'); sfx.no(); return }
  if (state.energy < 2) { toast('Too tired to fish… go and sleep.'); sfx.no(); return }
  state.energy -= 2; player.side = side; player.dir = side < 0 ? 'l' : 'r';
  fishing = { phase: 'cast', t: 0, tx: c.wx, ty: c.wy, where: fishWhere(c) }; sfx.swish();
}
function stopFishing() { fishing = null; for (const id of ['#fishgame', '#catchpop']) { const el = $(id); if (el) el.remove() } return true }
function chooseFish() {
  const f = fishing, pool = [];
  for (const k in FISH) {
    const d = FISH[k]; if (!d.where.includes(f.where)) continue;
    let w = d.w; if (d.night && !isNight()) w = 0; if (d.seasons && !d.seasons.includes(state.season)) w = 0;
    if (k === 'bigfish') w = f.where === 'bay' ? (onDockEnd() ? .6 : .03) : 0;
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
  if (f.phase === 'cast') { if (f.t >= .72 && !f.splashed) { f.splashed = 1; sfx.splash(); ripple(f.tx, f.ty) } if (f.t >= 1) { f.phase = 'wait'; f.t = 0; f.biteAt = rnd(1.6, 5.5) } }
  else if (f.phase === 'wait' && f.t >= f.biteAt) { f.phase = 'bite'; f.t = 0; sfx.pop(); ripple(f.tx, f.ty) }
  else if (f.phase === 'bite' && f.t >= .95) { toast('It got away…'); stopFishing() }
  else if (f.phase === 'game') { reelUpdate(dt); if (Math.random() < dt * 4) ripple(f.tx + rnd(-.2, .2), f.ty) }
  else if (f.phase === 'caught') { if (f.t >= .4 && !f.yanked) { f.yanked = 1; sfx.splash(); ripple(f.tx, f.ty); ripple(f.tx, f.ty) } if (f.t >= 1.55) showCatch() }
}
function ripple(x, y) { for (let k = 0; k < 7; k++) parts.push({ x: x + rnd(-.2, .2), y, z: .1, vx: rnd(-.8, .8), vy: rnd(-.3, .3), vz: rnd(1, 2), col: '#d8f0ff', life: rnd(.3, .6) }) }

// the reeling game: a hook swings along a bar; tap when it's over the green
function startReel() {
  const f = fishing, d = FISH[f.fish].diff; f.phase = 'game'; f.t = 0;
  f.game = { pos: 0, dir: 1, speed: .7 + d * .28, zone: Math.max(.12, .36 - d * .05), need: d <= 1 ? 1 : d <= 3 ? 2 : 3, hits: 0, miss: 0, zc: rnd(.25, .75) };
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
  if (f.phase === 'cast') return ['casting', Math.min(14, Math.floor(f.t * 15))];
  if (f.phase === 'game') return ['reeling', Math.floor(GT * 12)];
  if (f.phase === 'caught') return ['caught', Math.min(8, Math.floor(f.t / .95 * 9))];
  if (f.phase === 'show') return ['caught', 8];
  return ['waiting', Math.floor(GT * 8)];
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
    const side = o.side, onWater = World.ground[idx(x, y)] === WATER;
    if (onWater) { g.fillStyle = 'rgba(20,40,60,.35)'; g.fillRect(side < 0 ? X - 3 : X + 16, Y, 3, 16) }          // shadow on the water beside it
    for (let k = 0; k < 4; k++) { g.fillStyle = ink; g.fillRect(X, Y + k * 4 + 3, 16, 1); g.fillStyle = (k + y) % 2 ? '#b98352' : '#a87444'; g.fillRect(X, Y + k * 4, 16, 3); g.fillStyle = '#d09a62'; g.fillRect(X + (side < 0 ? 5 : 2) + ((k * 3 + y) % 5), Y + k * 4, 4, 1) }
    // the railing on the outer edge: a beam with posts every half tile
    const rx = side < 0 ? X : X + 12;
    g.fillStyle = ink; g.fillRect(rx, Y, 4, 16); g.fillStyle = '#7a4a2a'; g.fillRect(rx + 1, Y, 2, 16); g.fillStyle = '#a06a3e'; g.fillRect(rx + 1, Y, 1, 16);
    for (const py of [Y + 2, Y + 10]) { g.fillStyle = ink; g.fillRect(rx - 1, py - 1, 6, 4); g.fillStyle = '#8e5e36'; g.fillRect(rx, py, 4, 2); g.fillStyle = '#b07848'; g.fillRect(rx, py, 4, 1) }
    if (o.end) { const ey = o.end === 'top' ? Y : Y + 15; g.fillStyle = ink; g.fillRect(X, ey, 16, 1) }
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
