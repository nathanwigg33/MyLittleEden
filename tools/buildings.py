"""Pixel-art buildings for Bethlehem, drawn to match the Sunnyside World style:
flat-roofed limestone houses, a church with a bell tower, a blacksmith's forge, an inn and market stalls."""
import random
from PIL import Image

OL = (44, 30, 36, 255)
L1, L2, L3, L4 = (242, 229, 196, 255), (226, 207, 166, 255), (201, 177, 136, 255), (164, 136, 98, 255)
MOR = (206, 184, 144, 255)
R1, R2, R3 = (216, 196, 156, 255), (196, 174, 132, 255), (176, 152, 112, 255)
D1, D2, D3 = (146, 92, 54, 255), (110, 66, 40, 255), (178, 122, 74, 255)
DARK = (54, 36, 42, 255)


class Canvas:
    def __init__(s, w, h, seed=1):
        s.im = Image.new('RGBA', (w, h)); s.w, s.h = w, h; s.r = random.Random(seed)
    def px(s, x, y, c):
        if 0 <= x < s.w and 0 <= y < s.h: s.im.putpixel((int(x), int(y)), c)
    def rect(s, x, y, w, h, c):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)): s.px(xx, yy, c)
    def get(s, x, y): return s.im.getpixel((x, y)) if 0 <= x < s.w and 0 <= y < s.h else (0, 0, 0, 0)
    def outline(s):
        a = s.im.copy(); W, H = s.w, s.h
        for y in range(H):
            for x in range(W):
                if a.getpixel((x, y))[3]: continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < W and 0 <= yy < H and a.getpixel((xx, yy))[3] > 200: s.im.putpixel((x, y), OL); break


def stone_wall(c, x0, y0, w, h, base=L2):
    """limestone blocks in staggered rows"""
    c.rect(x0, y0, w, h, base)
    row = 0
    for y in range(y0, y0 + h, 5):
        x = x0 - (row % 2) * 4; row += 1
        while x < x0 + w:
            bw = c.r.choice([7, 8, 9, 10]); tone = c.r.random()
            fill = L1 if tone < .18 else (L3 if tone > .86 else base)
            c.rect(max(x0, x + 1), y + 1, min(bw - 1, x0 + w - max(x0, x + 1)), 3, fill)
            c.rect(max(x0, x), y + 4, min(bw, x0 + w - max(x0, x)), 1, MOR)
            if x >= x0: c.rect(x, y, 1, 4, MOR)
            x += bw
    c.rect(x0, y0 + h - 2, w, 2, L4)                       # footing


def flat_roof(c, x0, y0, w, h):
    c.rect(x0, y0, w, h, R1)
    for k in range(w * h // 9):
        c.px(x0 + c.r.randrange(w), y0 + 2 + c.r.randrange(max(1, h - 4)), R2)
    c.rect(x0, y0, w, 2, L1)                                # parapet top
    c.rect(x0, y0 + h - 3, w, 1, L1); c.rect(x0, y0 + h - 2, w, 2, R3)   # front lip
    c.rect(x0, y0, 3, h, L1); c.rect(x0 + w - 3, y0, 3, h, L3)          # parapet ends


def door(c, cx, by, w=10, h=15, col=D1):
    x0 = cx - w // 2
    c.rect(x0 - 2, by - h - 2, w + 4, h + 2, L4)            # stone frame
    c.rect(x0, by - h, w, h, col)
    for k in range(2, w, 3): c.rect(x0 + k, by - h + 2, 1, h - 2, D2)
    for k in range(w // 2):                                  # round arch
        cut = round((w / 2) - ((w / 2) ** 2 - (k - w / 2 + .5) ** 2) ** .5) if k < w / 2 else 0
        for j in range(cut): c.px(x0 + k, by - h + j, L4); c.px(x0 + w - 1 - k, by - h + j, L4)
    c.px(x0 + w - 3, by - h // 2, (240, 200, 90, 255))
    c.rect(x0 - 3, by, w + 6, 1, L3)


def window(c, cx, y, w=6, h=7, box=None):
    x0 = cx - w // 2
    c.rect(x0 - 1, y - 1, w + 2, h + 2, L4); c.rect(x0, y, w, h, DARK)
    c.px(x0, y, L4); c.px(x0 + w - 1, y, L4)
    c.rect(x0 + 1, y + 1, 1, 2, (90, 70, 80, 255))
    c.rect(x0 - 2, y + h + 1, w + 4, 1, D3)                  # sill
    if box:
        c.rect(x0 - 1, y + h + 2, w + 2, 2, D2)
        for k in range(w + 2): c.px(x0 - 1 + k, y + h + 1, box if k % 2 else (90, 160, 70, 255))


def awning(c, cx, y, w, col):
    x0 = cx - w // 2; light = (244, 232, 204, 255)
    for k in range(w):
        cc = col if (k // 3) % 2 == 0 else light
        c.rect(x0 + k, y, 1, 5, cc)
        if k % 3 == 1: c.px(x0 + k, y + 5, cc)
    c.rect(x0, y, w, 1, tuple(max(0, v - 50) if i < 3 else 255 for i, v in enumerate(col)))
    c.rect(x0, y + 4, w, 1, (0, 0, 0, 60))
    c.rect(x0 + 1, y + 5, 1, 9, D2); c.rect(x0 + w - 2, y + 5, 1, 9, D2)


def pots(c, x, y, n=2):
    for k in range(n):
        xx = x + k * 6; c.rect(xx, y - 5, 5, 5, (186, 104, 64, 255)); c.rect(xx + 1, y - 6, 3, 1, (150, 80, 50, 255)); c.rect(xx + 1, y - 4, 1, 3, (214, 140, 96, 255))


def house(tw, wall_h=30, roof_h=12, door_at=.5, wins=(.22, .78), awn=None, roof_props=True, box=None, seed=1, stairs=False):
    W = tw * 16; H = wall_h + roof_h + 8; c = Canvas(W + 2, H + 1, seed)
    flat_roof(c, 1, 7, W, roof_h)
    stone_wall(c, 1, 7 + roof_h, W, wall_h)
    if roof_props: pots(c, 6, 7 + 3, 2); c.rect(W - 14, 6, 8, 5, (214, 192, 140, 255)); c.rect(W - 13, 5, 6, 1, (190, 166, 116, 255))  # pots + sack
    by = H - 1
    for wx in wins: window(c, int(1 + W * wx), 7 + roof_h + 7, box=box)
    door(c, int(1 + W * door_at), by - 1)
    if awn: awning(c, int(1 + W * door_at), 7 + roof_h + 3, 20, awn)
    if stairs:
        for k in range(6): c.rect(W - 4 - k * 2, 7 + roof_h + k * 4, 4, 4, L3); c.rect(W - 4 - k * 2, 7 + roof_h + k * 4, 4, 1, L1)
    c.outline(); return c.im


def church(seed=7):
    W, wall_h, roof_h = 7 * 16, 42, 12
    tower_w = 26; H = wall_h + roof_h + 40; c = Canvas(W + 2, H + 1, seed)
    top = 40
    flat_roof(c, 1, top, W, roof_h)
    stone_wall(c, 1, top + roof_h, W, wall_h, base=L2)
    # bell tower on the left, rising above the roof
    tx = 6
    stone_wall(c, tx, 8, tower_w, top + roof_h - 8 + 6)
    c.rect(tx - 2, 6, tower_w + 4, 4, L1); c.rect(tx - 2, 9, tower_w + 4, 1, L3)
    c.rect(tx + 7, 13, 12, 14, DARK); c.rect(tx + 7, 13, 1, 1, L1); c.rect(tx + 18, 13, 1, 1, L1)      # bell opening
    c.rect(tx + 10, 16, 6, 6, (226, 176, 58, 255)); c.rect(tx + 11, 22, 4, 1, (180, 130, 30, 255)); c.rect(tx + 12, 15, 2, 1, (180, 130, 30, 255))
    cx = tx + tower_w // 2
    c.rect(cx - 1, 0, 2, 7, D2); c.rect(cx - 3, 2, 6, 2, D2)                                         # wooden cross
    # rose window, big doors, tall windows
    mx = 1 + W // 2 + 10
    for y in range(-4, 5):
        for x in range(-4, 5):
            d = (x * x + y * y) ** .5
            if d <= 4.5: c.px(mx + x, top + roof_h + 8 + y, L4 if d > 3.5 else ((96, 140, 210, 255) if (x + y) % 2 else (210, 90, 80, 255)))
    by = H - 1
    door(c, mx - 6, by - 3, w=10, h=20, col=D1); door(c, mx + 6, by - 3, w=10, h=20, col=D1)
    for wx in (mx - 26, mx + 26):
        if wx > tx + tower_w + 4:
            c.rect(wx - 3, top + roof_h + 8, 7, 16, L4); c.rect(wx - 2, top + roof_h + 9, 5, 14, (96, 120, 170, 255)); c.rect(wx - 2, top + roof_h + 9, 1, 14, (140, 170, 214, 255))
    for k in range(3): c.rect(mx - 18 + k * 2, by - 3 + k, 36 - k * 4, 1, L3 if k else L1)        # steps
    c.rect(mx - 19, by - 2, 38, 3, L3); c.rect(mx - 19, by - 2, 38, 1, L1)
    c.outline(); return c.im


def smithy(seed=3):
    W, wall_h, roof_h = 5 * 16, 32, 12; H = wall_h + roof_h + 16; c = Canvas(W + 2, H + 1, seed)
    top = 15
    flat_roof(c, 1, top, W, roof_h)
    stone_wall(c, 1, top + roof_h, W, wall_h, base=(214, 196, 158, 255))
    # chimney with dark stone
    c.rect(W - 16, 2, 10, top + 2, (120, 104, 96, 255)); c.rect(W - 17, 1, 12, 3, (150, 134, 124, 255)); c.rect(W - 15, 4, 2, top - 2, (96, 82, 76, 255))
    # open forge arch with fire glow
    fx, fy, fw, fh = 10, top + roof_h + 6, 26, wall_h - 8
    c.rect(fx - 2, fy - 2, fw + 4, fh + 2, L4); c.rect(fx, fy, fw, fh, (40, 26, 30, 255))
    for k in range(fw):
        for j in range(8):
            t = j / 8; c.px(fx + k, fy + fh - 1 - j, (int(240 - 90 * t), int(120 - 70 * t), int(40 - 20 * t), 255) if (k + j) % 5 else (255, 200, 90, 255))
    c.rect(fx + 3, fy + fh - 12, 8, 4, (90, 80, 84, 255))                                            # coal bed
    door(c, 1 + W - 20, H - 2)
    # hanging sign: hammer
    c.rect(W // 2 + 4, top + roof_h + 2, 14, 1, D2); c.rect(W // 2 + 6, top + roof_h + 3, 10, 8, D3); c.rect(W // 2 + 7, top + roof_h + 4, 8, 6, (230, 200, 140, 255))
    c.rect(W // 2 + 10, top + roof_h + 5, 2, 4, D2); c.rect(W // 2 + 8, top + roof_h + 5, 6, 2, (110, 110, 120, 255))
    c.outline(); return c.im


def inn(seed=5):
    im = house(6, wall_h=38, roof_h=12, door_at=.5, wins=(.17, .34, .66, .83), awn=(90, 140, 70, 255), box=(230, 90, 110, 255), seed=seed, stairs=False)
    c = Canvas(im.width, im.height); c.im = im
    # hanging sign with a cup
    sx = im.width // 2 + 16; sy = 7 + 12 + 14
    c.rect(sx, sy, 12, 1, D2); c.rect(sx + 1, sy + 1, 10, 9, D3); c.rect(sx + 2, sy + 2, 8, 7, (236, 214, 160, 255))
    c.rect(sx + 4, sy + 3, 4, 5, (186, 104, 64, 255)); c.rect(sx + 8, sy + 4, 1, 2, (186, 104, 64, 255))
    return c.im


def stall(col, goods, seed=11):
    W, H = 46, 38; c = Canvas(W, H, seed); light = (244, 232, 204, 255)
    c.rect(3, 8, 2, 26, D2); c.rect(W - 5, 8, 2, 26, D2)                                              # posts
    for k in range(W - 2):                                                                             # canopy
        cc = col if (k // 5) % 2 == 0 else light
        c.rect(1 + k, 2, 1, 8, cc)
        if k % 5 in (1, 2, 3): c.px(1 + k, 10, cc)
    c.rect(1, 2, W - 2, 1, tuple(max(0, v - 60) if i < 3 else 255 for i, v in enumerate(col))); c.rect(1, 9, W - 2, 1, (0, 0, 0, 50))
    c.rect(2, 22, W - 4, 12, D1); c.rect(2, 22, W - 4, 2, D3); c.rect(2, 27, W - 4, 1, D2); c.rect(2, 31, W - 4, 1, D2)   # counter
    x = 6
    for g in goods:                                                                                     # goods on the counter
        if g == 'basket':
            c.rect(x, 17, 9, 5, (180, 130, 70, 255)); c.rect(x, 17, 9, 1, (210, 160, 90, 255))
            for k in range(4): c.rect(x + 1 + k * 2, 15 + k % 2, 2, 2, c.r.choice([(220, 60, 50, 255), (240, 190, 60, 255), (110, 170, 60, 255)]))
        elif g == 'jar':
            c.rect(x + 1, 14, 5, 8, (186, 104, 64, 255)); c.rect(x + 2, 13, 3, 1, (150, 80, 50, 255)); c.rect(x + 2, 15, 1, 5, (214, 140, 96, 255))
        elif g == 'cloth':
            c.rect(x, 16, 9, 6, (120, 80, 170, 255)); c.rect(x, 18, 9, 1, (220, 200, 120, 255)); c.rect(x + 9, 17, 1, 5, (90, 56, 130, 255))
        elif g == 'sacks':
            c.rect(x, 15, 8, 7, (214, 192, 140, 255)); c.rect(x + 1, 14, 6, 1, (190, 166, 116, 255)); c.rect(x + 2, 16, 4, 2, (234, 214, 160, 255))
        x += 11
    c.outline(); return c.im


def well():
    c = Canvas(30, 30, 9)
    for y in range(12, 28):
        for x in range(2, 28):
            d = ((x - 15) / 13) ** 2
            if y > 12 + int(5 * (1 - d)) - 3: c.px(x, y, L2 if (x + y // 5) % 8 else MOR)
    stone_wall(c, 2, 14, 26, 14)
    c.rect(4, 11, 22, 4, L1); c.rect(6, 12, 18, 2, (40, 70, 110, 255))
    c.rect(4, 2, 2, 12, D2); c.rect(24, 2, 2, 12, D2); c.rect(3, 1, 24, 2, D1); c.rect(14, 3, 2, 6, (120, 100, 80, 255)); c.rect(13, 8, 4, 3, (150, 110, 70, 255))
    c.outline(); return c.im


def torch():
    c = Canvas(8, 22, 2)
    c.rect(3, 7, 2, 15, D2); c.rect(2, 5, 4, 3, (90, 70, 60, 255)); c.outline(); return c.im


def build_all():
    out = {}
    out['bld_church'] = church()
    out['bld_smithy'] = smithy()
    out['bld_inn'] = inn()
    out['bld_house1'] = house(4, awn=(200, 70, 60, 255), seed=21)
    out['bld_house2'] = house(4, wins=(.25,), door_at=.66, seed=22, stairs=True)
    out['bld_house3'] = house(5, awn=(70, 110, 190, 255), wins=(.2, .8), box=(240, 200, 80, 255), seed=23)
    out['bld_house4'] = house(3, wins=(.75,), door_at=.3, seed=24)
    out['stall_red'] = stall((200, 64, 56, 255), ['basket', 'sacks', 'basket'])
    out['stall_blue'] = stall((60, 100, 190, 255), ['jar', 'jar', 'cloth'], seed=12)
    out['stall_green'] = stall((80, 150, 70, 255), ['sacks', 'basket', 'jar'], seed=13)
    out['well_big'] = well()
    out['torch'] = torch()
    return out
