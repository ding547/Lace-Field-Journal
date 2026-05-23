# Lace Field Photography Archive

A zero-dependency static personal photography portfolio with:

- English portfolio presentation
- Apple-inspired motion with a restrained pointer-reactive print field
- Vintage newspaper layout, dense halftone, screenprint, and aged paper texture
- Local Studio uploader for JPG, PNG, WebP, AVIF, GIF, HEIC, and HEIF previews
- Optional RAW source attachment for DNG, CR3, NEF, ARW, RAF, RAW and similar formats
- Button-based theme selection, avoiding fragile native select UI
- IndexedDB persistence in the visitor/admin browser
- JSON manifest export for migration to a hosted backend
- Published photographs loaded from `data/works.json`
- Local photo import script for web-ready JPG output, metadata stripping, and Git publishing

## Public Site

The canonical live version is:

```text
https://lace-field-journal.netlify.app
```

Use this URL when checking the public, deployed site.

## Run Locally

Because this site uses ES modules and IndexedDB, serve it from a local web server:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

`localhost:4173` is only this computer's local preview. It will not automatically match another computer unless this local Git checkout has been synced with GitHub.

## Publish Publicly

The current build is deployed on Netlify from the GitHub repository `ding547/Lace-Field-Journal`.

Netlify watches the GitHub `main` branch. After a successful `git push origin main`, Netlify automatically rebuilds and publishes the public site.

The repository is configured locally to push with this SSH key:

```text
~/.ssh/lace_field_journal_github
```

If a push ever fails with `Permission denied (publickey)`, verify the repo-local setting:

```bash
git config --get core.sshCommand
```

It should print:

```text
ssh -i ~/.ssh/lace_field_journal_github -o IdentitiesOnly=yes
```

## Batch Add Public Photographs

Use the import script for JPG, PNG, HEIC, TIFF, or a RAW file that macOS can read. The command stays local unless you add `--push`.

First photograph:

```bash
python3 scripts/import_photo.py "/Users/keding/Downloads/P5156377.JPG" \
  --category night-desk \
  --title "Rain Ledger" \
  --subtitle "Fogged glass / evening harbor / upper floors" \
  --location "Space Needle, Seattle, WA" \
  --date "2026" \
  --camera "Olympus E-M10 Mark IV / 31mm" \
  --series "Window Weather"
```

Second photograph:

```bash
python3 scripts/import_photo.py "/Users/keding/Downloads/IMG_7751.JPG" \
  --category terrain \
  --title "Driftwood Tide" \
  --subtitle "Cold shore / fallen timber / distant stacks" \
  --location "Rialto Beach, WA" \
  --date "2026" \
  --camera "Olympus E-M10 Mark IV / 22mm" \
  --series "Weather Ledger"
```

Third, fourth, and later photographs use the same shape. As long as you do not add `--push`, these imports only update local files:

```text
assets/photos/...
data/works.json
```

They do not trigger a Netlify deploy.

The import script creates a web archive image, not a master file:

```text
long edge: 2200px by default
format: compressed JPG
metadata: stripped during export
watermark: subtle DK overlay position recorded for archive list views, hidden on the detail view
```

This removes real EXIF/GPS/camera metadata from the public JPG while keeping intentional display text in the site, such as camera, location, and series.

## Batch Delete Public Photographs

To delete a photograph locally without deploying:

```bash
python3 scripts/delete_photo.py --title "Rain Ledger" --category night-desk
```

Or delete by exact work id:

```bash
python3 scripts/delete_photo.py --id night-rain-ledger
```

This removes the entry from `data/works.json` and removes the matching JPG from `assets/photos/...`. It does not commit or push.

If you only want to remove the work from the site data but keep the file in the repo folder:

```bash
python3 scripts/delete_photo.py --title "Rain Ledger" --category night-desk --keep-file
```

## Publish One Batch

After importing and deleting as many photographs as needed, publish everything once:

```bash
git status
git add data/works.json assets/photos
git commit -m "Add new photograph batch"
git push origin main
```

`git push origin main` sends the local commit to GitHub's `main` branch. Because Netlify is connected to this repo, it deploys once after that push.

The simple rule is:

```text
Import or delete many photographs locally.
Do not push yet.
When ready, git add + git commit + git push once.
Netlify deploys once.
```

`--push` still exists for emergencies or tiny one-photo updates. It commits and pushes immediately, which also triggers Netlify immediately.

The current public photograph data lives in:

```text
data/works.json
```

The public image files live in:

```text
assets/photos/
```

For a public site where uploads are visible to everyone, connect the Studio workflow to a shared storage/database backend such as Supabase Storage + Postgres, S3 + DynamoDB, or Sanity/Contentful. The existing `putWork`, `getAllWorks`, and `clearWorks` functions in `app.js` are the only persistence boundary you need to replace.

## RAW Note

Browsers generally cannot preview proprietary RAW files directly. This site accepts RAW files as archival sources and displays the uploaded web preview as the visible artwork. HEIC/HEIF files are accepted; if the current browser cannot decode them, the site stores the source and renders a newspaper-style placeholder.

RAW originals should not be committed to GitHub. Export a web JPG first, or let `scripts/import_photo.py` try to convert the RAW through macOS `sips`. If `sips` cannot read that RAW format, export a JPG from Lightroom, Capture One, or Photos and import that JPG.

## Local Studio

The Studio page is for local experiments only. On the public Netlify site the Upload link is hidden and `#/studio` is blocked unless the URL includes `?admin`. Studio uploads are stored in the browser's IndexedDB, so they do not automatically enter GitHub or Netlify.
