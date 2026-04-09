import math
import random

import pygame


def _clamp(v, lo, hi):
    return lo if v < lo else hi if v > hi else v


def _lerp(a, b, t):
    return a + (b - a) * t


def _lerp_rgb(c1, c2, t):
    return (int(_lerp(c1[0], c2[0], t)), int(_lerp(c1[1], c2[1], t)), int(_lerp(c1[2], c2[2], t)))


def _brighten(rgb, amount):
    r, g, b = rgb
    return (
        _clamp(int(r + (255 - r) * amount), 0, 255),
        _clamp(int(g + (255 - g) * amount), 0, 255),
        _clamp(int(b + (255 - b) * amount), 0, 255),
    )


class Background:
    def __init__(self, width, height, cell, seed=None):
        self.width = int(width)
        self.height = int(height)
        self.cell = int(cell)
        self.rng = random.Random(seed)

        self.bg_grad = self._make_gradient()
        self.nebula = self._make_nebula()
        self.vignette = self._make_vignette()
        self.grid_overlay = self._make_grid_overlay()

        self.stars_far = self._make_stars(count=120, speed=(0.20, 0.65), radius=(1, 2))
        self.stars_mid = self._make_stars(count=95, speed=(0.55, 1.35), radius=(1, 3))
        self.stars_near = self._make_stars(count=55, speed=(1.10, 2.30), radius=(2, 4))

        self.shooting = None
        self._shoot_cooldown = 0

    def _make_gradient(self):
        top = (8, 10, 28)
        bottom = (4, 26, 70)
        surf = pygame.Surface((self.width, self.height))
        for y in range(self.height):
            t = y / max(1, self.height - 1)
            col = _lerp_rgb(top, bottom, t)
            pygame.draw.line(surf, col, (0, y), (self.width, y))
        return surf

    def _make_nebula(self):
        scale = 4
        w, h = max(1, self.width // scale), max(1, self.height // scale)
        small = pygame.Surface((w, h), pygame.SRCALPHA)

        palette = [
            (60, 110, 255),
            (170, 70, 255),
            (0, 220, 255),
            (255, 90, 170),
        ]
        for _ in range(26):
            cx = self.rng.randrange(0, w)
            cy = self.rng.randrange(0, h)
            radius = self.rng.randrange(18, 56)
            col = self.rng.choice(palette)
            alpha = self.rng.randrange(18, 48)
            pygame.draw.circle(small, (*col, alpha), (cx, cy), radius)

        neb = pygame.transform.smoothscale(small, (self.width, self.height))
        neb2 = pygame.transform.smoothscale(neb, (max(1, self.width // 2), max(1, self.height // 2)))
        neb2 = pygame.transform.smoothscale(neb2, (self.width, self.height))
        return neb2

    def _make_vignette(self):
        surf = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
        steps = 30
        for i in range(steps):
            t = i / max(1, steps - 1)
            alpha = int(140 * (t**2))
            inset = int(_lerp(0, min(self.width, self.height) * 0.12, t))
            r = pygame.Rect(inset, inset, self.width - inset * 2, self.height - inset * 2)
            pygame.draw.rect(surf, (0, 0, 0, alpha), r, width=8, border_radius=28)
        return surf

    def _make_grid_overlay(self):
        surf = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
        a = 10
        for x in range(0, self.width, self.cell):
            pygame.draw.line(surf, (255, 255, 255, a), (x, 0), (x, self.height))
        for y in range(0, self.height, self.cell):
            pygame.draw.line(surf, (255, 255, 255, a), (0, y), (self.width, y))
        return surf

    def _make_stars(self, count, speed, radius):
        out = []
        for _ in range(count):
            out.append(
                {
                    "x": self.rng.uniform(0, self.width),
                    "y": self.rng.uniform(0, self.height),
                    "vy": self.rng.uniform(speed[0], speed[1]),
                    "r": self.rng.randint(radius[0], radius[1]),
                    "phase": self.rng.uniform(0, math.tau),
                    "tw": self.rng.uniform(0.7, 1.6),
                    "base": self.rng.uniform(0.70, 1.00),
                    "kind": self.rng.randint(0, 2),
                }
            )
        return out

    def _draw_star_layer(self, screen, layer, tick):
        for s in layer:
            s["y"] += s["vy"]
            if s["y"] > self.height + 10:
                s["y"] = -10
                s["x"] = self.rng.uniform(0, self.width)
                s["vy"] *= self.rng.uniform(0.92, 1.08)
                s["r"] = max(1, min(5, s["r"] + self.rng.choice([-1, 0, 0, 1])))
                s["phase"] = self.rng.uniform(0, math.tau)

            tw = 0.65 + 0.35 * math.sin(s["phase"] + tick * 0.02 * s["tw"])
            b = _clamp(s["base"] * (0.85 + 0.40 * tw), 0.55, 1.25)

            if s["kind"] == 2:
                col = _brighten((190, 210, 255), 0.18)
            elif s["kind"] == 1:
                col = (205, 220, 245)
            else:
                col = (190, 205, 230)
            col = (
                _clamp(int(col[0] * b), 0, 255),
                _clamp(int(col[1] * b), 0, 255),
                _clamp(int(col[2] * b), 0, 255),
            )
            pygame.draw.circle(screen, col, (int(s["x"]), int(s["y"])), s["r"])

    def _maybe_spawn_shooting(self):
        if self.shooting or self._shoot_cooldown > 0:
            return
        if self.rng.random() < 0.007:
            x = self.rng.uniform(0.0, self.width * 0.8)
            y = self.rng.uniform(0.0, self.height * 0.35)
            vx = self.rng.uniform(8.0, 13.0)
            vy = self.rng.uniform(3.0, 6.0)
            life = self.rng.randint(24, 42)
            self.shooting = {"x": x, "y": y, "vx": vx, "vy": vy, "life": life, "max": life}

    def _draw_shooting(self, screen):
        s = self.shooting
        if not s:
            return
        s["x"] += s["vx"]
        s["y"] += s["vy"]
        s["life"] -= 1

        t = 1.0 - (s["life"] / max(1, s["max"]))
        alpha = int(255 * (1.0 - t))
        length = int(140 * (1.0 - 0.25 * t))

        end = (int(s["x"]), int(s["y"]))
        start = (int(s["x"] - s["vx"] * 2.6), int(s["y"] - s["vy"] * 2.6))
        tail = (start[0] - int(length * 0.35), start[1] - int(length * 0.18))

        pygame.draw.line(screen, (255, 255, 255), tail, start, width=2)
        pygame.draw.line(screen, (220, 245, 255), start, end, width=3)
        pygame.draw.circle(screen, (255, 255, 255), end, 3)

        if s["life"] <= 0 or s["x"] > self.width + 200 or s["y"] > self.height + 200:
            self.shooting = None
            self._shoot_cooldown = self.rng.randint(120, 280)

    def draw(self, screen, tick=None):
        if tick is None:
            tick = pygame.time.get_ticks()

        screen.blit(self.bg_grad, (0, 0))
        screen.blit(self.nebula, (0, 0))

        self._draw_star_layer(screen, self.stars_far, tick)
        self._draw_star_layer(screen, self.stars_mid, tick)
        self._draw_star_layer(screen, self.stars_near, tick)

        if self._shoot_cooldown > 0:
            self._shoot_cooldown -= 1
        self._maybe_spawn_shooting()
        self._draw_shooting(screen)

        screen.blit(self.vignette, (0, 0))
