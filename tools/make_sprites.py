#!/usr/bin/env python3
"""Generates every sprite in sprites/.

Authored at the exact size the game draws them, so p5 never resamples: a 50px
pig is a 50px PNG, not a 100px one squashed to 50. Requires Pillow.

    python3 tools/make_sprites.py
"""
import math
import os

from PIL import Image

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sprites")

INK = (32, 24, 40, 255)
SKY = [(110, 190, 232, 255), (134, 200, 236, 255), (160, 214, 240, 255),
       (188, 228, 244, 255), (214, 240, 248, 255)]
CLOUD, CLOUD_SH = (250, 252, 255, 255), (206, 226, 238, 255)
HILL_FAR, HILL_NEAR = (120, 182, 158, 255), (74, 150, 118, 255)
GRASS, GRASS_HI, GRASS_LO = (104, 194, 92, 255), (142, 220, 112, 255), (66, 150, 64, 255)
DIRT, DIRT_HI, DIRT_LO = (140, 92, 58, 255), (168, 116, 74, 255), (94, 58, 36, 255)
WOOD, WOOD_HI, WOOD_LO = (198, 134, 72, 255), (226, 170, 106, 255), (140, 88, 44, 255)
STONE, STONE_HI, STONE_LO = (152, 160, 172, 255), (188, 196, 206, 255), (102, 110, 122, 255)
PIG, PIG_HI, PIG_LO, SNOUT = (126, 200, 80, 255), (168, 228, 112, 255), (78, 142, 52, 255), (186, 232, 140, 255)
BIRD, BIRD_HI, BIRD_LO, BEAK = (232, 86, 68, 255), (250, 134, 110, 255), (172, 50, 38, 255), (242, 177, 52, 255)
WHITE, DARK = (250, 250, 252, 255), (26, 20, 32, 255)


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[(0, 0, 0, 0)] * w for _ in range(h)]

    def set(self, x, y, c):
        x, y = int(x), int(y)          # callers pass float centres/radii freely
        if not (0 <= x < self.w and 0 <= y < self.h) or not c[3]:
            return
        a = c[3] / 255.0
        d = self.px[y][x]
        self.px[y][x] = (tuple(c) if (a >= 1 or not d[3]) else
                         tuple(int(c[i] * a + d[i] * (1 - a)) for i in range(3)) + (max(d[3], c[3]),))

    def rect(self, x, y, w, h, c):
        for j in range(int(y), int(y + h)):
            for i in range(int(x), int(x + w)):
                self.set(i, j, c)

    def ellipse(self, cx, cy, rx, ry, c):
        for j in range(int(cy - ry), int(cy + ry) + 1):
            for i in range(int(cx - rx), int(cx + rx) + 1):
                if ((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2 <= 1.0:
                    self.set(i, j, c)

    def line(self, x0, y0, x1, y1, c, w=1):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for k in range(n + 1):
            f = k / n
            x, y = round(x0 + (x1 - x0) * f), round(y0 + (y1 - y0) * f)
            self.rect(x - w // 2, y - w // 2, w, w, c)

    def poly(self, pts, c):
        """Scanline fill: for each row, fill between the edge crossings."""
        ys = [p[1] for p in pts]
        for j in range(min(ys), max(ys) + 1):
            cross = []
            for (ax, ay), (bx, by) in zip(pts, pts[1:] + pts[:1]):
                if (ay <= j < by) or (by <= j < ay):
                    cross.append(ax + (bx - ax) * (j - ay) / (by - ay))
            cross.sort()
            for a, b in zip(cross[::2], cross[1::2]):
                for i in range(int(math.floor(a)), int(math.ceil(b)) + 1):
                    self.set(i, j, c)

    def outline(self, c=INK):
        add = []
        for j in range(self.h):
            for i in range(self.w):
                if self.px[j][i][3]:
                    continue
                if any(self.px[j + dj][i + di][3]
                       for dj, di in ((1, 0), (-1, 0), (0, 1), (0, -1)) if
                       0 <= j + dj < self.h and 0 <= i + di < self.w):
                    add.append((i, j))
        for i, j in add:
            self.px[j][i] = c

    def save(self, name):
        img = Image.new("RGBA", (self.w, self.h))
        img.putdata([p for row in self.px for p in row])
        img.save(os.path.join(OUT, name))
        print(f"  {name:16} {self.w}x{self.h}")


def eye(c, x, y, r=3, look=0):
    c.ellipse(x, y, r, r, WHITE)
    c.rect(x - 1 + look, y - 1, 2, 2, DARK)
    c.set(x - 2 + look, y - 2, (200, 200, 210, 255))


def bird():
    c = Canvas(50, 50)
    c.ellipse(25, 27, 21, 19, BIRD)                  # body
    c.ellipse(20, 22, 15, 12, BIRD_HI)               # top-left light
    c.ellipse(26, 34, 14, 10, BIRD_LO)               # belly shade
    c.poly([(42, 22), (50, 27), (42, 32)], BEAK)     # beak
    c.poly([(42, 25), (50, 28), (42, 29)], (200, 130, 30, 255))
    for k, dy in enumerate((0, 4, 8)):              # tail feathers
        c.line(6, 20 + dy, 0, 16 + dy, BIRD, 3)
    c.line(20, 40, 22, 45, BEAK, 3)                  # feet
    c.line(29, 40, 27, 45, BEAK, 3)
    eye(c, 30, 19, 4)
    c.line(24, 13, 36, 16, DARK, 2)                  # angry brow
    c.rect(2, 14, 10, 2, BIRD_LO)
    c.outline()
    return c


def pig(size=50, big=False):
    c = Canvas(size, size)
    r = size * 0.42
    cx, cy = size / 2, size * 0.55
    if big:
        c.ellipse(12, 16, 8, 8, PIG)                 # ears
        c.ellipse(size - 12, 16, 8, 8, PIG)
    else:
        c.ellipse(14, 15, 6, 6, PIG)
        c.ellipse(size - 14, 15, 6, 6, PIG)
    c.ellipse(cx, cy, r, r * 0.92, PIG)
    c.ellipse(cx - r * 0.35, cy - r * 0.35, r * 0.6, r * 0.5, PIG_HI)
    c.ellipse(cx, cy + r * 0.28, r * 0.45, r * 0.32, SNOUT)   # snout
    c.ellipse(cx - 3, cy + r * 0.28, 1.6, 2, PIG_LO)
    c.ellipse(cx + 3, cy + r * 0.28, 1.6, 2, PIG_LO)
    eye(c, cx - 7, cy - 6, 3 if not big else 4, 0)
    eye(c, cx + 7, cy - 6, 3 if not big else 4, 0)
    c.line(cx - 6, cy - 12, cx, cy - 10, DARK, 2)    # brows
    c.line(cx + 6, cy - 12, cx, cy - 10, DARK, 2)
    c.line(cx - 8, cy + r * 0.62, cx, cy + r * 0.78, DARK, 2)   # mouth
    c.line(cx + 8, cy + r * 0.62, cx, cy + r * 0.78, DARK, 2)
    c.outline()
    return c


def wood_block():
    c = Canvas(70, 70)
    for k in range(3):
        y = 2 + k * 23
        c.rect(3, y, 64, 20, WOOD)
        c.rect(3, y, 64, 3, WOOD_HI)
        c.rect(3, y + 17, 64, 3, WOOD_LO)
        for gx in (12, 30, 48):                      # grain
            c.rect(gx, y + 8, 12, 1, WOOD_LO)
        c.ellipse(10, y + 10, 2, 2, STONE_LO)       # nails
        c.ellipse(58, y + 10, 2, 2, STONE_LO)
    c.outline()
    return c


def log():
    c = Canvas(20, 150)
    c.rect(2, 0, 16, 150, WOOD)
    c.rect(2, 0, 4, 150, WOOD_HI)
    c.rect(14, 0, 4, 150, WOOD_LO)
    c.rect(2, 2, 16, 5, WOOD_LO)                    # end grain rings
    c.rect(4, 4, 12, 1, DIRT_HI)
    c.rect(2, 143, 16, 5, WOOD_LO)
    for ky in (40, 75, 110):
        c.ellipse(10, ky, 2, 3, WOOD_LO)
    c.outline()
    return c


def stone_block():
    c = Canvas(70, 70)
    c.rect(4, 4, 62, 62, STONE)
    c.rect(4, 4, 62, 4, STONE_HI)
    c.rect(4, 58, 62, 8, STONE_LO)
    c.rect(4, 4, 4, 62, STONE_HI)
    for (sx, sy, sw, sh) in ((12, 20, 18, 3), (34, 32, 22, 3), (20, 46, 14, 3), (44, 14, 12, 3)):
        c.rect(sx, sy, sw, sh, STONE_LO)             # cracks
    for (dx, dy) in ((10, 34), (52, 40), (30, 12), (58, 20), (26, 60)):
        c.rect(dx, dy, 3, 3, STONE_HI)              # speckles
    for (cx, cy) in ((4, 4), (66, 4), (4, 66), (66, 66), (35, 2), (35, 68), (2, 35), (68, 35)):
        c.px[cy][cx] = (0, 0, 0, 0)                 # chipped corners
    c.outline()
    return c


def base_block():
    c = Canvas(70, 70)
    c.rect(3, 3, 64, 64, (176, 172, 190, 255))
    c.rect(3, 3, 64, 4, (206, 202, 218, 255))
    c.rect(3, 59, 64, 8, (128, 124, 146, 255))
    c.outline()
    return c


def ground_tile():
    c = Canvas(24, 26)
    c.rect(0, 6, 24, 20, DIRT)
    c.rect(0, 6, 24, 3, GRASS_HI)
    c.rect(0, 9, 24, 4, GRASS)
    for gx in (2, 9, 16, 21):                        # grass edge tufts
        c.set(gx, 5, GRASS)
        c.set(gx + 1, 4, GRASS_HI)
    for (dx, dy, dw) in ((3, 16, 5), (12, 20, 6), (18, 13, 4), (6, 23, 5)):
        c.rect(dx, dy, dw, 2, DIRT_LO)               # pebbles
    c.rect(0, 12, 24, 1, DIRT_HI)
    return c


def sling():
    c = Canvas(56, 104)
    for x0, y0, x1, y1 in ((14, 8, 28, 62), (42, 8, 28, 62)):   # arms
        c.line(x0, y0, x1, y1, DIRT_LO, 11)
        c.line(x0, y0, x1, y1, DIRT, 8)
        c.line(x0, y0, x1, y1, DIRT_HI, 3)
    c.line(28, 62, 28, 100, DIRT_LO, 13)            # handle
    c.line(28, 62, 28, 100, DIRT, 10)
    c.line(26, 66, 26, 98, DIRT_HI, 3)
    c.ellipse(13, 6, 7, 5, DIRT_HI)                 # fork tips
    c.ellipse(43, 6, 7, 5, DIRT_HI)
    c.rect(20, 54, 16, 7, (74, 46, 28, 255))        # leather pouch
    c.outline()
    return c


def glass(size=70):
    c = Canvas(size, size)
    c.rect(4, 4, size - 8, size - 8, (168, 224, 240, 95))
    c.rect(4, 4, size - 8, 4, (226, 248, 253, 190))
    c.rect(4, size - 8, size - 8, 4, (112, 176, 198, 190))
    c.rect(4, 4, 4, size - 8, (196, 240, 251, 150))
    c.rect(size - 8, 4, 4, size - 8, (140, 200, 220, 150))
    c.line(9, size - 13, size - 15, 11, (255, 255, 255, 150), 2)
    c.rect(size - 20, 6, 8, 2, (255, 255, 255, 110))    # corner glint
    return c


def background():
    c = Canvas(1200, 400)
    for band, col in enumerate(SKY):                # banded sky, dithered at the seams
        c.rect(0, band * 48, 1200, 48, col)
        if band + 1 < len(SKY):
            for y in range(band * 48 + 42, band * 48 + 48):
                c.rect(0, y, 1200, 1, SKY[band + 1])
            for x in range(0, 1200, 2):              # checker seam so it isn't a hard line
                c.set(x, band * 48 + 45, SKY[band + 1])
    for (cx, cy, s) in ((180, 70, 1.0), (520, 46, 0.8), (860, 84, 1.15), (1090, 40, 0.7)):
        for (ox, oy, r) in ((0, 0, 26), (24, 6, 20), (-24, 6, 18), (10, -12, 18)):
            c.ellipse(cx + ox * s, cy + oy * s, r * s, r * s * 0.72, CLOUD)
        c.ellipse(cx, cy + 12 * s, 30 * s, 9 * s, CLOUD_SH)
    for x in range(1200):                           # two hill layers
        h1 = 236 + 16 * math.sin(x / 150.0) + 6 * math.sin(x / 47.0)
        h2 = 268 + 12 * math.sin(x / 110.0 + 2) + 5 * math.sin(x / 33.0)
        for y in range(int(h1), 400):
            c.set(x, y, HILL_FAR)
        for y in range(int(h2), 400):
            c.set(x, y, HILL_NEAR)
    c.rect(0, 384, 1200, 16, GRASS)                 # grass behind the ground body
    c.rect(0, 384, 1200, 3, GRASS_HI)
    for gx in range(0, 1200, 9):                    # tufts
        c.set(gx, 382, GRASS_LO)
        c.set(gx + 1, 381, GRASS_HI)
    c.rect(0, 387, 1200, 3, GRASS_LO)
    c.save("bg.png")
    return c


def main():
    os.makedirs(OUT, exist_ok=True)
    print("sprites:")
    bird().save("bird.png")
    pig(50).save("enemy.png")
    pig(70, big=True).save("enemy_big.png")
    wood_block().save("wood1.png")
    log().save("wood2.png")
    stone_block().save("stone.png")
    glass().save("glass.png")
    base_block().save("base.png")
    ground_tile().save("ground.png")
    sling().save("sling.png")
    background()


if __name__ == "__main__":
    main()
