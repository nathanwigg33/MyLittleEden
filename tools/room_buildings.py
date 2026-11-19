"""Cut finished buildings out of the art pack's own example room (GameMaker tile data),
so the town uses houses exactly as the artist assembled them."""
import json, re, glob, os
import numpy as np
from PIL import Image
from scipy import ndimage
GM = '/home/claude/assets/sunny/Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_Gamemaker/'
def lj(p):
    t = open(p).read(); t = re.sub(r',(\s*[}\]])', r'\1', t); return json.loads(t)
def decode(tl):
    if 'TileCompressedData' in tl:
        a = tl['TileCompressedData']; out = []; i = 0
        while i < len(a):
            n = a[i]
            if n < 0: out += [a[i + 1]] * (-n); i += 2
            else: out += a[i + 1:i + 1 + n]; i += 1 + n
        return out
    return tl['TileSerialiseData']
TS = Image.open(glob.glob(GM + 'sprites/spr_tileset_sunnysideworld/*.png')[0]).convert('RGBA')
def render(layer):
    tl = layer['tiles']; w, h = tl['SerialiseWidth'], tl['SerialiseHeight']; data = decode(tl); cols = TS.width // 16
    out = Image.new('RGBA', (w * 16, h * 16))
    for k, v in enumerate(data):
        if v <= 0: continue
        i = v & 0x7FFFF
        if not i: continue
        t = TS.crop(((i % cols) * 16, (i // cols) * 16, (i % cols) * 16 + 16, (i // cols) * 16 + 16))
        if v & (1 << 28): t = t.transpose(Image.FLIP_LEFT_RIGHT)
        if v & (1 << 29): t = t.transpose(Image.FLIP_TOP_BOTTOM)
        out.alpha_composite(t, ((k % w) * 16, (k // w) * 16))
    return out
def room_layers():
    d = lj(GM + 'rooms/Room1/Room1.yy'); L = {l['name']: l for l in d['layers'] if l.get('resourceType') == 'GMRTileLayer' and l.get('tilesetId') and l['tilesetId']['name'] == 'tileset_sunnysideworld'}
    return {n: render(l) for n, l in L.items()}
def components():
    L = room_layers(); b = Image.new('RGBA', L['building'].size); b.alpha_composite(L['building']); b.alpha_composite(L['walls'])
    a = np.array(b)[..., 3] > 0; lab, n = ndimage.label(a, structure=np.ones((3, 3)))
    out = []
    for sl in ndimage.find_objects(lab):
        ys, xs = sl; out.append((xs.start, ys.start, xs.stop, ys.stop))
    return L, b, out
# decoration tiles that are part of a building (chimneys, pillars, trim, doors); everything else near a house is a prop
KEEP = {348, 349, 769, 797, 798, 799, 840, 861, 862, 863, 988, 1120, 1121, 1122, 1248, 1249, 1250, 1312, 1313, 1314, 1376, 1377, 1378,
        1359, 1423, 1764, 1767, 1809, 2036, 2653, 2654, 2655, 2717, 2718, 2719, 2833, 2897, 2909, 2910, 2911}
SWAP = {1767: 1764}            # the synagogue's blue door -> the same plank door as everywhere else
def deco_layer(box):
    d = lj(GM + 'rooms/Room1/Room1.yy'); l = [l for l in d['layers'] if l['name'] == 'decoration_02'][0]['tiles']
    w, data = l['SerialiseWidth'], decode(l); cols = TS.width // 16; x0, y0, x1, y1 = box
    out = Image.new('RGBA', (w * 16, l['SerialiseHeight'] * 16))
    for ty in range((y0 - 20) // 16, (y1 + 15) // 16):
        for tx in range(x0 // 16, (x1 + 15) // 16):
            v = data[ty * w + tx]
            if v <= 0: continue
            i = v & 0x7FFFF
            if i not in KEEP: continue
            i = SWAP.get(i, i); t = TS.crop(((i % cols) * 16, (i // cols) * 16, (i % cols) * 16 + 16, (i // cols) * 16 + 16))
            if v & (1 << 28): t = t.transpose(Image.FLIP_LEFT_RIGHT)
            out.alpha_composite(t, (tx * 16, ty * 16))
    return out
def cut(L, box):
    """building + walls + the decoration tiles that belong to the building (chimneys may sit just above the roof)."""
    im = Image.new('RGBA', L['building'].size)
    for n in ('building', 'walls'): im.alpha_composite(L[n])
    a = np.array(im); x0, y0, x1, y1 = box
    g = a[y1 - 16:y1, x0:x1]                                   # grass tiles baked into the bottom row
    m = (g[..., 1].astype(int) > g[..., 0].astype(int) + 20) & (g[..., 1].astype(int) > g[..., 2].astype(int)); g[m] = 0
    im = Image.fromarray(a, 'RGBA'); im.alpha_composite(deco_layer(box))
    c = im.crop((x0, y0 - 20, x1, y1)); bb = c.getbbox(); return c.crop(bb) if bb else c

PICK = {'bld_synagogue': 12, 'bld_inn': 3, 'bld_carpenter': 24, 'bld_smithy': 11, 'bld_houseA': 20, 'bld_houseB': 22, 'bld_houseC': 14,
        'bld_houseD': 5, 'bld_houseE': 10, 'bld_houseF': 29, 'bld_farmhouse': 19, 'bld_barn': 23, 'bld_coop': 6}
# ---- tidy-ups so every building shares the same wooden door and glass windows ----
def wallfill(a, x0, y0, x1, y1, refx):
    "repaint a patch of plank wall using the colour of each row at a clean column"
    for y in range(y0, y1):
        for x in range(x0, x1):
            if a[y, x, 3]: a[y, x] = a[y, refx]
def stamp(a, tile, x, ybottom):
    h, w = tile.shape[:2]; a[ybottom - h:ybottom, x:x + w] = tile
def erase(a, x0, y0, x1, y1, green_only=False):
    p = a[y0:y1, x0:x1]
    if green_only: m = (p[..., 1].astype(int) > p[..., 0].astype(int) + 25) & (p[..., 1].astype(int) > p[..., 2].astype(int)); p[m] = 0
    else: p[:] = 0
def lightfix(a, x0, y0, x1, y1, refx=None):
    "remove light-tan crate/planter pixels: erase them, or repaint them as wall"
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b, al = a[y, x]
            if al and r > 215 and g > 150:
                a[y, x] = a[y, refx] if refx is not None else 0
def fix(out):
    A = {k: np.array(v) for k, v in out.items()}
    cols = TS.width // 16; DOOR = TS.crop(((1764 % cols) * 16, (1764 // cols) * 16, (1764 % cols) * 16 + 16, (1764 // cols) * 16 + 16))
    out = {k: Image.fromarray(v, 'RGBA') for k, v in A.items()}
    for k, x in (('bld_houseA', 24), ('bld_houseE', 24), ('bld_houseB', 24), ('bld_houseC', 24), ('bld_smithy', 8), ('bld_carpenter', 24)):
        a = np.array(out[k]); H = a.shape[0]
        if k in ('bld_carpenter', 'bld_houseC'):          # clear the old window/door marks behind the new door first
            ref = next(c for c in range(x - 1, 0, -1) if (a[H - 15:H - 1, c, :3].sum(1) > 200).all())
            wallfill(a, x - 1, H - 15, x + 17, H - 1, ref)
        out[k] = Image.fromarray(a, 'RGBA'); out[k].alpha_composite(DOOR, (x, H - 16))    # the art pack's own plank door, in the same spot as on the farmhouse
    out['bld_houseF'] = out['bld_houseE'].transpose(Image.FLIP_LEFT_RIGHT)   # the pack's own F is a stilt house: use a mirrored E
    return {k: (v.crop(v.getbbox()) if v.getbbox() else v) for k, v in out.items()}
def pack_buildings():
    L, b, comps = components(); comps = sorted([c for c in comps if (c[2] - c[0]) * (c[3] - c[1]) > 600])
    return fix({k: cut(L, comps[i]) for k, i in PICK.items()})
if __name__ == '__main__':
    L, b, comps = components()
    comps = [c for c in comps if (c[2] - c[0]) * (c[3] - c[1]) > 600]
    for k, c in enumerate(sorted(comps)): print(k, c, c[2] - c[0], c[3] - c[1])
