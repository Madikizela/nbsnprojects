"""
NBSN Mobile App Icon - Redesigned
- Bold centered eye, fills most of the icon
- White eye whites with high contrast
- Bright cyan iris with bold fingerprint ridges
- Dark navy pupil center
- Clean gradient background
"""
import math
from PIL import Image, ImageDraw

SIZE = 1024
RADIUS = 200

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

def create_icon():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

    # --- Diagonal gradient background ---
    grad = Image.new("RGBA", (SIZE, SIZE))
    gd = ImageDraw.Draw(grad)
    c1 = (10, 20, 80)    # deep navy
    c2 = (0, 120, 220)   # bright blue
    for i in range(SIZE):
        t = i / SIZE
        color = lerp_color(c1, c2, t)
        # diagonal: mix x and y
        gd.line([(0, i), (SIZE, i)], fill=color + (255,))

    # Apply rounded rect mask
    mask = Image.new("L", (SIZE, SIZE), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=RADIUS, fill=255)
    img.paste(grad, (0, 0), mask)

    draw = ImageDraw.Draw(img)
    cx, cy = SIZE // 2, SIZE // 2

    # =============================================
    # EYE - bold, fills 80% of the icon
    # =============================================
    ew = 400   # eye half-width (total eye width = 800px)
    eh = 200   # eye half-height

    def lens_pts(hw, hh, steps=300):
        """Generate a lens/eye shape polygon."""
        pts = []
        for i in range(steps):
            t = (2 * math.pi * i / steps)
            x = cx + hw * math.cos(t)
            y = cy + hh * math.sin(t) * abs(math.cos(t / 2))
            pts.append((x, y))
        return pts

    # White eye whites
    draw.polygon(lens_pts(ew, eh), fill=(255, 255, 255, 255))

    # Iris - bright cyan-blue circle
    iris_r = 165
    draw.ellipse([cx - iris_r, cy - iris_r, cx + iris_r, cy + iris_r],
                 fill=(0, 200, 255, 255))

    # =============================================
    # FINGERPRINT RIDGES - bold, bright, inside iris
    # =============================================
    ridge_color = (0, 40, 120, 255)   # dark navy ridges on cyan iris
    ridge_w = 11

    def arc_pts(rx, ry, start_deg, end_deg, steps=120):
        pts = []
        for i in range(steps + 1):
            t = math.radians(start_deg + (end_deg - start_deg) * i / steps)
            pts.append((cx + rx * math.cos(t), cy + ry * math.sin(t)))
        return pts

    # 6 bold concentric fingerprint ridges (top + bottom arcs)
    ridges = [
        (35, 22),
        (62, 42),
        (90, 62),
        (118, 84),
        (146, 107),
        (152, 130),
    ]
    for rx, ry in ridges:
        # top arc
        top = arc_pts(rx, ry, 200, 340)
        if len(top) > 1:
            draw.line(top, fill=ridge_color, width=ridge_w)
        # bottom arc
        bot = arc_pts(rx, ry, 20, 160)
        if len(bot) > 1:
            draw.line(bot, fill=ridge_color, width=ridge_w)

    # Left + right vertical connector lines
    outer_rx, outer_ry = ridges[-1]
    draw.line([(cx - outer_rx, cy - outer_ry + 8),
               (cx - outer_rx, cy + outer_ry - 8)],
              fill=ridge_color, width=ridge_w)
    draw.line([(cx + outer_rx, cy - outer_ry + 8),
               (cx + outer_rx, cy + outer_ry - 8)],
              fill=ridge_color, width=ridge_w)

    # Pupil - pure dark navy circle
    pupil_r = 68
    draw.ellipse([cx - pupil_r, cy - pupil_r, cx + pupil_r, cy + pupil_r],
                 fill=(5, 15, 50, 255))

    # Pupil highlight (white dot, top-left)
    draw.ellipse([cx - 52, cy - 52, cx - 20, cy - 20],
                 fill=(255, 255, 255, 200))
    # Smaller secondary highlight
    draw.ellipse([cx + 20, cy - 38, cx + 35, cy - 23],
                 fill=(255, 255, 255, 100))

    # Iris inner ring (dark outline around iris)
    for r_offset, alpha in [(165, 180), (162, 100)]:
        ring_img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        ring_draw = ImageDraw.Draw(ring_img)
        ring_draw.ellipse([cx - r_offset, cy - r_offset,
                           cx + r_offset, cy + r_offset],
                          outline=(0, 30, 90, alpha), width=6)
        img = Image.alpha_composite(img, ring_img)

    draw = ImageDraw.Draw(img)

    # =============================================
    # EYE OUTLINE - bold dark border
    # =============================================
    # Redraw lens outline
    pts = lens_pts(ew, eh)
    draw.line(pts + [pts[0]], fill=(10, 30, 100, 180), width=8)

    # =============================================
    # EYELID LINES - stylish lashes (top only)
    # =============================================
    lash = (255, 255, 255, 160)
    lashes = [
        (cx,       cy - eh,      cx,       cy - eh - 55, 10),
        (cx - 120, cy - eh + 18, cx - 145, cy - eh - 38, 9),
        (cx + 120, cy - eh + 18, cx + 145, cy - eh - 38, 9),
        (cx - 230, cy - eh + 65, cx - 265, cy - eh + 20, 8),
        (cx + 230, cy - eh + 65, cx + 265, cy - eh + 20, 8),
    ]
    for x1, y1, x2, y2, w in lashes:
        draw.line([(x1, y1), (x2, y2)], fill=lash, width=w)

    # =============================================
    # CORNER CIRCUIT NODES (subtle tech accent)
    # =============================================
    cc = (255, 255, 255, 60)
    cw = 6
    cr = 10
    corners = [
        # (line points list, dot position)
        ([(155, 720), (155, 810), (235, 810)], (235, 810)),
        ([(869, 720), (869, 810), (789, 810)], (789, 810)),
        ([(155, 304), (155, 214), (235, 214)], (235, 214)),
        ([(869, 304), (869, 214), (789, 214)], (789, 214)),
    ]
    for line_pts, dot in corners:
        draw.line(line_pts, fill=cc, width=cw)
        draw.ellipse([dot[0]-cr, dot[1]-cr, dot[0]+cr, dot[1]+cr], fill=cc)

    # Apply rounded mask again for clean edges
    final = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    final.paste(img, (0, 0), mask)

    out = "assets/app_icon.png"
    final.save(out, "PNG")
    print(f"✅ Icon saved: {out} ({SIZE}x{SIZE})")

if __name__ == "__main__":
    create_icon()
