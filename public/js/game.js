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
const TOOL_ANIM = { axe: 'axe', pick: 'mining', scythe: 'attack' }, TOOL_COST = { axe: 2, pick: 2, scythe: 0 };
const INV_SIZE = 24, HOTBAR = 8;

let state = null, player = null, look = null, drops = [], parts = [], notes = [], falling = [], birds = [];
let GT = 0, paused = true, sleeping = false, mode = 'title';
const keys = {};
G.state = null;

function freshState(lk, seed) {
  const inv = new Array(INV_SIZE).fill(null); inv[0] = { id: 'axe', n: 1 }; inv[1] = { id: 'pick', n: 1 }; inv[2] = { id: 'scythe', n: 1 };
  return { v: 1, look: lk, day: 1, season: 0, year: 1, time: 360, money: 500, energy: 100, maxE: 100, inv, sel: 0, seed, px: World.TENT.x + .5, py: World.TENT.y + 1.7, opts: { sound: true }, stats: { days: 0, chopped: 0, rocks: 0, weeds: 0 }, totalDay: 1 };
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
function say(text, choices) {
  return new Promise(res => {
    dlgOpen = true; const d = $('#dialog'); d.querySelector('.dt').textContent = text; const ch = d.querySelector('.dch'); ch.innerHTML = '';
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
  for (const [x, y] of cells) { const r = World.owner(x, y); if (r && ['tent', 'sign', 'crate', 'campfire'].includes(r.o.t)) return r }
  return null;
}
async function action() {
  if (player.act || dlgOpen || sleeping || paused) return;
  const it = interactTarget();
  if (it) {
    if (it.o.t === 'tent') { const v = await say('Your tent. Go to sleep for the night?', [['Sleep', 1], ['Not yet', 0]]); if (v) goSleep(); return }
    if (it.o.t === 'sign') { say(it.o.text); return }
    if (it.o.t === 'crate') { say('An old crate left behind by the last farmer. Empty for now.'); return }
    if (it.o.t === 'campfire') { say('The campfire crackles. It will keep you warm at night.'); return }
  }
  const s = selItem(), tool = s && ITEMS[s.id].tool; if (!tool) { sfx.no(); return }
  const cost = TOOL_COST[tool]; if (state.energy < cost) { toast('Too tired… go to your tent and sleep.'); sfx.no(); return }
  const tgt = findTarget(tool); if (tgt) faceToward(tgt.x, tgt.y);
  if (player.dir === 'l' || player.dir === 'r') player.side = player.dir === 'l' ? -1 : 1;
  const anim = TOOL_ANIM[tool], n = ATMETA.char.counts[anim];
  player.act = { anim, t: 0, dur: n / 16, hitAt: tool === 'scythe' ? .3 : .55, hit: false, tool };
  state.energy = Math.max(0, state.energy - cost);
}
function hit(tool) {
  if (tool === 'scythe') {
    sfx.swish(); const [dx, dy] = faceVec(), [fx, fy] = facingCell(); const cells = [[fx, fy], [fx + dy, fy + dx], [fx - dy, fy - dx], [Math.floor(player.x), Math.floor(player.y)]];
    const t = findTarget('scythe'); if (t) cells.push([t.x, t.y]);
    for (const [x, y] of cells) { const r = World.owner(x, y); if (r && OBJ[r.o.t] && OBJ[r.o.t].tool === 'scythe') damage(r, 1) }
    return;
  }
  const r = findTarget(tool); if (!r) { sfx.miss(); return } damage(r, 1);
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
  const late = state.time; state.totalDay++; state.day++; if (state.day > DAYS_PER_SEASON) { state.day = 1; state.season = (state.season + 1) % 4; if (state.season === 0) state.year++ }
  state.time = 360; minuteAcc = 0; state.energy = passed ? Math.round(state.maxE / 2) : (late > 24 * 60 ? Math.round(state.maxE * .8) : state.maxE); state.stats.days++;
  // a little regrowth overnight: weeds and grass creep back in
  const R = Math.random; let n = ri(3, 6);
  for (let k = 0; k < 200 && n > 0; k++) { const x = ri(3, W - 4), y = ri(3, H - 4), i = idx(x, y); if (World.objs[i] || World.ground[i] === WATER) continue; if (Math.hypot(x - World.TENT.x, y - World.TENT.y) < 4) continue; World.objs[i] = R() < .5 ? { t: 'weed', hp: 1, v: ri(0, 3) } : { t: 'grass', hp: 1, v: ri(0, 7) }; n-- }
  player.x = World.TENT.x + .5; player.y = World.TENT.y + 1.7; player.dir = 's'; drops.forEach(d => { d.x = player.x; d.y = player.y });
  save();
}
const fadeOut = () => new Promise(r => { $('#fade').classList.add('on'); setTimeout(r, 900) });
function nightScreen(passed) {
  return new Promise(r => {
    const el = $('#night'); el.querySelector('.n1').textContent = passed ? 'You passed out from exhaustion…' : 'Good night, ' + state.look.name + '.';
    el.querySelector('.n2').textContent = `${weekday()}, ${SEASONS[state.season]} ${state.day}`;
    el.querySelector('.n3').textContent = 'Your farm has been saved.'; el.classList.add('on');
    setTimeout(() => { el.classList.remove('on'); $('#fade').classList.remove('on'); snapCam(); banner(`${SEASONS[state.season]} ${state.day}`); r() }, 2200);
  });
}

// ---------- saving ----------
function b64e(u) { let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s) }
function b64d(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u }
function save() {
  if (!state) return; state.px = player.x; state.py = player.y;
  const o = []; World.objs.forEach((q, i) => { if (q) { const c = Object.assign({}, q); delete c.shake; o.push([i, c]) } });
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, st: state, g: b64e(World.ground), o, drops: drops.map(d => [d.id, d.x, d.y]) })) } catch (e) { console.warn(e) }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY) } catch (e) { return false } }
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY)); state = d.st; G.state = state;
    genFarm(state.seed); const g = b64d(d.g); if (g.length === W * H) World.ground = g;
    World.objs = new Array(W * H).fill(null); for (const [i, q] of d.o) World.objs[i] = q;
    player = mkPlayer(state.px, state.py); drops = []; (d.drops || []).forEach(([id, x, y]) => drops.push({ id, x, y, z: 0, vx: 0, vy: 0, vz: 0, t: 1 }));
    look = buildCharacter(state.look); return true;
  } catch (e) { console.warn(e); return false }
}

// ---------- HUD ----------
function renderHotbar() {
  const hb = $('#hotbar'); if (hb.children.length !== HOTBAR) { hb.innerHTML = ''; for (let i = 0; i < HOTBAR; i++) { const s = document.createElement('div'); s.className = 'slot'; s.dataset.i = i; s.innerHTML = '<img><span class="n"></span>'; s.addEventListener('pointerdown', e => { e.stopPropagation(); ensureAudio(); state.sel = i; sfx.tap(); renderHotbar() }); hb.appendChild(s) } }
  [...hb.children].forEach((el, i) => { const s = state.inv[i]; el.classList.toggle('sel', i === state.sel); const img = el.querySelector('img'); if (s) { img.src = iconURL(ITEMS[s.id].icon); img.style.visibility = 'visible' } else img.style.visibility = 'hidden'; el.querySelector('.n').textContent = s && s.n > 1 ? s.n : '' });
  const s = selItem(); $('#btnA img').src = s ? iconURL(ITEMS[s.id].icon) : ''; $('#btnA img').style.visibility = s ? 'visible' : 'hidden';
}
let hudSig = '';
function updateHUD() {
  const sig = [state.time, state.money, state.day, Math.round(state.energy), state.sel, JSON.stringify(state.inv.slice(0, HOTBAR))].join('|');
  if (sig === hudSig) return; hudSig = sig;
  $('#cDay').textContent = `${weekday()}. ${SEASONS[state.season]} ${state.day}`; $('#cTime').textContent = fmtTime(state.time);
  $('#cMoney').textContent = state.money.toLocaleString();
  const e = state.energy / state.maxE; $('#eFill').style.height = (e * 100) + '%'; $('#eFill').style.background = e > .5 ? '#6fdc4f' : e > .25 ? '#f2c94c' : '#ef5a3c';
  renderHotbar();
  const ic = interactTarget(); $('#btnA').classList.toggle('talk', !!ic);
}
// ---------- menu (bag + options) ----------
let menuOpen = false, bagSel = null;
function openMenu(tab = 'bag') {
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
  } else if (tab === 'farm') {
    b.innerHTML = `<div class="farmcard"><canvas id="mPort" width="128" height="128"></canvas><div><div class="big">${esc(state.look.name)}</div><div class="muted">${esc(state.look.farm)}</div><div class="kv"><span>Day</span><b>${weekday()}, ${SEASONS[state.season]} ${state.day}, Year ${state.year}</b></div><div class="kv"><span>Shekels</span><b>${state.money.toLocaleString()}</b></div><div class="kv"><span>Trees felled</span><b>${state.stats.chopped}</b></div><div class="kv"><span>Rocks broken</span><b>${state.stats.rocks}</b></div><div class="kv"><span>Weeds cleared</span><b>${state.stats.weeds}</b></div></div></div>`;
    const c = $('#mPort').getContext('2d'); c.imageSmoothingEnabled = false; c.scale(4, 4); drawChar(c, look, 'idle_s', 0, 16, 29, false);
  } else {
    b.innerHTML = `<div class="row"><span>Sound</span><button class="btn alt" id="oSnd">${state.opts.sound ? 'On' : 'Off'}</button></div><div class="row"><span>Save now</span><button class="btn alt" id="oSave">Save</button></div><div class="row"><span>Start a new farm<div class="muted">Erases this one.</div></span><button class="btn alt" id="oNew">New farm</button></div><p class="muted">Controls: drag on the left side to walk. Press the big button to use the tool you have selected, or to talk and use things. Tap the toolbar to switch tools. On a keyboard: WASD to walk, Space to act, 1–8 for tools.</p><p class="muted">Art: Sunnyside World by danieldiggle.</p>`;
    $('#oSnd').onclick = () => { state.opts.sound = !state.opts.sound; renderMenu('opts') };
    $('#oSave').onclick = () => { save(); toast('Saved.') };
    $('#oNew').onclick = e => { if (e.target.dataset.c) { localStorage.removeItem(SAVE_KEY); location.reload() } else { e.target.dataset.c = 1; e.target.textContent = 'Tap again' } };
  }
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
  $('#btnA').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); ensureAudio(); $('#btnA').classList.add('dn'); action(); clearInterval(holdA); holdA = setInterval(() => { if (!interactTarget()) action() }, 120) });
  const upA = () => { $('#btnA').classList.remove('dn'); clearInterval(holdA) }; $('#btnA').addEventListener('pointerup', upA); $('#btnA').addEventListener('pointercancel', upA); $('#btnA').addEventListener('pointerleave', upA);
  $('#btnB').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); ensureAudio(); let i = state.sel; for (let k = 0; k < HOTBAR; k++) { i = (i + 1) % HOTBAR; if (state.inv[i] && ITEMS[state.inv[i].id].tool) break } state.sel = i; sfx.tap(); renderHotbar() });
  $('#btnMenu').onclick = () => { ensureAudio(); sfx.tap(); openMenu('bag') };
  $('#menu .x').onclick = closeMenu; $('#menu').addEventListener('pointerdown', e => { if (e.target.id === 'menu') closeMenu() });
  $$('#menu .tab').forEach(t => t.onclick = () => { sfx.tap(); $$('#menu .tab').forEach(q => q.classList.toggle('on', q === t)); renderMenu(t.dataset.tab) });
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase(); keys[k] = true; ensureAudio();
    if (mode !== 'play') return;
    if (dlgOpen) { if (k === ' ' || k === 'enter' || k === 'e') { const b = $('#dialog .dch button'); if (b) b.click(); else $('#dialog').click() } return }
    if (k === ' ' || k === 'e' || k === 'enter') { e.preventDefault(); action() }
    if (/^[1-8]$/.test(k)) { state.sel = +k - 1; renderHotbar() }
    if (k === 'i' || k === 'escape') { menuOpen ? closeMenu() : openMenu('bag') }
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
  birdT -= dt; if (birdT <= 0 && state && state.time < 18 * 60) { birdT = rnd(6, 14); const dir = Math.random() < .5 ? 1 : -1; birds.push({ x: camX / 16 + (dir > 0 ? -2 : bufW() / 16 + 2), y: camY / 16 + rnd(1, 6), dir, t: 0 }); sfx.bird() }
  for (const b of birds) { b.t += dt; b.x += b.dir * 3.2 * dt; b.y += Math.sin(b.t * 2) * .3 * dt } birds = birds.filter(b => b.t < 12);
  if (mode !== 'play' || !state) return;
  if (dlgOpen || menuOpen || sleeping) { player.moving = false; return }
  tickTime(dt);
  // movement
  let mx = 0, my = 0;
  if (keys.a || keys.arrowleft) mx--; if (keys.d || keys.arrowright) mx++; if (keys.w || keys.arrowup) my--; if (keys.s || keys.arrowdown) my++;
  if (joy && Math.hypot(joy.dx, joy.dy) > .18) { mx = joy.dx; my = joy.dy }
  const act = player.act;
  if (act) {
    act.t += dt; if (!act.hit && act.t >= act.dur * act.hitAt) { act.hit = true; hit(act.tool) } if (act.t >= act.dur) player.act = null;
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
  updateDrops(dt);
  camFollow(dt);
}

// ---------- render ----------
let cv, ctx, buf, bx, SC = 5, camX = 0, camY = 0, camTX = 0, camTY = 0, dpr = 1, light, lx;
const bufW = () => buf.width, bufH = () => buf.height;
function resize() {
  dpr = Math.min(3, devicePixelRatio || 1); cv.width = Math.floor(innerWidth * dpr); cv.height = Math.floor(innerHeight * dpr);
  SC = Math.max(2, Math.round(Math.min(cv.width, cv.height * .75) / (16 * 12.5)));
  buf.width = Math.ceil(cv.width / SC); buf.height = Math.ceil(cv.height / SC); light.width = buf.width; light.height = buf.height;
  bx.imageSmoothingEnabled = false; ctx.imageSmoothingEnabled = false;
}
function camFollow(dt) { camTX = player.x * 16 - buf.width / 2; camTY = (player.y - .5) * 16 - buf.height / 2; const k = Math.min(1, dt * 7); camX += (camTX - camX) * k; camY += (camTY - camY) * k }
function snapCam() { camX = player.x * 16 - buf.width / 2; camY = (player.y - .5) * 16 - buf.height / 2 }
function dayLight() { // returns [darkness 0..1, sunset warmth 0..1]
  const m = state ? state.time : 1080; if (m < 17 * 60) return [m < 7 * 60 ? .15 * (7 * 60 - m) / 60 : 0, 0];
  if (m < 19 * 60) return [(m - 17 * 60) / 120 * .2, (m - 17 * 60) / 120];
  if (m < 21 * 60) return [.2 + (m - 19 * 60) / 120 * .45, 1 - (m - 19 * 60) / 120];
  return [.65, 0];
}
function render() {
  const bw = buf.width, bh = buf.height;
  const cx = Math.round(clamp(camX, -16, W * 16 - bw + 16)), cy = Math.round(clamp(camY, -16, H * 16 - bh + 16));
  bx.setTransform(1, 0, 0, 1, 0, 0); bx.fillStyle = '#3a8fd0'; bx.fillRect(0, 0, bw, bh);
  if (!World.ground) return;
  bx.translate(-cx, -cy);
  const x0 = Math.floor(cx / 16) - 1, y0 = Math.floor(cy / 16) - 1, x1 = Math.ceil((cx + bw) / 16) + 1, y1 = Math.ceil((cy + bh) / 16) + 2;
  drawTerrain(bx, x0, y0, x1, y1, GT);
  // target highlight
  if (mode === 'play' && player && !player.act && !dlgOpen) {
    const s = selItem(), tool = s && ITEMS[s.id].tool, t = interactTarget() || (tool && findTarget(tool));
    if (t) { bx.strokeStyle = `rgba(255,255,255,${.45 + .2 * Math.sin(GT * 6)})`; bx.lineWidth = 1; bx.strokeRect(t.x * 16 + .5, t.y * 16 + .5, 15, 15) }
  }
  // y-sorted sprites
  const D = [];
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1 + 2); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(W - 1, x1 + 1); x++) { const o = World.objs[idx(x, y)]; if (o && o.t !== 'part') D.push([y + (o.t === 'grass' ? .4 : .9), 0, o, x, y]) }
  for (const d of drops) D.push([d.y, 1, d]);
  for (const f of falling) D.push([f.y + .95, 2, f]);
  if (player && mode === 'play') D.push([player.y, 3]);
  D.sort((a, b) => a[0] - b[0]);
  for (const d of D) {
    if (d[1] === 0) drawObject(bx, d[2], d[3], d[4], GT);
    else if (d[1] === 1) { const q = d[2], s = AT[ITEMS[q.id].icon][0]; bx.fillStyle = 'rgba(0,0,0,.2)'; bx.fillRect(Math.round(q.x * 16 - 3), Math.round(q.y * 16), 6, 2); bx.drawImage(s, Math.round(q.x * 16 - s.width / 2), Math.round(q.y * 16 - s.height - q.z * 10 + Math.sin(GT * 4 + q.x) * (q.vz ? 0 : 1))) }
    else if (d[1] === 2) { const f = d[2], s = treeSprite(f.o, 0, f.x, f.y), k = Math.min(1, f.t / .9), a = f.side * k * k * 1.45; bx.save(); bx.globalAlpha = f.t > .9 ? 1 - (f.t - .9) / .4 : 1; bx.translate(f.x * 16 + 8, f.y * 16 + 16); bx.rotate(a); bx.drawImage(s, -s.width / 2, -s.height + 3); bx.restore() }
    else drawPlayer();
  }
  for (const p of parts) { bx.globalAlpha = clamp(p.life * 2, 0, 1); bx.fillStyle = p.col; bx.fillRect(Math.round(p.x * 16), Math.round(p.y * 16 - p.z * 16), p.leaf ? 2 : 1, p.leaf ? 1 : 1) } bx.globalAlpha = 1;
  for (const b of birds) { const s = AT.an_bird[Math.floor(b.t * 8) % AT.an_bird.length]; bx.save(); bx.translate(Math.round(b.x * 16), Math.round(b.y * 16)); if (b.dir > 0) bx.scale(-1, 1); bx.drawImage(s, -s.width / 2, -s.height); bx.restore() }
  // light & night
  bx.setTransform(1, 0, 0, 1, 0, 0);
  const [dark, warm] = dayLight();
  if (warm > 0) { bx.fillStyle = `rgba(255,150,60,${.16 * warm})`; bx.fillRect(0, 0, bw, bh) }
  if (dark > 0) {
    lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, bw, bh); lx.fillStyle = `rgba(14,18,52,${dark})`; lx.fillRect(0, 0, bw, bh);
    lx.globalCompositeOperation = 'destination-out';
    const lamp = (wx, wy, r, a) => { const sx = wx * 16 - cx, sy = wy * 16 - cy; const gr = lx.createRadialGradient(sx, sy, 2, sx, sy, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); lx.fillStyle = gr; lx.fillRect(sx - r, sy - r, r * 2, r * 2) };
    for (let y = Math.max(0, y0 - 4); y <= Math.min(H - 1, y1 + 4); y++) for (let x = Math.max(0, x0 - 4); x <= Math.min(W - 1, x1 + 4); x++) { const o = World.objs[idx(x, y)]; if (o && o.t === 'campfire') lamp(x + .5, y + .2, 70 + Math.sin(GT * 7) * 3, 1); if (o && o.t === 'tent') lamp(x + .5, y + .6, 26, .7) }
    if (player && mode === 'play') lamp(player.x, player.y - .5, 34, .55);
    bx.drawImage(light, 0, 0);
    if (dark > .3) { bx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 14; k++) { const fx = (hash(k, 1) * W * 16 + Math.sin(GT * .4 + k) * 20) - cx, fy = (hash(k, 2) * H * 16 + Math.cos(GT * .3 + k) * 14) - cy; if (fx < 0 || fy < 0 || fx > bw || fy > bh) continue; bx.fillStyle = `rgba(255,240,120,${.5 + .5 * Math.sin(GT * 3 + k * 2)})`; bx.fillRect(Math.round(fx), Math.round(fy), 1, 1) } bx.globalCompositeOperation = 'source-over' }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(buf, 0, 0, bw * SC, bh * SC);
}
function drawPlayer() {
  const p = player, fx = p.x * 16, fy = p.y * 16;
  bx.fillStyle = 'rgba(30,20,10,.25)'; bx.beginPath(); bx.ellipse(Math.round(fx), Math.round(fy), 5, 2, 0, 0, 7); bx.fill();
  let anim, fr = 0, flip = false;
  if (p.act) { anim = p.act.anim; fr = Math.floor(p.act.t / p.act.dur * ATMETA.char.counts[anim]); flip = p.side < 0 }
  else if (p.moving) { anim = p.dir === 'n' ? 'walk_n' : p.dir === 's' ? 'walk_s' : 'walk'; fr = Math.floor(p.at * 12); flip = p.dir === 'l' }
  else { anim = p.dir === 'n' ? 'idle_n' : p.dir === 's' ? 'idle_s' : 'idle'; fr = Math.floor(GT * 6); flip = p.dir === 'l' }
  drawChar(bx, look, anim, fr, fx, fy, flip);
}

// ---------- title / start ----------
function showTitle() {
  mode = 'title'; $('#title').classList.add('on'); $('#hud').classList.remove('on');
  const tb = $('#tbtns'); tb.innerHTML = ''; const mk = (t, fn, alt) => { const b = document.createElement('button'); b.className = 'btn big' + (alt ? ' alt' : ''); b.textContent = t; b.onclick = () => { ensureAudio(); sfx.tap(); fn(b) }; tb.appendChild(b) };
  if (hasSave()) mk('Continue', () => { if (load()) startPlay(false); else newGame() });
  mk('New Farm', b => { if (hasSave() && !b.dataset.c) { b.dataset.c = 1; b.textContent = 'Tap again to erase your farm'; return } newGame() }, hasSave());
}
function newGame() { $('#title').classList.remove('on'); openCreator(lk => { const seed = ri(1, 1e9); genFarm(seed); state = G.state = freshState(lk, seed); player = mkPlayer(state.px, state.py); look = buildCharacter(lk); drops = []; save(); startPlay(true) }) }
function startPlay(fresh) {
  mode = 'play'; paused = false; $('#title').classList.remove('on'); $('#hud').classList.add('on'); snapCam(); hudSig = ''; updateHUD();
  if (fresh) { banner(state.look.farm); setTimeout(() => say(`Welcome to ${state.look.farm}, ${state.look.name}! This little plot outside Bethlehem is yours now. It's overgrown, but with an axe, a pickaxe and a scythe you can clear it. Your tent is behind you. Sleep there when the day is done.`), 900) }
  else banner(`${weekday()}, ${SEASONS[state.season]} ${state.day}`);
}
let last = 0, hudT = 0;
function loop(t) {
  const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
  try {
    update(dt);
    if (mode === 'title') { camX = 20 * 16 + Math.sin(GT * .05) * 120 - buf.width / 2; camY = 16 * 16 + Math.cos(GT * .04) * 60 - buf.height / 2 }
    render(); hudT -= dt; if (hudT <= 0 && mode === 'play' && state) { hudT = .1; updateHUD() }
  } catch (e) { console.error(e) }
  requestAnimationFrame(loop);
}
async function boot() {
  cv = $('#c'); ctx = cv.getContext('2d'); buf = mkc(10, 10); bx = buf.getContext('2d'); light = mkc(10, 10); lx = light.getContext('2d');
  resize(); addEventListener('resize', resize);
  await loadAtlas(); bakeTerrain(); genFarm(4242);
  $('#loading').remove(); setupInput(); showTitle(); requestAnimationFrame(loop);
  try { if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { }) } catch (e) { }
  window.PL = { get state() { return state }, get player() { return player }, World, action, addItem, newDay, save, load, findTarget, get drops() { return drops } };
}
boot();
