import argparse
import json
import os
from pathlib import Path

from huggingface_hub import InferenceClient

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "videos"


def load_config(path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def select_presets(config, ids):
    presets = config["presets"]
    if not ids:
        return presets
    wanted = set(ids)
    selected = [p for p in presets if p["id"] in wanted]
    missing = wanted.difference({p["id"] for p in selected})
    if missing:
        raise SystemExit(f"Preset(s) not found: {', '.join(sorted(missing))}")
    return selected


def generate_one(client, config, preset, model, frames, steps, guidance, seed, dry_run):
    image_path = ROOT / preset["first_frame"]
    if not image_path.exists():
        raise FileNotFoundError(f"Missing first frame: {image_path}")

    target = config["output"]
    output_path = OUT / f"{preset['id']}.mp4"
    params = {
        "image": image_path,
        "model": model,
        "prompt": preset["prompt"],
        "negative_prompt": config["negative_prompt"],
        "num_frames": frames,
        "num_inference_steps": steps,
        "guidance_scale": guidance,
        "seed": seed,
        "target_size": {
            "width": target["width"],
            "height": target["height"],
        },
    }

    print(f"[{preset['id']}] model={model} frame={image_path.name} out={output_path.name}")
    if dry_run:
        print(json.dumps({k: str(v) if isinstance(v, Path) else v for k, v in params.items()}, indent=2, ensure_ascii=False))
        return

    video = client.image_to_video(**params)
    OUT.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(video)
    print(f"[{preset['id']}] wrote {output_path} ({len(video)} bytes)")


def main():
    parser = argparse.ArgumentParser(description="Generate Dragon Gold Heist videos via Hugging Face Inference API.")
    parser.add_argument("--config", default="video-presets.json", help="Preset JSON path relative to project root.")
    parser.add_argument("--model", default=None, help="HF model id. Defaults to video-presets.json default_model.")
    parser.add_argument("--preset", action="append", help="Preset id to generate. Repeatable. Defaults to all.")
    parser.add_argument("--frames", type=int, default=96, help="Number of frames. 96 at 24fps is roughly 4s.")
    parser.add_argument("--steps", type=int, default=30, help="Diffusion inference steps.")
    parser.add_argument("--guidance", type=float, default=6.0, help="Guidance scale.")
    parser.add_argument("--seed", type=int, default=1313, help="Generation seed.")
    parser.add_argument("--dry-run", action="store_true", help="Print request parameters without generating.")
    args = parser.parse_args()

    token = os.environ.get("HF_TOKEN")
    if not token:
        raise SystemExit("HF_TOKEN is not set. Run scripts/set-hf-token.ps1 or set $env:HF_TOKEN first.")

    config = load_config(ROOT / args.config)
    model = args.model or config["default_model"]
    client = InferenceClient(token=token)

    for preset in select_presets(config, args.preset):
        generate_one(client, config, preset, model, args.frames, args.steps, args.guidance, args.seed, args.dry_run)


if __name__ == "__main__":
    main()
