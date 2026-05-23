const DB_NAME = "lace-field-portfolio";
const STORE_NAME = "works";
const DB_VERSION = 1;
const PUBLISHED_WORKS_URL = "./data/works.json";
const BGM_TRACKS = [
  "./assets/audio/bgm-02.mp3",
  "./assets/audio/bgm-03.mp3",
  "./assets/audio/bgm-04.mp3",
];

const categories = [
  { id: "human", slug: "human", label: "Human", subtitle: "People, gesture, street gravity" },
  { id: "terrain", slug: "terrain", label: "Terrain", subtitle: "Land, weather, distance" },
  { id: "object", slug: "still-life", label: "Still Life", subtitle: "Objects, rooms, material evidence" },
  { id: "night", slug: "night-desk", label: "Night Desk", subtitle: "Low light, neon, private streets" },
  { id: "motion", slug: "motion", label: "Motion", subtitle: "Transit, blur, body rhythm" },
  { id: "misc", slug: "misc", label: "Misc.", subtitle: "Unfiled negatives and visual notes" },
];

const seedWorks = [
  {
    id: "seed-human-01",
    title: "After the Crossing",
    category: "human",
    subtitle: "Street note / late afternoon",
    description:
      "A human frame held in quiet balance: posture, distance, municipal shade, and one small interruption of light.",
    location: "Columbus, OH",
    date: "2026",
    camera: "35mm / 50mm",
    series: "Street gravity",
    format: "Digital negative",
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
    location: "Lake Erie, OH",
    date: "2026",
    camera: "Full-frame / 35mm",
    series: "Quiet weather",
    format: "Digital negative",
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
    location: "Cleveland, OH",
    date: "2026",
    camera: "Low light / 35mm",
    series: "Night desk",
    format: "Digital negative",
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
    location: "Studio table",
    date: "2026",
    camera: "Macro / 60mm",
    series: "Material evidence",
    format: "Digital negative",
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
    location: "Transit line",
    date: "2026",
    camera: "35mm / slow shutter",
    series: "Movement studies",
    format: "Digital negative",
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
    location: "Unfiled",
    date: "2026",
    camera: "Mixed format",
    series: "Private negatives",
    format: "Digital negative",
    palette: ["#191612", "#6f5a82", "#d1b98d", "#426048"],
    scene: "misc",
  },
];

const state = {
  works: [],
  baseWorks: [],
  activeCategory: "all",
  objectUrls: new Map(),
  selectedCategory: "human",
  activeWorkId: null,
  sceneMotionTicking: false,
  pointer: { x: 0.5, y: 0.5 },
  music: {
    audio: null,
    index: 0,
    wantsPlayback: false,
  },
};

const elements = {
  canvas: document.querySelector("#laceCanvas"),
  views: document.querySelectorAll(".app-view"),
  homeView: document.querySelector("#homeView"),
  categoryView: document.querySelector("#categoryView"),
  detailView: document.querySelector("#detailView"),
  studioView: document.querySelector("#studioView"),
  archiveAtmosphere: document.querySelector("#archiveAtmosphere"),
  detailAtmosphere: document.querySelector("#detailAtmosphere"),
  departmentList: document.querySelector("#departmentList"),
  categoryKicker: document.querySelector("#categoryKicker"),
  categoryTitle: document.querySelector("#categoryTitle"),
  categorySubtitle: document.querySelector("#categorySubtitle"),
  workScrollList: document.querySelector("#workScrollList"),
  detailBack: document.querySelector("#detailBack"),
  detailImage: document.querySelector("#detailImage"),
  detailKicker: document.querySelector("#detailKicker"),
  detailTitle: document.querySelector("#detailTitle"),
  detailSubtitle: document.querySelector("#detailSubtitle"),
  detailMeta: document.querySelector("#detailMeta"),
  detailDescription: document.querySelector("#detailDescription"),
  detailRaw: document.querySelector("#detailRaw"),
  detailDelete: document.querySelector("#detailDelete"),
  themePicker: document.querySelector("#themePicker"),
  categoryInput: document.querySelector("#categoryInput"),
  template: document.querySelector("#workCardTemplate"),
  uploadForm: document.querySelector("#uploadForm"),
  imageInput: document.querySelector("#imageInput"),
  rawInput: document.querySelector("#rawInput"),
  previewImage: document.querySelector("#previewImage"),
  rawName: document.querySelector("#rawName"),
  musicToggle: document.querySelector("#musicToggle"),
  musicToggleLabel: document.querySelector("#musicToggleLabel"),
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
  dialogDelete: document.querySelector("#dialogDelete"),
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

async function deleteWorkRecord(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
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

function categoryBySlug(slug) {
  return categories.find((category) => category.slug === slug || category.id === slug) ?? null;
}

function categoryRoute(category) {
  return `#/archive/${category.slug}`;
}

function categoryPhotoFolder(categoryId) {
  return categoryById(categoryId).slug;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function workSlug(work) {
  return slugify(work.slug || work.title || work.id) || work.id;
}

function workRoute(work) {
  const category = categoryById(work.category);
  return `${categoryRoute(category)}/${workSlug(work)}`;
}

function workBySlug(categoryId, slug) {
  return state.works.find((work) => work.category === categoryId && (work.id === slug || workSlug(work) === slug));
}

function randomId() {
  return crypto.randomUUID?.() ?? `work-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function isLocalPreviewHost() {
  return ["", "localhost", "127.0.0.1", "::1", "[::1]"].includes(location.hostname);
}

function isAdminMode() {
  return isLocalPreviewHost() || new URLSearchParams(location.search).has("admin");
}

function createSeedWorks() {
  return seedWorks.map((work) => ({ ...work, source: "demo", imageSrc: createSeedImage(work) }));
}

function normalizePublishedWork(work, index) {
  const category = categoryBySlug(work.category) ?? categoryById(work.category);
  const title = String(work.title || `Untitled Photograph ${index + 1}`).trim();
  const sample = seedWorks.find((item) => item.category === category.id) ?? seedWorks[0];
  return {
    id: String(work.id || `${category.id}-${slugify(title) || index + 1}`),
    title,
    category: category.id,
    slug: work.slug || slugify(title),
    subtitle: String(work.subtitle || ""),
    description: String(work.description || ""),
    location: String(work.location || ""),
    date: String(work.date || ""),
    camera: String(work.camera || ""),
    series: String(work.series || ""),
    format: String(work.format || "Web photograph"),
    imageSrc: String(work.imageSrc || `./assets/photos/${categoryPhotoFolder(category.id)}/${slugify(title)}.jpg`),
    width: Number(work.width) || null,
    height: Number(work.height) || null,
    palette: Array.isArray(work.palette) ? work.palette : sample.palette,
    scene: work.scene || "",
    source: "published",
    createdAt: work.createdAt || "",
  };
}

async function loadPublishedWorks() {
  try {
    const response = await fetch(PUBLISHED_WORKS_URL, { cache: "no-store" });
    if (!response.ok) return [];
    const works = await response.json();
    if (!Array.isArray(works)) return [];
    return works.map(normalizePublishedWork);
  } catch (error) {
    console.warn("Published works could not be loaded; using demo works.", error);
    return [];
  }
}

function mergeWorks(localWorks, baseWorks) {
  const sortedLocalWorks = localWorks.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const localIds = new Set(sortedLocalWorks.map((work) => work.id));
  return [...sortedLocalWorks, ...baseWorks.filter((work) => !localIds.has(work.id))];
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

function kineticSceneSvg(work) {
  if (!work.scene || !work.palette) return "";
  const [ink, accent, paper, blue] = work.palette;
  const category = categoryById(work.category);
  const firstWord = work.title.split(" ")[0].toUpperCase();
  const scene = {
    human: `
      <g class="scene-substrate">
        <rect x="210" y="1070" width="780" height="46" />
      </g>
      <g class="scene-layer human-column accent-fill"><rect x="660" y="520" width="112" height="462" /></g>
      <g class="scene-layer human-body ink-fill">
        <circle cx="466" cy="438" r="78" />
        <rect x="395" y="540" width="142" height="418" />
      </g>
      <g class="scene-layer human-shadow blue-fill"><rect x="260" y="1015" width="680" height="42" /></g>
    `,
    terrain: `
      <g class="terrain-stack ink-fill">
        ${Array.from({ length: 7 }, (_, i) => {
          const y = 640 + i * 66;
          const opacity = (0.88 - i * 0.08).toFixed(2);
          return `<path class="scene-layer terrain-wave wave-${i + 1}" style="--wave: ${i}" opacity="${opacity}" d="M190 ${y} C300 ${y - 90} 420 ${y + 60} 540 ${y - 20} S790 ${y - 80} 1010 ${y + 20} L1010 1180 L190 1180 Z" />`;
        }).join("")}
      </g>
      <g class="scene-layer terrain-sun accent-fill"><circle cx="855" cy="520" r="58" /></g>
      <g class="scene-layer terrain-line blue-stroke"><path d="M180 618 C365 540 520 630 690 566 S900 512 1030 586" /></g>
    `,
    night: `
      <g class="scene-layer night-post ink-fill"><rect x="260" y="430" width="58" height="780" /><rect x="880" y="520" width="48" height="690" /></g>
      <g class="scene-layer night-orbit blue-stroke"><circle cx="600" cy="720" r="220" /></g>
      <g class="scene-layer night-road accent-fill"><rect x="160" y="785" width="880" height="68" /></g>
      <g class="scene-layer night-glow accent-fill"><circle cx="600" cy="710" r="70" /></g>
      <g class="scene-layer night-wire ink-stroke"><path d="M240 560 C420 500 780 500 960 560" /></g>
    `,
    object: `
      <g class="scene-layer object-frame ink-stroke"><rect x="300" y="470" width="285" height="510" /></g>
      <g class="scene-layer object-block accent-fill"><rect x="695" y="620" width="300" height="300" /></g>
      <g class="scene-layer object-wire blue-stroke"><path d="M190 1020 C370 920 505 865 648 792 S890 650 1030 585" /></g>
      <g class="scene-layer object-dot ink-fill"><circle cx="760" cy="560" r="42" /><circle cx="915" cy="965" r="28" /></g>
    `,
    motion: `
      <g class="motion-stack ink-fill">
        ${Array.from({ length: 12 }, (_, i) => `<rect class="scene-layer motion-bar bar-${i + 1}" style="--bar: ${i}" x="${145 + i * 78}" y="${470 + i * 16}" width="56" height="710" opacity="${(0.28 + i * 0.045).toFixed(2)}" />`).join("")}
      </g>
      <g class="scene-layer motion-band accent-fill"><rect x="130" y="765" width="940" height="88" /></g>
      <g class="scene-layer motion-rail blue-stroke"><path d="M130 650 L1080 570 M130 960 L1080 1040" /></g>
    `,
    misc: `
      <g class="misc-orbits">
        ${Array.from({ length: 10 }, (_, i) => `<circle class="scene-layer misc-ring ring-${i + 1}" style="--ring: ${i}" cx="${600 + Math.cos(i) * 230}" cy="${760 + Math.sin(i * 1.4) * 230}" r="${52 + i * 8}" />`).join("")}
      </g>
      <g class="scene-layer misc-signal blue-fill"><rect x="292" y="950" width="616" height="96" /></g>
      <g class="scene-layer misc-pulse accent-fill"><circle cx="600" cy="760" r="54" /></g>
    `,
  }[work.scene];

  return `
    <span class="kinetic-scene" aria-hidden="true" data-scene="${work.scene}">
      <svg viewBox="0 0 1200 1500" role="img">
        <style>
          .ink-fill{fill:${ink}}.accent-fill{fill:${accent}}.paper-fill{fill:${paper}}.blue-fill{fill:${blue}}
          .ink-stroke{stroke:${ink}}.blue-stroke{stroke:${blue}}
        </style>
        <rect class="paper-fill" width="1200" height="1500" />
        <rect class="scene-rule ink-fill" x="84" y="92" width="1032" height="8" />
        <rect class="scene-rule ink-fill" x="84" y="1400" width="1032" height="8" />
        <text class="scene-headline accent-fill" x="112" y="300">${firstWord}</text>
        <rect class="scene-frame" x="84" y="360" width="1032" height="820" />
        <g class="scene-viewport">${scene}</g>
        <text class="scene-title ink-fill" x="110" y="1278">${work.title}</text>
        <text class="scene-department ink-fill" x="110" y="1360">${category.label.toUpperCase()}</text>
      </svg>
    </span>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function categoryWorks(categoryId) {
  return state.works.filter((work) => work.category === categoryId);
}

function departmentIconSvg(category) {
  const sample = seedWorks.find((work) => work.category === category.id) ?? seedWorks[0];
  const [ink, accent, paper, blue] = sample.palette;
  const scene = {
    human: `
      <circle class="dept-human-head" cx="27" cy="21" r="8"/>
      <rect class="dept-human-body" x="20" y="33" width="14" height="28"/>
      <rect class="dept-human-shadow accent" x="43" y="29" width="10" height="35"/>
      <rect class="dept-human-ground blue" x="18" y="66" width="42" height="5"/>
    `,
    terrain: `
      <path class="dept-terrain-mass" d="M10 45 C22 31 33 51 45 38 S61 31 74 43 L74 70 L10 70 Z"/>
      <path class="dept-terrain-wave blue stroke" d="M9 32 C24 22 39 36 52 28 S69 24 78 34"/>
    `,
    object: `
      <rect class="dept-object-frame stroke" x="16" y="18" width="28" height="46"/>
      <rect class="dept-object-block accent" x="50" y="34" width="24" height="25"/>
      <path class="dept-object-measure blue stroke" d="M10 66 C26 58 45 50 78 30"/>
    `,
    night: `
      <rect class="dept-night-post-left" x="16" y="13" width="8" height="62"/>
      <rect class="dept-night-post-right" x="64" y="22" width="7" height="53"/>
      <circle class="dept-night-orbit blue stroke" cx="43" cy="42" r="20"/>
      <rect class="dept-night-light accent" x="10" y="48" width="68" height="8"/>
    `,
    motion:
      Array.from(
        { length: 6 },
        (_, index) =>
          `<rect class="dept-motion-mini-bar dept-bar-${index + 1}" x="${14 + index * 10}" y="${18 + index * 4}" width="6" height="48" opacity="${0.35 + index * 0.1}"/>`,
      ).join("") + `<rect class="dept-motion-mini-band accent" x="10" y="43" width="68" height="10"/>`,
    misc:
      Array.from(
        { length: 5 },
        (_, index) =>
          `<circle class="dept-misc-ring dept-ring-${index + 1} ${index % 2 ? "accent stroke" : "stroke"}" cx="${42 + Math.cos(index) * 18}" cy="${42 + Math.sin(index * 1.4) * 18}" r="${9 + index * 3}"/>`,
      ).join("") + `<rect class="dept-misc-shelf blue" x="19" y="57" width="47" height="9"/>`,
  }[sample.scene];

  return `<svg class="department-mini-icon" viewBox="0 0 84 84" role="img" aria-label="${escapeHtml(category.label)} icon">
    <style>
      .department-mini-icon{background:${paper}} .department-mini-icon path,.department-mini-icon rect,.department-mini-icon circle{fill:${ink}} .department-mini-icon .accent{fill:${accent}} .department-mini-icon .blue{fill:${blue}} .department-mini-icon .stroke{fill:none;stroke:${ink};stroke-width:5;stroke-linecap:round;stroke-linejoin:round} .department-mini-icon .blue.stroke{stroke:${blue}} .department-mini-icon .accent.stroke{stroke:${accent}} .department-mini-icon .icon-paper{fill:${paper}}
    </style>
    <rect class="icon-paper" x="2" y="2" width="80" height="80" />
    ${scene}
  </svg>`;
}

function renderChrome() {
  elements.departmentList.innerHTML = categories
    .map((category) => {
      const count = categoryWorks(category.id).length;
      return `<li>
        <a class="department-card" href="${categoryRoute(category)}" data-category-card="${category.id}">
          <span class="department-icon" aria-hidden="true">${departmentIconSvg(category)}</span>
          <span class="department-copy">
            <strong>${escapeHtml(category.label)}</strong>
            <em>${escapeHtml(category.subtitle)}</em>
            <span>${count} ${count === 1 ? "work" : "works"}</span>
          </span>
        </a>
      </li>`;
    })
    .join("");

  elements.themePicker.innerHTML = categories
    .map(
      (category) =>
        `<button class="theme-button${category.id === state.selectedCategory ? " is-active" : ""}" type="button" role="radio" aria-checked="${category.id === state.selectedCategory}" data-theme="${category.id}">
          <span>${escapeHtml(category.label)}</span>
          <small>${escapeHtml(category.subtitle)}</small>
        </button>`,
    )
    .join("");
  elements.categoryInput.value = state.selectedCategory;
}

function renderWorkScrollList(category) {
  const works = categoryWorks(category.id);
  const activeWork = works[0];
  elements.categoryKicker.textContent = "Archive department";
  elements.categoryTitle.textContent = category.label;
  elements.categorySubtitle.textContent = category.subtitle;
  elements.archiveAtmosphere.style.backgroundImage = activeWork ? `url("${getImageSrc(activeWork)}")` : "";

  if (!works.length) {
    elements.workScrollList.innerHTML = '<p class="empty-gallery">No photographs in this section yet.</p>';
    return;
  }

  elements.workScrollList.innerHTML = works
    .map((work, index) => {
      const src = getImageSrc(work);
      const width = Number(work.width) || 1200;
      const height = Number(work.height) || 1500;
      const issue = `${category.label} / ${String(index + 1).padStart(3, "0")}`;
      const meta = [work.location || "Unplaced", work.date || "Undated"].filter(Boolean).join(" · ");
      const intro = work.subtitle || work.description || category.subtitle;
      const deleteButton =
        work.source === "published"
          ? ""
          : `<button class="work-row-delete delete-link" type="button" data-delete-work="${escapeHtml(work.id)}">Delete</button>`;
      return `<article class="work-row" data-work-id="${escapeHtml(work.id)}" style="--work-ratio:${width} / ${height}">
        <a class="work-row-image" href="${workRoute(work)}" aria-label="Open ${escapeHtml(work.title)}">
          <img src="${src}" alt="${escapeHtml(work.title)}" width="${width}" height="${height}" loading="${index < 2 ? "eager" : "lazy"}" decoding="async" style="view-transition-name: photo-${escapeHtml(work.id)}" />
        </a>
        <div class="work-row-copy">
          <p class="work-index">${escapeHtml(issue)}</p>
          <h3>${escapeHtml(work.title)}</h3>
          <p>${escapeHtml(intro)}</p>
          <p class="work-meta">${escapeHtml(meta)} · ${escapeHtml(work.camera || "Camera notes pending")}</p>
          <div class="work-row-actions">
            <a class="row-link" href="${workRoute(work)}">View photograph</a>
            ${deleteButton}
          </div>
        </div>
      </article>`;
    })
    .join("");

  setupWorkObserver();
}

async function requestDeleteWork(id) {
  const work = state.works.find((item) => item.id === id);
  if (!work) return;
  if (work.source === "published") {
    window.alert("Published photographs are removed by editing data/works.json and pushing that change to GitHub.");
    return;
  }

  const confirmed = window.confirm(`Delete "${work.title}" from this archive?`);
  if (!confirmed) return;

  if (elements.dialog.open) elements.dialog.close();
  await deleteWorkRecord(id);

  if (state.objectUrls.has(id)) {
    URL.revokeObjectURL(state.objectUrls.get(id));
    state.objectUrls.delete(id);
  }

  state.works = state.works.filter((item) => item.id !== id);
  if (state.activeWorkId === id) state.activeWorkId = null;
  renderChrome();
  location.hash = categoryRoute(categoryById(work.category));
  renderRoute();
}

function setupWorkObserver() {
  const rows = document.querySelectorAll(".work-row");
  if (!rows.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-active", entry.isIntersecting);
        if (entry.isIntersecting) {
          const work = state.works.find((item) => item.id === entry.target.dataset.workId);
          if (work) elements.archiveAtmosphere.style.backgroundImage = `url("${getImageSrc(work)}")`;
        }
      });
    },
    { threshold: 0.55 },
  );

  rows.forEach((row) => observer.observe(row));
}

function showView(view) {
  elements.views.forEach((item) => {
    item.hidden = item !== view;
  });
}

function transitionTo(renderFn) {
  if (document.startViewTransition) {
    document.startViewTransition(renderFn);
  } else {
    renderFn();
  }
}

function renderDetail(category, work) {
  const src = getImageSrc(work);
  state.activeWorkId = work.id;
  elements.detailBack.href = categoryRoute(category);
  elements.detailAtmosphere.style.backgroundImage = `url("${src}")`;
  elements.detailImage.src = src;
  elements.detailImage.alt = work.title;
  elements.detailImage.width = Number(work.width) || 1200;
  elements.detailImage.height = Number(work.height) || 1500;
  elements.detailImage.style.viewTransitionName = `photo-${work.id}`;
  elements.detailKicker.textContent = `${category.label} / ${String(categoryWorks(category.id).findIndex((item) => item.id === work.id) + 1).padStart(3, "0")}`;
  elements.detailTitle.textContent = work.title;
  elements.detailSubtitle.textContent = work.subtitle || category.subtitle;
  elements.detailDescription.textContent = work.description || "A quiet frame from the archive.";
  elements.detailDelete.hidden = work.source === "published";

  const meta = [
    ["Location", work.location || "Unplaced"],
    ["Date", work.date || "Undated"],
    ["Series", work.series || category.label],
    ["Camera / Format", [work.camera, work.format].filter(Boolean).join(" / ") || "Camera notes pending"],
    ["Category", category.label],
  ];
  elements.detailMeta.innerHTML = meta.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join("");

  if (elements.detailRaw.dataset.url) {
    URL.revokeObjectURL(elements.detailRaw.dataset.url);
    delete elements.detailRaw.dataset.url;
  }

  if (work.rawBlob) {
    const rawUrl = URL.createObjectURL(work.rawBlob);
    elements.detailRaw.href = rawUrl;
    elements.detailRaw.download = work.rawName || `${work.title}.raw`;
    elements.detailRaw.dataset.url = rawUrl;
    elements.detailRaw.hidden = false;
  } else {
    elements.detailRaw.hidden = true;
  }
}

function parseRoute() {
  const hash = location.hash || "#/";
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!parts.length) return { name: "home" };
  if (parts[0] === "studio") return { name: "studio" };
  if (parts[0] === "archive" && parts[1] && parts[2]) return { name: "work", categorySlug: parts[1], workSlug: parts.slice(2).join("/") };
  if (parts[0] === "archive" && parts[1]) return { name: "category", categorySlug: parts[1] };
  return { name: "home" };
}

function renderRoute() {
  const route = parseRoute();
  state.activeWorkId = null;
  document.body.dataset.route = route.name;
  document.body.classList.toggle("admin-mode", isAdminMode());

  if (route.name === "studio") {
    if (!isAdminMode()) {
      location.hash = "#/";
      return;
    }
    showView(elements.studioView);
    return;
  }

  if (route.name === "category") {
    const category = categoryBySlug(route.categorySlug);
    if (!category) {
      location.hash = "#/";
      return;
    }
    showView(elements.categoryView);
    renderWorkScrollList(category);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
    return;
  }

  if (route.name === "work") {
    const category = categoryBySlug(route.categorySlug);
    const work = category ? workBySlug(category.id, route.workSlug) : null;
    if (!category || !work) {
      location.hash = category ? categoryRoute(category) : "#/";
      return;
    }
    showView(elements.detailView);
    renderDetail(category, work);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
    return;
  }

  showView(elements.homeView);
  renderChrome();
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("lace-home-visible"));
      updateKineticScenes();
    });
  });
}

function updateKineticScenes() {
  const scenes = document.querySelectorAll(".kinetic-scene");
  if (!scenes.length) return;

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  scenes.forEach((scene) => {
    const rect = scene.getBoundingClientRect();
    const centerOffset = (rect.top + rect.height / 2 - viewportHeight / 2) / (viewportHeight / 2 + rect.height / 2);
    const y = Math.max(-1, Math.min(1, centerOffset));
    const presence = 1 - Math.min(1, Math.abs(y));
    scene.style.setProperty("--scene-y", y.toFixed(3));
    scene.style.setProperty("--scene-p", presence.toFixed(3));
    scene.style.setProperty("--shift-xs", `${(y * 12).toFixed(2)}px`);
    scene.style.setProperty("--shift-sm", `${(y * 26).toFixed(2)}px`);
    scene.style.setProperty("--shift-md", `${(y * 52).toFixed(2)}px`);
    scene.style.setProperty("--shift-lg", `${(y * 86).toFixed(2)}px`);
    scene.style.setProperty("--shift-xl", `${(y * 128).toFixed(2)}px`);
    scene.style.setProperty("--shift-neg-sm", `${(y * -26).toFixed(2)}px`);
    scene.style.setProperty("--shift-neg-md", `${(y * -52).toFixed(2)}px`);
    scene.style.setProperty("--shift-neg-lg", `${(y * -86).toFixed(2)}px`);
    scene.style.setProperty("--scene-scale", (1 + presence * 0.028).toFixed(4));
    scene.style.setProperty("--scene-wash", (0.72 + presence * 0.28).toFixed(3));
  });
}

function scheduleKineticScenes() {
  if (state.sceneMotionTicking) return;
  state.sceneMotionTicking = true;
  requestAnimationFrame(() => {
    updateKineticScenes();
    state.sceneMotionTicking = false;
  });
}

function bindKineticScenes() {
  window.addEventListener("scroll", scheduleKineticScenes, { passive: true });
  window.addEventListener("resize", scheduleKineticScenes);
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
      location: String(form.get("location")).trim(),
      date: String(form.get("date")).trim(),
      camera: String(form.get("camera")).trim(),
      series: String(form.get("series")).trim(),
      format: image.type || "Uploaded preview",
      imageName: image.name,
      imageType: image.type,
      rawBlob: raw instanceof File && raw.size > 0 ? raw : null,
      rawName: raw instanceof File && raw.size > 0 ? raw.name : "",
      rawType: raw instanceof File && raw.size > 0 ? raw.type : "",
      createdAt: new Date().toISOString(),
      source: "local",
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
    location.hash = categoryRoute(categoryById(category));
    renderRoute();
  });
}

async function openWork(id) {
  const work = state.works.find((item) => item.id === id);
  if (!work) return;

  const category = categoryById(work.category);
  const src = getImageSrc(work);
  const palette = work.palette ?? (await derivePaletteFromSrc(src));
  const width = Number(work.width) || 1200;
  const height = Number(work.height) || 1500;
  state.activeWorkId = id;
  elements.dialog.style.setProperty("--poster-ink", palette[0]);
  elements.dialog.style.setProperty("--poster-accent", palette[1]);
  elements.dialog.style.setProperty("--poster-paper", palette[2]);
  elements.dialog.style.setProperty("--poster-blue", palette[3]);
  elements.dialog.style.setProperty("--work-ratio", `${width} / ${height}`);

  elements.dialogImage.src = src;
  elements.dialogImage.alt = work.title;
  elements.dialogCategory.textContent = category.label;
  elements.dialogTitle.textContent = work.title;
  elements.dialogSubtitle.textContent = work.subtitle || category.subtitle;
  elements.dialogDescription.textContent = work.description || "A quiet frame from the archive.";
  elements.dialogDelete.hidden = work.source === "published";

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
  const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
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
    const sw = Math.max(72, Math.round(rect.width / 5));
    const sh = Math.max(72, Math.round(rect.height / 5));
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
    const cell = rect.width < 700 ? 10 : 13;
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
  elements.detailDelete.addEventListener("click", () => {
    if (state.activeWorkId) requestDeleteWork(state.activeWorkId);
  });
  elements.dialogClose.addEventListener("click", () => elements.dialog.close());
  elements.dialogDelete.addEventListener("click", () => {
    if (state.activeWorkId) requestDeleteWork(state.activeWorkId);
  });
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) elements.dialog.close();
  });
  elements.dialog.addEventListener("close", () => {
    state.activeWorkId = null;
  });
}

function bindRowDeletes() {
  elements.workScrollList.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-delete-work]") : null;
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    requestDeleteWork(button.dataset.deleteWork);
  });
}

function bindTextureToggle() {
  elements.textureToggle.addEventListener("click", () => {
    const isOff = document.body.classList.toggle("texture-off");
    elements.textureToggle.setAttribute("aria-pressed", String(!isOff));
    window.dispatchEvent(new Event("lace-texture-change"));
  });
}

function bindMusicToggle() {
  if (!elements.musicToggle || !BGM_TRACKS.length) return;

  const audio = new Audio();
  audio.preload = "auto";
  audio.volume = 0.36;
  state.music.audio = audio;
  let skipCount = 0;

  function updateMusicButton(isPlaying) {
    elements.musicToggle.classList.toggle("is-playing", isPlaying);
    elements.musicToggle.setAttribute("aria-pressed", String(isPlaying));
    elements.musicToggle.title = isPlaying ? "Pause background music" : "Play background music";
    if (elements.musicToggleLabel) {
      elements.musicToggleLabel.textContent = isPlaying ? "Pause background music" : "Play background music";
    }
  }

  function loadTrack(index) {
    state.music.index = index % BGM_TRACKS.length;
    audio.src = BGM_TRACKS[state.music.index];
    audio.load();
  }

  function advanceTrack() {
    loadTrack((state.music.index + 1) % BGM_TRACKS.length);
  }

  async function playCurrent() {
    state.music.wantsPlayback = true;
    if (!audio.src) loadTrack(state.music.index);
    try {
      await audio.play();
      skipCount = 0;
      updateMusicButton(true);
    } catch (error) {
      state.music.wantsPlayback = false;
      updateMusicButton(false);
      console.warn("Background music could not start.", error);
    }
  }

  function pauseCurrent() {
    state.music.wantsPlayback = false;
    audio.pause();
    updateMusicButton(false);
  }

  elements.musicToggle.addEventListener("click", () => {
    if (state.music.wantsPlayback && !audio.paused) {
      pauseCurrent();
      return;
    }
    playCurrent();
  });

  audio.addEventListener("play", () => updateMusicButton(true));
  audio.addEventListener("pause", () => {
    if (!state.music.wantsPlayback || audio.paused) updateMusicButton(false);
  });
  audio.addEventListener("ended", () => {
    advanceTrack();
    if (state.music.wantsPlayback) playCurrent();
  });
  audio.addEventListener("error", () => {
    if (!state.music.wantsPlayback || skipCount >= BGM_TRACKS.length - 1) {
      state.music.wantsPlayback = false;
      updateMusicButton(false);
      return;
    }
    skipCount += 1;
    advanceTrack();
    playCurrent();
  });

  loadTrack(state.music.index);
  updateMusicButton(false);
}

function bindExportAndReset() {
  elements.exportButton.addEventListener("click", () => {
    const manifest = state.works.map((work) => ({
      id: work.id,
      title: work.title,
      category: work.category,
      subtitle: work.subtitle,
      description: work.description,
      location: work.location ?? "",
      date: work.date ?? "",
      camera: work.camera ?? "",
      series: work.series ?? "",
      format: work.format ?? "",
      imageSrc: work.imageSrc ?? "",
      imageName: work.imageName ?? "generated-newsprint-proof.jpg",
      rawName: work.rawName ?? "",
      width: work.width ?? null,
      height: work.height ?? null,
      source: work.source ?? "",
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
    state.works = state.baseWorks.length ? [...state.baseWorks] : createSeedWorks();
    state.activeCategory = "all";
    state.selectedCategory = "human";
    renderChrome();
    location.hash = "#/";
    renderRoute();
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
      document.documentElement.style.setProperty("--pointer-rotate-x", `${rotateX}deg`);
      document.documentElement.style.setProperty("--pointer-rotate-y", `${rotateY}deg`);
    },
    { passive: true },
  );
}

function setupCameraThread() {
  const threadPath = document.querySelector("#homeThreadLine");
  const layer = document.querySelector(".home-thread-layer");
  const cover = document.querySelector(".cover-line-scene");
  const hero = elements.homeView;
  if (!threadPath || !layer || !cover || !hero) return;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let cameraLength = 0;
  let totalLength = 0;
  let ticking = false;
  let smoothDistance = 0;
  let targetDistance = 0;
  let layoutKey = "";

  function homeScrollDistance() {
    const route = document.body.dataset.route;
    if (route !== "home") return 0;
    const coverRect = cover.getBoundingClientRect();
    const coverCenter = window.scrollY + coverRect.top + coverRect.height * 0.5;
    const triggerScroll = coverCenter - window.innerHeight * 0.5;
    return Math.max(0, window.scrollY - triggerScroll);
  }

  function point(value) {
    return Number(value).toFixed(1);
  }

  function circleCommands(cx, cy, radius) {
    const kappa = radius * 0.55228475;
    return [
      `C ${point(cx - radius)} ${point(cy - kappa)} ${point(cx - kappa)} ${point(cy - radius)} ${point(cx)} ${point(cy - radius)}`,
      `C ${point(cx + kappa)} ${point(cy - radius)} ${point(cx + radius)} ${point(cy - kappa)} ${point(cx + radius)} ${point(cy)}`,
      `C ${point(cx + radius)} ${point(cy + kappa)} ${point(cx + kappa)} ${point(cy + radius)} ${point(cx)} ${point(cy + radius)}`,
      `C ${point(cx - kappa)} ${point(cy + radius)} ${point(cx - radius)} ${point(cy + kappa)} ${point(cx - radius)} ${point(cy)}`,
    ];
  }

  function buildCameraPath(bounds) {
    const cameraWidth = bounds.width;
    const cameraHeight = bounds.height;
    const left = bounds.left;
    const top = bounds.top;
    const bodyLeft = left + cameraWidth * 0.055;
    const bodyRight = left + cameraWidth * 0.84;
    const bodyTop = top + cameraHeight * 0.3;
    const bodyBottom = top + cameraHeight * 0.9;
    const crownTop = top + cameraHeight * 0.08;
    const finderTop = top + cameraHeight * 0.2;
    const lensX = left + cameraWidth * 0.52;
    const lensY = top + cameraHeight * 0.58;
    const lensRadius = Math.min(cameraWidth * 0.21, cameraHeight * 0.34);
    const exit = {
      x: bodyRight + cameraWidth * 0.035,
      y: lensY,
    };
    const commands = [
      `M ${point(bodyLeft)} ${point(bodyBottom)}`,
      `L ${point(bodyLeft)} ${point(bodyTop)}`,
      `Q ${point(bodyLeft)} ${point(bodyTop - cameraHeight * 0.08)} ${point(bodyLeft + cameraWidth * 0.045)} ${point(bodyTop - cameraHeight * 0.08)}`,
      `L ${point(left + cameraWidth * 0.235)} ${point(bodyTop - cameraHeight * 0.08)}`,
      `L ${point(left + cameraWidth * 0.235)} ${point(finderTop)}`,
      `Q ${point(left + cameraWidth * 0.235)} ${point(finderTop - cameraHeight * 0.04)} ${point(left + cameraWidth * 0.275)} ${point(finderTop - cameraHeight * 0.04)}`,
      `L ${point(left + cameraWidth * 0.34)} ${point(finderTop - cameraHeight * 0.04)}`,
      `Q ${point(left + cameraWidth * 0.38)} ${point(finderTop - cameraHeight * 0.04)} ${point(left + cameraWidth * 0.38)} ${point(finderTop)}`,
      `L ${point(left + cameraWidth * 0.38)} ${point(bodyTop - cameraHeight * 0.08)}`,
      `L ${point(left + cameraWidth * 0.445)} ${point(bodyTop - cameraHeight * 0.08)}`,
      `L ${point(left + cameraWidth * 0.49)} ${point(crownTop)}`,
      `L ${point(left + cameraWidth * 0.65)} ${point(crownTop)}`,
      `L ${point(left + cameraWidth * 0.705)} ${point(bodyTop - cameraHeight * 0.08)}`,
      `L ${point(left + cameraWidth * 0.81)} ${point(bodyTop - cameraHeight * 0.08)}`,
      `L ${point(left + cameraWidth * 0.81)} ${point(finderTop)}`,
      `Q ${point(left + cameraWidth * 0.81)} ${point(finderTop - cameraHeight * 0.04)} ${point(left + cameraWidth * 0.86)} ${point(finderTop - cameraHeight * 0.04)}`,
      `L ${point(bodyRight)} ${point(finderTop - cameraHeight * 0.04)}`,
      `Q ${point(bodyRight + cameraWidth * 0.045)} ${point(finderTop - cameraHeight * 0.04)} ${point(bodyRight + cameraWidth * 0.045)} ${point(finderTop + cameraHeight * 0.035)}`,
      `L ${point(bodyRight + cameraWidth * 0.045)} ${point(bodyTop - cameraHeight * 0.08)}`,
      `L ${point(bodyRight)} ${point(bodyTop - cameraHeight * 0.08)}`,
      `Q ${point(bodyRight + cameraWidth * 0.06)} ${point(bodyTop - cameraHeight * 0.08)} ${point(bodyRight + cameraWidth * 0.06)} ${point(bodyTop)}`,
      `L ${point(bodyRight + cameraWidth * 0.06)} ${point(bodyBottom)}`,
      `Q ${point(bodyRight + cameraWidth * 0.06)} ${point(bodyBottom + cameraHeight * 0.04)} ${point(bodyRight)} ${point(bodyBottom + cameraHeight * 0.04)}`,
      `L ${point(bodyLeft)} ${point(bodyBottom + cameraHeight * 0.04)}`,
      `Q ${point(bodyLeft - cameraWidth * 0.03)} ${point(bodyBottom + cameraHeight * 0.04)} ${point(bodyLeft)} ${point(bodyBottom)}`,
      `L ${point(left + cameraWidth * 0.18)} ${point(bodyBottom)}`,
      `L ${point(left + cameraWidth * 0.18)} ${point(top + cameraHeight * 0.55)}`,
      `L ${point(left + cameraWidth * 0.28)} ${point(top + cameraHeight * 0.55)}`,
      `L ${point(left + cameraWidth * 0.28)} ${point(top + cameraHeight * 0.68)}`,
      `L ${point(left + cameraWidth * 0.18)} ${point(top + cameraHeight * 0.68)}`,
      `L ${point(left + cameraWidth * 0.28)} ${point(top + cameraHeight * 0.68)}`,
      `L ${point(lensX - lensRadius)} ${point(lensY)}`,
      ...circleCommands(lensX, lensY, lensRadius),
      `L ${point(lensX - lensRadius * 0.66)} ${point(lensY)}`,
      ...circleCommands(lensX, lensY, lensRadius * 0.66),
      `L ${point(lensX - lensRadius * 0.36)} ${point(lensY)}`,
      ...circleCommands(lensX, lensY, lensRadius * 0.36),
      `L ${point(lensX - lensRadius * 0.14)} ${point(lensY)}`,
      ...circleCommands(lensX, lensY, lensRadius * 0.14),
      `C ${point(lensX + lensRadius * 0.18)} ${point(lensY - lensRadius * 0.16)} ${point(lensX + lensRadius * 0.34)} ${point(lensY + lensRadius * 0.18)} ${point(lensX + lensRadius * 0.05)} ${point(lensY + lensRadius * 0.36)}`,
      `L ${point(left + cameraWidth * 0.77)} ${point(bodyTop + cameraHeight * 0.08)}`,
      `L ${point(left + cameraWidth * 0.9)} ${point(bodyTop + cameraHeight * 0.08)}`,
      `L ${point(left + cameraWidth * 0.9)} ${point(bodyTop + cameraHeight * 0.24)}`,
      `L ${point(left + cameraWidth * 0.77)} ${point(bodyTop + cameraHeight * 0.24)}`,
      `L ${point(left + cameraWidth * 0.77)} ${point(bodyTop + cameraHeight * 0.08)}`,
      `L ${point(left + cameraWidth * 0.9)} ${point(bodyTop + cameraHeight * 0.24)}`,
      `L ${point(left + cameraWidth * 0.81)} ${point(bodyTop + cameraHeight * 0.08)}`,
      `L ${point(exit.x)} ${point(exit.y)}`,
      `C ${point(exit.x + cameraWidth * 0.04)} ${point(exit.y - cameraHeight * 0.075)} ${point(exit.x + cameraWidth * 0.07)} ${point(exit.y + cameraHeight * 0.045)} ${point(exit.x + cameraWidth * 0.025)} ${point(exit.y + cameraHeight * 0.1)}`,
      `C ${point(exit.x - cameraWidth * 0.02)} ${point(exit.y + cameraHeight * 0.145)} ${point(exit.x - cameraWidth * 0.054)} ${point(exit.y + cameraHeight * 0.02)} ${point(exit.x)} ${point(exit.y)}`,
    ];
    return {
      d: commands.join(" "),
      exit,
    };
  }

  function buildThreadCommands(exit, heroWidth, heroHeight) {
    const rightX = heroWidth - Math.max(28, heroWidth * 0.018);
    const endY = Math.max(exit.y + 900, heroHeight - 72);
    const commands = [
      `C ${point(exit.x + 82)} ${point(exit.y - 34)} ${point(rightX - 334)} ${point(exit.y + 18)} ${point(rightX - 212)} ${point(exit.y + 132)}`,
      `C ${point(rightX - 94)} ${point(exit.y + 242)} ${point(rightX + 8)} ${point(exit.y + 78)} ${point(rightX - 118)} ${point(exit.y + 88)}`,
      `C ${point(rightX - 260)} ${point(exit.y + 100)} ${point(rightX - 220)} ${point(exit.y + 314)} ${point(rightX - 56)} ${point(exit.y + 262)}`,
      `C ${point(rightX + 66)} ${point(exit.y + 224)} ${point(rightX + 26)} ${point(exit.y + 426)} ${point(rightX - 92)} ${point(exit.y + 372)}`,
      `C ${point(rightX - 228)} ${point(exit.y + 310)} ${point(rightX - 186)} ${point(exit.y + 540)} ${point(rightX - 10)} ${point(exit.y + 488)}`,
    ];
    let y = exit.y + 488;
    let direction = -1;
    while (y < endY - 230) {
      const nextY = Math.min(y + 390, endY - 230);
      const innerX = rightX - direction * 126;
      const outerX = rightX + direction * 48;
      const crossX = rightX - direction * 62;
      commands.push(
        `C ${point(outerX)} ${point(y + 92)} ${point(innerX)} ${point(y + 112)} ${point(crossX)} ${point(y + 210)}`,
        `C ${point(rightX + direction * 92)} ${point(y + 318)} ${point(rightX + direction * 34)} ${point(y + 40)} ${point(innerX)} ${point(y + 182)}`,
        `C ${point(rightX - direction * 236)} ${point(y + 410)} ${point(rightX + direction * 66)} ${point(nextY - 178)} ${point(rightX - direction * 10)} ${point(nextY)}`,
      );
      y = nextY;
      direction *= -1;
    }
    commands.push(
      `C ${point(rightX - 132)} ${point(endY - 170)} ${point(rightX + 70)} ${point(endY - 96)} ${point(rightX - 38)} ${point(endY - 42)}`,
      `C ${point(rightX - 118)} ${point(endY - 2)} ${point(rightX + 30)} ${point(endY + 42)} ${point(rightX - 92)} ${point(endY)}`,
    );
    return commands.join(" ");
  }

  function rebuildPathIfNeeded() {
    const heroRect = hero.getBoundingClientRect();
    const coverRect = cover.getBoundingClientRect();
    const heroWidth = Math.max(1, hero.offsetWidth);
    const heroHeight = Math.max(window.innerHeight, hero.offsetHeight, hero.scrollHeight);
    const key = [
      heroWidth,
      heroHeight,
      Math.round(coverRect.left - heroRect.left),
      Math.round(coverRect.top - heroRect.top),
      Math.round(coverRect.width),
      Math.round(coverRect.height),
    ].join(":");
    if (key === layoutKey && cameraLength && totalLength) return;

    const coverLeft = coverRect.left - heroRect.left;
    const coverTop = coverRect.top - heroRect.top;
    let cameraWidth = Math.min(820, coverRect.width * 0.72);
    let cameraHeight = cameraWidth * 0.52;
    if (cameraHeight > coverRect.height * 0.62) {
      cameraHeight = coverRect.height * 0.62;
      cameraWidth = cameraHeight / 0.52;
    }
    const cameraBounds = {
      left: coverLeft + (coverRect.width - cameraWidth) / 2,
      top: coverTop + Math.max(coverRect.height * 0.08, (coverRect.height - cameraHeight) * 0.32),
      width: cameraWidth,
      height: cameraHeight,
    };
    const camera = buildCameraPath(cameraBounds);
    const fullPath = `${camera.d} ${buildThreadCommands(camera.exit, heroWidth, heroHeight)}`;

    layer.setAttribute("viewBox", `0 0 ${heroWidth} ${heroHeight}`);
    threadPath.setAttribute("d", camera.d);
    cameraLength = threadPath.getTotalLength();
    threadPath.setAttribute("d", fullPath);
    totalLength = threadPath.getTotalLength();
    layoutKey = key;
  }

  function applyMovingLine(start) {
    const visibleLength = Math.max(0, Math.min(cameraLength, totalLength - start));
    threadPath.style.strokeDasharray = `${visibleLength}px ${totalLength}px`;
    threadPath.style.strokeDashoffset = `${-start}px`;
  }

  function updateThread() {
    ticking = false;
    targetDistance = homeScrollDistance();
    smoothDistance += (targetDistance - smoothDistance) * 0.18;
    rebuildPathIfNeeded();

    if (!cameraLength || !totalLength) return;

    if (reducedMotionQuery.matches) {
      applyMovingLine(0);
      return;
    }

    const start = 8;
    const pulled = Math.max(0, smoothDistance - start);
    const pathStart = Math.min(totalLength, pulled * 2.05);

    applyMovingLine(pathStart);
    document.documentElement.style.setProperty("--thread-progress", Math.min(1, pathStart / totalLength).toFixed(3));

    if (Math.abs(targetDistance - smoothDistance) > 0.45) {
      ticking = true;
      requestAnimationFrame(updateThread);
    }
  }

  function scheduleThread() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateThread);
  }

  function measureThread() {
    layoutKey = "";
    rebuildPathIfNeeded();
    ticking = false;
    updateThread();
  }

  function refreshHomeThread() {
    if (document.body.dataset.route !== "home") return;
    layoutKey = "";
    targetDistance = homeScrollDistance();
    smoothDistance = targetDistance;
    measureThread();
  }

  measureThread();
  window.addEventListener("scroll", scheduleThread, { passive: true });
  window.addEventListener("resize", measureThread);
  window.addEventListener("lace-home-visible", refreshHomeThread);
  if (reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener("change", scheduleThread);
  }
}

function setupLaceCanvas() {
  const canvas = elements.canvas;
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastDraw = 0;
  let animationId = 0;
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function shouldAnimate() {
    return document.body.dataset.route === "home" && !document.body.classList.contains("texture-off") && !reducedMotionQuery.matches;
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw(timestamp = 0) {
    const animated = shouldAnimate();
    if (animated && timestamp - lastDraw < 33) {
      animationId = requestAnimationFrame(draw);
      return;
    }
    lastDraw = timestamp;
    frame += 0.006;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(35, 28, 18, 0.055)";
    ctx.lineWidth = 0.75;

    for (let y = -40; y < height + 40; y += 56) {
      ctx.beginPath();
      for (let x = -40; x < width + 40; x += 34) {
        const pull = Math.max(0, 1 - Math.hypot(x - state.pointer.x * width, y - state.pointer.y * height) / 720);
        const wobble = Math.sin(x * 0.01 + y * 0.015 + frame * 4) * 5;
        const px = x + (state.pointer.x - 0.5) * pull * 22;
        const py = y + wobble + (state.pointer.y - 0.5) * pull * 18;
        if (x === -40) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(35, 28, 18, 0.065)";
    for (let y = 0; y < height; y += 24) {
      for (let x = 0; x < width; x += 24) {
        const distance = Math.hypot(x - state.pointer.x * width, y - state.pointer.y * height);
        const radius = 0.45 + Math.max(0, 1 - distance / 520) * 1.9;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (animated) {
      animationId = requestAnimationFrame(draw);
    } else {
      animationId = 0;
    }
  }

  function scheduleDraw() {
    if (animationId) return;
    animationId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", () => {
    resize();
    scheduleDraw();
  });
  window.addEventListener("hashchange", scheduleDraw);
  window.addEventListener("lace-texture-change", scheduleDraw);
  reducedMotionQuery.addEventListener?.("change", scheduleDraw);
  document.addEventListener("visibilitychange", scheduleDraw);
  scheduleDraw();
}

async function init() {
  bindThemePicker();
  bindUpload();
  bindDialog();
  bindRowDeletes();
  bindTextureToggle();
  bindMusicToggle();
  bindExportAndReset();
  bindKineticScenes();
  bindPointerMotion();
  setupCameraThread();
  setupLaceCanvas();

  const publishedWorks = await loadPublishedWorks();
  state.baseWorks = publishedWorks.length ? publishedWorks : createSeedWorks();
  const savedWorks = await getAllWorks();
  state.works = mergeWorks(savedWorks, state.baseWorks);
  renderChrome();
  window.addEventListener("hashchange", () => transitionTo(renderRoute));
  renderRoute();
}

init().catch((error) => {
  console.error(error);
  elements.departmentList.innerHTML = "<li>Portfolio failed to load. Please refresh the page.</li>";
});
