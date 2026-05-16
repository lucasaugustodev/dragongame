from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "video-keyframes-isolated"
SIZE = (720, 1280)
KEY = (255, 0, 255, 255)


def open_rgba(path):
    return Image.open(ROOT / path).convert("RGBA")


def fit_sprite(sprite, max_w, max_h):
    scale = min(max_w / sprite.width, max_h / sprite.height)
    return sprite.resize((round(sprite.width * scale), round(sprite.height * scale)), Image.LANCZOS)


def make_frame(name, sprite_path, max_w=620, max_h=760, x=0, y=0, opacity=1.0):
    canvas = Image.new("RGBA", SIZE, KEY)
    sprite = fit_sprite(open_rgba(sprite_path), max_w, max_h)
    if opacity < 1:
        alpha = sprite.getchannel("A")
        alpha = ImageEnhance.Brightness(alpha).enhance(opacity)
        sprite.putalpha(alpha)
    px = (SIZE[0] - sprite.width) // 2 + x
    py = (SIZE[1] - sprite.height) // 2 + y
    canvas.alpha_composite(sprite, (px, py))
    OUT.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUT / name)


def main():
    make_frame(
        "dragon-sleep-isolated.png",
        "assets/sprites/clean/dragon-clean-sleep-wake-01.png",
        max_w=690,
        max_h=620,
        y=80,
    )
    make_frame(
        "dragon-wake-isolated.png",
        "assets/sprites/clean/dragon-clean-sleep-wake-08.png",
        max_w=690,
        max_h=760,
        y=30,
    )
    make_frame(
        "dragon-attack-isolated.png",
        "assets/sprites/clean/dragon-clean-combat-06.png",
        max_w=700,
        max_h=820,
        y=20,
    )
    make_frame(
        "dragon-fire-isolated.png",
        "assets/sprites/clean/dragon-clean-fire-result-02.png",
        max_w=700,
        max_h=820,
        y=20,
    )
    make_frame(
        "thief-steal-isolated.png",
        "assets/sprites/clean/thief-clean-steal-idle-06.png",
        max_w=430,
        max_h=720,
        y=140,
    )
    make_frame(
        "thief-run-isolated.png",
        "assets/sprites/clean/thief-clean-run-escape-02.png",
        max_w=430,
        max_h=720,
        y=120,
    )
    make_frame(
        "thief-loss-isolated.png",
        "assets/sprites/clean/thief-clean-danger-result-05.png",
        max_w=520,
        max_h=620,
        y=190,
    )
    make_frame(
        "portal-left-isolated.png",
        "assets/sprites/portal-left-green.png",
        max_w=520,
        max_h=620,
        y=80,
    )
    make_frame(
        "portal-right-isolated.png",
        "assets/sprites/portal-right-blue.png",
        max_w=520,
        max_h=620,
        y=80,
    )
    print(f"Wrote isolated keyframes to {OUT}")


if __name__ == "__main__":
    main()
