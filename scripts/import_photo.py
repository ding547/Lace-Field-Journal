#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKS_JSON = ROOT / "data" / "works.json"
ASSET_ROOT = ROOT / "assets" / "photos"
PROCESSOR = ROOT / "scripts" / "process_photo.swift"

CATEGORIES = {
    "human": "human",
    "terrain": "terrain",
    "object": "still-life",
    "still-life": "still-life",
    "night": "night-desk",
    "night-desk": "night-desk",
    "motion": "motion",
    "misc": "misc",
}

CATEGORY_IDS = {
    "human": "human",
    "terrain": "terrain",
    "still-life": "object",
    "night-desk": "night",
    "motion": "motion",
    "misc": "misc",
}


def slugify(value):
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
    return slug


def run(command):
    return subprocess.run(command, text=True, capture_output=True, check=False)


def run_checked(command):
    result = run(command)
    if result.returncode != 0:
        output = result.stderr.strip() or result.stdout.strip()
        raise SystemExit(f"Command failed: {' '.join(command)}\n\n{output}")
    return result


def require_tools():
    if not shutil.which("sips"):
        raise SystemExit("sips was not found. On macOS it is usually available at /usr/bin/sips.")
    if not shutil.which("swift"):
        raise SystemExit("swift was not found. Install Apple's command line tools, then run this script again.")
    if not PROCESSOR.exists():
        raise SystemExit(f"Missing image processor: {PROCESSOR.relative_to(ROOT)}")


def unique_path(directory, stem, suffix, replace):
    candidate = directory / f"{stem}{suffix}"
    if replace or not candidate.exists():
        return candidate
    index = 2
    while True:
        candidate = directory / f"{stem}-{index}{suffix}"
        if not candidate.exists():
            return candidate
        index += 1


def image_size(path):
    result = run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)])
    if result.returncode != 0:
        return None, None
    width = None
    height = None
    for line in result.stdout.splitlines():
        if "pixelWidth:" in line:
            width = int(line.rsplit(":", 1)[1].strip())
        if "pixelHeight:" in line:
            height = int(line.rsplit(":", 1)[1].strip())
    return width, height


def watermark_for_id(work_id):
    digest = hashlib.sha256(work_id.encode("utf-8")).digest()
    x = 14 + digest[0] % 73
    y = 16 + digest[1] % 69
    rotate = (digest[2] % 25) - 12
    scale = round(0.82 + (digest[3] % 36) / 100, 2)
    return {
        "text": "DK",
        "x": x,
        "y": y,
        "rotate": rotate,
        "scale": scale,
    }


def convert_to_jpeg(source, destination, max_edge, quality):
    destination.parent.mkdir(parents=True, exist_ok=True)
    result = run(["swift", str(PROCESSOR), str(source), str(destination), str(max_edge), str(quality)])
    if result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip()
        raise SystemExit(
            "Could not convert this file with macOS ImageIO. Export a JPG from Lightroom/Capture One/Photos first, "
            f"then run this script on that JPG.\n\nThe processor said:\n{message}"
        )


def load_works():
    if not WORKS_JSON.exists():
        return []
    with WORKS_JSON.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, list):
        raise SystemExit("data/works.json must contain a JSON array.")
    return data


def save_works(works):
    WORKS_JSON.parent.mkdir(parents=True, exist_ok=True)
    with WORKS_JSON.open("w", encoding="utf-8") as file:
        json.dump(works, file, indent=2, ensure_ascii=False)
        file.write("\n")


def build_work(args, image_path, width, height, work_id):
    return {
        "id": work_id,
        "title": args.title,
        "category": CATEGORY_IDS[CATEGORIES[args.category]],
        "subtitle": args.subtitle,
        "description": args.description,
        "location": args.location,
        "date": args.date,
        "camera": args.camera,
        "series": args.series,
        "format": "Web JPG",
        "imageSrc": f"./{image_path.relative_to(ROOT).as_posix()}",
        "width": width,
        "height": height,
        "watermark": watermark_for_id(work_id),
    }


def parse_args():
    parser = argparse.ArgumentParser(description="Import a photograph into the public portfolio.")
    parser.add_argument("source", help="Path to the source JPG/PNG/HEIC/TIFF or a RAW file supported by macOS.")
    parser.add_argument("--category", required=True, choices=sorted(CATEGORIES.keys()))
    parser.add_argument("--title", required=True)
    parser.add_argument("--subtitle", default="")
    parser.add_argument("--description", default="")
    parser.add_argument("--location", default="")
    parser.add_argument("--date", default="")
    parser.add_argument("--camera", default="")
    parser.add_argument("--series", default="")
    parser.add_argument("--max-edge", type=int, default=2200)
    parser.add_argument("--quality", type=int, default=82)
    parser.add_argument("--replace", action="store_true", help="Replace an existing work with the same generated id.")
    parser.add_argument("--commit", action="store_true", help="Commit the imported image and data/works.json.")
    parser.add_argument("--push", action="store_true", help="Push main to origin after committing. Implies --commit.")
    parser.add_argument("--message", default="", help="Custom git commit message for --commit.")
    return parser.parse_args()


def main():
    require_tools()
    args = parse_args()
    source = Path(args.source).expanduser().resolve()
    if not source.exists():
        raise SystemExit(f"Source file not found: {source}")

    folder = CATEGORIES[args.category]
    stem = slugify(args.title) or slugify(source.stem) or "photograph"
    work_id = f"{CATEGORY_IDS[folder]}-{stem}"
    destination = unique_path(ASSET_ROOT / folder, stem, ".jpg", args.replace)
    if destination.stem != stem and not args.replace:
        work_id = f"{CATEGORY_IDS[folder]}-{destination.stem}"

    convert_to_jpeg(source, destination, args.max_edge, args.quality)
    width, height = image_size(destination)
    works = load_works()
    work = build_work(args, destination, width, height, work_id)

    existing_index = next((index for index, item in enumerate(works) if item.get("id") == work_id), None)
    if existing_index is None:
        works.append(work)
    elif args.replace:
        works[existing_index] = work
    else:
        raise SystemExit(f"Work id already exists in data/works.json: {work_id}. Use --replace to update it.")

    save_works(works)
    print(f"Imported: {destination.relative_to(ROOT)}")
    print(f"Updated: {WORKS_JSON.relative_to(ROOT)}")
    print("Web image: resized, JPEG-compressed, and metadata stripped.")
    print("Watermark: DK overlay position recorded for archive views.")
    if args.commit or args.push:
        message = args.message or f"Add {args.title} photograph"
        run_checked(["git", "add", str(destination.relative_to(ROOT)), str(WORKS_JSON.relative_to(ROOT))])
        run_checked(["git", "commit", "-m", message])
        print(f"Committed: {message}")
    else:
        print("Next: git add the new image and data/works.json, then commit and push.")

    if args.push:
        run_checked(["git", "push", "origin", "main"])
        print("Pushed to GitHub. Netlify should deploy automatically.")


if __name__ == "__main__":
    main()
