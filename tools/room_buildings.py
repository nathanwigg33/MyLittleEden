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
def cut(L, box):
    """building + walls, plus decoration tiles (doors, chimneys, dormers) inside the box.
    Plants standing on the ground in the bottom row are left out."""
    im = Image.new('RGBA', L['building'].size)
    for n in ('building', 'walls'): im.alpha_composite(L[n])
    deco = L['decoration_02'].copy(); x0, y0, x1, y1 = box
    a = np.array(deco)
    for ty in range(y0 // 16, (y1 + 15) // 16):
        for tx in range(x0 // 16, (x1 + 15) // 16):
            t = a[ty * 16:(ty + 1) * 16, tx * 16:(tx + 1) * 16]
            px = t[t[..., 3] > 0]
            if not len(px): continue
            green = ((px[:, 1].astype(int) > px[:, 0].astype(int) + 25) & (px[:, 1].astype(int) > px[:, 2].astype(int))).mean()
            yellow = ((px[:, 0] > 200) & (px[:, 1] > 170) & (px[:, 2] < 90)).mean()
            if ty * 16 + 16 >= y1 - 2 and (green > .25 or yellow > .15): a[ty * 16:(ty + 1) * 16, tx * 16:(tx + 1) * 16] = 0
    im.alpha_composite(Image.fromarray(a, 'RGBA'))
    c = im.crop(box); bb = c.getbbox(); return c.crop(bb) if bb else c

PICK = {'bld_synagogue': 12, 'bld_inn': 3, 'bld_carpenter': 24, 'bld_smithy': 11, 'bld_houseA': 20, 'bld_houseB': 22, 'bld_houseC': 14,
        'bld_houseD': 5, 'bld_houseE': 10, 'bld_houseF': 29, 'bld_farmhouse': 19, 'bld_barn': 23, 'bld_coop': 6}
def pack_buildings():
    L, b, comps = components(); comps = sorted([c for c in comps if (c[2] - c[0]) * (c[3] - c[1]) > 600])
    return {k: cut(L, comps[i]) for k, i in PICK.items()}
if __name__ == '__main__':
    L, b, comps = components()
    comps = [c for c in comps if (c[2] - c[0]) * (c[3] - c[1]) > 600]
    for k, c in enumerate(sorted(comps)): print(k, c, c[2] - c[0], c[3] - c[1])
