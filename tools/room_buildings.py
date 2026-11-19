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
    base = np.array(im)[..., 3] > 0; a[~base] = 0          # decorations only where they sit on the building itself
    im.alpha_composite(Image.fromarray(a, 'RGBA'))
    c = im.crop(box); bb = c.getbbox(); return c.crop(bb) if bb else c

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
    fh = A['bld_farmhouse']; H = fh.shape[0]
    DOOR = fh[H - 12:H, 8:24].copy()                       # the plain plank door (bottom 12 rows of its tile)
    door = lambda k, x: stamp(A[k], DOOR, x, A[k].shape[0])
    door('bld_houseA', 24); door('bld_houseE', 24); door('bld_houseB', 24)
    erase(A['bld_houseA'], 58, 44, 64, 54); erase(A['bld_houseE'], 44, 44, 48, 54); lightfix(A['bld_houseA'], 54, 44, 64, 54); lightfix(A['bld_houseE'], 40, 44, 48, 54)
    c = A['bld_houseC']; wallfill(c, 22, 64, 42, 80, 20); door('bld_houseC', 24); erase(c, 36, 54, 56, 68, True)
    for k in ('bld_houseA', 'bld_houseE'):
        a = A[k]; a[:, :][(a[..., 1].astype(int) > a[..., 0].astype(int) + 25) & (np.arange(a.shape[0])[:, None] > a.shape[0] - 12)] = 0
    erase(A['bld_houseD'], 40, 30, 48, 50, True)
    cp = A['bld_carpenter']; wallfill(cp, 9, 49, 38, 63, 40); door('bld_carpenter', 18)
    sm = A['bld_smithy']; wallfill(sm, 9, 42, 54, 52, 24); wallfill(sm, 9, 42, 54, 52, 40)
    sy = A['bld_synagogue']; Hs = sy.shape[0]; erase(sy, 0, 0, 10, 12)
    lightfix(sy, 4, Hs - 7, 30, Hs, 23); lightfix(sy, 66, Hs - 7, 94, Hs, 71); door('bld_synagogue', 40)
    for k in ('bld_houseA', 'bld_houseE'):            # crate corners poking out past the right-hand wall
        a = A[k]; Hh = a.shape[0]; right = np.nonzero(a[Hh - 1, :, 3])[0].max(); a[Hh - 10:, right + 1:] = 0
    for k in ('bld_houseD',):            # green specks from plants growing against the wall
        a = A[k]; gm = (a[..., 1].astype(int) > a[..., 0].astype(int) + 15) & (a[..., 1].astype(int) > a[..., 2].astype(int) + 15)
        cols = np.zeros_like(gm); cols[-30:, -6:] = 1; cols[-30:, :6] = 1; cols[:, :] &= (k == 'bld_houseD') | (np.arange(a.shape[0])[:, None] > a.shape[0] - 30); a[gm & (cols > 0)] = 0
    for x0, x1, rx in ((4, 30, 23), (66, 94, 71)):    # planter outlines in front of the synagogue
        for y in range(Hs - 6, Hs - 1):
            for x in range(x0, x1):
                if sy[y, x, 3] and sy[y, x, 0] < 160 and sy[y, x, 0] > 60: sy[y, x] = sy[y, rx]
    out = {k: Image.fromarray(v, 'RGBA') for k, v in A.items()}
    out['bld_houseF'] = out['bld_houseE'].transpose(Image.FLIP_LEFT_RIGHT)   # the old F had no door: use a mirrored E
    return {k: (v.crop(v.getbbox()) if v.getbbox() else v) for k, v in out.items()}
def pack_buildings():
    L, b, comps = components(); comps = sorted([c for c in comps if (c[2] - c[0]) * (c[3] - c[1]) > 600])
    return fix({k: cut(L, comps[i]) for k, i in PICK.items()})
if __name__ == '__main__':
    L, b, comps = components()
    comps = [c for c in comps if (c[2] - c[0]) * (c[3] - c[1]) > 600]
    for k, c in enumerate(sorted(comps)): print(k, c, c[2] - c[0], c[3] - c[1])
