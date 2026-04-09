import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.LinearGradientPaint;
import java.awt.RadialGradientPaint;
import java.awt.RenderingHints;
import java.awt.geom.Point2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.util.Random;

import javax.imageio.ImageIO;

public class DoHoa {
    static int WIDTH = 1542;
    static int HEIGHT = 800;
    static int CELL = 20;

    static Random rng = new Random(20260312L);
    static float[] flamePhases = makePhases(520, 20260312L);
    static final File ASSET_DIR = new File("do_hoa_assets");

    public static void main(String[] args) throws Exception {
        if (args.length >= 2) {
            WIDTH = Integer.parseInt(args[0]);
            HEIGHT = Integer.parseInt(args[1]);
        }
        if (args.length >= 3) {
            CELL = Integer.parseInt(args[2]);
        }

        ASSET_DIR.mkdirs();

        BufferedImage bg = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = bg.createGraphics();
        setupQuality(g);

        paintGradient(g);
        paintNebula(g);
        paintStars(g);
        paintVignette(g);
        g.dispose();

        BufferedImage grid = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_ARGB);
        Graphics2D gg = grid.createGraphics();
        setupQuality(gg);
        paintGrid(gg);
        gg.dispose();

        ImageIO.write(bg, "jpg", new File("background 1.jpg"));
        ImageIO.write(grid, "png", new File("do_hoa_grid.png"));
        generateLeaderboardFlameFrames(24);
        generateRainbowPanelFlames(24);
        generateUiAssets();
        System.out.println("Generated background 1.jpg, do_hoa_grid.png, leaderboard_flame_00..png, do_hoa_assets/*");
    }

    static float[] makePhases(int n, long seed) {
        Random r = new Random(seed ^ 0x9E3779B97F4A7C15L);
        float[] out = new float[n];
        for (int i = 0; i < n; i++) {
            out[i] = (float) (r.nextDouble() * Math.PI * 2.0);
        }
        return out;
    }

    static void setupQuality(Graphics2D g) {
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
    }

    static void paintGradient(Graphics2D g) {
        Color top = new Color(8, 10, 28);
        Color bottom = new Color(4, 26, 70);
        Point2D p1 = new Point2D.Float(0, 0);
        Point2D p2 = new Point2D.Float(0, HEIGHT);
        float[] dist = new float[] { 0f, 1f };
        Color[] cols = new Color[] { top, bottom };
        LinearGradientPaint paint = new LinearGradientPaint(p1, p2, dist, cols);
        g.setPaint(paint);
        g.fillRect(0, 0, WIDTH, HEIGHT);
    }

    static void paintNebula(Graphics2D g) {
        int scale = 4;
        int w = Math.max(1, WIDTH / scale);
        int h = Math.max(1, HEIGHT / scale);
        BufferedImage small = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        Graphics2D sg = small.createGraphics();
        setupQuality(sg);

        Color[] palette = new Color[] {
                new Color(60, 110, 255),
                new Color(170, 70, 255),
                new Color(0, 220, 255),
                new Color(255, 90, 170)
        };

        for (int i = 0; i < 28; i++) {
            int cx = rng.nextInt(w);
            int cy = rng.nextInt(h);
            int r = 18 + rng.nextInt(44);
            Color base = palette[rng.nextInt(palette.length)];
            float a = (18 + rng.nextInt(40)) / 255f;
            sg.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a));
            sg.setColor(base);
            sg.fillOval(cx - r, cy - r, r * 2, r * 2);
        }
        sg.dispose();

        BufferedImage up = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_ARGB);
        Graphics2D ug = up.createGraphics();
        setupQuality(ug);
        ug.drawImage(small, 0, 0, WIDTH, HEIGHT, null);
        ug.dispose();

        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.95f));
        g.drawImage(up, 0, 0, null);
        g.setComposite(AlphaComposite.SrcOver);
    }

    static void paintStars(Graphics2D g) {
        for (int layer = 0; layer < 3; layer++) {
            int count = (layer == 0) ? 120 : (layer == 1 ? 90 : 55);
            int rMin = (layer == 2) ? 2 : 1;
            int rMax = (layer == 2) ? 4 : 3;
            for (int i = 0; i < count; i++) {
                int x = rng.nextInt(WIDTH);
                int y = rng.nextInt(HEIGHT);
                int r = rMin + rng.nextInt(rMax - rMin + 1);
                int kind = rng.nextInt(3);
                Color col = (kind == 2) ? new Color(210, 235, 255) : (kind == 1 ? new Color(200, 215, 240) : new Color(190, 205, 230));
                float a = (layer == 0) ? 0.45f : (layer == 1 ? 0.60f : 0.75f);
                g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a));
                g.setColor(col);
                g.fillOval(x, y, r * 2, r * 2);
                if (r >= 3 && rng.nextFloat() < 0.18f) {
                    g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a * 0.55f));
                    g.setColor(new Color(255, 255, 255));
                    g.drawLine(x - r * 2, y, x + r * 3, y);
                }
            }
        }
        g.setComposite(AlphaComposite.SrcOver);
    }

    static void paintVignette(Graphics2D g) {
        float cx = WIDTH / 2f;
        float cy = HEIGHT / 2f;
        float radius = Math.max(WIDTH, HEIGHT) * 0.62f;
        float[] dist = new float[] { 0f, 1f };
        Color[] cols = new Color[] { new Color(0, 0, 0, 0), new Color(0, 0, 0, 170) };
        RadialGradientPaint paint = new RadialGradientPaint(new Point2D.Float(cx, cy), radius, dist, cols);
        g.setPaint(paint);
        g.fillRect(0, 0, WIDTH, HEIGHT);
    }

    static void paintGrid(Graphics2D g) {
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.10f));
        g.setColor(new Color(255, 255, 255));
        g.setStroke(new BasicStroke(1f));
        for (int x = 0; x < WIDTH; x += CELL) {
            g.drawLine(x, 0, x, HEIGHT);
        }
        for (int y = 0; y < HEIGHT; y += CELL) {
            g.drawLine(0, y, WIDTH, y);
        }
        g.setComposite(AlphaComposite.SrcOver);
    }

    static void writePng(BufferedImage img, String name) throws Exception {
        ImageIO.write(img, "png", new File(ASSET_DIR, name));
    }

    static BufferedImage makePanel(int w, int h) {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);

        int r = 14;
        // Shadow inside bounds (so Python can blit at exact x,y)
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.70f));
        g.setColor(new Color(0, 0, 0));
        g.fillRoundRect(6, 6, w - 6, h - 6, r * 2, r * 2);

        // Panel body
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(20, 22, 40));
        g.fillRoundRect(0, 0, w, h, r * 2, r * 2);

        g.setColor(new Color(34, 36, 62));
        g.fillRoundRect(4, 4, w - 8, h - 8, (r - 2) * 2, (r - 2) * 2);

        // Borders
        g.setStroke(new BasicStroke(2f));
        g.setColor(new Color(85, 105, 170));
        g.drawRoundRect(0, 0, w - 1, h - 1, r * 2, r * 2);
        g.setStroke(new BasicStroke(1f));
        g.setColor(new Color(255, 255, 255, 200));
        g.drawRoundRect(3, 3, w - 7, h - 7, (r - 1) * 2, (r - 1) * 2);

        // Gloss band
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.13f));
        g.setColor(new Color(255, 255, 255));
        g.fillRoundRect(10, 10, w - 20, (h - 20) / 2, 18, 18);

        g.dispose();
        return img;
    }

    static BufferedImage makeHud(int w, int h) {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.65f));
        g.setColor(new Color(10, 12, 26));
        g.fillRoundRect(0, 0, w, h, 24, 24);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.22f));
        g.setColor(Color.WHITE);
        g.setStroke(new BasicStroke(1.2f));
        g.drawRoundRect(2, 2, w - 5, h - 5, 22, 22);
        g.dispose();
        return img;
    }

    static BufferedImage makePillHint(int w, int h) {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.60f));
        g.setColor(new Color(0, 0, 0));
        g.fillRoundRect(0, 0, w, h, 28, 28);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.18f));
        g.setColor(Color.WHITE);
        g.setStroke(new BasicStroke(1f));
        g.drawRoundRect(2, 2, w - 5, h - 5, 24, 24);
        g.dispose();
        return img;
    }

    static BufferedImage makeButtonBase(int w, int h, boolean hover) {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);

        int r = 12;
        // Shadow
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.70f));
        g.setColor(new Color(0, 0, 0));
        g.fillRoundRect(hover ? 3 : 5, hover ? 3 : 5, w - 2, h - 2, r * 2, r * 2);

        // Base (white so Python can tint)
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(255, 255, 255));
        g.fillRoundRect(0, 0, w, h, r * 2, r * 2);

        // Inner glass
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, hover ? 0.20f : 0.12f));
        g.setColor(new Color(255, 255, 255));
        g.fillRoundRect(4, 4, w - 8, (h - 8) / 2, 18, 18);

        // Border highlight (cyan when hover)
        g.setComposite(AlphaComposite.SrcOver);
        g.setStroke(new BasicStroke(hover ? 3f : 2f));
        g.setColor(hover ? new Color(0, 220, 255) : new Color(245, 245, 255));
        g.drawRoundRect(0, 0, w - 1, h - 1, r * 2, r * 2);

        g.dispose();
        return img;
    }

    static BufferedImage makeCellShadow(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.55f));
        g.setColor(new Color(0, 0, 0));
        g.fillRoundRect(3, 4, size - 1, size - 1, 16, 16);
        g.dispose();
        return img;
    }

    static BufferedImage makeSnakeBase(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(255, 255, 255));
        g.fillRoundRect(0, 0, size, size, 18, 18);
        g.dispose();
        return img;
    }

    static BufferedImage makeSnakeHighlight(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.25f));
        g.setColor(new Color(255, 255, 255));
        g.fillRoundRect(3, 3, size - 6, (size - 6) / 2, 14, 14);
        g.dispose();
        return img;
    }

    static BufferedImage makeSnakeBody(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        // base fill (white for tint)
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(255, 255, 255, 255));
        g.fillOval(1, 1, size - 2, size - 2);
        // subtle shading band (gray to tint darker)
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.18f));
        g.setColor(new Color(190, 190, 190));
        g.fillOval(3, size / 2, size - 6, size / 2 - 3);
        // gloss
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.22f));
        g.setColor(Color.WHITE);
        g.fillOval(4, 3, size - 8, (size - 8) / 2);
        g.dispose();
        return img;
    }

    static BufferedImage makeSnakeHead(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(255, 255, 255, 255));
        // head facing RIGHT by default (slight snout)
        g.fillOval(0, 1, size - 2, size - 2);
        g.fillRoundRect(size / 2, 4, size / 2, size - 8, 14, 14);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.22f));
        g.setColor(Color.WHITE);
        g.fillOval(4, 3, size - 10, (size - 8) / 2);
        g.dispose();
        return img;
    }

    static BufferedImage makeSnakeTail(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(255, 255, 255, 255));
        // tail facing RIGHT by default (taper)
        g.fillOval(2, 2, size - 4, size - 4);
        g.setComposite(AlphaComposite.Clear);
        g.fillPolygon(new int[] { 0, size / 2, 0 }, new int[] { 2, size / 2, size - 2 }, 3);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.22f));
        g.setColor(Color.WHITE);
        g.fillOval(4, 3, size - 10, (size - 8) / 2);
        g.dispose();
        return img;
    }

    static BufferedImage makeObstacle(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(90, 95, 115));
        g.fillRoundRect(0, 0, size, size, 14, 14);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.22f));
        g.setColor(Color.WHITE);
        g.fillRoundRect(3, 3, size - 6, (size - 6) / 2, 12, 12);
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(45, 50, 65, 220));
        g.setStroke(new BasicStroke(2f));
        g.drawRoundRect(0, 0, size - 1, size - 1, 14, 14);
        g.dispose();
        return img;
    }

    static BufferedImage makeApple(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        int cx = size / 2;
        int cy = size / 2;
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(230, 30, 60));
        g.fillOval(cx - size / 3, cy - size / 3, (size * 2) / 3, (size * 2) / 3);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.60f));
        g.setColor(new Color(255, 120, 140));
        g.fillOval(cx - size / 2, cy - size / 2, size, size);
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(255, 235, 120));
        g.fillOval(cx - 5, cy - 8, 5, 5);
        g.setColor(new Color(60, 200, 120));
        g.fillOval(cx + 4, cy - 10, 4, 7);
        g.dispose();
        return img;
    }

    static BufferedImage makeSpecial(int size, boolean buff) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        Color base = buff ? new Color(0, 140, 255) : new Color(255, 80, 120);
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(base);
        g.fillRoundRect(0, 0, size, size, 14, 14);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.40f));
        g.setColor(Color.WHITE);
        g.fillRoundRect(3, 3, size - 6, (size - 6) / 2, 12, 12);
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(255, 255, 255, 180));
        g.setStroke(new BasicStroke(1f));
        g.drawRoundRect(2, 2, size - 5, size - 5, 12, 12);
        g.dispose();
        return img;
    }

    static BufferedImage makeGun(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(255, 255, 255, 235));
        // simple pistol silhouette
        g.fillRoundRect(3, 7, 14, 6, 4, 4);   // barrel
        g.fillRoundRect(10, 9, 7, 4, 3, 3);   // front
        g.fillRoundRect(7, 11, 6, 7, 3, 3);   // grip
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.25f));
        g.setColor(Color.BLACK);
        g.drawRoundRect(3, 7, 14, 6, 4, 4);
        g.dispose();
        return img;
    }

    static BufferedImage makePetPenguin(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        int cx = size / 2;
        int cy = size / 2;

        // body
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.85f));
        g.setColor(new Color(15, 18, 30));
        g.fillOval(cx - 18, cy - 22, 36, 46);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.80f));
        g.setColor(new Color(240, 245, 255));
        g.fillOval(cx - 12, cy - 12, 24, 30);

        // beak + feet
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(255, 180, 60));
        g.fillOval(cx - 4, cy - 6, 8, 6);
        g.fillOval(cx - 14, cy + 18, 12, 7);
        g.fillOval(cx + 2, cy + 18, 12, 7);

        // eyes
        g.setColor(Color.BLACK);
        g.fillOval(cx - 9, cy - 14, 6, 6);
        g.fillOval(cx + 3, cy - 14, 6, 6);
        g.setColor(Color.WHITE);
        g.fillOval(cx - 7, cy - 13, 2, 2);
        g.fillOval(cx + 5, cy - 13, 2, 2);

        g.dispose();
        return img;
    }

    static BufferedImage makePetCat(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        int cx = size / 2;
        int cy = size / 2;

        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.90f));
        g.setColor(new Color(250, 190, 130));
        g.fillOval(cx - 20, cy - 18, 40, 36);
        // ears
        g.fillPolygon(new int[] { cx - 16, cx - 6, cx - 18 }, new int[] { cy - 12, cy - 24, cy - 22 }, 3);
        g.fillPolygon(new int[] { cx + 16, cx + 6, cx + 18 }, new int[] { cy - 12, cy - 24, cy - 22 }, 3);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.35f));
        g.setColor(Color.WHITE);
        g.fillOval(cx - 12, cy - 10, 14, 12);

        // eyes
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(35, 30, 25));
        g.fillOval(cx - 11, cy - 6, 7, 7);
        g.fillOval(cx + 4, cy - 6, 7, 7);
        g.setColor(Color.WHITE);
        g.fillOval(cx - 9, cy - 4, 2, 2);
        g.fillOval(cx + 6, cy - 4, 2, 2);

        // nose
        g.setColor(new Color(255, 120, 160));
        g.fillOval(cx - 3, cy + 4, 6, 4);
        g.dispose();
        return img;
    }

    static BufferedImage makePetDog(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        int cx = size / 2;
        int cy = size / 2;

        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.92f));
        g.setColor(new Color(170, 115, 70));
        g.fillOval(cx - 20, cy - 16, 40, 34);
        // ears
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.85f));
        g.setColor(new Color(120, 80, 50));
        g.fillOval(cx - 26, cy - 12, 16, 20);
        g.fillOval(cx + 10, cy - 12, 16, 20);

        // muzzle
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.80f));
        g.setColor(new Color(240, 225, 210));
        g.fillOval(cx - 12, cy - 2, 24, 18);

        // eyes
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(30, 25, 22));
        g.fillOval(cx - 10, cy - 6, 6, 6);
        g.fillOval(cx + 4, cy - 6, 6, 6);

        // nose
        g.setColor(Color.BLACK);
        g.fillOval(cx - 4, cy + 4, 8, 6);
        g.dispose();
        return img;
    }

    static BufferedImage makePetParrot(int size) {
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setupQuality(g);
        int cx = size / 2;
        int cy = size / 2;

        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.92f));
        g.setColor(new Color(40, 210, 120));
        g.fillOval(cx - 18, cy - 20, 36, 42);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.85f));
        g.setColor(new Color(0, 140, 255));
        g.fillOval(cx - 18, cy - 6, 18, 22);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.85f));
        g.setColor(new Color(255, 90, 170));
        g.fillOval(cx, cy - 6, 18, 22);

        // beak
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(255, 190, 70));
        g.fillOval(cx - 3, cy - 4, 10, 10);

        // eye
        g.setColor(Color.BLACK);
        g.fillOval(cx + 5, cy - 12, 6, 6);
        g.setColor(Color.WHITE);
        g.fillOval(cx + 7, cy - 11, 2, 2);

        g.dispose();
        return img;
    }

    static void generateUiAssets() throws Exception {
        // Panels used across the game (match draw_panel sizes)
        int[][] panels = new int[][] {
                { 860, 440 },
                { 1160, 620 },
                { 720, 400 },
                { 1080, 560 },
                { 1040, 680 },
                { 850, 520 },
                { 1040, 590 }
        };
        for (int[] p : panels) {
            writePng(makePanel(p[0], p[1]), String.format("panel_%dx%d.png", p[0], p[1]));
        }

        writePng(makeHud(520, 44), "hud_520x44.png");
        writePng(makeCellShadow(CELL), String.format("cell_shadow_%d.png", CELL));
        writePng(makeSnakeBase(CELL), String.format("snake_base_%d.png", CELL));
        writePng(makeSnakeHighlight(CELL), String.format("snake_highlight_%d.png", CELL));
        writePng(makeSnakeHead(CELL), String.format("snake_head_%d.png", CELL));
        writePng(makeSnakeBody(CELL), String.format("snake_body_%d.png", CELL));
        writePng(makeSnakeTail(CELL), String.format("snake_tail_%d.png", CELL));
        writePng(makeObstacle(CELL), String.format("obstacle_%d.png", CELL));
        writePng(makeApple(CELL), String.format("apple_%d.png", CELL));
        writePng(makeSpecial(CELL, true), String.format("special_buff_%d.png", CELL));
        // Visual-only: harm uses the same blue as buff (game logic is handled in Python).
        writePng(makeSpecial(CELL, true), String.format("special_harm_%d.png", CELL));
        writePng(makeGun(CELL), String.format("gun_%d.png", CELL));

        // Pets (small, for UI screens)
        int petSize = 64;
        writePng(makePetPenguin(petSize), "pet_penguin_64.png");
        writePng(makePetCat(petSize), "pet_cat_64.png");
        writePng(makePetDog(petSize), "pet_dog_64.png");
        writePng(makePetParrot(petSize), "pet_parrot_64.png");

        // Button bases (tint in Python)
        writePng(makeButtonBase(240, 60, false), "button_base.png");
        writePng(makeButtonBase(240, 60, true), "button_base_hover.png");

        // Row/header assets for leaderboard list
        writePng(makePanel(760, 40), "lb_header_760x40.png");
        writePng(makePanel(760, 34), "lb_row_760x34.png");
        writePng(makePillHint(200, 36), "pill_200x36.png");
    }

    static void generateLeaderboardFlameFrames(int frames) throws Exception {
        int pw = 1040;
        int ph = 680;
        int pad = 26;

        int w = pw + pad * 2;
        int h = ph + pad * 2;
        int innerX = pad;
        int innerY = pad;

        int step = 18;
        Color c1 = new Color(20, 120, 255);
        Color c2 = new Color(0, 255, 255);
        Color c3 = new Color(255, 255, 255);

        for (int f = 0; f < frames; f++) {
            BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g = img.createGraphics();
            setupQuality(g);

            // Outer glow
            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.22f));
            g.setColor(new Color(0, 180, 255));
            g.setStroke(new BasicStroke(10f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            g.drawRoundRect(innerX - 9, innerY - 9, pw + 18, ph + 18, 44, 44);

            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.12f));
            g.setColor(new Color(0, 230, 255));
            g.setStroke(new BasicStroke(12f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            g.drawRoundRect(innerX - 17, innerY - 17, pw + 34, ph + 34, 52, 52);

            g.setComposite(AlphaComposite.SrcOver);
            g.setStroke(new BasicStroke(3f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));

            int idx = 0;
            // Top + bottom
            for (int x = innerX + 10; x <= innerX + pw - 10; x += step) {
                drawFlameSpike(g, x, innerY, 0f, -1f, f, flamePhases[idx++ % flamePhases.length], c1, c2, c3);
                drawFlameSpike(g, x, innerY + ph, 0f, 1f, f, flamePhases[idx++ % flamePhases.length], c1, c2, c3);
            }
            // Left + right
            for (int y = innerY + 10; y <= innerY + ph - 10; y += step) {
                drawFlameSpike(g, innerX, y, -1f, 0f, f, flamePhases[idx++ % flamePhases.length], c1, c2, c3);
                drawFlameSpike(g, innerX + pw, y, 1f, 0f, f, flamePhases[idx++ % flamePhases.length], c1, c2, c3);
            }
            // Corners (diagonal kick)
            drawFlameSpike(g, innerX, innerY, -0.7f, -0.7f, f, flamePhases[idx++ % flamePhases.length], c1, c2, c3);
            drawFlameSpike(g, innerX + pw, innerY, 0.7f, -0.7f, f, flamePhases[idx++ % flamePhases.length], c1, c2, c3);
            drawFlameSpike(g, innerX, innerY + ph, -0.7f, 0.7f, f, flamePhases[idx++ % flamePhases.length], c1, c2, c3);
            drawFlameSpike(g, innerX + pw, innerY + ph, 0.7f, 0.7f, f, flamePhases[idx++ % flamePhases.length], c1, c2, c3);

            g.dispose();
            ImageIO.write(img, "png", new File(String.format("leaderboard_flame_%02d.png", f)));
        }
    }

    static void drawFlameSpike(Graphics2D g, float x, float y, float nx, float ny, int frame, float phase, Color c1, Color c2, Color c3) {
        float t = frame / 24f;
        float flick = 0.5f + 0.5f * (float) Math.sin(t * (float) (Math.PI * 2.0) * 3.0 + phase * 3.1f);
        float amp = 2.0f + 3.5f * (float) Math.sin(t * (float) (Math.PI * 2.0) * 0.9 + phase);
        float len = 10.0f + 22.0f * flick;

        float sx = x + nx * amp;
        float sy = y + ny * amp;
        float ex = x + nx * (amp + len);
        float ey = y + ny * (amp + len);

        float a1 = clamp01(0.26f + 0.30f * flick);
        float a2 = clamp01(0.40f + 0.45f * flick);
        float a3 = clamp01(0.30f + 0.45f * flick);

        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a1));
        g.setColor(c1);
        g.drawLine(Math.round(x), Math.round(y), Math.round(sx), Math.round(sy));

        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a2));
        g.setColor(c2);
        g.drawLine(Math.round(sx), Math.round(sy), Math.round(ex), Math.round(ey));

        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a3));
        g.setColor(c3);
        g.fillOval(Math.round(ex) - 2, Math.round(ey) - 2, 4, 4);

        g.setComposite(AlphaComposite.SrcOver);
    }

    static float clamp01(float v) {
        return v < 0f ? 0f : (v > 1f ? 1f : v);
    }

    static void generateRainbowPanelFlames(int frames) throws Exception {
        // Match panel sizes in Lastsnakegame.py
        generateRainbowFlameFrames("mode_flame_", 720, 400, 26, frames);
        generateRainbowFlameFrames("guide_flame_", 1160, 620, 26, frames);
        generateRainbowFlameFrames("color_flame_", 850, 520, 26, frames);
    }

    static void generateRainbowFlameFrames(String prefix, int pw, int ph, int pad, int frames) throws Exception {
        int w = pw + pad * 2;
        int h = ph + pad * 2;
        int innerX = pad;
        int innerY = pad;
        int step = 18;
        float perimeter = 2f * (pw + ph);

        for (int f = 0; f < frames; f++) {
            BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g = img.createGraphics();
            setupQuality(g);

            // Base glow frame
            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.14f));
            g.setColor(new Color(255, 255, 255));
            g.setStroke(new BasicStroke(12f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            g.drawRoundRect(innerX - 17, innerY - 17, pw + 34, ph + 34, 52, 52);

            g.setComposite(AlphaComposite.SrcOver);
            g.setStroke(new BasicStroke(3f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));

            int idx = 0;
            // Top + bottom
            for (int x = innerX + 10; x <= innerX + pw - 10; x += step) {
                float s = x - innerX;
                drawRainbowSpike(g, x, innerY, 0f, -1f, f, s, perimeter, flamePhases[idx++ % flamePhases.length]);
                drawRainbowSpike(g, x, innerY + ph, 0f, 1f, f, s + pw + ph, perimeter, flamePhases[idx++ % flamePhases.length]);
            }
            // Left + right
            for (int y = innerY + 10; y <= innerY + ph - 10; y += step) {
                float s = pw + (y - innerY);
                drawRainbowSpike(g, innerX, y, -1f, 0f, f, s + pw + ph, perimeter, flamePhases[idx++ % flamePhases.length]);
                drawRainbowSpike(g, innerX + pw, y, 1f, 0f, f, s, perimeter, flamePhases[idx++ % flamePhases.length]);
            }
            // Corners (diagonal kick)
            drawRainbowSpike(g, innerX, innerY, -0.7f, -0.7f, f, 0f, perimeter, flamePhases[idx++ % flamePhases.length]);
            drawRainbowSpike(g, innerX + pw, innerY, 0.7f, -0.7f, f, pw, perimeter, flamePhases[idx++ % flamePhases.length]);
            drawRainbowSpike(g, innerX, innerY + ph, -0.7f, 0.7f, f, pw + ph + pw, perimeter, flamePhases[idx++ % flamePhases.length]);
            drawRainbowSpike(g, innerX + pw, innerY + ph, 0.7f, 0.7f, f, pw + ph, perimeter, flamePhases[idx++ % flamePhases.length]);

            g.dispose();
            ImageIO.write(img, "png", new File(String.format("%s%02d.png", prefix, f)));
        }
    }

    static void drawRainbowSpike(Graphics2D g, float x, float y, float nx, float ny, int frame, float along, float perimeter, float phase) {
        float t = frame / 24f;
        float flick = 0.5f + 0.5f * (float) Math.sin(t * (float) (Math.PI * 2.0) * 3.0 + phase * 3.1f);
        float amp = 2.0f + 3.5f * (float) Math.sin(t * (float) (Math.PI * 2.0) * 0.9 + phase);
        float len = 10.0f + 22.0f * flick;

        float hue = (along / Math.max(1f, perimeter)) * 360f + frame * 12f;
        int[] cA = hsvToRgb(hue % 360f, 0.90f, 1.00f);
        int[] cB = hsvToRgb((hue + 40f) % 360f, 0.70f, 1.00f);
        Color c1 = new Color(cA[0], cA[1], cA[2]);
        Color c2 = new Color(cB[0], cB[1], cB[2]);
        Color c3 = new Color(255, 255, 255);

        float sx = x + nx * amp;
        float sy = y + ny * amp;
        float ex = x + nx * (amp + len);
        float ey = y + ny * (amp + len);

        float a1 = clamp01(0.20f + 0.25f * flick);
        float a2 = clamp01(0.32f + 0.40f * flick);
        float a3 = clamp01(0.28f + 0.45f * flick);

        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a1));
        g.setColor(c1);
        g.drawLine(Math.round(x), Math.round(y), Math.round(sx), Math.round(sy));

        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a2));
        g.setColor(c2);
        g.drawLine(Math.round(sx), Math.round(sy), Math.round(ex), Math.round(ey));

        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a3));
        g.setColor(c3);
        g.fillOval(Math.round(ex) - 2, Math.round(ey) - 2, 4, 4);

        g.setComposite(AlphaComposite.SrcOver);
    }

    // HSV to RGB, returns {r,g,b} 0..255
    static int[] hsvToRgb(float h, float s, float v) {
        float c = v * s;
        float hh = (h / 60f) % 6f;
        float x = c * (1f - Math.abs((hh % 2f) - 1f));
        float r1 = 0f, g1 = 0f, b1 = 0f;
        if (0f <= hh && hh < 1f) { r1 = c; g1 = x; b1 = 0f; }
        else if (1f <= hh && hh < 2f) { r1 = x; g1 = c; b1 = 0f; }
        else if (2f <= hh && hh < 3f) { r1 = 0f; g1 = c; b1 = x; }
        else if (3f <= hh && hh < 4f) { r1 = 0f; g1 = x; b1 = c; }
        else if (4f <= hh && hh < 5f) { r1 = x; g1 = 0f; b1 = c; }
        else { r1 = c; g1 = 0f; b1 = x; }
        float m = v - c;
        int r = Math.round((r1 + m) * 255f);
        int g = Math.round((g1 + m) * 255f);
        int b = Math.round((b1 + m) * 255f);
        return new int[] { clamp255(r), clamp255(g), clamp255(b) };
    }

    static int clamp255(int v) {
        return v < 0 ? 0 : (v > 255 ? 255 : v);
    }
}
