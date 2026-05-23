#!/usr/bin/env python3
import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKS_JSON = ROOT / "data" / "works.json"
ASSET_ROOT = ROOT / "assets" / "photos"

CATEGORIES = {
    "human": "human",
    "terrain": "terrain",
    "object": "object",
    "still-life": "object",
    "night": "night",
    "night-desk": "night",
    "motion": "motion",
    "misc": "misc",
}


def load_works():
    if not WORKS_JSON.exists():
        raise SystemExit("data/works.json does not exist.")
    with WORKS_JSON.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, list):
        raise SystemExit("data/works.json must contain a JSON array.")
    return data


def save_works(works):
    with WORKS_JSON.open("w", encoding="utf-8") as file:
        json.dump(works, file, indent=2, ensure_ascii=False)
        file.write("\n")


def normalize(value):
    return " ".join(str(value or "").strip().casefold().split())


def image_path_for(work):
    image_src = str(work.get("imageSrc") or "")
    if not image_src.startswith("./"):
        return None
    path = (ROOT / image_src[2:]).resolve()
    try:
        path.relative_to(ASSET_ROOT.resolve())
    except ValueError:
        return None
    return path


def parse_args():
    parser = argparse.ArgumentParser(description="Remove a public photograph locally without pushing to GitHub.")
    target = parser.add_mutually_exclusive_group(required=True)
    target.add_argument("--id", help="Exact work id from data/works.json, such as night-rain-ledger.")
    target.add_argument("--title", help="Exact photograph title, such as Rain Ledger.")
    parser.add_argument("--category", choices=sorted(CATEGORIES.keys()), help="Optional category to disambiguate titles.")
    parser.add_argument("--keep-file", action="store_true", help="Remove the work from works.json but keep the JPG file.")
    return parser.parse_args()


def main():
    args = parse_args()
    works = load_works()
    category = CATEGORIES.get(args.category) if args.category else None

    matches = []
    for index, work in enumerate(works):
        if category and work.get("category") != category:
            continue
        if args.id and work.get("id") == args.id:
            matches.append((index, work))
        if args.title and normalize(work.get("title")) == normalize(args.title):
            matches.append((index, work))

    if not matches:
        raise SystemExit("No matching photograph was found.")
    if len(matches) > 1:
        found = "\n".join(f"- {work.get('id')} | {work.get('title')}" for _, work in matches)
        raise SystemExit(f"More than one photograph matched. Add --category or use --id.\n\n{found}")

    index, work = matches[0]
    image_path = image_path_for(work)
    del works[index]
    save_works(works)

    removed_file = False
    if image_path and image_path.exists() and not args.keep_file:
        image_path.unlink()
        removed_file = True

    print(f"Removed from data/works.json: {work.get('id')} | {work.get('title')}")
    if removed_file:
        print(f"Removed image file: {image_path.relative_to(ROOT)}")
    elif image_path:
        print(f"Kept image file: {image_path.relative_to(ROOT)}")
    print("Next: review with git status, then batch commit and push when ready.")


if __name__ == "__main__":
    main()
