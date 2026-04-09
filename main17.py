#Tiểu luận cuối kỳ - Môn cơ sở lập trình - Nhóm 4
# Stage 0: Imports + pygame initialization
import pygame, random, os
pygame.init(); pygame.mixer.init()
# ================= CONFIG =================
# Stage 1: Core constants (window/grid/speed)
WIDTH, HEIGHT = 1542, 800
CELL = 20
SPEED = 7
# ================= COLORS =================
# Stage 2: Color palette
WHITE = (255,255,255)
GREEN = (0,255,0)
RED = (255,0,0)
GRAY = (130,130,130)
ORANGE = (255,165,0)
YELLOW = (255,255,0)
SPECIAL_COLOR = (0,255,255)
BLACK = (0,0,0)
GOLD = (255,215,0)
# ================= UI THEME =================
# Stage 3: UI theme colors (panels/buttons/HUD)
PANEL_BG = (20, 22, 40)
PANEL_INNER = (34, 36, 62)
PANEL_BORDER = (85, 105, 170)
HUD_BG = (10, 12, 26, 170)
BTN_BORDER = (245, 245, 255)
BTN_INNER = (0, 0, 0, 70)
# ================= DISPLAY =================
# Stage 4: Window + fonts
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Snake Game Ultimate")
clock = pygame.time.Clock()
font_small = pygame.font.SysFont("bahnschrift", 22)
font_medium = pygame.font.SysFont("bahnschrift", 32)
font_big = pygame.font.SysFont("bahnschrift", 60)
# ================= SPLASH =================
# Stage 4a: Startup splash (optional video, user-provided)
SPLASH_VIDEO_FILE = "logovanlang.mp4"
try:
    import cv2  # Optional dependency for mp4 playback (no audio)
except Exception:
    cv2 = None
# ================= DO HOA ASSETS =================
# Stage 4b: Java-generated graphics pack (images only, no gameplay logic)
DO_HOA_DIR = "do_hoa_assets"
def _load_img(path, alpha=True):
    try:
        img = pygame.image.load(path)
        return img.convert_alpha() if alpha else img.convert()
    except Exception:
        return None
def _asset(name, alpha=True):
    return _load_img(os.path.join(DO_HOA_DIR, name), alpha=alpha)
def _tint_white_base(img, rgb):
    if not img:
        return None
    out = img.copy()
    out.fill((rgb[0], rgb[1], rgb[2], 255), special_flags=pygame.BLEND_RGBA_MULT)
    return out
PANEL_ASSETS = {}
for (w, h) in ((860,440),(1160,620),(720,400),(1080,560),(1040,680),(850,520),(1040,590),(760,40),(760,34)):
    p = _asset(f"panel_{w}x{h}.png")
    if p:
        PANEL_ASSETS[(w, h)] = p
HUD_ASSET = _asset("hud_520x44.png")
BTN_BASE = _asset("button_base.png")
BTN_BASE_HOVER = _asset("button_base_hover.png")
CELL_SHADOW = _asset(f"cell_shadow_{CELL}.png")
SNAKE_BASE = _asset(f"snake_base_{CELL}.png")
SNAKE_HIGHLIGHT = _asset(f"snake_highlight_{CELL}.png")
SNAKE_HEAD = _asset(f"snake_head_{CELL}.png")
SNAKE_BODY = _asset(f"snake_body_{CELL}.png")
SNAKE_TAIL = _asset(f"snake_tail_{CELL}.png")
OBSTACLE_SPR = _asset(f"obstacle_{CELL}.png")
APPLE_SPR = _asset(f"apple_{CELL}.png")
SPECIAL_BUFF_SPR = _asset(f"special_buff_{CELL}.png")
SPECIAL_HARM_SPR = _asset(f"special_harm_{CELL}.png")
GUN_SPR = _asset(f"gun_{CELL}.png")
PET_PENGUIN = _asset("pet_penguin_64.png")
PET_CAT = _asset("pet_cat_64.png")
PET_DOG = _asset("pet_dog_64.png")
PET_PARROT = _asset("pet_parrot_64.png")
PET_CHOICES = [("Penguin", PET_PENGUIN), ("Cat", PET_CAT), ("Dog", PET_DOG), ("Parrot", PET_PARROT)]
# ================= UTIL =================
# Stage 5: Small math/color helpers used by rendering
def clamp(v, lo, hi):
    return lo if v < lo else hi if v > hi else v
def lighten(rgb, amount):
    r, g, b = rgb
    return (clamp(int(r + (255 - r) * amount), 0, 255), clamp(int(g + (255 - g) * amount), 0, 255), clamp(int(b + (255 - b) * amount), 0, 255))
def darken(rgb, amount):
    r, g, b = rgb
    return (clamp(int(r * (1 - amount)), 0, 255), clamp(int(g * (1 - amount)), 0, 255), clamp(int(b * (1 - amount)), 0, 255))
# ================= BACKGROUND =================
# Stage 6: Precomputed background assets (gradient + grid + stars)
# Note: Splash video uses a plain black screen (no menu background drawn).
BG_FILES = [f"background {i}.jpg" for i in range(1, 6)]
BG_IMAGE_FILE = "background 1.jpg"
GRID_IMAGE_FILE = "do_hoa_grid.png"
bg_images = []
for p in BG_FILES:
    try:
        img = pygame.image.load(p).convert()
        if img.get_size() != (WIDTH, HEIGHT):
            img = pygame.transform.smoothscale(img, (WIDTH, HEIGHT)).convert()
        bg_images.append(img)
    except Exception:
        bg_images.append(None)
selected_bg_idx = 0
try:
    bg_image = pygame.image.load(BG_IMAGE_FILE).convert()
except Exception:
    try:
        bg_image = pygame.image.load("background 1.png").convert()
    except Exception:
        try:
            bg_image = pygame.image.load("do_hoa_bg.png").convert()
        except Exception:
            bg_image = pygame.Surface((WIDTH, HEIGHT))
            bg_image.fill((6, 10, 28))
    except Exception:
        bg_image = pygame.Surface((WIDTH, HEIGHT))
        bg_image.fill((6, 10, 28))
try:
    grid_overlay = pygame.image.load(GRID_IMAGE_FILE).convert_alpha()
except Exception:
    grid_overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
def draw_background():
    # Stage 7: Per-frame background draw (gradient + moving stars)
    img = bg_images[selected_bg_idx] if 0 <= selected_bg_idx < len(bg_images) else None
    screen.blit(img if img else bg_image, (0, 0))

# ================= LEADERBOARD FX =================
# Stage 7b: Java-generated blue flame overlay frames for leaderboard
LB_FLAME_PAD = 26
LB_FLAME_FRAMES = []
for i in range(0, 24):
    p = os.path.join("leaderboard", f"leaderboard_flame_{i:02d}.png")
    try:
        LB_FLAME_FRAMES.append(pygame.image.load(p).convert_alpha())
    except Exception:
        LB_FLAME_FRAMES = []
        break
def draw_leaderboard_flame(px, py, pw, ph):
    if not LB_FLAME_FRAMES:
        return
    idx = (pygame.time.get_ticks() // 50) % len(LB_FLAME_FRAMES)
    screen.blit(LB_FLAME_FRAMES[idx], (px - LB_FLAME_PAD, py - LB_FLAME_PAD))

# ================= PANEL FLAMES (JAVA) =================
# Stage 7d: Multicolor flame borders for key menus
def _load_flame_frames(prefix, count=24):
    frames = []
    for i in range(count):
        p = f"{prefix}{i:02d}.png"
        try:
            frames.append(pygame.image.load(p).convert_alpha())
        except Exception:
            return []
    return frames
MODE_FLAME_FRAMES = _load_flame_frames(os.path.join("mode", "mode_flame_"))
GUIDE_FLAME_FRAMES = _load_flame_frames(os.path.join("guide", "guide_flame_"))
COLOR_FLAME_FRAMES = _load_flame_frames(os.path.join("color", "color_flame_"))
def draw_panel_flame(frames, px, py, pad=26):
    if not frames:
        return
    idx = (pygame.time.get_ticks() // 50) % len(frames)
    screen.blit(frames[idx], (px - pad, py - pad))

# ================= PET =================
# Stage 7c: Small UI pet (non-gameplay screens only)
# Pet is never shown during splash/gameplay so it won't distract the player.
PET_GENERIC_LINES = ["How are you today?", "Here for some fun?"]
pet_selected_idx = 0
pet_enabled = False
pet_progress = 0.0
pet_last_tick = pygame.time.get_ticks()
pet_line = ""
pet_line_until = 0
pet_next_chat = 0
PET_SIZE = 44
PET_FIXED_POS = (WIDTH - PET_SIZE - 18, HEIGHT - PET_SIZE - 18)
PET_SPRITES_SMALL = []
for _, spr in PET_CHOICES:
    if spr:
        PET_SPRITES_SMALL.append(pygame.transform.smoothscale(spr, (PET_SIZE, PET_SIZE)).convert_alpha())
    else:
        PET_SPRITES_SMALL.append(None)
def pet_say(text, duration_ms=2800):
    global pet_line, pet_line_until, pet_next_chat
    pet_line = text
    pet_line_until = pygame.time.get_ticks() + duration_ms
    pet_next_chat = pygame.time.get_ticks() + 7000
def pet_pos_from_progress(p, inset=14):
    w = WIDTH - inset*2
    h = HEIGHT - inset*2
    per = 2*(w+h)
    p = p % max(1, per)
    if p < w:
        return inset + p, inset
    p -= w
    if p < h:
        return inset + w, inset + p
    p -= h
    if p < w:
        return inset + (w - p), inset + h
    p -= w
    return inset, inset + (h - p)
def update_pet_motion():
    global pet_last_tick, pet_next_chat
    now = pygame.time.get_ticks()
    dt = max(0, now - pet_last_tick)
    pet_last_tick = now
    if now >= pet_next_chat and not (pet_line and now < pet_line_until):
        pet_say(random.choice(PET_GENERIC_LINES), duration_ms=2400)
def draw_pet_ui():
    now = pygame.time.get_ticks()
    x, y = PET_FIXED_POS
    spr = PET_SPRITES_SMALL[pet_selected_idx] if 0 <= pet_selected_idx < len(PET_SPRITES_SMALL) else None
    if spr:
        screen.blit(spr, (int(x), int(y)))
    else:
        pygame.draw.circle(screen, (0, 220, 255), (int(x)+PET_SIZE//2, int(y)+PET_SIZE//2), PET_SIZE//2)

    if pet_line and now < pet_line_until:
        msg = pet_line
        text = font_small.render(msg, True, (235, 245, 255))
        bw = min(460, text.get_width() + 26)
        bh = 38
        bx = int(x) + PET_SIZE + 10
        by = int(y) - 6
        if bx + bw > WIDTH - 10:
            bx = int(x) - bw - 10
        if by < 10:
            by = 10
        bubble = pygame.Surface((bw, bh), pygame.SRCALPHA)
        pygame.draw.rect(bubble, (0, 0, 0, 170), (0, 0, bw, bh), border_radius=14)
        pygame.draw.rect(bubble, (0, 220, 255, 70), (0, 0, bw, bh), width=2, border_radius=14)
        bubble.blit(text, (13, 9))
        screen.blit(bubble, (bx, by))
# ================= UI PRIMITIVES =================
# Stage 8: Common UI components (panel + button)
def draw_panel(x, y, w, h):
    img = PANEL_ASSETS.get((w, h))
    if img:
        screen.blit(img, (x, y))
        return
    pygame.draw.rect(screen, (0, 0, 0), (x+6, y+6, w, h), border_radius=14)
    pygame.draw.rect(screen, PANEL_BG, (x, y, w, h), border_radius=14)
    pygame.draw.rect(screen, PANEL_INNER, (x+4, y+4, w-8, h-8), border_radius=12)
    pygame.draw.rect(screen, PANEL_BORDER, (x, y, w, h), width=2, border_radius=14)
    pygame.draw.rect(screen, (255, 255, 255), (x+3, y+3, w-6, h-6), width=1, border_radius=13)
def _soft_rect_surface(w, h, fill_rgba, radius=12, border_rgba=None, border_w=0, inset=0, inset_border_rgba=None, inset_border_w=0):
    # Helper for consistent rounded UI boxes (reduces repeated Surface+draw code).
    surf = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.rect(surf, fill_rgba, surf.get_rect(), border_radius=radius)
    if border_rgba and border_w:
        pygame.draw.rect(surf, border_rgba, surf.get_rect(), width=border_w, border_radius=radius)
    if inset and inset_border_rgba and inset_border_w:
        pygame.draw.rect(surf, inset_border_rgba, surf.get_rect().inflate(-inset*2, -inset*2), width=inset_border_w, border_radius=max(1, radius - 2))
    return surf
def draw_button(text, x, y, w, h, color):
    # Stage 9: Button draw with hover highlight (purely visual)
    mx, my = pygame.mouse.get_pos()
    hovered = (x <= mx <= x+w and y <= my <= y+h)

    if BTN_BASE and BTN_BASE_HOVER:
        base = BTN_BASE_HOVER if hovered else BTN_BASE
        surf = pygame.transform.smoothscale(base, (w, h))
        surf = _tint_white_base(surf, lighten(color, 0.25) if hovered else color)
        if surf:
            screen.blit(surf, (x, y))
    else:
        fill = lighten(color, 0.38) if hovered else color
        shadow = 3 if hovered else 5
        pygame.draw.rect(screen, (0, 0, 0), (x+shadow, y+shadow, w, h), border_radius=12)
        pygame.draw.rect(screen, fill, (x, y, w, h), border_radius=12)
        pygame.draw.rect(screen, BTN_BORDER, (x, y, w, h), width=3 if hovered else 2, border_radius=12)
        if hovered:
            pygame.draw.rect(screen, (0, 220, 255), (x-1, y-1, w+2, h+2), width=2, border_radius=13)
        inner = pygame.Surface((w, h), pygame.SRCALPHA)
        pygame.draw.rect(inner, BTN_INNER, (2, 2, w-4, h-4), border_radius=10)
        pygame.draw.rect(inner, (255, 255, 255, 55 if hovered else 25), (4, 4, w-8, (h-8)//2), border_radius=10)
        if hovered:
            pygame.draw.rect(inner, (255, 255, 255, 25), (4, 4, w-8, h-8), width=2, border_radius=10)
        screen.blit(inner, (x, y))
    t = font_small.render(text, True, BLACK)
    r = t.get_rect(center=(x+w//2, y+h//2))
    screen.blit(t, r)
# ================= GAME DRAW =================
# Stage 10: In-game render helpers (snake/obstacle/apple/HUD)
def draw_snake_with_shadow(body, color):
    def dir_angle_from_vec(dx, dy):
        if dx == 1 and dy == 0:
            return 0
        if dx == -1 and dy == 0:
            return 180
        if dx == 0 and dy == -1:
            return 90
        if dx == 0 and dy == 1:
            return -90
        return 0

    # Connect segments to look more snake-like (visual only).
    if len(body) >= 2:
        for i in range(1, len(body)):
            x1 = body[i-1][0]*CELL + CELL//2
            y1 = body[i-1][1]*CELL + CELL//2
            x2 = body[i][0]*CELL + CELL//2
            y2 = body[i][1]*CELL + CELL//2
            pygame.draw.line(screen, (0, 0, 0), (x1+3, y1+4), (x2+3, y2+4), max(2, int(CELL*0.65)))
            pygame.draw.line(screen, color, (x1, y1), (x2, y2), max(2, int(CELL*0.65)))

    for i, part in enumerate(body):
        x, y = part[0]*CELL, part[1]*CELL
        if CELL_SHADOW and SNAKE_BODY and SNAKE_HIGHLIGHT and SNAKE_HEAD and SNAKE_TAIL:
            screen.blit(CELL_SHADOW, (x, y))
            spr = SNAKE_BODY
            ang = 0
            if i == 0:
                spr = SNAKE_HEAD
                if len(body) >= 2:
                    dx = body[0][0] - body[1][0]
                    dy = body[0][1] - body[1][1]
                    ang = dir_angle_from_vec(dx, dy)
            elif i == len(body) - 1:
                spr = SNAKE_TAIL
                if len(body) >= 2:
                    dx = body[-2][0] - body[-1][0]
                    dy = body[-2][1] - body[-1][1]
                    ang = dir_angle_from_vec(dx, dy)
            rot_base = pygame.transform.rotate(spr, ang)
            rot_hi = pygame.transform.rotate(SNAKE_HIGHLIGHT, ang)
            base = _tint_white_base(rot_base, color)
            hi = _tint_white_base(rot_hi, (255, 255, 255))
            cx, cy = x + CELL//2, y + CELL//2
            if base:
                screen.blit(base, base.get_rect(center=(cx, cy)))
            if hi:
                screen.blit(hi, hi.get_rect(center=(cx, cy)))
        else:
            pygame.draw.rect(screen, (0, 0, 0), (x+4, y+5, CELL, CELL), border_radius=9)
            pygame.draw.rect(screen, color, (x, y, CELL, CELL), border_radius=9)
            pygame.draw.rect(screen, lighten(color, 0.35), (x+3, y+3, CELL-6, (CELL-6)//2), border_radius=8)
        if i == 0:
            # Eyes follow direction for a more snake-like feel (visual only).
            if len(body) >= 2:
                dx = body[0][0] - body[1][0]
                dy = body[0][1] - body[1][1]
            else:
                dx, dy = 1, 0
            cx, cy = x + CELL//2, y + CELL//2
            if dx == 1:
                e1 = (cx + 6, cy - 4); e2 = (cx + 6, cy + 4)
            elif dx == -1:
                e1 = (cx - 6, cy - 4); e2 = (cx - 6, cy + 4)
            elif dy == -1:
                e1 = (cx - 4, cy - 6); e2 = (cx + 4, cy - 6)
            else:
                e1 = (cx - 4, cy + 6); e2 = (cx + 4, cy + 6)
            pygame.draw.circle(screen, BLACK, e1, 3)
            pygame.draw.circle(screen, BLACK, e2, 3)
            pygame.draw.circle(screen, WHITE, (e1[0]+1, e1[1]-1), 1)
            pygame.draw.circle(screen, WHITE, (e2[0]+1, e2[1]-1), 1)
def draw_obstacle_cell(cell_pos):
    x, y = grid_to_pixel(cell_pos)
    if OBSTACLE_SPR and CELL_SHADOW:
        screen.blit(CELL_SHADOW, (x, y))
        screen.blit(OBSTACLE_SPR, (x, y))
    else:
        base = (85, 90, 105)
        top = lighten(base, 0.35)
        edge = darken(base, 0.25)
        pygame.draw.rect(screen, (0, 0, 0), (x+4, y+5, CELL, CELL), border_radius=7)
        pygame.draw.rect(screen, base, (x, y, CELL, CELL), border_radius=7)
        pygame.draw.rect(screen, top, (x+3, y+3, CELL-6, (CELL-6)//2), border_radius=6)
        pygame.draw.rect(screen, edge, (x, y, CELL, CELL), width=2, border_radius=7)
def draw_apple(apple_pos):
    x, y = grid_to_pixel(apple_pos)
    if APPLE_SPR and CELL_SHADOW:
        screen.blit(CELL_SHADOW, (x, y))
        screen.blit(APPLE_SPR, (x, y))
    else:
        cx, cy = x + CELL//2, y + CELL//2
        pygame.draw.circle(screen, (255, 120, 140), (cx, cy), CELL)
        pygame.draw.circle(screen, (230, 30, 60), (cx, cy), CELL//2)
        pygame.draw.circle(screen, (255, 235, 120), (cx-3, cy-6), CELL//5)
        pygame.draw.circle(screen, (60, 200, 120), (cx+6, cy-10), 5)
def draw_hud(text):
    if HUD_ASSET:
        screen.blit(HUD_ASSET, (10, 10))
    else:
        surf = pygame.Surface((520, 44), pygame.SRCALPHA)
        pygame.draw.rect(surf, HUD_BG, (0, 0, 520, 44), border_radius=12)
        pygame.draw.rect(surf, (255, 255, 255, 40), (2, 2, 516, 40), width=1, border_radius=11)
        screen.blit(surf, (10, 10))
    t = font_small.render(text, True, WHITE)
    screen.blit(t, (22, 20))
def draw_pill_hint(text, cx, y):
    t = font_small.render(text, True, (235, 245, 255))
    w, h = t.get_width() + 26, 36
    x = cx - w//2
    surf = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.rect(surf, (0, 0, 0, 150), (0, 0, w, h), border_radius=14)
    pygame.draw.rect(surf, (255, 255, 255, 45), (2, 2, w-4, h-4), width=1, border_radius=12)
    surf.blit(t, (13, 8))
    screen.blit(surf, (x, y))
# ================= SOUND =================
# Stage 11: Sound assets (sfx + background music)
sound_eat = pygame.mixer.Sound("eat.mp3")
sound_win = pygame.mixer.Sound("win.mp3")
sound_lose = pygame.mixer.Sound("lose.mp3")
sound_buff = pygame.mixer.Sound("buff.mp3")
pygame.mixer.music.load("bg.mp3")
pygame.mixer.music.set_volume(0.5)
pygame.mixer.music.play(-1)
# ================= SAVE FILES =================
# Stage 12: High score + leaderboard persistence
HIGH_SCORE_FILE = "highscore.txt"
if not os.path.exists(HIGH_SCORE_FILE): open(HIGH_SCORE_FILE,"w").write("0")
LEADERBOARD_FILE="leaderboard.txt"
if not os.path.exists(LEADERBOARD_FILE): open(LEADERBOARD_FILE,"w").close()
def load_high_score():
    with open(HIGH_SCORE_FILE,"r") as f: return int(f.read())
def save_high_score(score):
    with open(HIGH_SCORE_FILE,"w") as f: f.write(str(score))
def load_leaderboard():
    data=[]
    with open(LEADERBOARD_FILE,"r") as f:
        for line in f:
            p=line.strip().split(",")
            if len(p)==3:
                data.append((p[0],int(p[1]),p[2]))
    data.sort(key=lambda x:x[1],reverse=True)
    return data[:10]
def save_leaderboard(name,score,mode):
    data=load_leaderboard()
    data.append((name,score,mode))
    data.sort(key=lambda x:x[1],reverse=True)
    data=data[:10]
    with open(LEADERBOARD_FILE,"w") as f:
        for n,s,m in data:
            f.write(f"{n},{s},{m}\n")
high_score = load_high_score()
# ================= STATES =================
# Stage 13: Finite-state UI flow
# Flow order: Splash video -> Name -> Pet -> Guide -> Mode -> Background -> Play.
STATE_SPLASH, STATE_NAME, STATE_PET_SELECT, STATE_GUIDE, STATE_BG_SELECT, STATE_MODE, STATE_PLAY, STATE_END, STATE_LEADERBOARD_VIEW, STATE_COLOR_SELECT = range(10)
state = STATE_SPLASH
player_name = ""
end_message = ""
GRID_W = WIDTH // CELL
GRID_H = HEIGHT // CELL
# ================= GRID HELPERS =================
# Stage 14: Grid utilities
def random_grid(blocked):
    while True:
        p = [random.randrange(GRID_W), random.randrange(GRID_H)]
        if p not in blocked:
            return p
def grid_to_pixel(p):
    return p[0]*CELL, p[1]*CELL
def draw_center(text, y):
    t = font_big.render(text, True, WHITE)
    r = t.get_rect(center=(WIDTH//2, y))
    screen.blit(t, r)
def blit_center_text(font, text, color, cx, cy):
    t = font.render(text, True, color)
    screen.blit(t, t.get_rect(center=(cx, cy)))
    return t
# ================= SPLASH DRAW =================
# Stage 14a: Splash screen drawing (centered video playback, no input)
class _SplashVideo:
    def __init__(self, path):
        self.path = path
        self.cap = None
        self.ok = False
        self.started = False
        self.start_ticks = 0
        self.fps = 30.0
        self.frame_interval_ms = 33.333
        self.next_due_ms = 0
        self.last_surface = None
        self.target_size = None  # (w, h)

        if cv2 is None:
            return
        try:
            cap = cv2.VideoCapture(path)
            if not cap or not cap.isOpened():
                return
            fps = float(cap.get(getattr(cv2, "CAP_PROP_FPS", 5)) or 0.0)
            if fps and fps > 1:
                self.fps = min(60.0, fps)
            self.frame_interval_ms = 1000.0 / max(1.0, self.fps)
            self.cap = cap
            self.ok = True
        except Exception:
            self.cap = None
            self.ok = False

    def _read_next(self):
        if not self.cap:
            return None
        ok, frame = self.cap.read()
        if not ok:
            return None
        return frame

    def _frame_to_surface(self, frame_bgr):
        # Resize with OpenCV first (faster than pygame smoothscale for video frames).
        if self.target_size:
            tw, th = self.target_size
            if tw > 0 and th > 0:
                try:
                    frame_bgr = cv2.resize(frame_bgr, (tw, th), interpolation=cv2.INTER_AREA)
                except Exception:
                    pass

        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        h, w = frame_rgb.shape[:2]
        surf = pygame.image.frombuffer(frame_rgb.tobytes(), (w, h), "RGB")
        try:
            surf = surf.convert()
        except Exception:
            pass
        return surf

    def draw(self):
        if not self.ok:
            return True
        if not self.started:
            self.started = True
            self.start_ticks = pygame.time.get_ticks()
            self.next_due_ms = 0

        # Compute target draw size once (fill screen, keep aspect ratio)
        if self.target_size is None:
            # Peek one frame to get dimensions, then rewind by reopening.
            frame0 = self._read_next()
            if frame0 is None:
                try:
                    self.cap.release()
                except Exception:
                    pass
                self.cap = None
                return True
            try:
                sh, sw = frame0.shape[:2]
                scale = min(WIDTH / max(1, sw), HEIGHT / max(1, sh))
                dw, dh = max(1, int(sw * scale)), max(1, int(sh * scale))
                self.target_size = (dw, dh)
            except Exception:
                self.target_size = (WIDTH, HEIGHT)
            # Reopen so playback starts from frame 0.
            try:
                self.cap.release()
            except Exception:
                pass
            try:
                self.cap = cv2.VideoCapture(self.path)
            except Exception:
                self.cap = None
                return True

        elapsed_ms = max(0, pygame.time.get_ticks() - self.start_ticks)

        # Decode at the video FPS; between decodes we keep blitting last_surface.
        if elapsed_ms >= self.next_due_ms:
            # Catch up a little if we're behind (skip grabs without decoding).
            behind_frames = int((elapsed_ms - self.next_due_ms) / max(1.0, self.frame_interval_ms))
            if behind_frames > 2 and self.cap:
                skips = min(behind_frames, 8)
                for _ in range(skips):
                    try:
                        self.cap.grab()
                    except Exception:
                        break
                self.next_due_ms += skips * self.frame_interval_ms

            frame = self._read_next()
            if frame is None:
                try:
                    self.cap.release()
                except Exception:
                    pass
                self.cap = None
                return True

            try:
                self.last_surface = self._frame_to_surface(frame)
            except Exception:
                self.last_surface = None
                return True

            self.next_due_ms += self.frame_interval_ms

        if self.last_surface:
            screen.blit(self.last_surface, self.last_surface.get_rect(center=(WIDTH // 2, HEIGHT // 2)))
        return False

_splash_video = _SplashVideo(SPLASH_VIDEO_FILE)
def draw_splash_screen():
    # Splash ends when video ends; then the UI moves to the next state.
    return _splash_video.draw()
# ================= GUIDE =================
# Stage 15: Guide content + scroll UI config
guide_sections=[("ROLE",["Eat apples to increase score and reach the target.","Easy: 5 apples","Normal: 10 apples","Hard: 15 apples"]),("Controls",["Move using Arrow Keys."]),("Rival AI",["The enemy snake also chases apples.","Touching the enemy body will end the game."]),("ITEM",["80% Buff | 20% Harm.","Buff/Harm changes score and length by 1 to 3 points.","Gun: If 1 bullet is attached, 1 point and length will be deducted"]),("DEFEAT CONDITIONS",["Hit wall.","Hit your body.","Hit obstacle.","Hit enemy body."]),("INFINITE MODE",["No score limit.","If you have only 1 point/length and eat an item that reduces your score, you will lose immediately."])]
GUIDE_PANEL=pygame.Rect(190,70,1160,620); GUIDE_CONTENT=pygame.Rect(250,170,960,430); GUIDE_SCROLLBAR=pygame.Rect(1230,170,20,430); GUIDE_BUTTON=pygame.Rect(1010,620,250,55)
GUIDE_LINE_HEIGHT=34; GUIDE_SECTION_GAP=18; GUIDE_ITEM_GAP=10; GUIDE_PADDING_TOP=18; GUIDE_PADDING_BOTTOM=18; GUIDE_TEXT_LEFT=50; GUIDE_TEXT_RIGHT_PAD=24
guide_scroll = 0
guide_dragging = False
# ================= GUIDE SCROLL/WARP =================
# Stage 16: Guide text wrapping + scrollbar math + rendering
def wrap_text(font, text, max_width):
    words = text.split()
    if not words:
        return [""]
    lines = []
    cur = words[0]
    for w in words[1:]:
        test = cur + " " + w
        if font.size(test)[0] <= max_width:
            cur = test
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    out = []
    for line in lines:
        if font.size(line)[0] <= max_width:
            out.append(line)
            continue
        buf = ""
        for ch in line:
            test = buf + ch
            if font.size(test)[0] <= max_width or not buf:
                buf = test
            else:
                out.append(buf)
                buf = ch
        if buf:
            out.append(buf)
    return out
def get_guide_content_height():
    height = GUIDE_PADDING_TOP + GUIDE_PADDING_BOTTOM
    for title, items in guide_sections:
        height += GUIDE_LINE_HEIGHT + 2
        max_w = GUIDE_CONTENT.width - GUIDE_TEXT_LEFT - GUIDE_TEXT_RIGHT_PAD
        for item in items:
            lines = wrap_text(font_small, item, max_w)
            height += len(lines) * GUIDE_LINE_HEIGHT
            height += GUIDE_ITEM_GAP
        height += GUIDE_SECTION_GAP
    return max(height, GUIDE_CONTENT.height)
def get_guide_max_scroll():
    return max(0, get_guide_content_height() - GUIDE_CONTENT.height)
def clamp_guide_scroll():
    global guide_scroll
    max_scroll = get_guide_max_scroll()
    if guide_scroll < 0:
        guide_scroll = 0
    if guide_scroll > max_scroll:
        guide_scroll = max_scroll
def get_guide_thumb_rect():
    content_height = get_guide_content_height()
    if content_height <= GUIDE_CONTENT.height:
        return pygame.Rect(GUIDE_SCROLLBAR.x, GUIDE_SCROLLBAR.y, GUIDE_SCROLLBAR.width, GUIDE_SCROLLBAR.height)
    ratio = GUIDE_CONTENT.height / content_height
    thumb_height = max(70, int(GUIDE_SCROLLBAR.height * ratio))
    travel = GUIDE_SCROLLBAR.height - thumb_height
    max_scroll = get_guide_max_scroll()
    thumb_y = GUIDE_SCROLLBAR.y
    if max_scroll > 0:
        thumb_y += int(travel * (guide_scroll / max_scroll))
    return pygame.Rect(GUIDE_SCROLLBAR.x, thumb_y, GUIDE_SCROLLBAR.width, thumb_height)
def draw_guide_screen():
    draw_panel_flame(GUIDE_FLAME_FRAMES, GUIDE_PANEL.x, GUIDE_PANEL.y, pad=26)
    draw_panel(GUIDE_PANEL.x, GUIDE_PANEL.y, GUIDE_PANEL.width, GUIDE_PANEL.height)
    title = font_big.render("ROLE / GUIDE", True, WHITE)
    screen.blit(title, (GUIDE_PANEL.x + 60, GUIDE_PANEL.y + 35))
    subtitle = font_small.render("Lan chuot hoac keo thanh ben phai de xem toan bo huong dan.", True, (210, 210, 230))
    screen.blit(subtitle, (GUIDE_PANEL.x + 60, GUIDE_PANEL.y + 95))
    pygame.draw.rect(screen, (20, 20, 45), GUIDE_CONTENT, border_radius=10)
    pygame.draw.rect(screen, (70, 90, 150), GUIDE_CONTENT, width=2, border_radius=10)
    old_clip = screen.get_clip()
    screen.set_clip(GUIDE_CONTENT)
    y = GUIDE_CONTENT.y + GUIDE_PADDING_TOP - guide_scroll
    for title, items in guide_sections:
        section_title = font_medium.render(title, True, YELLOW)
        screen.blit(section_title, (GUIDE_CONTENT.x + 24, y))
        y += GUIDE_LINE_HEIGHT + 2
        for item in items:
            max_w = GUIDE_CONTENT.width - GUIDE_TEXT_LEFT - GUIDE_TEXT_RIGHT_PAD
            lines = wrap_text(font_small, item, max_w)
            for j, line in enumerate(lines):
                if j == 0:
                    bullet = font_small.render("-", True, SPECIAL_COLOR)
                    screen.blit(bullet, (GUIDE_CONTENT.x + 26, y + 1))
                text = font_small.render(line, True, WHITE)
                screen.blit(text, (GUIDE_CONTENT.x + GUIDE_TEXT_LEFT, y))
                y += GUIDE_LINE_HEIGHT
            y += GUIDE_ITEM_GAP
        y += GUIDE_SECTION_GAP
    screen.set_clip(old_clip)
    pygame.draw.rect(screen, (25, 25, 50), GUIDE_SCROLLBAR, border_radius=10)
    pygame.draw.rect(screen, (70, 90, 150), GUIDE_SCROLLBAR, width=2, border_radius=10)
    pygame.draw.rect(screen, SPECIAL_COLOR, get_guide_thumb_rect(), border_radius=10)
    draw_button("Start game", GUIDE_BUTTON.x, GUIDE_BUTTON.y, GUIDE_BUTTON.width, GUIDE_BUTTON.height, GREEN)
# ================= SPECIAL ITEM =================
# Stage 17: Special item spawn + draw (effect logic handled in STATE_PLAY)
special_item = None
special_type = None
special_spawn_time = 0
last_special_spawn = 0
def spawn_special():
    global special_item, special_type, special_spawn_time
    special_item = random_grid(snake + obstacles + enemy + [apple])
    special_type = "buff" if random.random() < 0.80 else "harm"
    special_spawn_time = pygame.time.get_ticks()
def draw_special():
    if not special_item:
        return
    elapsed = pygame.time.get_ticks() - special_spawn_time
    if elapsed > 2500:
        if (elapsed // 150) % 2 != 0:
            return
    x, y = grid_to_pixel(special_item)
    if CELL_SHADOW and SPECIAL_BUFF_SPR and SPECIAL_HARM_SPR:
        screen.blit(CELL_SHADOW, (x, y))
        # Visual-only: buff/harm share the same blue look (logic still uses special_type).
        screen.blit(SPECIAL_BUFF_SPR, (x, y))
    else:
        col = (0, 140, 255)
        pygame.draw.rect(screen, col, (x, y, CELL, CELL), border_radius=7)
        pygame.draw.rect(screen, WHITE, (x+3, y+3, CELL-6, CELL-6), width=1, border_radius=6)

# ================= GUN ITEM =================
# Stage 17b: Gun item + homing bullets (visual + score/length effect)
gun_item = None
gun_spawn_time = 0
gun_visible_ai_after = 0
last_gun_spawn = 0
player_has_gun = False
enemy_has_gun = False
player_gun_ammo = 0
enemy_gun_ammo = 0
bullets = []
shake_until = 0
MIN_SNAKE_LEN = 2  # Start length includes 1 protected extra segment (cannot be removed by harm/gun).
def spawn_gun(now):
    # AI delay: enemy will ignore gun until gun_visible_ai_after.
    global gun_item, gun_spawn_time, gun_visible_ai_after
    gun_item = random_grid(snake + obstacles + enemy + [apple] + ([special_item] if special_item else []))
    gun_spawn_time = now
    gun_visible_ai_after = now + 3000
def draw_gun():
    if not gun_item:
        return
    x, y = grid_to_pixel(gun_item)
    if CELL_SHADOW:
        screen.blit(CELL_SHADOW, (x, y))
    if GUN_SPR:
        screen.blit(GUN_SPR, (x, y))
    else:
        pygame.draw.rect(screen, WHITE, (x, y, CELL, CELL), border_radius=7)
        pygame.draw.rect(screen, BLACK, (x+3, y+3, CELL-6, CELL-6), width=1, border_radius=6)
def fire_bullet(owner, now):
    # Bullet is auto-fired when owner has ammo > 0 (see main loop).
    # Only 1 bullet per owner at a time.
    for b in bullets:
        if b.get("owner") == owner:
            return
    if owner == "player":
        hx, hy = snake[0][0]*CELL + CELL//2, snake[0][1]*CELL + CELL//2
    else:
        hx, hy = enemy[0][0]*CELL + CELL//2, enemy[0][1]*CELL + CELL//2
    bullets.append({"owner": owner, "x": float(hx), "y": float(hy)})
def apply_bullet_hit(target_owner, now):
    global score, shake_until
    # Target is player => reduce player's score/length safely.
    if target_owner == "player":
        if score > 1 and len(snake) > MIN_SNAKE_LEN:
            score -= 1
            snake.pop()
    else:
        # Enemy has no score variable; use length as proxy and never drop below 1.
        if len(enemy) > MIN_SNAKE_LEN:
            enemy.pop()
    shake_until = now + 250
def update_bullets(now):
    # Homing motion in pixel-space; bullet passes through walls/obstacles and only ends on hit/out-of-bounds.
    global bullets
    if not bullets:
        return
    speed = 30.0  # px per frame
    new = []
    for b in bullets:
        if b["owner"] == "player":
            tx = enemy[0][0]*CELL + CELL//2
            ty = enemy[0][1]*CELL + CELL//2
            target_owner = "enemy"
        else:
            tx = snake[0][0]*CELL + CELL//2
            ty = snake[0][1]*CELL + CELL//2
            target_owner = "player"
        dx = tx - b["x"]
        dy = ty - b["y"]
        d2 = dx*dx + dy*dy
        d = (d2 ** 0.5) if d2 > 0 else 0.0
        # Robust hit: if the bullet would reach/past the target this frame, count as hit.
        if d <= 10.0 or d <= speed:
            apply_bullet_hit(target_owner, now)
            continue
        inv = 1.0 / d if d > 0 else 0.0
        b["x"] += dx * inv * speed
        b["y"] += dy * inv * speed
        if -100 <= b["x"] <= WIDTH + 100 and -100 <= b["y"] <= HEIGHT + 100:
            new.append(b)
    bullets = new
def draw_bullets():
    for b in bullets:
        pygame.draw.circle(screen, WHITE, (int(b["x"]), int(b["y"])), 4)
# ================= ENEMY AI =================
# Stage 18: Enemy movement (greedy pathing with safety rules)
def move_enemy():
    global enemy, apple, special_item, gun_item, gun_visible_ai_after, enemy_has_gun, enemy_gun_ammo
    head = enemy[0].copy()
    candidates=[[head[0]+1, head[1]],[head[0]-1, head[1]],[head[0], head[1]+1],[head[0], head[1]-1]]
    candidates=[p for p in candidates if 0 <= p[0] < GRID_W and 0 <= p[1] < GRID_H]
    safe_moves = [p for p in candidates if p not in obstacles and p not in snake and p not in enemy]
    semi_safe = [p for p in candidates if p not in obstacles and p not in enemy]
    if safe_moves:
        pool = safe_moves
    elif semi_safe:
        pool = semi_safe
    else:
        pool = candidates
    target = apple
    now = pygame.time.get_ticks()
    if gun_item and now >= gun_visible_ai_after and not enemy_has_gun:
        target = gun_item
    pool.sort(key=lambda p: abs(p[0]-target[0]) + abs(p[1]-target[1]))
    new_head = pool[0]
    enemy.insert(0, new_head)
    if new_head == apple:
        apple = random_grid(snake + obstacles + enemy)
    else:
        enemy.pop()
    if special_item and new_head == special_item:
        special_item = None
    if gun_item and new_head == gun_item:
        enemy_has_gun = True
        enemy_gun_ammo = 1
        gun_item = None
# ================= COLORS / INPUT MAPS =================
# Stage 19: Color selections + key maps (modes + directions)
PLAYER_COLOR = GREEN
ENEMY_COLOR = ORANGE
color_options=[("Yellow",(255,255,0)),("Red",(255,0,0)),("Green",(0,255,0)),("Blue",(0,120,255)),("Purple",(160,60,255)),("Pink",(255,105,180)),("Orange",(255,165,0))]
player_select = PLAYER_COLOR
enemy_select = ENEMY_COLOR
COLOR_COLS=4; COLOR_W, COLOR_H = 120, 50; COLOR_DX, COLOR_DY = 160, 70
COLOR_GRID_X=450; PLAYER_GRID_TOP=260; ENEMY_GRID_TOP=420
DIR_VEC={"UP":(0,-1),"DOWN":(0,1),"LEFT":(-1,0),"RIGHT":(1,0)}
DIR_INPUT={pygame.K_UP:("UP","DOWN"),pygame.K_DOWN:("DOWN","UP"),pygame.K_LEFT:("LEFT","RIGHT"),pygame.K_RIGHT:("RIGHT","LEFT")}
CONFIRM_KEYS = (pygame.K_RETURN, pygame.K_KP_ENTER, pygame.K_SPACE)
MODE_CHOICES=[
    ("EASY", (5,20,"EASY"), "Relaxed"),
    ("NORMAL", (10,30,"NORMAL"), "Balanced"),
    ("HARD", (15,50,"HARD"), "Challenge"),
    ("INFINITE", (999999,35,"INFINITE"), "Endless"),
]
mode_selected_idx = 0
def draw_color_option(cx, cy, color, selected):
    r = pygame.Rect(cx, cy, COLOR_W, COLOR_H)
    mx, my = pygame.mouse.get_pos()
    hovered = r.collidepoint(mx, my)
    fill = lighten(color, 0.20) if hovered else color
    # shadow + body
    pygame.draw.rect(screen, (0, 0, 0), (r.x+3, r.y+4, r.width, r.height), border_radius=10)
    pygame.draw.rect(screen, fill, r, border_radius=10)
    # gloss
    g = pygame.Surface((r.width, r.height), pygame.SRCALPHA)
    pygame.draw.rect(g, (255, 255, 255, 28 if hovered else 18), (4, 4, r.width-8, (r.height-8)//2), border_radius=10)
    screen.blit(g, r.topleft)
    # borders
    if selected:
        pygame.draw.rect(screen, WHITE, (cx-5, cy-5, 130, 60), width=4, border_radius=12)
        pygame.draw.rect(screen, BLACK, (cx-8, cy-8, 136, 66), width=2, border_radius=14)
    else:
        pygame.draw.rect(screen, (255, 255, 255), r, width=1, border_radius=10)
    if hovered and not selected:
        pygame.draw.rect(screen, (0, 220, 255), (cx-3, cy-3, 126, 56), width=2, border_radius=12)
def color_name(c):
    for name, col in color_options:
        if col == c:
            return name
    return "Custom"
def pick_color(mx, my, top_y):
    for i, (_, color) in enumerate(color_options):
        cx = COLOR_GRID_X + (i%COLOR_COLS)*COLOR_DX
        cy = top_y + (i//COLOR_COLS)*COLOR_DY
        if cx<=mx<=cx+COLOR_W and cy<=my<=cy+COLOR_H:
            return color
    return None
def fit_text(font, text, max_w):
    if font.size(text)[0] <= max_w:
        return text
    ell = "..."
    max_w -= font.size(ell)[0]
    out = ""
    for ch in text:
        if font.size(out + ch)[0] > max_w:
            break
        out += ch
    return out + ell
def draw_leaderboard_list(x, y, w=760, row_h=40):
    board = load_leaderboard()
    header = _soft_rect_surface(w, row_h, (0, 0, 0, 120), radius=12, inset=4, inset_border_rgba=(255, 255, 255, 55), inset_border_w=1)
    screen.blit(header, (x, y))
    cols = [("RANK", 18), ("NAME", 110), ("SCORE", 470), ("MODE", 610)]
    for label, dx in cols:
        screen.blit(font_small.render(label, True, (210, 220, 245)), (x + dx, y + 10))
    y += row_h + 10
    for i, (n, s, m) in enumerate(board):
        r = pygame.Rect(x, y + i*row_h, w, row_h-6); bg_a = 110 if i % 2 == 0 else 70
        row = _soft_rect_surface(r.width, r.height, (0, 0, 0, bg_a), radius=12)
        if i == 0: pygame.draw.rect(row, (0, 220, 255, 55), row.get_rect().inflate(-4, -4), width=2, border_radius=10)
        screen.blit(row, r.topleft)
        rank_col = (255, 240, 190) if i == 0 else (230, 235, 255); mode_col = GOLD if m == "INFINITE" else (230, 235, 255); name = fit_text(font_medium, n, 330)
        screen.blit(font_medium.render(str(i+1), True, rank_col), (r.x + 22, r.y + 4)); screen.blit(font_medium.render(name, True, WHITE), (r.x + 110, r.y + 4))
        screen.blit(font_medium.render(str(s), True, (180, 255, 210)), (r.x + 480, r.y + 4)); screen.blit(font_medium.render(m, True, mode_col), (r.x + 610, r.y + 4))
def draw_leaderboard_screen():
    px, py, pw, ph = WIDTH//2-520, 70, 1040, 680
    draw_leaderboard_flame(px, py, pw, ph)
    draw_panel(px, py, pw, ph)
    blit_center_text(font_big, "LEADERBOARD", WHITE, WIDTH//2, py+65)
    blit_center_text(font_small, "Top 10 scores. INFINITE mode is highlighted.", (210, 220, 245), WIDTH//2, py+110)
    draw_leaderboard_list(px+60, py+140, w=pw-120, row_h=40)
    draw_pill_hint("M: Menu", WIDTH//2, py+ph-48)
def draw_color_select():
    px, py, pw, ph = 350, 120, 850, 520
    draw_panel_flame(COLOR_FLAME_FRAMES, px, py, pad=26)
    draw_panel(px, py, pw, ph)
    blit_center_text(font_big, "COLOR SELECT", WHITE, WIDTH//2, py+70)
    blit_center_text(font_small, "Click a color swatch to select.", (210, 220, 245), WIDTH//2, py+112)

    # Labels sit above / between grids so they never overlap swatches.
    for label, selected, top_y, label_y in (("PLAYER", player_select, PLAYER_GRID_TOP, 220), ("ENEMY", enemy_select, ENEMY_GRID_TOP, 392)):
        t = font_small.render(label, True, (230, 235, 255)); screen.blit(t, (COLOR_GRID_X, label_y))
        s = font_small.render(f"Selected: {color_name(selected)}", True, (210, 220, 245))
        screen.blit(s, (px+pw-90 - s.get_width(), label_y))
        for i, (_, color) in enumerate(color_options):
            cx = COLOR_GRID_X + (i%COLOR_COLS)*COLOR_DX; cy = top_y + (i//COLOR_COLS)*COLOR_DY
            draw_color_option(cx, cy, color, color == selected)
    draw_button("SAVE", COLOR_BTN_SAVE.x, COLOR_BTN_SAVE.y, COLOR_BTN_SAVE.width, COLOR_BTN_SAVE.height, GREEN)
# ================= MODE MENU =================
# Stage 20: Mode menu buttons (Rects used for click hit-tests)
MODE_PANEL = pygame.Rect(WIDTH//2 - 360, 150, 720, 400)
MODE_CARD_GAP = 18
MODE_CARD_W = (MODE_PANEL.width - 120 - MODE_CARD_GAP) // 2
MODE_CARD_H = 86
MODE_CARDS_TOP = MODE_PANEL.y + 140
MODE_CARD_LEFT = MODE_PANEL.x + 60
MODE_OPTION_RECTS = [
    pygame.Rect(MODE_CARD_LEFT + (i % 2) * (MODE_CARD_W + MODE_CARD_GAP), MODE_CARDS_TOP + (i // 2) * (MODE_CARD_H + MODE_CARD_GAP), MODE_CARD_W, MODE_CARD_H)
    for i in range(len(MODE_CHOICES))
]
MODE_BTN_START = pygame.Rect(WIDTH//2 - 120, MODE_PANEL.bottom - 62, 240, 50)
MODE_BTN_GUIDE = pygame.Rect(MODE_PANEL.x + 60, MODE_PANEL.y + 96, 130, 38)
MODE_BTN_LEADERBOARD = pygame.Rect(MODE_BTN_GUIDE.right + 12, MODE_PANEL.y + 96, 190, 38)
MODE_BTN_COLOR = pygame.Rect(MODE_BTN_LEADERBOARD.right + 12, MODE_PANEL.y + 96, 120, 38)
MODE_BTN_LEAVE = pygame.Rect(MODE_BTN_COLOR.right + 12, MODE_PANEL.y + 96, 120, 38)
COLOR_BTN_SAVE=pygame.Rect(720,560,120,50)

def draw_mode_extra_buttons():
    for label, rect, col in (("GUIDE", MODE_BTN_GUIDE, YELLOW), ("LEADERBOARD", MODE_BTN_LEADERBOARD, YELLOW), ("COLOR", MODE_BTN_COLOR, YELLOW), ("LEAVE", MODE_BTN_LEAVE, RED)):
        draw_button(label, rect.x, rect.y, rect.width, rect.height, col)

def draw_mode_option(rect, title, sub1, sub2, selected):
    mx, my = pygame.mouse.get_pos()
    hovered = rect.collidepoint(mx, my)
    base = (36, 40, 74)
    fill = lighten(base, 0.22) if hovered else base
    pygame.draw.rect(screen, (0, 0, 0), rect.move(4, 5), border_radius=12)
    pygame.draw.rect(screen, fill, rect, border_radius=12)
    pygame.draw.rect(screen, (255, 255, 255, 120), rect, width=1, border_radius=12)
    if hovered and not selected:
        pygame.draw.rect(screen, (0, 220, 255), rect.inflate(2, 2), width=2, border_radius=13)
    if selected:
        pygame.draw.rect(screen, SPECIAL_COLOR, rect, width=3, border_radius=12)
    t = font_medium.render(title, True, WHITE)
    screen.blit(t, (rect.x + 22, rect.y + 12))
    if sub1:
        s1 = font_small.render(sub1, True, (215, 225, 250))
        screen.blit(s1, (rect.x + 22, rect.y + 44))
    if sub2:
        s2 = font_small.render(sub2, True, (190, 200, 225))
        screen.blit(s2, (rect.x + 22, rect.y + 64))
    if selected:
        pygame.draw.circle(screen, SPECIAL_COLOR, (rect.right - 18, rect.y + 18), 7)
        pygame.draw.circle(screen, WHITE, (rect.right - 18, rect.y + 18), 3)

def draw_mode_screen():
    draw_panel_flame(MODE_FLAME_FRAMES, MODE_PANEL.x, MODE_PANEL.y, pad=26)
    draw_panel(MODE_PANEL.x, MODE_PANEL.y, MODE_PANEL.width, MODE_PANEL.height)
    blit_center_text(font_big, "CHOOSE MODE", WHITE, WIDTH//2, MODE_PANEL.y + 52)
    draw_mode_extra_buttons()
    for i, (name, cfg, flavor) in enumerate(MODE_CHOICES):
        obs = cfg[1]
        draw_mode_option(MODE_OPTION_RECTS[i], name, flavor, f"Obstacles: {obs}", i == mode_selected_idx)
    draw_button("NEXT", MODE_BTN_START.x, MODE_BTN_START.y, MODE_BTN_START.width, MODE_BTN_START.height, GREEN)

# ================= PET SELECT =================
# Stage 20a: Pet selection UI
PET_PANEL = pygame.Rect(WIDTH//2 - 460, 170, 920, 460)
PET_CARD_W, PET_CARD_H = 320, 120
PET_CARD_GAP_X, PET_CARD_GAP_Y = 24, 20
PET_GRID_W = PET_CARD_W*2 + PET_CARD_GAP_X
PET_GRID_H = PET_CARD_H*2 + PET_CARD_GAP_Y
PET_GRID_X = PET_PANEL.x + (PET_PANEL.width - PET_GRID_W)//2
PET_GRID_Y = PET_PANEL.y + 120
PET_RECTS = []
for i in range(4):
    row = i // 2
    col = i % 2
    PET_RECTS.append(pygame.Rect(PET_GRID_X + col*(PET_CARD_W + PET_CARD_GAP_X), PET_GRID_Y + row*(PET_CARD_H + PET_CARD_GAP_Y), PET_CARD_W, PET_CARD_H))
PET_BTN_NEXT = pygame.Rect(PET_PANEL.right - 240, PET_PANEL.bottom - 70, 180, 52)
PET_BTN_BACK = pygame.Rect(PET_PANEL.x + 60, PET_PANEL.bottom - 70, 180, 52)
def draw_pet_select_screen():
    draw_panel(PET_PANEL.x, PET_PANEL.y, PET_PANEL.width, PET_PANEL.height)
    blit_center_text(font_big, "CHOOSE PET", WHITE, WIDTH//2, PET_PANEL.y + 70)

    mx, my = pygame.mouse.get_pos()
    for i, r in enumerate(PET_RECTS):
        hovered = r.collidepoint(mx, my)
        selected = (i == pet_selected_idx)
        pygame.draw.rect(screen, (0, 0, 0), r.move(5, 6), border_radius=14)
        pygame.draw.rect(screen, (30, 34, 62), r, border_radius=14)
        pygame.draw.rect(screen, (255, 255, 255, 110), r, width=1, border_radius=14)
        if hovered and not selected:
            pygame.draw.rect(screen, (0, 220, 255), r.inflate(2, 2), width=2, border_radius=15)
        if selected:
            pygame.draw.rect(screen, SPECIAL_COLOR, r, width=3, border_radius=14)

        name, spr = PET_CHOICES[i]
        if spr:
            icon = pygame.transform.smoothscale(spr, (72, 72))
            screen.blit(icon, (r.x + 18, r.y + 24))
        label = font_medium.render(name, True, WHITE)
        screen.blit(label, (r.x + 112, r.y + 44))

    draw_button("BACK", PET_BTN_BACK.x, PET_BTN_BACK.y, PET_BTN_BACK.width, PET_BTN_BACK.height, RED)
    draw_button("OK", PET_BTN_NEXT.x, PET_BTN_NEXT.y, PET_BTN_NEXT.width, PET_BTN_NEXT.height, GREEN)

# ================= BACKGROUND SELECT =================
# Stage 20b: Background selection UI (5 backgrounds)
BG_PANEL = pygame.Rect(WIDTH//2 - 500, 150, 1000, 520)
BG_CARD_W, BG_CARD_H = 280, 140
BG_CARD_GAP_X, BG_CARD_GAP_Y = 34, 28
BG_BTN_NEXT = pygame.Rect(BG_PANEL.right - 240, BG_PANEL.bottom - 70, 190, 50)
BG_BTN_BACK = pygame.Rect(BG_PANEL.x + 50, BG_PANEL.bottom - 70, 190, 50)

def _build_bg_rects():
    # Layout: 3 cards on row 1, 2 cards on row 2, all centered inside panel.
    top_y = BG_PANEL.y + 120
    total_w_row1 = 3 * BG_CARD_W + 2 * BG_CARD_GAP_X
    start_x_row1 = BG_PANEL.x + (BG_PANEL.width - total_w_row1) // 2
    row1 = [pygame.Rect(start_x_row1 + i * (BG_CARD_W + BG_CARD_GAP_X), top_y, BG_CARD_W, BG_CARD_H) for i in range(3)]

    top_y2 = top_y + BG_CARD_H + BG_CARD_GAP_Y
    total_w_row2 = 2 * BG_CARD_W + 1 * BG_CARD_GAP_X
    start_x_row2 = BG_PANEL.x + (BG_PANEL.width - total_w_row2) // 2
    row2 = [pygame.Rect(start_x_row2 + i * (BG_CARD_W + BG_CARD_GAP_X), top_y2, BG_CARD_W, BG_CARD_H) for i in range(2)]

    return row1 + row2

def draw_bg_select_screen():
    draw_panel(BG_PANEL.x, BG_PANEL.y, BG_PANEL.width, BG_PANEL.height)
    blit_center_text(font_big, "CHOOSE BACKGROUND", WHITE, WIDTH//2, BG_PANEL.y + 60)
    subtitle = font_small.render("Files: background 1.jpg ... background 5.jpg", True, (210, 220, 245))
    screen.blit(subtitle, subtitle.get_rect(center=(WIDTH//2, BG_PANEL.y + 104)))

    mx, my = pygame.mouse.get_pos()
    bg_rects = _build_bg_rects()
    for i, r in enumerate(bg_rects):
        hovered = r.collidepoint(mx, my)
        selected = (i == selected_bg_idx)
        pygame.draw.rect(screen, (0, 0, 0), r.move(5, 6), border_radius=14)
        pygame.draw.rect(screen, (30, 34, 62), r, border_radius=14)
        pygame.draw.rect(screen, (255, 255, 255, 110), r, width=1, border_radius=14)
        if hovered and not selected:
            pygame.draw.rect(screen, (0, 220, 255), r.inflate(2, 2), width=2, border_radius=15)
        if selected:
            pygame.draw.rect(screen, SPECIAL_COLOR, r, width=3, border_radius=14)

        img = bg_images[i] if i < len(bg_images) else None
        if img:
            thumb = pygame.transform.smoothscale(img, (r.width - 12, r.height - 44))
            screen.blit(thumb, (r.x + 6, r.y + 6))
        else:
            missing = pygame.Surface((r.width - 12, r.height - 44))
            missing.fill((10, 12, 26))
            pygame.draw.rect(missing, (255, 255, 255), missing.get_rect(), width=1, border_radius=10)
            screen.blit(missing, (r.x + 6, r.y + 6))
            t = font_small.render("Missing file", True, (180, 190, 215))
            screen.blit(t, t.get_rect(center=(r.centerx, r.y + 74)))

        label = font_medium.render(f"Background {i+1}", True, WHITE)
        screen.blit(label, (r.x + 12, r.bottom - 36))

    draw_button("BACK", BG_BTN_BACK.x, BG_BTN_BACK.y, BG_BTN_BACK.width, BG_BTN_BACK.height, RED)
    draw_button("Start game", BG_BTN_NEXT.x, BG_BTN_NEXT.y, BG_BTN_NEXT.width, BG_BTN_NEXT.height, GREEN)
# ================= MAIN LOOP =================
# Stage 21: Runtime game variables + per-frame loop
running = True
snake = [[GRID_W//2, GRID_H//2]]
enemy = [[GRID_W//2 + 5, GRID_H//2]]
direction = "RIGHT"
score = 0
mode_name = ""
win_score = 0
last_mode_cfg = None
obstacles = []
apple = random_grid(snake + obstacles + enemy)
def start_game(cfg):
    global win_score, mode_name, snake, enemy, direction, score, obstacles, apple, special_item, special_type, special_spawn_time, last_special_spawn, gun_item, gun_spawn_time, gun_visible_ai_after, last_gun_spawn, player_has_gun, enemy_has_gun, player_gun_ammo, enemy_gun_ammo, bullets, shake_until, state
    win_score, obs_count, mode_name = cfg
    snake = [[GRID_W//2, GRID_H//2]]
    enemy = [[random.randint(0, GRID_W-1), random.randint(0, GRID_H-1)]]
    direction = "RIGHT"; score = 0

    # Stage 21b: Start with +1 segment for both (does not add score).
    # This keeps movement looking like a real snake (head + at least one body segment).
    # Player: extend behind initial RIGHT direction.
    snake.append([snake[0][0] - 1, snake[0][1]])
    # Enemy: extend to any adjacent safe cell (prefer left).
    ex, ey = enemy[0][0], enemy[0][1]
    candidates = [[ex - 1, ey], [ex + 1, ey], [ex, ey - 1], [ex, ey + 1]]
    candidates = [p for p in candidates if 0 <= p[0] < GRID_W and 0 <= p[1] < GRID_H and p not in snake and p not in enemy]
    enemy.append(candidates[0] if candidates else [ex, ey])
    obstacles = [random_grid(snake+enemy) for _ in range(obs_count)]
    apple = random_grid(snake+obstacles+enemy)
    special_item = None; special_type = None; special_spawn_time = 0; last_special_spawn = pygame.time.get_ticks()
    gun_item = None; gun_spawn_time = 0; gun_visible_ai_after = 0; last_gun_spawn = pygame.time.get_ticks()
    player_has_gun = False; enemy_has_gun = False; player_gun_ammo = 0; enemy_gun_ammo = 0
    bullets = []; shake_until = 0
    state = STATE_PLAY
def start_selected_mode():
    global last_mode_cfg
    cfg = MODE_CHOICES[mode_selected_idx][1]
    last_mode_cfg = cfg
    start_game(cfg)
while running:
    # Stage 22: Frame begin (timing + background)
    # Splash runs at 60 FPS for smoother video playback; gameplay uses SPEED.
    clock.tick(60 if state == STATE_SPLASH else SPEED)
    if state == STATE_SPLASH:
        screen.fill((0, 0, 0))
    else:
        draw_background()
    # Stage 23: Update/render by current UI/game state
    if state == STATE_SPLASH:
        if draw_splash_screen():
            state = STATE_NAME
    elif state == STATE_PLAY:
        current_time = pygame.time.get_ticks()
        screen.blit(grid_overlay, (0, 0))
        if special_item is None and current_time - last_special_spawn > 5000:
            spawn_special()
            last_special_spawn = current_time
        if special_item and current_time - special_spawn_time > 3000:
            special_item = None
        if gun_item is None and current_time - last_gun_spawn > 11000:
            spawn_gun(current_time)
            last_gun_spawn = current_time
        if gun_item and current_time - gun_spawn_time > 7000:
            gun_item = None
        for ob in obstacles:
            draw_obstacle_cell(ob)
        draw_apple(apple)
        draw_special()
        draw_gun()
        draw_snake_with_shadow(snake, PLAYER_COLOR)
        draw_snake_with_shadow(enemy, ENEMY_COLOR)
        draw_hud(f"{player_name} | Score: {score} | High: {high_score}")
        head = snake[0].copy()
        dx, dy = DIR_VEC.get(direction, (0, 0))
        head[0] += dx
        head[1] += dy
        snake.insert(0, head)
        if head == apple:
            sound_eat.play()
            score += 1
            apple = random_grid(snake+obstacles+enemy)
        else:
            snake.pop()
        if special_item and head == special_item:
            value = random.randint(1,3)
            if special_type == "buff":
                score += value
                for _ in range(value):
                    snake.append(snake[-1].copy())
                sound_buff.play()
            else:
                score -= value
                if score < 0:
                    score = 0
                for _ in range(value):
                    if len(snake) > MIN_SNAKE_LEN:
                        snake.pop()
            special_item = None
        if gun_item and head == gun_item:
            player_has_gun = True
            player_gun_ammo = 1
            gun_item = None
        move_enemy()
        if player_has_gun and player_gun_ammo > 0:
            before = len(bullets)
            fire_bullet("player", current_time)
            if len(bullets) > before:
                player_gun_ammo -= 1
                if player_gun_ammo <= 0:
                    player_has_gun = False
        if enemy_has_gun and enemy_gun_ammo > 0:
            before = len(bullets)
            fire_bullet("enemy", current_time)
            if len(bullets) > before:
                enemy_gun_ammo -= 1
                if enemy_gun_ammo <= 0:
                    enemy_has_gun = False
        update_bullets(current_time)
        draw_bullets()
        collision_enemy = head in enemy
        if (
            head[0]<0 or head[0]>=GRID_W or
            head[1]<0 or head[1]>=GRID_H or
            head in snake[1:] or
            head in obstacles or
            collision_enemy
        ):
            sound_lose.play()
            save_leaderboard(player_name,score,mode_name)
            if score > high_score:
                save_high_score(score)
            end_message = "YOU LOSE"
            if pet_enabled:
                pet_say("Keep going!!!", duration_ms=3200)
            selected_bg_idx = 0
            state = STATE_END
        if mode_name!="INFINITE" and score >= win_score:
            sound_win.play()
            save_leaderboard(player_name,score,mode_name)
            if score > high_score:
                save_high_score(score)
            end_message = "YOU WIN"
            if pet_enabled:
                pet_say("You're awesome!", duration_ms=3200)
            selected_bg_idx = 0
            state = STATE_END

        if current_time < shake_until:
            dx = random.randint(-4, 4)
            dy = random.randint(-4, 4)
            snap = screen.copy()
            screen.fill((0, 0, 0))
            screen.blit(snap, (dx, dy))
    elif state == STATE_NAME:
        px, py = WIDTH//2-430, 160; draw_panel(px, py, 860, 440)
        c_hint = (210, 220, 245)
        title = font_big.render("ENTER YOUR NAME", True, WHITE); screen.blit(title, title.get_rect(center=(WIDTH//2, py+85)))
        hint = font_small.render("Type and press Enter. Backspace to delete.", True, c_hint); screen.blit(hint, hint.get_rect(center=(WIDTH//2, py+140)))
        box = pygame.Rect(WIDTH//2-320, py+200, 640, 78)
        box_s = _soft_rect_surface(box.width, box.height, (0, 0, 0, 130), radius=16, inset=4, inset_border_rgba=(255, 255, 255, 55), inset_border_w=2); screen.blit(box_s, box.topleft)
        show = (pygame.time.get_ticks() // 500) % 2 == 0; name = player_name or "Your name..."; col = GREEN if player_name else (170, 180, 210)
        txt = font_medium.render(name + ("|" if (show and player_name) else ""), True, col); screen.blit(txt, (box.x+22, box.y+22))
        hint2 = font_small.render("Press Enter to continue", True, c_hint); screen.blit(hint2, hint2.get_rect(center=(WIDTH//2, py+360)))
    elif state == STATE_PET_SELECT:
        draw_pet_select_screen()
    elif state == STATE_GUIDE:
        clamp_guide_scroll()
        draw_guide_screen()
    elif state == STATE_BG_SELECT:
        draw_bg_select_screen()
    elif state == STATE_MODE:
        draw_mode_screen()
    elif state == STATE_LEADERBOARD_VIEW:
        draw_leaderboard_screen()
    elif state == STATE_COLOR_SELECT:
        draw_color_select()
    elif state == STATE_END:
        outline = font_big.render(end_message, True, BLACK)
        color = (0,255,0) if end_message=="YOU WIN" else (255,0,0)
        text = font_big.render(end_message, True, color)
        rect = text.get_rect(center=(WIDTH//2,120))
        screen.blit(outline,(rect.x+3,rect.y+3))
        screen.blit(text,rect)
        px, py, pw, ph = WIDTH//2-520, 190, 1040, 590
        draw_panel(px, py, pw, ph)
        t = font_medium.render("LEADERBOARD", True, (235, 245, 255))
        screen.blit(t, t.get_rect(center=(px + pw//2, py + 46)))
        draw_leaderboard_list(px+60, py+70, w=pw-120, row_h=40)
        draw_pill_hint("P: Play Again", WIDTH//2-170, py+ph-48)
        draw_pill_hint("M: Menu", WIDTH//2+170, py+ph-48)

    if pet_enabled and state not in (STATE_SPLASH, STATE_PLAY, STATE_PET_SELECT):
        update_pet_motion()
        draw_pet_ui()
    # Stage 24: Input/events (mouse + keyboard)
    for event in pygame.event.get():
        # Event: quit window
        if event.type == pygame.QUIT:
            running = False
        if state == STATE_SPLASH:
            continue
        # Event: mouse wheel scroll (guide)
        if event.type == pygame.MOUSEWHEEL:
            if state == STATE_GUIDE:
                guide_scroll -= event.y * 30
                clamp_guide_scroll()
        # Event: mouse down (buttons + picking + guide scrollbar)
        if event.type == pygame.MOUSEBUTTONDOWN:
            # Important: handle only the state at the time of the click.
            # Otherwise a click that changes state could be re-processed by the next state's buttons.
            mx, my = pygame.mouse.get_pos()
            if state == STATE_PET_SELECT:
                if PET_BTN_BACK.collidepoint(mx, my):
                    state = STATE_NAME
                elif PET_BTN_NEXT.collidepoint(mx, my):
                    pet_enabled = True
                    state = STATE_GUIDE
                else:
                    for i, r in enumerate(PET_RECTS):
                        if r.collidepoint(mx, my):
                            pet_selected_idx = i
                            break
            elif state == STATE_GUIDE:
                if GUIDE_BUTTON.collidepoint(mx, my):
                    guide_dragging = False
                    state = STATE_MODE
                elif get_guide_thumb_rect().collidepoint(mx, my):
                    guide_dragging = True
                elif GUIDE_SCROLLBAR.collidepoint(mx, my):
                    thumb = get_guide_thumb_rect()
                    max_scroll = get_guide_max_scroll()
                    if max_scroll > 0:
                        travel = GUIDE_SCROLLBAR.height - thumb.height
                        if travel > 0:
                            relative = my - GUIDE_SCROLLBAR.y - thumb.height // 2
                            relative = max(0, min(travel, relative))
                            guide_scroll = int(max_scroll * relative / travel)
                            clamp_guide_scroll()
            elif state == STATE_MODE:
                if MODE_BTN_GUIDE.collidepoint(mx, my):
                    guide_scroll = 0
                    guide_dragging = False
                    state = STATE_GUIDE
                elif MODE_BTN_LEADERBOARD.collidepoint(mx, my):
                    state = STATE_LEADERBOARD_VIEW
                elif MODE_BTN_COLOR.collidepoint(mx, my):
                    state = STATE_COLOR_SELECT
                elif MODE_BTN_LEAVE.collidepoint(mx, my):
                    state = STATE_NAME
                elif MODE_BTN_START.collidepoint(mx, my):
                    state = STATE_BG_SELECT
                else:
                    for i, r in enumerate(MODE_OPTION_RECTS):
                        if r.collidepoint(mx, my):
                            mode_selected_idx = i
                            break
            elif state == STATE_BG_SELECT:
                if BG_BTN_BACK.collidepoint(mx, my):
                    state = STATE_MODE
                elif BG_BTN_NEXT.collidepoint(mx, my):
                    start_selected_mode()
                else:
                    for i, r in enumerate(_build_bg_rects()):
                        if r.collidepoint(mx, my):
                            selected_bg_idx = i
                            break
            elif state == STATE_COLOR_SELECT:
                c = pick_color(mx, my, PLAYER_GRID_TOP)
                if c:
                    player_select = c
                c = pick_color(mx, my, ENEMY_GRID_TOP)
                if c:
                    enemy_select = c
                if COLOR_BTN_SAVE.collidepoint(mx, my):
                    PLAYER_COLOR = player_select
                    ENEMY_COLOR = enemy_select
                    state = STATE_MODE
        # Event: mouse up (stop dragging scrollbar)
        if event.type == pygame.MOUSEBUTTONUP:
            if event.button == 1:
                guide_dragging = False
        # Event: mouse motion (drag guide scrollbar)
        if event.type == pygame.MOUSEMOTION:
            if state == STATE_GUIDE and guide_dragging:
                thumb = get_guide_thumb_rect()
                max_scroll = get_guide_max_scroll()
                travel = GUIDE_SCROLLBAR.height - thumb.height
                if max_scroll > 0 and travel > 0:
                    relative = event.pos[1] - GUIDE_SCROLLBAR.y - thumb.height // 2
                    relative = max(0, min(travel, relative))
                    guide_scroll = int(max_scroll * relative / travel)
                    clamp_guide_scroll()
        # Event: key down (typing name, choosing mode, moving)
        if event.type == pygame.KEYDOWN:
            if state == STATE_NAME:
                if event.key == pygame.K_RETURN:
                    guide_scroll = 0
                    guide_dragging = False
                    state = STATE_PET_SELECT
                elif event.key == pygame.K_BACKSPACE:
                    player_name = player_name[:-1]
                else:
                    player_name += event.unicode
            elif state == STATE_PET_SELECT:
                if event.key in (pygame.K_ESCAPE, pygame.K_BACKSPACE):
                    state = STATE_NAME
                elif event.key in CONFIRM_KEYS:
                    pet_enabled = True
                    state = STATE_GUIDE
                elif event.key in (pygame.K_LEFT, pygame.K_a, pygame.K_RIGHT, pygame.K_d):
                    pet_selected_idx = (pet_selected_idx + 1) % 4
                elif event.key in (pygame.K_UP, pygame.K_w, pygame.K_DOWN, pygame.K_s):
                    pet_selected_idx = (pet_selected_idx + 2) % 4
            elif state == STATE_MODE:
                n = len(MODE_CHOICES)
                if event.key in (pygame.K_LEFT, pygame.K_a):
                    if n == 4:
                        mode_selected_idx = mode_selected_idx + 1 if (mode_selected_idx % 2 == 0) else mode_selected_idx - 1
                    else:
                        mode_selected_idx = (mode_selected_idx - 1) % n
                elif event.key in (pygame.K_RIGHT, pygame.K_d):
                    if n == 4:
                        mode_selected_idx = mode_selected_idx + 1 if (mode_selected_idx % 2 == 0) else mode_selected_idx - 1
                    else:
                        mode_selected_idx = (mode_selected_idx + 1) % n
                elif event.key in (pygame.K_UP, pygame.K_w):
                    if n == 4:
                        mode_selected_idx = mode_selected_idx + 2 if mode_selected_idx < 2 else mode_selected_idx - 2
                    else:
                        mode_selected_idx = (mode_selected_idx - 1) % n
                elif event.key in (pygame.K_DOWN, pygame.K_s):
                    if n == 4:
                        mode_selected_idx = mode_selected_idx - 2 if mode_selected_idx >= 2 else mode_selected_idx + 2
                    else:
                        mode_selected_idx = (mode_selected_idx + 1) % n
                elif event.key in CONFIRM_KEYS:
                    state = STATE_BG_SELECT
            elif state == STATE_BG_SELECT:
                if event.key in (pygame.K_ESCAPE, pygame.K_BACKSPACE):
                    state = STATE_MODE
                elif event.key in CONFIRM_KEYS:
                    start_selected_mode()
                elif event.key in (pygame.K_LEFT, pygame.K_a):
                    selected_bg_idx = (selected_bg_idx - 1) % len(BG_FILES)
                elif event.key in (pygame.K_RIGHT, pygame.K_d):
                    selected_bg_idx = (selected_bg_idx + 1) % len(BG_FILES)
                elif event.key in (pygame.K_UP, pygame.K_w):
                    selected_bg_idx = (selected_bg_idx - 3) % len(BG_FILES)
                elif event.key in (pygame.K_DOWN, pygame.K_s):
                    selected_bg_idx = (selected_bg_idx + 3) % len(BG_FILES)
            elif state == STATE_PLAY:
                di = DIR_INPUT.get(event.key)
                if di:
                    new_dir, opposite = di
                    if direction != opposite:
                        direction = new_dir
            elif state == STATE_END:
                if event.key==pygame.K_m:
                    state=STATE_MODE
                elif event.key==pygame.K_p and last_mode_cfg:
                    start_game(last_mode_cfg)
            elif state == STATE_LEADERBOARD_VIEW:
                if event.key == pygame.K_m:
                    state = STATE_MODE
    # Stage 25: Present frame
    pygame.display.flip()
