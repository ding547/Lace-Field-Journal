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
- Local photo import script for web-ready JPG output and Git publishing

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

## Add A Public Photograph

Use the import script for JPG, PNG, HEIC, TIFF, or a RAW file that macOS can read:

```bash
python3 scripts/import_photo.py "/Users/keding/Downloads/IMG_7759.JPG" \
  --category terrain \
  --title "Blue Distance" \
  --subtitle "Low horizon / Atlantic weather note" \
  --location "Atlantic Coast" \
  --date "2026" \
  --camera "Olympus E-M10 Mark IV / 150mm" \
  --series "Weather Ledger" \
  --push
```

`--push` does the full simple workflow: creates a compressed public JPG in `assets/photos/...`, updates `data/works.json`, commits the changed files, and pushes `main` to GitHub. Netlify then deploys automatically.

If you want to review before publishing, omit `--push`:

```bash
python3 scripts/import_photo.py "/path/to/photo.jpg" --category human --title "Photograph Title"
git status
git add data/works.json assets/photos
git commit -m "Add Photograph Title"
git push origin main
```

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
