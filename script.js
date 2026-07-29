/* ============================================================
   SUBSTITUA AS CREDENCIAIS ABAIXO PELO SEU PROJETO FIREBASE
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyCdbgPcsM-RLHzDkClVToAhGhOizfLvu6o",
  authDomain: "kitopl2.firebaseapp.com",
  databaseURL: "https://kitopl2-default-rtdb.firebaseio.com",
  projectId: "kitopl2",
  storageBucket: "kitopl2.firebasestorage.app",
  messagingSenderId: "529504176070",
  appId: "1:529504176070:web:2c20baf1163b98f563d4c7"
};

/* ============================================================
   GATILHOS DE MARKETING PRÉ-PROGRAMADOS
   ============================================================ */
const MARKETING_TRIGGERS = [
  { id: "hot", label: "🔥 Mais vendido", badgeClass: "hot" },
  { id: "new", label: "🆕 Lançamento", badgeClass: "new" },
  { id: "sale", label: "🏷️ Promoção", badgeClass: "" },
  { id: "limited", label: "⏳ Edição limitada", badgeClass: "" },
  { id: "exclusive", label: "✨ Exclusivo", badgeClass: "" }
];

/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
const state = {
  produtos: [],
  menu: [],
  footer: { columns: [], copyright: "© Todos os direitos reservados." },
  brand: { square: "", wide: "" },
  user: null,
  isAdmin: false,
  page: 1,
  perPage: 12,
  editingId: null,
  menuEditingId: null
};

/* ============================================================
   INICIALIZAÇÃO FIREBASE
   ============================================================ */
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/* ============================================================
   HELPERS
   ============================================================ */
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast " + type;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatMoney(value) {
  if (!value && value !== 0) return "—";
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
  document.body.style.overflow = "";
}

function getCheckedValues(selector) {
  return Array.from(document.querySelectorAll(selector + ":checked")).map((cb) => cb.value);
}

function setCheckedValues(selector, values) {
  document.querySelectorAll(selector).forEach((cb) => {
    cb.checked = values && values.includes(cb.value);
  });
}

/* ============================================================
   AUTENTICAÇÃO
   ============================================================ */
auth.onAuthStateChanged((user) => {
  state.user = user;
  state.isAdmin = user && user.email === "admin@admin.com";
  updateAuthUI();
  loadData();
});

function updateAuthUI() {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const adminPanel = document.getElementById("admin-panel");
  if (state.isAdmin) {
    if (loginBtn) loginBtn.classList.add("hidden");
    if (logoutBtn) logoutBtn.classList.remove("hidden");
    if (adminPanel) adminPanel.classList.remove("hidden");
    showToast("Bem-vindo, admin!", "success");
  } else {
    if (loginBtn) loginBtn.classList.remove("hidden");
    if (logoutBtn) logoutBtn.classList.add("hidden");
    if (adminPanel) adminPanel.classList.add("hidden");
  }
}


function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const loader = document.getElementById("login-loader");
  const form = document.getElementById("login-form");

  if (!email || !password) {
    showToast("Preencha e-mail e senha.", "error");
    return;
  }

  loader.classList.add("active");
  form.classList.add("hidden");

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      loader.classList.remove("active");
      form.classList.remove("hidden");
      document.getElementById("login-form").reset();
      closeModal("login-modal");
    })
    .catch((err) => {
      loader.classList.remove("active");
      form.classList.remove("hidden");
      showToast("Erro: " + err.message, "error");
    });
}

function logout() {
  auth.signOut().then(() => {
    showToast("Logout realizado.", "info");
  });
}

/* ============================================================
   CARREGAMENTO DE DADOS
   ============================================================ */
function loadData() {
  db.ref("produtos").on("value", (snap) => {
    const data = snap.val() || {};
    state.produtos = Object.entries(data).map(([id, p]) => ({ id, ...p }));
    state.page = 1;
    renderProdutos();
  });

  db.ref("menu").on("value", (snap) => {
    const data = snap.val() || {};
    state.menu = Object.entries(data).map(([id, m]) => ({ id, ...m }));
    renderMenu();
    renderAdminMenu();
  });

  db.ref("footer").on("value", (snap) => {
    const data = snap.val() || { columns: [], copyright: "© Todos os direitos reservados." };
    state.footer = data;
    renderFooter();
    fillFooterForm();
  });

  db.ref("brand").on("value", (snap) => {
    const data = snap.val() || { square: "", wide: "" };
    state.brand = data;
    renderBrand();
    fillBrandForm();
  });
}

/* ============================================================
   MARCA / LOGOS
   ============================================================ */
function renderBrand() {
  const square = document.getElementById("logo-square");
  const wide = document.getElementById("logo-wide");
  if (square) square.src = state.brand.square || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  if (wide) {
    if (state.brand.wide) {
      wide.src = state.brand.wide;
      wide.classList.remove("hidden");
    } else {
      wide.classList.add("hidden");
    }
  }
}

function fillBrandForm() {
  document.getElementById("brand-square-url").value = state.brand.square || "";
  document.getElementById("brand-wide-url").value = state.brand.wide || "";
}

async function saveBrand(e) {
  e.preventDefault();
  if (!state.isAdmin) return;

  const squareFile = document.getElementById("brand-square-file").files[0];
  const wideFile = document.getElementById("brand-wide-file").files[0];
  const squareUrl = document.getElementById("brand-square-url").value.trim();
  const wideUrl = document.getElementById("brand-wide-url").value.trim();

  const square = squareFile ? await toBase64(squareFile) : squareUrl;
  const wide = wideFile ? await toBase64(wideFile) : wideUrl;

  db.ref("brand").set({ square, wide })
    .then(() => showToast("Marca salva com sucesso!", "success"))
    .catch((err) => showToast("Erro ao salvar: " + err.message, "error"));
}

/* ============================================================
   MENU (MISTO: LINKS DIRETOS + SUBMENUS)
   ============================================================ */
function renderMenu() {
  const desktop = document.getElementById("menu-desktop");
  const mobile = document.getElementById("mobile-menu-list");
  if (!desktop) return;

  const topItems = state.menu.filter((m) => !m.parentId);
  const children = (parentId) => state.menu.filter((m) => m.parentId === parentId);

  desktop.innerHTML = topItems.map((item) => buildDesktopItem(item, children)).join("");
  mobile.innerHTML = topItems.map((item, idx) => buildMobileItem(item, idx, children)).join("");
}

function buildDesktopItem(item, childrenFn) {
  const kids = childrenFn(item.id);
  const hasChildren = kids.length > 0;

  if (hasChildren) {
    return `
      <li class="menu-item">
        <span class="menu-toggle">${escapeHtml(item.name)} <span class="arrow">▾</span></span>
        <ul class="submenu">
          ${kids.map((k) => `<li><a class="menu-link" href="${escapeHtml(k.link || "#")}">${escapeHtml(k.name)}</a></li>`).join("")}
        </ul>
      </li>
    `;
  }

  return `<li class="menu-item"><a class="menu-link" href="${escapeHtml(item.link || "#")}">${escapeHtml(item.name)}</a></li>`;
}

function buildMobileItem(item, idx, childrenFn) {
  const kids = childrenFn(item.id);
  const hasChildren = kids.length > 0;

  if (hasChildren) {
    return `
      <li>
        <span class="submenu-toggle" onclick="toggleMobileSubmenu(${idx})">${escapeHtml(item.name)} <span id="arrow-${idx}">▾</span></span>
        <ul class="mobile-submenu" id="mobile-submenu-${idx}">
          ${kids.map((k) => `<li><a href="${escapeHtml(k.link || "#")}">${escapeHtml(k.name)}</a></li>`).join("")}
        </ul>
      </li>
    `;
  }

  return `<li><a href="${escapeHtml(item.link || "#")}">${escapeHtml(item.name)}</a></li>`;
}

function toggleMobileSubmenu(idx) {
  const sub = document.getElementById("mobile-submenu-" + idx);
  const arrow = document.getElementById("arrow-" + idx);
  sub.classList.toggle("open");
  arrow.textContent = sub.classList.contains("open") ? "▴" : "▾";
}

function toggleMobileMenu() {
  document.getElementById("mobile-menu").classList.toggle("open");
}

/* ============================================================
   ADMIN MENU
   ============================================================ */
function renderAdminMenu() {
  const list = document.getElementById("menu-list");
  const parentSelect = document.getElementById("menu-parent");
  if (!list) return;

  list.innerHTML = state.menu.map((item) => {
    const parent = state.menu.find((m) => m.id === item.parentId);
    return `
      <div class="admin-list-item">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <br><small>${item.link ? "Link: " + escapeHtml(item.link) : "Sem link (pai de submenu)"}</small>
          <br><small>${parent ? "Pai: " + escapeHtml(parent.name) : "Item de topo"}</small>
        </div>
        <div class="admin-list-actions">
          <button class="btn-save" onclick="editMenuItem('${item.id}')">Editar</button>
          <button class="btn-danger" onclick="deleteMenuItem('${item.id}')">Excluir</button>
        </div>
      </div>
    `;
  }).join("");

  const topItems = state.menu.filter((m) => !m.parentId);
  parentSelect.innerHTML = `<option value="">Nenhum (item de topo)</option>` +
    topItems.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("");

  if (state.menuEditingId) {
    const item = state.menu.find((m) => m.id === state.menuEditingId);
    if (item) parentSelect.value = item.parentId || "";
  }
}

function saveMenuItem(e) {
  e.preventDefault();
  if (!state.isAdmin) return;

  const name = document.getElementById("menu-name").value.trim();
  const link = document.getElementById("menu-link").value.trim();
  const parentId = document.getElementById("menu-parent").value || null;

  if (!name) {
    showToast("Digite um nome para o menu.", "error");
    return;
  }

  const data = { name, link, parentId };
  const ref = state.menuEditingId
    ? db.ref("menu/" + state.menuEditingId)
    : db.ref("menu").push();

  ref.set(data)
    .then(() => {
      showToast("Menu salvo!", "success");
      resetMenuForm();
    })
    .catch((err) => showToast("Erro: " + err.message, "error"));
}

function editMenuItem(id) {
  const item = state.menu.find((m) => m.id === id);
  if (!item) return;
  state.menuEditingId = id;
  document.getElementById("menu-name").value = item.name;
  document.getElementById("menu-link").value = item.link || "";
  document.getElementById("menu-parent").value = item.parentId || "";
  document.getElementById("menu-form-title").textContent = "Editar item de menu";
  document.getElementById("menu-cancel").classList.remove("hidden");
}

function deleteMenuItem(id) {
  if (!state.isAdmin) return;
  if (!confirm("Excluir este item? Subitens vinculados a ele também ficarão órfãos.")) return;
  db.ref("menu/" + id).remove()
    .then(() => showToast("Item removido.", "info"))
    .catch((err) => showToast("Erro: " + err.message, "error"));
}

function resetMenuForm() {
  state.menuEditingId = null;
  document.getElementById("menu-form").reset();
  document.getElementById("menu-form-title").textContent = "Adicionar item de menu";
  document.getElementById("menu-cancel").classList.add("hidden");
}

/* ============================================================
   PRODUTOS
   ============================================================ */
function renderProdutos() {
  const grid = document.getElementById("produtos-grid");
  const total = state.produtos.length;
  const start = (state.page - 1) * state.perPage;
  const pageItems = state.produtos.slice(start, start + state.perPage);

  if (!total) {
    grid.innerHTML = `<p class="empty" style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem 0;">Nenhum produto cadastrado ainda.</p>`;
  } else {
    grid.innerHTML = pageItems.map((p) => buildCard(p)).join("");
  }

  renderPagination(total);
}

function buildCard(p) {
  const triggers = (p.triggers || []).map((t) => {
    const opt = MARKETING_TRIGGERS.find((x) => x.id === t);
    return opt ? `<span class="badge ${opt.badgeClass}">${opt.label}</span>` : "";
  }).join("");

  return `
    <article class="card" onclick="openProdutoModal('${p.id}')">
      <div class="trigger-badges">${triggers}</div>
      <img class="card-img" src="${escapeHtml(p.image || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")}" alt="${escapeHtml(p.title)}">
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(p.title)}</h3>
        <p class="card-desc">${escapeHtml(p.description)}</p>
        <p class="card-price">${formatMoney(p.price)}</p>
      </div>
    </article>
  `;
}

function renderPagination(total) {
  const pages = Math.ceil(total / state.perPage) || 1;
  const pagination = document.getElementById("pagination");
  let html = `
    <button onclick="setPage(${state.page - 1})" ${state.page === 1 ? "disabled" : ""}>‹</button>
  `;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="${i === state.page ? "active" : ""}" onclick="setPage(${i})">${i}</button>`;
  }
  html += `<button onclick="setPage(${state.page + 1})" ${state.page === pages ? "disabled" : ""}>›</button>`;
  pagination.innerHTML = html;
}

function setPage(page) {
  const pages = Math.ceil(state.produtos.length / state.perPage) || 1;
  if (page < 1 || page > pages) return;
  state.page = page;
  renderProdutos();
  document.getElementById("produtos").scrollIntoView({ behavior: "smooth" });
}

function openProdutoModal(id) {
  const p = state.produtos.find((x) => x.id === id);
  if (!p) return;

  document.getElementById("modal-img").src = p.image || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  document.getElementById("modal-title").textContent = p.title || "Produto";
  document.getElementById("modal-desc").textContent = p.description || "";
  document.getElementById("modal-cities").textContent = p.cities || "Nacional";
  document.getElementById("modal-price").textContent = formatMoney(p.price);
  document.getElementById("modal-buy").href = p.buyLink || "#";

  const triggers = (p.triggers || []).map((t) => {
    const opt = MARKETING_TRIGGERS.find((x) => x.id === t);
    return opt ? `<span class="badge ${opt.badgeClass}">${opt.label}</span>` : "";
  }).join("");
  document.getElementById("modal-triggers").innerHTML = triggers;

  openModal("produto-modal");
}

/* ============================================================
   ADMIN PRODUTOS
   ============================================================ */
function renderAdminProdutos() {
  const list = document.getElementById("produtos-list");
  if (!list) return;
  list.innerHTML = state.produtos.map((p) => `
    <div class="admin-list-item">
      <div>
        <strong>${escapeHtml(p.title)}</strong>
        <br><small>${formatMoney(p.price)} — ${escapeHtml(p.description || "").substring(0, 60)}${p.description && p.description.length > 60 ? "..." : ""}</small>
      </div>
      <div class="admin-list-actions">
        <button class="btn-save" onclick="editProduto('${p.id}')">Editar</button>
        <button class="btn-danger" onclick="deleteProduto('${p.id}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

function renderTriggersOptions() {
  const container = document.getElementById("triggers-options");
  if (!container) return;
  container.innerHTML = MARKETING_TRIGGERS.map((t) => `
    <label style="display:flex;align-items:center;gap:0.5rem;margin:0.4rem 0;cursor:pointer;">
      <input type="checkbox" name="trigger" value="${t.id}">
      <span class="badge ${t.badgeClass}">${t.label}</span>
    </label>
  `).join("");
}

async function saveProduto(e) {
  e.preventDefault();
  if (!state.isAdmin) return;

  const file = document.getElementById("produto-imagem-file").files[0];
  const url = document.getElementById("produto-imagem-url").value.trim();
  const title = document.getElementById("produto-titulo").value.trim();
  const description = document.getElementById("produto-descricao").value.trim();
  const cities = document.getElementById("produto-cidades").value.trim();
  const price = parseFloat(document.getElementById("produto-preco").value.replace(",", "."));
  const buyLink = document.getElementById("produto-comprar").value.trim();
  const triggers = getCheckedValues("input[name='trigger']");

  let image = url;
  if (file) image = await toBase64(file);

  if (!title) {
    showToast("Preencha o título do produto.", "error");
    return;
  }

  const data = { title, description, cities, price, buyLink, image, triggers };
  const ref = state.editingId
    ? db.ref("produtos/" + state.editingId)
    : db.ref("produtos").push();

  ref.set(data)
    .then(() => {
      showToast("Produto salvo!", "success");
      resetProdutoForm();
    })
    .catch((err) => showToast("Erro: " + err.message, "error"));
}

function editProduto(id) {
  const p = state.produtos.find((x) => x.id === id);
  if (!p) return;
  state.editingId = id;
  document.getElementById("produto-titulo").value = p.title || "";
  document.getElementById("produto-descricao").value = p.description || "";
  document.getElementById("produto-cidades").value = p.cities || "";
  document.getElementById("produto-preco").value = p.price || "";
  document.getElementById("produto-comprar").value = p.buyLink || "";
  document.getElementById("produto-imagem-url").value = p.image || "";
  setCheckedValues("input[name='trigger']", p.triggers || []);
  document.getElementById("produto-form-title").textContent = "Editar produto";
  document.getElementById("produto-cancel").classList.remove("hidden");
  switchTab("produtos-tab");
}

function deleteProduto(id) {
  if (!state.isAdmin) return;
  if (!confirm("Excluir este produto?")) return;
  db.ref("produtos/" + id).remove()
    .then(() => showToast("Produto removido.", "info"))
    .catch((err) => showToast("Erro: " + err.message, "error"));
}

function resetProdutoForm() {
  state.editingId = null;
  document.getElementById("produto-form").reset();
  setCheckedValues("input[name='trigger']", []);
  document.getElementById("produto-form-title").textContent = "Adicionar produto";
  document.getElementById("produto-cancel").classList.add("hidden");
}

/* ============================================================
   RODAPÉ
   ============================================================ */
function renderFooter() {
  const cols = state.footer.columns || [];
  const grid = document.getElementById("footer-columns");
  if (!grid) return;
  grid.innerHTML = cols.map((col) => `
    <div class="footer-col">
      <h4>${escapeHtml(col.title)}</h4>
      ${(col.links || []).map((l) => `<a href="${escapeHtml(l.url || "#")}" target="${l.external ? "_blank" : "_self"}">${escapeHtml(l.text)}</a>`).join("")}
    </div>
  `).join("");

  document.getElementById("footer-copyright").textContent = state.footer.copyright || "© Todos os direitos reservados.";
}

function fillFooterForm() {
  const cols = state.footer.columns || [];
  const json = JSON.stringify(cols, null, 2);
  document.getElementById("footer-columns-json").value = json;
  document.getElementById("footer-copyright-input").value = state.footer.copyright || "© Todos os direitos reservados.";
}

function saveFooter(e) {
  e.preventDefault();
  if (!state.isAdmin) return;

  try {
    const columns = JSON.parse(document.getElementById("footer-columns-json").value || "[]");
    const copyright = document.getElementById("footer-copyright-input").value.trim();
    db.ref("footer").set({ columns, copyright })
      .then(() => showToast("Rodapé salvo!", "success"))
      .catch((err) => showToast("Erro: " + err.message, "error"));
  } catch (err) {
    showToast("JSON inválido: " + err.message, "error");
  }
}

/* ============================================================
   ABAS DO ADMIN
   ============================================================ */
function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".admin-section").forEach((s) => s.classList.remove("active"));
  document.getElementById("btn-" + tabId).classList.add("active");
  document.getElementById(tabId).classList.add("active");

  if (tabId === "produtos-tab") renderAdminProdutos();
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  renderTriggersOptions();

  document.getElementById("login-form").addEventListener("submit", handleLogin);
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) loginBtn.addEventListener("click", () => openModal("login-modal"));
  document.getElementById("logout-btn").addEventListener("click", logout);

  document.getElementById("restricted-dot").addEventListener("click", () => openModal("login-modal"));

  document.getElementById("produto-form").addEventListener("submit", saveProduto);
  document.getElementById("produto-cancel").addEventListener("click", resetProdutoForm);
  document.getElementById("menu-form").addEventListener("submit", saveMenuItem);
  document.getElementById("menu-cancel").addEventListener("click", resetMenuForm);
  document.getElementById("brand-form").addEventListener("submit", saveBrand);
  document.getElementById("footer-form").addEventListener("submit", saveFooter);

  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-overlay");
      modal.classList.remove("open");
      document.body.style.overflow = "";
    });
  });

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("open");
        document.body.style.overflow = "";
      }
    });
  });

  document.getElementById("btn-produtos-tab").addEventListener("click", () => switchTab("produtos-tab"));
  document.getElementById("btn-menu-tab").addEventListener("click", () => switchTab("menu-tab"));
  document.getElementById("btn-brand-tab").addEventListener("click", () => switchTab("brand-tab"));
  document.getElementById("btn-footer-tab").addEventListener("click", () => switchTab("footer-tab"));

  window.addEventListener("scroll", () => {
    const header = document.getElementById("main-header");
    if (window.scrollY > 30) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  });

  document.getElementById("login-email").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("login-password").focus();
  });
  document.getElementById("login-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin(e);
  });
});
