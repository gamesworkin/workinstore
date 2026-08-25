/* =====================================================================
   Workin'Store | Bônus — app.js
   ---------------------------------------------------------------------
   1) TROQUE AS CREDENCIAIS ABAIXO pelas do seu projeto Firebase.
   2) Firebase Console > Authentication > ative "E-mail/senha" e crie
      MANUALMENTE o usuário admin@admin.com (não há cadastro público).
   3) Realtime Database > Regras sugeridas:

   {
     "rules": {
       "games":    { ".read": true,
                     ".write": "auth != null && auth.token.email === 'admin@admin.com'" },
       "settings": { ".read": true,
                     ".write": "auth != null && auth.token.email === 'admin@admin.com'" }
     }
   }
   ===================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBpoQKy0-dEgsM4cljmwbFgKWxhQkpjDkk",
  authDomain: "bonus2-ec9d5.firebaseapp.com",
  databaseURL: "https://bonus2-ec9d5-default-rtdb.firebaseio.com/",
  projectId: "bonus2-ec9d5",
  storageBucket: "bonus2-ec9d5.firebasestorage.app",
  messagingSenderId: "463777197593",
  appId: "1:463777197593:web:2b8fa4c1c062eb31df4488"
};

const ADMIN_EMAIL = "admin@admin.com";
const PUBLIC_PER_PAGE = 15;   // 15 jogos por página (desktop e mobile)
const PAGE_WINDOW = 5;        // mostra no máximo 5 números de página
const MAX_IMAGE_KB = 220;     // limite do base64 salvo no Realtime Database


/* ============ MODO LEGADO (navegadores antigos / 32 bits) ============ */
(function () {
  var el = document.documentElement;
  var lowMem = (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
  var is32 = /WOW64|Win32|i686|i386/i.test(navigator.userAgent || navigator.platform || "") &&
    !/x64|Win64|x86_64/i.test(navigator.userAgent || "");
  var oldUA = /MSIE |Trident\/|Edge\/1[0-8]\./.test(navigator.userAgent || "");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (lowMem || is32 || oldUA || reduce) {
    if (el.className.indexOf("legacy-mode") === -1) el.className += " legacy-mode";
  }
})();

/* ================= PROTEÇÃO (anti cópia / código-fonte) ================= */
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("dragstart", (e) => { if (e.target.tagName === "IMG" || e.target.tagName === "A") e.preventDefault(); });
document.addEventListener("keydown", (e) => {
  const k = (e.key || "").toLowerCase();
  const blockedCtrl = ["u", "s", "p"];
  const blockedCtrlShift = ["i", "j", "c", "k", "e"];
  if (k === "f12"
    || ((e.ctrlKey || e.metaKey) && e.shiftKey && blockedCtrlShift.includes(k))
    || ((e.ctrlKey || e.metaKey) && blockedCtrl.includes(k))) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
});

/* ================= LINKS OCULTOS ================= */
const _linkVault = new Map();
let _linkSeq = 0;
function cloak(url) {
  if (!url) return "";
  const key = "lk" + (++_linkSeq).toString(36) + Math.random().toString(36).slice(2, 8);
  _linkVault.set(key, String(url));
  return key;
}
function revealLink(key) { return _linkVault.get(key) || ""; }
function openCloaked(key, sameTab) {
  const url = revealLink(key);
  if (!url) return;
  if (sameTab) { location.href = url; return; }
  let w = null;
  try { w = window.open(url, "_blank"); } catch (e) { w = null; }
  if (w) { try { w.opener = null; } catch (e) {} return; }
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 0);
}
/* Carrega imagens sem expor a URL no DOM (usa blob local) */
async function loadHiddenImage(img, url) {
  if (!img) return;
  if (!url) { img.removeAttribute("src"); return; }
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("fail");
    const blob = await res.blob();
    img.src = URL.createObjectURL(blob);
  } catch (e) {
    img.src = url;
  }
}

/* ================= ESTADO ================= */
const state = {
  games: [],
  settings: {},
  menus: [],
  isAdmin: false,
  pubPage: 1,
  admPage: 1,
  admPerPage: 10,
  admQuery: "",
  step: 1,
  menuEditIndex: null,
  activeMenuCategory: "",
};

/* ================= HELPERS ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ============ ROLAGEM SUAVE COM FALLBACK ============ */
var SUPPORTS_SCROLL_OPTIONS = (function () {
  var ok = false;
  try {
    var opts = Object.defineProperty({}, "behavior", { get: function () { ok = true; return "smooth"; } });
    window.addEventListener("testscroll", null, opts);
    window.removeEventListener("testscroll", null, opts);
  } catch (e) { ok = false; }
  return ok && "scrollBehavior" in document.documentElement.style;
})();

function animateScroll(to) {
  var start = window.pageYOffset || document.documentElement.scrollTop || 0;
  var diff = to - start;
  var dur = Math.min(600, Math.max(200, Math.abs(diff) * 0.5));
  var t0 = null;
  function step(ts) {
    if (t0 === null) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur);
    var e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    window.scrollTo(0, start + diff * e);
    if (p < 1) requestAnimationFrame(step);
  }
  if (window.requestAnimationFrame) requestAnimationFrame(step);
  else window.scrollTo(0, to);
}

function smoothScrollTo(top) {
  if (SUPPORTS_SCROLL_OPTIONS) { try { window.scrollTo({ top: top, behavior: "smooth" }); return; } catch (e) {} }
  animateScroll(top);
}

function smoothScrollToEl(el) {
  if (!el) return;
  var rect = el.getBoundingClientRect();
  var top = rect.top + (window.pageYOffset || document.documentElement.scrollTop || 0) - 8;
  smoothScrollTo(top);
}

/* ============ MENU HAMBÚRGUER / RETRÁTIL ============ */
var MENU_BREAKPOINT = 900;

function menuIsCompact() {
  return (window.innerWidth || document.documentElement.clientWidth) <= MENU_BREAKPOINT;
}

function setMenuOpen(open) {
  var bar = document.getElementById("menuBar");
  var btn = document.getElementById("menuToggle");
  if (!bar || !btn) return;
  if (open) bar.className = bar.className.replace(/\s*is-open/g, "") + " is-open";
  else bar.className = bar.className.replace(/\s*is-open/g, "");
  if (open) btn.className = btn.className.replace(/\s*is-open/g, "") + " is-open";
  else btn.className = btn.className.replace(/\s*is-open/g, "");
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
}

function syncMenuMode() {
  var bar = document.getElementById("menuBar");
  var btn = document.getElementById("menuToggle");
  if (!bar || !btn) return;
  var hasItems = !!bar.querySelector(".menu-link");
  var compact = menuIsCompact();

  btn.classList.toggle("is-available", hasItems);
  bar.classList.toggle("is-collapsible", compact && hasItems);
  bar.classList.toggle("hidden", !hasItems);

  if (!compact || !hasItems) setMenuOpen(false);
}

document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("menuToggle");
  if (btn) {
    btn.addEventListener("click", function () {
      var bar = document.getElementById("menuBar");
      var open = bar && bar.className.indexOf("is-open") === -1;
      setMenuOpen(!!open);
    });
  }
  syncMenuMode();
});

var _menuResizeTimer = null;
window.addEventListener("resize", function () {
  if (_menuResizeTimer) clearTimeout(_menuResizeTimer);
  _menuResizeTimer = setTimeout(syncMenuMode, 120);
});
window.addEventListener("orientationchange", function () { setTimeout(syncMenuMode, 200); });
const esc = (v) =>
  String(v == null ? "" : v).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
const norm = (v) =>
  String(v == null ? "" : v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

function openModal(id) { $(id).hidden = false; document.body.style.overflow = "hidden"; }
function closeModal(el) {
  el.hidden = true;
  const anyOpen = $$(".modal-backdrop").some((m) => !m.hidden);
  document.body.style.overflow = anyOpen ? "hidden" : "";
}

$$(".modal-backdrop").forEach((bd) => {
  bd.addEventListener("click", (e) => { if (e.target === bd) closeModal(bd); });
  bd.querySelectorAll("[data-close]").forEach((b) =>
    b.addEventListener("click", () => closeModal(bd))
  );
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") $$(".modal-backdrop").forEach((b) => { if (!b.hidden) closeModal(b); });
});

/* tamanho em MB a partir dos campos salvos */
function sizeInMb(g) {
  if (typeof g.sizeMb === "number" && !isNaN(g.sizeMb)) return g.sizeMb;
  const m = String(g.size || "").match(/([\d.,]+)\s*(gb|mb|kb)?/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  if (isNaN(n)) return null;
  const u = (m[2] || "gb").toLowerCase();
  return u === "gb" ? n * 1024 : u === "kb" ? n / 1024 : n;
}
function sizeLabel(g) {
  if (g.size) return g.size;
  const mb = sizeInMb(g);
  if (mb == null) return "";
  return mb >= 1024 ? `${(mb / 1024).toFixed(mb % 1024 ? 1 : 0)} GB` : `${Math.round(mb)} MB`;
}

/* ================= TEMA ================= */
const DEFAULT_THEME = {
  defaultTheme: "dark",
  allowToggle: true,
  font: '"Segoe UI", system-ui, -apple-system, sans-serif',
  radius: 14,
  dark:  { bg: "#0a0c12", surface: "#151a27", border: "#262d3d", text: "#eef2ff", primary: "#17e6a1", accent: "#7c5cff" },
  light: { bg: "#f5f7fb", surface: "#ffffff", border: "#dfe4ee", text: "#131722", primary: "#0aa87a", accent: "#5b3ff0" },
};

function mixHex(hex, other, amount) {
  const p = (h) => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const [r1, g1, b1] = p(hex), [r2, g2, b2] = p(other);
  const c = (a, b) => Math.round(a + (b - a) * amount).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}
function inkFor(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#08121a" : "#ffffff";
}

function applyTheme() {
  const t = { ...DEFAULT_THEME, ...(state.settings.theme || {}) };
  t.dark = { ...DEFAULT_THEME.dark, ...(t.dark || {}) };
  t.light = { ...DEFAULT_THEME.light, ...(t.light || {}) };

  const saved = localStorage.getItem("gv-theme");
  const mode = t.allowToggle === false ? (t.defaultTheme || "dark") : (saved || t.defaultTheme || "dark");
  document.documentElement.dataset.theme = mode;
  $("#themeBtn").classList.toggle("hidden", t.allowToggle === false);

  const c = mode === "light" ? t.light : t.dark;
  const isLight = mode === "light";
  const r = document.documentElement.style;
  r.setProperty("--bg", c.bg);
  r.setProperty("--bg-2", mixHex(c.bg, isLight ? "#ffffff" : "#ffffff", isLight ? 1 : 0.04));
  r.setProperty("--surface", c.surface);
  r.setProperty("--surface-2", mixHex(c.surface, isLight ? "#000000" : "#ffffff", 0.06));
  r.setProperty("--border", c.border);
  r.setProperty("--text", c.text);
  r.setProperty("--muted", mixHex(c.text, c.bg, 0.45));
  r.setProperty("--primary", c.primary);
  r.setProperty("--primary-ink", inkFor(c.primary));
  r.setProperty("--accent", c.accent);
  r.setProperty("--font", t.font || DEFAULT_THEME.font);
  r.setProperty("--radius", (t.radius == null ? 14 : t.radius) + "px");
  return t;
}

$("#themeBtn").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("gv-theme", next);
  applyTheme();
});

$("#year").textContent = new Date().getFullYear();

/* ================= FIREBASE ================= */
let db = null, auth = null, firebaseReady = false;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  auth = firebase.auth();
  firebaseReady = true;
} catch (err) {
  console.warn("Firebase não inicializado — verifique as credenciais no topo de app.js.", err);
}

/* =====================================================================
   CAMPOS DE IMAGEM: link externo OU upload convertido em base64
   ===================================================================== */
function compressToBase64(file, maxDim = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.onload = () => {
      const raw = reader.result;
      if (file.type === "image/svg+xml") return resolve(raw);
      const img = new Image();
      img.onerror = () => reject(new Error("Imagem inválida."));
      img.onload = () => {
        let { width: w, height: h } = img;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        const hasAlpha = file.type === "image/png";
        let out = cv.toDataURL(hasAlpha ? "image/png" : "image/jpeg", quality);
        let q = quality;
        while (out.length / 1024 > MAX_IMAGE_KB && q > 0.35) {
          q -= 0.12;
          out = cv.toDataURL("image/jpeg", q);
        }
        resolve(out);
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}

function setupImageField(root) {
  const urlInput = $(".img-url", root);
  const fileWrap = $(".img-file-wrap", root);
  const fileInput = $(".img-file", root);
  const preview = $(".img-preview img", root);
  const sizeInfo = $(".img-size", root);
  const chips = $$(".chip", root);
  root._value = "";

  const paint = (v) => {
    root._value = v || "";
    if (v) { preview.src = v; preview.hidden = false; }
    else { preview.removeAttribute("src"); preview.hidden = true; }
    sizeInfo.textContent = v && v.startsWith("data:")
      ? `Base64 · ~${Math.round(v.length / 1024)} KB`
      : (v ? "Link externo" : "Nenhuma imagem");
  };

  const setMode = (mode) => {
    chips.forEach((c) => c.classList.toggle("active", c.dataset.src === mode));
    urlInput.classList.toggle("hidden", mode !== "url");
    fileWrap.classList.toggle("hidden", mode !== "upload");
  };

  chips.forEach((c) => c.addEventListener("click", () => setMode(c.dataset.src)));
  urlInput.addEventListener("input", () => paint(urlInput.value.trim()));

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      sizeInfo.textContent = "Convertendo...";
      const b64 = await compressToBase64(file);
      if (b64.length / 1024 > MAX_IMAGE_KB * 1.6) {
        toast("Imagem muito pesada, escolha uma menor.");
        sizeInfo.textContent = "Imagem muito pesada.";
        return;
      }
      urlInput.value = "";
      paint(b64);
      toast("Imagem convertida para base64.");
    } catch (ex) {
      sizeInfo.textContent = ex.message;
    } finally {
      e.target.value = "";
    }
  });

  root.getValue = () => root._value;
  root.setValue = (v) => {
    v = v || "";
    if (v.startsWith("data:")) { setMode("upload"); urlInput.value = ""; }
    else { setMode("url"); urlInput.value = v; }
    paint(v);
  };
  root.setValue("");
  return root;
}

const imgFields = {};
$$(".imgfield").forEach((f) => { imgFields[f.dataset.img] = setupImageField(f); });

/* =====================================================================
   BUSCA + FILTROS + RENDER PÚBLICO
   ===================================================================== */
function searchBlob(g) {
  return norm([
    g.title, g.code, g.category, g.platform, g.year, g.description,
    g.requirements, sizeLabel(g), (g.tags || []).join(" "),
  ].filter(Boolean).join(" "));
}

function visibleGames() {
  const terms = norm($("#searchInput").value).split(/\s+/).filter(Boolean);
  const cat = $("#categoryFilter").value || state.activeMenuCategory;
  const plat = $("#platformFilter").value;
  const tag = $("#tagFilter").value;
  const year = $("#yearFilter").value;
  const sizeRange = $("#sizeFilter").value;
  const sort = $("#sortFilter").value;

  let list = state.games.filter((g) => g.published !== false);

  if (cat) list = list.filter((g) => norm(g.category) === norm(cat));
  if (plat) list = list.filter((g) => norm(g.platform).includes(norm(plat)));
  if (tag) list = list.filter((g) => (g.tags || []).some((t) => norm(t) === norm(tag)));
  if (year) list = list.filter((g) => String(g.year || "") === year);
  if (sizeRange) {
    const [min, max] = sizeRange.split("-").map(Number);
    list = list.filter((g) => { const mb = sizeInMb(g); return mb != null && mb >= min && mb < max; });
  }
  if (terms.length) {
    list = list.filter((g) => { const blob = searchBlob(g); return terms.every((t) => blob.includes(t)); });
  }

  const byTitle = (a, b) => (a.title || "").localeCompare(b.title || "", "pt-BR");
  const s = { az: byTitle, za: (a, b) => byTitle(b, a) }[sort];
  if (s) list.sort(s);
  else if (sort === "size-asc") list.sort((a, b) => (sizeInMb(a) == null ? Infinity : sizeInMb(a)) - (sizeInMb(b) == null ? Infinity : sizeInMb(b)));
  else if (sort === "size-desc") list.sort((a, b) => (sizeInMb(b) == null ? -1 : sizeInMb(b)) - (sizeInMb(a) == null ? -1 : sizeInMb(a)));
  else if (sort === "year-desc") list.sort((a, b) => (b.year || 0) - (a.year || 0));
  else if (sort === "year-asc") list.sort((a, b) => (a.year || 9999) - (b.year || 9999));
  else if (sort === "rating-desc") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (sort === "recent") list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return list;
}

function renderFilterOptions() {
  const fill = (sel, values, allLabel) => {
    const cur = sel.value;
    sel.innerHTML = `<option value="">${allLabel}</option>` +
      values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    if (values.map(String).includes(cur)) sel.value = cur;
  };
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];

  const cats = uniq(state.games.map((g) => g.category)).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const plats = uniq(state.games.flatMap((g) => String(g.platform || "").split(/[,/]/).map((p) => p.trim())))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  const tags = uniq(state.games.flatMap((g) => g.tags || [])).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const years = uniq(state.games.map((g) => g.year)).sort((a, b) => b - a);

  fill($("#categoryFilter"), cats, "Todas");
  fill($("#platformFilter"), plats, "Todas");
  fill($("#tagFilter"), tags, "Todas");
  fill($("#yearFilter"), years, "Todos");

  $("#catList").innerHTML = cats.map((c) => `<option value="${esc(c)}">`).join("");
  $("#platList").innerHTML = plats.map((c) => `<option value="${esc(c)}">`).join("");
}

function renderPager(pages) {
  const pager = $("#publicPager");
  pager.classList.toggle("hidden", pages <= 1);
  if (pages <= 1) return;

  let start = Math.max(1, state.pubPage - Math.floor(PAGE_WINDOW / 2));
  let end = Math.min(pages, start + PAGE_WINDOW - 1);
  start = Math.max(1, end - PAGE_WINDOW + 1);

  const nums = [];
  for (let i = start; i <= end; i++) {
    nums.push(`<button class="page-btn ${i === state.pubPage ? "active" : ""}" data-page="${i}">${i}</button>`);
  }
  $("#pageNumbers").innerHTML = nums.join("");
  $$("#pageNumbers .page-btn").forEach((b) =>
    b.addEventListener("click", () => goToPage(+b.dataset.page))
  );

  const many = pages > PAGE_WINDOW;
  $("[data-pub-first]").classList.toggle("hidden", !many);
  $("[data-pub-last]").classList.toggle("hidden", !many);
  $("[data-pub-first]").disabled = state.pubPage === 1;
  $("[data-pub-prev]").disabled = state.pubPage <= 1;
  $("[data-pub-next]").disabled = state.pubPage >= pages;
  $("[data-pub-last]").disabled = state.pubPage === pages;
  pager.dataset.pages = pages;
}

function goToPage(n) {
  const pages = +$("#publicPager").dataset.pages || 1;
  state.pubPage = Math.min(pages, Math.max(1, n));
  renderGames();
  smoothScrollTo(0);
}

function renderGames() {
  const list = visibleGames();
  const pages = Math.max(1, Math.ceil(list.length / PUBLIC_PER_PAGE));
  if (state.pubPage > pages) state.pubPage = pages;
  const slice = list.slice((state.pubPage - 1) * PUBLIC_PER_PAGE, state.pubPage * PUBLIC_PER_PAGE);

  $("#gamesGrid").innerHTML = slice
    .map((g) => `
    <div class="card" role="button" tabindex="0" data-id="${esc(g.id)}">
      <div class="card-cover">
        ${g.cover ? `<img data-cover="${esc(cloak(g.cover))}" alt="${esc(g.title)}" loading="lazy" />` : ""}
        ${g.category ? `<span class="card-badge">${esc(g.category)}</span>` : ""}
        ${g.rating ? `<span class="card-rating">${esc(g.rating)}</span>` : ""}
      </div>
      <div class="card-info">
        <p class="card-title" title="${esc(g.title)}">${esc(g.title)}</p>
        <span class="card-sub">${[g.year, g.platform, sizeLabel(g)].filter(Boolean).map(esc).join(" · ") || "Detalhes"}</span>
        <button type="button" class="card-dl" data-more="1" aria-label="Saiba mais sobre ${esc(g.title)}"><span class="card-dl-icon">ℹ</span><span class="card-dl-text">Saiba mais...</span></button>
      </div>
    </div>`)
    .join("");

  $$("#gamesGrid .card").forEach((c) => {
    c.addEventListener("click", (e) => {
      if (e.target.closest(".card-dl")) return;
      openGame(c.dataset.id);
    });
    c.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (e.target.closest(".card-dl")) return;
        e.preventDefault();
        openGame(c.dataset.id);
      }
    });
  });

  $$("#gamesGrid [data-cover]").forEach((img) => loadHiddenImage(img, revealLink(img.dataset.cover)));

  $$("#gamesGrid .card-dl").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const card = a.closest(".card");
      a.classList.remove("is-clicked");
      void a.offsetWidth;
      a.classList.add("is-clicked");
      setTimeout(() => a.classList.remove("is-clicked"), 650);
      if (card) openGame(card.dataset.id);
    });
  });

  const modalDl = $("#gmDownload");
  if (modalDl && !modalDl.dataset.animBound) {
    modalDl.dataset.animBound = "1";
    modalDl.addEventListener("click", (e) => {
      e.stopPropagation();
      openCloaked(modalDl.dataset.dl, modalDl.dataset.blank === "0");
      modalDl.classList.remove("is-clicked");
      void modalDl.offsetWidth;
      modalDl.classList.add("is-clicked");
      setTimeout(() => modalDl.classList.remove("is-clicked"), 650);
    });
  }

  $("#emptyState").classList.toggle("hidden", list.length > 0);
  $("#resultInfo").textContent = list.length
    ? `${list.length} jogo(s) encontrado(s) · página ${state.pubPage} de ${pages}`
    : "";
  renderPager(pages);
}

$("[data-pub-first]").addEventListener("click", () => goToPage(1));
$("[data-pub-prev]").addEventListener("click", () => goToPage(state.pubPage - 1));
$("[data-pub-next]").addEventListener("click", () => goToPage(state.pubPage + 1));
$("[data-pub-last]").addEventListener("click", () => goToPage(+$("#publicPager").dataset.pages || 1));

$("#searchInput").addEventListener("input", () => { state.pubPage = 1; renderGames(); });
["#categoryFilter", "#platformFilter", "#tagFilter", "#yearFilter", "#sizeFilter", "#sortFilter"].forEach((id) =>
  $(id).addEventListener("change", () => { state.pubPage = 1; state.activeMenuCategory = ""; renderGames(); })
);
$("#filtersBtn").addEventListener("click", () => $("#filtersPanel").classList.toggle("hidden"));
$("#clearFilters").addEventListener("click", () => {
  ["#categoryFilter", "#platformFilter", "#tagFilter", "#yearFilter", "#sizeFilter"].forEach((id) => ($(id).value = ""));
  $("#sortFilter").value = "az";
  $("#searchInput").value = "";
  state.activeMenuCategory = "";
  $$("#menuBarInner .menu-link").forEach((x) => x.classList.remove("active"));
  state.pubPage = 1;
  renderGames();
});

/* Detecta pela resolucao da imagem se a capa e quadrada (CD) ou retangular (DVD) */
function applyCoverShape(img) {
  if (!img) return;
  const box = img.parentElement;
  if (!box) return;
  const decide = () => {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return;
    const ratio = w / h;
    if (ratio > 0.85) box.classList.add("is-cd");
    else box.classList.remove("is-cd");
  };
  box.classList.remove("is-cd");
  if (img.complete && img.naturalWidth) decide();
  img.onload = decide;
}

/* ================= MODAL DO JOGO ================= */
function openGame(id) {
  const g = state.games.find((x) => x.id === id);
  if (!g) return;
  const cover = $("#gmCover");
  if (g.cover) { applyCoverShape(cover); loadHiddenImage(cover, g.cover); cover.alt = g.title || ""; cover.parentElement.hidden = false; }
  else cover.parentElement.hidden = true;

  $("#gmTitle").textContent = g.title || "Sem título";
  $("#gmMeta").textContent = [g.category, g.year, g.platform].filter(Boolean).join(" · ");
  $("#gmTags").innerHTML = (g.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  $("#gmDesc").textContent = g.description || "";

  const specs = [
    ["Código", g.code],
    ["Tamanho", sizeLabel(g)],
    ["Nota", g.rating],
    ["Requisitos", g.requirements],
  ].filter(([, v]) => v);
  $("#gmSpecs").innerHTML = specs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");

  const dl = $("#gmDownload");
  if (g.download) {
    dl.dataset.dl = cloak(g.download);
    dl.dataset.blank = g.downloadBlank === false ? "0" : "1";
    dl.classList.remove("hidden");
  }
  else dl.classList.add("hidden");

  openModal("#gameModal");
}

/* ================= MENUS DO TOPO ================= */
function renderMenuBar() {
  const menus = state.menus || [];
  $("#menuBar").classList.toggle("hidden", menus.length === 0);
  $("#menuBarInner").innerHTML = menus
    .map((m, i) => `<button type="button" class="menu-link" data-menu="${i}" data-href="${esc(cloak(m.url || ""))}">${esc(m.label)}</button>`)
    .join("");

  syncMenuMode();

  $$("#menuBarInner .menu-link").forEach((a) =>
    a.addEventListener("click", (e) => {
      const m = menus[+a.dataset.menu];
      if (!m) return;
      if (menuIsCompact()) setMenuOpen(false);
      if (m.category) {
        e.preventDefault();
        $$("#menuBarInner .menu-link").forEach((x) => x.classList.remove("active"));
        a.classList.add("active");
        $("#categoryFilter").value = "";
        state.activeMenuCategory = m.category;
        state.pubPage = 1;
        renderGames();
        smoothScrollToEl($("#gamesGrid"));
        return;
      }
      const url = revealLink(a.dataset.href);
      if (!url) return;
      if (url.startsWith("#")) {
        const el = document.querySelector(url);
        if (el) smoothScrollToEl(el);
        return;
      }
      openCloaked(a.dataset.href, !m.blank);
    })
  );
}

function renderMenuAdmin() {
  const menus = state.menus || [];
  $("#menuList").innerHTML = menus.length
    ? menus.map((m, i) => `
      <div class="admin-item">
        <div class="ai-main">
          <div class="ai-title">${esc(m.label)}</div>
          <div class="ai-sub">${esc(m.url || "")}${m.category ? " · categoria: " + esc(m.category) : ""}${m.blank ? " · nova aba" : ""}</div>
        </div>
        <button class="btn btn-ghost" data-mup="${i}" title="Subir">↑</button>
        <button class="btn btn-ghost" data-mdown="${i}" title="Descer">↓</button>
        <button class="btn btn-ghost" data-medit="${i}">Editar</button>
        <button class="btn btn-danger" data-mdel="${i}">Excluir</button>
      </div>`).join("")
    : `<p class="muted small">Nenhum menu cadastrado.</p>`;

  const save = async (arr) => {
    if (!state.isAdmin) return toast("Somente admin.");
    try {
      await db.ref("settings/menus").set(arr);
      toast("Menus atualizados.");
    } catch (ex) {
      toast("Erro ao salvar menus: " + writeError(ex));
    }
  };
  $$("#menuList [data-mup]").forEach((b) => b.addEventListener("click", () => {
    const i = +b.dataset.mup; if (i === 0) return;
    const a = [...menus]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; save(a);
  }));
  $$("#menuList [data-mdown]").forEach((b) => b.addEventListener("click", () => {
    const i = +b.dataset.mdown; if (i >= menus.length - 1) return;
    const a = [...menus]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; save(a);
  }));
  $$("#menuList [data-medit]").forEach((b) => b.addEventListener("click", () => {
    const i = +b.dataset.medit, m = menus[i];
    state.menuEditIndex = i;
    $("#mLabel").value = m.label || "";
    $("#mUrl").value = m.url || "";
    $("#mCategory").value = m.category || "";
    $("#mBlank").checked = !!m.blank;
    $("#menuSave").textContent = "Salvar alterações";
  }));
  $$("#menuList [data-mdel]").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Excluir este menu?")) return;
    save(menus.filter((_, i) => i !== +b.dataset.mdel));
  }));
}

$("#menuForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.isAdmin) return toast("Somente admin.");
  const item = {
    label: $("#mLabel").value.trim(),
    url: $("#mUrl").value.trim() || "#",
    category: $("#mCategory").value.trim(),
    blank: $("#mBlank").checked,
  };
  if (!item.label) return toast("Informe o nome do menu.");
  const arr = [...(state.menus || [])];
  if (state.menuEditIndex != null) arr[state.menuEditIndex] = item;
  else arr.push(item);
  try {
    await db.ref("settings/menus").set(arr);
    toast(state.menuEditIndex != null ? "Menu atualizado!" : "Menu adicionado!");
    resetMenuForm();
  } catch (ex) {
    toast("Erro ao salvar menu: " + writeError(ex));
  }
});
function resetMenuForm() {
  state.menuEditIndex = null;
  $("#menuForm").reset();
  $("#menuSave").textContent = "Adicionar menu";
}
$("#menuCancel").addEventListener("click", resetMenuForm);

/* ================= IDENTIDADE + AJUDA ================= */
function renderSettings() {
  const s = state.settings || {};
  state.menus = Array.isArray(s.menus) ? s.menus : Object.values(s.menus || {});
  applyTheme();

  const sq = $("#logoSquare"), wd = $("#logoWord"), fb = $("#brandFallback");
  if (s.logoSquare) { loadHiddenImage(sq, s.logoSquare); sq.hidden = false; } else sq.hidden = true;
  if (s.logoWord) { loadHiddenImage(wd, s.logoWord); wd.hidden = false; } else wd.hidden = true;
  fb.textContent = s.siteName || "Workin'Store | Bônus";
  fb.hidden = !!s.logoWord;

  if (s.favicon) {
    if (s.favicon.startsWith("data:")) $("#faviconTag").href = s.favicon;
    else fetch(s.favicon, { mode: "cors" })
      .then((r) => r.blob())
      .then((b) => { $("#faviconTag").href = URL.createObjectURL(b); })
      .catch(() => { $("#faviconTag").href = s.favicon; });
  }

  $("#heroTitle").textContent = s.heroTitle || "Sua biblioteca de jogos";
  $("#heroSubtitle").textContent = s.heroSubtitle || "Clique em um jogo para ver detalhes e baixar.";
  $("#footerText").textContent = s.footerText || `© ${new Date().getFullYear()} ${s.siteName || "Workin'Store | Bônus"}`;
  document.title = (s.siteName || "Workin'Store | Bônus") + " — Biblioteca de Jogos";

  const help = s.help || "Navegue pelos jogos na página inicial.\nUse a busca por título, plataforma ou código único.\nClique em um card para ver as informações completas.";
  $("#helpContent").innerHTML = help.split("\n").filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("");

  // formulários do admin
  imgFields.logoSquare.setValue(s.logoSquare || "");
  imgFields.logoWord.setValue(s.logoWord || "");
  imgFields.favicon.setValue(s.favicon || "");
  $("#bSiteName").value = s.siteName || "";
  $("#bHeroTitle").value = s.heroTitle || "";
  $("#bHeroSubtitle").value = s.heroSubtitle || "";
  $("#bFooter").value = s.footerText || "";
  $("#hContent").value = s.help || "";

  const t = { ...DEFAULT_THEME, ...(s.theme || {}) };
  t.dark = { ...DEFAULT_THEME.dark, ...(t.dark || {}) };
  t.light = { ...DEFAULT_THEME.light, ...(t.light || {}) };
  $("#tDefault").value = t.defaultTheme;
  $("#tAllowToggle").checked = t.allowToggle !== false;
  $("#tFont").value = t.font;
  $("#tRadius").value = t.radius;
  ["bg", "surface", "border", "text", "primary", "accent"].forEach((k) => {
    $("#td" + k[0].toUpperCase() + k.slice(1)).value = t.dark[k];
    $("#tl" + k[0].toUpperCase() + k.slice(1)).value = t.light[k];
  });

  renderMenuBar();
  renderMenuAdmin();
}

$("#helpBtn").addEventListener("click", () => openModal("#helpModal"));

/* ================= AUTH ================= */
$("#discreetLoginBtn").addEventListener("click", () => {
  if (state.isAdmin) openModal("#adminModal");
  else { openModal("#loginModal"); setTimeout(() => $("#loginEmail").focus(), 60); }
});
$("#adminPanelBtn").addEventListener("click", () => openModal("#adminModal"));

// Enter no e-mail pula para a senha; Enter na senha envia
$("#loginEmail").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); $("#loginPass").focus(); }
});
$("#loginPass").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); $("#loginForm").requestSubmit(); }
});

function setLoginLoading(on) {
  const btn = $("#loginSubmit");
  btn.classList.toggle("is-loading", on);
  btn.disabled = on;
  $(".spinner", btn).hidden = !on;
  $(".btn-label", btn).textContent = on ? "Entrando..." : "Entrar";
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#loginError");
  err.classList.add("hidden");
  if (!firebaseReady) { err.textContent = "Firebase não configurado. Preencha as credenciais em app.js."; err.classList.remove("hidden"); return; }
  const email = $("#loginEmail").value.trim().toLowerCase();
  if (email !== ADMIN_EMAIL) { err.textContent = "Acesso permitido somente ao administrador."; err.classList.remove("hidden"); return; }
  setLoginLoading(true);
  try {
    await auth.signInWithEmailAndPassword(email, $("#loginPass").value);
    closeModal($("#loginModal"));
    $("#loginForm").reset();
    toast("Bem-vindo, admin!");
    openModal("#adminModal");
  } catch (ex) {
    err.textContent = "E-mail ou senha inválidos.";
    err.classList.remove("hidden");
  } finally {
    setLoginLoading(false);
  }
});

$("#logoutBtn").addEventListener("click", async () => {
  if (auth) await auth.signOut();
  toast("Sessão encerrada.");
});

function applyAdminUI() {
  $("#adminPanelBtn").classList.toggle("hidden", !state.isAdmin);
  $("#logoutBtn").classList.toggle("hidden", !state.isAdmin);
  if (!state.isAdmin) closeModal($("#adminModal"));
}

if (firebaseReady) {
  auth.onAuthStateChanged((user) => {
    state.isAdmin = !!user && (user.email || "").toLowerCase() === ADMIN_EMAIL;
    applyAdminUI();
    renderAdminList();
  });
}

/* ================= TABS DO PAINEL ================= */
$$(".tab").forEach((t) =>
  t.addEventListener("click", () => {
    $$(".tab").forEach((x) => x.classList.remove("active"));
    $$(".tabpanel").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    $("#" + t.dataset.tab).classList.add("active");
  })
);

/* ================= CADASTRO EM 3 ETAPAS ================= */
const TOTAL_STEPS = 3;
function showStep(n) {
  state.step = Math.min(TOTAL_STEPS, Math.max(1, n));
  $$(".form-step").forEach((f) => f.classList.toggle("active", +f.dataset.step === state.step));
  $$("#formSteps .step").forEach((s) => s.classList.toggle("active", +s.dataset.step === state.step));
  $("#stepPrev").disabled = state.step === 1;
  $("#stepNext").classList.toggle("hidden", state.step === TOTAL_STEPS);
  $("#formSave").classList.toggle("hidden", state.step !== TOTAL_STEPS);
}
$("#stepPrev").addEventListener("click", () => showStep(state.step - 1));
$("#stepNext").addEventListener("click", () => {
  if (state.step === 1 && !$("#fTitle").value.trim()) { formError("Informe o título do jogo."); return; }
  formError("");
  showStep(state.step + 1);
});
$$("#formSteps .step").forEach((s) => s.addEventListener("click", () => showStep(+s.dataset.step)));

function writeError(ex) {
  const m = String((ex && ex.message) || ex || "");
  if (/permission[_ ]denied/i.test(m)) {
    return "Permissão negada pelo Firebase. Entre como " + ADMIN_EMAIL +
      " e confira as regras do Realtime Database (games/settings com .write para esse e-mail).";
  }
  return m || "Erro desconhecido.";
}

function formError(msg) {
  const el = $("#formError");
  el.textContent = msg;
  el.classList.toggle("hidden", !msg);
}

function nextCode() {
  const nums = state.games
    .map((g) => String(g.code || "").match(/(\d+)\s*$/))
    .filter(Boolean).map((m) => +m[1]);
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return "GV-" + String(n).padStart(4, "0");
}

function resetForm() {
  $("#gameForm").reset();
  $("#gameId").value = "";
  $("#fPublished").checked = true;
  $("#fDownloadBlank").checked = true;
  $("#fSizeUnit").value = "GB";
  $("#fCode").value = nextCode();
  imgFields.cover.setValue("");
  formError("");
  showStep(1);
}
$("#formReset").addEventListener("click", resetForm);

function collectForm() {
  const val = parseFloat($("#fSizeValue").value);
  const unit = $("#fSizeUnit").value;
  const hasSize = !isNaN(val);
  return {
    title: $("#fTitle").value.trim(),
    code: $("#fCode").value.trim(),
    category: $("#fCategory").value.trim(),
    cover: imgFields.cover.getValue(),
    description: $("#fDesc").value.trim(),
    year: $("#fYear").value ? Number($("#fYear").value) : null,
    sizeMb: hasSize ? (unit === "GB" ? val * 1024 : val) : null,
    size: hasSize ? `${val} ${unit}` : "",
    platform: $("#fPlatform").value.trim(),
    rating: $("#fRating").value ? Number($("#fRating").value) : null,
    tags: $("#fTags").value.split(",").map((t) => t.trim()).filter(Boolean),
    download: $("#fDownload").value.trim(),
    downloadBlank: $("#fDownloadBlank").checked,
    requirements: $("#fReq").value.trim(),
    published: $("#fPublished").checked,
  };
}

function fillForm(g) {
  $("#gameId").value = g.id;
  $("#fTitle").value = g.title || "";
  $("#fCode").value = g.code || "";
  $("#fCategory").value = g.category || "";
  imgFields.cover.setValue(g.cover || "");
  $("#fDesc").value = g.description || "";
  $("#fYear").value = g.year || "";
  const mb = sizeInMb(g);
  if (mb != null && mb >= 1024) { $("#fSizeValue").value = +(mb / 1024).toFixed(2); $("#fSizeUnit").value = "GB"; }
  else if (mb != null) { $("#fSizeValue").value = Math.round(mb); $("#fSizeUnit").value = "MB"; }
  else { $("#fSizeValue").value = ""; $("#fSizeUnit").value = "GB"; }
  $("#fPlatform").value = g.platform || "";
  $("#fRating").value = (g.rating == null ? "" : g.rating);
  $("#fTags").value = (g.tags || []).join(", ");
  $("#fDownload").value = g.download || "";
  $("#fDownloadBlank").checked = g.downloadBlank !== false;
  $("#fReq").value = g.requirements || "";
  $("#fPublished").checked = g.published !== false;
  formError("");
  showStep(1);
  $$(".tab").forEach((x) => x.classList.remove("active"));
  $$(".tabpanel").forEach((x) => x.classList.remove("active"));
  $('.tab[data-tab="tab-new"]').classList.add("active");
  $("#tab-new").classList.add("active");
}

$("#gameForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.isAdmin) { formError("Somente o administrador pode salvar."); return; }
  const data = collectForm();
  const id = $("#gameId").value;
  if (!data.title) { formError("Título é obrigatório."); showStep(1); return; }
  if (!data.code) { formError("Código único é obrigatório."); showStep(1); return; }
  if (state.games.some((g) => g.id !== id && norm(g.code) === norm(data.code))) {
    formError("Já existe um jogo com este código único."); showStep(1); return;
  }
  if (!data.download) { formError("Link de download é obrigatório."); showStep(3); return; }
  try {
    if (id) await db.ref("games/" + id).update(data);
    else await db.ref("games").push({ ...data, createdAt: Date.now() });
    toast(id ? "Jogo atualizado!" : "Jogo cadastrado!");
    resetForm();
  } catch (ex) {
    formError("Erro ao salvar: " + writeError(ex));
  }
});

/* ================= LISTA ADMIN ================= */
$("#adminSearch").addEventListener("input", (e) => { state.admQuery = norm(e.target.value); state.admPage = 1; renderAdminList(); });
$("#adminPerPage").addEventListener("change", (e) => { state.admPerPage = +e.target.value; state.admPage = 1; renderAdminList(); });
$("[data-adm-prev]").addEventListener("click", () => { state.admPage--; renderAdminList(); });
$("[data-adm-next]").addEventListener("click", () => { state.admPage++; renderAdminList(); });

function renderAdminList() {
  const list = state.games
    .filter((g) => !state.admQuery || searchBlob(g).includes(state.admQuery))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const per = state.admPerPage;
  const pages = Math.max(1, Math.ceil(list.length / per));
  if (state.admPage > pages) state.admPage = pages;
  const slice = list.slice((state.admPage - 1) * per, state.admPage * per);

  $("#adminList").innerHTML = slice.length
    ? slice.map((g) => `
      <div class="admin-item">
        <img src="${esc(g.cover || "")}" alt="" />
        <div class="ai-main">
          <div class="ai-title">${esc(g.title || "Sem título")}${g.code ? ` <span class="muted small">· ${esc(g.code)}</span>` : ""}</div>
          <div class="ai-sub"><span class="dot ${g.published !== false ? "on" : ""}"></span>${esc(g.category || "sem categoria")}${g.platform ? " · " + esc(g.platform) : ""}${g.year ? " · " + esc(g.year) : ""}</div>
        </div>
        <button class="btn btn-ghost" data-edit="${esc(g.id)}">Editar</button>
        <button class="btn btn-danger" data-del="${esc(g.id)}">Excluir</button>
      </div>`).join("")
    : `<p class="muted small">Nenhum jogo encontrado.</p>`;

  $$("#adminList [data-edit]").forEach((b) =>
    b.addEventListener("click", () => {
      const g = state.games.find((x) => x.id === b.dataset.edit);
      if (g) fillForm(g);
    })
  );
  $$("#adminList [data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("Excluir este jogo definitivamente?")) return;
      try {
        await db.ref("games/" + b.dataset.del).remove();
        toast("Jogo excluído.");
      } catch (ex) {
        toast("Erro ao excluir: " + writeError(ex));
      }
    })
  );

  $("[data-adm-info]").textContent = `Página ${state.admPage} de ${pages} · ${list.length} jogo(s)`;
  $("[data-adm-prev]").disabled = state.admPage <= 1;
  $("[data-adm-next]").disabled = state.admPage >= pages;
}

/* ================= IDENTIDADE / TEMA / AJUDA (salvar) ================= */
$("#brandForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.isAdmin) return toast("Somente admin.");
  try {
    await db.ref("settings").update({
      logoSquare: imgFields.logoSquare.getValue(),
      logoWord: imgFields.logoWord.getValue(),
      favicon: imgFields.favicon.getValue(),
      siteName: $("#bSiteName").value.trim(),
      heroTitle: $("#bHeroTitle").value.trim(),
      heroSubtitle: $("#bHeroSubtitle").value.trim(),
      footerText: $("#bFooter").value.trim(),
    });
    toast("Identidade salva!");
  } catch (ex) {
    toast("Erro ao salvar identidade: " + writeError(ex));
  }
});

function collectTheme() {
  const pick = (p) => ({
    bg: $("#" + p + "Bg").value,
    surface: $("#" + p + "Surface").value,
    border: $("#" + p + "Border").value,
    text: $("#" + p + "Text").value,
    primary: $("#" + p + "Primary").value,
    accent: $("#" + p + "Accent").value,
  });
  return {
    defaultTheme: $("#tDefault").value,
    allowToggle: $("#tAllowToggle").checked,
    font: $("#tFont").value,
    radius: Number($("#tRadius").value) || 14,
    dark: pick("td"),
    light: pick("tl"),
  };
}

// pré-visualização ao vivo
$("#themeForm").addEventListener("input", () => {
  const backup = state.settings.theme;
  state.settings.theme = collectTheme();
  applyTheme();
  state.settings.theme = backup;
});

$("#themeForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.isAdmin) return toast("Somente admin.");
  try {
    await db.ref("settings/theme").set(collectTheme());
    toast("Personalização salva!");
  } catch (ex) {
    toast("Erro ao salvar personalização: " + writeError(ex));
  }
});
$("#themeReset").addEventListener("click", async () => {
  if (!state.isAdmin) return toast("Somente admin.");
  try {
    await db.ref("settings/theme").set(DEFAULT_THEME);
    toast("Tema restaurado.");
  } catch (ex) {
    toast("Erro ao restaurar tema: " + writeError(ex));
  }
});

$("#helpForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.isAdmin) return toast("Somente admin.");
  try {
    await db.ref("settings").update({ help: $("#hContent").value });
    toast("Ajuda salva!");
  } catch (ex) {
    toast("Erro ao salvar ajuda: " + writeError(ex));
  }
});

/* ================= BACKUP ================= */
function log(msg) { $("#backupLog").textContent = msg; }

$("#exportBtn").addEventListener("click", () => {
  const payload = {
    _meta: { app: "Workin'Store | Bônus", version: 2, exportedAt: new Date().toISOString() },
    settings: state.settings || {},
    games: state.games.reduce((acc, g) => { const { id, ...rest } = g; acc[id] = rest; return acc; }, {}),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Workin'Store - Bônus-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  log(`Exportado: ${state.games.length} jogo(s) + menus/identidade/tema/ajuda.`);
});

$("#importFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!state.isAdmin) { log("Somente o administrador pode importar."); e.target.value = ""; return; }
  try {
    const data = JSON.parse(await file.text());
    const games = data.games || {};
    const gameList = Array.isArray(games) ? games : Object.entries(games).map(([id, g]) => ({ id, ...g }));
    if (!gameList.length && !data.settings) throw new Error("Arquivo sem dados reconhecíveis.");

    const mode = $("#importMode").value;
    if (mode === "replace" && !confirm("Substituir TODOS os dados atuais? Esta ação não pode ser desfeita.")) {
      e.target.value = ""; return;
    }

    if (mode === "replace") {
      const map = {};
      gameList.forEach((g, i) => { const { id, ...rest } = g; map[id || `imp_${Date.now()}_${i}`] = rest; });
      await db.ref("games").set(map);
      if (data.settings) await db.ref("settings").set(data.settings);
    } else {
      for (const g of gameList) {
        const { id, ...rest } = g;
        if (id) await db.ref("games/" + id).update(rest);
        else await db.ref("games").push({ ...rest, createdAt: Date.now() });
      }
      if (data.settings) await db.ref("settings").update(data.settings);
    }
    log(`Importação concluída (${mode === "replace" ? "substituição" : "mesclagem"}): ${gameList.length} jogo(s).`);
    toast("Backup importado!");
  } catch (ex) {
    log("Erro na importação: " + ex.message);
  } finally {
    e.target.value = "";
  }
});

/* ================= BOOT ================= */
applyTheme();
renderSettings();
renderFilterOptions();
renderGames();
showStep(1);
renderAdminList();
$("#fCode").value = nextCode();

if (firebaseReady) {
  db.ref("games").on("value", (snap) => {
    const val = snap.val() || {};
    state.games = Object.entries(val).map(([id, g]) => ({ id, ...g }));
    renderFilterOptions();
    renderGames();
    renderAdminList();
    if (!$("#gameId").value) $("#fCode").value = nextCode();
  }, (err) => console.warn("Leitura de games falhou:", err.message));

  db.ref("settings").on("value", (snap) => {
    state.settings = snap.val() || {};
    renderSettings();
    renderGames();
  }, (err) => console.warn("Leitura de settings falhou:", err.message));
}
