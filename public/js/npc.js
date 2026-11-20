// Villagers of Bethlehem: looks, where they spend the day, what they say, and friendship.
'use strict';
const VILLAGERS = [
  { id: 'tobiah', name: 'Tobiah', role: 'Market merchant', shop: 'market', spot: [22.5, 24.9], roam: 1.2, look: { hair: 'curly', hairCol: 1, skin: 2, shirt: 5, pants: 0 },
    lines: ['Fresh seeds and fair prices! Well… mostly fair.', 'A heavy bag and light pockets? Let me help with that.', 'Caravans come through from Egypt to Damascus. Every one of them stops in Bethlehem for bread.', 'Barley comes in first, then wheat. Plant both and you’ll never go hungry.', 'I hear the Jordan is lovely this time of year. Not that I ever leave my stall.'],
    warm: ['You’re becoming my best customer. Don’t tell the others.', 'My father sold seeds from this very corner. Now I sell them to you.'] },
  { id: 'jesse', name: 'Jesse', role: 'Blacksmith', shop: 'smithy', spot: [47.5, 25.8], roam: .8, look: { hair: 'short', hairCol: 0, skin: 3, shirt: 6, pants: 1 },
    lines: ['“Iron sharpeneth iron.” Proverbs 27:17. Bring me your tools and some shekels.', 'A dull axe takes twice the strength. Ecclesiastes says so, and so do my arms.', 'Bronze first, then iron. Each one makes the work lighter.', 'The forge never really goes cold. Neither do I.', 'Swing from the shoulders, not the wrists. Your tools will thank you.'],
    warm: ['You take good care of your tools. I can tell.', 'My grandfather taught me to hammer on this anvil. Maybe I’ll teach someone one day.'] },
  { id: 'naomi', name: 'Naomi', role: 'Widow of Bethlehem', spot: [36.5, 31.5], roam: 2.5, look: { hair: 'long', hairCol: 6, skin: 1, shirt: 4, pants: 2 },
    lines: ['Bethlehem means “house of bread.” Grow well, and it will be true for you too.', 'I left this town once, and came back with empty hands. The Lord filled them again.', 'The well in the plaza is the oldest thing in town, older than me, if you can believe it.', 'Rest on the Sabbath, dear. The fields will wait for you.', 'Your farm used to be a fine field. I’m glad someone is tending it again.'],
    warm: ['You remind me of my daughter-in-law. Kind and hard-working.', 'Come sit with me on the Sabbath sometime. I’ll tell you about the old days.'] },
  { id: 'ruth', name: 'Ruth', role: 'Gleaner', spot: [27.5, 27.5], roam: 3, look: { hair: 'long', hairCol: 3, skin: 2, shirt: 3, pants: 0 },
    lines: ['At harvest I glean the edges of the fields. The law says to leave a little for those in need.', '“Whither thou goest, I will go.” I said that to Naomi once, and I meant it.', 'I came here from Moab. Bethlehem has become home.', 'Barley harvest is my favorite time of year. The whole town smells like bread.', 'If you ever have extra grain, the poor of the town will bless you for it.'],
    warm: ['You’ve become a true friend. That means a lot to someone from far away.', 'Boaz says your farm is looking wonderful. I agree!'] },
  { id: 'boaz', name: 'Boaz', role: 'Landowner', spot: [40.5, 29.2], roam: 2, look: { hair: 'short', hairCol: 6, skin: 2, shirt: 0, pants: 2 },
    lines: ['“The LORD be with you!” That’s how we greet our workers in Bethlehem.', 'A good farmer rises early and rests well. Both matter.', 'My fields are east of here. Yours will grow just as fine with patience.', 'Never trust a man who doesn’t know when his barley is ripe.', 'Generosity is the best fertilizer, I always say.'],
    warm: ['You work your land with honor. That is rare.', 'If you ever need advice about the harvest, you know where to find me.'] },
  { id: 'simeon', name: 'Elder Simeon', role: 'Church elder', spot: [34.5, 21.2], roam: 1, look: { hair: 'mop', hairCol: 6, skin: 1, shirt: 0, pants: 0 },
    lines: ['Welcome, child. The doors of the church are always open.', '“This is the day which the LORD hath made; we will rejoice and be glad in it.” Psalm 118:24', 'Come to church on the Sabbath morning. The whole town gathers here.', '“Commit thy works unto the LORD, and thy thoughts shall be established.” Proverbs 16:3', 'I have prayed for your fields. Now go water them!'],
    warm: ['You are a blessing to this town.', 'I have seen many farmers come and go. I hope you stay.'] },
  { id: 'miriam', name: 'Miriam', role: 'Innkeeper', shop: 'inn', spot: [45.5, 40.4], roam: 1.2, look: { hair: 'curly', hairCol: 0, skin: 3, shirt: 1, pants: 3 },
    lines: ['Hungry? A warm meal brings your strength right back.', 'Travelers sleep here every night. Some even sleep in the stable when we’re full.', 'My lentil stew is famous from here to Jerusalem.', 'Eat well, sleep well, work well. That’s my whole philosophy.', 'The fig cakes go fast. Come early!'],
    warm: ['For you, the bread is always fresh.', 'You’re always welcome at my table, friend.'] },
  { id: 'joseph', name: 'Joseph', role: 'Carpenter', shop: 'carpenter', spot: [15.5, 36.2], roam: 1, look: { hair: 'short', hairCol: 2, skin: 2, shirt: 6, pants: 2 },
    lines: ['A good house starts with good timber. Bring me wood and stone and I’ll build you anything.', '“Except the LORD build the house, they labour in vain that build it.” Psalm 127:1', 'Measure twice, cut once. My father taught me that.', 'My family comes from the line of David, like many here in Bethlehem.', 'A barn full of animals is a happy barn. A coop too!'],
    warm: ['Your farm is coming along nicely. I’d like to see it someday.', 'Every beam I set, I set to last a lifetime. Yours too.'] },
  { id: 'peter', name: 'Peter', role: 'Fisherman', shop: 'tackle', spot: [32.5, 36], roam: 1.2, look: { hair: 'curly', hairCol: 1, skin: 3, shirt: 3, pants: 1 },
    lines: ['I’ve fished these waters since I was a boy. Some nights we caught nothing at all. Other mornings the nets nearly broke!', 'Catfish only come out after dark. Try the river at night.', 'The bay has bigger fish. The river has tastier ones. My opinion, anyway.', 'Old fishermen say a Great Fish lives out past the end of my dock.', 'Throw your line on the other side of the boat sometimes. You never know.', 'Sardines are easy. Sea bream are tricky, and only come in summer and autumn.'],
    warm: ['You’ve got patience. That’s the whole secret of fishing.', 'You’re becoming a real fisher, friend. I’m proud of you.'] },
];
const npcs = [];   // live villagers on the town map
function initVillagers() {
  for (const v of VILLAGERS) npcs.push({ v, x: v.spot[0], y: v.spot[1], tx: v.spot[0], ty: v.spot[1], wait: Math.random() * 3, dir: 's', moving: false, at: 0, frames: buildCharacter(v.look) });
}
const isSabbath = () => weekday() === 'Sabbath';
const heartsOf = id => Math.min(10, Math.floor(((state.friends || {})[id] || { pts: 0 }).pts / 20));
// where each villager wants to be right now
// seats in front of the benches inside the synagogue
const SEATS = [[28.2, 30.2], [29.6, 30.2], [35.4, 30.2], [36.8, 30.2], [28.2, 32.2], [29.6, 32.2], [35.4, 32.2], [36.8, 32.2], [28.2, 25.2], [36.8, 25.2]];
const INN_GUESTS = { boaz: [27.5, 28.15], ruth: [37.5, 28.15], naomi: [37.5, 31.15], tobiah: [27.5, 31.15] };
const inService = () => isSabbath() && state.time >= 9 * 60 && state.time < 13 * 60;
// which map each villager is on right now, and where they want to be there: [map, x, y, roam]
function villagerHome(n, k) {
  if (inService()) return n.v.id === 'simeon' ? ['synagogue', 32.5, 25.35, 0] : ['synagogue', ...SEATS[k % SEATS.length], 0];
  if (n.v.id === 'simeon' && state.time >= 8 * 60 && state.time < 18 * 60) return ['synagogue', 30.5, 27.6, 1.2];
  if (n.v.id === 'jesse' && shopOpen('smithy')) return ['smithy', 32.5, 25.2, .9];          // behind his counter
  if (n.v.id === 'joseph' && shopOpen('carpenter')) return ['carpenter', 32.5, 25.2, .9];    // behind his planning table
  if (n.v.id === 'miriam' && shopOpen('inn')) return ['inn', 32, 24.2, 1];                    // behind her bar
  if (n.v.id === 'peter') return villagersOut() ? ['jordan', JORDAN.dock[0], JORDAN.dock[1], 1.2] : ['away', 0, 0, 0];
  const P = INN_GUESTS[n.v.id]; if (P && state.time >= 19 * 60 && state.time < 22 * 60) return ['inn', P[0], P[1], 0];   // supper at the inn
  if (!villagersOut()) return ['away', 0, 0, 0];
  return ['town', n.v.spot[0], n.v.spot[1], n.v.roam];
}
const villagersOut = () => state.time >= 7 * 60 && state.time < 19 * 60;
function updateVillagers(dt) {
  npcs.forEach((n, k) => {
    const [m, hx, hy, roam] = villagerHome(n, k);
    if (n.map !== m) { n.map = m; n.x = n.tx = hx; n.y = n.ty = hy; n.wait = rnd(1, 3); n.dir = (m === 'synagogue' && n.v.id !== 'simeon') || (m === 'inn' && n.v.id !== 'miriam') ? 'n' : 's' }   // they walked over while you weren't looking
    if (m !== World.cur) return;
    if (n.talking) { n.moving = false; return }
    if (Math.hypot(n.x - hx, n.y - hy) > roam + 2) { n.tx = hx; n.ty = hy; n.wait = 0 }
    if (n.wait > 0) { n.wait -= dt; n.moving = false; return }
    const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
    if (d < .1) { n.wait = rnd(2, 6); const a = Math.random() * 6.28, r = Math.random() * roam; n.tx = hx + Math.cos(a) * r; n.ty = hy + Math.sin(a) * r * .6; return }
    const sp = 1.6 * dt, nx = n.x + dx / d * Math.min(sp, d), ny = n.y + dy / d * Math.min(sp, d);
    if (World.solid(Math.floor(nx), Math.floor(ny)) || Math.hypot(nx - player.x, ny - player.y) < .7) { n.wait = rnd(1, 2); n.tx = hx; n.ty = hy; n.moving = false; return }
    n.x = nx; n.y = ny; n.moving = true; n.at += dt;
    n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'l' : 'r') : (dy < 0 ? 'n' : 's');
  });
}
function villagerNear() {
  let best = null, bd = 1.5; const [dx, dy] = faceVec();
  for (const n of npcs) { if (n.map !== World.cur) continue; const vx = n.x - player.x, vy = n.y - player.y, d = Math.hypot(vx, vy), s = d - (vx * dx + vy * dy) / (d || 1) * .4; if (d < 1.7 && s < bd) { bd = s; best = n } }
  return best;
}
async function talkTo(n) {
  const v = n.v, f = (state.friends = state.friends || {})[v.id] || (state.friends[v.id] = { pts: 0, last: 0, met: 0 });
  n.talking = true; n.dir = Math.abs(player.x - n.x) > Math.abs(player.y - n.y) ? (player.x < n.x ? 'l' : 'r') : (player.y < n.y ? 'n' : 's');
  let text;
  if (!f.met) { f.met = 1; text = `Shalom! I'm ${v.name}, the ${v.role.toLowerCase()}. You must be ${state.look.name}, the new farmer. Welcome to Bethlehem!` }
  else if (f.last === state.totalDay) text = pick(['Good to see you again today.', 'Back so soon? Go well, friend.', 'Shalom again!']);
  else if (isSabbath()) text = 'Shabbat shalom! A day of rest and good company.';
  else { const pool = heartsOf(v.id) >= 2 ? v.lines.concat(v.warm) : v.lines; text = pool[(state.totalDay + v.id.length) % pool.length] }
  const first = f.last !== state.totalDay; if (first) { f.last = state.totalDay; f.pts = Math.min(200, f.pts + (isSabbath() ? 8 : 5)) }
  await say(text, null, { name: v.name, frames: n.frames });
  if (first && heartsOf(v.id) > Math.floor((f.pts - (isSabbath() ? 8 : 5)) / 20)) { toast(`${v.name} likes you more! ♥ ${heartsOf(v.id)}`); sfx.pick() }
  n.talking = false; n.wait = 1.5;
  if (v.id === 'peter') await peterGift();
  if (v.shop && shopOpen(v.shop)) ({ market: openMarket, smithy: openSmithy, inn: openInn, carpenter: openCarpenter, tackle: openTackle })[v.shop]();
}
function drawVillager(g, n) {
  const fx = n.x * 16, fy = n.y * 16; g.fillStyle = 'rgba(30,20,10,.25)'; g.beginPath(); g.ellipse(Math.round(fx), Math.round(fy), 5, 2, 0, 0, 7); g.fill();
  const anim = n.moving ? (n.dir === 'n' ? 'walk_n' : n.dir === 's' ? 'walk_s' : 'walk') : (n.dir === 'n' ? 'idle_n' : n.dir === 's' ? 'idle_s' : 'idle');
  drawChar(g, n.frames, anim, Math.floor(n.moving ? n.at * 10 : GT * 5 + n.x), fx, fy, n.dir === 'l');
}
// a portrait for the dialog box: the head and shoulders, scaled up
function drawPortrait(c, frames) {
  const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false;
  g.save(); g.scale(3, 3); drawChar(g, frames, 'idle_s', 0, c.width / 6, c.height / 3 + 4, false); g.restore();
}
function peopleTab(b) {
  let h = '<p class="muted" style="margin-top:0">Talk to villagers each day to become friends. Everyone gathers at the church on Sabbath mornings.</p>';
  for (const v of VILLAGERS) {
    const f = (state.friends || {})[v.id], hs = heartsOf(v.id);
    h += `<div class="person"><canvas width="48" height="48" data-p="${v.id}"></canvas><div class="pi"><b>${f && f.met ? v.name : '???'}</b><div class="muted">${f && f.met ? v.role : 'Not met yet'}</div><div class="hearts">${'♥'.repeat(hs)}<span>${'♥'.repeat(10 - hs)}</span></div></div></div>`;
  }
  b.innerHTML = h;
  b.querySelectorAll('[data-p]').forEach(c => { const n = npcs.find(q => q.v.id === c.dataset.p); const met = ((state.friends || {})[c.dataset.p] || {}).met; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.save(); g.scale(2, 2); drawChar(g, n.frames, 'idle_s', 0, 12, 22, false); g.restore(); if (!met) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#5b2e12'; g.fillRect(0, 0, 48, 48) } });
}
