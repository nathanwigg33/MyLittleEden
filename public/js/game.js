// My Little Promise Land — the game: player, tools, time, HUD, input, saving, main loop.
'use strict';
const SAVE_KEY = 'mlpl_save_v1';
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'], WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sabbath'], DAYS_PER_SEASON = 12;
const ITEMS = {
  axe: { n: 'Axe', icon: 'ic_axe', tool: 'axe', d: 'Chops trees, stumps and branches.' },
  pick: { n: 'Pickaxe', icon: 'ic_pick', tool: 'pick', d: 'Breaks stones and boulders.' },
  scythe: { n: 'Scythe', icon: 'ic_scythe', tool: 'scythe', d: 'Cuts weeds and tall grass.' },
  wood: { n: 'Wood', icon: 'ic_wood', price: 2, d: 'For building. Chop trees to get more.' },
  stone: { n: 'Stone', icon: 'ic_stone', price: 2, d: 'For building. Break rocks to get more.' },
  fiber: { n: 'Fiber', icon: 'ic_fiber', price: 1, d: 'Plant fibers from weeds. Used for rope and cloth.' },
};
Object.assign(ITEMS, farmItems(), townItems(), fishItems());
const TOOL_ANIM = { axe: 'axe', pick: 'mining', scythe: 'attack', hoe: 'dig', can: 'watering' }, TOOL_COST = { axe: 1, pick: 1, scythe: 0, hoe: 1, can: 1 }, TOOL_SPEED = { dig: 24, watering: 10 };
const INV_SIZE = 24, HOTBAR = 8;

let state = null, player = null, look = null, drops = [], parts = [], notes = [], falling = [], birds = [];
let GT = 0, paused = true, sleeping = false, mode = 'title';
const keys = {};
G.state = null;

function freshState(lk, seed) {
  const inv = new Array(INV_SIZE).fill(null); inv[0] = { id: 'axe', n: 1 }; inv[1] = { id: 'pick', n: 1 }; inv[2] = { id: 'scythe', n: 1 }; inv[3] = { id: 'hoe', n: 1 }; inv[4] = { id: 'can', n: 1 };
  const chest = new Array(INV_SIZE).fill(null); chest[0] = { id: 'seed_wheat', n: 15 };
  return { v: 1, look: lk, day: 1, season: 0, year: 1, time: 360, money: 500, energy: 150, maxE: 150, bin: [], chest, can: CAN_MAX, farmStart: 1, inv, sel: 0, seed, px: World.TENT.x + .5, py: World.TENT.y + 1.7, opts: { sound: true }, stats: { days: 0, chopped: 0, rocks: 0, weeds: 0 }, totalDay: 1 };
}
const weekday = () => WEEK[(state.totalDay - 1) % 7];
const fmtTime = m => { m = m % 1440; let h = Math.floor(m / 60), mm = m % 60, am = h < 12; h = h % 12 || 12; return h + ':' + String(mm).padStart(2, '0') + (am ? ' am' : ' pm') };

// ---------- inventory ----------
function addItem(id, n) {
  for (const s of state.inv) if (s && s.id === id && !ITEMS[id].tool) { s.n += n; return 0 }
  const i = state.inv.indexOf(null); if (i < 0) return n; state.inv[i] = { id, n }; return 0;
}
function count(id) { return state.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0) }
const selItem = () => state.inv[state.sel];

// ---------- notifications (Stardew-style item pop-ups) ----------
function note(id, n) {
  const e = notes.find(q => q.id === id && q.t > 0);
  if (e) { e.n += n; e.t = 3; e.el.querySelector('b').textContent = '+' + e.n; e.el.classList.remove('in'); void e.el.offsetWidth; e.el.classList.add('in'); return }
  const el = document.createElement('div'); el.className = 'note in';
  el.innerHTML = `<img src="${iconURL(ITEMS[id].icon)}"><span>${ITEMS[id].n}</span><b>+${n}</b>`; $('#notes').appendChild(el);
  notes.push({ id, n, t: 3, el });
}
function toast(msg) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; $('#toasts').appendChild(el); setTimeout(() => el.remove(), 2600) }
function banner(txt) { const b = $('#banner'); b.textContent = txt; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on') }

// ---------- dialog box ----------
let dlgOpen = false;
function say(text, choices, who) {
  return new Promise(res => {
    dlgOpen = true; const d = $('#dialog'); d.querySelector('.dt').textContent = text; const ch = d.querySelector('.dch'); ch.innerHTML = '';
    const hd = d.querySelector('.dhead'); hd.style.display = who ? 'flex' : 'none'; if (who) { d.querySelector('.dname').textContent = who.name; drawPortrait($('#dPort'), who.frames) }
    const done = v => { dlgOpen = false; d.classList.remove('on'); res(v) };
    if (choices) choices.forEach(([lab, v]) => { const b = document.createElement('button'); b.className = 'btn' + (v ? '' : ' alt'); b.textContent = lab; b.onclick = e => { e.stopPropagation(); sfx.tap(); done(v) }; ch.appendChild(b) });
    d.onclick = () => { if (!choices) done(true) };
    d.classList.add('on');
  });
}

// ---------- player ----------
function mkPlayer(x, y) { return { x, y, dir: 's', side: 1, moving: false, at: 0, act: null } }
function faceVec() { return { s: [0, 1], n: [0, -1], l: [-1, 0], r: [1, 0] }[player.dir] }
function facingCell() { const [dx, dy] = faceVec(); return [Math.floor(player.x + dx * .8), Math.floor(player.y - .25 + dy * .8)] }
// pick the best thing to hit for this tool: what's in front first, then anything close by in that direction
function findTarget(tool) {
  const [fx, fy] = facingCell(), ok = (x, y) => { const r = World.owner(x, y); return r && OBJ[r.o.t] && OBJ[r.o.t].tool === tool ? r : null };
  const f = ok(fx, fy); if (f) return f;
  let best = null, bd = 1.45; const [dx, dy] = faceVec();
  for (let y = Math.floor(player.y) - 2; y <= Math.floor(player.y) + 1; y++) for (let x = Math.floor(player.x) - 2; x <= Math.floor(player.x) + 2; x++) {
    const r = ok(x, y); if (!r) continue; const vx = x + .5 - player.x, vy = y + .55 - player.y, d = Math.hypot(vx, vy);
    const ahead = (vx * dx + vy * dy) / (d || 1); const score = d - ahead * .45; if (d < 1.6 && score < bd) { bd = score; best = r }
  }
  return best;
}
function faceToward(x, y) { const vx = x + .5 - player.x, vy = y + .5 - player.y; if (Math.abs(vx) > Math.abs(vy)) { player.dir = vx < 0 ? 'l' : 'r'; player.side = vx < 0 ? -1 : 1 } else player.dir = vy < 0 ? 'n' : 's' }

function interactTarget() {
  const [fx, fy] = facingCell(); const cells = [[fx, fy], [Math.floor(player.x), Math.floor(player.y - 1)]];
  for (const [x, y] of cells) { const r = World.owner(x, y); if (r && ['tent', 'sign', 'crate', 'campfire', 'bin', 'cart', 'bld', 'anvil', 'ifurn', 'fboat', 'helm', 'mast'].includes(r.o.t)) return r }
  return null;
}
async function action() {
  if (player.act || dlgOpen || sleeping || paused) return;
  if (fishing) { fishAction(); return }
  if (state.inBoat) { boatAction(); return }
  const vn = villagerNear(); if (vn) { talkTo(vn); return }
  if (boatAction()) return;
  const it = interactTarget();
  if (it) {
    if (it.o.t === 'bld' || it.o.t === 'anvil') { const k = it.o.k; if (it.o.t === 'anvil') say('Jesse’s outdoor anvil, for big jobs on sunny days. His shop is inside.'); else if (it.o.shop === 'market') openMarket(); else if (k === 'smithy') tryBuildingDoor('smithy'); else if (k === 'inn') tryBuildingDoor('inn'); else if (k === 'synagogue') tryBuildingDoor('synagogue'); else if (k === 'carpenter') tryBuildingDoor('carpenter'); else if (k === 'farmhouse') { const v = await say('Your farmhouse. Go to sleep for the night?', [['Sleep', 1], ['Not yet', 0]]); if (v) goSleep() } else if (k === 'coop' || k === 'barn') say(`Your new ${k} smells of fresh timber. It’s ready for animals, which are coming soon!`); else if (k === 'well') say('The old town well. The water is cool and clear.'); else say(pick(['A villager’s home. Nobody answers when you knock.', 'A villager’s home. It looks like nobody is in right now.', 'Someone’s home. You hear a pot bubbling inside, but nobody comes to the door.'])); return }
    if (it.o.t === 'ifurn') { furnitureAction(it.o); return }
    if (it.o.t === 'tent') { const v = await say('Your tent. Go to sleep for the night?', [['Sleep', 1], ['Not yet', 0]]); if (v) goSleep(); return }
    if (it.o.t === 'sign') { say(it.o.text); return }
    if (it.o.t === 'bin') { openBin(); return }
    if (it.o.t === 'crate') { openChest(); return }
    if (it.o.t === 'cart') { openShop(); return }
    if (it.o.t === 'campfire') { say('The campfire crackles. It will keep you warm at night.'); return }
  }
  const hv = harvestTarget(); if (hv) { faceToward(hv.x, hv.y); harvest(hv); return }
  const s = selItem(), item = s && ITEMS[s.id];
  if (item && item.food) { eat(state.sel); return }
  if (item && item.seed) { const c = findCell(canPlant); if (c) { faceToward(c.x, c.y); plant(c, state.sel) } else { toast('Plant seeds in soil you have dug with the hoe.'); sfx.no() } return }
  const tool = item && item.tool; if (!tool) { sfx.no(); return }
  if (tool === 'rod') { startFishing(); return }
  let cell = null, cost = TOOL_COST[tool];
  if (tool === 'hoe' || tool === 'can') { cell = toolCell(item); if (cell) faceToward(cell.x, cell.y); if (tool === 'can' && cell && isWater(cell.x, cell.y)) cost = 0 }
  if (state.energy < cost) { toast('Too tired… go to your tent and sleep.'); sfx.no(); return }
  if (tool !== 'hoe' && tool !== 'can') { const tgt = findTarget(tool); if (tgt) faceToward(tgt.x, tgt.y) }
  if (player.dir === 'l' || player.dir === 'r') player.side = player.dir === 'l' ? -1 : 1;
  const anim = TOOL_ANIM[tool], n = ATMETA.char.counts[anim];
  player.act = { anim, t: 0, dur: n / (TOOL_SPEED[anim] || 16), hitAt: tool === 'scythe' ? .3 : tool === 'can' ? .4 : .55, hit: false, tool, cell };
  state.energy = Math.max(0, state.energy - cost);
}
function hit(tool, act) {
  const [rdx, rdy] = faceVec(), row = c => Array.from({ length: rowLen(tool) }, (_, k) => ({ x: c.x + rdx * k, y: c.y + rdy * k }));
  if (tool === 'hoe') { if (!act.cell) { sfx.miss(); return } let n = 0; for (const c of row(act.cell)) if (canTill(c.x, c.y)) { till(c); n++ } else break; if (!n) sfx.miss(); return }
  if (tool === 'can') { if (!act.cell) { sfx.miss(); return } if (isWater(act.cell.x, act.cell.y)) { water(act.cell); return } for (const c of row(act.cell)) if (soilAt(c.x, c.y)) water(c); return }
  if (tool === 'scythe') {
    sfx.swish(); const [dx, dy] = faceVec(), [fx, fy] = facingCell(); const cells = [[fx, fy], [fx + dy, fy + dx], [fx - dy, fy - dx], [Math.floor(player.x), Math.floor(player.y)]];
    const t = findTarget('scythe'); if (t) cells.push([t.x, t.y]);
    for (const [x, y] of cells) { const r = World.owner(x, y); if (r && OBJ[r.o.t] && OBJ[r.o.t].tool === 'scythe') damage(r, 1) }
    return;
  }
  const r = findTarget(tool); if (!r) { sfx.miss(); return } damage(r, toolLv(tool));
}
function damage(r, dmg) {
  const { o, x, y } = r; o.hp = (o.hp || 1) - dmg; o.shake = .25;
  const cx = x + .5, cy = y + .5;
  if (OBJ[o.t].tree) { sfx.chop(); leaves(cx, cy - 1.2, 6) } else if (o.t === 'stump' || o.t === 'twig') { sfx.chop(); chips(cx, cy, '#a0703f', 4) }
  else if (o.t === 'rock' || o.t === 'boulder') { sfx.rock(); chips(cx, cy, '#9a978f', 5) } else { chips(cx, cy, '#5aa83a', 6) }
  if (o.hp > 0) return;
  World.place(x, y, null);
  switch (o.t) {
    case 'oak': case 'olive': World.place(x, y, { t: 'stump', hp: 3 }); falling.push({ o, x, y, t: 0, side: player.x < cx ? 1 : -1 }); sfx.fall(); state.stats.chopped++; break;
    case 'stump': drop('wood', ri(2, 3), cx, cy); break;
    case 'twig': drop('wood', 1, cx, cy); break;
    case 'rock': drop('stone', ri(1, 2), cx, cy); state.stats.rocks++; break;
    case 'boulder': drop('stone', ri(5, 8), cx, cy); state.stats.rocks++; break;
    case 'weed': if (Math.random() < .6) drop('fiber', 1, cx, cy); state.stats.weeds++; break;
    case 'grass': if (Math.random() < .15) drop('fiber', 1, cx, cy); break;
  }
}
// ---------- particles & drops ----------
function chips(x, y, col, n) { for (let k = 0; k < n; k++) parts.push({ x, y, z: .3, vx: rnd(-1.5, 1.5), vy: rnd(-.6, .6), vz: rnd(1.5, 3), col, life: rnd(.4, .8) }) }
function leaves(x, y, n) { for (let k = 0; k < n; k++) parts.push({ x: x + rnd(-.6, .6), y, z: 1.2, vx: rnd(-.6, .6), vy: rnd(-.2, .2), vz: rnd(-.2, .6), col: pick(['#5aa83a', '#7cc04a', '#3f8a3e']), life: rnd(.8, 1.4), leaf: 1 }) }
function drop(id, n, x, y) { for (let k = 0; k < n; k++) drops.push({ id, x, y, z: .2, vx: rnd(-1.4, 1.4), vy: rnd(-1, 1), vz: rnd(2, 3.5), t: 0 }) }
function updateDrops(dt) {
  for (const d of drops) {
    d.t += dt; d.vz -= 9 * dt; d.z += d.vz * dt; if (d.z < 0) { d.z = 0; d.vz = -d.vz * .35; d.vx *= .6; d.vy *= .6; if (Math.abs(d.vz) < .5) d.vz = 0 }
    d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= Math.pow(.2, dt); d.vy *= Math.pow(.2, dt);
    const dx = player.x - d.x, dy = player.y - .3 - d.y, dist = Math.hypot(dx, dy);
    if (d.t > .45 && dist < 2.2) { const sp = 9 / Math.max(.4, dist); d.x += dx / dist * sp * dt * .6; d.y += dy / dist * sp * dt * .6 }
    if (d.t > .45 && dist < .35) { if (addItem(d.id, 1) === 0) { d.gone = 1; note(d.id, 1); sfx.pick() } }
  }
  drops = drops.filter(d => !d.gone);
}

// ---------- time & days ----------
let minuteAcc = 0;
function tickTime(dt) {
  minuteAcc += dt; while (minuteAcc >= 7) { minuteAcc -= 7; state.time += 10; if (state.time === 24 * 60) toast("It's getting late. You should head to bed."); if (state.time >= 26 * 60) passOut() }
}
async function passOut() { if (sleeping) return; sleeping = true; await fadeOut(); newDay(true); await nightScreen(true); sleeping = false }
async function goSleep() { if (sleeping) return; sleeping = true; sfx.sleep(); await fadeOut(); newDay(false); await nightScreen(false); sleeping = false }
function newDay(passed) {
  if (World.cur !== 'farm') useMap('farm');
  state.inBoat = false; state.boat = boatHome(); if (fishing) stopFishing();     // Peter rows the boat back to the dock every night
  // sell everything in the shipping bin
  state.lastShip = state.bin.map(b => ({ id: b.id, n: b.n, v: b.n * (ITEMS[b.id].price || 0) })); const earned = state.lastShip.reduce((a, b) => a + b.v, 0);
  state.money += earned; state.stats.earned = (state.stats.earned || 0) + earned; state.bin = [];
  const late = state.time; state.totalDay++; state.day++; let newSeason = false; if (state.day > DAYS_PER_SEASON) { state.day = 1; state.season = (state.season + 1) % 4; newSeason = true; if (state.season === 0) state.year++ }
  state.withered = growNight(newSeason);
  state.time = 360; minuteAcc = 0; state.energy = passed ? Math.round(state.maxE / 2) : (late > 24 * 60 ? Math.round(state.maxE * .8) : state.maxE); state.stats.days++;
  // a little regrowth overnight: weeds and grass creep back in
  const R = Math.random; let n = ri(3, 6);
  for (let k = 0; k < 200 && n > 0; k++) { const x = ri(3, W - 4), y = ri(3, H - 4), i = idx(x, y); if (World.objs[i] || World.ground[i] === WATER || World.soil[i]) continue; if (Math.hypot(x - World.TENT.x, y - World.TENT.y) < 4) continue; World.objs[i] = R() < .5 ? { t: 'weed', hp: 1, v: ri(0, 3) } : { t: 'grass', hp: 1, v: ri(0, 7) }; n-- }
  player.x = World.TENT.x + .5; player.y = World.TENT.y + 1.7; player.dir = 's'; drops.forEach(d => { d.x = player.x; d.y = player.y });
  save();
}
const fadeOut = () => new Promise(r => { $('#fade').classList.add('on'); setTimeout(r, 900) });
// end-of-day screen: night sky, then each sold item counts in one at a time, then the total
function nightScreen(passed) {
  return new Promise(async r => {
    const el = $('#night'), st = el.querySelector('.stars');
    if (!st.children.length) for (let k = 0; k < 60; k++) { const d = document.createElement('i'); d.style.left = (Math.random() * 100) + '%'; d.style.top = (Math.random() * 70) + '%'; d.style.animationDelay = (Math.random() * 3) + 's'; if (Math.random() < .2) d.className = 'big'; st.appendChild(d) }
    el.querySelector('.n1').textContent = passed ? 'You passed out from exhaustion…' : 'Good night, ' + state.look.name + '.';
    el.querySelector('.n2').textContent = `Next: ${weekday()}, ${SEASONS[state.season]} ${state.day}`;
    const box = el.querySelector('.n3'), go = $('#nGo'); box.innerHTML = ''; go.classList.remove('show');
    el.classList.add('on');
    const sh = state.lastShip || [], tot = sh.reduce((a, b) => a + b.v, 0);
    const countUp = (node, to, ms) => new Promise(res => { const t0 = performance.now(); const step = t => { const k = Math.min(1, (t - t0) / ms); node.textContent = '₪ ' + Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); else res() }; requestAnimationFrame(step) });
    let skip = false; const tap = () => skip = true; el.addEventListener('pointerdown', tap);
    const pause = ms => skip ? Promise.resolve() : wait(ms);
    await pause(700);
    if (sh.length) {
      const card = document.createElement('div'); card.className = 'report paper'; card.innerHTML = '<div class="rt">Shipping Report</div><div class="rows"></div><div class="rtot"><span>Total earned</span><b>₪ 0</b></div>'; box.appendChild(card);
      requestAnimationFrame(() => card.classList.add('show'));
      await pause(450);
      const rows = card.querySelector('.rows');
      for (const it of sh) {
        const row = document.createElement('div'); row.className = 'sr';
        row.innerHTML = `<img src="${iconURL(ITEMS[it.id].icon)}"><span class="nm">${ITEMS[it.id].n} <small>×${it.n}</small></span><b>₪ 0</b>`; rows.appendChild(row);
        requestAnimationFrame(() => row.classList.add('show')); tone(880, .07, 'square', .025); tone(1320, .08, 'square', .02, .06);
        if (skip) row.querySelector('b').textContent = '₪ ' + it.v; else await countUp(row.querySelector('b'), it.v, 350);
        await pause(300);
      }
      const tt = card.querySelector('.rtot'); tt.classList.add('show'); await pause(250);
      if (skip) tt.querySelector('b').textContent = '₪ ' + tot; else await countUp(tt.querySelector('b'), tot, 900);
      tt.classList.add('shine'); [523, 659, 784, 1046].forEach((f, i) => tone(f, .25, 'triangle', .04, i * .08));
    } else {
      const p = document.createElement('div'); p.className = 'nothing'; p.textContent = 'Nothing was shipped today. Fill the bin by your tent to earn shekels overnight.'; box.appendChild(p); requestAnimationFrame(() => p.classList.add('show'));
    }
    const sv = document.createElement('div'); sv.className = 'saved'; sv.textContent = 'Your farm has been saved.'; box.appendChild(sv);
    await wait(300); go.classList.add('show'); el.removeEventListener('pointerdown', tap);
    go.onclick = () => { sfx.tap(); el.classList.remove('on'); $('#fade').classList.remove('on'); snapCam(); banner(`${SEASONS[state.season]} ${state.day}`); r() };
  });
}
const wait = ms => new Promise(r => setTimeout(r, ms));

// ---------- travel between the farm and town ----------
async function travel(map, x, y, dir) {
  if (sleeping) return; sleeping = true; const f = $('#fade'); f.style.transition = 'opacity .3s'; f.classList.add('on'); await wait(320);
  useMap(map); player.x = x; player.y = y; player.dir = dir || (map === 'town' ? 'r' : 'l'); drops = []; snapCam();
  f.classList.remove('on'); await wait(300); f.style.transition = ''; sleeping = false; banner(ROOMS[map] ? ROOMS[map].name : map === 'town' ? 'Bethlehem' : map === 'jordan' ? JORDAN.name : map === 'sea' ? 'The Open Sea' : state.look.farm);
}

// ---------- saving ----------
function b64e(u) { let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s) }
function b64d(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u }
function save() {
  if (!state) return; state.px = player.x; state.py = player.y; state.map = World.cur; const F = World.maps.farm;
  const o = []; F.objs.forEach((q, i) => { if (q) { const c = Object.assign({}, q); delete c.shake; o.push([i, c]) } });
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, st: state, g: b64e(F.ground), o, soil: F.soil, w: W, h: H, drops: drops.map(d => [d.id, d.x, d.y]) })) } catch (e) { console.warn(e) }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY) } catch (e) { return false } }
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY)); state = d.st; G.state = state; setRodName(); if (state.map === 'sea' && !state.inBoat) { state.inBoat = true; state.boat = { map: 'sea', x: 32, y: 6, dir: 's' }; state.px = 32; state.py = 6 } if (state.inBoat && (!state.boat || state.boat.map !== state.map)) state.inBoat = false;
    genFarm(state.seed); const g = b64d(d.g);
    World.soil = {};
    if (d.w === W && d.h === H && g.length === W * H) { World.ground = g; World.objs = new Array(W * H).fill(null); for (const [i, q] of d.o) World.objs[i] = q; World.soil = d.soil || {} }
    else { state.px = World.TENT.x + .5; state.py = World.TENT.y + 1.7; state.newMap = 1 }   // farm map got bigger: keep your things, give you the new land
    player = mkPlayer(state.px, state.py); drops = []; (d.drops || []).forEach(([id, x, y]) => drops.push({ id, x, y, z: 0, vx: 0, vy: 0, vz: 0, t: 1 }));
    if (!state.bin) state.bin = []; if (!state.chest) state.chest = new Array(INV_SIZE).fill(null); if (state.maxE < 150) { state.energy = Math.min(150, state.energy + 150 - state.maxE); state.maxE = 150 } ensureBin(); const movedCart = removeCart(); if (state.can === undefined) state.can = CAN_MAX; giveStarter(true);
    fillBorder(Math.random); World.objs.forEach((o, i) => { if (o && o.t === 'sign' && /Bethlehem/.test(o.text || '')) World.objs[i] = null }); placeRoadSign(W - 6, World.EXIT.y - 1, FARM_SIGN); storeMap('farm'); useMap(World.maps[state.map] ? state.map : 'farm');
    if (movedCart && state.farmStart) setTimeout(() => say('The merchant has packed up his cart and moved to the new market in Bethlehem. Follow the road east off your farm to find the town!'), 1700);
    look = buildCharacter(state.look); return true;
  } catch (e) { console.warn(e); return false }
}

// ---------- HUD ----------
function renderHotbar() {
  const hb = $('#hotbar'); if (hb.children.length !== HOTBAR) { hb.innerHTML = ''; for (let i = 0; i < HOTBAR; i++) { const s = document.createElement('div'); s.className = 'slot'; s.dataset.i = i; s.innerHTML = '<img><span class="n"></span><span class="wb"><i></i></span>'; s.addEventListener('pointerdown', e => { e.stopPropagation(); ensureAudio(); state.sel = i; sfx.tap(); renderHotbar() }); hb.appendChild(s) } }
  [...hb.children].forEach((el, i) => { const s = state.inv[i]; el.classList.toggle('sel', i === state.sel); const img = el.querySelector('img'); if (s) { img.src = iconURL(ITEMS[s.id].icon); img.style.visibility = 'visible' } else img.style.visibility = 'hidden'; el.querySelector('.n').textContent = s && s.n > 1 ? s.n : ''; const wb = el.querySelector('.wb'); wb.style.display = s && s.id === 'can' ? 'block' : 'none'; if (s && s.id === 'can') wb.firstChild.style.width = (state.can / canMax() * 100) + '%' });
  const s = selItem(); $('#btnA img').src = s ? iconURL(ITEMS[s.id].icon) : ''; $('#btnA img').style.visibility = s ? 'visible' : 'hidden';
}
let hudSig = '';
function updateHUD() {
  const sig = [state.can, state.time, state.money, state.day, Math.round(state.energy), state.sel, JSON.stringify(state.inv.slice(0, HOTBAR))].join('|');
  $('#btnA').classList.toggle('talk', !!(interactTarget() || villagerNear() || (!state.inBoat && boat().map === World.cur && Math.hypot(boat().x - player.x, boat().y - player.y) < 2.6)));
  if (sig === hudSig) return; hudSig = sig;
  $('#cDay').textContent = `${weekday()}. ${SEASONS[state.season]} ${state.day}`; $('#cTime').textContent = fmtTime(state.time);
  $('#cMoney').textContent = state.money.toLocaleString();
  const e = state.energy / state.maxE; $('#eFill').style.height = (e * 100) + '%'; $('#eFill').style.background = e > .5 ? '#6fdc4f' : e > .25 ? '#f2c94c' : '#ef5a3c';
  renderHotbar();
}
// ---------- menu (bag + options) ----------
let menuOpen = false, bagSel = null;
function openMenu(tab = 'bag') { if (tab === 'map') mapView = null;
  menuOpen = true; $('#menu').classList.add('on'); $$('#menu .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab)); renderMenu(tab);
}
function closeMenu() { menuOpen = false; $('#menu').classList.remove('on'); renderHotbar() }
function renderMenu(tab) {
  const b = $('#menu .mbody');
  if (tab === 'bag') {
    let h = '<div class="grid">'; state.inv.forEach((s, i) => { h += `<div class="slot ${i === bagSel ? 'pick' : ''} ${i < HOTBAR ? 'hb' : ''}" data-i="${i}">${s ? `<img src="${iconURL(ITEMS[s.id].icon)}"><span class="n">${s.n > 1 ? s.n : ''}</span>` : ''}</div>` }); h += '</div>';
    const s = bagSel !== null && state.inv[bagSel]; h += s ? `<div class="detail"><img src="${iconURL(ITEMS[s.id].icon)}"><div><b>${ITEMS[s.id].n}</b><div class="muted">${ITEMS[s.id].d}</div></div></div>` : '<p class="muted">Tap an item to see it. Tap a second slot to swap them. The top row is your toolbar.</p>';
    b.innerHTML = h;
    b.querySelectorAll('[data-i]').forEach(el => el.onclick = () => { const i = +el.dataset.i; sfx.tap(); if (bagSel === null || bagSel === i) { bagSel = bagSel === i ? null : i } else { const t = state.inv[i]; state.inv[i] = state.inv[bagSel]; state.inv[bagSel] = t; bagSel = null } renderMenu('bag') });
  } else if (tab === 'people') { peopleTab(b);
  } else if (tab === 'map') { mapTab(b);
  } else if (tab === 'farm') {
    b.innerHTML = `<div class="farmcard"><canvas id="mPort" width="128" height="128"></canvas><div><div class="big">${esc(state.look.name)}</div><div class="muted">${esc(state.look.farm)}</div><div class="kv"><span>Day</span><b>${weekday()}, ${SEASONS[state.season]} ${state.day}, Year ${state.year}</b></div><div class="kv"><span>Shekels</span><b>${state.money.toLocaleString()}</b></div><div class="kv"><span>Trees felled</span><b>${state.stats.chopped}</b></div><div class="kv"><span>Rocks broken</span><b>${state.stats.rocks}</b></div><div class="kv"><span>Weeds cleared</span><b>${state.stats.weeds}</b></div><div class="kv"><span>Shekels earned</span><b>${state.stats.earned || 0}</b></div></div></div>`;
    const c = $('#mPort').getContext('2d'); c.imageSmoothingEnabled = false; c.scale(4, 4); drawChar(c, look, 'idle_s', 0, 16, 29, false);
  } else {
    b.innerHTML = `<div class="row"><span>Sound</span><button class="btn alt" id="oSnd">${state.opts.sound ? 'On' : 'Off'}</button></div><div class="row"><span>Save now</span><button class="btn alt" id="oSave">Save</button></div><div class="row"><span>Start a new farm<div class="muted">Erases this one.</div></span><button class="btn alt" id="oNew">New farm</button></div><p class="muted">Controls: drag on the left side to walk. Press the big button to use the tool you have selected, or to talk and use things. Tap the toolbar to switch tools. On a keyboard: WASD to walk, Space to act, 1–8 for tools.</p><p class="muted">Art: Sunnyside World by danieldiggle.</p>`;
    $('#oSnd').onclick = () => { state.opts.sound = !state.opts.sound; renderMenu('opts') };
    $('#oSave').onclick = () => { save(); toast('Saved.') };
    $('#oNew').onclick = e => { if (e.target.dataset.c) { localStorage.removeItem(SAVE_KEY); location.reload() } else { e.target.dataset.c = 1; e.target.textContent = 'Tap again' } };
  }
}

// ---------- shipping bin ----------
let binSel = null;
function openBin() { menuOpen = true; binSel = null; boxMode = 'bin'; $('#binM .ttl').textContent = 'Shipping Bin'; $('#binM').classList.add('on'); sfx.tap(); renderBin() }
// ---------- storage chest ----------
let boxMode = 'bin';
function openChest() { menuOpen = true; boxMode = 'chest'; $('#binM .ttl').textContent = 'Storage Chest'; $('#binM').classList.add('on'); sfx.tap(); renderChest() }
// move a whole stack from one list to another, joining a matching stack if there is one
function moveStack(from, i, to) {
  const s = from[i]; if (!s) return false;
  if (!ITEMS[s.id].tool) { const m = to.find(q => q && q.id === s.id); if (m) { m.n += s.n; from[i] = null; return true } }
  const e = to.indexOf(null); if (e < 0) return false; to[e] = s; from[i] = null; return true;
}
function renderChest() {
  const b = $('#binM .mbody'), slot = (s, attr, i) => `<div class="slot" ${attr}="${i}">${s ? `<img src="${iconURL(ITEMS[s.id].icon)}"><span class="n">${s.n > 1 ? s.n : ''}</span>` : ''}</div>`;
  let h = '<p class="muted" style="margin:0 0 6px">Tap something in your bag to store it. Tap something in the chest to take it back.</p><div class="grid binrow">';
  state.chest.forEach((s, i) => h += slot(s, 'data-c', i)); h += '</div><div class="h3">Your bag</div><div class="grid">';
  state.inv.forEach((s, i) => h += slot(s, 'data-i', i)); h += '</div>'; b.innerHTML = h;
  b.querySelectorAll('[data-c]').forEach(el => el.onclick = () => { if (!state.chest[+el.dataset.c]) return; if (moveStack(state.chest, +el.dataset.c, state.inv)) sfx.pick(); else { toast('Your bag is full.'); sfx.no() } renderChest() });
  b.querySelectorAll('[data-i]').forEach(el => el.onclick = () => { if (!state.inv[+el.dataset.i]) return; if (moveStack(state.inv, +el.dataset.i, state.chest)) sfx.pick(); else { toast('The chest is full.'); sfx.no() } renderChest() });
}
function closeBin() { menuOpen = false; if (state.sel !== null && !state.inv[state.sel]) state.sel = 0; $('#binM').classList.remove('on'); renderHotbar(); save() }
function shipFromSlot(i, n) {
  const s = state.inv[i]; if (!s || !ITEMS[s.id].price) return; n = Math.min(n, s.n);
  const b = state.bin.find(q => q.id === s.id); if (b) b.n += n; else state.bin.push({ id: s.id, n });
  s.n -= n; if (s.n <= 0) { state.inv[i] = null; binSel = null } sfx.pick(); renderBin();
}
function renderBin() {
  const b = $('#binM .mbody'), tot = state.bin.reduce((a, q) => a + q.n * ITEMS[q.id].price, 0);
  let h = `<div class="binhead"><span>In the bin</span><b>₪ ${tot}</b></div><p class="muted" style="margin:2px 0 6px">Everything in the bin is sold overnight. Tap something in the bin to take it back.</p><div class="grid binrow">`;
  if (!state.bin.length) h += '<div class="muted" style="grid-column:1/-1;text-align:center;padding:8px">Empty</div>';
  state.bin.forEach((q, k) => h += `<div class="slot" data-b="${k}"><img src="${iconURL(ITEMS[q.id].icon)}"><span class="n">${q.n}</span></div>`);
  h += '</div><div class="h3">Your bag</div><div class="grid">';
  state.inv.forEach((s, i) => { const ok = s && ITEMS[s.id].price; h += `<div class="slot ${i === binSel ? 'pick' : ''} ${s && !ok ? 'dim' : ''}" data-i="${i}">${s ? `<img src="${iconURL(ITEMS[s.id].icon)}"><span class="n">${s.n > 1 ? s.n : ''}</span>` : ''}</div>` });
  h += '</div>';
  const s = binSel !== null && state.inv[binSel];
  h += s ? `<div class="detail"><img src="${iconURL(ITEMS[s.id].icon)}"><div style="flex:1"><b>${ITEMS[s.id].n} ×${s.n}</b><div class="muted">Sells for ₪ ${ITEMS[s.id].price} each</div></div><button class="btn alt" id="ship1">Ship 1</button><button class="btn" id="shipAll">Ship all</button></div>` : '<p class="muted">Tap an item in your bag to put it in the bin. Tools can\'t be sold.</p>';
  b.innerHTML = h;
  b.querySelectorAll('[data-b]').forEach(el => el.onclick = () => { const q = state.bin[+el.dataset.b]; const left = addItem(q.id, q.n); if (left) { q.n = left; toast('Your bag is full.') } else state.bin.splice(+el.dataset.b, 1); sfx.tap(); renderBin() });
  b.querySelectorAll('[data-i]').forEach(el => el.onclick = () => { const i = +el.dataset.i, q = state.inv[i]; if (!q) return; if (!ITEMS[q.id].price) { toast("You can't sell your tools."); sfx.no(); return } binSel = i; sfx.tap(); renderBin() });
  const s1 = $('#ship1'), sa = $('#shipAll'); if (s1) s1.onclick = () => shipFromSlot(binSel, 1); if (sa) sa.onclick = () => shipFromSlot(binSel, 999);
}

// ---------- input ----------
let joy = null;
function setupInput() {
  const cv = $('#c');
  cv.addEventListener('pointerdown', e => {
    ensureAudio(); if (mode !== 'play' || dlgOpen || menuOpen) return;
    if (!joy && e.clientX < innerWidth * .62) { joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 }; const J = $('#joy'); J.style.left = (e.clientX - 55) + 'px'; J.style.top = (e.clientY - 55) + 'px'; J.classList.add('on'); $('#knob').style.transform = '' }
  });
  addEventListener('pointermove', e => {
    if (!joy || e.pointerId !== joy.id) return; let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const l = Math.hypot(dx, dy), m = 42;
    if (l > m) { joy.ox += dx / l * (l - m); joy.oy += dy / l * (l - m); dx = dx / l * m; dy = dy / l * m; const J = $('#joy'); J.style.left = (joy.ox - 55) + 'px'; J.style.top = (joy.oy - 55) + 'px' }
    joy.dx = dx / m; joy.dy = dy / m; $('#knob').style.transform = `translate(${dx}px,${dy}px)`;
  });
  const up = e => { if (joy && e.pointerId === joy.id) { joy = null; $('#joy').classList.remove('on') } };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  let holdA = null;
  $('#btnA').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); ensureAudio(); $('#btnA').classList.add('dn'); action(); clearInterval(holdA); holdA = setInterval(() => { if (!interactTarget() && !villagerNear()) action() }, 120) });
  const upA = () => { $('#btnA').classList.remove('dn'); clearInterval(holdA) }; $('#btnA').addEventListener('pointerup', upA); $('#btnA').addEventListener('pointercancel', upA); $('#btnA').addEventListener('pointerleave', upA);
  $('#btnB').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); ensureAudio(); let i = state.sel; for (let k = 0; k < HOTBAR; k++) { i = (i + 1) % HOTBAR; if (state.inv[i] && ITEMS[state.inv[i].id].tool) break } state.sel = i; sfx.tap(); renderHotbar() });
  $('#btnMap').addEventListener('pointerdown', e => { e.stopPropagation(); ensureAudio(); sfx.tap(); openMenu('map') });
  $('#btnMenu').onclick = () => { ensureAudio(); sfx.tap(); openMenu('bag') };
  $('#binM .x').onclick = closeBin; $('#binM').addEventListener('pointerdown', e => { if (e.target.id === 'binM') closeBin() });
  $('#menu .x').onclick = closeMenu; $('#menu').addEventListener('pointerdown', e => { if (e.target.id === 'menu') closeMenu() });
  $$('#menu .tab').forEach(t => t.onclick = () => { sfx.tap(); $$('#menu .tab').forEach(q => q.classList.toggle('on', q === t)); renderMenu(t.dataset.tab) });
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase(); keys[k] = true; ensureAudio();
    if (mode !== 'play') return;
    if (dlgOpen) { if (k === ' ' || k === 'enter' || k === 'e') { const b = $('#dialog .dch button'); if (b) b.click(); else $('#dialog').click() } return }
    if (k === ' ' || k === 'e' || k === 'enter') { e.preventDefault(); action() }
    if (/^[1-8]$/.test(k)) { state.sel = +k - 1; renderHotbar() }
    if (k === 'i' || k === 'escape') { if ($('#binM').classList.contains('on')) closeBin(); else menuOpen ? closeMenu() : openMenu('bag') }
  });
  addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
  addEventListener('blur', () => { for (const k in keys) keys[k] = false });
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') save() });
  document.addEventListener('gesturestart', e => e.preventDefault());
}

// ---------- update ----------
let birdT = 4;
function update(dt) {
  GT += dt;
  for (const p of parts) { p.life -= dt; p.vz -= (p.leaf ? 1.5 : 9) * dt; p.z += p.vz * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.z < 0) { p.z = 0; p.vx *= .5; p.vy *= .5; p.vz = 0 } if (p.leaf) p.vx = Math.sin(GT * 3 + p.y * 9) * .6 }
  parts = parts.filter(p => p.life > 0);
  for (const f of falling) f.t += dt; for (const f of falling) if (f.t > .9 && !f.done) { f.done = 1; drop('wood', ri(6, 9), f.x + .5 + f.side * 1.2, f.y); leaves(f.x + .5 + f.side * 1.4, f.y, 10); sfx.rock() } falling = falling.filter(f => f.t < 1.3);
  for (const n of notes) { n.t -= dt; if (n.t <= 0 && !n.gone) { n.gone = 1; n.el.classList.add('out'); setTimeout(() => n.el.remove(), 400) } } notes = notes.filter(n => !n.gone || n.t > -1);
  birdT -= dt; if (birdT <= 0 && state && state.time < 18 * 60 && !isInside()) { birdT = rnd(6, 14); const dir = Math.random() < .5 ? 1 : -1; birds.push({ x: camX / 16 + (dir > 0 ? -2 : viewW / 16 + 2), y: camY / 16 + rnd(1, 6), dir, t: 0 }); sfx.bird() }
  for (const b of birds) { b.t += dt; b.x += b.dir * 3.2 * dt; b.y += Math.sin(b.t * 2) * .3 * dt } birds = birds.filter(b => b.t < 12);
  if (mode !== 'play' || !state) return;
  if (dlgOpen || menuOpen || sleeping) { player.moving = false; return }
  tickTime(dt);
  // movement
  let mx = 0, my = 0;
  if (keys.a || keys.arrowleft) mx--; if (keys.d || keys.arrowright) mx++; if (keys.w || keys.arrowup) my--; if (keys.s || keys.arrowdown) my++;
  if (joy && Math.hypot(joy.dx, joy.dy) > .18) { mx = joy.dx; my = joy.dy }
  const act = player.act;
  if (fishing && !((mx || my) && ['cast', 'wait', 'bite'].includes(fishing.phase) && stopFishing())) { updateFishing(dt); player.moving = false }
  else if (state.inBoat && !act) boatMove(dt, mx, my);
  else if (act) {
    act.t += dt; if (!act.hit && act.t >= act.dur * act.hitAt) { act.hit = true; hit(act.tool, act) } if (act.t >= act.dur) player.act = null;
  } else if (mx || my) {
    const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l }
    const sp = 4.2 * (World.ground[idx(Math.floor(player.x), Math.floor(player.y))] === DIRT ? 1.05 : 1);
    const r = .28, col = (x, y) => World.solid(Math.floor(x - r), Math.floor(y - .15)) || World.solid(Math.floor(x + r), Math.floor(y - .15)) || World.solid(Math.floor(x - r), Math.floor(y + .2)) || World.solid(Math.floor(x + r), Math.floor(y + .2));
    const nx = player.x + mx * sp * dt, ny = player.y + my * sp * dt;
    if (!col(nx, player.y)) player.x = nx; if (!col(player.x, ny)) player.y = ny;
    player.moving = true; player.at += dt;
    if (Math.abs(mx) > Math.abs(my) * 1.1) { player.dir = mx < 0 ? 'l' : 'r'; player.side = mx < 0 ? -1 : 1 } else player.dir = my < 0 ? 'n' : 's';
    // brush through tall grass
    const o = World.get(Math.floor(player.x), Math.floor(player.y)); if (o && o.t === 'grass') o.shake = .15;
  } else { player.moving = false }
  updateDrops(dt); updateVillagers(dt);
  checkDoors();
  if (World.cur === 'farm' && player.x > W - 1.3) travel('town', TOWN.entry.x + 1.5, TOWN.entry.y + 1);
  else if (World.cur === 'town' && player.x < 1.3) travel('farm', W - 2.4, World.EXIT.y + 1);
  else if (World.cur === 'town' && player.y > H - 1.2) travel('jordan', clamp(player.x, 34.3, 35.7), 1.6, 's');
  else if (World.cur === 'jordan' && player.y < 1.1 && !state.inBoat) travel('town', clamp(player.x, 34.3, 35.7), H - 1.8, 'n');
  else if (World.cur === 'jordan' && state.inBoat && player.y > H - 1.1) sailTo('sea', player.x, 1.9, 's');
  else if (World.cur === 'sea' && state.inBoat && player.y < 1.35) sailTo('jordan', player.x, H - 1.5, 'n');
  camFollow(dt);
}

// ---------- render ----------
// The world is drawn into small pixel buffers and scaled up. The camera keeps its exact (sub-pixel) position and the
// buffers are shifted by the leftover fraction, so scrolling is smooth. The player is drawn straight onto the screen
// at the same exact position, so the character never jitters against the world.
let cv, ctx, buf, bx, buf2, bx2, SC = 5, camX = 0, camY = 0, dpr = 1, light, lx, viewW = 1, viewH = 1;
const bufW = () => viewW, bufH = () => viewH;
function resize() {
  dpr = Math.min(3, devicePixelRatio || 1); cv.width = Math.floor(innerWidth * dpr); cv.height = Math.floor(innerHeight * dpr);
  // about 12.5 tiles across in portrait, about 11 tiles tall in landscape
  SC = Math.max(2, Math.round(Math.min(cv.width / (16 * 12.5), cv.height / (16 * 11))));
  viewW = cv.width / SC; viewH = cv.height / SC;
  for (const c of [buf, buf2, light]) { c.width = Math.ceil(viewW) + 2; c.height = Math.ceil(viewH) + 2 }
  bx.imageSmoothingEnabled = false; bx2.imageSmoothingEnabled = false; ctx.imageSmoothingEnabled = false;
  if (player && mode === 'play') snapCam();
}
function camFollow(dt) { const tx = player.x * 16 - viewW / 2, ty = (player.y - .5) * 16 - viewH / 2, k = 1 - Math.exp(-dt * 14); camX += (tx - camX) * k; camY += (ty - camY) * k }
function snapCam() { camX = player.x * 16 - viewW / 2; camY = (player.y - .5) * 16 - viewH / 2 }
function dayLight() { // returns [darkness 0..1, sunset warmth 0..1]
  const m = state ? state.time : 1080; if (m < 17 * 60) return [m < 7 * 60 ? .15 * (7 * 60 - m) / 60 : 0, 0];
  if (m < 19 * 60) return [(m - 17 * 60) / 120 * .2, (m - 17 * 60) / 120];
  if (m < 21 * 60) return [.2 + (m - 19 * 60) / 120 * .45, 1 - (m - 19 * 60) / 120];
  return [.65, 0];
}
// name boards on the main buildings: [label, height above the building's base in world px]
const SIGNS = { synagogue: ['Church', 26], smithy: ['Blacksmith', 47], inn: ['Inn', 30], carpenter: ['Carpenter', 22] };
function signFor(o) { if (o.t !== 'bld') return null; if (o.shop === 'market') return o.k === 'stall_blue' ? ['Market', 41] : null; return SIGNS[o.k] || null }
function drawSign(g, label, wx, wy, cxf, cyf) {
  const S = SC, fs = Math.round(8.5 * S); g.font = `700 ${fs}px 'Pixelify Sans', monospace`;
  const tw = Math.ceil(g.measureText(label).width), w = tw + Math.round(10 * S), h = Math.round(13 * S);
  const x = Math.round((wx - cxf) * S - w / 2), y = Math.round((wy - cyf) * S - h / 2), u = Math.max(1, Math.round(S));
  g.fillStyle = 'rgba(30,15,5,.35)'; g.fillRect(x + u, y + u * 2, w, h);                          // shadow
  g.fillStyle = '#4a2a12'; g.fillRect(x, y, w, h);                                             // dark outline
  g.fillStyle = '#c08a52'; g.fillRect(x + u, y + u, w - 2 * u, h - 2 * u);                      // plank
  g.fillStyle = '#d9a66a'; g.fillRect(x + u, y + u, w - 2 * u, u);                             // top highlight
  g.fillStyle = '#9a6634'; g.fillRect(x + u, y + h - 2 * u, w - 2 * u, u); g.fillRect(x + u, y + Math.round(h / 2), w - 2 * u, Math.max(1, Math.round(u / 2)));  // grain
  g.fillStyle = '#4a2a12'; g.fillRect(x + 2 * u, y + 2 * u, u, u); g.fillRect(x + w - 3 * u, y + 2 * u, u, u);   // nails
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#4a2a12'; g.fillText(label, x + w / 2, y + h / 2 + u);
  g.fillStyle = '#fff3d6'; g.fillText(label, x + w / 2, y + h / 2);
}
function render() {
  const bw = buf.width, bh = buf.height;
  const cxf = clamp(camX, -16, W * 16 - viewW + 16), cyf = clamp(camY, -16, H * 16 - viewH + 16);
  const cx = Math.floor(cxf), cy = Math.floor(cyf), ox = (cxf - cx) * SC, oy = (cyf - cy) * SC;
  bx.setTransform(1, 0, 0, 1, 0, 0); bx.fillStyle = '#3a8fd0'; bx.fillRect(0, 0, bw, bh);
  bx2.setTransform(1, 0, 0, 1, 0, 0); bx2.clearRect(0, 0, bw, bh);
  if (!World.ground) return;
  bx.translate(-cx, -cy); bx2.translate(-cx, -cy);
  const x0 = Math.floor(cx / 16) - 1, y0 = Math.floor(cy / 16) - 1, x1 = Math.ceil((cx + bw) / 16) + 1, y1 = Math.ceil((cy + bh) / 16) + 2;
  if (isInside()) drawInterior(bx, x0, y0, x1, y1, GT); else { drawTerrain(bx, x0, y0, x1, y1, GT); if (World.cur === 'sea') drawSeaWater(bx, x0, y0, x1, y1, GT); drawPave(bx, x0, y0, x1, y1); drawSoil(bx, x0, y0, x1, y1);
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1 + 1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) { const o = World.objs[idx(x, y)]; if (o && (o.t === 'dock' || o.t === 'bridge' || o.t === 'deck')) drawFloorObj(bx, o, x, y) } }
  const showPlayer = player && mode === 'play';
  if (showPlayer && !player.act && !dlgOpen) {
    const s = selItem(), it = s && ITEMS[s.id], tool = it && it.tool, t = interactTarget() || harvestTarget() || toolCell(it) || (tool && tool !== 'hoe' && tool !== 'can' && findTarget(tool));
    if (t && !(t.o && (t.o.t === 'bld' || t.o.t === 'anvil' || t.o.t === 'ifurn'))) { bx.strokeStyle = `rgba(255,255,255,${.45 + .2 * Math.sin(GT * 6)})`; bx.lineWidth = 1; bx.strokeRect(t.x * 16 + .5, t.y * 16 + .5, 15, 15) }
  }
  // y-sorted sprites: everything behind the player goes in the back buffer, everything in front in the front buffer
  const D = [];
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1 + 2); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(W - 1, x1 + 1); x++) { const o = World.objs[idx(x, y)]; if (o && o.t !== 'part' && o.t !== 'dock' && o.t !== 'bridge' && o.t !== 'deck') D.push([y + (o.t === 'grass' ? .4 : o.t === 'duck' || o.t === 'coracle' ? .1 : o.t === 'fboat' ? -1 : .9), 0, o, x, y]) }
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1 + 1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) { const so = World.soil[idx(x, y)]; if (so && so.c) D.push([y + .7, 4, so, x, y]) }
  for (const d of drops) D.push([d.y, 1, d]);
  for (const n of npcs) if (n.map === World.cur) D.push([n.y, 5, n]);
  if (state && !state.inBoat && boat().map === World.cur) D.push([boat().y - .2, 6, boat()]);
  for (const f of falling) D.push([f.y + .95, 2, f]);
  D.sort((a, b) => a[0] - b[0]);
  const py = showPlayer ? player.y : -1e9, signsBack = [], signsFront = [];
  for (const d of D) {
    const g = d[0] <= py ? bx : bx2;
    if (d[1] === 0) { drawObject(g, d[2], d[3], d[4], GT); const L = d[2].t === 'bld' && signFor(d[2]); if (L) (g === bx ? signsBack : signsFront).push([L[0], d[3] * 16 + BLD[d[2].k][1] * 8, d[4] * 16 + 16 - L[1]]) }
    else if (d[1] === 4) drawCrop(g, d[2], d[3], d[4], GT);
    else if (d[1] === 5) drawVillager(g, d[2]);
    else if (d[1] === 6) drawRowboat(g, d[2].x * 16, d[2].y * 16 + 2, d[2].dir, GT, false);
    else if (d[1] === 1) { const q = d[2], s = AT[ITEMS[q.id].icon][0]; g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(Math.round(q.x * 16 - 3), Math.round(q.y * 16), 6, 2); g.drawImage(s, Math.round(q.x * 16 - s.width / 2), Math.round(q.y * 16 - s.height - q.z * 10 + Math.sin(GT * 4 + q.x) * (q.vz ? 0 : 1))) }
    else { const f = d[2], s = treeSprite(f.o, 0, f.x, f.y), k = Math.min(1, f.t / .9), a = f.side * k * k * 1.45; g.save(); g.globalAlpha = f.t > .9 ? 1 - (f.t - .9) / .4 : 1; g.translate(f.x * 16 + 8, f.y * 16 + 16); g.rotate(a); g.drawImage(s, -s.width / 2, -s.height + 3); g.restore() }
  }
  for (const p of parts) { bx2.globalAlpha = clamp(p.life * 2, 0, 1); bx2.fillStyle = p.col; bx2.fillRect(Math.round(p.x * 16), Math.round(p.y * 16 - p.z * 16), p.leaf ? 2 : 1, 1) } bx2.globalAlpha = 1;
  for (const b of birds) { const s = AT.an_bird[Math.floor(b.t * 8) % AT.an_bird.length]; bx2.save(); bx2.translate(Math.round(b.x * 16), Math.round(b.y * 16)); if (b.dir > 0) bx2.scale(-1, 1); bx2.drawImage(s, -s.width / 2, -s.height); bx2.restore() }
  // compose onto the screen
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buf, -ox, -oy, bw * SC, bh * SC);
  for (const q of signsBack) drawSign(ctx, q[0], q[1], q[2], cxf, cyf);
  if (showPlayer) { ctx.setTransform(SC, 0, 0, SC, -cxf * SC, -cyf * SC); drawPlayer(ctx); ctx.setTransform(1, 0, 0, 1, 0, 0) }
  ctx.drawImage(buf2, -ox, -oy, bw * SC, bh * SC);
  for (const q of signsFront) drawSign(ctx, q[0], q[1], q[2], cxf, cyf);
  // light & night
  let [dark, warm] = dayLight(); if (isInside()) { dark *= .55; warm = Math.max(warm, .35) }
  if (warm > 0) { ctx.fillStyle = `rgba(255,150,60,${.16 * warm})`; ctx.fillRect(0, 0, cv.width, cv.height) }
  if (dark > 0) {
    lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, bw, bh); lx.fillStyle = `rgba(14,18,52,${dark})`; lx.fillRect(0, 0, bw, bh);
    lx.globalCompositeOperation = 'destination-out';
    const lamp = (wx, wy, r, a) => { const sx = wx * 16 - cx, sy = wy * 16 - cy; const gr = lx.createRadialGradient(sx, sy, 2, sx, sy, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); lx.fillStyle = gr; lx.fillRect(sx - r, sy - r, r * 2, r * 2) };
    for (let y = Math.max(0, y0 - 4); y <= Math.min(H - 1, y1 + 4); y++) for (let x = Math.max(0, x0 - 4); x <= Math.min(W - 1, x1 + 4); x++) { const o = World.objs[idx(x, y)]; if (o && o.t === 'mast') lamp(x + .5, y - 3.8, 50, .9); if (o && o.t === 'ifurn' && o.k === 'forge') lamp(x + 1, y + .1, 80, 1); if (o && o.t === 'ifurn' && o.k === 'hearth') lamp(x + 1.5, y + .3, 90, 1); if (o && o.t === 'ifurn' && o.k === 'table') lamp(x + 1.5, y - .2, 34, .7); if (o && o.t === 'ifurn' && (o.k === 'menorah' || o.k === 'lamp' || o.k === 'ark')) lamp(x + .5 + (o.k === 'ark' ? 1 : 0), y - .4, o.k === 'ark' ? 46 : 40, .9); if (o && o.t === 'campfire') lamp(x + .5, y + .2, 70 + Math.sin(GT * 7) * 3, 1); if (o && (o.t === 'tent' || (o.t === 'bld' && o.k === 'farmhouse'))) lamp(x + .5, y + .6, 30, .75); if (o && o.t === 'torch') lamp(x + .5, y - .6, 46 + Math.sin(GT * 8 + x) * 2, .95) }
    if (showPlayer) lamp(player.x, player.y - .5, 34, .55);
    ctx.drawImage(light, -ox, -oy, bw * SC, bh * SC);
    if (dark > .3) { ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 14; k++) { const fx = (hash(k, 1) * W * 16 + Math.sin(GT * .4 + k) * 20 - cxf) * SC, fy = (hash(k, 2) * H * 16 + Math.cos(GT * .3 + k) * 14 - cyf) * SC; if (fx < 0 || fy < 0 || fx > cv.width || fy > cv.height) continue; ctx.fillStyle = `rgba(255,240,120,${.5 + .5 * Math.sin(GT * 3 + k * 2)})`; ctx.fillRect(Math.round(fx), Math.round(fy), SC, SC) } ctx.globalCompositeOperation = 'source-over' }
  }
}
function drawPlayer(g) {
  const p = player, fx = p.x * 16, fy = p.y * 16, inB = state && state.inBoat;
  if (!inB) { g.fillStyle = 'rgba(30,20,10,.25)'; g.beginPath(); g.ellipse(fx, fy, 5, 2, 0, 0, 7); g.fill() }
  let anim, fr = 0, flip = false;
  if (fishing) { [anim, fr] = fishAnim(); flip = p.side < 0 }
  else if (p.act) { anim = p.act.anim; fr = Math.floor(p.act.t / p.act.dur * ATMETA.char.counts[anim]); flip = p.side < 0 }
  else if (p.moving && !inB) { anim = p.dir === 'n' ? 'walk_n' : p.dir === 's' ? 'walk_s' : 'walk'; fr = Math.floor(p.at * 12); flip = p.dir === 'l' }
  else { anim = p.dir === 'n' ? 'idle_n' : p.dir === 's' ? 'idle_s' : 'idle'; fr = Math.floor(GT * 6); flip = p.dir === 'l' }
  if (inB) {   // sitting in the rowing boat: hull, then you, then the side of the hull in front of your legs
    const B = boat(); drawRowboat(g, fx, fy + 2, B.dir, GT, p.rowing, 'under');
    drawChar(g, look, anim, fr, fx, fy + 5, flip, true); drawRowboat(g, fx, fy + 2, B.dir, GT, p.rowing, 'over');
  } else drawChar(g, look, anim, fr, fx, fy, flip, true);
  drawFishing(g);
}

// ---------- title / start ----------
function showTitle() {
  mode = 'title'; $('#title').classList.add('on'); $('#hud').classList.remove('on');
  const tb = $('#tbtns'); tb.innerHTML = ''; const mk = (t, fn, alt) => { const b = document.createElement('button'); b.className = 'btn big' + (alt ? ' alt' : ''); b.textContent = t; b.onclick = () => { ensureAudio(); sfx.tap(); fn(b) }; tb.appendChild(b) };
  if (hasSave()) mk('Continue', () => { if (load()) startPlay(false); else newGame() });
  mk('New Farm', b => { if (hasSave() && !b.dataset.c) { b.dataset.c = 1; b.textContent = 'Tap again to erase your farm'; return } newGame() }, hasSave());
}
function newGame() { $('#title').classList.remove('on'); openCreator(lk => { const seed = ri(1, 1e9); genFarm(seed); World.soil = {}; storeMap('farm'); useMap('farm'); state = G.state = freshState(lk, seed); player = mkPlayer(state.px, state.py); look = buildCharacter(lk); drops = []; save(); startPlay(true) }) }
function startPlay(fresh) {
  mode = 'play'; paused = false; $('#title').classList.remove('on'); $('#hud').classList.add('on'); snapCam(); hudSig = ''; updateHUD();
  if (fresh) { banner(state.look.farm); setTimeout(() => say(`Welcome to ${state.look.farm}, ${state.look.name}! This little plot outside Bethlehem is yours now. It's overgrown, but your axe, pickaxe and scythe can clear it. Dig soil with the hoe, plant the wheat seeds waiting in your storage chest, and water them every day. Sell what you grow in the shipping bin. The road east leads to Bethlehem, with a market, a blacksmith, an inn, a carpenter and a church. Sleep in your tent when the day is done.`), 900) }
  else { banner(`${weekday()}, ${SEASONS[state.season]} ${state.day}`); if (state.newMap) { delete state.newMap; save(); setTimeout(() => say('Your farm has grown! The land is bigger now, and the wild has crept back in. Your tools, items and shekels are all still with you.'), 900) } }
}
let last = 0, hudT = 0;
function loop(t) {
  const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
  try {
    update(dt);
    if (mode === 'title') { camX = 27 * 16 + Math.sin(GT * .05) * 120 - viewW / 2; camY = 20 * 16 + Math.cos(GT * .04) * 60 - viewH / 2 }
    render(); hudT -= dt; if (hudT <= 0 && mode === 'play' && state) { hudT = .1; updateHUD() }
  } catch (e) { console.error(e) }
  requestAnimationFrame(loop);
}
async function boot() {
  cv = $('#c'); ctx = cv.getContext('2d'); buf = mkc(10, 10); bx = buf.getContext('2d'); buf2 = mkc(10, 10); bx2 = buf2.getContext('2d'); light = mkc(10, 10); lx = light.getContext('2d');
  resize(); addEventListener('resize', resize);
  await loadAtlas(); bakeTerrain(); foodIcons(); genTown(); storeMap('town'); genJordan(); storeMap('jordan'); genSea(); storeMap('sea'); for (const k in ROOMS) { ROOMS[k].gen(); storeMap(k) } genFarm(4242); World.soil = {}; storeMap('farm'); useMap('farm'); initVillagers();
  $('#loading').remove(); setupInput(); showTitle(); requestAnimationFrame(loop);
  try { if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { }) } catch (e) { }
  window.PL = { get state() { return state }, get player() { return player }, World, npcs, action, travel, addItem, newDay, save, load, findTarget, get drops() { return drops } };
}
boot();
