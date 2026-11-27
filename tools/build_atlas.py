"""Builds public/art/atlas.png + atlas.json for My Little Promise Land.
Art: Sunnyside World by danieldiggle (commercial use allowed, credit appreciated).
Character parts are kept as separate layers (body, hair styles, tools) so the game can
recolor and combine them at runtime for the character creator."""
import os, glob, json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from ase import parse, render

ROOT = '/home/claude/assets/sunny/Sunnyside_World_ASSET_PACK_V2.1/'
A = ROOT + 'Sunnyside_World_Assets/'
GM = ROOT + 'Sunnyside_World_Gamemaker/sprites/'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'art')
TS = Image.open(A + 'Tileset/spr_tileset_sunnysideworld_16px.png').convert('RGBA')
ASE = parse('/mnt/user-data/uploads/9c55f232-sunnyside_world_chatacter_anim_human_v1.0.aseprite')
E = {}
META = {}

def tile(x, y, w=1, h=1): return TS.crop((x*16, y*16, (x+w)*16, (y+h)*16))
def px(x0, y0, x1, y1): return TS.crop((x0, y0, x1, y1))
def trim(im):
    b = im.getbbox(); return im.crop(b) if b else im
def gm(name, i=0):
    ps = sorted(glob.glob(GM + name + '/*.png')); return Image.open(ps[i]).convert('RGBA')
def strip(path, n):
    im = Image.open(path).convert('RGBA'); w = im.width // n
    return [im.crop((k*w, 0, (k+1)*w, im.height)) for k in range(n)]
def trimset(fr):
    bb = None
    for f in fr:
        b = f.getbbox()
        if b: bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    return [f.crop(bb) for f in fr]
def tint(im, mul=(1, 1, 1), add=(0, 0, 0)):
    a = np.array(im).astype(np.float32)
    for k in range(3): a[..., k] = np.clip(a[..., k]*mul[k] + add[k], 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')
def comps(region):
    x0, y0, x1, y1 = region; im = TS.crop(region); al = np.array(im)[..., 3] > 0
    lab, n = ndimage.label(al, structure=np.ones((3, 3))); out = []
    for sl in ndimage.find_objects(lab):
        ys, xs = sl; out.append((xs.start+x0, ys.start+y0, xs.stop+x0, ys.stop+y0))
    return out

# ---------- ground textures ----------
E['grass'] = [tile(1, 1), tile(2, 1), tile(1, 2), tile(2, 2), tile(3, 2), tile(5, 2)]
E['dirt'] = [tile(9, 7), tile(10, 7), tile(9, 8), tile(10, 8)]
E['soil'] = [tile(20, 7), tile(21, 7), tile(20, 8), tile(21, 8)]
E['water'] = [tile(30, 7), tile(31, 7), tile(30, 8), tile(31, 8)]
E['sand'] = [tile(7, 1), tile(8, 1), tile(9, 1)]
E['flower'] = [trim(tile(31, 1)), trim(tile(31, 2)), trim(tile(31, 3))]
E['tuft'] = [trim(tile(27, 4)), trim(tile(28, 4)), trim(tile(29, 4)), trim(tile(30, 4))]
E['leafy'] = [trim(tile(27, 2)), trim(tile(28, 2)), trim(tile(29, 2)), trim(tile(30, 2)), trim(tile(27, 3)), trim(tile(28, 3)), trim(tile(29, 3)), trim(tile(30, 3))]
# ---------- objects ----------
E['weed'] = trim(tile(27, 1)); E['weed2'] = trim(tile(28, 1)); E['weed3'] = trim(tile(29, 1)); E['weed4'] = trim(tile(30, 1))
E['rock_s'] = trim(tile(33, 4)); E['pebble'] = trim(tile(34, 4)); E['rock_m'] = trim(tile(31, 4))
E['stump'] = trim(tile(31, 5))
E['bush'] = trim(tile(49, 1, 2, 2)); E['bush_berry'] = trim(tile(49, 3, 2, 2))
E['pine'] = trim(px(51*16+6, 3*16+8, 53*16, 6*16))
oak = trimset(strip(A + 'Elements/Plants/spr_deco_tree_01_strip4.png', 4))
E['oak'] = oak
E['olive'] = [tint(f, (.86, .9, .78), (14, 10, 6)) for f in oak]      # silvery olive green
E['tree2'] = trimset(strip(A + 'Elements/Plants/spr_deco_tree_02_strip4.png', 4))
E['mush'] = trimset(strip(A + 'Elements/Plants/spr_deco_mushroom_red_01_strip4.png', 4))
cs = [c for c in comps((48*16, 20*16+8, 56*16, 32*16)) if (c[2]-c[0]) >= 8]
rows = {}
for c in cs: rows.setdefault(round((c[1]+c[3])/2/32), []).append(c)
orerows = [r for r in [sorted(v) for k, v in sorted(rows.items())] if len(r) >= 4]
E['boulder'] = px(*orerows[0][1]); E['stone'] = px(*orerows[0][2])
# ---------- mine: ore rocks and ore / gem items, recoloured from the pack's silver, coal, blue-gem and gold rocks ----------
def recolor(im, pick, fn):
    im = im.copy(); P = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = P[x, y]
            if a and pick(r, g, b): P[x, y] = fn(r, g, b) + (a,)
    return im
white = lambda r, g, b: r > 215 and g > 215 and b > 215
cyan = lambda r, g, b: b - r > 70 and g - r > 45
orange = lambda r, g, b: r > 190 and b < 130
def gemc(mul):
    return lambda r, g, b: tuple(min(255, int(v)) for v in (b * mul[0] + 20, b * mul[1] + 10, b * mul[2] + 10))
copper = lambda r, g, b: (min(255, int(r * .92)), int(g * .62), int(b * .5))
iron = lambda r, g, b: (int(150 + (r - 200) * .6), int(78 + (g - 200) * .4), int(52 + (b - 200) * .3))
NODE = {'silver': orerows[0][2], 'coal': orerows[1][2], 'sapphire': orerows[2][2], 'gold': orerows[3][2], 'plain': orerows[4][2]}
ICON = {'silver': orerows[0][3], 'coal': orerows[1][3], 'sapphire': orerows[2][3], 'gold': orerows[3][3]}
for k in ('silver', 'coal', 'sapphire', 'gold'): E['node_' + k] = px(*NODE[k]); E['ore_' + k] = px(*ICON[k])
goldy = lambda r, g, b: (min(255, r + 10), min(255, int(g * 1.18 + 28)), int(b * .7))
E['node_goldy'] = recolor(E['node_gold'], orange, goldy); E['ore_goldy'] = recolor(E['ore_gold'], orange, goldy)
E['node_stone'] = px(*NODE['plain'])
E['node_copper'] = recolor(E['node_gold'], orange, copper); E['ore_copper'] = recolor(E['ore_gold'], orange, copper)
E['node_iron'] = recolor(E['node_silver'], lambda r, g, b: r > 200 and g > 200 and b > 200, iron); E['ore_iron'] = recolor(E['ore_silver'], lambda r, g, b: r > 120, iron)
E['node_gold'] = E.pop('node_goldy'); E['ore_gold'] = E.pop('ore_goldy')
for k, mul in (('emerald', (.25, 1.05, .45)), ('ruby', (1.1, .25, .35)), ('amethyst', (.75, .4, 1.05))):
    E['node_' + k] = recolor(E['node_sapphire'], cyan, gemc(mul)); E['ore_' + k] = recolor(E['ore_sapphire'], lambda r, g, b: b - r > 40, gemc(mul))
E['minecart'] = trim(gm('spr_deco_minecart'))
# the hand-drawn versions replace the recoloured pack art for every mine rock and ore item
import ore_art
for k in ('stone', 'copper', 'coal', 'iron', 'silver', 'gold', 'amethyst', 'emerald', 'ruby', 'sapphire'): E['node_' + k] = ore_art.node(k)
for k in ('copper', 'coal', 'iron', 'silver', 'gold'): E['ore_' + k] = trim(ore_art.lump(k))
for k in ('amethyst', 'emerald', 'ruby', 'sapphire'): E['ore_' + k] = trim(ore_art.gem(k))
for k in ('copper', 'iron', 'silver', 'gold'): E['bar_' + k] = trim(ore_art.bar(k))
for k, n in [('campfire', 'spr_deco_campfire'), ('well', 'spr_deco_well'), ('chest', 'spr_deco_chest_01_closed'), ('crate', 'spr_deco_crate_01'),
             ('barrel', 'spr_deco_barrel_closed'), ('bucket', 'spr_deco_bucket'), ('chair', 'spr_deco_chair_01')]:
    try: E[k] = trim(gm(n))
    except Exception as e: print('skip', k, e)
E['fire'] = strip(A + 'Elements/VFX/Fire/spr_deco_fire_02_strip4.png', 4)
E['glint'] = strip(A + 'Elements/VFX/Glint/spr_deco_glint_01_strip6.png', 6)
E['fence_h'] = trim(tile(39, 2)); E['fence_post'] = trim(tile(41, 3)); E['fence_v'] = trim(tile(40, 3))
for k, f in [('chicken', 'chicken_01'), ('bird', 'bird_01'), ('duck', 'duck_01')]:
    E['an_'+k] = trimset(strip(A + f'Elements/Animals/spr_deco_{f}_strip4.png', 4))

# ---------- tent (drawn for this game: woven goat-hair tent, Bethlehem style) ----------
def draw_tent():
    W, H = 52, 40; im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    ol = (36, 24, 30, 255); c1 = (214, 186, 140, 255); c2 = (186, 154, 108, 255); c3 = (150, 116, 78, 255); st = (130, 70, 48, 255)
    # back slope + roof
    d.polygon([(4, 34), (26, 6), (48, 34)], fill=c1, outline=ol)
    d.polygon([(26, 6), (48, 34), (36, 34)], fill=c2)
    for y in range(12, 34, 6):  # woven stripes
        x0 = 26 - (y-6)*22/28; x1 = 26 + (y-6)*22/28
        d.line([(x0+1, y), (x1-1, y)], fill=st if y % 12 == 0 else c3)
    d.line([(4, 34), (26, 6), (48, 34)], fill=ol)
    # door flap
    d.polygon([(19, 34), (26, 16), (33, 34)], fill=(52, 34, 34, 255), outline=ol)
    d.polygon([(26, 16), (33, 34), (30, 34)], fill=(80, 54, 46, 255))
    d.line([(26, 16), (21, 34)], fill=c1)
    # poles and ropes
    d.line([(26, 2), (26, 7)], fill=(110, 72, 40, 255), width=2)
    d.line([(26, 4), (1, 37)], fill=(170, 140, 100, 255)); d.line([(26, 4), (51, 37)], fill=(170, 140, 100, 255))
    d.rectangle([0, 36, 2, 38], fill=(110, 72, 40, 255)); d.rectangle([49, 36, 51, 38], fill=(110, 72, 40, 255))
    d.line([(4, 34), (48, 34)], fill=ol)
    return im
E['tent'] = draw_tent()


# ---------- crops: seeds icon (_00), growth stages (_01.._04), harvest icon (_05) ----------
CR = A + 'Elements/Crops/'
CROPART = {'wheat': ('wheat', None), 'barley': ('wheat', ((.78, .82, .5), (40, 40, 10))), 'leek': ('parsnip', None), 'garlic': ('cauliflower', None),
           'onion': ('radish', ((.95, .9, .35), (60, 45, 0))), 'radish': ('radish', None), 'cabbage': ('cabbage', None), 'carrot': ('carrot', None),
           'beet': ('beetroot', None), 'coriander': ('kale', None), 'flax': ('sunflower', ((.5, .75, 1.45), (0, 0, 40))),
           'turnip': ('beetroot', ((1.0, .78, 1.05), (70, 60, 70))), 'mustard': ('kale', ((1.15, 1.05, .45), (30, 30, 0))), 'melon': ('pumpkin', ((.62, 1.05, .55), (0, 12, 0))), 'gourd': ('pumpkin', None)}
PACKET = {'wheat': (232, 184, 48), 'barley': (170, 160, 96), 'radish': (204, 58, 72), 'onion': (210, 140, 60), 'leek': (96, 168, 84), 'garlic': (180, 170, 200),
          'cabbage': (150, 80, 160), 'carrot': (236, 128, 40), 'coriander': (60, 140, 110), 'flax': (80, 120, 210), 'melon': (110, 170, 60), 'beet': (150, 40, 80), 'gourd': (200, 110, 40), 'turnip': (176, 120, 200), 'mustard': (206, 186, 52)}
def seed_packet(icon, c):
    """a 20x22 paper seed packet with the crop pictured full size on the front, in the crop's own colour"""
    dk = tuple(int(v * .62) for v in c); lt = tuple(min(255, int(v * 1.18 + 20)) for v in c)
    im = Image.new('RGBA', (20, 22)); d = ImageDraw.Draw(im); ink = (58, 34, 20, 255)
    d.rectangle([1, 1, 18, 21], fill=ink); d.rectangle([2, 2, 17, 20], fill=(246, 238, 214, 255)); d.rectangle([16, 5, 17, 17], fill=(226, 212, 178, 255))
    d.rectangle([2, 1, 17, 4], fill=c + (255,)); d.line([(2, 1), (17, 1)], fill=lt + (255,)); d.line([(2, 4), (17, 4)], fill=dk + (255,))
    d.rectangle([2, 18, 17, 20], fill=c + (255,)); d.line([(2, 18), (17, 18)], fill=lt + (255,))
    ic = icon.crop(icon.getbbox())
    if ic.width > 15 or ic.height > 13: ic.thumbnail((15, 13), Image.NEAREST)
    im.alpha_composite(ic, (10 - (ic.width + 1) // 2, 5 + (13 - ic.height) // 2)); return im
for mine, (pk, tn) in CROPART.items():
    fr = [Image.open(CR + f'{pk}_{s:02d}.png').convert('RGBA') for s in range(6)]
    if tn: fr = [tint(fr[0], *tn)] + [tint(f, *tn) if s >= 2 else f for s, f in enumerate(fr[1:], 1)]
    E['seed_' + mine] = seed_packet(fr[5], PACKET[mine]); E['item_' + mine] = fr[5]; E['crop_' + mine] = fr[1:5]
E['soil_dry'] = Image.open(CR + 'soil_00.png').convert('RGBA'); E['soil_wet'] = Image.open(CR + 'soil_01.png').convert('RGBA')

# ---------- Bethlehem buildings (drawn for this game, see buildings.py) ----------
from buildings import build_all
from room_buildings import pack_buildings
E.update({k: v for k, v in build_all().items() if k.startswith('stall_') or k == 'torch'})
E.update(pack_buildings())
E['well_pack'] = trim(gm('spr_deco_well_covered'))
E['anvil'] = trim(gm('spr_deco_anvil'))

# ---------- item icons ----------
for k, n in [('axe', 'axe'), ('pick', 'pickaxe'), ('hoe', 'shovel'), ('can', 'water'), ('scythe', 'sword'), ('rod', 'rod'),
             ('wood', 'wood'), ('stone', 'rock'), ('seeds', 'seeds_generic'), ('basket', 'basket')]:
    try:
        im = gm(n)
        if im.width > 16: im = im.crop((0, 0, 16, im.height))
        E['ic_'+k] = trim(im)
    except Exception as e: print('icon skip', k, e)
E['ic_fiber'] = trim(tile(27, 1))
E['ic_sap'] = None
E['coin'] = trim(gm('spr_deco_coin')) if glob.glob(GM+'spr_deco_coin/*.png') else None

# ---------- fishing: boat, ducks, rod and fish ----------
EL = A + 'Elements/'
E['coracle'] = trimset(strip(EL + 'Other/spr_deco_coracle_strip4.png', 4))
E['duck'] = trimset(strip(EL + 'Animals/spr_deco_duck_01_strip4.png', 4))
E['ic_rod'] = trim(Image.open(A + 'UI/rod.png').convert('RGBA'))
def fish_icon(body, belly, back, fin, pattern=None, size=(14, 7), tail=4):
    """a little side-on pixel fish, 16 x 12, facing left, with an ink outline"""
    W, H = 20, 13; im = Image.new('RGBA', (W, H)); P = im.load(); bw, bh = size; x0, y0 = 1, (H - bh) // 2
    ink = (40, 28, 30, 255); inside = set()
    for y in range(bh):
        for x in range(bw):
            nx, ny = (x + .5 - bw / 2) / (bw / 2), (y + .5 - bh / 2) / (bh / 2)
            if nx * nx + ny * ny * (1 + .35 * max(0, nx)) <= 1: inside.add((x0 + x, y0 + y))
    cy = y0 + bh // 2
    for k in range(tail):                                         # tail fan
        for y in range(cy - 1 - k, cy + 1 + k): inside.add((x0 + bw - 1 + k, y))
    for k in range(3): inside.add((x0 + bw // 2 - 1 + k, y0 - 1))      # dorsal fin
    for (x, y) in inside:
        rel = (y - y0) / max(1, bh - 1)
        c = back if rel < .3 else belly if rel > .7 else body
        if x >= x0 + bw - 1 or y == y0 - 1: c = fin
        P[x, y] = c + (255,)
    if pattern == 'stripes':
        for x in range(x0 + 4, x0 + bw - 2, 3):
            for y in range(y0, y0 + bh):
                if (x, y) in inside: P[x, y] = back + (255,)
    if pattern == 'spots':
        for (x, y) in [(x0 + 5, y0 + 2), (x0 + 8, y0 + 1), (x0 + 10, y0 + 3), (x0 + 7, y0 + 4)]:
            if (x, y) in inside: P[x, y] = back + (255,)
    if pattern == 'whiskers': P[x0, cy + 1] = ink; P[x0 - 1 if x0 else 0, cy + 2] = ink
    out = Image.new('RGBA', (W, H))
    for (x, y) in inside:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if q not in inside and 0 <= q[0] < W and 0 <= q[1] < H: out.putpixel(q, ink)
    out.alpha_composite(im); o = out.load()
    o[x0 + 2, cy - 1] = (255, 255, 255, 255); o[x0 + 2, cy] = ink        # eye
    return out
FISH_ART = {
    'sardine': ((150, 180, 200), (225, 235, 240), (70, 110, 150), (110, 140, 170), None, (11, 5), 3),
    'carp': ((190, 150, 70), (235, 210, 140), (120, 90, 40), (200, 120, 60), None, (13, 7), 4),
    'tilapia': ((140, 150, 130), (210, 210, 190), (80, 90, 80), (170, 90, 80), 'stripes', (12, 8), 4),
    'perch': ((150, 170, 70), (230, 220, 150), (70, 90, 40), (220, 110, 50), 'stripes', (12, 7), 4),
    'barbel': ((170, 140, 100), (230, 210, 170), (110, 85, 55), (190, 130, 90), 'spots', (13, 6), 4),
    'catfish': ((100, 95, 90), (170, 160, 150), (55, 52, 50), (80, 75, 70), 'whiskers', (13, 7), 3),
    'mullet': ((160, 170, 180), (230, 232, 236), (90, 100, 115), (130, 140, 150), 'stripes', (13, 6), 4),
    'bream': ((210, 170, 90), (245, 230, 190), (160, 110, 60), (230, 150, 60), None, (11, 9), 4),
    'bigfish': ((70, 110, 170), (190, 210, 230), (40, 60, 110), (240, 190, 70), 'spots', (14, 9), 2),
}
FISH_ART.update({
    'garra': ((120, 130, 110), (200, 205, 180), (70, 80, 65), (110, 120, 100), 'spots', (9, 4), 3),
    'tuna': ((60, 90, 140), (215, 225, 235), (30, 45, 85), (230, 200, 70), None, (14, 8), 3),
    'snapper': ((220, 80, 70), (250, 190, 170), (160, 40, 40), (230, 110, 90), None, (12, 8), 4),
    'grouper': ((140, 110, 80), (210, 190, 150), (90, 65, 45), (120, 95, 70), 'spots', (14, 9), 3),
})
for k, a in FISH_ART.items(): E["fish_" + k] = trim(fish_icon(*a))
sd = Image.new('RGBA', (14, 12)); d = ImageDraw.Draw(sd)            # an old sandal
d.rounded_rectangle([1, 3, 12, 9], 3, fill=(58, 34, 20, 255)); d.rounded_rectangle([2, 4, 11, 8], 2, fill=(160, 110, 60, 255)); d.line([(4, 3), (6, 8)], fill=(90, 55, 30, 255)); d.line([(8, 3), (6, 8)], fill=(90, 55, 30, 255))
E['fish_sandal'] = sd
def eel():
    im = Image.new('RGBA', (20, 9)); P = im.load(); ink = (36, 30, 30, 255)
    pts = [(x, 4 + round(1.6 * __import__('math').sin(x / 2.6))) for x in range(1, 19)]
    for x, y in pts:
        for dy in (-1, 0, 1): P[x, y + dy] = ink
    for x, y in pts[1:-1]: P[x, y] = (90, 100, 70, 255); P[x, y - 1 if x % 3 else y] = (60, 70, 45, 255)
    P[2, pts[1][1]] = (255, 255, 255, 255); return trim(im)
def swordfish():
    im = fish_icon((70, 100, 160), (210, 220, 235), (40, 60, 110), (60, 80, 130), None, (12, 7), 4); out = Image.new('RGBA', (im.width + 6, im.height)); out.alpha_composite(im, (6, 0))
    cy = [y for y in range(im.height) if im.getpixel((7, y))[3]]; cy = (cy[0] + cy[-1]) // 2 if cy else 6
    for x in range(0, 8): out.putpixel((x, cy - 1), (36, 30, 30, 255)); out.putpixel((x, cy), (150, 160, 180, 255)); out.putpixel((x, cy + 1), (36, 30, 30, 255))
    return trim(out)
def crab():
    im = Image.new('RGBA', (16, 12)); d = ImageDraw.Draw(im); ink = (40, 26, 26, 255); b = (60, 120, 200, 255); hi = (120, 170, 230, 255)
    for x in (2, 4, 11, 13): d.line([(x, 7), (x - (1 if x < 8 else -1), 10)], fill=ink)
    d.ellipse([3, 4, 12, 10], fill=ink); d.ellipse([4, 5, 11, 9], fill=b); d.line([(5, 6), (9, 6)], fill=hi)
    for cx in (1, 13): d.ellipse([cx - 1, 1, cx + 2, 4], fill=ink); d.point((cx, 2), fill=b); d.point((cx + 1, 2), fill=b)
    d.line([(3, 4), (2, 3)], fill=ink); d.line([(12, 4), (13, 3)], fill=ink); d.point((6, 4), fill=ink); d.point((9, 4), fill=ink)
    return trim(im)
E['fish_eel'] = eel(); E['fish_swordfish'] = swordfish(); E['fish_crab'] = crab()
E['fish_mackerel'] = trim(fish_icon((80, 140, 120), (220, 230, 225), (30, 70, 70), (70, 110, 100), 'stripes', (13, 6), 4))
E['fish_seabass'] = trim(fish_icon((120, 130, 140), (225, 228, 232), (60, 70, 85), (100, 110, 125), None, (13, 7), 4))
E['fish_flounder'] = trim(fish_icon((170, 140, 100), (200, 175, 135), (120, 95, 65), (150, 120, 85), 'spots', (12, 10), 3))
def squid():
    im = Image.new('RGBA', (18, 12)); d = ImageDraw.Draw(im); ink = (40, 26, 30, 255); b = (230, 150, 160, 255); hi = (250, 200, 205, 255)
    d.polygon([(1, 6), (6, 2), (11, 3), (11, 9), (6, 10)], fill=ink); d.polygon([(2, 6), (6, 3), (10, 4), (10, 8), (6, 9)], fill=b); d.line([(4, 5), (8, 4)], fill=hi)
    for k, y in enumerate((3, 5, 7, 9)): d.line([(11, y), (16, y + (k - 1.5))], fill=ink); d.line([(12, y), (15, y + (k - 1.5) * .8)], fill=b)
    d.point((8, 5), fill=(255, 255, 255, 255)); d.point((8, 7), fill=ink); return trim(im)
E['fish_squid'] = squid()
def shell():
    im = Image.new('RGBA', (12, 11)); d = ImageDraw.Draw(im); ink = (70, 40, 40, 255)
    d.pieslice([0, 1, 11, 16], 180, 360, fill=ink); d.pieslice([1, 2, 10, 15], 180, 360, fill=(245, 205, 190, 255))
    for x in (3, 5, 7): d.line([(5.5, 8), (x - 1 if x < 5 else x + 1, 3)], fill=(220, 150, 140, 255))
    d.rectangle([3, 8, 8, 10], fill=ink); d.rectangle([4, 8, 7, 9], fill=(235, 180, 165, 255)); return trim(im)
E['ic_shell'] = shell()
E['coracle_land'] = trim(Image.open(EL + 'Other/spr_deco_coracle_land.png').convert('RGBA'))

# ---------- character layers ----------
TAG = {}
for t in ASE['tags']: TAG[t[0]] = t
def fr(f, names): return render(ASE, f, only=lambda L: L['name'] in names)
HAIRS = ['short hair', 'long hair', 'curly hair', 'bowl hair', 'mop hair', 'spikey hair']
ANIMS = [('idle_s', 'idle-s'), ('idle_n', 'idle-n'), ('idle', 'idle'), ('walk_s', 'walk-s'), ('walk_n', 'walk-n'), ('walk', 'walk'),
         ('axe', 'axe'), ('mining', 'mining'), ('attack', 'attack'), ('doing', 'doing'), ('watering', 'watering'), ('dig', 'dig'),
         ('casting', 'casting'), ('waiting', 'waiting'), ('reeling', 'reeling'), ('caught', 'caught')]
CH = {}; SIDE_TIP = {}
for key, tag in ANIMS:
    t = TAG[tag]; frames = list(range(t[1], t[2]+1))
    layers = {'body': [], 'toolr': [], 'tool': []}
    for h in HAIRS: layers['hair_'+h.split()[0]] = []
    for f in frames:
        layers['body'].append(fr(f, ('base',)))
        layers['toolr'].append(fr(f, ('tools rear',)))
        tl = fr(f, ('tools',))
        if key in ('waiting', 'reeling'):   # take the pack's fishing line off (the game draws it from the rod tip to the bobber) and note where the tip is
            px = tl.load(); whites = [(x, y) for y in range(tl.height) for x in range(tl.width) if px[x, y][3] and px[x, y][:3] == (255, 255, 255)]
            for q in whites: px[q] = (0, 0, 0, 0)
            tx, ty = min(whites, key=lambda q: (q[1], q[0])) if whites else (0, 0)
            SIDE_TIP.setdefault(key, []).append([tx + .5, ty])
        layers['tool'].append(tl)
        for h in HAIRS:
            if tag in ('walk-s', 'walk-n') and h != 'bowl hair':
                src = TAG['idle-s' if tag == 'walk-s' else 'idle-n'][1]
                b0 = fr(src, ('bowl hair',)).getbbox(); b1 = fr(f, ('bowl hair',)).getbbox()
                hi = fr(src, (h,)); dx, dy = (b1[0]-b0[0], b1[1]-b0[1]) if b0 and b1 else (0, 0)
                sh = Image.new('RGBA', hi.size); sh.paste(hi, (dx, dy)); layers['hair_'+h.split()[0]].append(sh)
            else:
                layers['hair_'+h.split()[0]].append(fr(f, (h,)))
    # one crop box for every layer of this animation, so they line up
    bb = None
    for L in layers.values():
        for im in L:
            b = im.getbbox()
            if b: bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    for name, L in layers.items():
        if not any(im.getbbox() for im in L): continue
        E[f'ch_{name}_{key}'] = [im.crop(bb) for im in L]
    # feet position: bottom of the body in idle-s frame 0, relative to crop
    CH[key] = {'ox': bb[0], 'oy': bb[1]}
# front- and back-facing tool swings (the pack only has side ones): see ns_anims.py
import ns_anims
NS_COUNTS = {}
NS = ns_anims.build(ASE, fr, TAG); RODTIP = NS.pop('_rodtip')
for key, (layers, n) in NS.items():
    bb = None
    for L in layers.values():
        for im in L:
            b = im.getbbox()
            if b: bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    for name, L in layers.items():
        if not any(im.getbbox() for im in L): continue
        E[f'ch_{name}_{key}'] = [im.crop(bb) for im in L]
    CH[key] = {'ox': bb[0], 'oy': bb[1]}; NS_COUNTS[key] = n
fb = fr(TAG['idle-s'][1], ('base',)).getbbox()
META['char'] = {'feetX': (fb[0]+fb[2])/2, 'feetY': fb[3], 'anims': CH, 'hairs': [h.split()[0] for h in HAIRS],
                'counts': dict({k: TAG[t][2]-TAG[t][1]+1 for k, t in ANIMS}, **NS_COUNTS),
                'rodtip': {d: [x - (fb[0]+fb[2])/2, y - fb[3]] for d, (x, y) in RODTIP.items()},
                'sidetip': {k: [[x - (fb[0]+fb[2])/2, y - fb[3]] for x, y in v] for k, v in SIDE_TIP.items()}}

# ---------- pack ----------
items = []
for k, v in E.items():
    if v is None: continue
    if isinstance(v, list):
        w = max(i.width for i in v); h = max(i.height for i in v)
        st = Image.new('RGBA', (w*len(v), h))
        for n, i in enumerate(v): st.paste(i, (n*w + (w-i.width)//2, h-i.height))
        items.append((k, st, w, len(v)))
    else: items.append((k, v, v.width, 1))
AW = 2048
rects = []
for k, st, fw, n in items:
    per = max(1, AW // fw)
    for r in range(0, n, per):
        cnt = min(per, n-r); rects.append((k, st.crop((r*fw, 0, (r+cnt)*fw, st.height)), fw, r, cnt))
rects.sort(key=lambda r: -r[1].height)
x = y = rowh = 0; place = []
for k, im, fw, r0, cnt in rects:
    if x + im.width > AW: x = 0; y += rowh + 1; rowh = 0
    place.append((k, im, fw, r0, cnt, x, y)); x += im.width + 1; rowh = max(rowh, im.height)
atlas = Image.new('RGBA', (AW, y+rowh+1))
frames = {}
for k, im, fw, r0, cnt, x, y in sorted(place, key=lambda p: (p[0], p[3])):
    atlas.paste(im, (x, y)); frames.setdefault(k, []).append([x, y, fw, im.height, cnt])
os.makedirs(OUT, exist_ok=True)
atlas.save(os.path.join(OUT, 'atlas.png'), optimize=True)
json.dump({'frames': frames, 'meta': META}, open(os.path.join(OUT, 'atlas.json'), 'w'), separators=(',', ':'))
print('atlas', atlas.size, os.path.getsize(os.path.join(OUT, 'atlas.png')), 'entries', len(frames))
