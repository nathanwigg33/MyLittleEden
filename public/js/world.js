// The farm map: ground, objects, terrain drawing.
'use strict';
const W = 48, H = 40;
const WATER = 0, DIRT = 1, GRASS = 2;
const idx = (x, y) => y * W + x, inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
// object types: hp = hits to clear, tool = which tool clears it, solid = blocks walking
const OBJ = {
  oak: { tool: 'axe', hp: 6, solid: 1, tree: 1 }, olive: { tool: 'axe', hp: 6, solid: 1, tree: 1 },
  stump: { tool: 'axe', hp: 3, solid: 1 }, twig: { tool: 'axe', hp: 1, solid: 1 },
  rock: { tool: 'pick', hp: 2, solid: 1 }, boulder: { tool: 'pick', hp: 5, solid: 1 },
  weed: { tool: 'scythe', hp: 1, solid: 1 }, grass: { tool: 'scythe', hp: 1, solid: 0 },
  wild: { solid: 1 }, bush: { solid: 1 }, tent: { solid: 1 }, part: { solid: 1 }, campfire: { solid: 1 }, sign: { solid: 1 }, crate: { solid: 1 }, bin: { solid: 1 },
};
const World = {
  ground: null, objs: null, seed: 1,
  TENT: { x: 13, y: 8 }, EXIT: { x: 47, y: 20 },
  get(x, y) { return inb(x, y) ? this.objs[idx(x, y)] : null },
  // the object at a cell (follows multi-cell parts back to their owner)
  owner(x, y) { const o = this.get(x, y); if (o && o.t === 'part') return { o: this.objs[idx(o.ox, o.oy)], x: o.ox, y: o.oy }; return o ? { o, x, y } : null },
  solid(x, y) { if (!inb(x, y)) return true; if (this.ground[idx(x, y)] === WATER) return true; const o = this.objs[idx(x, y)]; return !!(o && OBJ[o.t] && OBJ[o.t].solid) },
  place(x, y, o) { this.objs[idx(x, y)] = o },
  footprint(x, y, w, h, o) { for (let yy = y - h + 1; yy <= y; yy++) for (let xx = x - Math.floor(w / 2); xx <= x + Math.floor(w / 2); xx++) this.objs[idx(xx, yy)] = (xx === x && yy === y) ? o : { t: 'part', ox: x, oy: y } },
};

// ---------- new farm ----------
function genFarm(seed) {
  const R = mulberry(seed); World.seed = seed;
  const g = World.ground = new Uint8Array(W * H).fill(GRASS), o = World.objs = new Array(W * H).fill(null);
  const noise = (x, y, s) => { // smooth value noise
    const fx = x / s, fy = y / s, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, sm = t => t * t * (3 - 2 * t);
    const h = (a, b) => hash(a * 13 + seed, b * 7 - seed);
    return lerp(lerp(h(x0, y0), h(x0 + 1, y0), sm(tx)), lerp(h(x0, y0 + 1), h(x0 + 1, y0 + 1), sm(tx)), sm(ty));
  };
  // pond (south-east)
  const P = { x: 36, y: 30 };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x - P.x) / 1.25, y - P.y) + noise(x, y, 3) * 2.2; if (d < 4.4) g[idx(x, y)] = WATER }
  // dirt patches across the field
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) if (g[idx(x, y)] === GRASS && noise(x + 50, y + 20, 5) > .72) g[idx(x, y)] = DIRT;
  // yard in front of the tent and the road to town
  const T = World.TENT;
  for (let y = T.y - 3; y <= T.y + 5; y++) for (let x = T.x - 6; x <= T.x + 6; x++) if (Math.hypot((x - T.x) / 6, (y - T.y - 1) / 4) < 1) g[idx(x, y)] = DIRT;
  let px = T.x, py = T.y + 3;
  const road = [];
  while (py < 20) { road.push([px, py]); py++ }
  while (px < W) { road.push([px, py]); if (R() < .12 && py < 22) py++; else if (R() < .1 && py > 19) py--; px++ }
  for (const [x, y] of road) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (inb(x + dx, y + dy)) g[idx(x + dx, y + dy)] = DIRT;
  const roadSet = new Set(road.flatMap(([x, y]) => [idx(x, y), idx(x + 1, y), idx(x, y + 1), idx(x + 1, y + 1), idx(x, y - 1), idx(x - 1, y), idx(x + 2, y), idx(x, y + 2)]));
  World.EXIT = { x: W - 1, y: road[road.length - 1][1] };
  // tent + campfire + a crate of starter supplies
  World.footprint(T.x, T.y, 3, 2, { t: 'tent' });
  World.place(T.x + 3, T.y + 1, { t: 'campfire' });
  World.place(T.x - 3, T.y, { t: 'crate' });
  World.place(T.x + 3, T.y - 1, { t: 'bin' });
  World.place(W - 3, World.EXIT.y - 2, { t: 'sign', text: 'Bethlehem — the road to town is still being built' });
  const keep = (x, y) => Math.hypot((x - T.x) / 6.5, (y - T.y - 1) / 4.5) < 1 || roadSet.has(idx(x, y));
  // forest border (cannot be cleared)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y) + noise(x, y, 2) * 1.6;
    if (edge < 2.4 && !roadSet.has(idx(x, y)) && g[idx(x, y)] !== WATER) o[idx(x, y)] = { t: 'wild', k: pick(['oak', 'oak', 'pine', 'tree2']), v: ri(0, 3) };
    else if (edge < 3.2 && !roadSet.has(idx(x, y)) && g[idx(x, y)] !== WATER && R() < .35) o[idx(x, y)] = { t: 'bush', v: ri(0, 1) };
  }
  // overgrowth
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
    const i = idx(x, y); if (o[i] || g[i] === WATER || keep(x, y)) continue;
    let nearWater = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g[idx(x + dx, y + dy)] === WATER) nearWater = true;
    const woods = noise(x + 9, y + 3, 6), r = R();
    if (woods > .62 && r < .32 && !nearWater) o[i] = { t: R() < .55 ? 'oak' : 'olive', hp: 6, v: ri(0, 3) };
    else if (r < .05) o[i] = { t: 'rock', hp: 2, v: ri(0, 1) };
    else if (r < .065 && !nearWater) o[i] = { t: 'boulder', hp: 5 };
    else if (r < .1) o[i] = { t: 'twig', hp: 1 };
    else if (r < .12) o[i] = { t: 'stump', hp: 3 };
    else if (r < .3) o[i] = { t: 'weed', hp: 1, v: ri(0, 3) };
    else if (r < .42 && g[i] === GRASS) o[i] = { t: 'grass', hp: 1, v: ri(0, 3) };
  }
  // a few trees right by the tent for shade
  World.place(T.x - 5, T.y - 2, { t: 'olive', hp: 6, v: 1 }); World.place(T.x + 5, T.y - 3, { t: 'oak', hp: 6, v: 2 });
}

// ---------- terrain drawing (dual grid: smooth, diagonal edges like the art pack) ----------
const TB = { land: [], grass: [] };
function bakeTerrain() {
  const grassTex = AT.grass.slice(0, 2).map(c => tintCanvas(c, [1.03, .98, .86], [8, 4, 0]));
  const grassTex2 = AT.grass.slice(2, 4).map(c => tintCanvas(c, [1.03, .98, .86], [8, 4, 0]));
  const dirtTex = AT.dirt.map(c => tintCanvas(c, [1.02, 1, .96], [4, 2, 0]));
  const px = (c) => c.getContext('2d').getImageData(0, 0, 16, 16).data;
  const gT = [...grassTex, ...grassTex2].map(px), dT = dirtTex.map(px);
  const f = (c, u, v) => (c[0] * (1 - u) + c[1] * u) * (1 - v) + (c[2] * (1 - u) + c[3] * u) * v;
  for (let m = 0; m < 16; m++) {
    const c = [m & 1, (m >> 1) & 1, (m >> 2) & 1, (m >> 3) & 1];
    const on = (i, j) => f(c, (i + .5) / 16, (j + .5) / 16) >= .5;
    // land over water: dirt, cliff face below, foam ring
    TB.land[m] = [0, 1].map(frame => dT.map(tex => {
      const cv = mkc(16, 16), g = cv.getContext('2d'), d = g.createImageData(16, 16), a = d.data;
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
        const k = (j * 16 + i) * 4, s = (((j + 8) & 15) * 16 + ((i + 8) & 15)) * 4; let col = null, al = 255;
        if (on(i, j)) { col = [tex[s], tex[s + 1], tex[s + 2]]; if (!on(i, j + 1)) col = [col[0] * .82, col[1] * .8, col[2] * .78] }
        else if (on(i, j - 1)) col = [139, 92, 62];
        else if (on(i, j - 2)) col = [112, 70, 48];
        else if (on(i, j - 3)) col = [86, 54, 40];
        else { let near = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) if (on(i + dx, j + dy)) near = 1; if (!near) for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, 4], [0, 5]]) if (on(i + dx, j + dy)) near = 2;
          if (near === 1 && frame === 0 || near === 2 && frame === 1) { col = [235, 248, 255]; al = 200 } }
        if (col) { a[k] = col[0]; a[k + 1] = col[1]; a[k + 2] = col[2]; a[k + 3] = al }
      }
      g.putImageData(d, 0, 0); return cv;
    }));
    // grass over dirt: dark rim, soft shadow under the edge
    TB.grass[m] = gT.map(tex => {
      const cv = mkc(16, 16), g = cv.getContext('2d'), d = g.createImageData(16, 16), a = d.data;
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
        const k = (j * 16 + i) * 4, s = (((j + 8) & 15) * 16 + ((i + 8) & 15)) * 4;
        if (on(i, j)) {
          let rim = !on(i + 1, j) || !on(i - 1, j) || !on(i, j - 1), bot = !on(i, j + 1);
          a[k] = tex[s]; a[k + 1] = tex[s + 1]; a[k + 2] = tex[s + 2]; a[k + 3] = 255;
          if (bot) { a[k] = 74; a[k + 1] = 128; a[k + 2] = 52 } else if (rim) { a[k] = 112; a[k + 1] = 178; a[k + 2] = 70 }
        } else if (on(i, j - 1)) { a[k] = 0; a[k + 1] = 0; a[k + 2] = 0; a[k + 3] = 46 }
      }
      g.putImageData(d, 0, 0); return cv;
    });
  }
}
function groundAt(x, y) { x = clamp(x, 0, W - 1); y = clamp(y, 0, H - 1); return World.ground[idx(x, y)] }
function drawTerrain(g, x0, y0, x1, y1, t) {
  // water everywhere underneath
  const wf = Math.floor(t * 1.2) % 2;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    g.drawImage(AT.water[(Math.floor(hash(x, y) * 4) + wf) % AT.water.length], x * 16, y * 16);
    if (hash(x + 3, y + 7) < .1) { g.fillStyle = `rgba(255,255,255,${.25 + .25 * Math.sin(t * 1.6 + x)})`; g.fillRect(x * 16 + 4 + Math.round(Math.sin(t + y) * 2), y * 16 + 9, 5, 1) }
  }
  const foam = Math.floor(t * 1.5) % 2;
  for (let y = y0 - 1; y <= y1; y++) for (let x = x0 - 1; x <= x1; x++) {
    const L = (a, b) => groundAt(a, b) !== WATER ? 1 : 0, Gr = (a, b) => groundAt(a, b) === GRASS ? 1 : 0;
    const ml = L(x, y) | (L(x + 1, y) << 1) | (L(x, y + 1) << 2) | (L(x + 1, y + 1) << 3);
    const v = Math.floor(hash(x * 3, y * 5) * 4);
    if (ml) g.drawImage(TB.land[ml][foam][v % TB.land[ml][foam].length], x * 16 + 8, y * 16 + 8);
    const mg = Gr(x, y) | (Gr(x + 1, y) << 1) | (Gr(x, y + 1) << 2) | (Gr(x + 1, y + 1) << 3);
    if (mg) g.drawImage(TB.grass[mg][hash(x * 7, y * 3) < .7 ? v % 2 : 2 + v % 2], x * 16 + 8, y * 16 + 8);
  }
  // flat ground decoration (flowers, little plants)
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
    if (World.ground[idx(x, y)] !== GRASS || World.objs[idx(x, y)]) continue; const h = hash(x * 11 + 5, y * 17 + 3);
    if (h < .05) { const s = AT.flower[Math.floor(h * 60) % AT.flower.length]; g.drawImage(s, x * 16 + 4 + Math.floor(h * 100) % 6, y * 16 + 4) }
    else if (h < .09) { const s = AT.tuft[Math.floor(h * 99) % AT.tuft.length]; g.drawImage(s, x * 16 + 8 - s.width / 2, y * 16 + 8 - s.height / 2) }
  }
}

// ---------- object sprites ----------
// make sure an older farm gets a shipping bin beside the tent
function ensureBin() {
  if (World.objs.some(o => o && o.t === 'bin')) return; const T = World.TENT;
  for (const [dx, dy] of [[3, -1], [2, 1], [-2, 1], [4, 0], [-4, 1], [3, 2], [-3, 2], [0, 3]]) { const x = T.x + dx, y = T.y + dy; if (inb(x, y) && !World.objs[idx(x, y)] && World.ground[idx(x, y)] !== WATER) { World.place(x, y, { t: 'bin' }); return } }
}
const BIN = (() => { const c = mkc(22, 20), g = c.getContext('2d'), R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h) };
  R('#2a1610', 0, 4, 22, 16); R('#8a5530', 1, 5, 20, 14); R('#a8703e', 1, 5, 20, 3); R('#6e4024', 1, 12, 20, 1); R('#6e4024', 1, 16, 20, 1);
  R('#2a1610', 0, 0, 22, 6); R('#c38a4e', 1, 1, 20, 4); R('#e0a865', 1, 1, 20, 1); R('#f2c94c', 9, 2, 4, 2); R('#2a1610', 10, 5, 2, 2);
  R('#c9a24a', 2, 6, 1, 13); R('#c9a24a', 19, 6, 1, 13); return c })();
const SIGN = (() => { const c = mkc(16, 18), g = c.getContext('2d'); g.fillStyle = '#24141e'; g.fillRect(6, 8, 4, 10); g.fillRect(0, 0, 16, 11); g.fillStyle = '#8a5a34'; g.fillRect(7, 9, 2, 9); g.fillStyle = '#c99256'; g.fillRect(1, 1, 14, 9); g.fillStyle = '#a8703e'; g.fillRect(1, 8, 14, 2); g.fillStyle = '#6a4024'; g.fillRect(3, 3, 10, 1); g.fillRect(3, 5, 7, 1); return c })();
function treeSprite(o, t, x, y) {
  const set = o.t === 'olive' || (o.t === 'wild' && o.k === 'olive') ? AT.olive : (o.k === 'tree2' ? AT.tree2 : o.k === 'pine' ? AT.pine : AT.oak);
  if (set.length === 1) return set[0];
  return set[Math.floor(t * 1.4 + hash(x, y) * 4) % set.length];
}
function drawObject(g, o, x, y, t) {
  const cx = x * 16 + 8, by = y * 16 + 16;
  let sh = o.shake ? Math.round(Math.sin(t * 60) * o.shake * 6) : 0;
  const spr = (s, dy = 0, dx = 0) => g.drawImage(s, Math.round(cx - s.width / 2 + sh + dx), Math.round(by - s.height + dy));
  const shadow = (w, dy = -2) => { g.fillStyle = 'rgba(30,20,10,.22)'; g.beginPath(); g.ellipse(cx, by + dy, w, Math.max(2, w * .38), 0, 0, 7); g.fill() };
  switch (o.t) {
    case 'oak': case 'olive': shadow(10, -1); spr(treeSprite(o, t, x, y), 3); break;
    case 'wild': { const s = treeSprite(o, t, x, y); shadow(10, -1); g.drawImage(s, Math.round(cx - s.width / 2 + (hash(x, y) - .5) * 6), Math.round(by - s.height + 3 + (hash(y, x) - .5) * 4)); break }
    case 'stump': shadow(7); spr(AT.stump[0], 1); break;
    case 'twig': spr(AT.ic_wood[0], -2); break;
    case 'rock': shadow(6); spr(o.v ? AT.rock_m[0] : AT.stone[0], -1); break;
    case 'boulder': shadow(9); spr(AT.boulder[0], 0); break;
    case 'weed': spr([AT.weed, AT.weed2, AT.weed3, AT.weed4][o.v || 0][0], -1); break;
    case 'grass': spr(AT.leafy[(o.v || 0) % AT.leafy.length], -2); break;
    case 'bush': shadow(10); spr(AT.bush[0], 3); break;
    case 'tent': g.fillStyle = 'rgba(30,20,10,.25)'; g.beginPath(); g.ellipse(cx, by - 2, 26, 6, 0, 0, 7); g.fill(); spr(AT.tent[0], 2); break;
    case 'campfire': shadow(7); spr(AT.campfire[0], 0); if (AT.fire) { const f = AT.fire[Math.floor(t * 9) % AT.fire.length]; g.drawImage(f, Math.round(cx - f.width / 2), Math.round(by - f.height - 5)) } break;
    case 'crate': shadow(7); spr(AT.crate[0], 0); break;
    case 'bin': shadow(10); spr(BIN, 1); break;
    case 'sign': shadow(6); spr(SIGN, 0); break;
  }
  if (o.shake) o.shake = Math.max(0, o.shake - 1 / 60);
}
