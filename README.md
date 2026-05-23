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

## Run Locally

Because this site uses ES modules and IndexedDB, serve it from a local web server:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## Publish Publicly

The current build is a static site and can be deployed to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any ordinary static host.

For a public site where uploads are visible to everyone, connect the Studio workflow to a shared storage/database backend such as Supabase Storage + Postgres, S3 + DynamoDB, or Sanity/Contentful. The existing `putWork`, `getAllWorks`, and `clearWorks` functions in `app.js` are the only persistence boundary you need to replace.

## RAW Note

Browsers generally cannot preview proprietary RAW files directly. This site accepts RAW files as archival sources and displays the uploaded web preview as the visible artwork. HEIC/HEIF files are accepted; if the current browser cannot decode them, the site stores the source and renders a newspaper-style placeholder.
