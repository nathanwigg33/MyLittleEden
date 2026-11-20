// ===================== building interiors + the world map =====================
'use strict';
// Each enterable building: where its door is in town (centre, in tiles) and where its room sits on its own map.
// The room is drawn by hand in pixel art (the art pack has no indoor tiles).
const ROOMS = {
  synagogue: {
    name: 'Church', x0: 27, x1: 37, top: 22, bot: 32,   // floor cells (inclusive)
    door: 32,                                               // the doorway cell in the bottom wall (y = bot + 1)
  },
};
// door of a building in town, in world tiles: [centre x, the y just in front of it]
function bldDoor(k) {
  for (let i = 0; i < W * H; i++) { const o = World.maps.town.objs[i]; if (o && o.t === 'bld' && o.k === k) { const x = i % W, y = (i / W) | 0, b = BLD[k], s = AT[b[0]][0]; return [(x * 16 + b[1] * 8 - s.width / 2 + DOOR_PX[k]) / 16, y + 1] } }
  return null;
}
const DOOR_PX = { synagogue: 48 };   // door centre, in pixels from the left of the building sprite

// ---------- the synagogue's room ----------
function genSynagogue() {
  const R = ROOMS.synagogue;
  World.ground = new Uint8Array(W * H).fill(GRASS); World.objs = new Array(W * H).fill(null); World.soil = {}; World.pave = null;
  // everything outside the room is solid
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < R.x0 || x > R.x1 || y < R.top || y > R.bot) World.objs[idx(x, y)] = { t: 'part', ox: -1, oy: -1 };
  World.objs[idx(R.door, R.bot + 1)] = null; World.objs[idx(R.door, R.bot + 2)] = null;          // the doorway out
  const put = (x, y, k, w = 1, extra) => { for (let xx = x; xx < x + w; xx++) World.objs[idx(xx, y)] = { t: 'part', ox: x, oy: y }; World.objs[idx(x, y)] = Object.assign({ t: 'ifurn', k, w }, extra || {}) };
  put(31, 22, 'ark', 3);                                   // the Ark with the Torah scrolls, against the far wall
  put(29, 22, 'menorah'); put(35, 22, 'menorah');
  put(27, 22, 'shelf', 2); put(36, 22, 'shelf', 2);
  put(31, 26, 'bimah', 3);                                 // the reading platform in the middle
  for (const y of [24, 29, 31]) { put(27, y, 'pew', 4); put(34, y, 'pew', 4) }
  put(27, 32, 'plant'); put(37, 32, 'plant'); put(27, 27, 'lamp'); put(37, 27, 'lamp');
}
const isInside = () => !!ROOMS[World.cur];

// pixel helper
function px(g, c, x, y, w = 1, h = 1) { g.fillStyle = c; g.fillRect(x, y, w, h) }

// palette: white stone and gold, with royal blue, crimson and walnut wood
const WG = {
  ink: '#3a2414', dark: '#120c08',
  wall: '#f4efe4', wallLine: '#ddd3c0', white: '#fbf8f1', cream: '#ece3cf',
  gold: '#d9ad3c', goldHi: '#f6d878', goldLo: '#9c7020',
  blue: '#2a4a9a', blueHi: '#4a6fc4', blueLo: '#1a2f6a',
  red: '#a3283a', redHi: '#cc4456', redLo: '#6e1626',
  wood: '#7a4a2a', woodHi: '#a06a3e', woodLo: '#52301a',
  tileA: '#efe7d6', tileB: '#d9c9a8', tileEdge: '#c4b08a',
};
// pixel-perfect Star of David (9x9)
const STAR = ['....#....', '...#.#...', '#########', '.#.....#.', '..#...#..', '.#.....#.', '#########', '...#.#...', '....#....'];
// pixel cross (9 wide, 13 tall) with a darker edge
function cross(g, x, y, c, edge) { px(g, edge, x + 3, y, 3, 13); px(g, edge, x, y + 3, 9, 3); px(g, c, x + 4, y + 1, 1, 11); px(g, c, x + 1, y + 4, 7, 1) }
function star(g, x, y, c) { for (let r = 0; r < 9; r++) for (let k = 0; k < 9; k++) if (STAR[r][k] === '#') px(g, c, x + k, y + r) }
// a stained-glass arched window, 12 x 22
function glassWindow(g, x, y) {
  const P = [WG.blueHi, '#e2a93a', WG.redHi, '#5aa86a', WG.blue, '#f0d070'];
  px(g, WG.ink, x, y + 2, 12, 20); px(g, WG.ink, x + 2, y, 8, 2); px(g, WG.ink, x + 1, y + 1, 10, 1);
  px(g, WG.gold, x + 1, y + 3, 10, 18); px(g, WG.gold, x + 2, y + 1, 8, 2);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { const yy = y + 3 + r * 4, xx = x + 2 + c * 4; px(g, P[(r * 2 + c + (x >> 4)) % P.length], xx, yy, 4, 3) }
  px(g, WG.redHi, x + 3, y + 2, 6, 1); px(g, '#f0d070', x + 5, y + 1, 2, 1);                // arch top
  px(g, 'rgba(255,255,255,.45)', x + 2, y + 3, 1, 15);                                        // shine
}
function drawInterior(g, x0, y0, x1, y1, t) {
  const R = ROOMS[World.cur]; g.fillStyle = WG.dark; g.fillRect(x0 * 16, y0 * 16, (x1 - x0 + 1) * 16, (y1 - y0 + 1) * 16);
  const L = R.x0 * 16, Rr = (R.x1 + 1) * 16, T = R.top * 16, B = (R.bot + 1) * 16, cx = (R.door + .5) * 16;
  // floor: cream and sandstone tiles, a blue border band round the edge
  for (let y = T, r = 0; y < B; y += 8, r++) for (let x = L, c = 0; x < Rr; x += 8, c++) { px(g, (r + c) % 2 ? WG.tileB : WG.tileA, x, y, 8, 8); px(g, WG.tileEdge, x, y + 7, 8, 1); px(g, WG.tileEdge, x + 7, y, 1, 8) }
  px(g, WG.blueLo, L, T, Rr - L, 3); px(g, WG.blue, L, T, Rr - L, 2); px(g, WG.blueLo, L, B - 3, Rr - L, 3); px(g, WG.blue, L, B - 3, Rr - L, 2);
  px(g, WG.blueLo, L, T, 3, B - T); px(g, WG.blue, L, T, 2, B - T); px(g, WG.blueLo, Rr - 3, T, 3, B - T); px(g, WG.blue, Rr - 2, T, 2, B - T);
  for (let x = L + 6; x < Rr - 4; x += 8) { px(g, WG.gold, x, T + 1, 2, 1); px(g, WG.gold, x, B - 2, 2, 1) }
  // crimson rug under the bimah
  const bx = 31 * 16 - 6, by = 25 * 16 + 2, bw = 3 * 16 + 12, bh = 40;
  px(g, WG.ink, bx - 1, by - 1, bw + 2, bh + 2); px(g, WG.gold, bx, by, bw, bh); px(g, WG.red, bx + 2, by + 2, bw - 4, bh - 4); px(g, WG.redLo, bx + 4, by + 4, bw - 8, bh - 8); px(g, WG.red, bx + 5, by + 5, bw - 10, bh - 10);
  for (let x = bx + 8; x < bx + bw - 8; x += 6) { px(g, WG.gold, x, by + 3, 2, 1); px(g, WG.gold, x, by + bh - 4, 2, 1) }
  // royal-blue runner with gold edges from the door to the bimah
  px(g, WG.ink, cx - 8, by + bh, 16, B - by - bh); px(g, WG.gold, cx - 7, by + bh, 14, B - by - bh); px(g, WG.blue, cx - 5, by + bh, 10, B - by - bh);
  for (let y = by + bh + 4; y < B - 4; y += 8) { px(g, WG.goldHi, cx - 1, y, 2, 1); px(g, WG.gold, cx - 2, y + 1, 4, 1); px(g, WG.goldHi, cx - 1, y + 2, 2, 1) }
  // far wall: white stone, gold band, walnut panelling below
  const WT = T - 40; px(g, WG.wall, L, WT, Rr - L, 28);
  for (let y = WT + 3; y < T - 14; y += 6) { px(g, WG.wallLine, L, y + 5, Rr - L, 1); for (let x = L + ((y / 6 | 0) % 2) * 8; x < Rr; x += 16) px(g, WG.wallLine, x, y, 1, 5) }
  px(g, WG.goldLo, L, WT, Rr - L, 3); px(g, WG.gold, L, WT, Rr - L, 2); px(g, WG.goldHi, L, WT, Rr - L, 1);           // cornice
  px(g, WG.woodLo, L, T - 13, Rr - L, 13); px(g, WG.wood, L, T - 12, Rr - L, 11);
  for (let x = L + 3; x < Rr - 10; x += 13) { px(g, WG.woodLo, x, T - 10, 10, 7); px(g, WG.woodHi, x + 1, T - 9, 8, 5); px(g, WG.wood, x + 2, T - 8, 6, 3) }
  px(g, WG.goldLo, L, T - 14, Rr - L, 2); px(g, WG.gold, L, T - 14, Rr - L, 1); px(g, WG.ink, L, T - 1, Rr - L, 1);
  for (let x = L + 22; x < Rr - 20; x += 32) { if (Math.abs(x + 6 - cx) < 44) continue; glassWindow(g, x, WT + 4) }
  // blue banners hanging either side of the ark
  for (const hx of [cx - 46, cx + 38]) { px(g, WG.ink, hx - 1, WT + 3, 10, 22); px(g, WG.blue, hx, WT + 4, 8, 19); px(g, WG.blueHi, hx, WT + 4, 1, 19); px(g, WG.gold, hx, WT + 4, 8, 1); px(g, WG.blue, hx + 1, WT + 23, 2, 2); px(g, WG.blue, hx + 5, WT + 23, 2, 2); px(g, WG.gold, hx, WT + 8, 8, 1); px(g, WG.white, hx, WT + 10, 8, 2); px(g, WG.gold, hx, WT + 13, 8, 1); px(g, WG.gold, hx, WT + 18, 8, 1) }
  // side and front walls: white with gold and an ink outline
  for (const [x, inner] of [[L - 6, L - 1], [Rr, Rr]]) { px(g, WG.ink, x, WT, 6, B - WT + 6); px(g, WG.white, x + 1, WT, 4, B - WT + 5); px(g, WG.gold, inner, WT, 1, B - WT + 1) }
  px(g, WG.ink, L - 6, B, Rr - L + 12, 6); px(g, WG.white, L - 5, B + 1, Rr - L + 10, 4); px(g, WG.gold, L - 1, B, Rr - L + 2, 1);
  // doorway and mat
  const dx = R.door * 16; px(g, WG.dark, dx, B, 16, 6); px(g, WG.gold, dx - 1, B, 1, 6); px(g, WG.gold, dx + 16, B, 1, 6);
  px(g, WG.ink, dx + 1, B - 7, 14, 6); px(g, WG.red, dx + 2, B - 6, 12, 4); px(g, WG.gold, dx + 3, B - 5, 10, 1);
  // warm light through the windows during the day
  const [dark] = dayLight(); if (dark < .3) { g.save(); g.globalAlpha = .06 * (1 - dark * 3); g.fillStyle = '#ffe9b0'; for (let x = L + 22; x < Rr - 20; x += 32) { if (Math.abs(x + 6 - cx) < 44) continue; g.beginPath(); g.moveTo(x, T - 12); g.lineTo(x + 12, T - 12); g.lineTo(x + 24, T + 40); g.lineTo(x + 10, T + 40); g.fill() } g.restore() }
}

function drawFurn(g, o, x, y, t) {
  const X = x * 16, Y = y * 16, B = Y + 16, w = (o.w || 1) * 16;
  const shadow = (sx, sw) => px(g, 'rgba(60,35,15,.22)', sx, B - 2, sw, 2);
  switch (o.k) {
    case 'pew': {   // walnut benches, gold caps, crimson cushions
      shadow(X + 2, w - 4);
      px(g, WG.ink, X + 1, Y + 1, w - 2, 15);
      px(g, WG.wood, X + 2, Y + 2, w - 4, 6); px(g, WG.woodHi, X + 2, Y + 2, w - 4, 1); px(g, WG.woodLo, X + 2, Y + 7, w - 4, 1);
      px(g, WG.gold, X + 1, Y + 1, 2, 2); px(g, WG.gold, X + w - 3, Y + 1, 2, 2);
      px(g, WG.redLo, X + 2, Y + 8, w - 4, 4); px(g, WG.red, X + 2, Y + 8, w - 4, 3); px(g, WG.redHi, X + 3, Y + 8, w - 6, 1);
      px(g, WG.woodLo, X + 2, Y + 12, w - 4, 2); for (const lx of [X + 2, X + w - 4, X + w / 2 - 1]) px(g, WG.woodLo, lx, Y + 14, 2, 2);
      break;
    }
    case 'bimah': {
      shadow(X, w);
      px(g, WG.ink, X - 1, Y - 3, w + 2, 19); px(g, WG.wood, X, Y - 2, w, 17); px(g, WG.woodHi, X, Y - 2, w, 2); px(g, WG.woodLo, X, Y + 13, w, 2);
      for (let i = 0; i < 7; i++) { px(g, WG.gold, X + 2 + i * 7, Y + 4, 2, 8); px(g, WG.goldHi, X + 2 + i * 7, Y + 4, 1, 8) }
      px(g, WG.goldLo, X, Y + 3, w, 2); px(g, WG.goldHi, X, Y + 3, w, 1);
      // reading table with a crimson cloth and an open scroll
      px(g, WG.ink, X + 13, Y - 13, 22, 12); px(g, WG.red, X + 14, Y - 12, 20, 10); px(g, WG.redHi, X + 14, Y - 12, 20, 1); px(g, WG.gold, X + 14, Y - 4, 20, 1);
      for (let i = 0; i < 10; i++) px(g, WG.gold, X + 14 + i * 2, Y - 3, 1, 2);
      px(g, WG.ink, X + 16, Y - 17, 16, 6); px(g, '#f8f0d8', X + 18, Y - 16, 12, 4); px(g, WG.woodLo, X + 16, Y - 17, 2, 6); px(g, WG.woodLo, X + 30, Y - 17, 2, 6);
      for (let i = 0; i < 3; i++) px(g, '#9b8a6a', X + 19 + i * 3, Y - 15, 2, 1), px(g, '#9b8a6a', X + 19 + i * 3, Y - 13, 2, 1);
      break;
    }
    case 'ark': {
      const ax = X + w / 2;
      shadow(X + 4, w - 8);
      px(g, WG.ink, X + 3, Y - 27, w - 6, 44); px(g, WG.gold, X + 4, Y - 26, w - 8, 42); px(g, WG.goldHi, X + 4, Y - 26, w - 8, 1); px(g, WG.goldLo, X + 4, Y + 14, w - 8, 2);
      px(g, WG.goldLo, X + 7, Y - 22, w - 14, 34);                                           // recess
      px(g, WG.blueLo, X + 8, Y - 21, w - 16, 33); px(g, WG.blue, X + 9, Y - 21, w - 18, 32);  // royal-blue velvet curtain
      for (let i = 0; i < 4; i++) px(g, WG.blueHi, X + 11 + i * 8, Y - 18, 1, 28);            // folds
      px(g, WG.gold, X + 8, Y - 21, w - 16, 2); px(g, WG.gold, X + 8, Y + 8, w - 16, 1); for (let i = 0; i < w - 16; i += 2) px(g, WG.goldHi, X + 8 + i, Y + 9, 1, 2);
      cross(g, ax - 4, Y - 15, WG.goldHi, WG.goldLo);
      // the two stone tablets on top
      for (const s of [-1, 1]) { const tx = ax + (s < 0 ? -12 : 1); px(g, WG.ink, tx, Y - 41, 11, 15); px(g, '#e9e4d8', tx + 1, Y - 40, 9, 13); px(g, '#cfc8b8', tx + 1, Y - 28, 9, 1); px(g, WG.ink, tx + 1, Y - 41, 1, 1); px(g, WG.ink, tx + 9, Y - 41, 1, 1); for (let i = 0; i < 5; i++) px(g, '#8f877a', tx + 3, Y - 38 + i * 2, 5, 1) }
      // the eternal lamp
      const f = Math.sin(t * 5) > 0 ? WG.redHi : '#ff8a3a'; px(g, WG.goldLo, ax, Y - 54, 1, 8); px(g, WG.ink, ax - 3, Y - 46, 7, 4); px(g, WG.gold, ax - 2, Y - 46, 5, 3); px(g, f, ax - 1, Y - 48, 3, 2);
      break;
    }
    case 'menorah': {
      const c = X + 8; shadow(c - 4, 9);
      px(g, WG.ink, c - 5, B - 4, 11, 3); px(g, WG.goldLo, c - 4, B - 3, 9, 1); px(g, WG.gold, c - 3, B - 4, 7, 1);
      px(g, WG.gold, c, Y - 8, 1, 21); px(g, WG.goldLo, c + 1, Y - 6, 1, 19);
      for (let i = 1; i <= 3; i++) { const top = Y - 8, d = i * 2; px(g, WG.gold, c - d, top, 1, 3 + i * 2); px(g, WG.gold, c + d, top, 1, 3 + i * 2); px(g, WG.gold, c - d, top + 2 + i * 2, d, 1); px(g, WG.gold, c + 1, top + 2 + i * 2, d, 1) }
      for (let i = -3; i <= 3; i++) { const fl = Math.sin(t * 9 + i * 1.7) > .2; px(g, WG.goldLo, c + i * 2, Y - 9, 1, 1); px(g, fl ? '#ffb340' : '#ffd36b', c + i * 2, Y - 11, 1, 2); if (fl) px(g, '#fff4c2', c + i * 2, Y - 12, 1, 1) }
      break;
    }
    case 'shelf': {   // walnut shelves of scrolls in coloured covers
      shadow(X + 3, w - 6);
      px(g, WG.ink, X + 1, Y - 15, w - 2, 31); px(g, WG.wood, X + 2, Y - 14, w - 4, 29); px(g, WG.woodHi, X + 2, Y - 14, w - 4, 1);
      const C = [WG.blue, WG.red, '#3f7a4a', WG.blue, '#c08a2a'];
      for (let r = 0; r < 3; r++) { const yy = Y - 12 + r * 9; px(g, WG.woodLo, X + 3, yy, w - 6, 7); px(g, WG.woodHi, X + 3, yy + 7, w - 6, 1);
        for (let i = 0; i < 5; i++) { const sx = X + 4 + i * 5; px(g, C[(i + r) % 5], sx, yy + 1, 4, 6); px(g, WG.gold, sx, yy + 1, 4, 1); px(g, WG.goldHi, sx + 1, yy, 2, 1) } }
      break;
    }
    case 'plant': { shadow(X + 3, 10); px(g, WG.ink, X + 3, Y + 6, 10, 10); px(g, WG.blue, X + 4, Y + 7, 8, 8); px(g, WG.gold, X + 4, Y + 7, 8, 1); px(g, WG.gold, X + 4, Y + 11, 8, 1); px(g, WG.blueHi, X + 5, Y + 8, 1, 6);
      const leaf = [[6, -3], [9, -2], [3, 0], [11, 1], [7, 1], [4, 3], [10, 4], [7, 4], [2, 4], [12, 3]]; for (const [lx, ly] of leaf) { px(g, '#2f6e2e', X + lx, Y + ly + 1, 3, 2); px(g, '#5aa84a', X + lx, Y + ly, 3, 2); px(g, '#8fd06a', X + lx, Y + ly, 1, 1) } break }
    case 'lamp': {
      shadow(X + 4, 8); px(g, WG.ink, X + 6, Y - 5, 4, 21); px(g, WG.gold, X + 7, Y - 4, 2, 19); px(g, WG.ink, X + 3, B - 3, 10, 3); px(g, WG.gold, X + 4, B - 2, 8, 1);
      px(g, WG.ink, X + 3, Y - 8, 10, 4); px(g, WG.gold, X + 4, Y - 7, 8, 2); px(g, WG.goldHi, X + 4, Y - 7, 8, 1);
      const f = Math.sin(t * 8) > 0; px(g, f ? '#ffb340' : '#ffd36b', X + 7, Y - 11, 2, 3); px(g, '#fff4c2', X + 7, Y - 10, 2, 1);
      break;
    }
  }
}

// ---------- going in and out ----------
async function enterBuilding(k) {
  const R = ROOMS[k]; if (!R) return;
  sfx.tap(); await travel(k, R.door + .5, R.bot + .6, 'n');
}
async function leaveBuilding() {
  const k = World.cur, d = bldDoor(k); await travel('town', d[0], d[1] + .55, 's');
}
// called every frame: walking into a door goes in, walking out of the doorway goes out
function checkDoors() {
  if (sleeping || !player) return;
  if (World.cur === 'town') {
    for (const k in ROOMS) {
      const d = ROOMS[k]._door || (ROOMS[k]._door = bldDoor(k)); if (!d) continue;
      if (player.dir === 'n' && Math.abs(player.x - d[0]) < .42 && player.y < d[1] + .35 && player.y > d[1] - .2) { enterBuilding(k); return }
    }
  } else if (isInside()) {
    const R = ROOMS[World.cur]; if (player.y > R.bot + 1.3) leaveBuilding();
  }
}
// tapping the action button at a building: only the door lets you in
function tryBuildingDoor(k) {
  const d = bldDoor(k); if (!d || !ROOMS[k]) return false;
  if (Math.abs(player.x - d[0]) < .7 && player.y < d[1] + 1) { enterBuilding(k); return true }
  say(`The way into the ${ROOMS[k].name.toLowerCase()} is through its front door.`); return true;
}

// ---------- the map ----------
const MAP_COL = { water: '#4a9ad8', dirt: '#d9a066', grass: '#7cc357', tree: '#2f7a3a', bush: '#4c9a3e', pave: '#bdb3a2', soil: '#8b5a34', crop: '#5cae3a', rock: '#9a958c', bld: '#a0532e' };
const ROOF = { synagogue: '#2f6fd0', smithy: '#d9473c', inn: '#9c4fa8', carpenter: '#e2852f', houseA: '#e2852f', houseB: '#2f8fd0', houseC: '#4f9a3a', houseD: '#8ac06a', houseE: '#e35a5a', houseF: '#e35a5a', farmhouse: '#8ac06a', barn: '#d9473c', coop: '#5aa04a', stall_red: '#d9473c', stall_blue: '#3a7ad0', stall_green: '#4f9a3a', well: '#3aa0e0' };
function paintMinimap(g, m, ox, oy, s) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y), o = m.objs[i], gr = m.ground[i]; let c = gr === WATER ? MAP_COL.water : gr === DIRT ? MAP_COL.dirt : MAP_COL.grass;
    if (m.pave && m.pave[i]) c = MAP_COL.pave; if (m.soil && m.soil[i]) c = m.soil[i].c ? MAP_COL.crop : MAP_COL.soil;
    if (o) { if (o.t === 'wild' || OBJ[o.t] && OBJ[o.t].tree) c = MAP_COL.tree; else if (o.t === 'bush') c = MAP_COL.bush; else if (o.t === 'rock' || o.t === 'boulder') c = MAP_COL.rock; else if (o.t === 'tent' || o.t === 'bin' || o.t === 'crate') c = '#c9873e'; else if (o.t === 'part' && o.ox >= 0) { const ow = m.objs[idx(o.ox, o.oy)]; c = ow && ow.t === 'bld' ? ROOF[ow.k] || MAP_COL.bld : '#c9873e' } else if (o.t === 'bld') c = ROOF[o.k] || MAP_COL.bld }
    g.fillStyle = c; g.fillRect(ox + x * s, oy + y * s, s, s);
  }
}
let mapView = null, mapZoom = false;
// draw a whole area with the real game art (daytime, no people) into a canvas
function renderMapArt(which) {
  const prev = World.cur; useMap(which);
  const c = mkc(W * 16, H * 16), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  drawTerrain(g, -1, -1, W, H, 0); drawPave(g, -1, -1, W, H); drawSoil(g, -1, -1, W, H);
  const D = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = World.objs[idx(x, y)]; if (o && o.t !== 'part') D.push([y + (o.t === 'grass' ? .4 : .9), 0, o, x, y]); const so = World.soil[idx(x, y)]; if (so && so.c) D.push([y + .7, 1, so, x, y]) }
  D.sort((p, q) => p[0] - q[0]);
  for (const d of D) { if (d[1]) drawCrop(g, d[2], d[3], d[4], 0); else { const sh = d[2].shake; d[2].shake = 0; drawObject(g, d[2], d[3], d[4], 0); d[2].shake = sh } }
  useMap(prev); return c;
}
function mapTab(b, which) {
  const here = isInside() ? 'town' : World.cur; which = which || mapView || here; mapView = which;
  b.innerHTML = `<div class="mapbtns"><button class="btn ${which === 'farm' ? '' : 'alt'}" data-mv="farm">${esc(state.look.farm || 'Your farm')}</button><button class="btn ${which === 'town' ? '' : 'alt'}" data-mv="town">Bethlehem</button><button class="btn alt mz" id="mZoom">${mapZoom ? '－' : '＋'}</button></div>
    <div class="mapwrap"><div class="mapinner ${mapZoom ? 'zoom' : ''}"></div></div>
    <div class="mapkey"><span><i class="kd you"></i>You</span><span><i class="kd open"></i>Open now</span><span><i class="kd shut"></i>Closed</span></div>
    <p class="muted" style="margin:4px 2px 0">${which === here ? '' : 'You aren’t in this area right now. '}${which === 'farm' ? 'The road on the right leads to Bethlehem.' : 'The road on the left leads home to your farm. Mount Sinai and the Jordan aren’t open yet.'}</p>`;
  b.querySelectorAll('[data-mv]').forEach(el => el.onclick = () => { sfx.tap(); mapTab(b, el.dataset.mv) });
  $('#mZoom').onclick = () => { sfx.tap(); mapZoom = !mapZoom; mapTab(b, which) };
  const inner = b.querySelector('.mapinner'), art = renderMapArt(which); art.className = 'mapart'; inner.appendChild(art);
  const pos = (x, y) => `left:${x / W * 100}%;top:${y / H * 100}%`;
  const lab = (html, x, y, cls = '') => inner.insertAdjacentHTML('beforeend', `<div class="mlab ${cls}" style="${pos(x, y)}">${html}</div>`);
  const status = k => `<i class="kd ${shopOpen(k) ? 'open' : 'shut'}"></i>`;
  if (which === 'town') {
    const T = World.maps.town;
    const names = { synagogue: ['⛪', 'Church'], smithy: ['⚒️', 'Blacksmith', 'smithy'], inn: ['🍞', 'Inn', 'inn'], carpenter: ['🪚', 'Carpenter', 'carpenter'], stall_blue: ['🧺', 'Market', 'market'], well: ['💧', 'Well'] };
    for (let i = 0; i < W * H; i++) { const o = T.objs[i]; if (o && o.t === 'bld' && names[o.k]) { const x = i % W, y = (i / W) | 0, [ic, n, shop] = names[o.k], sp = AT[BLD[o.k][0]][0]; lab(`${shop ? status(shop) : ''}${ic} ${n}`, x + BLD[o.k][1] / 2, y + 1 - sp.height / 16 - .2) } }
    lab('↑ Mount Sinai <small>(soon)</small>', 25, 2.2, 'road'); lab('↓ The Jordan <small>(soon)</small>', 36, H - 1.2, 'road'); lab('← Your farm', .4, 26.4, 'road left');
  } else {
    const F = World.maps.farm, Tn = World.TENT; let home = ['⛺', 'Tent'], wx = 0, wy = 0, wn = 0;
    for (let i = 0; i < W * H; i++) { const o = F.objs[i], x = i % W, y = (i / W) | 0;
      if (o && o.t === 'bld') { if (o.k === 'farmhouse') home = ['🏠', 'Home']; if (o.k === 'coop') lab('🐔 Coop', x + 1, y - 2.4); if (o.k === 'barn') lab('🐐 Barn', x + 2.5, y - 4) }
      if (o && o.t === 'bin') lab('📦 Bin', x + .5, y + 1.15, 'sm below'); if (o && o.t === 'crate') lab('🗃️ Chest', x + .5, y + 1.15, 'sm below');
      if (F.ground[i] === WATER && x > 3 && y > 3 && x < W - 3 && y < H - 3) { wx += x; wy += y; wn++ } }
    lab(`${home[0]} ${home[1]}`, Tn.x + .5, Tn.y - 1.6); if (wn) lab('🐟 Pond', wx / wn + .5, wy / wn + .5, 'sm');
    lab('Bethlehem →', W - .4, World.EXIT.y - .6, 'road right');
  }
  if (which === here) {
    let mx = player.x, my = player.y; if (isInside()) { const d = bldDoor(World.cur); mx = d[0]; my = d[1] }
    inner.insertAdjacentHTML('beforeend', `<div class="pin" style="${pos(mx, my)}"><b></b><span>${isInside() ? 'You (inside)' : 'You'}</span></div>`);
    if (mapZoom) requestAnimationFrame(() => { const w = b.querySelector('.mapwrap'); w.scrollLeft = mx / W * inner.offsetWidth - w.clientWidth / 2; w.scrollTop = my / H * inner.offsetHeight - w.clientHeight / 2 });
  }
}
// ---------- things to look at inside ----------
function furnitureAction(o) {
  switch (o.k) {
    case 'bimah': visitChurch(); break;
    case 'ark': say('The altar, hung with a blue curtain and a golden cross. On top sit two stone tablets for the Ten Commandments, and a small lamp burns before it day and night.'); break;
    case 'menorah': say('A golden lampstand with seven branches. Its flames flicker softly.'); break;
    case 'shelf': say('Shelves of scrolls: the Law, the Prophets and the Psalms.'); break;
    case 'pew': say('A long wooden bench, worn smooth by many Sabbaths.'); break;
    case 'lamp': say('An oil lamp on a stand. Someone keeps it filled every evening.'); break;
    case 'plant': say('A potted myrtle. It smells sweet.'); break;
  }
}
