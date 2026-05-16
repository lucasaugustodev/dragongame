import argparse
import subprocess
from pathlib import Path


def run(command):
    subprocess.run(command, check=True)


def make_pingpong_loop(input_path, output_path, fps, crf):
    input_path = Path(input_path)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    filter_graph = (
        "[0:v]split=2[forward][backward];"
        "[forward]setpts=PTS-STARTPTS[fwd];"
        "[backward]reverse,setpts=PTS-STARTPTS[rev];"
        "[fwd][rev]concat=n=2:v=1:a=0,"
        f"fps={fps},format=yuv420p[v]"
    )

    run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(input_path),
            "-filter_complex",
            filter_graph,
            "-map",
            "[v]",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            str(crf),
            str(output_path),
        ]
    )


def main():
    parser = argparse.ArgumentParser(description="Create a seamless ping-pong loop from a generated video.")
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--fps", type=int, default=24)
    parser.add_argument("--crf", type=int, default=18)
    args = parser.parse_args()

    make_pingpong_loop(args.input, args.output, args.fps, args.crf)


if __name__ == "__main__":
    main()
