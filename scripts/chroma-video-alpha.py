import argparse
import shutil
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def run(command):
    subprocess.run(command, check=True)


def parse_fps(text):
    value = text.strip()
    if "/" in value:
        a, b = value.split("/", 1)
        return float(a) / float(b)
    return float(value)


def get_fps(input_path):
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=r_frame_rate",
            "-of",
            "default=nokey=1:noprint_wrappers=1",
            str(input_path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return parse_fps(result.stdout)


def key_frame(path, out_path, key, transparent, opaque, choke):
    im = Image.open(path).convert("RGBA")
    arr = np.asarray(im).astype(np.float32)
    rgb = arr[:, :, :3]
    kr, kg, kb = [float(v) for v in key]
    spread = max(1, opaque - transparent)

    dist = np.sqrt(
        (rgb[:, :, 0] - kr) ** 2
        + (rgb[:, :, 1] - kg) ** 2
        + (rgb[:, :, 2] - kb) ** 2
    )
    alpha = np.clip(((dist - transparent) / spread) * 255, 0, 255)

    r = rgb[:, :, 0]
    g = rgb[:, :, 1]
    b = rgb[:, :, 2]
    magenta_excess = np.maximum(0, np.minimum(r, b) - g)
    rb_similarity = np.maximum(0, 1 - np.abs(r - b) / 130)
    pinkness = np.minimum(1, (magenta_excess / 170) * rb_similarity)

    pink_edge = (pinkness > 0.18) & (b > 55)
    alpha[pink_edge] = np.minimum(alpha[pink_edge], 255 * (1 - pinkness[pink_edge] * 0.94))

    # Remove magenta spill from semi-transparent edge pixels. Dragon reds keep
    # their red channel; the visible fringe mostly lives in excess blue.
    spill = (alpha < 245) | (pinkness > 0.18)
    edge = 1 - (alpha / 255)
    blue_cut = np.maximum(edge, pinkness)
    b[spill] = b[spill] * (1 - 0.9 * blue_cut[spill])

    blue_cap = (r > 110) & (b > 40)
    b[blue_cap] = np.minimum(b[blue_cap], r[blue_cap] * 0.16 + g[blue_cap] * 0.32)

    strong_pink = pinkness > 0.28
    r[strong_pink] = r[strong_pink] * (1 - 0.38 * pinkness[strong_pink])

    clear = alpha < 18
    rgb[clear] = 0

    if choke > 0:
        alpha_image = Image.fromarray(alpha.astype(np.uint8), "L")
        alpha = np.asarray(alpha_image.filter(ImageFilter.MinFilter(choke * 2 + 1))).astype(np.float32)
        rgb[alpha < 18] = 0

    arr[:, :, :3] = np.clip(rgb, 0, 255)
    arr[:, :, 3] = np.clip(alpha, 0, 255)
    Image.fromarray(arr.astype(np.uint8), "RGBA").save(out_path)


def stabilize_alpha(frames, strength):
    if strength <= 0 or len(frames) < 3:
        return

    images = [Image.open(frame).convert("RGBA") for frame in frames]
    arrays = [np.asarray(image).copy() for image in images]
    alphas = [array[:, :, 3].astype(np.float32) for array in arrays]
    carry = max(0, min(1, strength))

    for index in range(1, len(frames) - 1):
        alpha = alphas[index]
        prev_alpha = alphas[index - 1] * carry
        next_alpha = alphas[index + 1] * carry
        stable_alpha = np.maximum(alpha, np.maximum(prev_alpha, next_alpha))
        stable_alpha[stable_alpha < 18] = 0
        arrays[index][:, :, 3] = np.clip(stable_alpha, 0, 255).astype(np.uint8)
        Image.fromarray(arrays[index], "RGBA").save(frames[index])


def convert(input_path, output_path, key, transparent, opaque, choke, stabilize, keep_tmp):
    input_path = Path(input_path)
    output_path = Path(output_path)
    tmp = output_path.parent / f"_tmp_chroma_{output_path.stem}"
    raw = tmp / "raw"
    keyed = tmp / "keyed"
    raw.mkdir(parents=True, exist_ok=True)
    keyed.mkdir(parents=True, exist_ok=True)

    fps = get_fps(input_path)
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(input_path), str(raw / "frame_%05d.png")])

    frames = sorted(raw.glob("frame_*.png"))
    for frame in frames:
        key_frame(frame, keyed / frame.name, key, transparent, opaque, choke)

    keyed_frames = sorted(keyed.glob("frame_*.png"))
    stabilize_alpha(keyed_frames, stabilize)

    run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-framerate",
            f"{fps:.6f}",
            "-i",
            str(keyed / "frame_%05d.png"),
            "-c:v",
            "libvpx-vp9",
            "-auto-alt-ref",
            "0",
            "-b:v",
            "0",
            "-crf",
            "30",
            "-pix_fmt",
            "yuva420p",
            str(output_path),
        ]
    )

    if not keep_tmp:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    parser = argparse.ArgumentParser(description="Convert magenta/chroma video to VP9 WebM with alpha.")
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--transparent", type=float, default=42)
    parser.add_argument("--opaque", type=float, default=120)
    parser.add_argument("--choke", type=int, default=1)
    parser.add_argument("--stabilize-alpha", type=float, default=0)
    parser.add_argument("--key", default="255,0,255")
    parser.add_argument("--keep-tmp", action="store_true")
    args = parser.parse_args()
    key = tuple(int(part) for part in args.key.split(","))
    convert(args.input, args.output, key, args.transparent, args.opaque, args.choke, args.stabilize_alpha, args.keep_tmp)


if __name__ == "__main__":
    main()
