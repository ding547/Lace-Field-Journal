const DB_NAME = "lace-field-portfolio";
const STORE_NAME = "works";
const DB_VERSION = 1;

const categories = [
  { id: "human", label: "Human", subtitle: "People, gesture, street gravity" },
  { id: "terrain", label: "Terrain", subtitle: "Land, weather, distance" },
  { id: "object", label: "Still Life", subtitle: "Objects, rooms, material evidence" },
  { id: "night", label: "Night Desk", subtitle: "Low light, neon, private streets" },
  { id: "motion", label: "Motion", subtitle: "Transit, blur, body rhythm" },
  { id: "misc", label: "Misc.", subtitle: "Unfiled negatives and visual notes" },
];

const seedWorks = [
  {
    id: "seed-human-01",
    title: "After the Crossing",
    category: "human",
    subtitle: "Street note / late afternoon",
    description:
      "A human frame held in quiet balance: posture, distance, municipal shade, and one small interruption of light.",
    palette: ["#211915", "#8b3325", "#d0b98f", "#2f4d4c"],
    scene: "human",
  },
  {
    id: "seed-terrain-01",
    title: "Low Green Horizon",
    category: "terrain",
    subtitle: "Landscape study / pale atmospheric edge",
    description:
      "The horizon is treated as a headline: a strip of green pressure, a blank field, a note from the weather desk.",
    palette: ["#171613", "#405645", "#d8c6a3", "#8c2f2d"],
    scene: "terrain",
  },
  {
    id: "seed-night-01",
    title: "Service Road at Night",
    category: "night",
    subtitle: "Night desk / sodium vapor",
    description:
      "A nocturnal fragment printed in heavy ink, where the street lamp becomes a small editorial decision.",
    palette: ["#100f12", "#75333d", "#d4bb91", "#26384a"],
    scene: "night",
  },
  {
    id: "seed-object-01",
    title: "Bottle, Wire, Paper",
    category: "object",
    subtitle: "Still life / table evidence",
    description:
      "Small objects are arranged like evidence on a desk: dust, glass, wire, and the cheap authority of paper.",
    palette: ["#19140f", "#a9542b", "#d7c29a", "#344c55"],
    scene: "object",
  },
  {
    id: "seed-motion-01",
    title: "Transit Blur",
    category: "motion",
    subtitle: "Movement / glass reflection",
    description:
      "The body leaves the frame and the color stays behind, caught in a motion column of ink and grain.",
    palette: ["#151617", "#2c6170", "#d2b98c", "#9b3b31"],
    scene: "motion",
  },
  {
    id: "seed-misc-01",
    title: "Unsorted Signal",
    category: "misc",
    subtitle: "Miscellaneous / contact sheet",
    description:
      "A visual note kept because the accident has better timing than the plan.",
    palette: ["#191612", "#6f5a82", "#d1b98d", "#426048"],
    scene: "misc",
  },
];

const state = {
  works: [],
  activeCategory: "all",
  objectUrls: new Map(),
  selectedCategory: "human",
  pointer: { x: 0.5, y: 0.5 },
};

const elements = {
  canvas: document.querySelector("#laceCanvas"),
  heroPlate: document.querySelector("#heroPlate"),
  departmentList: document.querySelector("#departmentList"),
  filterBar: document.querySelector("#filterBar"),
  galleryGrid: document.querySelector("#galleryGrid"),
  themePicker: document.querySelector("#themePicker"),
  categoryInput: document.querySelector("#categoryInput"),
  template: document.querySelector("#workCardTemplate"),
  uploadForm: document.querySelector("#uploadForm"),
  imageInput: document.querySelector("#imageInput"),
  rawInput: document.querySelector("#rawInput"),
  previewImage: document.querySelector("#previewImage"),
  rawName: document.querySelector("#rawName"),
  textureToggle: document.querySelector("#textureToggle"),
  exportButton: document.querySelector("#exportButton"),
  resetButton: document.querySelector("#resetButton"),
  dialog: document.querySelector("#workDialog"),
  dialogClose: document.querySelector("#dialogClose"),
  dialogImage: document.querySelector("#dialogImage"),
  dialogCategory: document.querySelector("#dialogCategory"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogSubtitle: document.querySelector("#dialogSubtitle"),
  dialogDescription: document.querySelector("#dialogDescription"),
  dialogRaw: document.querySelector("#dialogRaw"),
  posterHalftone: document.querySelector("#posterHalftone"),
};

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllWorks() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putWork(work) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(work);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

async function clearWorks() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

function categoryById(id) {
  return categories.find((category) => category.id === id) ?? categories[0];
}

function randomId() {
  return crypto.randomUUID?.() ?? `work-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`;
}

function createSeedImage(work) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext("2d");
  const [ink, accent, paper, blue] = work.palette;

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawPaperNoise(ctx, canvas.width, canvas.height);

  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.92;
  ctx.fillRect(84, 92, 1032, 8);
  ctx.fillRect(84, 1400, 1032, 8);
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(120, 150);
  ctx.fillStyle = accent;
  ctx.font = "900 178px Georgia, serif";
  ctx.textBaseline = "top";
  ctx.fillText(work.title.split(" ")[0].toUpperCase(), 0, 0, 960);
  ctx.restore();

  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.strokeRect(84, 360, 1032, 820);

  drawScene(ctx, work.scene, work.palette);
  drawHalftoneLayer(ctx, 0, 0, canvas.width, canvas.height, ink, 8, 0.26);

  ctx.fillStyle = ink;
  ctx.font = "700 46px Georgia, serif";
  wrapText(ctx, work.title, 110, 1234, 980, 54);
  ctx.font = "500 24px IBM Plex Mono, monospace";
  ctx.fillText(categoryById(work.category).label.toUpperCase(), 110, 1336);
  return canvas.toDataURL("image/jpeg", 0.9);
}

function drawScene(ctx, scene, palette) {
  const [ink, accent, paper, blue] = palette;
  ctx.save();
  ctx.translate(600, 790);
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 14;

  if (scene === "human") {
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(-120, -160, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-190, -60, 140, 370);
    ctx.fillStyle = accent;
    ctx.fillRect(60, -80, 90, 390);
    ctx.fillStyle = blue;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(-370, 300, 740, 38);
  }

  if (scene === "terrain") {
    for (let i = 0; i < 7; i += 1) {
      ctx.globalAlpha = 0.82 - i * 0.08;
      ctx.beginPath();
      ctx.moveTo(-500, 160 + i * 34);
      for (let x = -500; x <= 500; x += 70) {
        ctx.lineTo(x, 110 + i * 45 + Math.sin((x + i * 77) * 0.012) * 36);
      }
      ctx.lineTo(500, 450);
      ctx.lineTo(-500, 450);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (scene === "night") {
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = ink;
    ctx.fillRect(-390, -360, 54, 760);
    ctx.fillRect(292, -280, 42, 680);
    ctx.fillStyle = accent;
    ctx.fillRect(-500, -42, 1000, 58);
    ctx.strokeStyle = blue;
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(0, -70, 190, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (scene === "object") {
    ctx.globalAlpha = 0.9;
    ctx.strokeRect(-250, -300, 280, 500);
    ctx.fillStyle = accent;
    ctx.fillRect(100, -120, 270, 280);
    ctx.strokeStyle = blue;
    ctx.beginPath();
    ctx.moveTo(-380, 280);
    ctx.lineTo(410, -30);
    ctx.stroke();
  }

  if (scene === "motion") {
    for (let i = 0; i < 12; i += 1) {
      ctx.globalAlpha = 0.36 + i * 0.035;
      ctx.fillRect(-500 + i * 92, -330 + i * 15, 58, 690);
    }
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(-520, -20, 1040, 82);
  }

  if (scene === "misc") {
    ctx.globalAlpha = 0.78;
    for (let i = 0; i < 10; i += 1) {
      ctx.strokeStyle = i % 2 ? accent : ink;
      ctx.beginPath();
      ctx.arc(Math.cos(i) * 250, Math.sin(i * 1.4) * 250, 54 + i * 9, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = blue;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(-310, 160, 620, 92);
  }

  ctx.restore();
}

function drawPaperNoise(ctx, width, height) {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 28;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
  }
  ctx.putImageData(image, 0, 0);
}

function drawHalftoneLayer(ctx, x, y, width, height, color, cell, alpha) {
  const rgb = hexToRgb(color);
  ctx.save();
  ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  for (let py = y; py < y + height; py += cell) {
    for (let px = x; px < x + width; px += cell) {
      const radius = 0.8 + ((px * 3 + py * 5) % 17) / 8;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = word;
    } else {
      line = testLine;
    }
  });
  ctx.fillText(line, x, y);
}

function getImageSrc(work) {
  if (work.previewDataUrl) return work.previewDataUrl;
  if (work.imageBlob) {
    if (!state.objectUrls.has(work.id)) {
      state.objectUrls.set(work.id, URL.createObjectURL(work.imageBlob));
    }
    return state.objectUrls.get(work.id);
  }
  if (!work.imageSrc) work.imageSrc = createSeedImage(work);
  return work.imageSrc;
}

function renderChrome() {
  elements.departmentList.innerHTML = categories
    .map((category) => `<li><span>${category.label}</span><em>${category.subtitle}</em></li>`)
    .join("");

  const filters = [{ id: "all", label: "All" }, ...categories.map(({ id, label }) => ({ id, label }))];
  elements.filterBar.innerHTML = filters
    .map(
      (item) =>
        `<button class="filter-button${item.id === state.activeCategory ? " is-active" : ""}" type="button" data-category="${item.id}">${item.label}</button>`,
    )
    .join("");

  elements.themePicker.innerHTML = categories
    .map(
      (category) =>
        `<button class="theme-button${category.id === state.selectedCategory ? " is-active" : ""}" type="button" role="radio" aria-checked="${category.id === state.selectedCategory}" data-theme="${category.id}">
          <span>${category.label}</span>
          <small>${category.subtitle}</small>
        </button>`,
    )
    .join("");
  elements.categoryInput.value = state.selectedCategory;
}

function renderGallery() {
  const works = state.works.filter(
    (work) => state.activeCategory === "all" || work.category === state.activeCategory,
  );
  elements.galleryGrid.innerHTML = "";

  works.forEach((work, index) => {
    const node = elements.template.content.firstElementChild.cloneNode(true);
    const category = categoryById(work.category);
    const image = node.querySelector(".work-image");
    const button = node.querySelector(".work-open");

    image.src = getImageSrc(work);
    image.alt = work.title;
    node.querySelector(".work-theme").textContent = category.label;
    node.querySelector(".work-kicker").textContent = `Issue ${String(index + 1).padStart(2, "0")} / ${category.label}`;
    node.querySelector(".work-title").textContent = work.title;
    node.querySelector(".work-summary").textContent = work.subtitle || category.subtitle;
    node.style.setProperty("--accent", work.palette?.[1] ?? "#8b3325");
    node.style.animationDelay = `${Math.min(index * 55, 420)}ms`;
    button.addEventListener("click", () => openWork(work.id));
    elements.galleryGrid.append(node);
  });
}

function bindFilters() {
  elements.filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.activeCategory = button.dataset.category;
    renderChrome();
    renderGallery();
  });
}

function bindThemePicker() {
  elements.themePicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme]");
    if (!button) return;
    state.selectedCategory = button.dataset.theme;
    elements.categoryInput.value = state.selectedCategory;
    renderChrome();
  });
}

function testImageFile(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
      URL.revokeObjectURL(url);
      resolve({ ok: true, dimensions });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, dimensions: { width: null, height: null } });
    };
    image.src = url;
  });
}

async function derivePaletteFromFile(file, fallback) {
  const url = URL.createObjectURL(file);
  try {
    return await derivePaletteFromSrc(url, fallback);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function derivePaletteFromSrc(src, fallback = ["#191612", "#8b3325", "#d7c29a", "#334d52"]) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const buckets = [
        { r: 0, g: 0, b: 0, count: 0 },
        { r: 0, g: 0, b: 0, count: 0 },
      ];
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const bucket = luminance < 126 ? buckets[0] : buckets[1];
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        bucket.count += 1;
      }
      const dark = buckets[0].count
        ? rgbToHex({ r: buckets[0].r / buckets[0].count, g: buckets[0].g / buckets[0].count, b: buckets[0].b / buckets[0].count })
        : fallback[0];
      const light = buckets[1].count
        ? rgbToHex({ r: buckets[1].r / buckets[1].count, g: buckets[1].g / buckets[1].count, b: buckets[1].b / buckets[1].count })
        : fallback[2];
      resolve([dark, fallback[1], light, fallback[3]]);
    };
    image.onerror = () => resolve(fallback);
    image.src = src;
  });
}

function createUnsupportedPreview(title, categoryId, fileName) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext("2d");
  const category = categoryById(categoryId);
  ctx.fillStyle = "#d5bea0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawPaperNoise(ctx, canvas.width, canvas.height);
  drawHalftoneLayer(ctx, 0, 0, canvas.width, canvas.height, "#17130f", 9, 0.24);

  ctx.strokeStyle = "#17130f";
  ctx.lineWidth = 7;
  ctx.strokeRect(80, 80, 1040, 1340);
  ctx.fillStyle = "#17130f";
  ctx.font = "900 128px Georgia, serif";
  wrapText(ctx, title || "Archived Negative", 120, 180, 960, 128);
  ctx.font = "700 34px IBM Plex Mono, monospace";
  ctx.fillText(category.label.toUpperCase(), 120, 1120);
  ctx.font = "500 26px IBM Plex Mono, monospace";
  wrapText(ctx, `Stored source: ${fileName}. Add a JPG or HEIC-compatible preview for visible photographic display.`, 120, 1190, 900, 38);
  return canvas.toDataURL("image/jpeg", 0.88);
}

async function updatePreview(file) {
  if (!file) return;
  const result = await testImageFile(file);
  if (result.ok) {
    const url = URL.createObjectURL(file);
    elements.previewImage.src = url;
    elements.previewImage.onload = () => URL.revokeObjectURL(url);
  } else {
    const title = elements.uploadForm.elements.title.value.trim() || "Archived Negative";
    elements.previewImage.src = createUnsupportedPreview(title, state.selectedCategory, file.name);
  }
  elements.previewImage.closest(".drop-zone").classList.add("has-preview");
}

async function buildPreviewRecord(file, title, categoryId) {
  const category = categoryById(categoryId);
  const result = await testImageFile(file);
  const fallback = ["#191612", "#8b3325", "#d7c29a", "#334d52"];
  if (result.ok) {
    return {
      imageBlob: file,
      previewDataUrl: "",
      width: result.dimensions.width,
      height: result.dimensions.height,
      palette: await derivePaletteFromFile(file, fallback),
    };
  }
  return {
    imageBlob: file,
    previewDataUrl: createUnsupportedPreview(title, category.id, file.name),
    width: null,
    height: null,
    palette: fallback,
  };
}

function bindUpload() {
  elements.imageInput.addEventListener("change", () => {
    updatePreview(elements.imageInput.files?.[0]);
  });

  elements.rawInput.addEventListener("change", () => {
    const file = elements.rawInput.files?.[0];
    elements.rawName.textContent = file ? `${file.name} / ${(file.size / 1024 / 1024).toFixed(1)} MB` : "Optional source negative";
  });

  elements.uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(elements.uploadForm);
    const image = form.get("image");
    const raw = form.get("raw");
    if (!(image instanceof File) || image.size === 0) return;

    const title = String(form.get("title")).trim();
    const category = String(form.get("category") || state.selectedCategory);
    const preview = await buildPreviewRecord(image, title, category);
    const work = {
      id: randomId(),
      title,
      category,
      subtitle: String(form.get("subtitle")).trim(),
      description: String(form.get("description")).trim(),
      imageName: image.name,
      imageType: image.type,
      rawBlob: raw instanceof File && raw.size > 0 ? raw : null,
      rawName: raw instanceof File && raw.size > 0 ? raw.name : "",
      rawType: raw instanceof File && raw.size > 0 ? raw.type : "",
      createdAt: new Date().toISOString(),
      ...preview,
    };

    await putWork(work);
    state.works = [work, ...state.works];
    elements.uploadForm.reset();
    state.selectedCategory = "human";
    elements.previewImage.removeAttribute("src");
    elements.previewImage.closest(".drop-zone").classList.remove("has-preview");
    elements.rawName.textContent = "Optional source negative";
    state.activeCategory = "all";
    renderChrome();
    renderGallery();
    document.querySelector("#portfolio").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

async function openWork(id) {
  const work = state.works.find((item) => item.id === id);
  if (!work) return;

  const category = categoryById(work.category);
  const src = getImageSrc(work);
  const palette = work.palette ?? (await derivePaletteFromSrc(src));
  elements.dialog.style.setProperty("--poster-ink", palette[0]);
  elements.dialog.style.setProperty("--poster-accent", palette[1]);
  elements.dialog.style.setProperty("--poster-paper", palette[2]);
  elements.dialog.style.setProperty("--poster-blue", palette[3]);

  elements.dialogImage.src = src;
  elements.dialogImage.alt = work.title;
  elements.dialogCategory.textContent = category.label;
  elements.dialogTitle.textContent = work.title;
  elements.dialogSubtitle.textContent = work.subtitle || category.subtitle;
  elements.dialogDescription.textContent = work.description || "A quiet frame from the archive.";

  if (elements.dialogRaw.dataset.url) {
    URL.revokeObjectURL(elements.dialogRaw.dataset.url);
    delete elements.dialogRaw.dataset.url;
  }

  if (work.rawBlob) {
    const rawUrl = URL.createObjectURL(work.rawBlob);
    elements.dialogRaw.href = rawUrl;
    elements.dialogRaw.download = work.rawName || `${work.title}.raw`;
    elements.dialogRaw.dataset.url = rawUrl;
    elements.dialogRaw.hidden = false;
  } else {
    elements.dialogRaw.hidden = true;
  }

  elements.dialog.showModal();
  requestAnimationFrame(() => drawPosterHalftone(src, palette));
}

function drawPosterHalftone(src, palette) {
  const canvas = elements.posterHalftone;
  const rect = elements.dialog.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const [ink, accent, paper, blue] = palette;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, rect.width, rect.height);

  const image = new Image();
  image.onload = () => {
    const sample = document.createElement("canvas");
    const sw = Math.max(80, Math.round(rect.width / 4));
    const sh = Math.max(80, Math.round(rect.height / 4));
    sample.width = sw;
    sample.height = sh;
    const sctx = sample.getContext("2d", { willReadFrequently: true });
    const scale = Math.max(sw / image.naturalWidth, sh / image.naturalHeight);
    const iw = image.naturalWidth * scale;
    const ih = image.naturalHeight * scale;
    sctx.drawImage(image, (sw - iw) / 2, (sh - ih) / 2, iw, ih);
    const data = sctx.getImageData(0, 0, sw, sh).data;

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.42;
    ctx.fillRect(rect.width * 0.58, 0, rect.width * 0.42, rect.height);
    ctx.fillStyle = blue;
    ctx.globalAlpha = 0.28;
    ctx.fillRect(0, rect.height * 0.56, rect.width, rect.height * 0.44);
    ctx.globalAlpha = 1;

    const inkRgb = hexToRgb(ink);
    const cell = rect.width < 700 ? 8 : 10;
    for (let y = 0; y < rect.height; y += cell) {
      for (let x = 0; x < rect.width; x += cell) {
        const sx = Math.floor((x / rect.width) * sw);
        const sy = Math.floor((y / rect.height) * sh);
        const i = (sy * sw + sx) * 4;
        const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        const darkness = 1 - luminance / 255;
        const radius = 0.55 + darkness * (cell * 0.62);
        ctx.fillStyle = `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, ${0.2 + darkness * 0.72})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  image.src = src;
}

function bindDialog() {
  elements.dialogClose.addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) elements.dialog.close();
  });
}

function bindTextureToggle() {
  elements.textureToggle.addEventListener("click", () => {
    const isOff = document.body.classList.toggle("texture-off");
    elements.textureToggle.setAttribute("aria-pressed", String(!isOff));
  });
}

function bindExportAndReset() {
  elements.exportButton.addEventListener("click", () => {
    const manifest = state.works.map((work) => ({
      id: work.id,
      title: work.title,
      category: work.category,
      subtitle: work.subtitle,
      description: work.description,
      imageName: work.imageName ?? "generated-newsprint-proof.jpg",
      rawName: work.rawName ?? "",
      width: work.width ?? null,
      height: work.height ?? null,
      createdAt: work.createdAt ?? null,
    }));
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lace-field-journal-manifest.json";
    anchor.click();
    URL.revokeObjectURL(url);
  });

  elements.resetButton.addEventListener("click", async () => {
    await clearWorks();
    state.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    state.objectUrls.clear();
    state.works = seedWorks.map((work) => ({ ...work, imageSrc: createSeedImage(work) }));
    state.activeCategory = "all";
    state.selectedCategory = "human";
    renderChrome();
    renderGallery();
  });
}

function bindPointerMotion() {
  window.addEventListener(
    "pointermove",
    (event) => {
      state.pointer.x = event.clientX / window.innerWidth;
      state.pointer.y = event.clientY / window.innerHeight;
      const rotateY = (state.pointer.x - 0.5) * 8;
      const rotateX = (0.5 - state.pointer.y) * 6;
      elements.heroPlate.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    },
    { passive: true },
  );
}

function setupLaceCanvas() {
  const canvas = elements.canvas;
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let frame = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    frame += 0.006;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(35, 28, 18, 0.11)";
    ctx.lineWidth = 0.75;

    for (let y = -40; y < height + 40; y += 42) {
      ctx.beginPath();
      for (let x = -40; x < width + 40; x += 26) {
        const pull = Math.max(0, 1 - Math.hypot(x - state.pointer.x * width, y - state.pointer.y * height) / 720);
        const wobble = Math.sin(x * 0.01 + y * 0.015 + frame * 4) * 5;
        const px = x + (state.pointer.x - 0.5) * pull * 22;
        const py = y + wobble + (state.pointer.y - 0.5) * pull * 18;
        if (x === -40) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(35, 28, 18, 0.12)";
    for (let y = 0; y < height; y += 18) {
      for (let x = 0; x < width; x += 18) {
        const distance = Math.hypot(x - state.pointer.x * width, y - state.pointer.y * height);
        const radius = 0.45 + Math.max(0, 1 - distance / 520) * 1.9;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
}

async function init() {
  renderChrome();
  bindFilters();
  bindThemePicker();
  bindUpload();
  bindDialog();
  bindTextureToggle();
  bindExportAndReset();
  bindPointerMotion();
  setupLaceCanvas();

  const savedWorks = await getAllWorks();
  state.works = savedWorks.length
    ? savedWorks.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    : seedWorks.map((work) => ({ ...work, imageSrc: createSeedImage(work) }));
  renderGallery();
}

init().catch((error) => {
  console.error(error);
  elements.galleryGrid.innerHTML = "<p>Portfolio failed to load. Please refresh the page.</p>";
});
