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
  for (let y = 0; y < shoreY(34) - 1; y++) for (const x of [34, 35]) { if (g[idx(x, y)] === WATER) o[idx(x, y)] = { t: 'bridge' }; else g[idx(x, y)] = DIRT }
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
  sardine: { n: 'Sardine', price: 18, diff: 1, where: ['bay'], w: 10, cm: [12, 20] },
  carp: { n: 'Carp', price: 30, diff: 1, where: ['pond', 'river'], w: 10, cm: [25, 60] },
  perch: { n: 'Perch', price: 36, diff: 2, where: ['pond'], w: 6, cm: [15, 35] },
  tilapia: { n: 'St. Peter’s Fish', price: 55, diff: 2, where: ['bay', 'river'], w: 6, cm: [20, 40] },
  barbel: { n: 'Jordan Barbel', price: 48, diff: 2, where: ['river'], w: 7, cm: [25, 55] },
  catfish: { n: 'Catfish', price: 80, diff: 3, where: ['river', 'pond'], w: 5, night: true, cm: [40, 110] },
  mullet: { n: 'Mullet', price: 62, diff: 3, where: ['bay'], w: 5, cm: [25, 50] },
  bream: { n: 'Sea Bream', price: 95, diff: 4, where: ['bay'], w: 3, seasons: [1, 2], cm: [25, 45] },
  bigfish: { n: 'Great Fish', price: 600, diff: 5, where: ['bay'], w: 0, cm: [180, 320] },
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
function waterAhead() {
  const [dx, dy] = faceVec();
  for (let d = 1; d <= 4; d++) {
    const x = Math.floor(player.x + dx * d), y = Math.floor(player.y - .2 + dy * d * .9);
    if (!inb(x, y)) return null;
    const o = World.objs[idx(x, y)], wet = World.ground[idx(x, y)] === WATER && !(o && (o.t === 'dock' || o.t === 'bridge'));
    if (wet) { const x2 = x + dx, y2 = y + dy; return inb(x2, y2) && World.ground[idx(x2, y2)] === WATER && d < 3 ? { x: x2, y: y2 } : { x, y } }
    if (World.solid(x, y) && !(o && (o.t === 'dock' || o.t === 'bridge'))) return null;
  }
  return null;
}
function fishWhere(c) { return World.cur === 'farm' ? 'pond' : World.cur === 'jordan' ? (c.y >= JORDAN.bay ? 'bay' : 'river') : 'river' }
function onDockEnd() { const o = World.objs[idx(Math.floor(player.x), Math.floor(player.y))]; return !!(o && o.t === 'dock' && o.end) }
function startFishing() {
  if (isInside()) { sfx.no(); return }
  const c = waterAhead(); if (!c) { toast('Face the water to cast your line.'); sfx.no(); return }
  if (state.energy < 2) { toast('Too tired to fish… go and sleep.'); sfx.no(); return }
  state.energy -= 2; if (player.dir === 'l' || player.dir === 'r') player.side = player.dir === 'l' ? -1 : 1;
  fishing = { phase: 'cast', t: 0, tx: c.x + .5, ty: c.y + .55, where: fishWhere(c) }; sfx.swish();
}
function stopFishing() { fishing = null; const fg = $('#fishgame'); if (fg) fg.remove(); return true }
function chooseFish() {
  const f = fishing, pool = [];
  for (const k in FISH) {
    const d = FISH[k]; if (!d.where.includes(f.where)) continue;
    let w = d.w; if (d.night && !isNight()) w = 0; if (d.seasons && !d.seasons.includes(state.season)) w = 0;
    if (k === 'bigfish') w = onDockEnd() ? .6 : .03;
    if (w > 0) pool.push([k, w]);
  }
  let r = Math.random() * pool.reduce((a, p) => a + p[1], 0); for (const [k, w] of pool) { r -= w; if (r <= 0) return k } return pool[0][0];
}
function fishAction() {
  const f = fishing; if (!f) return;
  if (f.phase === 'wait') { stopFishing(); sfx.swish(); return }                      // reel in early
  if (f.phase === 'bite') { f.fish = chooseFish(); if (FISH[f.fish].junk) catchIt(); else startReel(); return }
  if (f.phase === 'game') reelTap();
}
function updateFishing(dt) {
  const f = fishing; f.t += dt;
  if (f.phase === 'cast' && f.t >= 1) { f.phase = 'wait'; f.t = 0; f.biteAt = rnd(1.6, 5.5); sfx.splash(); ripple(f.tx, f.ty) }
  else if (f.phase === 'wait' && f.t >= f.biteAt) { f.phase = 'bite'; f.t = 0; sfx.pop(); ripple(f.tx, f.ty) }
  else if (f.phase === 'bite' && f.t >= .95) { toast('It got away…'); stopFishing() }
  else if (f.phase === 'game') reelUpdate(dt);
  else if (f.phase === 'caught' && f.t >= 1.4) stopFishing();
}
function ripple(x, y) { for (let k = 0; k < 6; k++) parts.push({ x: x + rnd(-.2, .2), y, z: .1, vx: rnd(-.8, .8), vy: rnd(-.3, .3), vz: rnd(1, 2), col: '#d8f0ff', life: rnd(.3, .6) }) }

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
  const f = fishing, k = f.fish, d = FISH[k]; f.phase = 'caught'; f.t = 0;
  const left = addItem('fish_' + k, 1); if (left) drop('fish_' + k, 1, player.x, player.y + .4);
  sfx.pick(); setTimeout(() => sfx.pop(), 120);
  state.stats.fish = (state.stats.fish || 0) + 1; const log = state.fishLog = state.fishLog || {};
  if (d.junk) { toast(`You reeled in… an ${d.n.toLowerCase()}.`); return }
  const cm = Math.round(rnd(d.cm[0], d.cm[1])), first = !log[k]; log[k] = Math.max(log[k] || 0, cm);
  toast(first ? `New fish! You caught a ${d.n} (${cm} cm)!` : `You caught a ${d.n}! (${cm} cm)`);
  if (k === 'bigfish') banner('The Great Fish!');
}
// line, bobber and the "!" — drawn with the player, in world pixels
function drawFishing(g) {
  const f = fishing; if (!f) return; const p = player;
  if (f.phase === 'caught') { const ic = AT['fish_' + f.fish][0], up = Math.min(1, f.t * 3) * 6; g.drawImage(ic, Math.round(p.x * 16 - ic.width / 2), Math.round(p.y * 16 - 40 - up)); return }
  if (f.phase === 'cast') return;
  const bob = f.phase === 'bite' ? 2 : Math.sin(GT * 3) * .8, bx = f.tx * 16, by = f.ty * 16 + bob, tipX = p.x * 16 + p.side * 14, tipY = p.y * 16 - 22;
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = .6; g.beginPath(); g.moveTo(tipX, tipY); g.quadraticCurveTo((tipX + bx) / 2, Math.max(tipY, by) + 6, bx, by - 2); g.stroke();
  if (f.phase !== 'game') {
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(bx, by + 1, 3 + Math.sin(GT * 3) * .5, 1.2, 0, 0, 7); g.fill();
    g.fillStyle = '#2a1a10'; g.fillRect(Math.round(bx) - 2, Math.round(by) - 4, 4, 5); g.fillStyle = '#e8392a'; g.fillRect(Math.round(bx) - 1, Math.round(by) - 4, 2, 2); g.fillStyle = '#fff'; g.fillRect(Math.round(bx) - 1, Math.round(by) - 2, 2, 2);
  }
  if (f.phase === 'bite') { const y = p.y * 16 - 38 - Math.abs(Math.sin(GT * 12)) * 2; g.fillStyle = '#2a1a10'; g.fillRect(Math.round(p.x * 16) - 2, Math.round(y) - 1, 5, 11); g.fillStyle = '#ffd34a'; g.fillRect(Math.round(p.x * 16) - 1, Math.round(y), 3, 6); g.fillRect(Math.round(p.x * 16) - 1, Math.round(y) + 7, 3, 2) }
}
function fishAnim() {
  const f = fishing;
  if (f.phase === 'cast') return ['casting', Math.min(14, Math.floor(f.t * 15))];
  if (f.phase === 'game') return ['reeling', Math.floor(GT * 12)];
  if (f.phase === 'caught') return ['caught', Math.min(9, Math.floor(f.t * 10))];
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
    for (let k = 0; k < 4; k++) { g.fillStyle = ink; g.fillRect(X, Y + k * 4, 16, 4); g.fillStyle = (k + y) % 2 ? '#a87444' : '#986638'; g.fillRect(X, Y + k * 4, 16, 3) }
    const side = World.objs[idx(x - 1, y)] && World.objs[idx(x - 1, y)].t === 'bridge' ? 1 : -1;
    const rx = side < 0 ? X : X + 13; g.fillStyle = ink; g.fillRect(rx, Y - 2, 3, 18); g.fillStyle = '#8e5e36'; g.fillRect(rx + 1, Y - 2, 1, 18);
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
