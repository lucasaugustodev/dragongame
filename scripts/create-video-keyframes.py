from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "video-keyframes"
SIZE = (720, 1280)


def open_rgba(path):
    return Image.open(ROOT / path).convert("RGBA")


def cover_background(path):
    img = Image.open(ROOT / path).convert("RGB")
    target_w, target_h = SIZE
    scale = max(target_w / img.width, target_h / img.height)
    resized = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h)).convert("RGBA")


def vignette(base, strength=170):
    mask = Image.new("L", SIZE, 0)
    inner = Image.new("L", (520, 820), 255)
    mask.paste(inner, ((SIZE[0] - inner.width) // 2, 170))
    mask = mask.filter(ImageFilter.GaussianBlur(190))
    darkness = Image.new("RGBA", SIZE, (0, 0, 0, strength))
    base.alpha_composite(Image.composite(Image.new("RGBA", SIZE, (0, 0, 0, 0)), darkness, Image.eval(mask, lambda p: 255 - p)))
    return base


def tint(base, color, opacity):
    overlay = Image.new("RGBA", SIZE, (*color, opacity))
    base.alpha_composite(overlay)
    return base


def place(base, path, xy, width=None, height=None, opacity=1.0):
    img = open_rgba(path)
    if width:
        height = round(img.height * (width / img.width))
    elif height:
        width = round(img.width * (height / img.height))
    if width and height:
        img = img.resize((width, height), Image.LANCZOS)
    if opacity < 1:
        alpha = img.getchannel("A")
        alpha = ImageEnhance.Brightness(alpha).enhance(opacity)
        img.putalpha(alpha)
    base.alpha_composite(img, xy)
    return base


def gold_glow(base, center=(360, 710), radius=250, opacity=120):
    glow = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    layer = Image.new("RGBA", (radius * 2, radius * 2), (255, 176, 28, 0))
    pixels = layer.load()
    cx = cy = radius
    for y in range(radius * 2):
        for x in range(radius * 2):
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / radius
            if dist <= 1:
                alpha = int(opacity * (1 - dist) ** 1.7)
                pixels[x, y] = (255, 176, 28, alpha)
    layer = layer.filter(ImageFilter.GaussianBlur(26))
    glow.alpha_composite(layer, (center[0] - radius, center[1] - radius))
    base.alpha_composite(glow)
    return base


def base_scene(red=False):
    scene = cover_background("assets/processed/cave-background.png")
    scene = vignette(scene)
    if red:
        scene = tint(scene, (80, 8, 4), 62)
    return scene


def save(name, img):
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / name)


def dragon_sleep():
    img = base_scene()
    place(img, "assets/sprites/clean/dragon-clean-sleep-wake-01.png", (72, 270), width=690)
    place(img, "assets/sprites/prop-open-chest.png", (255, 705), width=260)
    gold_glow(img, (380, 790), 230, 110)
    save("dragon-sleep.png", img)


def thief_steal():
    img = base_scene()
    place(img, "assets/sprites/clean/dragon-clean-sleep-wake-02.png", (82, 245), width=690, opacity=0.92)
    place(img, "assets/sprites/prop-open-chest.png", (314, 715), width=265)
    place(img, "assets/sprites/clean/thief-clean-steal-idle-06.png", (70, 610), width=340)
    gold_glow(img, (385, 805), 260, 130)
    save("thief-steal.png", img)


def dragon_wake():
    img = base_scene(red=True)
    place(img, "assets/sprites/clean/dragon-clean-sleep-wake-08.png", (-10, 245), width=760)
    place(img, "assets/sprites/clean/thief-clean-danger-result-01.png", (52, 730), width=250)
    place(img, "assets/sprites/prop-open-chest.png", (330, 765), width=250)
    gold_glow(img, (400, 825), 230, 100)
    save("dragon-wake.png", img)


def dragon_attack():
    img = base_scene(red=True)
    place(img, "assets/sprites/clean/dragon-clean-combat-06.png", (-90, 210), width=860)
    place(img, "assets/sprites/clean/thief-clean-danger-result-01.png", (120, 700), width=280)
    save("dragon-attack.png", img)


def escape_choice():
    img = base_scene()
    img = tint(img, (0, 0, 0), 70)
    place(img, "assets/sprites/portal-left-green.png", (36, 505), width=310)
    place(img, "assets/sprites/portal-right-blue.png", (376, 508), width=310)
    save("escape-choice.png", img)


def win_escape():
    img = base_scene()
    place(img, "assets/sprites/portal-left-green.png", (170, 400), width=380)
    place(img, "assets/sprites/clean/thief-clean-run-escape-06.png", (190, 540), width=340)
    gold_glow(img, (360, 790), 210, 90)
    save("win-escape.png", img)


def loss_caught():
    img = base_scene(red=True)
    place(img, "assets/sprites/clean/dragon-clean-fire-result-04.png", (-80, 245), width=830)
    place(img, "assets/sprites/clean/thief-clean-danger-result-05.png", (190, 760), width=360)
    save("loss-caught.png", img)


def main():
    dragon_sleep()
    thief_steal()
    dragon_wake()
    dragon_attack()
    escape_choice()
    win_escape()
    loss_caught()
    print(f"Wrote keyframes to {OUT}")


if __name__ == "__main__":
    main()
