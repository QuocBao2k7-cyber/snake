
(() => {
  const WIDTH = 1542;
  const HEIGHT = 800;
  const CELL = 20;
  const SPEED = 5;
  const GRID_W = Math.floor(WIDTH / CELL);
  const GRID_H = Math.floor(HEIGHT / CELL);

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const hint = document.getElementById('hint');

  const STATE_SPLASH = 0;
  const STATE_NAME = 1;
  const STATE_PET_SELECT = 2;
  const STATE_GUIDE = 3;
  const STATE_BG_SELECT = 4;
  const STATE_MODE = 5;
  const STATE_PLAY = 6;
  const STATE_END = 7;
  const STATE_LEADERBOARD_VIEW = 8;
  const STATE_COLOR_SELECT = 9;
  const STATE_SETTINGS = 10;
  const STATE_AUTH = 11;

  const WHITE = [255,255,255];
  const GREEN = [0,255,0];
  const RED = [255,0,0];
  const ORANGE = [255,165,0];
  const YELLOW = [255,255,0];
  const SPECIAL_COLOR = [0,255,255];
  const BLACK = [0,0,0];
  const GOLD = [255,215,0];

  const PANEL_BG = [22,26,50];
  const PANEL_INNER = [48,56,96];
  const PANEL_BORDER = [130,170,255];
  const PANEL_GLOW = [90,180,255];

  const CONFIRM_KEYS = new Set(['Enter', ' ']);

  const MODE_CHOICES = [
    ["EASY", [5,20,"EASY"], "mode_relaxed"],
    ["NORMAL", [10,30,"NORMAL"], "mode_balanced"],
    ["HARD", [15,50,"HARD"], "mode_hard_sub"],
    ["INFINITE", [999999,35,"INFINITE"], "mode_endless"],
  ];

  const color_options = [
    ["color_yellow", [255,255,0]],
    ["color_red", [255,0,0]],
    ["color_green", [0,255,0]],
    ["color_blue", [0,120,255]],
    ["color_purple", [160,60,255]],
    ["color_pink", [255,105,180]],
    ["color_orange", [255,165,0]],
  ];

  const GUIDE_SECTIONS_EN = [
    ["RULE", ["Eat apples to increase score and reach the target.", "Easy: 5 apples", "Normal: 10 apples", "Hard: 15 apples"]],
    ["Controls", ["Move using Arrow Keys."]],
    ["Rival AI", ["The enemy snake also chases apples.", "Touching the enemy body will end the game."]],
    ["ITEM", ["80% Buff | 20% Harm.", "Buff/Harm changes score and length by 1 to 3 points.", "Gun: If 1 bullet is attached, 1 point and length will be deducted"]],
    ["DEFEAT CONDITIONS", ["Hit wall.", "Hit your body.", "Hit obstacle.", "Hit enemy body."]],
    ["INFINITE MODE", ["No score limit.", "If you have only 1 point/length and eat an item that reduces your score, you will lose immediately."]],
  ];
  const GUIDE_SECTIONS_VI = [
    ["LUẬT", ["Ăn táo để tăng điểm và đạt mục tiêu.", "Dễ: 5 táo", "Bình thường: 10 táo", "Khó: 15 táo"]],
    ["Điều khiển", ["Di chuyển bằng phím mũi tên."]],
    ["AI đối thủ", ["Rắn địch cũng đi săn táo.", "Chạm vào thân rắn địch sẽ thua."]],
    ["VẬT PHẨM", ["80% Tăng ích | 20% Bất lợi.", "Hiệu ứng tăng/giảm thay đổi điểm và độ dài từ 1 đến 3.", "Súng: nếu dính 1 viên, trừ 1 điểm và 1 độ dài"]],
    ["ĐIỀU KIỆN THUA", ["Đụng tường.", "Đụng thân mình.", "Đụng vật cản.", "Đụng thân địch."]],
    ["CHẾ ĐỘ VÔ HẠN", ["Không có giới hạn điểm.", "Nếu chỉ còn 1 điểm/độ dài và ăn vật phẩm giảm điểm thì sẽ thua ngay."]],
  ];
  function getGuideSections() {
    return lang === "vi" ? GUIDE_SECTIONS_VI : GUIDE_SECTIONS_EN;
  }

  const BG_FILES = [
    "background 1.jpg",
    "background 2.jpg",
    "background 3.jpg",
    "background 4.jpg",
    "background 5.jpg",
    "background 6.jpg",
    "background 7.jpg",
    "background 8.jpg",
    "background 9.jpg",
    "background 10.jpg",
  ];

  function makeRng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function makePoints(seed, count, minR, maxR) {
    const rnd = makeRng(seed);
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: rnd(),
        y: rnd(),
        r: minR + (maxR - minR) * rnd(),
        phase: rnd() * Math.PI * 2
      });
    }
    return arr;
  }

  const BG_BOKEH = [
    makePoints(11, 14, 0.08, 0.22), // space
    makePoints(21, 10, 0.10, 0.24), // forest
    makePoints(31, 12, 0.10, 0.26), // temple warm
    makePoints(41, 12, 0.10, 0.28), // sunset city
    makePoints(51, 10, 0.08, 0.22), // modern glass
  ];
  const BG_STARS = [
    makePoints(101, 90, 0.002, 0.008),
    makePoints(102, 60, 0.002, 0.006),
    makePoints(103, 70, 0.002, 0.007),
    makePoints(104, 90, 0.002, 0.008),
    makePoints(105, 60, 0.002, 0.006),
  ];

  const ASSET = {
    images: new Map(),
    flames: {
      mode: [],
      guide: [],
      color: [],
      leaderboard: [],
    }
  };

  const PANEL_SIZES = [
    [860,440],[1160,620],[720,400],[1080,560],[1040,680],[850,520],[1040,590],[760,40],[760,34]
  ];

  const PET_CHOICES = [
    ["Penguin", "do_hoa_assets/pet_penguin_64.png"],
    ["Cat", "do_hoa_assets/pet_cat_64.png"],
    ["Dog", "do_hoa_assets/pet_dog_64.png"],
    ["Parrot", "do_hoa_assets/pet_parrot_64.png"],
  ];

  const audio = {
    bg: new Audio("bg.mp3"),
    eat: new Audio("eat.mp3"),
    win: new Audio("win.mp3"),
    lose: new Audio("lose.mp3"),
    buff: new Audio("buff.mp3"),
    sword: new Audio("sword.mp3"),
    bow: new Audio("bow.mp3"),
    gun: new Audio("gun.mp3"),
  };
  audio.bg.loop = true;
  audio.bg.volume = 0.5;

  // i18n
  let lang = localStorage.getItem("snake_lang") || "vi";
  const STR = {
    en: {
      choose_mode: "CHOOSE MODE",
      guide: "GUIDE",
      leaderboard: "LEADERBOARD",
      color: "COLOR",
      settings: "SETTINGS",
      leave: "LEAVE",
      next: "NEXT",
      choose_bg: "CHOOSE BACKGROUND",
      start_game: "Start game",
      color_select: "COLOR SELECT",
      save: "SAVE",
      enter_name: "ENTER YOUR NAME",
      press_enter: "Press Enter to continue",
      click_swatch: "Click a color swatch to select.",
      role_guide: "RULE / GUIDE",
      paused: "PAUSED",
      resume_hint: "Press P to resume",
      sound_hint: "P: Pause  |  B: Mute",
      settings_title: "SOUND & LANGUAGE",
      music_vol: "Music Volume",
      sfx_vol: "SFX Volume",
      language: "Language",
      english: "English",
      vietnamese: "Vietnamese",
      back: "BACK",
      profile: "PROFILE",
      total_games: "Total games",
      total_score: "Total score",
      music: "Music",
      classic: "Classic",
      silent: "Silent",
      guide_subtitle: "Scroll or drag the bar on the right to view all instructions.",
      type_hint: "Type and press Enter. Backspace to delete.",
      your_name: "Your name...",
      selected: "Selected",
      obstacles: "Obstacles",
      rank: "RANK",
      name: "NAME",
      score: "SCORE",
      mode: "MODE",
      leaderboard_sub: "Top 10 players (best per player). INFINITE is gold.",
      menu_hint: "M: Menu",
      play_again: "P: Play Again",
      choose_pet: "CHOOSE PET",
      ok: "OK",
      loading: "Loading...",
      hint_audio: "Click to start audio. Use Arrow Keys to move.",
      mode_relaxed: "Relaxed",
      mode_balanced: "Balanced",
      mode_hard_sub: "High obstacles",
      mode_endless: "Endless",
      mode_easy: "EASY",
      mode_normal: "NORMAL",
      mode_hard: "HARD",
      mode_infinite: "INFINITE",
      resume: "RESUME",
      muted: "MUTED",
      sound_on: "SOUND ON",
      player: "PLAYER",
      enemy: "ENEMY",
      color_yellow: "Yellow",
      color_red: "Red",
      color_green: "Green",
      color_blue: "Blue",
      color_purple: "Purple",
      color_pink: "Pink",
      color_orange: "Orange",
      color_custom: "Custom",
      auth_title_login: "LOGIN",
      auth_title_register: "REGISTER",
      auth_username: "Username",
      auth_password: "Password",
      auth_confirm: "Confirm password",
      auth_submit_login: "LOGIN",
      auth_submit_register: "REGISTER",
      auth_switch_login: "Already have an account? Login",
      auth_switch_register: "New here? Register",
      auth_error_mismatch: "Please check your password",
      auth_error_invalid: "Please check username and password",
      auth_error_exists: "Username already exists",
      account: "Account",
      not_logged_in: "Not logged in",
    },
    vi: {
      choose_mode: "CHỌN CHẾ ĐỘ",
      guide: "HƯỚNG DẪN",
      leaderboard: "BẢNG XẾP HẠNG",
      color: "MÀU",
      settings: "CÀI ĐẶT",
      leave: "THOÁT",
      next: "TIẾP",
      choose_bg: "CHỌN NỀN",
      start_game: "Bắt đầu",
      color_select: "CHỌN MÀU",
      save: "LƯU",
      enter_name: "NHẬP TÊN",
      press_enter: "Nhấn Enter để tiếp tục",
      click_swatch: "Nhấn vào màu để chọn.",
      role_guide: "LUẬT / HƯỚNG DẪN",
      paused: "TẠM DỪNG",
      resume_hint: "Nhấn P để tiếp tục",
      sound_hint: "P: Tạm dừng  |  B: Tắt/Bật âm",
      settings_title: "ÂM THANH & NGÔN NGỮ",
      music_vol: "Âm nhạc",
      sfx_vol: "Hiệu ứng",
      language: "Ngôn ngữ",
      english: "Tiếng Anh",
      vietnamese: "Tiếng Việt",
      back: "QUAY LẠI",
      profile: "HỒ SƠ",
      total_games: "Tổng ván",
      total_score: "Tổng điểm",
      music: "Nhạc nền",
      classic: "Cổ điển",
      silent: "Im lặng",
      guide_subtitle: "Lăn chuột hoặc kéo thanh bên phải để xem toàn bộ hướng dẫn.",
      type_hint: "Gõ và nhấn Enter. Backspace để xóa.",
      your_name: "Tên của bạn...",
      selected: "Đã chọn",
      obstacles: "Vật cản",
      rank: "HẠNG",
      name: "TÊN",
      score: "ĐIỂM",
      mode: "CHẾ ĐỘ",
      leaderboard_sub: "Top 10 người chơi (mỗi người 1 dòng). VÔ HẠN tô vàng.",
      menu_hint: "M: Menu",
      play_again: "P: Chơi lại",
      choose_pet: "CHỌN THÚ CƯNG",
      ok: "ĐỒNG Ý",
      loading: "Đang tải...",
      hint_audio: "Nhấn để bật âm thanh. Dùng phím mũi tên để di chuyển.",
      mode_relaxed: "Thư giãn",
      mode_balanced: "Cân bằng",
      mode_hard_sub: "Nhiều vật cản",
      mode_endless: "Bất tận",
      mode_easy: "DỄ",
      mode_normal: "BÌNH THƯỜNG",
      mode_hard: "KHÓ",
      mode_infinite: "VÔ HẠN",
      resume: "TIẾP TỤC",
      muted: "TẮT ÂM",
      sound_on: "BẬT ÂM",
      player: "NGƯỜI CHƠI",
      enemy: "KẺ ĐỊCH",
      color_yellow: "Vàng",
      color_red: "Đỏ",
      color_green: "Xanh lá",
      color_blue: "Xanh dương",
      color_purple: "Tím",
      color_pink: "Hồng",
      color_orange: "Cam",
      color_custom: "Tùy chỉnh",
      auth_title_login: "ĐĂNG NHẬP",
      auth_title_register: "ĐĂNG KÝ",
      auth_username: "Tên đăng nhập",
      auth_password: "Mật khẩu",
      auth_confirm: "Xác nhận mật khẩu",
      auth_submit_login: "ĐĂNG NHẬP",
      auth_submit_register: "ĐĂNG KÝ",
      auth_switch_login: "Đã có tài khoản? Đăng nhập",
      auth_switch_register: "Chưa có tài khoản? Đăng ký",
      auth_error_mismatch: "Hãy xem lại mật khẩu",
      auth_error_invalid: "Hãy xem lại tên đăng nhập và mật khẩu",
      auth_error_exists: "Tên đăng nhập đã tồn tại",
      account: "Tài khoản",
      not_logged_in: "Chưa đăng nhập",
    },
  };
  function t(key) {
    return (STR[lang] && STR[lang][key]) || key;
  }

  function modeTitle(code) {
    if (code === "EASY") return t("mode_easy");
    if (code === "NORMAL") return t("mode_normal");
    if (code === "HARD") return t("mode_hard");
    if (code === "INFINITE") return t("mode_infinite");
    return code;
  }

  function updateHintText() {
    if (hint) hint.textContent = t("hint_audio");
  }

  // Sound settings
  let musicVolume = parseFloat(localStorage.getItem("snake_music_vol") || "0.5");
  let sfxVolume = parseFloat(localStorage.getItem("snake_sfx_vol") || "0.7");
  let musicChoice = localStorage.getItem("snake_music_choice") || "classic";

  let audioUnlocked = false;
  const unlockAudio = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    hint.textContent = "";
    audio.bg.play().catch(() => {});
  };

  const splashVideo = document.createElement('video');
  splashVideo.src = "logovanlang.mp4";
  splashVideo.muted = true;
  splashVideo.playsInline = true;
  splashVideo.preload = "auto";

  const mouse = { x: 0, y: 0, down: false };

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lighten(rgb, amount) {
    return [
      clamp(Math.round(rgb[0] + (255 - rgb[0]) * amount), 0, 255),
      clamp(Math.round(rgb[1] + (255 - rgb[1]) * amount), 0, 255),
      clamp(Math.round(rgb[2] + (255 - rgb[2]) * amount), 0, 255),
    ];
  }
  function darken(rgb, amount) {
    return [
      clamp(Math.round(rgb[0] * (1 - amount)), 0, 255),
      clamp(Math.round(rgb[1] * (1 - amount)), 0, 255),
      clamp(Math.round(rgb[2] * (1 - amount)), 0, 255),
    ];
  }
  function rgb(arr, a=1) { return `rgba(${arr[0]},${arr[1]},${arr[2]},${a})`; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
  }

  function drawTextCentered(text, x, y, size, color, weight = "600") {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px "Bahnschrift", "Trebuchet MS", "Segoe UI", sans-serif`;
    const metrics = ctx.measureText(text);
    ctx.fillText(text, x - metrics.width / 2, y);
  }

  function loadImage(path) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = path;
    });
  }

  async function loadAssets() {
    const promises = [];
    for (const [w,h] of PANEL_SIZES) {
      const key = `panel_${w}x${h}`;
      promises.push(loadImage(`do_hoa_assets/${key}.png`).then(img => ASSET.images.set(key, img)));
    }
    const names = [
      "hud_520x44", "button_base", "button_base_hover", "cell_shadow_20", "snake_base_20",
      "snake_highlight_20", "snake_head_20", "snake_body_20", "snake_tail_20",
      "obstacle_20", "apple_20", "special_buff_20", "special_harm_20", "gun_20"
    ];
    for (const n of names) {
      promises.push(loadImage(`do_hoa_assets/${n}.png`).then(img => ASSET.images.set(n, img)));
    }
    for (const [name, path] of PET_CHOICES) {
      promises.push(loadImage(path).then(img => ASSET.images.set(`pet_${name}`, img)));
    }
    for (const f of BG_FILES) {
      promises.push(loadImage(f).then(img => ASSET.images.set(f, img)));
    }
    promises.push(loadImage("do_hoa_grid.png").then(img => ASSET.images.set("grid", img)));

    const flameLoads = [];
    for (let i = 0; i < 24; i++) {
      flameLoads.push(loadImage(`mode/mode_flame_${String(i).padStart(2,'0')}.png`).then(img => ASSET.flames.mode[i] = img));
      flameLoads.push(loadImage(`guide/guide_flame_${String(i).padStart(2,'0')}.png`).then(img => ASSET.flames.guide[i] = img));
      flameLoads.push(loadImage(`color/color_flame_${String(i).padStart(2,'0')}.png`).then(img => ASSET.flames.color[i] = img));
      flameLoads.push(loadImage(`leaderboard/leaderboard_flame_${String(i).padStart(2,'0')}.png`).then(img => ASSET.flames.leaderboard[i] = img));
    }
    await Promise.all([...promises, ...flameLoads]);
  }

  function getScale() {
    const rect = canvas.getBoundingClientRect();
    return { sx: canvas.width / rect.width, sy: canvas.height / rect.height, rect };
  }

  function updateMouse(e) {
    const { sx, sy, rect } = getScale();
    mouse.x = (e.clientX - rect.left) * sx;
    mouse.y = (e.clientY - rect.top) * sy;
  }

  function rectContains(r, x, y) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  function drawCellHalo(x, y, color, alpha = 0.6, blur = 14, pad = 2) {
    ctx.save();
    ctx.shadowColor = rgb(color, alpha);
    ctx.shadowBlur = blur;
    ctx.fillStyle = rgb(color, alpha * 0.3);
    roundRect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 8);
    ctx.fill();
    ctx.restore();
  }

  function drawPanel(x, y, w, h) {
    const key = `panel_${w}x${h}`;
    const img = ASSET.images.get(key);
    if (img) {
      ctx.drawImage(img, x, y);
      return;
    }
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;
    roundRect(ctx, x+6, y+6, w, h, 14);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fill();
    ctx.restore();

    roundRect(ctx, x, y, w, h, 14);
    ctx.fillStyle = rgb(PANEL_BG);
    ctx.fill();
    roundRect(ctx, x+4, y+4, w-8, h-8, 12);
    ctx.fillStyle = rgb(PANEL_INNER);
    ctx.fill();
    ctx.save();
    ctx.shadowColor = rgb(PANEL_GLOW, 0.45);
    ctx.shadowBlur = 16;
    roundRect(ctx, x-1, y-1, w+2, h+2, 15);
    ctx.strokeStyle = rgb(PANEL_GLOW, 0.45);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    roundRect(ctx, x, y, w, h, 14);
    ctx.strokeStyle = rgb(PANEL_BORDER);
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawButton(label, r, color) {
    const hovered = rectContains(r, mouse.x, mouse.y);
    const fill = hovered ? lighten(color, 0.35) : color;
    const glow = hovered ? "rgba(0,220,255,0.8)" : "rgba(255,255,255,0.35)";

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, r.x+4, r.y+5, r.w, r.h, 12);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fill();
    ctx.restore();

    roundRect(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fillStyle = rgb(fill);
    ctx.fill();
    roundRect(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = hovered ? 3 : 2;
    ctx.stroke();
    if (hovered) {
      roundRect(ctx, r.x-1, r.y-1, r.w+2, r.h+2, 12);
      ctx.strokeStyle = glow;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.font = `700 20px "Bahnschrift", "Trebuchet MS", "Segoe UI", sans-serif`;
    const w = ctx.measureText(label).width;
    const tx = r.x + r.w/2 - w/2;
    const ty = r.y + r.h/2 + 7;
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.lineWidth = 3;
    ctx.strokeText(label, tx, ty);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, tx, ty);
  }

  function drawButtonSmall(label, r, color) {
    const hovered = rectContains(r, mouse.x, mouse.y);
    const fill = hovered ? lighten(color, 0.35) : color;
    const glow = hovered ? "rgba(0,220,255,0.8)" : "rgba(255,255,255,0.35)";

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, r.x+3, r.y+4, r.w, r.h, 10);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fill();
    ctx.restore();

    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fillStyle = rgb(fill);
    ctx.fill();
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = hovered ? 3 : 2;
    ctx.stroke();
    if (hovered) {
      roundRect(ctx, r.x-1, r.y-1, r.w+2, r.h+2, 10);
      ctx.strokeStyle = glow;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Auto-fit label so long text doesn't touch the edges
    let fontSize = 16;
    const maxTextW = r.w - 18;
    while (fontSize > 12) {
      ctx.font = `700 ${fontSize}px "Bahnschrift", "Trebuchet MS", "Segoe UI", sans-serif`;
      if (ctx.measureText(label).width <= maxTextW) break;
      fontSize -= 1;
    }
    const w = ctx.measureText(label).width;
    const tx = r.x + r.w/2 - w/2;
    const ty = r.y + r.h/2 + 6;
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.lineWidth = 3;
    ctx.strokeText(label, tx, ty);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, tx, ty);
  }

  function drawBackground() {
    drawProceduralBackground(ctx, WIDTH, HEIGHT, selected_bg_idx, Date.now());
    drawBackgroundFx();
    drawBackgroundBoost();
  }

  function drawProceduralBackground(tctx, w, h, idx, now) {
    const t = now * 0.0002;
    if (idx === 0) {
      // Nebula space
      const g = tctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#080a1d");
      g.addColorStop(1, "#0a1f3f");
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, w, h);
      drawStars(tctx, w, h, BG_STARS[0], now, "rgba(210,230,255,0.9)");
      drawNebula(tctx, w, h, now, ["rgba(120,90,255,0.24)", "rgba(80,180,255,0.20)", "rgba(220,120,255,0.18)"]);
      drawBokeh(tctx, w, h, BG_BOKEH[0], now, ["rgba(120,160,255,0.10)", "rgba(200,120,255,0.08)", "rgba(80,200,255,0.08)"]);
    } else if (idx === 1) {
      // Forest mist with fog bands
      const g = tctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0a2415");
      g.addColorStop(1, "#0f341d");
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, w, h);
      drawFogBands(tctx, w, h, now, "rgba(160,220,180,0.10)");
      drawBokeh(tctx, w, h, BG_BOKEH[1], now, ["rgba(120,255,140,0.10)", "rgba(80,180,120,0.10)", "rgba(60,120,90,0.10)"]);
    } else if (idx === 2) {
      // Temple dawn with radial sun + horizon haze
      const g = tctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#2a1e18");
      g.addColorStop(0.6, "#6b3b22");
      g.addColorStop(1, "#1a1513");
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, w, h);
      drawSunGlow(tctx, w, h, 0.5, 0.26, 0.35, "rgba(255,210,140,0.45)");
      drawHorizon(tctx, w, h, "rgba(255,220,160,0.18)");
      drawBokeh(tctx, w, h, BG_BOKEH[2], now, ["rgba(255,200,140,0.12)", "rgba(255,140,90,0.10)", "rgba(180,120,80,0.08)"]);
    } else if (idx === 3) {
      // Golden sunset city with god rays
      const g = tctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#2a150b");
      g.addColorStop(0.5, "#a24b0f");
      g.addColorStop(1, "#1a120e");
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, w, h);
      drawSunGlow(tctx, w, h, 0.68, 0.3, 0.40, "rgba(255,170,60,0.45)");
      drawGodRays(tctx, w, h, now, "rgba(255,190,110,0.12)");
      drawStars(tctx, w, h, BG_STARS[3], now, "rgba(255,220,180,0.35)");
    } else if (idx === 4) {
      // Aurora night
      const g = tctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#050918");
      g.addColorStop(1, "#071a2b");
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, w, h);
      drawStars(tctx, w, h, BG_STARS[4], now, "rgba(200,230,255,0.8)");
      drawAurora(tctx, w, h, now, ["rgba(120,255,220,0.18)", "rgba(140,180,255,0.14)"]);
      drawBokeh(tctx, w, h, BG_BOKEH[4], now, ["rgba(120,200,255,0.08)", "rgba(80,160,220,0.08)"]);
    } else if (idx === 5) {
      // Deep ocean with caustics
      const g = tctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#061426");
      g.addColorStop(1, "#0b2a3a");
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, w, h);
      drawCaustics(tctx, w, h, now, "rgba(120,220,255,0.10)");
      drawBokeh(tctx, w, h, BG_BOKEH[1], now, ["rgba(80,140,200,0.10)", "rgba(60,120,180,0.08)"]);
    } else if (idx === 6) {
      // Soft sunset gradient with drifting haze
      const g = tctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#1b1430");
      g.addColorStop(0.55, "#3a2b55");
      g.addColorStop(1, "#0f1f3a");
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, w, h);
      drawSoftRays(tctx, w, h, now, "rgba(255,170,200,0.14)");
      drawFogBands(tctx, w, h, now, "rgba(180,160,255,0.10)");
    } else if (idx === 7) {
      // Circuit night grid
      const g = tctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#07121f");
      g.addColorStop(1, "#0b1b2a");
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, w, h);
      drawGlassGrid(tctx, w, h, now, "rgba(120,220,255,0.12)");
      drawDiagonalStripes(tctx, w, h, now);
      drawStars(tctx, w, h, BG_STARS[2], now, "rgba(180,220,255,0.25)");
    } else if (idx === 8) {
      // Desert dusk with heat shimmer
      const g = tctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#24150c");
      g.addColorStop(0.55, "#6a3d1f");
      g.addColorStop(1, "#1a120e");
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, w, h);
      drawSunGlow(tctx, w, h, 0.35, 0.32, 0.35, "rgba(255,180,120,0.35)");
      drawHeatWave(tctx, w, h, now, "rgba(255,210,150,0.08)");
    } else {
      // Modern glass with parallax stripes + grid
      const g = tctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0b1c2a");
      g.addColorStop(1, "#102734");
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, w, h);
      drawDiagonalStripes(tctx, w, h, now);
      drawGlassGrid(tctx, w, h, now, "rgba(170,220,240,0.08)");
      drawBokeh(tctx, w, h, BG_BOKEH[4], now, ["rgba(140,220,220,0.10)", "rgba(120,200,255,0.10)", "rgba(80,160,200,0.08)"]);
    }
  }

  function drawStars(tctx, w, h, stars, now, color) {
    const tw = now * 0.0008;
    tctx.save();
    tctx.fillStyle = color;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const x = s.x * w;
      const y = (s.y * h + tw * 18) % h;
      const r = s.r * Math.min(w, h);
      tctx.beginPath();
      tctx.arc(x, y, r, 0, Math.PI * 2);
      tctx.fill();
    }
    tctx.restore();
  }

  function drawBokeh(tctx, w, h, pts, now, colors) {
    const tw = now * 0.0003;
    tctx.save();
    tctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const r = p.r * Math.min(w, h);
      const x = (p.x + Math.sin(tw + p.phase) * 0.02) * w;
      const y = (p.y + Math.cos(tw * 1.3 + p.phase) * 0.02) * h;
      tctx.fillStyle = colors[i % colors.length];
      tctx.beginPath();
      tctx.ellipse(x, y, r, r * 0.85, 0, 0, Math.PI * 2);
      tctx.fill();
    }
    tctx.restore();
  }

  function drawSoftRays(tctx, w, h, now, color) {
    tctx.save();
    tctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 5; i++) {
      const x = w * (0.2 + 0.6 * Math.sin(now * 0.0002 + i));
      const y = h * (0.2 + 0.6 * Math.cos(now * 0.0003 + i));
      const rg = tctx.createRadialGradient(x, y, 0, x, y, 520);
      rg.addColorStop(0, color);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      tctx.fillStyle = rg;
      tctx.fillRect(0, 0, w, h);
    }
    tctx.restore();
  }

  function drawNebula(tctx, w, h, now, colors) {
    tctx.save();
    tctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 4; i++) {
      const x = w * (0.2 + 0.6 * Math.sin(now * 0.00015 + i));
      const y = h * (0.2 + 0.6 * Math.cos(now * 0.00013 + i));
      const r = Math.min(w, h) * (0.35 + 0.05 * i);
      const rg = tctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, colors[i % colors.length]);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      tctx.fillStyle = rg;
      tctx.fillRect(0, 0, w, h);
    }
    tctx.restore();
  }

  function drawFogBands(tctx, w, h, now, color) {
    tctx.save();
    tctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 5; i++) {
      const y = (h * 0.15) + i * (h * 0.18) + Math.sin(now * 0.0002 + i) * 6;
      const rg = tctx.createLinearGradient(0, y, 0, y + 60);
      rg.addColorStop(0, "rgba(0,0,0,0)");
      rg.addColorStop(0.5, color);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      tctx.fillStyle = rg;
      tctx.fillRect(0, y, w, 70);
    }
    tctx.restore();
  }

  function drawHorizon(tctx, w, h, color) {
    tctx.save();
    const y = h * 0.62;
    const g = tctx.createLinearGradient(0, y - 40, 0, y + 80);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    tctx.fillStyle = g;
    tctx.fillRect(0, y - 40, w, 120);
    tctx.restore();
  }

  function drawGodRays(tctx, w, h, now, color) {
    tctx.save();
    tctx.globalCompositeOperation = "screen";
    const baseX = w * 0.68;
    const baseY = h * 0.28;
    for (let i = 0; i < 7; i++) {
      const ang = (i - 3) * 0.12 + Math.sin(now * 0.0003) * 0.02;
      tctx.beginPath();
      tctx.moveTo(baseX, baseY);
      tctx.lineTo(baseX + Math.cos(ang) * w, baseY + Math.sin(ang) * h);
      tctx.lineWidth = 80;
      tctx.strokeStyle = color;
      tctx.stroke();
    }
    tctx.restore();
  }

  function drawAurora(tctx, w, h, now, colors) {
    tctx.save();
    tctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 4; i++) {
      const y = h * (0.18 + i * 0.18) + Math.sin(now * 0.0002 + i) * 10;
      const rg = tctx.createLinearGradient(0, y - 40, w, y + 40);
      rg.addColorStop(0, "rgba(0,0,0,0)");
      rg.addColorStop(0.5, colors[i % colors.length]);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      tctx.fillStyle = rg;
      tctx.fillRect(0, y - 60, w, 120);
    }
    tctx.restore();
  }

  function drawCaustics(tctx, w, h, now, color) {
    tctx.save();
    tctx.globalCompositeOperation = "screen";
    tctx.strokeStyle = color;
    tctx.lineWidth = 2;
    const step = 70;
    const off = (now * 0.04) % step;
    for (let y = -step; y < h + step; y += step) {
      tctx.beginPath();
      for (let x = -step; x < w + step; x += 20) {
        const yy = y + Math.sin((x + now * 0.02) * 0.02) * 6;
        tctx.lineTo(x + off, yy);
      }
      tctx.stroke();
    }
    tctx.restore();
  }

  function drawHeatWave(tctx, w, h, now, color) {
    tctx.save();
    tctx.globalCompositeOperation = "screen";
    tctx.strokeStyle = color;
    tctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const y = h * (0.55 + i * 0.06);
      tctx.beginPath();
      for (let x = 0; x <= w; x += 20) {
        const yy = y + Math.sin(now * 0.0007 + x * 0.02 + i) * 6;
        tctx.lineTo(x, yy);
      }
      tctx.stroke();
    }
    tctx.restore();
  }

  function drawGlassGrid(tctx, w, h, now, color) {
    tctx.save();
    tctx.globalCompositeOperation = "screen";
    tctx.strokeStyle = color;
    tctx.lineWidth = 2;
    const step = 80;
    const off = (now * 0.03) % step;
    for (let x = -step; x < w + step; x += step) {
      tctx.beginPath();
      tctx.moveTo(x + off, 0);
      tctx.lineTo(x + off, h);
      tctx.stroke();
    }
    for (let y = -step; y < h + step; y += step) {
      tctx.beginPath();
      tctx.moveTo(0, y + off);
      tctx.lineTo(w, y + off);
      tctx.stroke();
    }
    tctx.restore();
  }

  function drawSunGlow(tctx, w, h, nx, ny, radius, color) {
    const x = w * nx;
    const y = h * ny;
    const r = Math.min(w, h) * radius;
    const rg = tctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, color);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    tctx.save();
    tctx.globalCompositeOperation = "screen";
    tctx.fillStyle = rg;
    tctx.fillRect(0, 0, w, h);
    tctx.restore();
  }

  function drawDiagonalStripes(tctx, w, h, now) {
    tctx.save();
    tctx.globalCompositeOperation = "screen";
    const step = 120;
    const offset = (now * 0.03) % step;
    tctx.strokeStyle = "rgba(180,220,255,0.06)";
    tctx.lineWidth = 24;
    for (let x = -w; x < w * 2; x += step) {
      tctx.beginPath();
      tctx.moveTo(x + offset, -20);
      tctx.lineTo(x + offset + w, h + 20);
      tctx.stroke();
    }
    tctx.restore();
  }

  function drawBackgroundFx() {
    // Cinematic overlay to simulate "ray-tracing" depth without touching gameplay.
    const t = Date.now() * 0.0002;
    ctx.save();

    // Vignette
    const vg = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, Math.min(WIDTH, HEIGHT)*0.2, WIDTH/2, HEIGHT/2, Math.max(WIDTH, HEIGHT)*0.7);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vg;
    ctx.fillRect(0,0,WIDTH,HEIGHT);

    // Soft light rays
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 6; i++) {
      const ang = t + i * 0.7;
      const x = WIDTH * (0.2 + 0.6 * Math.sin(ang));
      const y = HEIGHT * (0.2 + 0.6 * Math.cos(ang * 0.9));
      const rg = ctx.createRadialGradient(x, y, 0, x, y, 520);
      rg.addColorStop(0, "rgba(120,180,255,0.08)");
      rg.addColorStop(1, "rgba(120,180,255,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0,0,WIDTH,HEIGHT);
    }

    // Bokeh circles (subtle)
    ctx.globalCompositeOperation = "lighter";
    const colors = ["rgba(120,160,255,0.08)", "rgba(180,120,255,0.08)", "rgba(80,200,255,0.08)"];
    for (let i = 0; i < 10; i++) {
      const r = 120 + (i % 5) * 60;
      const x = (WIDTH * 0.1) + (WIDTH * 0.8) * ((i * 73) % 100) / 100;
      const y = (HEIGHT * 0.1) + (HEIGHT * 0.8) * ((i * 37) % 100) / 100;
      const driftX = Math.sin(t + i) * 14;
      const driftY = Math.cos(t * 1.3 + i) * 10;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.ellipse(x + driftX, y + driftY, r, r*0.85, 0, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawBackgroundBoost() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const g = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    g.addColorStop(0, "rgba(90,150,255,0.14)");
    g.addColorStop(0.5, "rgba(140,90,255,0.10)");
    g.addColorStop(1, "rgba(80,220,255,0.10)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.globalCompositeOperation = "overlay";
    const g2 = ctx.createRadialGradient(WIDTH * 0.5, HEIGHT * 0.45, 80, WIDTH * 0.5, HEIGHT * 0.45, Math.max(WIDTH, HEIGHT) * 0.75);
    g2.addColorStop(0, "rgba(255,255,255,0.10)");
    g2.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }

  function drawFlame(frames, x, y, pad=26, w=null, h=null) {
    // Prefer procedural flame border when panel size is known to avoid bar-like sprite look.
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      drawProceduralFlameBorder(x, y, w, h, Date.now());
      return;
    }
    if (!frames || frames.length === 0) return;
    const idx = Math.floor(Date.now() / 50) % frames.length;
    const img = frames[idx];
    if (!img) return;
    const t = Date.now() * 0.002;
    const wobbleX = Math.sin(t) * 1.5;
    const wobbleY = Math.cos(t * 1.3) * 1.5;
    const px = x - pad + wobbleX;
    const py = y - pad + wobbleY;
    const imgW = img.width;
    const imgH = img.height;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.65;
    ctx.filter = "blur(8px) saturate(140%)";
    ctx.drawImage(img, px, py, imgW, imgH);
    ctx.globalAlpha = 0.35;
    ctx.filter = "blur(2px) saturate(160%)";
    ctx.drawImage(img, px, py, imgW, imgH);
    ctx.globalAlpha = 1.0;
    ctx.filter = "none";
    ctx.drawImage(img, px, py, imgW, imgH);
    ctx.restore();
  }

  function hsl(h, s, l, a=1) {
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  }

  function drawProceduralFlameBorder(x, y, w, h, now) {
    const t = now * 0.004;
    const pad = 4;
    const rx = x - pad;
    const ry = y - pad;
    const rw = w + pad * 2;
    const rh = h + pad * 2;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = "blur(6px) saturate(170%)";
    const hue = (now * 0.06) % 360;
    ctx.fillStyle = hsl(hue, 95, 60, 0.35);
    roundRect(ctx, rx, ry, rw, rh, 26);
    ctx.fill();
    ctx.restore();

    // Flame spikes along edges (with organic curl)
    drawFlameEdge(rx, ry, rw, rh, t, hue);
  }

  function drawFlameEdge(rx, ry, rw, rh, t, hueBase) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Rich flame ribbon (continuous, no bar segments)
    const step = 8;
    const base = 10;
    const amp = 12;
    const glow = hsl(hueBase, 95, 60, 0.45);
    const core = hsl((hueBase + 20) % 360, 95, 70, 0.85);
    const hot = hsl((hueBase + 10) % 360, 95, 80, 0.95);

    function ribbonTop() {
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      for (let x = rx; x <= rx + rw; x += step) {
        const n = Math.sin((x * 0.06) + t * 2.2) * amp + Math.cos((x * 0.12) - t * 1.6) * 6;
        const y = ry - (base + n);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(rx + rw, ry);
      ctx.closePath();
    }

    function ribbonBottom() {
      ctx.beginPath();
      ctx.moveTo(rx, ry + rh);
      for (let x = rx; x <= rx + rw; x += step) {
        const n = Math.sin((x * 0.055) + t * 2.0) * amp + Math.cos((x * 0.11) + t * 1.7) * 6;
        const y = ry + rh + (base + n);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(rx + rw, ry + rh);
      ctx.closePath();
    }

    function ribbonLeft() {
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      for (let y = ry; y <= ry + rh; y += step) {
        const n = Math.sin((y * 0.06) + t * 2.1) * amp + Math.cos((y * 0.12) - t * 1.5) * 6;
        const x = rx - (base + n);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(rx, ry + rh);
      ctx.closePath();
    }

    function ribbonRight() {
      ctx.beginPath();
      ctx.moveTo(rx + rw, ry);
      for (let y = ry; y <= ry + rh; y += step) {
        const n = Math.sin((y * 0.055) + t * 2.0) * amp + Math.cos((y * 0.11) + t * 1.8) * 6;
        const x = rx + rw + (base + n);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(rx + rw, ry + rh);
      ctx.closePath();
    }

    // Glow pass
    ctx.save();
    ctx.filter = "blur(8px) saturate(180%)";
    ctx.fillStyle = glow;
    ribbonTop(); ctx.fill();
    ribbonBottom(); ctx.fill();
    ribbonLeft(); ctx.fill();
    ribbonRight(); ctx.fill();
    ctx.restore();

    // Core flame
    ctx.fillStyle = core;
    ribbonTop(); ctx.fill();
    ribbonBottom(); ctx.fill();
    ribbonLeft(); ctx.fill();
    ribbonRight(); ctx.fill();

    // Corner curls (remove square corners)
    drawCornerFlame(rx, ry, -1, -1, base + amp, glow, hot, t);
    drawCornerFlame(rx + rw, ry, 1, -1, base + amp, glow, hot, t + 0.7);
    drawCornerFlame(rx, ry + rh, -1, 1, base + amp, glow, hot, t + 1.4);
    drawCornerFlame(rx + rw, ry + rh, 1, 1, base + amp, glow, hot, t + 2.1);

    // Rounded caps to smooth hard corners
    drawCornerCap(rx, ry, -1, -1, base + amp + 6, hot);
    drawCornerCap(rx + rw, ry, 1, -1, base + amp + 6, hot);
    drawCornerCap(rx, ry + rh, -1, 1, base + amp + 6, hot);
    drawCornerCap(rx + rw, ry + rh, 1, 1, base + amp + 6, hot);

    // No spikes; keep smooth flame waves only

    ctx.restore();
  }

  function drawCornerFlame(cx, cy, sx, sy, size, glow, hot, t) {
    const wobble = Math.sin(t * 2.2) * 6;
    const r1 = size * 0.55 + wobble;
    const r2 = size * 0.30 + wobble * 0.4;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r1);
    g1.addColorStop(0, hot);
    g1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(cx + sx * r2, cy + sy * r2, r1, 0, Math.PI * 2);
    ctx.fill();

    const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r2);
    g2.addColorStop(0, glow);
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(cx, cy, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCornerCap(cx, cy, sx, sy, size, color) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const r = size * 0.6;
    const gx = cx + sx * r * 0.35;
    const gy = cy + sy * r * 0.35;
    const rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    rg.addColorStop(0, color);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFlameSpikes(rx, ry, rw, rh, t, color) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = color;

    const step = 32;
    const base = 10;
    const amp = 6;

    // Top
    for (let x = rx + step; x < rx + rw - step; x += step) {
      const len = base + (Math.sin((x * 0.06) + t * 2.2) * 0.5 + 0.5) * amp;
      ctx.beginPath();
      ctx.moveTo(x - 4, ry);
      ctx.lineTo(x + 4, ry);
      ctx.lineTo(x, ry - len);
      ctx.closePath();
      ctx.fill();
    }
    // Bottom
    for (let x = rx + step; x < rx + rw - step; x += step) {
      const len = base + (Math.cos((x * 0.055) + t * 2.0) * 0.5 + 0.5) * amp;
      ctx.beginPath();
      ctx.moveTo(x - 4, ry + rh);
      ctx.lineTo(x + 4, ry + rh);
      ctx.lineTo(x, ry + rh + len);
      ctx.closePath();
      ctx.fill();
    }
    // Left
    for (let y = ry + step; y < ry + rh - step; y += step) {
      const len = base + (Math.sin((y * 0.06) + t * 2.1) * 0.5 + 0.5) * amp;
      ctx.beginPath();
      ctx.moveTo(rx, y - 4);
      ctx.lineTo(rx, y + 4);
      ctx.lineTo(rx - len, y);
      ctx.closePath();
      ctx.fill();
    }
    // Right
    for (let y = ry + step; y < ry + rh - step; y += step) {
      const len = base + (Math.cos((y * 0.055) + t * 2.0) * 0.5 + 0.5) * amp;
      ctx.beginPath();
      ctx.moveTo(rx + rw, y - 4);
      ctx.lineTo(rx + rw, y + 4);
      ctx.lineTo(rx + rw + len, y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawLeaderboardFlame(x, y) {
    drawFlame(ASSET.flames.leaderboard, x, y, 26);
  }

  function drawLeaderboardFireBorder(px, py, pw, ph) {
    drawProceduralFlameBorder(px, py, pw, ph, Date.now());
  }

  function gridToPixel(p) { return [p[0]*CELL, p[1]*CELL]; }

  function randomGrid(blocked) {
    while (true) {
      const p = [randInt(0, GRID_W-1), randInt(0, GRID_H-1)];
      if (!blocked.some(b => b[0] === p[0] && b[1] === p[1])) return p;
    }
  }

  function drawSnake(body, color) {
    if (body.length >= 2) {
      for (let i = 1; i < body.length; i++) {
        const x1 = body[i-1][0]*CELL + CELL/2;
        const y1 = body[i-1][1]*CELL + CELL/2;
        const x2 = body[i][0]*CELL + CELL/2;
        const y2 = body[i][1]*CELL + CELL/2;
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = Math.max(3, Math.floor(CELL*0.7));
        ctx.beginPath();
        ctx.moveTo(x1+3, y1+4);
        ctx.lineTo(x2+3, y2+4);
        ctx.stroke();
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 6;
        ctx.strokeStyle = rgb(color);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      }
    }

    for (let i = 0; i < body.length; i++) {
      const [gx, gy] = body[i];
      const x = gx*CELL;
      const y = gy*CELL;
      const shadow = ASSET.images.get("cell_shadow_20");
      const bodyImg = ASSET.images.get("snake_body_20");
      const highlight = ASSET.images.get("snake_highlight_20");
      const headImg = ASSET.images.get("snake_head_20");
      const tailImg = ASSET.images.get("snake_tail_20");

      if (shadow && bodyImg && highlight && headImg && tailImg) {
        drawCellHalo(x, y, lighten(color, 0.25), 0.65, 16);
        ctx.drawImage(shadow, x, y);
        let spr = bodyImg;
        let ang = 0;
        if (i === 0 && body.length >= 2) {
          spr = headImg;
          const dx = body[0][0] - body[1][0];
          const dy = body[0][1] - body[1][1];
          ang = dirAngle(dx, dy);
        } else if (i === body.length - 1 && body.length >= 2) {
          spr = tailImg;
          const dx = body[body.length-2][0] - body[body.length-1][0];
          const dy = body[body.length-2][1] - body[body.length-1][1];
          ang = dirAngle(dx, dy);
        }
        ctx.save();
        ctx.shadowColor = rgb(lighten(color, 0.2), 0.55);
        ctx.shadowBlur = 10;
        drawTintedSprite(spr, x + CELL/2, y + CELL/2, ang, color);
        ctx.restore();
        drawTintedSprite(highlight, x + CELL/2, y + CELL/2, ang, [255,255,255]);
      } else {
        drawCellHalo(x, y, lighten(color, 0.25), 0.6, 14);
        roundRect(ctx, x+4, y+5, CELL, CELL, 9);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fill();
        roundRect(ctx, x, y, CELL, CELL, 9);
        ctx.fillStyle = rgb(color);
        ctx.fill();
        roundRect(ctx, x+3, y+3, CELL-6, (CELL-6)/2, 8);
        ctx.fillStyle = rgb(lighten(color, 0.35));
        ctx.fill();
        roundRect(ctx, x, y, CELL, CELL, 9);
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      if (i === 0) drawSnakeEyes(body);
    }
  }

  function dirAngle(dx, dy) {
    if (dx === 1 && dy === 0) return 0;
    if (dx === -1 && dy === 0) return Math.PI;
    if (dx === 0 && dy === -1) return Math.PI/2;
    if (dx === 0 && dy === 1) return -Math.PI/2;
    return 0;
  }

  function drawTintedSprite(img, cx, cy, angle, color) {
    if (!img) return;
    const off = document.createElement('canvas');
    off.width = img.width;
    off.height = img.height;
    const octx = off.getContext('2d');
    octx.drawImage(img, 0, 0);
    octx.globalCompositeOperation = "source-atop";
    octx.fillStyle = rgb(color);
    octx.fillRect(0, 0, off.width, off.height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.drawImage(off, -img.width/2, -img.height/2);
    ctx.restore();
  }

  function drawSnakeEyes(body) {
    let dx = 1, dy = 0;
    if (body.length >= 2) {
      dx = body[0][0] - body[1][0];
      dy = body[0][1] - body[1][1];
    }
    const x = body[0][0]*CELL;
    const y = body[0][1]*CELL;
    const cx = x + CELL/2;
    const cy = y + CELL/2;
    let e1, e2;
    if (dx === 1) { e1 = [cx+6, cy-4]; e2=[cx+6, cy+4]; }
    else if (dx === -1) { e1=[cx-6, cy-4]; e2=[cx-6, cy+4]; }
    else if (dy === -1) { e1=[cx-4, cy-6]; e2=[cx+4, cy-6]; }
    else { e1=[cx-4, cy+6]; e2=[cx+4, cy+6]; }
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(e1[0], e1[1], 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2[0], e2[1], 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(e1[0]+1, e1[1]-1, 1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2[0]+1, e2[1]-1, 1, 0, Math.PI*2); ctx.fill();
  }

  function drawObstacle(cell) {
    const [x,y] = gridToPixel(cell);
    const shadow = ASSET.images.get("cell_shadow_20");
    const spr = ASSET.images.get("obstacle_20");
    if (shadow && spr) {
      const pulse = 0.85 + 0.15 * Math.sin(Date.now() * 0.01 + (x + y) * 0.02);
      drawCellHalo(x, y, [210, 245, 255], 1.0 * pulse, 30);
      ctx.save();
      ctx.shadowColor = "rgba(120,220,255,1)";
      ctx.shadowBlur = 22;
      ctx.drawImage(spr, x, y);
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      roundRect(ctx, x - 2, y - 2, CELL + 4, CELL + 4, 9);
      ctx.strokeStyle = "rgba(90,220,255,0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
      roundRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, 7);
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.save();
      roundRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, 7);
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      return;
    }
    const base = [88, 92, 110];
    drawCellHalo(x, y, [210, 245, 255], 1.0, 28);
    const edge = darken(base, 0.35);
    const inner = lighten(base, 0.18);
    const shine = lighten(base, 0.45);

    // Shadow
    roundRect(ctx, x+4, y+5, CELL, CELL, 7);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fill();

    // Body with subtle metal gradient
    const g = ctx.createLinearGradient(x, y, x+CELL, y+CELL);
    g.addColorStop(0, rgb(inner));
    g.addColorStop(1, rgb(edge));
    roundRect(ctx, x, y, CELL, CELL, 7);
    ctx.fillStyle = g;
    ctx.fill();

    // Inner inset
    roundRect(ctx, x+2, y+2, CELL-4, CELL-4, 6);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top shine strip
    roundRect(ctx, x+3, y+3, CELL-6, (CELL-6)/2, 6);
    ctx.fillStyle = rgb(shine);
    ctx.fill();

    // Crisp outline
    roundRect(ctx, x, y, CELL, CELL, 7);
    ctx.strokeStyle = rgb(edge);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawApple(cell) {
    const [x,y] = gridToPixel(cell);
    const shadow = ASSET.images.get("cell_shadow_20");
    const spr = ASSET.images.get("apple_20");
    if (shadow && spr) {
      drawCellHalo(x, y, [255, 140, 190], 0.85, 22);
      ctx.drawImage(shadow, x, y);
      ctx.drawImage(spr, x, y);
      return;
    }
    const cx = x + CELL/2;
    const cy = y + CELL/2;
    drawCellHalo(x, y, [255, 150, 200], 0.8, 18);
    const g = ctx.createRadialGradient(cx - 4, cy - 6, 4, cx, cy, CELL * 0.9);
    g.addColorStop(0, "#ffd1e0");
    g.addColorStop(0.4, "#ff6b88");
    g.addColorStop(1, "#c5142f");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.92, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath(); ctx.ellipse(cx - 5, cy - 8, 6, 10, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#ffd37a";
    ctx.beginPath(); ctx.arc(cx-2, cy-6, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#39d17a";
    ctx.beginPath(); ctx.ellipse(cx+6, cy-10, 6, 4, 0.5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawSpecial() {
    if (!special_item) return;
    const elapsed = Date.now() - special_spawn_time;
    if (elapsed > 2500 && Math.floor(elapsed/150) % 2 !== 0) return;
    const [x,y] = gridToPixel(special_item);
    const shadow = ASSET.images.get("cell_shadow_20");
    const spr = ASSET.images.get("special_buff_20");
    const halo = [255, 70, 210];
    if (shadow && spr) {
      drawCellHalo(x, y, halo, 0.8, 22);
      ctx.save();
      ctx.shadowColor = "rgba(255,70,210,0.9)";
      ctx.shadowBlur = 14;
      ctx.drawImage(spr, x, y);
      ctx.restore();
      return;
    }
    drawCellHalo(x, y, halo, 0.75, 18);
    roundRect(ctx, x, y, CELL, CELL, 7);
    ctx.fillStyle = "#ff46d8";
    ctx.fill();
    roundRect(ctx, x+3, y+3, CELL-6, CELL-6, 6);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.moveTo(x+5, y+6);
    ctx.lineTo(x+CELL-6, y+6);
    ctx.stroke();
  }

  function drawGun() {
    if (!gun_item) return;
    const [x,y] = gridToPixel(gun_item);
    const shadow = ASSET.images.get("cell_shadow_20");
    const spr = ASSET.images.get("gun_20");
    drawCellHalo(x, y, [255, 235, 150], 0.8, 22);
    if (shadow) ctx.drawImage(shadow, x, y);
    if (spr) {
      ctx.save();
      ctx.shadowColor = "rgba(255,220,120,0.9)";
      ctx.shadowBlur = 12;
      ctx.drawImage(spr, x, y);
      ctx.restore();
    }
    else {
      roundRect(ctx, x, y, CELL, CELL, 7);
      const g = ctx.createLinearGradient(x, y, x+CELL, y+CELL);
      g.addColorStop(0, "#fff6c8");
      g.addColorStop(1, "#ffb23a");
      ctx.fillStyle = g;
      ctx.fill();
      roundRect(ctx, x+3, y+3, CELL-6, CELL-6, 6);
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawBullets() {
    for (const b of bullets) {
      ctx.save();
      ctx.shadowColor = "rgba(255,255,255,0.8)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawHud(text) {
    const hud = ASSET.images.get("hud_520x44");
    if (hud) {
      ctx.save();
      ctx.shadowColor = "rgba(0,220,255,0.35)";
      ctx.shadowBlur = 12;
      ctx.drawImage(hud, 10, 10);
      ctx.restore();
    } else {
      roundRect(ctx, 10, 10, 520, 44, 12);
      ctx.fillStyle = "rgba(8,10,24,0.85)";
      ctx.fill();
      roundRect(ctx, 12, 12, 516, 40, 11);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.font = "700 22px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.strokeText(text, 22, 38);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, 22, 38);
    ctx.fillStyle = "rgba(220,232,255,0.9)";
    ctx.font = "600 15px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    ctx.fillText(t("sound_hint"), 22, 58);
  }

  function drawPillHint(text, cx, y) {
    ctx.font = "600 18px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    const w = ctx.measureText(text).width + 26;
    const h = 36;
    const x = cx - w/2;
    roundRect(ctx, x, y, w, h, 14);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fill();
    roundRect(ctx, x+2, y+2, w-4, h-4, 12);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#ebf5ff";
    ctx.fillText(text, x+13, y+23);
  }

  const GUIDE_PANEL = { x: 190, y: 70, w: 1160, h: 620 };
  const GUIDE_CONTENT = { x: 250, y: 170, w: 960, h: 430 };
  const GUIDE_SCROLLBAR = { x: 1230, y: 170, w: 20, h: 430 };
  const GUIDE_BUTTON = { x: 1010, y: 620, w: 250, h: 55 };
  const GUIDE_LINE_HEIGHT = 34;
  const GUIDE_SECTION_GAP = 18;
  const GUIDE_ITEM_GAP = 10;
  const GUIDE_PADDING_TOP = 30;
  const GUIDE_PADDING_BOTTOM = 18;
  const GUIDE_TEXT_LEFT = 50;
  const GUIDE_TEXT_RIGHT_PAD = 24;

  let guide_scroll = 0;
  let guide_dragging = false;

  function wrapText(text, maxWidth) {
    const words = text.split(" ");
    if (!words.length) return [""];
    const lines = [];
    let cur = words[0];
    for (const w of words.slice(1)) {
      const test = cur + " " + w;
      if (ctx.measureText(test).width <= maxWidth) cur = test;
      else { lines.push(cur); cur = w; }
    }
    lines.push(cur);
    const out = [];
    for (const line of lines) {
      if (ctx.measureText(line).width <= maxWidth) { out.push(line); continue; }
      let buf = "";
      for (const ch of line) {
        const test = buf + ch;
        if (ctx.measureText(test).width <= maxWidth || !buf) buf = test;
        else { out.push(buf); buf = ch; }
      }
      if (buf) out.push(buf);
    }
    return out;
  }

  function getGuideContentHeight() {
    let height = GUIDE_PADDING_TOP + GUIDE_PADDING_BOTTOM;
    for (const [title, items] of getGuideSections()) {
      height += GUIDE_LINE_HEIGHT + 2;
      const maxW = GUIDE_CONTENT.w - GUIDE_TEXT_LEFT - GUIDE_TEXT_RIGHT_PAD;
      for (const item of items) {
        const lines = wrapText(item, maxW);
        height += lines.length * GUIDE_LINE_HEIGHT;
        height += GUIDE_ITEM_GAP;
      }
      height += GUIDE_SECTION_GAP;
    }
    return Math.max(height, GUIDE_CONTENT.h);
  }

  function getGuideMaxScroll() {
    return Math.max(0, getGuideContentHeight() - GUIDE_CONTENT.h);
  }

  function clampGuideScroll() {
    const maxScroll = getGuideMaxScroll();
    guide_scroll = clamp(guide_scroll, 0, maxScroll);
  }

  function getGuideThumbRect() {
    const contentHeight = getGuideContentHeight();
    if (contentHeight <= GUIDE_CONTENT.h) return { x: GUIDE_SCROLLBAR.x, y: GUIDE_SCROLLBAR.y, w: GUIDE_SCROLLBAR.w, h: GUIDE_SCROLLBAR.h };
    const ratio = GUIDE_CONTENT.h / contentHeight;
    const thumbHeight = Math.max(70, Math.floor(GUIDE_SCROLLBAR.h * ratio));
    const travel = GUIDE_SCROLLBAR.h - thumbHeight;
    const maxScroll = getGuideMaxScroll();
    let thumbY = GUIDE_SCROLLBAR.y;
    if (maxScroll > 0) thumbY += Math.floor(travel * (guide_scroll / maxScroll));
    return { x: GUIDE_SCROLLBAR.x, y: thumbY, w: GUIDE_SCROLLBAR.w, h: thumbHeight };
  }

  function drawGuideScreen() {
    drawFlame(ASSET.flames.guide, GUIDE_PANEL.x, GUIDE_PANEL.y, 26, GUIDE_PANEL.w, GUIDE_PANEL.h);
    drawPanel(GUIDE_PANEL.x, GUIDE_PANEL.y, GUIDE_PANEL.w, GUIDE_PANEL.h);
    drawTextCentered(t("role_guide"), WIDTH/2, GUIDE_PANEL.y + 60, 44, "#fff");
    ctx.fillStyle = "#d2d2e6";
    ctx.font = "500 18px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    ctx.fillText(t("guide_subtitle"), GUIDE_PANEL.x + 60, GUIDE_PANEL.y + 98);

    roundRect(ctx, GUIDE_CONTENT.x, GUIDE_CONTENT.y, GUIDE_CONTENT.w, GUIDE_CONTENT.h, 10);
    ctx.fillStyle = "rgba(20,20,45,0.9)";
    ctx.fill();
    roundRect(ctx, GUIDE_CONTENT.x, GUIDE_CONTENT.y, GUIDE_CONTENT.w, GUIDE_CONTENT.h, 10);
    ctx.strokeStyle = "rgba(70,90,150,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.rect(GUIDE_CONTENT.x, GUIDE_CONTENT.y, GUIDE_CONTENT.w, GUIDE_CONTENT.h);
    ctx.clip();
    let y = GUIDE_CONTENT.y + GUIDE_PADDING_TOP - guide_scroll;
    for (const [title, items] of getGuideSections()) {
      ctx.fillStyle = rgb(YELLOW);
      ctx.font = "700 26px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText(title, GUIDE_CONTENT.x + 24, y);
      y += GUIDE_LINE_HEIGHT + 2;
      for (const item of items) {
        const maxW = GUIDE_CONTENT.w - GUIDE_TEXT_LEFT - GUIDE_TEXT_RIGHT_PAD;
        const lines = wrapText(item, maxW);
        for (let j = 0; j < lines.length; j++) {
          if (j === 0) {
            ctx.fillStyle = rgb(SPECIAL_COLOR);
            ctx.font = "600 20px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
            ctx.fillText("-", GUIDE_CONTENT.x + 26, y + 2);
          }
          ctx.fillStyle = "#fff";
          ctx.font = "500 20px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
          ctx.fillText(lines[j], GUIDE_CONTENT.x + GUIDE_TEXT_LEFT, y);
          y += GUIDE_LINE_HEIGHT;
        }
        y += GUIDE_ITEM_GAP;
      }
      y += GUIDE_SECTION_GAP;
    }
    ctx.restore();

    roundRect(ctx, GUIDE_SCROLLBAR.x, GUIDE_SCROLLBAR.y, GUIDE_SCROLLBAR.w, GUIDE_SCROLLBAR.h, 10);
    ctx.fillStyle = "rgba(25,25,50,0.9)";
    ctx.fill();
    roundRect(ctx, GUIDE_SCROLLBAR.x, GUIDE_SCROLLBAR.y, GUIDE_SCROLLBAR.w, GUIDE_SCROLLBAR.h, 10);
    ctx.strokeStyle = "rgba(70,90,150,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
    const thumb = getGuideThumbRect();
    roundRect(ctx, thumb.x, thumb.y, thumb.w, thumb.h, 10);
    ctx.fillStyle = rgb(SPECIAL_COLOR);
    ctx.fill();

    drawButton(t("start_game"), GUIDE_BUTTON, GREEN);
  }

  const MODE_PANEL = { x: WIDTH/2 - 340, y: 120, w: 680, h: 420 };
  const MODE_CARD_GAP = 22;
  const MODE_CARD_W = Math.floor((MODE_PANEL.w - 80 - MODE_CARD_GAP) / 2);
  const MODE_CARD_H = 100;
  const MODE_CARDS_TOP = MODE_PANEL.y + 134;
  const MODE_CARD_LEFT = MODE_PANEL.x + (MODE_PANEL.w - (MODE_CARD_W * 2 + MODE_CARD_GAP)) / 2;
  function buildModeRects() {
    const rects = [];
    for (let i = 0; i < MODE_CHOICES.length; i++) {
      rects.push({
        x: MODE_CARD_LEFT + (i % 2) * (MODE_CARD_W + MODE_CARD_GAP),
        y: MODE_CARDS_TOP + Math.floor(i / 2) * (MODE_CARD_H + MODE_CARD_GAP),
        w: MODE_CARD_W,
        h: MODE_CARD_H,
      });
    }
    return rects;
  }
  const MODE_OPTION_RECTS = buildModeRects();
  const MODE_BTN_START = { x: WIDTH/2 - 120, y: MODE_PANEL.y + MODE_PANEL.h - 52, w: 240, h: 44 };
  const MODE_BTN_ROW_GAP = 8;
  const MODE_BTN_W = 104;
  const MODE_BTN_H = 34;
  const MODE_BTN_ROW_W = MODE_BTN_W * 5 + MODE_BTN_ROW_GAP * 4;
  const MODE_BTN_ROW_X = MODE_PANEL.x + (MODE_PANEL.w - MODE_BTN_ROW_W) / 2;
  const MODE_BTN_GUIDE = { x: MODE_BTN_ROW_X + (MODE_BTN_W + MODE_BTN_ROW_GAP) * 0, y: MODE_PANEL.y + 86, w: MODE_BTN_W, h: MODE_BTN_H };
  const MODE_BTN_LEADERBOARD = { x: MODE_BTN_ROW_X + (MODE_BTN_W + MODE_BTN_ROW_GAP) * 1, y: MODE_PANEL.y + 86, w: MODE_BTN_W, h: MODE_BTN_H };
  const MODE_BTN_COLOR = { x: MODE_BTN_ROW_X + (MODE_BTN_W + MODE_BTN_ROW_GAP) * 2, y: MODE_PANEL.y + 86, w: MODE_BTN_W, h: MODE_BTN_H };
  const MODE_BTN_SETTINGS = { x: MODE_BTN_ROW_X + (MODE_BTN_W + MODE_BTN_ROW_GAP) * 3, y: MODE_PANEL.y + 86, w: MODE_BTN_W, h: MODE_BTN_H };
  const MODE_BTN_LEAVE = { x: MODE_BTN_ROW_X + (MODE_BTN_W + MODE_BTN_ROW_GAP) * 4, y: MODE_PANEL.y + 86, w: MODE_BTN_W, h: MODE_BTN_H };

  function drawModeOption(rect, code, title, sub1, sub2, selected) {
    const hovered = rectContains(rect, mouse.x, mouse.y);
    const base = [36,40,74];
    const fill = hovered ? lighten(base, 0.22) : base;
    roundRect(ctx, rect.x+4, rect.y+5, rect.w, rect.h, 12);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fill();
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fillStyle = rgb(fill);
    ctx.fill();
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
    if (hovered && !selected) {
      roundRect(ctx, rect.x-2, rect.y-2, rect.w+4, rect.h+4, 13);
      ctx.strokeStyle = "rgba(0,220,255,0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (selected) {
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
      ctx.strokeStyle = rgb(SPECIAL_COLOR);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    ctx.font = "700 24px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    ctx.fillText(title, rect.x + 22, rect.y + 30);
    if (sub1) {
      ctx.fillStyle = "#d7e1ff";
      ctx.font = "500 18px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText(sub1, rect.x + 22, rect.y + 56);
    }
    if (sub2) {
      ctx.fillStyle = "#bdc7e1";
      ctx.font = "500 16px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText(sub2, rect.x + 22, rect.y + 74);
    }
  }

  function drawModeScreen() {
    drawFlame(ASSET.flames.mode, MODE_PANEL.x, MODE_PANEL.y, 26, MODE_PANEL.w, MODE_PANEL.h);
    drawPanel(MODE_PANEL.x, MODE_PANEL.y, MODE_PANEL.w, MODE_PANEL.h);
    drawTextCentered(t("choose_mode"), WIDTH/2, MODE_PANEL.y + 58, 44, "#fff");
    drawButtonSmall(t("guide"), MODE_BTN_GUIDE, YELLOW);
    drawButtonSmall(t("leaderboard"), MODE_BTN_LEADERBOARD, YELLOW);
    drawButtonSmall(t("color"), MODE_BTN_COLOR, YELLOW);
    drawButtonSmall(t("settings"), MODE_BTN_SETTINGS, YELLOW);
    drawButtonSmall(t("leave"), MODE_BTN_LEAVE, RED);
    MODE_CHOICES.forEach((m, i) => {
      const obs = m[1][1];
      drawModeOption(MODE_OPTION_RECTS[i], m[0], modeTitle(m[0]), t(m[2]), `${t("obstacles")}: ${obs}`, i === mode_selected_idx);
    });
    drawButton(t("next"), MODE_BTN_START, GREEN);
  }

  const PET_PANEL = { x: WIDTH/2 - 460, y: 170, w: 920, h: 460 };
  const PET_CARD_W = 320;
  const PET_CARD_H = 120;
  const PET_CARD_GAP_X = 24;
  const PET_CARD_GAP_Y = 20;
  const PET_GRID_W = PET_CARD_W*2 + PET_CARD_GAP_X;
  const PET_GRID_H = PET_CARD_H*2 + PET_CARD_GAP_Y;
  const PET_GRID_X = PET_PANEL.x + (PET_PANEL.w - PET_GRID_W)/2;
  const PET_GRID_Y = PET_PANEL.y + 120;
  const PET_RECTS = Array.from({length:4}).map((_, i) => ({
    x: PET_GRID_X + (i % 2) * (PET_CARD_W + PET_CARD_GAP_X),
    y: PET_GRID_Y + Math.floor(i / 2) * (PET_CARD_H + PET_CARD_GAP_Y),
    w: PET_CARD_W,
    h: PET_CARD_H,
  }));
  const PET_BTN_NEXT = { x: PET_PANEL.x + PET_PANEL.w - 240, y: PET_PANEL.y + PET_PANEL.h - 70, w: 180, h: 52 };
  const PET_BTN_BACK = { x: PET_PANEL.x + 60, y: PET_PANEL.y + PET_PANEL.h - 70, w: 180, h: 52 };

  function drawPetSelect() {
    drawPanel(PET_PANEL.x, PET_PANEL.y, PET_PANEL.w, PET_PANEL.h);
    drawTextCentered(t("choose_pet"), WIDTH/2, PET_PANEL.y + 72, 44, "#fff");
    for (let i = 0; i < PET_RECTS.length; i++) {
      const r = PET_RECTS[i];
      const hovered = rectContains(r, mouse.x, mouse.y);
      const selected = i === pet_selected_idx;
      roundRect(ctx, r.x+5, r.y+6, r.w, r.h, 14);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fill();
      roundRect(ctx, r.x, r.y, r.w, r.h, 14);
      ctx.fillStyle = "rgba(30,34,62,0.95)";
      ctx.fill();
      roundRect(ctx, r.x, r.y, r.w, r.h, 14);
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
      if (hovered && !selected) {
        roundRect(ctx, r.x-2, r.y-2, r.w+4, r.h+4, 15);
        ctx.strokeStyle = "rgba(0,220,255,0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (selected) {
        roundRect(ctx, r.x, r.y, r.w, r.h, 14);
        ctx.strokeStyle = rgb(SPECIAL_COLOR);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      const [name] = PET_CHOICES[i];
      drawPetIcon(name, r.x + 18, r.y + 24, 72);
      ctx.fillStyle = "#fff";
      ctx.font = "700 26px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText(name, r.x + 112, r.y + 64);
    }
    drawButton(t("back"), PET_BTN_BACK, RED);
    drawButton(t("ok"), PET_BTN_NEXT, GREEN);
  }

  const BG_PANEL = { x: WIDTH/2 - 500, y: 140, w: 1000, h: 520 };
  const BG_COLS = 5;
  const BG_CARD_W = 182;
  const BG_CARD_H = 125;
  const BG_CARD_GAP_X = 14;
  const BG_CARD_GAP_Y = 16;
  const BG_BTN_NEXT = { x: BG_PANEL.x + BG_PANEL.w - 240, y: BG_PANEL.y + BG_PANEL.h - 62, w: 190, h: 50 };
  const BG_BTN_BACK = { x: BG_PANEL.x + 50, y: BG_PANEL.y + BG_PANEL.h - 62, w: 190, h: 50 };

  function buildBgRects() {
    const topY = BG_PANEL.y + 108;
    const totalW = BG_COLS * BG_CARD_W + (BG_COLS - 1) * BG_CARD_GAP_X;
    const startX = BG_PANEL.x + (BG_PANEL.w - totalW) / 2;
    const rows = Math.ceil(BG_FILES.length / BG_COLS);
    const rects = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < BG_COLS; c++) {
        const i = r * BG_COLS + c;
        if (i >= BG_FILES.length) break;
        rects.push({
          x: startX + c * (BG_CARD_W + BG_CARD_GAP_X),
          y: topY + r * (BG_CARD_H + BG_CARD_GAP_Y),
          w: BG_CARD_W,
          h: BG_CARD_H,
        });
      }
    }
    return rects;
  }

  function drawBgSelect() {
    drawPanel(BG_PANEL.x, BG_PANEL.y, BG_PANEL.w, BG_PANEL.h);
    drawTextCentered(t("choose_bg"), WIDTH/2, BG_PANEL.y + 64, 44, "#fff");
    ctx.fillStyle = "#d2dcee";
    ctx.font = "500 16px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    const sub = lang === "vi" ? "10 nền động nhẹ, không rối mắt" : "10 subtle animated backgrounds";
    ctx.fillText(sub, WIDTH/2 - ctx.measureText(sub).width/2, BG_PANEL.y + 100);

    const rects = buildBgRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      const hovered = rectContains(r, mouse.x, mouse.y);
      const selected = i === selected_bg_idx;
      roundRect(ctx, r.x+5, r.y+6, r.w, r.h, 14);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fill();
      roundRect(ctx, r.x, r.y, r.w, r.h, 14);
      ctx.fillStyle = "rgba(30,34,62,0.95)";
      ctx.fill();
      roundRect(ctx, r.x, r.y, r.w, r.h, 14);
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
      if (hovered && !selected) {
        roundRect(ctx, r.x-2, r.y-2, r.w+4, r.h+4, 15);
        ctx.strokeStyle = "rgba(0,220,255,0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (selected) {
        roundRect(ctx, r.x, r.y, r.w, r.h, 14);
        ctx.strokeStyle = rgb(SPECIAL_COLOR);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      const img = ASSET.images.get(BG_FILES[i]);
        if (img) {
          ctx.drawImage(img, r.x + 6, r.y + 6, r.w - 12, r.h - 36);
        } else {
          ctx.save();
          ctx.beginPath();
          roundRect(ctx, r.x + 6, r.y + 6, r.w - 12, r.h - 36, 10);
          ctx.clip();
          ctx.translate(r.x + 6, r.y + 6);
          drawProceduralBackground(ctx, r.w - 12, r.h - 36, i, Date.now());
          ctx.restore();
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.lineWidth = 1;
          roundRect(ctx, r.x + 6, r.y + 6, r.w - 12, r.h - 36, 10);
          ctx.stroke();
        }
      ctx.fillStyle = "#fff";
      ctx.font = "600 16px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
      const label = lang === "vi" ? `Nền ${i+1}` : `Background ${i+1}`;
      ctx.fillText(label, r.x + 12, r.y + r.h - 14);
    }
    drawButton(t("back"), BG_BTN_BACK, RED);
    drawButton(t("start_game"), BG_BTN_NEXT, GREEN);
  }

  const COLOR_PANEL = { x: 350, y: 120, w: 850, h: 520 };
  const COLOR_GRID_X = 450;
  const COLOR_W = 120;
  const COLOR_H = 50;
  const COLOR_DX = 160;
  const COLOR_DY = 70;
  const COLOR_COLS = 4;
  const PLAYER_GRID_TOP = 260;
  const ENEMY_GRID_TOP = 420;
  const COLOR_BTN_SAVE = { x: 720, y: 560, w: 120, h: 50 };

  function colorName(c) {
    for (const [name, col] of color_options) {
      if (col[0] === c[0] && col[1] === c[1] && col[2] === c[2]) return t(name);
    }
    return t("color_custom");
  }

  function sameColor(a, b) {
    return a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }

  function drawColorOption(cx, cy, color, selected) {
    const r = { x: cx, y: cy, w: COLOR_W, h: COLOR_H };
    const hovered = rectContains(r, mouse.x, mouse.y);
    const fill = hovered ? lighten(color, 0.2) : color;
    roundRect(ctx, r.x+3, r.y+4, r.w, r.h, 10);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fill();
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fillStyle = rgb(fill);
    ctx.fill();
    if (selected) {
      roundRect(ctx, cx-5, cy-5, 130, 60, 12);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 4;
      ctx.stroke();
      roundRect(ctx, cx-8, cy-8, 136, 66, 14);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      roundRect(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    if (hovered && !selected) {
      roundRect(ctx, cx-3, cy-3, 126, 56, 12);
      ctx.strokeStyle = "rgba(0,220,255,0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function pickColor(mx, my, topY) {
    for (let i = 0; i < color_options.length; i++) {
      const cx = COLOR_GRID_X + (i % COLOR_COLS) * COLOR_DX;
      const cy = topY + Math.floor(i / COLOR_COLS) * COLOR_DY;
      if (mx >= cx && mx <= cx + COLOR_W && my >= cy && my <= cy + COLOR_H) {
        return color_options[i][1];
      }
    }
    return null;
  }

  function drawColorSelect() {
    drawFlame(ASSET.flames.color, COLOR_PANEL.x, COLOR_PANEL.y, 26, COLOR_PANEL.w, COLOR_PANEL.h);
    drawPanel(COLOR_PANEL.x, COLOR_PANEL.y, COLOR_PANEL.w, COLOR_PANEL.h);
    drawTextCentered(t("color_select"), WIDTH/2, COLOR_PANEL.y + 70, 44, "#fff");
    drawTextCentered(t("click_swatch"), WIDTH/2, COLOR_PANEL.y + 112, 18, "#d2dcee", "500");

    const labels = [
      [t("player"), player_select, PLAYER_GRID_TOP, 232],
      [t("enemy"), enemy_select, ENEMY_GRID_TOP, 404],
    ];
    for (const [label, selected, topY, labelY] of labels) {
      ctx.fillStyle = "#e6f1ff";
      ctx.font = "600 18px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText(label, COLOR_GRID_X, labelY);
      const selectedText = `${t("selected")}: ${colorName(selected)}`;
      ctx.fillStyle = "#d2dcee";
      ctx.font = "500 18px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText(selectedText, COLOR_PANEL.x + COLOR_PANEL.w - 90 - ctx.measureText(selectedText).width, labelY);
      for (let i = 0; i < color_options.length; i++) {
        const cx = COLOR_GRID_X + (i % COLOR_COLS) * COLOR_DX;
        const cy = topY + Math.floor(i / COLOR_COLS) * COLOR_DY;
        drawColorOption(cx, cy, color_options[i][1], sameColor(color_options[i][1], selected));
      }
    }
    drawButton(t("save"), COLOR_BTN_SAVE, GREEN);
  }

  function drawLeaderboardList(x, y, w=760, rowH=40) {
    const board = loadLeaderboard();
    roundRect(ctx, x, y, w, rowH, 12);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fill();
    roundRect(ctx, x+4, y+4, w-8, rowH-8, 10);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const cols = [[t("rank"), 18], [t("name"), 110], [t("score"), 470], [t("mode"), 610]];
    ctx.fillStyle = "#d2dcee";
    ctx.font = "600 16px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    for (const [label, dx] of cols) ctx.fillText(label, x + dx, y + 24);

    y += rowH + 10;
    for (let i = 0; i < board.length; i++) {
      const row = board[i];
      const n = row[0];
      const s = row[1];
      const m = row[2];
      const r = { x, y: y + i*rowH, w, h: rowH-6 };
      roundRect(ctx, r.x, r.y, r.w, r.h, 12);
      ctx.fillStyle = i % 2 === 0 ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.3)";
      ctx.fill();
      if (i === 0) {
        roundRect(ctx, r.x+4, r.y+4, r.w-8, r.h-8, 10);
        ctx.strokeStyle = "rgba(0,220,255,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      const rankCol = i === 0 ? "#fff0be" : "#e6ebff";
      const modeCol = m === "INFINITE" ? rgb(GOLD) : "#e6ebff";
      const modeLabel = m ? fitText(modeTitle(m), 130) : "";
      const scoreLabel = String(s);
      ctx.fillStyle = rankCol;
      ctx.font = "600 20px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText(String(i+1), r.x + 22, r.y + 24);
      ctx.fillStyle = "#fff";
      ctx.fillText(fitText(n, 330), r.x + 110, r.y + 24);
      const scoreX = 480;
      ctx.fillStyle = "#b4ffd2";
      ctx.fillText(scoreLabel, r.x + scoreX, r.y + 24);
      ctx.fillStyle = modeCol;
      ctx.fillText(modeLabel, r.x + 610, r.y + 24);
    }
  }

  function fitText(text, maxW) {
    ctx.font = "600 20px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    if (ctx.measureText(text).width <= maxW) return text;
    const ell = "...";
    let out = "";
    for (const ch of text) {
      if (ctx.measureText(out + ch + ell).width > maxW) break;
      out += ch;
    }
    return out + ell;
  }

  const LEADERBOARD_PANEL = { x: WIDTH/2 - 520, y: 70, w: 1040, h: 680 };

  function drawLeaderboardScreen() {
    const px = LEADERBOARD_PANEL.x;
    const py = LEADERBOARD_PANEL.y;
    const pw = LEADERBOARD_PANEL.w;
    const ph = LEADERBOARD_PANEL.h;
    drawLeaderboardFireBorder(px, py, pw, ph);
    drawPanel(px, py, pw, ph);
    drawTextCentered(t("leaderboard"), WIDTH/2, py + 70, 44, "#fff");
    drawTextCentered(t("leaderboard_sub"), WIDTH/2, py + 110, 18, "#d2dcee", "500");
    drawLeaderboardList(px+60, py+140, pw-120, 40);
    drawPillHint(t("menu_hint"), WIDTH/2, py + ph - 48);
  }

  // Settings UI
  const SETTINGS_PANEL = { x: WIDTH/2 - 420, y: 140, w: 840, h: 520 };
  const SETTINGS_BACK = { x: SETTINGS_PANEL.x + 50, y: SETTINGS_PANEL.y + SETTINGS_PANEL.h - 60, w: 160, h: 48 };
  const MUSIC_SLIDER = { x: SETTINGS_PANEL.x + 60, y: SETTINGS_PANEL.y + 140, w: 500, h: 16 };
  const SFX_SLIDER = { x: SETTINGS_PANEL.x + 60, y: SETTINGS_PANEL.y + 210, w: 500, h: 16 };
  const MUSIC_BTN_CLASSIC = { x: SETTINGS_PANEL.x + 600, y: SETTINGS_PANEL.y + 130, w: 170, h: 34 };
  const MUSIC_BTN_SILENT = { x: SETTINGS_PANEL.x + 600, y: SETTINGS_PANEL.y + 172, w: 170, h: 34 };
  const LANG_BTN_EN = { x: SETTINGS_PANEL.x + 60, y: SETTINGS_PANEL.y + 290, w: 160, h: 40 };
  const LANG_BTN_VI = { x: SETTINGS_PANEL.x + 230, y: SETTINGS_PANEL.y + 290, w: 160, h: 40 };
  let settingsDrag = null;

  function drawSlider(rect, value, label) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(0,220,255,0.8)";
    roundRect(ctx, rect.x, rect.y, Math.max(6, rect.w * value), rect.h, 8);
    ctx.fill();
    ctx.fillStyle = "#d2dcee";
    ctx.font = "600 16px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    ctx.fillText(label, rect.x, rect.y - 10);
    ctx.restore();
  }

  function drawSettingsScreen() {
    drawFlame(ASSET.flames.mode, SETTINGS_PANEL.x, SETTINGS_PANEL.y, 26, SETTINGS_PANEL.w, SETTINGS_PANEL.h);
    drawPanel(SETTINGS_PANEL.x, SETTINGS_PANEL.y, SETTINGS_PANEL.w, SETTINGS_PANEL.h);
    drawTextCentered(t("settings_title"), WIDTH/2, SETTINGS_PANEL.y + 60, 36, "#fff");

    drawSlider(MUSIC_SLIDER, musicVolume, t("music_vol"));
    drawSlider(SFX_SLIDER, sfxVolume, t("sfx_vol"));

    drawButton(t("classic"), MUSIC_BTN_CLASSIC, musicChoice === "classic" ? GREEN : YELLOW);
    drawButton(t("silent"), MUSIC_BTN_SILENT, musicChoice === "silent" ? RED : YELLOW);

    ctx.fillStyle = "#d2dcee";
    ctx.font = "600 16px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    ctx.fillText(t("language"), LANG_BTN_EN.x, LANG_BTN_EN.y - 10);
    drawButton(t("english"), LANG_BTN_EN, lang === "en" ? GREEN : YELLOW);
    drawButton(t("vietnamese"), LANG_BTN_VI, lang === "vi" ? GREEN : YELLOW);

    // Profile
    ctx.fillStyle = "#d2dcee";
    ctx.font = "700 18px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    ctx.fillText(t("profile"), SETTINGS_PANEL.x + 60, SETTINGS_PANEL.y + 360);
    ctx.font = "600 16px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    const accountLabel = player_name ? player_name : t("not_logged_in");
    ctx.fillText(`${t("account")}: ${accountLabel}`, SETTINGS_PANEL.x + 60, SETTINGS_PANEL.y + 386);
    ctx.fillText(`${t("total_games")}: ${total_games}`, SETTINGS_PANEL.x + 60, SETTINGS_PANEL.y + 412);
    ctx.fillText(`${t("total_score")}: ${total_score}`, SETTINGS_PANEL.x + 60, SETTINGS_PANEL.y + 438);

    drawButton(t("back"), SETTINGS_BACK, RED);
  }

  function drawSplash() {
    if (splashVideo.readyState >= 2) {
      ctx.drawImage(splashVideo, 0, 0, WIDTH, HEIGHT);
    } else {
      ctx.fillStyle = "#000";
      ctx.fillRect(0,0,WIDTH,HEIGHT);
      drawTextCentered(t("loading"), WIDTH/2, HEIGHT/2, 36, "#fff");
    }
  }

  // Pet UI
  const PET_SIZE = 50;
  const PET_FIXED_POS = [WIDTH - PET_SIZE - 18, HEIGHT - PET_SIZE - 18];
  const PET_GENERIC_LINES_EN = [
    "You got this!",
    "Steady now, we are improving!",
    "No rush, clean moves win!",
    "Great rhythm, keep it up!",
    "Nice work! Keep going!",
  ];
  const PET_LOW_LINES_EN = [
    "Careful, you're a bit low!",
    "Stay safe, avoid obstacles first!",
    "Focus a bit, you can do this!",
    "You're okay—just be more careful!",
  ];
  const PET_GOOD_LINES_EN = [
    "Health looks good! Keep it up!",
    "Nice length—stay confident!",
    "Score is rising, keep pushing!",
    "Smooth play—love it!",
  ];
  const PET_GENERIC_LINES_VI = [
    "Cố lên! Bạn làm được mà!",
    "Bình tĩnh thôi, mình đang tiến bộ!",
    "Đừng vội, né chuẩn là thắng!",
    "Giữ nhịp tốt, chơi ổn lắm!",
    "Rất ổn! Tiếp tục như vậy nhé!",
  ];
  const PET_LOW_LINES_VI = [
    "Cẩn thận nhé, bạn đang hơi yếu!",
    "Giữ an toàn, né vật cản trước đã!",
    "Tập trung một chút, mình ổn thôi!",
    "Bạn vẫn ổn, chỉ cần cẩn thận hơn!",
  ];
  const PET_GOOD_LINES_VI = [
    "Máu đang ổn! Cứ thế phát huy!",
    "Độ dài tốt rồi, tự tin lên!",
    "Điểm cao dần rồi đó, cố thêm chút!",
    "Nhịp chơi đẹp lắm!",
  ];
  let pet_selected_idx = 0;
  let pet_enabled = false;
  let pet_line = "";
  let pet_line_until = 0;
  let pet_next_chat = 0;

  function petSay(text, duration=2800) {
    pet_line = text;
    pet_line_until = Date.now() + duration;
    pet_next_chat = Date.now() + 3500;
  }

  function petLinePool(kind) {
    if (lang === "en") {
      if (kind === "generic") return PET_GENERIC_LINES_EN;
      if (kind === "low") return PET_LOW_LINES_EN;
      return PET_GOOD_LINES_EN;
    }
    if (kind === "generic") return PET_GENERIC_LINES_VI;
    if (kind === "low") return PET_LOW_LINES_VI;
    return PET_GOOD_LINES_VI;
  }

  function petPickLine() {
    const lowScore = score <= 2;
    const lowLen = snake.length <= MIN_SNAKE_LEN + 1;
    if (lowScore || lowLen) {
      const pool = petLinePool("low");
      return pool[randInt(0, pool.length - 1)];
    }
    const pool = petLinePool("good");
    return pool[randInt(0, pool.length - 1)];
  }

  function drawPetIcon(name, x, y, size) {
    const cx = x + size/2;
    const cy = y + size/2;
    const r = size/2;
    const shell = ctx.createRadialGradient(cx - r*0.2, cy - r*0.2, r*0.2, cx, cy, r);
    shell.addColorStop(0, "rgba(255,255,255,0.55)");
    shell.addColorStop(1, "rgba(10,16,30,0.85)");
    ctx.save();
    ctx.shadowColor = "rgba(90,220,255,0.35)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = shell;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // inner badge
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, Math.PI*2); ctx.clip();
    if (name === "Penguin") {
      const body = ctx.createRadialGradient(cx - 6, cy - 8, 4, cx, cy + 6, r);
      body.addColorStop(0, "#3b4258");
      body.addColorStop(1, "#121728");
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.ellipse(cx, cy + 6, r*0.62, r*0.72, 0, 0, Math.PI*2); ctx.fill();
      const belly = ctx.createRadialGradient(cx - 4, cy - 2, 4, cx, cy + 10, r*0.8);
      belly.addColorStop(0, "#ffffff");
      belly.addColorStop(1, "#cfd8e6");
      ctx.fillStyle = belly;
      ctx.beginPath(); ctx.ellipse(cx, cy + 8, r*0.38, r*0.5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ffb347";
      ctx.beginPath(); ctx.moveTo(cx - 6, cy + 2); ctx.lineTo(cx + 6, cy + 2); ctx.lineTo(cx, cy + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#0b1021";
      ctx.beginPath(); ctx.arc(cx - 6, cy - 6, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 6, cy - 6, 3, 0, Math.PI*2); ctx.fill();
    } else if (name === "Cat") {
      const fur = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy + 4, r);
      fur.addColorStop(0, "#ffd9b3");
      fur.addColorStop(1, "#c7885b");
      ctx.fillStyle = fur;
      ctx.beginPath(); ctx.ellipse(cx, cy + 2, r*0.62, r*0.58, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ffcf9c";
      ctx.beginPath(); ctx.moveTo(cx - 16, cy - 10); ctx.lineTo(cx - 2, cy - 18); ctx.lineTo(cx - 6, cy - 2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 16, cy - 10); ctx.lineTo(cx + 2, cy - 18); ctx.lineTo(cx + 6, cy - 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#2a2338";
      ctx.beginPath(); ctx.arc(cx - 6, cy - 4, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 6, cy - 4, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ff8aa8";
      ctx.beginPath(); ctx.arc(cx, cy + 6, 3, 0, Math.PI*2); ctx.fill();
    } else if (name === "Dog") {
      const fur = ctx.createRadialGradient(cx - 8, cy - 6, 4, cx, cy + 6, r);
      fur.addColorStop(0, "#c27a4a");
      fur.addColorStop(1, "#6b3a1d");
      ctx.fillStyle = fur;
      ctx.beginPath(); ctx.ellipse(cx, cy + 2, r*0.62, r*0.58, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#543018";
      ctx.beginPath(); ctx.ellipse(cx - 16, cy + 2, 10, 12, 0.2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 16, cy + 2, 10, 12, -0.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff1d2";
      ctx.beginPath(); ctx.ellipse(cx, cy + 10, 10, 8, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#2a1b12";
      ctx.beginPath(); ctx.arc(cx - 6, cy - 4, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 6, cy - 4, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#2a1b12";
      ctx.beginPath(); ctx.arc(cx, cy + 6, 3, 0, Math.PI*2); ctx.fill();
    } else if (name === "Parrot") {
      const body = ctx.createRadialGradient(cx - 6, cy - 8, 4, cx, cy + 6, r);
      body.addColorStop(0, "#7bffcf");
      body.addColorStop(1, "#19a673");
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.ellipse(cx + 2, cy + 4, r*0.55, r*0.6, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#2d6bff";
      ctx.beginPath(); ctx.ellipse(cx - 6, cy + 2, r*0.35, r*0.45, -0.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ff6a4a";
      ctx.beginPath(); ctx.moveTo(cx + 6, cy + 2); ctx.lineTo(cx + 16, cy + 6); ctx.lineTo(cx + 6, cy + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#0b1021";
      ctx.beginPath(); ctx.arc(cx + 2, cy - 4, 3, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = "#00dcff";
      ctx.beginPath(); ctx.arc(cx, cy, r*0.7, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();

    // highlight
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath(); ctx.ellipse(cx - r*0.25, cy - r*0.35, r*0.35, r*0.25, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function updatePetMotion() {
    const now = Date.now();
    if (now >= pet_next_chat && (!pet_line || now >= pet_line_until)) {
      const pool = Math.random() < 0.25 ? petLinePool("generic") : null;
      const line = pool ? pool[randInt(0, pool.length - 1)] : petPickLine();
      petSay(line, 2400);
    }
  }

  function petSayLang(en, vi, duration=2800) {
    petSay(lang === "en" ? en : vi, duration);
  }

  function drawPetUI() {
    const now = Date.now();
    const [x,y] = PET_FIXED_POS;
    const petName = PET_CHOICES[pet_selected_idx][0];
    const bob = Math.sin(now * 0.004) * 2;
    const cx = x + PET_SIZE/2;
    const cy = y + PET_SIZE/2 + bob;
    ctx.save();
    ctx.shadowColor = "rgba(90,220,255,0.7)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "rgba(10,20,40,0.75)";
    ctx.beginPath(); ctx.arc(cx, cy, PET_SIZE/2 + 4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "rgba(120,220,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, PET_SIZE/2 + 4, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    drawPetIcon(petName, x, y + bob, PET_SIZE);
    if (pet_line && now < pet_line_until) {
      ctx.font = "500 16px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
      const w = Math.min(460, ctx.measureText(pet_line).width + 26);
      const h = 38;
      let bx = x + PET_SIZE + 10;
      let by = y - 6;
      if (bx + w > WIDTH - 10) bx = x - w - 10;
      if (by < 10) by = 10;
      roundRect(ctx, bx, by, w, h, 14);
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fill();
      roundRect(ctx, bx, by, w, h, 14);
      ctx.strokeStyle = "rgba(0,220,255,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ebf5ff";
      ctx.fillText(pet_line, bx + 13, by + 24);
    }
  }

  // Game state
  let state = STATE_SPLASH;
  let player_name = "";
  let account_user = "";
  let account_pass = "";
  let auth_user = "";
  let auth_pass = "";
  let auth_confirm = "";
  let auth_mode = "login";
  let auth_focus = 0;
  let auth_error = "";
  let auth_show_pass = false;
  let auth_show_confirm = false;
  let auth_busy = false;

  const savedAccount = (() => {
    try {
      return JSON.parse(localStorage.getItem("snake_account") || "null");
    } catch (e) {
      return null;
    }
  })();
  function loadLocalAccounts() {
    try {
      const raw = JSON.parse(localStorage.getItem("snake_accounts") || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }
  function saveLocalAccounts(list) {
    localStorage.setItem("snake_accounts", JSON.stringify(list));
  }
  if (savedAccount && savedAccount.username && savedAccount.password) {
    account_user = String(savedAccount.username);
    account_pass = String(savedAccount.password);
    auth_user = account_user;
    auth_mode = "login";
  } else {
    auth_mode = "register";
  }
  let end_message = "";
  let selected_bg_idx = 0;
  let mode_selected_idx = 0;
  let player_color = GREEN.slice();
  let enemy_color = ORANGE.slice();
  let player_select = player_color.slice();
  let enemy_select = enemy_color.slice();

  let snake = [[Math.floor(GRID_W/2), Math.floor(GRID_H/2)]];
  let enemy = [[Math.floor(GRID_W/2) + 5, Math.floor(GRID_H/2)]];
  let direction = "RIGHT";
  let score = 0;
  let mode_name = "";
  let win_score = 0;
  let last_mode_cfg = null;
  let obstacles = [];
  let apple = randomGrid(snake.concat(obstacles, enemy));

  let special_item = null;
  let special_type = null;
  let special_spawn_time = 0;
  let last_special_spawn = 0;

  let gun_item = null;
  let gun_spawn_time = 0;
  let gun_visible_ai_after = 0;
  let last_gun_spawn = 0;
  let player_has_gun = false;
  let enemy_has_gun = false;
  let player_gun_ammo = 0;
  let enemy_gun_ammo = 0;
  let bullets = [];
  let shake_until = 0;
  const MIN_SNAKE_LEN = 2;
  let paused = false;
  let muted = false;
  let flashUntil = 0;
  let flashColor = "rgba(255,255,255,0.0)";
  let slowmoUntil = 0;
  let slowmoCooldownUntil = 0;

  // Wow FX: floating texts + combo
  let floatTexts = [];
  let comboCount = 0;
  let comboUntil = 0;

  function addFloatText(text, gx, gy, color) {
    floatTexts.push({
      text,
      x: gx * CELL + CELL / 2,
      y: gy * CELL + CELL / 2,
      vy: -0.6,
      life: 60,
      color
    });
  }

  function playSfx(s) {
    if (muted) return;
    try {
      s.volume = sfxVolume;
      s.currentTime = 0;
      s.play();
    } catch (e) {}
  }

  function playSfxScaled(s, scale = 1) {
    if (muted) return;
    try {
      s.volume = sfxVolume * scale;
      s.currentTime = 0;
      s.play();
    } catch (e) {}
  }

  function setMusicMuted(flag) {
    muted = flag;
    try {
      audio.bg.muted = muted;
      if (!muted) audio.bg.play().catch(()=>{});
    } catch (e) {}
  }

  function applyMusicSettings() {
    audio.bg.volume = musicVolume;
    if (musicChoice === "silent") {
      audio.bg.pause();
    } else {
      if (!muted) audio.bg.play().catch(()=>{});
    }
    localStorage.setItem("snake_music_vol", String(musicVolume));
    localStorage.setItem("snake_sfx_vol", String(sfxVolume));
    localStorage.setItem("snake_music_choice", musicChoice);
  }

  updateHintText();

  function updateFloatTexts() {
    floatTexts = floatTexts.filter(f => f.life > 0);
    for (const f of floatTexts) {
      f.y += f.vy;
      f.life -= 1;
    }
  }

  function drawFloatTexts() {
    if (!floatTexts.length) return;
    ctx.save();
    ctx.font = "700 18px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    for (const f of floatTexts) {
      const alpha = Math.max(0, Math.min(1, f.life / 60));
      ctx.fillStyle = f.color.replace("ALPHA", alpha.toFixed(2));
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function spawnSpecial() {
    special_item = randomGrid(snake.concat(obstacles, enemy, [apple]));
    special_type = Math.random() < 0.80 ? "buff" : "harm";
    special_spawn_time = Date.now();
  }

  function spawnGun(now) {
    const list = snake.concat(obstacles, enemy, [apple]);
    if (special_item) list.push(special_item);
    gun_item = randomGrid(list);
    gun_spawn_time = now;
    gun_visible_ai_after = now + 3000;
  }

  function fireBullet(owner, now) {
    for (const b of bullets) if (b.owner === owner) return;
    let hx, hy;
    if (owner === "player") {
      hx = snake[0][0]*CELL + CELL/2;
      hy = snake[0][1]*CELL + CELL/2;
    } else {
      hx = enemy[0][0]*CELL + CELL/2;
      hy = enemy[0][1]*CELL + CELL/2;
    }
    bullets.push({ owner, x: hx, y: hy });
  }

  function applyBulletHit(targetOwner, now) {
    playSfxScaled(audio.gun, 0.5);
    if (targetOwner === "player") {
      if (score > 1 && snake.length > MIN_SNAKE_LEN) {
        score -= 1;
        snake.pop();
      }
    } else {
      if (enemy.length > MIN_SNAKE_LEN) enemy.pop();
    }
    shake_until = now + 250;
  }

  function updateBullets(now) {
    if (!bullets.length) return;
    const speed = 30.0;
    const next = [];
    for (const b of bullets) {
      let tx, ty, targetOwner;
      if (b.owner === "player") {
        tx = enemy[0][0]*CELL + CELL/2;
        ty = enemy[0][1]*CELL + CELL/2;
        targetOwner = "enemy";
      } else {
        tx = snake[0][0]*CELL + CELL/2;
        ty = snake[0][1]*CELL + CELL/2;
        targetOwner = "player";
      }
      const dx = tx - b.x;
      const dy = ty - b.y;
      const d2 = dx*dx + dy*dy;
      const d = d2 > 0 ? Math.sqrt(d2) : 0;
      if (d <= 10.0 || d <= speed) {
        applyBulletHit(targetOwner, now);
        continue;
      }
      const inv = d > 0 ? 1.0 / d : 0.0;
      b.x += dx * inv * speed;
      b.y += dy * inv * speed;
      if (b.x >= -100 && b.x <= WIDTH + 100 && b.y >= -100 && b.y <= HEIGHT + 100) {
        next.push(b);
      }
    }
    bullets = next;
  }

  function moveEnemy() {
    const head = enemy[0].slice();
    const candidates = [
      [head[0]+1, head[1]],
      [head[0]-1, head[1]],
      [head[0], head[1]+1],
      [head[0], head[1]-1],
    ].filter(p => p[0] >= 0 && p[0] < GRID_W && p[1] >= 0 && p[1] < GRID_H);
    const safeMoves = candidates.filter(p => !obstacles.some(o => o[0]===p[0] && o[1]===p[1]) && !snake.some(s => s[0]===p[0] && s[1]===p[1]) && !enemy.some(e => e[0]===p[0] && e[1]===p[1]));
    const semiSafe = candidates.filter(p => !obstacles.some(o => o[0]===p[0] && o[1]===p[1]) && !enemy.some(e => e[0]===p[0] && e[1]===p[1]));
    let pool = safeMoves.length ? safeMoves : (semiSafe.length ? semiSafe : candidates);
    let target = apple;
    const now = Date.now();
    if (gun_item && now >= gun_visible_ai_after && !enemy_has_gun) target = gun_item;
    pool.sort((a,b) => Math.abs(a[0]-target[0]) + Math.abs(a[1]-target[1]) - (Math.abs(b[0]-target[0]) + Math.abs(b[1]-target[1])));
    const newHead = pool[0];
    enemy.unshift(newHead);
    if (newHead[0] === apple[0] && newHead[1] === apple[1]) {
      apple = randomGrid(snake.concat(obstacles, enemy));
    } else {
      enemy.pop();
    }
    if (special_item && newHead[0] === special_item[0] && newHead[1] === special_item[1]) special_item = null;
    if (gun_item && newHead[0] === gun_item[0] && newHead[1] === gun_item[1]) {
      enemy_has_gun = true;
      enemy_gun_ammo = 1;
      gun_item = null;
    }
  }

  function startGame(cfg) {
    win_score = cfg[0];
    const obs_count = cfg[1];
    mode_name = cfg[2];
    last_mode_cfg = cfg;
    snake = [[Math.floor(GRID_W/2), Math.floor(GRID_H/2)]];
    enemy = [[randInt(0, GRID_W-1), randInt(0, GRID_H-1)]];
    direction = "RIGHT";
    score = 0;

    snake.push([snake[0][0]-1, snake[0][1]]);
    const ex = enemy[0][0];
    const ey = enemy[0][1];
    const candidates = [[ex-1,ey],[ex+1,ey],[ex,ey-1],[ex,ey+1]].filter(p => p[0] >=0 && p[0] < GRID_W && p[1] >=0 && p[1] < GRID_H && !snake.some(s => s[0]===p[0] && s[1]===p[1]) && !enemy.some(e => e[0]===p[0] && e[1]===p[1]));
    enemy.push(candidates.length ? candidates[0] : [ex,ey]);

    obstacles = Array.from({length: obs_count}).map(() => randomGrid(snake.concat(enemy)));
    apple = randomGrid(snake.concat(obstacles, enemy));

    special_item = null; special_type = null; special_spawn_time = 0; last_special_spawn = Date.now();
    gun_item = null; gun_spawn_time = 0; gun_visible_ai_after = 0; last_gun_spawn = Date.now();
    player_has_gun = false; enemy_has_gun = false; player_gun_ammo = 0; enemy_gun_ammo = 0;
    bullets = []; shake_until = 0;
    acc = 0;
    lastTick = 0;
    state = STATE_PLAY;
  }

  function startSelectedMode() {
    const cfg = MODE_CHOICES[mode_selected_idx][1];
    last_mode_cfg = cfg;
    startGame(cfg);
  }

  const API_BASE = "";
  let leaderboard_cache = null;
  let high_score = parseInt(localStorage.getItem("snake_highscore") || "0", 10);

  function normalizeLeaderboard(data) {
    const arr = Array.isArray(data) ? data : [];
    const bestByName = new Map();
    for (const row of arr) {
      if (!Array.isArray(row) || row.length < 3) continue;
      const name = row[0];
      const score = row[1];
      const mode = row[2];
      if (typeof name !== "string" || typeof score !== "number") continue;
      const prev = bestByName.get(name);
      if (!prev || score > prev[1]) bestByName.set(name, [name, score, mode]);
    }
    const out = Array.from(bestByName.values());
    out.sort((a, b) => b[1] - a[1]);
    return out.slice(0, 10);
  }

  function setLeaderboard(data) {
    leaderboard_cache = normalizeLeaderboard(data);
    localStorage.setItem("snake_leaderboard", JSON.stringify(leaderboard_cache));
  }

  function loadHighScore() {
    return high_score || 0;
  }

  function saveHighScore(score) {
    high_score = score;
    localStorage.setItem("snake_highscore", String(score));
    postJSON("/api/highscore", { highscore: score });
  }

  function loadLeaderboard() {
    if (!leaderboard_cache) {
      const raw = localStorage.getItem("snake_leaderboard");
      const data = raw ? JSON.parse(raw) : [];
      leaderboard_cache = normalizeLeaderboard(data);
    }
    return leaderboard_cache;
  }

  function clearLeaderboard() {
    setLeaderboard([]);
    postJSON("/api/leaderboard", { leaderboard: [] });
  }

  function saveLeaderboard(name, score, mode) {
    const data = loadLeaderboard().slice();
    const idx = data.findIndex(r => r[0] === name);
    if (idx >= 0) {
      if (score > data[idx][1]) {
        data[idx][1] = score;
        data[idx][2] = mode;
      }
    } else {
      data.push([name, score, mode]);
    }
    setLeaderboard(data);
    postJSON("/api/leaderboard", { leaderboard: loadLeaderboard() });
  }

  async function getJSON(path) {
    try {
      const res = await fetch(API_BASE + path, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function postJSON(path, body) {
    try {
      await fetch(API_BASE + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      // ignore offline/server errors
    }
  }

  async function postJSONResp(path, body) {
    try {
      const res = await fetch(API_BASE + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let data = null;
      try { data = await res.json(); } catch (_) { data = null; }
      return { ok: res.ok, data };
    } catch (e) {
      return { ok: false, data: null, error: true };
    }
  }

  async function initBackendSync() {
    const hs = await getJSON("/api/highscore");
    if (hs && typeof hs.highscore === "number") {
      high_score = hs.highscore;
      localStorage.setItem("snake_highscore", String(high_score));
    }
    const lb = await getJSON("/api/leaderboard");
    if (lb && Array.isArray(lb.leaderboard)) {
      setLeaderboard(lb.leaderboard);
    }
  }

  void initBackendSync();
  let total_games = parseInt(localStorage.getItem("snake_total_games") || "0", 10);
  let total_score = parseInt(localStorage.getItem("snake_total_score") || "0", 10);
  function recordGame(score) {
    total_games += 1;
    total_score += score;
    localStorage.setItem("snake_total_games", String(total_games));
    localStorage.setItem("snake_total_score", String(total_score));
  }

  function stepPlay(now) {
    if (paused) return;
    if (!special_item && now - last_special_spawn > 5000) {
      spawnSpecial();
      last_special_spawn = now;
    }
    if (special_item && now - special_spawn_time > 3000) special_item = null;

    if (!gun_item && now - last_gun_spawn > 11000) {
      spawnGun(now);
      last_gun_spawn = now;
    }
    if (gun_item && now - gun_spawn_time > 7000) gun_item = null;

    const head = snake[0].slice();
    const dirVec = { "UP":[0,-1], "DOWN":[0,1], "LEFT":[-1,0], "RIGHT":[1,0] };
    const [dx, dy] = dirVec[direction] || [0,0];
    head[0] += dx; head[1] += dy;
    snake.unshift(head);

    if (head[0] === apple[0] && head[1] === apple[1]) {
      playSfx(audio.eat);
      score += 1;
      addFloatText("+1", head[0], head[1], "rgba(120,255,180,ALPHA)");
      if (now <= comboUntil) comboCount += 1;
      else comboCount = 1;
      comboUntil = now + 3000;
      if (comboCount >= 3) {
        addFloatText(`COMBO x${comboCount}`, head[0], head[1]-1, "rgba(255,220,120,ALPHA)");
      }
      if (score > 0 && score % 5 === 0) {
        addFloatText("NICE!", head[0], head[1]-2, "rgba(180,220,255,ALPHA)");
      }
      apple = randomGrid(snake.concat(obstacles, enemy));
    } else {
      snake.pop();
    }

    if (special_item && head[0] === special_item[0] && head[1] === special_item[1]) {
      if (score <= 1 && snake.length <= MIN_SNAKE_LEN) {
        playSfx(audio.lose);
        saveLeaderboard(player_name, score, mode_name);
        recordGame(score);
        if (score > high_score) saveHighScore(score);
        high_score = loadHighScore();
        end_message = "YOU LOSE";
        if (pet_enabled) petSayLang("Keep going!!!", "Cố lên nhé!!!", 3200);
        selected_bg_idx = 0;
        state = STATE_END;
        return;
      }
      const value = randInt(1,3);
      if (special_type === "buff") {
        score += value;
        for (let i = 0; i < value; i++) snake.push(snake[snake.length-1].slice());
        playSfx(audio.buff);
        addFloatText(`+${value}`, head[0], head[1], "rgba(120,255,220,ALPHA)");
        flashUntil = now + 160;
        flashColor = "rgba(120,255,220,0.18)";
      } else {
        score -= value;
        if (score < 0) score = 0;
        for (let i = 0; i < value; i++) if (snake.length > MIN_SNAKE_LEN) snake.pop();
        addFloatText(`-${value}`, head[0], head[1], "rgba(120,255,220,ALPHA)");
        flashUntil = now + 160;
        flashColor = "rgba(120,255,220,0.18)";
      }
      special_item = null;
    }

    if (gun_item && head[0] === gun_item[0] && head[1] === gun_item[1]) {
      player_has_gun = true;
      player_gun_ammo = 1;
      gun_item = null;
    }

    moveEnemy();

    if (player_has_gun && player_gun_ammo > 0) {
      const before = bullets.length;
      fireBullet("player", now);
      if (bullets.length > before) {
        player_gun_ammo -= 1;
        if (player_gun_ammo <= 0) player_has_gun = false;
      }
    }
    if (enemy_has_gun && enemy_gun_ammo > 0) {
      const before = bullets.length;
      fireBullet("enemy", now);
      if (bullets.length > before) {
        enemy_gun_ammo -= 1;
        if (enemy_gun_ammo <= 0) enemy_has_gun = false;
      }
    }

    updateBullets(now);
    updateFloatTexts();

    const collisionEnemy = enemy.some(e => e[0] === head[0] && e[1] === head[1]);
    if (
      head[0] < 0 || head[0] >= GRID_W ||
      head[1] < 0 || head[1] >= GRID_H ||
      snake.slice(1).some(s => s[0] === head[0] && s[1] === head[1]) ||
      obstacles.some(o => o[0] === head[0] && o[1] === head[1]) ||
      collisionEnemy
    ) {
      playSfx(audio.lose);
      saveLeaderboard(player_name, score, mode_name);
      recordGame(score);
      if (score > high_score) saveHighScore(score);
      high_score = loadHighScore();
      end_message = "YOU LOSE";
      if (pet_enabled) petSayLang("Keep going!!!", "Cố lên nhé!!!", 3200);
      selected_bg_idx = 0;
      state = STATE_END;
    }

    if (mode_name !== "INFINITE" && score >= win_score) {
      playSfx(audio.win);
      saveLeaderboard(player_name, score, mode_name);
      recordGame(score);
      if (score > high_score) saveHighScore(score);
      high_score = loadHighScore();
      end_message = "YOU WIN";
      if (pet_enabled) petSayLang("You're awesome!", "Bạn đỉnh lắm!", 3200);
      selected_bg_idx = 0;
      state = STATE_END;
    }
  }

  function renderPlay(now, sx = 0, sy = 0) {
    ctx.save();
    ctx.translate(sx, sy);
    const grid = ASSET.images.get("grid");
    if (grid) ctx.drawImage(grid, 0, 0, WIDTH, HEIGHT);
    obstacles.forEach(drawObstacle);
    drawApple(apple);
    drawSpecial();
    drawGun();
    drawSnake(snake, player_color);
    drawSnake(enemy, enemy_color);
    drawHud(`${player_name} | Score: ${score} | High: ${high_score}`);
    drawProgressBar();
    drawBullets();
    drawFloatTexts();
    drawSlowmoIndicator(now);
    if (paused) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      drawTextCentered(t("paused"), WIDTH/2, HEIGHT/2 - 10, 48, "#ffffff");
      drawTextCentered(t("resume_hint"), WIDTH/2, HEIGHT/2 + 26, 20, "#d2dcee", "500");
      ctx.restore();
    }
    if (Date.now() < flashUntil) {
      ctx.save();
      ctx.fillStyle = flashColor;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawSlowmoIndicator(now) {
    if (slowmoUntil <= now && slowmoCooldownUntil <= now) return;
    const x = WIDTH - 200;
    const y = 130;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    roundRect(ctx, x, y, 170, 24, 10);
    ctx.fill();
    ctx.fillStyle = slowmoUntil > now ? "rgba(120,255,220,0.9)" : "rgba(255,200,120,0.8)";
    ctx.font = "600 14px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    ctx.fillText(slowmoUntil > now ? "SLOW-MO ACTIVE" : "SLOW-MO CD", x + 12, y + 17);
    ctx.restore();
  }

  function drawProgressBar() {
    if (mode_name === "INFINITE" || win_score <= 0) return;
    const pct = Math.max(0, Math.min(1, score / win_score));
    const barW = 260;
    const barH = 10;
    const x = 540;
    const y = 24;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    roundRect(ctx, x, y, barW, barH, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(0,220,255,0.8)";
    roundRect(ctx, x, y, Math.max(6, barW * pct), barH, 6);
    ctx.fill();
    ctx.restore();
  }

  function drawNameScreen() {
    const px = WIDTH/2 - 430;
    const py = 160;
    drawPanel(px, py, 860, 440);
    drawTextCentered(t("enter_name"), WIDTH/2, py + 85, 44, "#fff");
    ctx.fillStyle = "#d2dcee";
    ctx.font = "500 18px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    ctx.fillText(t("type_hint"), WIDTH/2 - 190, py + 140);
    const box = { x: WIDTH/2 - 320, y: py + 200, w: 640, h: 78 };
    roundRect(ctx, box.x, box.y, box.w, box.h, 16);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fill();
    roundRect(ctx, box.x+4, box.y+4, box.w-8, box.h-8, 14);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
    const show = Math.floor(Date.now() / 500) % 2 === 0;
    const name = player_name || t("your_name");
    const col = player_name ? "#00ff6a" : "#aab4d2";
    ctx.fillStyle = col;
    ctx.font = "600 28px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    ctx.fillText(name + ((show && player_name) ? "|" : ""), box.x + 22, box.y + 48);
    ctx.fillStyle = "#d2dcee";
    ctx.font = "500 18px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
    ctx.fillText(t("press_enter"), WIDTH/2 - 120, py + 360);
  }

  const AUTH_PANEL = { x: WIDTH/2 - 430, y: 120, w: 860, h: 560 };
  const AUTH_BOX = { x: WIDTH/2 - 300, y: AUTH_PANEL.y + 170, w: 600, h: 62 };
  const AUTH_GAP = 90;
  const AUTH_EYE_SIZE = 42;
  const AUTH_BTN = { x: WIDTH/2 - 140, y: AUTH_PANEL.y + 430, w: 280, h: 52 };
  const AUTH_SWITCH = { x: WIDTH/2 - 200, y: AUTH_PANEL.y + 495, w: 400, h: 36 };

  function maskText(s) {
    if (!s) return "";
    return "•".repeat(s.length);
  }

  function drawEyeButton(rect, open) {
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const cx = rect.x + rect.w/2;
    const cy = rect.y + rect.h/2;
    ctx.strokeStyle = "#e8f3ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 12, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (open) {
      ctx.fillStyle = "#e8f3ff";
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = "#ff96a3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rect.x + 8, rect.y + rect.h - 8);
      ctx.lineTo(rect.x + rect.w - 8, rect.y + 8);
      ctx.stroke();
    }
  }

  function drawAuthScreen() {
    drawPanel(AUTH_PANEL.x, AUTH_PANEL.y, AUTH_PANEL.w, AUTH_PANEL.h);
    drawTextCentered(auth_mode === "login" ? t("auth_title_login") : t("auth_title_register"), WIDTH/2, AUTH_PANEL.y + 70, 44, "#fff");

    const labels = [
      { label: t("auth_username"), value: auth_user, mask: false },
      { label: t("auth_password"), value: auth_pass, mask: !auth_show_pass },
    ];
    if (auth_mode === "register") {
      labels.push({ label: t("auth_confirm"), value: auth_confirm, mask: !auth_show_confirm });
    }

    for (let i = 0; i < labels.length; i++) {
      const y = AUTH_BOX.y + i * AUTH_GAP;
      ctx.fillStyle = "#d2dcee";
      ctx.font = "600 18px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText(labels[i].label, AUTH_BOX.x, y - 14);

      const box = { x: AUTH_BOX.x, y, w: AUTH_BOX.w, h: AUTH_BOX.h };
      roundRect(ctx, box.x, box.y, box.w, box.h, 14);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fill();
      roundRect(ctx, box.x+3, box.y+3, box.w-6, box.h-6, 12);
      ctx.strokeStyle = i === auth_focus ? "rgba(0,220,255,0.8)" : "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const show = Math.floor(Date.now() / 500) % 2 === 0;
      const textVal = labels[i].mask ? maskText(labels[i].value) : labels[i].value;
      const display = textVal || "";
      ctx.fillStyle = display ? "#e8f3ff" : "#8c97b7";
      ctx.font = "600 24px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText(display + ((show && i === auth_focus) ? "|" : ""), box.x + 18, box.y + 40);

      if (labels[i].label === t("auth_password")) {
        const eyeRect = { x: box.x + box.w - AUTH_EYE_SIZE - 10, y: box.y + 10, w: AUTH_EYE_SIZE, h: AUTH_EYE_SIZE };
        drawEyeButton(eyeRect, auth_show_pass);
      } else if (labels[i].label === t("auth_confirm")) {
        const eyeRect = { x: box.x + box.w - AUTH_EYE_SIZE - 10, y: box.y + 10, w: AUTH_EYE_SIZE, h: AUTH_EYE_SIZE };
        drawEyeButton(eyeRect, auth_show_confirm);
      }
    }

    if (auth_error) {
      ctx.fillStyle = "#ff6b6b";
      ctx.font = "600 18px Bahnschrift, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText(auth_error, AUTH_BOX.x, AUTH_PANEL.y + 380);
    }

    drawButton(auth_mode === "login" ? t("auth_submit_login") : t("auth_submit_register"), AUTH_BTN, GREEN);
    drawButton(auth_mode === "login" ? t("auth_switch_register") : t("auth_switch_login"), AUTH_SWITCH, YELLOW);
  }

  function getAuthFieldRects() {
    const fields = [
      { key: "user", rect: { x: AUTH_BOX.x, y: AUTH_BOX.y, w: AUTH_BOX.w, h: AUTH_BOX.h } },
      { key: "pass", rect: { x: AUTH_BOX.x, y: AUTH_BOX.y + AUTH_GAP, w: AUTH_BOX.w, h: AUTH_BOX.h } },
    ];
    if (auth_mode === "register") {
      fields.push({ key: "confirm", rect: { x: AUTH_BOX.x, y: AUTH_BOX.y + AUTH_GAP * 2, w: AUTH_BOX.w, h: AUTH_BOX.h } });
    }
    return fields;
  }

  function getAuthEyeRects() {
    const passRect = { x: AUTH_BOX.x + AUTH_BOX.w - AUTH_EYE_SIZE - 10, y: AUTH_BOX.y + AUTH_GAP + 10, w: AUTH_EYE_SIZE, h: AUTH_EYE_SIZE };
    const confirmRect = auth_mode === "register"
      ? { x: AUTH_BOX.x + AUTH_BOX.w - AUTH_EYE_SIZE - 10, y: AUTH_BOX.y + AUTH_GAP * 2 + 10, w: AUTH_EYE_SIZE, h: AUTH_EYE_SIZE }
      : null;
    return { passRect, confirmRect };
  }

  async function submitAuth() {
    if (auth_busy) return;
    auth_busy = true;
    auth_error = "";
    if (auth_mode === "register") {
      if (!auth_user || !auth_pass || !auth_confirm || auth_pass !== auth_confirm) {
        auth_error = t("auth_error_mismatch");
        auth_busy = false;
        return;
      }
      const res = await postJSONResp("/api/register", { username: auth_user, password: auth_pass });
      if (res.ok) {
        account_user = auth_user;
        account_pass = auth_pass;
        localStorage.setItem("snake_account", JSON.stringify({ username: account_user, password: account_pass }));
        const localList = loadLocalAccounts();
        if (!localList.some(a => a.username === account_user)) {
          localList.push({ username: account_user, password: account_pass });
          saveLocalAccounts(localList);
        }
        auth_user = account_user;
        auth_pass = "";
        auth_confirm = "";
        auth_mode = "login";
        auth_focus = 0;
      } else if (res.data && res.data.error === "exists") {
        auth_error = t("auth_error_exists");
      } else if (res.error) {
        const localList = loadLocalAccounts();
        if (localList.some(a => a.username === auth_user)) {
          auth_error = t("auth_error_exists");
        } else {
          localList.push({ username: auth_user, password: auth_pass });
          saveLocalAccounts(localList);
          account_user = auth_user;
          account_pass = auth_pass;
          localStorage.setItem("snake_account", JSON.stringify({ username: account_user, password: account_pass }));
          auth_user = account_user;
          auth_pass = "";
          auth_confirm = "";
          auth_mode = "login";
          auth_focus = 0;
        }
      } else {
        auth_error = t("auth_error_mismatch");
      }
      auth_busy = false;
      return;
    }

    const res = await postJSONResp("/api/login", { username: auth_user, password: auth_pass });
    if (res.ok && res.data && res.data.ok) {
      account_user = auth_user;
      account_pass = auth_pass;
      localStorage.setItem("snake_account", JSON.stringify({ username: account_user, password: account_pass }));
      const localList = loadLocalAccounts();
      if (!localList.some(a => a.username === account_user)) {
        localList.push({ username: account_user, password: account_pass });
        saveLocalAccounts(localList);
      }
      player_name = auth_user;
      auth_pass = "";
      auth_confirm = "";
      auth_error = "";
      state = STATE_PET_SELECT;
      auth_busy = false;
      return;
    }

    // fallback to local account if backend is unreachable or doesn't know this account yet
    if (res.error || (res.ok && res.data && res.data.ok === false)) {
      const localList = loadLocalAccounts();
      const okLocal = localList.some(a => a.username === auth_user && a.password === auth_pass);
      if (okLocal) {
        account_user = auth_user;
        account_pass = auth_pass;
        localStorage.setItem("snake_account", JSON.stringify({ username: account_user, password: account_pass }));
        if (res.ok && res.data && res.data.ok === false) {
          // try to sync this local account to backend
          await postJSONResp("/api/register", { username: auth_user, password: auth_pass });
        }
        player_name = auth_user;
        auth_pass = "";
        auth_confirm = "";
        auth_error = "";
        state = STATE_PET_SELECT;
        auth_busy = false;
        return;
      }
    }

    auth_error = t("auth_error_invalid");
    auth_busy = false;
  }

  function drawEndScreen() {
    ctx.fillStyle = "#000";
    drawTextCentered(end_message, WIDTH/2 + 3, 120 + 3, 60, "#000");
    const col = end_message === "YOU WIN" ? "#00ff00" : "#ff0000";
    drawTextCentered(end_message, WIDTH/2, 120, 60, col);

    const px = WIDTH/2 - 520;
    const py = 190;
    const pw = 1040;
    const ph = 590;
    drawPanel(px, py, pw, ph);
    drawTextCentered(t("leaderboard"), WIDTH/2, py + 46, 32, "#ebf5ff");
    drawLeaderboardList(px + 60, py + 70, pw - 120, 40);
    drawPillHint(t("play_again"), WIDTH/2 - 170, py + ph - 48);
    drawPillHint(t("menu_hint"), WIDTH/2 + 170, py + ph - 48);
  }

  // Input handlers
  canvas.addEventListener('mousemove', (e) => {
    updateMouse(e);
    if (state === STATE_SETTINGS && settingsDrag) {
      if (settingsDrag === "music") {
        musicVolume = clamp((mouse.x - MUSIC_SLIDER.x) / MUSIC_SLIDER.w, 0, 1);
        applyMusicSettings();
      } else if (settingsDrag === "sfx") {
        sfxVolume = clamp((mouse.x - SFX_SLIDER.x) / SFX_SLIDER.w, 0, 1);
        applyMusicSettings();
      }
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    updateMouse(e);
    unlockAudio();
    mouse.down = true;
    if (state === STATE_AUTH) {
      const fields = getAuthFieldRects();
      const { passRect, confirmRect } = getAuthEyeRects();
      if (rectContains(AUTH_BTN, mouse.x, mouse.y)) {
        void submitAuth();
        return;
      }
      if (rectContains(AUTH_SWITCH, mouse.x, mouse.y)) {
        auth_mode = auth_mode === "login" ? "register" : "login";
        auth_focus = 0;
        auth_error = "";
        auth_pass = "";
        auth_confirm = "";
        auth_show_pass = false;
        auth_show_confirm = false;
        return;
      }
      if (rectContains(passRect, mouse.x, mouse.y)) {
        auth_show_pass = !auth_show_pass;
        return;
      }
      if (confirmRect && rectContains(confirmRect, mouse.x, mouse.y)) {
        auth_show_confirm = !auth_show_confirm;
        return;
      }
      for (let i = 0; i < fields.length; i++) {
        if (rectContains(fields[i].rect, mouse.x, mouse.y)) {
          auth_focus = i;
          return;
        }
      }
    } else if (state === STATE_PET_SELECT) {
      if (rectContains(PET_BTN_BACK, mouse.x, mouse.y)) state = STATE_AUTH;
      else if (rectContains(PET_BTN_NEXT, mouse.x, mouse.y)) { pet_enabled = true; state = STATE_GUIDE; }
      else {
        for (let i = 0; i < PET_RECTS.length; i++) {
          if (rectContains(PET_RECTS[i], mouse.x, mouse.y)) { pet_selected_idx = i; break; }
        }
      }
    } else if (state === STATE_GUIDE) {
      if (rectContains(GUIDE_BUTTON, mouse.x, mouse.y)) { guide_dragging = false; state = STATE_MODE; }
      else {
        const thumb = getGuideThumbRect();
        if (rectContains(thumb, mouse.x, mouse.y)) guide_dragging = true;
        else if (rectContains(GUIDE_SCROLLBAR, mouse.x, mouse.y)) {
          const maxScroll = getGuideMaxScroll();
          if (maxScroll > 0) {
            const travel = GUIDE_SCROLLBAR.h - thumb.h;
            if (travel > 0) {
              let relative = mouse.y - GUIDE_SCROLLBAR.y - thumb.h/2;
              relative = clamp(relative, 0, travel);
              guide_scroll = Math.floor(maxScroll * relative / travel);
              clampGuideScroll();
            }
          }
        }
      }
    } else if (state === STATE_MODE) {
      if (rectContains(MODE_BTN_GUIDE, mouse.x, mouse.y)) { guide_scroll = 0; guide_dragging = false; state = STATE_GUIDE; }
      else if (rectContains(MODE_BTN_LEADERBOARD, mouse.x, mouse.y)) state = STATE_LEADERBOARD_VIEW;
      else if (rectContains(MODE_BTN_COLOR, mouse.x, mouse.y)) state = STATE_COLOR_SELECT;
      else if (rectContains(MODE_BTN_SETTINGS, mouse.x, mouse.y)) state = STATE_SETTINGS;
      else if (rectContains(MODE_BTN_LEAVE, mouse.x, mouse.y)) state = STATE_AUTH;
      else if (rectContains(MODE_BTN_START, mouse.x, mouse.y)) state = STATE_BG_SELECT;
      else {
        for (let i = 0; i < MODE_OPTION_RECTS.length; i++) if (rectContains(MODE_OPTION_RECTS[i], mouse.x, mouse.y)) { mode_selected_idx = i; break; }
      }
    } else if (state === STATE_BG_SELECT) {
      if (rectContains(BG_BTN_BACK, mouse.x, mouse.y)) state = STATE_MODE;
      else if (rectContains(BG_BTN_NEXT, mouse.x, mouse.y)) startSelectedMode();
      else {
        const rects = buildBgRects();
        for (let i = 0; i < rects.length; i++) if (rectContains(rects[i], mouse.x, mouse.y)) { selected_bg_idx = i; break; }
      }
    } else if (state === STATE_COLOR_SELECT) {
      const c1 = pickColor(mouse.x, mouse.y, PLAYER_GRID_TOP);
      if (c1) player_select = c1.slice();
      const c2 = pickColor(mouse.x, mouse.y, ENEMY_GRID_TOP);
      if (c2) enemy_select = c2.slice();
      if (rectContains(COLOR_BTN_SAVE, mouse.x, mouse.y)) {
        player_color = player_select.slice();
        enemy_color = enemy_select.slice();
        state = STATE_MODE;
      }
    } else if (state === STATE_SETTINGS) {
      if (rectContains(SETTINGS_BACK, mouse.x, mouse.y)) {
        state = STATE_MODE;
      } else if (rectContains(MUSIC_BTN_CLASSIC, mouse.x, mouse.y)) {
        musicChoice = "classic";
        applyMusicSettings();
      } else if (rectContains(MUSIC_BTN_SILENT, mouse.x, mouse.y)) {
        musicChoice = "silent";
        applyMusicSettings();
      } else if (rectContains(LANG_BTN_EN, mouse.x, mouse.y)) {
        lang = "en";
        localStorage.setItem("snake_lang", lang);
        updateHintText();
      } else if (rectContains(LANG_BTN_VI, mouse.x, mouse.y)) {
        lang = "vi";
        localStorage.setItem("snake_lang", lang);
        updateHintText();
      } else if (rectContains(MUSIC_SLIDER, mouse.x, mouse.y)) {
        settingsDrag = "music";
        musicVolume = clamp((mouse.x - MUSIC_SLIDER.x) / MUSIC_SLIDER.w, 0, 1);
        applyMusicSettings();
      } else if (rectContains(SFX_SLIDER, mouse.x, mouse.y)) {
        settingsDrag = "sfx";
        sfxVolume = clamp((mouse.x - SFX_SLIDER.x) / SFX_SLIDER.w, 0, 1);
        applyMusicSettings();
      }
    }
  });

  canvas.addEventListener('mouseup', () => { mouse.down = false; guide_dragging = false; settingsDrag = null; });

  canvas.addEventListener('wheel', (e) => {
    if (state === STATE_GUIDE) {
      guide_scroll += e.deltaY * 0.2;
      clampGuideScroll();
    }
  });

  canvas.addEventListener('mouseleave', () => { mouse.down = false; guide_dragging = false; settingsDrag = null; });

  window.addEventListener('keydown', (e) => {
    unlockAudio();
    if (state === STATE_AUTH) {
      const fieldCount = auth_mode === "register" ? 3 : 2;
      const getVal = (idx) => idx === 0 ? auth_user : (idx === 1 ? auth_pass : auth_confirm);
      const setVal = (idx, v) => {
        if (idx === 0) auth_user = v;
        else if (idx === 1) auth_pass = v;
        else auth_confirm = v;
      };
      if (e.key === "Tab") {
        e.preventDefault();
        auth_focus = (auth_focus + 1) % fieldCount;
        return;
      }
      if (e.key === "Enter") {
        if (auth_focus < fieldCount - 1) auth_focus += 1;
        else void submitAuth();
        return;
      }
      if (e.key === "Backspace") {
        const cur = getVal(auth_focus);
        setVal(auth_focus, cur.slice(0, -1));
        auth_error = "";
        return;
      }
      if (e.key.length === 1) {
        const cur = getVal(auth_focus);
        setVal(auth_focus, cur + e.key);
        auth_error = "";
        return;
      }
    } else if (state === STATE_PET_SELECT) {
      if (e.key === "Escape" || e.key === "Backspace") state = STATE_AUTH;
      else if (CONFIRM_KEYS.has(e.key)) { pet_enabled = true; state = STATE_GUIDE; }
      else if (["ArrowLeft","a","ArrowRight","d"].includes(e.key)) pet_selected_idx = (pet_selected_idx + 1) % 4;
      else if (["ArrowUp","w","ArrowDown","s"].includes(e.key)) pet_selected_idx = (pet_selected_idx + 2) % 4;
    } else if (state === STATE_MODE) {
      const n = MODE_CHOICES.length;
      const cols = 2;
      const rows = Math.ceil(n / cols);
      const row = Math.floor(mode_selected_idx / cols);
      const col = mode_selected_idx % cols;
      if (["ArrowLeft","a"].includes(e.key)) {
        let nc = (col - 1 + cols) % cols;
        let idx = row * cols + nc;
        if (idx >= n) idx = row * cols;
        mode_selected_idx = idx;
      } else if (["ArrowRight","d"].includes(e.key)) {
        let nc = (col + 1) % cols;
        let idx = row * cols + nc;
        if (idx >= n) idx = row * cols;
        mode_selected_idx = idx;
      } else if (["ArrowUp","w"].includes(e.key)) {
        let nr = (row - 1 + rows) % rows;
        let idx = nr * cols + col;
        if (idx >= n) idx = nr * cols;
        mode_selected_idx = idx;
      } else if (["ArrowDown","s"].includes(e.key)) {
        let nr = (row + 1) % rows;
        let idx = nr * cols + col;
        if (idx >= n) idx = nr * cols;
        mode_selected_idx = idx;
      } else if (CONFIRM_KEYS.has(e.key)) state = STATE_BG_SELECT;
      else if (e.key.toLowerCase() === "s") state = STATE_SETTINGS;
    } else if (state === STATE_BG_SELECT) {
      if (e.key === "Escape" || e.key === "Backspace") state = STATE_MODE;
      else if (CONFIRM_KEYS.has(e.key)) startSelectedMode();
      else if (["ArrowLeft","a"].includes(e.key)) selected_bg_idx = (selected_bg_idx - 1 + BG_FILES.length) % BG_FILES.length;
      else if (["ArrowRight","d"].includes(e.key)) selected_bg_idx = (selected_bg_idx + 1) % BG_FILES.length;
      else if (["ArrowUp","w"].includes(e.key)) selected_bg_idx = (selected_bg_idx - BG_COLS + BG_FILES.length) % BG_FILES.length;
      else if (["ArrowDown","s"].includes(e.key)) selected_bg_idx = (selected_bg_idx + BG_COLS) % BG_FILES.length;
    } else if (state === STATE_PLAY) {
      if (e.key.toLowerCase() === "p") {
        paused = !paused;
        addFloatText(paused ? t("paused") : t("resume"), snake[0][0], snake[0][1], "rgba(200,220,255,ALPHA)");
        return;
      }
      if (e.key.toLowerCase() === "b") {
        setMusicMuted(!muted);
        addFloatText(muted ? t("muted") : t("sound_on"), snake[0][0], snake[0][1], "rgba(255,220,180,ALPHA)");
        return;
      }
      const dirMap = {
        ArrowUp: ["UP","DOWN"],
        ArrowDown: ["DOWN","UP"],
        ArrowLeft: ["LEFT","RIGHT"],
        ArrowRight: ["RIGHT","LEFT"],
      };
      if (dirMap[e.key]) {
        const [newDir, opposite] = dirMap[e.key];
        if (direction !== opposite) direction = newDir;
      }
    } else if (state === STATE_END) {
      if (e.key.toLowerCase() === "m") state = STATE_MODE;
      else if (e.key.toLowerCase() === "p" && last_mode_cfg) startGame(last_mode_cfg);
    } else if (state === STATE_LEADERBOARD_VIEW) {
      if (e.key.toLowerCase() === "m") state = STATE_MODE;
      else if (e.key.toLowerCase() === "r") clearLeaderboard();
    } else if (state === STATE_SETTINGS) {
      if (e.key === "Escape" || e.key === "Backspace") state = STATE_MODE;
    }
  });

  function step() {
    if (state === STATE_SPLASH) {
      drawSplash();
      if (splashVideo.ended) state = STATE_AUTH;
      return;
    }

    drawBackground();

    if (state === STATE_PLAY) {
      const now = Date.now();
      const stepMs = 1000 / SPEED;
      while (acc >= stepMs) {
        stepPlay(now);
        acc -= stepMs;
      }
      let sx = 0;
      let sy = 0;
      if (now < shake_until) {
        sx = randInt(-4, 4);
        sy = randInt(-4, 4);
      }
      renderPlay(now, sx, sy);
    } else if (state === STATE_AUTH) {
      drawAuthScreen();
    } else if (state === STATE_PET_SELECT) {
      drawPetSelect();
    } else if (state === STATE_GUIDE) {
      clampGuideScroll();
      drawGuideScreen();
    } else if (state === STATE_BG_SELECT) {
      drawBgSelect();
    } else if (state === STATE_MODE) {
      drawModeScreen();
    } else if (state === STATE_LEADERBOARD_VIEW) {
      drawLeaderboardScreen();
    } else if (state === STATE_COLOR_SELECT) {
      drawColorSelect();
    } else if (state === STATE_END) {
      drawEndScreen();
    } else if (state === STATE_SETTINGS) {
      drawSettingsScreen();
    }

    if (pet_enabled && ![STATE_SPLASH, STATE_PLAY, STATE_PET_SELECT].includes(state)) {
      updatePetMotion();
      drawPetUI();
    }
  }

  // Main loop
  let lastTick = 0;
  let acc = 0;
  function loop(ts) {
    if (!lastTick) lastTick = ts;
    const dt = ts - lastTick;
    lastTick = ts;
    acc += dt;
    step();
    requestAnimationFrame(loop);
  }

  loadAssets().then(() => {
    applyMusicSettings();
    splashVideo.play().catch(() => { state = STATE_AUTH; });
    requestAnimationFrame(loop);
  });
})();
