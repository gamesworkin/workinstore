import { initializeApp } from "firebase/app"; 
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getDatabase, ref, set, get, onValue, update, remove } from "firebase/database";

// CONFIGURAÇÃO DO CONSOLE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyATr3AFcjJtamWRKZEBBcsA8vi-_ckCeEs",
  authDomain: "games2-c9b04.firebaseapp.com",
  projectId: "games2-c9b04",
  storageBucket: "games2-c9b04.firebasestorage.app",
  messagingSenderId: "417046305603",
  appId: "1:417046305603:web:52e921b1f10f9ed4b76df6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let currentUId = null;
let activeBlobUrl = null; 
let cachedGames = {};
let selectedPreviewGameId = null;
let isAdminMode = false;

// --- Bloqueio de botão direito e atalhos (não se aplica ao administrador) ---
document.addEventListener("contextmenu", (e) => { if (!isAdminMode) e.preventDefault(); });
document.addEventListener("keydown", (e) => {
    if (isAdminMode) return;
    const k = (e.key || "").toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    if (k === "f12" || (ctrl && e.shiftKey && ["i","j","c"].includes(k)) || (ctrl && ["u","s"].includes(k))) {
        e.preventDefault(); e.stopPropagation();
    }
}, true);

// DEFINIÇÃO DA WHITELIST DE PROVEDORES DE EMAIL
const emailWhitelist = [
    "gmail.com",
    "outlook.com",
    "hotmail.com",
    "yahoo.com",
    "yahoo.com.br",
    "live.com",
    "icloud.com"
];

// Captura de Elementos Gerais da Interface
const btnOpenAuth = document.getElementById('btn-open-auth');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const btnAdminPanel = document.getElementById('btn-admin-panel');
const btnOpenProfile = document.getElementById('btn-open-profile');
const playerDashboard = document.getElementById('player-dashboard-section');

// Elementos de Controle do Menu Retrátil Mobile
const btnMenuToggle = document.getElementById('btn-menu-toggle');
const navbarLinks = document.getElementById('navbar-links');

// Elementos dos Modais
const modalAuth = document.getElementById('modal-auth');
const modalForgot = document.getElementById('modal-forgot');
const modalAdmin = document.getElementById('modal-admin');
const modalProfile = document.getElementById('modal-profile');
const modalGamePreview = document.getElementById('modal-game-preview');

// Elementos Internos do Modal de Preview de Jogo
const previewCover = document.getElementById('preview-cover');
const previewSystemBadge = document.getElementById('preview-system-badge');
const previewTitle = document.getElementById('preview-title');
const previewDesc = document.getElementById('preview-desc');
const btnStartPreviewGame = document.getElementById('btn-start-preview-game');

// Botões de Execução com Mutação de Texto e Formulário Admin
const btnExecuteLogin = document.getElementById('btn-execute-login');
const btnExecuteRegister = document.getElementById('btn-execute-register');
const btnSaveNewGame = document.getElementById('btn-save-new-game');
const btnCancelEditGame = document.getElementById('btn-cancel-edit-game');
const adminFormTitle = document.getElementById('admin-form-title');

// Abas do Painel Administrativo
const tabAddGame = document.getElementById('tab-add-game');
const tabAdvancedMenu = document.getElementById('tab-advanced-menu');
const tabManageUsers = document.getElementById('tab-manage-users');

const adminGameSection = document.getElementById('admin-game-section');
const adminAdvancedSection = document.getElementById('admin-advanced-section');
const adminUserSection = document.getElementById('admin-user-section');

// Elementos Avançados de Categorias (Bulk)
const bulkFilterCategory = document.getElementById('bulk-filter-category');
const bulkFilterSubcategory = document.getElementById('bulk-filter-subcategory');
const btnBulkEditCat = document.getElementById('btn-bulk-edit-cat');
const btnBulkDeleteCat = document.getElementById('btn-bulk-delete-cat');
const btnExportJson = document.getElementById('btn-export-json');
const importJsonFile = document.getElementById('import-json-file');

// Controle de Telas Internas dos Modais de Autenticação
const authLoginSec = document.getElementById('auth-login-section');
const authRegisterSec = document.getElementById('auth-register-section');

// --- SISTEMA DE CONTROLE CORRIGIDO DO MENU RETRÁTIL MOBILE ---
if (btnMenuToggle && navbarLinks) {
    btnMenuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isOpen = navbarLinks.classList.toggle('mobile-open');
        if (isOpen) {
            btnMenuToggle.classList.add('open-active');
            btnMenuToggle.textContent = "▲";
        } else {
            btnMenuToggle.classList.remove('open-active');
            btnMenuToggle.textContent = "▼";
        }
    });

    // Fecha o menu ao clicar em links internos ou botões de ação
    navbarLinks.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) {
            navbarLinks.classList.remove('mobile-open');
            btnMenuToggle.classList.remove('open-active');
            btnMenuToggle.textContent = "▼";
        }
    });

    // Fecha o menu se clicar fora da barra de navegação
    document.addEventListener('click', (e) => {
        if (!navbarLinks.contains(e.target) && !btnMenuToggle.contains(e.target)) {
            navbarLinks.classList.remove('mobile-open');
            btnMenuToggle.classList.remove('open-active');
            btnMenuToggle.textContent = "▼";
        }
    });
}

// E-mail do administrador armazenado apenas como hash SHA-256 (não reversível)
const ADMIN_EMAIL_HASH = "5edfa2692bdacc5e6ee805c626c50cb44cebb065f092d9a1067d89f74dacd326";

async function sha256Hex(text) {
    const data = new TextEncoder().encode(String(text || "").trim().toLowerCase());
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function isAdminEmail(email) {
    if (!email) return false;
    return (await sha256Hex(email)) === ADMIN_EMAIL_HASH;
}

// Ouvinte de Estado da Sessão (Auth)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Apenas o administrador pode manter sessão ativa
        if (!(await isAdminEmail(user.email))) {
            await signOut(auth);
            return;
        }
        currentUser = user;
        currentUId = user.uid;
        
        const snapshot = await get(ref(database, `usuarios/${currentUId}/perfil`));
        if (snapshot.exists() && snapshot.val().banido === true) {
            alert("🔒 Acesso Negado! Esta conta foi banida permanentemente pelo administrador.");
            signOut(auth);
            return;
        }

        if (btnOpenAuth) btnOpenAuth.classList.add('hidden');
        if (userInfo) userInfo.classList.remove('hidden');
        if (userAvatar) userAvatar.src = user.photoURL || "https://win98icon.org/styles/asset/windows98/v1/user_computer-0.png";

        if (await isAdminEmail(user.email)) {
            isAdminMode = true;
            const ap = snapshot.exists() ? snapshot.val() : {};
            applyAdminProfileToNavbar(ap);
            if (btnAdminPanel) btnAdminPanel.classList.remove('hidden');
            if (btnOpenProfile) btnOpenProfile.classList.add('hidden');
            if (playerDashboard) playerDashboard.classList.add('hidden');
        } else {
            isAdminMode = false;
            if (userName) userName.textContent = user.displayName ? user.displayName.split(' ')[0] : "Jogador";
            if (btnAdminPanel) btnAdminPanel.classList.add('hidden');
            if (btnOpenProfile) btnOpenProfile.classList.remove('hidden');
            if (playerDashboard) playerDashboard.classList.remove('hidden');
            
            if (!snapshot.exists()) {
                await set(ref(database, `usuarios/${currentUId}/perfil`), {
                    nome: user.displayName ? user.displayName.split(' ')[0] : "Jogador",
                    sobrenome: "Google",
                    cidade: "Não Informada",
                    email: user.email,
                    role: "user",
                    solicitou_exclusao: false,
                    banido: false
                });
            }
            loadProfileDataToFields();
            setupPlayerDashboardObservers();
        }
    } else {
        currentUser = null;
        currentUId = null;
        isAdminMode = false;
        if (btnOpenAuth) btnOpenAuth.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
        if (btnAdminPanel) btnAdminPanel.classList.add('hidden');
        if (btnOpenProfile) btnOpenProfile.classList.add('hidden');
        if (playerDashboard) playerDashboard.classList.add('hidden');
        
        resetAuthFormStates();
    }
    triggerCatalogRenderRefresh();
});

function triggerCatalogRenderRefresh() {
    if(cachedGames) {
        renderCatalogGrid(cachedGames);
    }
}

function resetAuthFormStates() {
    const inputs = document.querySelectorAll('#modal-auth input');
    inputs.forEach(input => input.value = "");
    
    if (btnExecuteLogin) {
        btnExecuteLogin.textContent = "Entrar ⚡";
        btnExecuteLogin.disabled = false;
    }
    if (btnExecuteRegister) {
        btnExecuteRegister.textContent = "Finalizar Cadastro 🎮";
        btnExecuteRegister.disabled = false;
    }
}

async function loadProfileDataToFields() {
    if (!currentUId) return;
    const snapshot = await get(ref(database, `usuarios/${currentUId}/perfil`));
    if (snapshot.exists()) {
        const p = snapshot.val();
        if(document.getElementById('edit-nome')) document.getElementById('edit-nome').value = p.nome || "";
        if(document.getElementById('edit-sobrenome')) document.getElementById('edit-sobrenome').value = p.sobrenome || "";
        if(document.getElementById('edit-cidade')) document.getElementById('edit-cidade').value = p.cidade || "";
        if(document.getElementById('edit-email')) document.getElementById('edit-email').value = p.email || "";
    }
}

if (document.getElementById('btn-save-profile')) {
    document.getElementById('btn-save-profile').addEventListener('click', async () => {
        if (!currentUId) return;
        const nome = document.getElementById('edit-nome').value.trim();
        const sobrenome = document.getElementById('edit-sobrenome').value.trim();
        const cidade = document.getElementById('edit-cidade').value.trim();

        if (!nome || !sobrenome || !cidade) { alert("Os campos não podem ficar vazios!"); return; }

        try {
            await update(ref(database, `usuarios/${currentUId}/perfil`), { nome, sobrenome, cidade });
            alert("Perfil updated com sucesso!");
            if (userName) userName.textContent = nome;
            modalProfile.classList.add('hidden');
        } catch (err) { alert("Falha ao salvar: " + err.message); }
    });
}

if (btnOpenAuth) btnOpenAuth.addEventListener('click', () => { modalAuth.classList.remove('hidden'); authLoginSec.classList.remove('hidden'); authRegisterSec?.classList.add('hidden'); resetAuthFormStates(); });
if (document.getElementById('close-auth-modal')) document.getElementById('close-auth-modal').addEventListener('click', () => modalAuth.classList.add('hidden'));
if (document.getElementById('link-forgot-password')) document.getElementById('link-forgot-password').addEventListener('click', (e) => { e.preventDefault(); modalAuth.classList.add('hidden'); modalForgot.classList.remove('hidden'); });
if (document.getElementById('close-forgot-modal')) document.getElementById('close-forgot-modal').addEventListener('click', () => modalForgot.classList.add('hidden'));

if (document.getElementById('link-to-register')) {
    document.getElementById('link-to-register').addEventListener('click', (e) => { 
        e.preventDefault(); 
        authLoginSec.classList.add('hidden'); 
        authRegisterSec?.classList.remove('hidden'); 
        resetAuthFormStates();
    });
}
if (document.getElementById('link-to-login')) {
    document.getElementById('link-to-login').addEventListener('click', (e) => { 
        e.preventDefault(); 
        authRegisterSec?.classList.add('hidden'); 
        authLoginSec.classList.remove('hidden'); 
        resetAuthFormStates();
    });
}

if (btnAdminPanel) btnAdminPanel.addEventListener('click', () => { modalAdmin.classList.remove('hidden'); switchAdminTab('add'); });
if (document.getElementById('close-admin-modal')) document.getElementById('close-admin-modal').addEventListener('click', () => modalAdmin.classList.add('hidden'));

if (btnOpenProfile) btnOpenProfile.addEventListener('click', () => { modalProfile.classList.remove('hidden'); loadProfileDataToFields(); });
if (document.getElementById('close-profile-modal')) document.getElementById('close-profile-modal').addEventListener('click', () => modalProfile.classList.add('hidden'));

if (document.getElementById('close-preview-modal')) document.getElementById('close-preview-modal').addEventListener('click', () => modalGamePreview.classList.add('hidden'));

document.querySelectorAll('#modal-auth .next-on-enter').forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const activeSection = authLoginSec.classList.contains('hidden') ? authRegisterSec : authLoginSec;
            const visibleInputs = Array.from(activeSection.querySelectorAll('.input-style'));
            const index = visibleInputs.indexOf(e.target);
            if (index > -1 && visibleInputs[index + 1]) {
                visibleInputs[index + 1].focus();
            }
        }
    });
});

const loginPasswordInput = document.getElementById('login-senha');
if (loginPasswordInput) {
    loginPasswordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); processLoginAction(); } });
}

const registerPasswordInput = document.getElementById('reg-senha');
if (registerPasswordInput) {
    registerPasswordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); processRegisterAction(); } });
}

async function processLoginAction() {
    const email = document.getElementById('login-email').value.trim();
    const senha = loginPasswordInput.value.trim();
    if(!email || !senha) { alert("Preencha todos os campos para entrar!"); return; }
    if(!(await isAdminEmail(email))) { alert("🔒 Acesso restrito ao administrador. Para jogar não é necessário entrar."); return; }
    btnExecuteLogin.textContent = "Logando...";
    btnExecuteLogin.disabled = true;
    showLoginSpinner("Entrando...");
    try { 
        await signInWithEmailAndPassword(auth, email, senha); 
        modalAuth.classList.add('hidden'); 
        showLoginSpinner("Bem-vindo! ✅");
        setTimeout(hideLoginSpinner, 900);
    } catch (err) { 
        hideLoginSpinner();
        alert("Acesso negado: " + err.message); 
        btnExecuteLogin.textContent = "Entrar ⚡";
        btnExecuteLogin.disabled = false;
    }
}

async function processRegisterAction() {
    alert("O cadastro de contas está desativado."); return;
    const nome = document.getElementById('reg-nome').value.trim();
    const sobrenome = document.getElementById('reg-sobrenome').value.trim();
    const cidade = document.getElementById('reg-cidade').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const senha = registerPasswordInput.value.trim();

    if(!nome || !sobrenome || !cidade || !email || !senha) { alert("Preencha todos os campos!"); return; }

    const emailParts = email.split('@');
    if (emailParts.length !== 2) { alert("Insira um endereço de e-mail válido!"); return; }
    
    const emailDomain = emailParts[1].toLowerCase();
    if (!emailWhitelist.includes(emailDomain)) {
        alert(`O domínio "@${emailDomain}" não é permitido.\n\nPor favor, utilize um e-mail de um provedor confiável (Gmail, Hotmail, Outlook, Yahoo ou iCloud).`);
        return;
    }

    btnExecuteRegister.textContent = "Cadastrando...";
    btnExecuteRegister.disabled = true;

    try {
        const credential = await createUserWithEmailAndPassword(auth, email, senha);
        await set(ref(database, `usuarios/${credential.user.uid}/perfil`), {
            nome, sobrenome, cidade, email, role: "user", solicitou_exclusao: false, banido: false
        });
        alert("Conta criada com sucesso!");
        modalAuth.classList.add('hidden');
    } catch (err) { 
        alert("Erro ao cadastrar: " + err.message); 
        btnExecuteRegister.textContent = "Finalizar Cadastro 🎮";
        btnExecuteRegister.disabled = false;
    }
}

if (document.getElementById('btn-login-google')) {
    document.getElementById('btn-login-google').addEventListener('click', async () => {
        alert("Login com Google desativado."); return;
        try { await signInWithPopup(auth, provider); modalAuth.classList.add('hidden'); } 
        catch (err) { alert("Erro Google Auth: " + err.message); }
    });
}

if (btnLogout) btnLogout.addEventListener('click', () => signOut(auth));

if (document.getElementById('btn-execute-recovery')) {
    document.getElementById('btn-execute-recovery').addEventListener('click', async () => {
        const email = document.getElementById('forgot-email').value.trim();
        if (!email) { alert("Digite o e-mail cadastrado."); return; }
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Link de redefinição enviado!");
            modalForgot.classList.add('hidden');
        } catch (err) { alert("Erro: " + err.message); }
    });
}

if (document.getElementById('btn-request-delete-account')) {
    document.getElementById('btn-request-delete-account').addEventListener('click', async () => {
        if (confirm("Deseja mesmo solicitar a exclusão de sua conta?")) {
            await update(ref(database, `usuarios/${currentUId}/perfil`), { solicitou_exclusao: true });
            alert("Pedido enviado para análise!");
            modalProfile.classList.add('hidden');
        }
    });
}

// Efeito de pulsação suave no botão do WhatsApp
const waButton = document.querySelector('.whatsapp-float');
if (waButton) {
    waButton.style.animation = "pulse 2s infinite";
    
    // Injetando o keyframe da animação via JS para não precisar mexer no CSS
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
            100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
    `;
    document.head.appendChild(style);
}

// --- ESCUTA PRINCIPAL DO BANCO DE JOGOS ---
onValue(ref(database, 'jogos'), (snapshot) => {
    cachedGames = snapshot.val() || {};
    renderCatalogGrid(cachedGames);
    buildAdminBulkSelectors(cachedGames);
    renderAdminGamesTableList(cachedGames);
});

function renderCatalogGrid(jogos) {
    const grid = document.getElementById('live-catalog-grid');
    if (!grid) return;
    grid.innerHTML = "";

    if (Object.keys(jogos).length === 0) {
        grid.innerHTML = `<p style="color:var(--text-gray); padding: 20px;">Nenhum jogo publicado pelo administrador ainda.</p>`;
        return;
    }

    for (let gameId in jogos) {
        const jogo = jogos[gameId];
        const card = document.createElement('div');
        card.className = "game-card";
        
        let adminButtonHtml = "";
        if (isAdminMode) {
            adminButtonHtml = `<button class="btn-edit-card" onclick="openQuickEditGameForm('${gameId}')" title="Editar Jogo">⚙️</button>`;
        }

        card.innerHTML = `
            <div class="badge-system">${jogo.plataforma.toUpperCase()}</div>
            ${adminButtonHtml}
            <button class="btn-fav-card" data-id="${gameId}">❤</button>
            <div class="cover-wrapper" onclick="openGamePreview('${gameId}')">
                <img src="${jogo.url_capa}" alt="${jogo.titulo}">
            </div>
            <div class="game-info" onclick="openGamePreview('${gameId}')">
                <h3>${jogo.titulo}</h3>
                <p>${jogo.categoria} / ${jogo.subcategoria}</p>
            </div>
        `;
        grid.appendChild(card);
    }
    updateFavoriteButtonsVisuals();
}

window.openGamePreview = function(gameId) {
    const jogo = cachedGames[gameId];
    if (!jogo) return;

    selectedPreviewGameId = gameId;
    if (previewCover) previewCover.src = jogo.url_capa;
    if (previewSystemBadge) previewSystemBadge.textContent = jogo.plataforma.toUpperCase();
    if (previewTitle) previewTitle.textContent = jogo.titulo;
    if (previewDesc) previewDesc.textContent = jogo.descricao || "Nenhuma descrição detalhada fornecida para este título.";

    if (modalGamePreview) modalGamePreview.classList.remove('hidden');
    
    const scrollContainer = document.querySelector('.preview-scrollable-text');
    if (scrollContainer) scrollContainer.scrollTop = 0;
};

if (btnStartPreviewGame) {
    btnStartPreviewGame.addEventListener('click', () => {
        if (!selectedPreviewGameId || !cachedGames[selectedPreviewGameId]) return;
        const jogo = cachedGames[selectedPreviewGameId];
        if (modalGamePreview) modalGamePreview.classList.add('hidden');
        launchGame(jogo.plataforma, jogo.url_rom, jogo.titulo);
    });
}

document.addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('btn-fav-card')) {
        e.stopPropagation();
        if (!currentUId) { alert("Você precisa estar autenticado para favoritar!"); return; }
        const gameId = e.target.getAttribute('data-id');
        const favRef = ref(database, `usuarios/${currentUId}/favoritos/${gameId}`);
        
        const snapshot = await get(favRef);
        if (snapshot.exists()) { await remove(favRef); } 
        else { await set(favRef, true); }
    }
});

function updateFavoriteButtonsVisuals() {
    if (!currentUId) return;
    get(ref(database, `usuarios/${currentUId}/favoritos`)).then((snapshot) => {
        const favs = snapshot.val() || {};
        document.querySelectorAll('.btn-fav-card').forEach(btn => {
            const id = btn.getAttribute('data-id');
            if (favs[id]) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    });
}

function setupPlayerDashboardObservers() {
    onValue(ref(database, `usuarios/${currentUId}/favoritos`), (snapshot) => {
        const favGrid = document.getElementById('player-favorites-grid');
        if (!favGrid) return;
        favGrid.innerHTML = "";
        const favs = snapshot.val() || {};

        let count = 0;
        for (let gameId in favs) {
            if (cachedGames[gameId]) {
                count++;
                const jogo = cachedGames[gameId];
                const item = document.createElement('div');
                item.className = "game-card";
                item.style.transform = "none";
                item.innerHTML = `
                    <div class="cover-wrapper" style="height:110px;" onclick="openGamePreview('${gameId}')">
                        <img src="${jogo.url_capa}">
                    </div>
                    <div class="game-info" style="padding:10px;">
                        <h4 style="font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${jogo.titulo}</h4>
                    </div>
                `;
                favGrid.appendChild(item);
            }
        }
        if (count === 0) favGrid.innerHTML = `<p style="color:var(--text-gray); font-size:0.85rem;">Nenhum jogo favoritado.</p>`;
        updateFavoriteButtonsVisuals();
    });

    onValue(ref(database, `usuarios/${currentUId}/saves`), (snapshot) => {
        const tableBody = document.getElementById('player-saves-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = "";
        const saves = snapshot.val() || {};

        if (Object.keys(saves).length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: var(--text-gray);">Nenhum save em nuvem.</td></tr>`;
            return;
        }

        for (let saveKey in saves) {
            const save = saves[saveKey];
            const dataString = new Date(save.atualizado_em).toLocaleString('pt-BR');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:600; color:var(--neon-cyan);">${save.nome_arquivo}</td>
                <td>${dataString}</td>
                <td><button class="btn-sm" onclick="deleteSaveState('${saveKey}')">Deletar</button></td>
            `;
            tableBody.appendChild(tr);
        }
    });
}

window.deleteSaveState = async function(saveKey) {
    if (confirm("Apagar permanentemente este save de progresso em nuvem?")) {
        await remove(ref(database, `usuarios/${currentUId}/saves/${saveKey}`));
        alert("Save deletado do banco!");
    }
};

// --- LOGICA DE ALTERAÇÃO DE ABAS DO CONTROLADOR ADMIN ---
function switchAdminTab(targetTab) {
    const tabs = {
        add: [tabAddGame, adminGameSection],
        advanced: [tabAdvancedMenu, adminAdvancedSection],
        users: [tabManageUsers, adminUserSection],
        menu: [document.getElementById('tab-menu-builder'), document.getElementById('admin-menu-section')],
        layout: [document.getElementById('tab-layout'), document.getElementById('admin-layout-section')],
        profile: [document.getElementById('tab-admin-profile'), document.getElementById('admin-profile-section')]
    };
    Object.values(tabs).forEach(([btn, sec]) => {
        if (btn) btn.style.background = "transparent";
        if (sec) sec.classList.add('hidden');
    });
    const [btn, sec] = tabs[targetTab] || [];
    if (btn) btn.style.background = "var(--neon-purple)";
    if (sec) sec.classList.remove('hidden');

    if (targetTab === 'advanced') {
        buildAdminBulkSelectors(cachedGames);
        renderAdminGamesTableList(cachedGames);
    } else if (targetTab === 'users') {
        loadAdminUsersTable();
    } else if (targetTab === 'menu') {
        renderAdminMenuTable();
    } else if (targetTab === 'layout') {
        fillLayoutForm();
    } else if (targetTab === 'profile') {
        fillAdminProfileForm();
    }
}

if (tabAddGame) tabAddGame.addEventListener('click', () => switchAdminTab('add'));
if (tabAdvancedMenu) tabAdvancedMenu.addEventListener('click', () => switchAdminTab('advanced'));
if (tabManageUsers) tabManageUsers.addEventListener('click', () => switchAdminTab('users'));
if (document.getElementById('tab-menu-builder')) document.getElementById('tab-menu-builder').addEventListener('click', () => switchAdminTab('menu'));
if (document.getElementById('tab-layout')) document.getElementById('tab-layout').addEventListener('click', () => switchAdminTab('layout'));
if (document.getElementById('tab-admin-profile')) document.getElementById('tab-admin-profile').addEventListener('click', () => switchAdminTab('profile'));

// --- FORMULÁRIO DE CADASTRO E EDIÇÃO DE JOGO INDIVIDUAL ---
if (btnSaveNewGame) {
    btnSaveNewGame.addEventListener('click', async () => {
        const editId = document.getElementById('g-edit-id').value;
        const titulo = document.getElementById('g-title').value.trim();
        const plataforma = document.getElementById('g-platform').value;
        const categoria = document.getElementById('g-category').value.trim();
        const subcategoria = document.getElementById('g-subcategory').value.trim();
        const url_capa = document.getElementById('g-cover').value.trim();
        const url_rom = document.getElementById('g-rom').value.trim();
        const descricao = document.getElementById('g-desc').value.trim();

        if(!titulo || !categoria || !subcategoria || !url_capa || !url_rom) { alert("Preencha todos os campos obrigatórios!"); return; }

        const targetGameId = editId ? editId : ("game_" + Date.now());
        
        await set(ref(database, `jogos/${targetGameId}`), {
            titulo, plataforma, categoria, subcategoria, url_capa, url_rom, descricao
        });

        alert(editId ? "Dados do jogo atualizados com sucesso!" : "Novo jogo adicionado com sucesso!");
        clearAdminGameForm();
        modalAdmin.classList.add('hidden');
    });
}

if (btnCancelEditGame) {
    btnCancelEditGame.addEventListener('click', () => clearAdminGameForm());
}

window.openQuickEditGameForm = function(gameId) {
    const jogo = cachedGames[gameId];
    if(!jogo) return;
    
    if (modalAdmin) modalAdmin.classList.remove('hidden');
    switchAdminTab('add');

    document.getElementById('g-edit-id').value = gameId;
    document.getElementById('g-title').value = jogo.titulo || "";
    document.getElementById('g-platform').value = jogo.plataforma || "nes";
    document.getElementById('g-category').value = jogo.categoria || "";
    document.getElementById('g-subcategory').value = jogo.subcategoria || "";
    document.getElementById('g-cover').value = jogo.url_capa || "";
    document.getElementById('g-rom').value = jogo.url_rom || "";
    document.getElementById('g-desc').value = jogo.descricao || "";

    if (adminFormTitle) adminFormTitle.textContent = "✏️ Editando Dados do Card";
    if (btnSaveNewGame) btnSaveNewGame.textContent = "Salvar Alterações no Registro 💾";
    if (btnCancelEditGame) btnCancelEditGame.classList.remove('hidden');
};

function clearAdminGameForm() {
    document.getElementById('g-edit-id').value = "";
    document.getElementById('g-title').value = "";
    document.getElementById('g-platform').value = "nes";
    document.getElementById('g-category').value = "";
    document.getElementById('g-subcategory').value = "";
    document.getElementById('g-cover').value = "";
    document.getElementById('g-rom').value = "";
    document.getElementById('g-desc').value = "";

    if (adminFormTitle) adminFormTitle.textContent = "Lançar Novo Card de Jogo";
    if (btnSaveNewGame) btnSaveNewGame.textContent = "Publicar Card no Catálogo 🚀";
    if (btnCancelEditGame) btnCancelEditGame.classList.add('hidden');
}

// --- MENU PRÓPRIO ADM: TAXONOMIA, IMPORTAÇÃO, EXCLUSÃO EM LOTE ---
function buildAdminBulkSelectors(jogos) {
    if (!bulkFilterCategory || !bulkFilterSubcategory) return;
    
    const selectedCat = bulkFilterCategory.value;
    const selectedSub = bulkFilterSubcategory.value;

    const categoriasSet = new Set();
    const subcategoriasSet = new Set();

    for (let id in jogos) {
        if (jogos[id].categoria) categoriasSet.add(jogos[id].categoria);
        if (jogos[id].subcategoria) subcategoriasSet.add(jogos[id].subcategoria);
    }

    bulkFilterCategory.innerHTML = `<option value="">-- Selecione uma Categoria --</option>`;
    categoriasSet.forEach(cat => {
        bulkFilterCategory.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    bulkFilterCategory.value = selectedCat;

    bulkFilterSubcategory.innerHTML = `<option value="">-- Selecione uma Subcategoria --</option>`;
    subcategoriasSet.forEach(sub => {
        bulkFilterSubcategory.innerHTML += `<option value="${sub}">${sub}</option>`;
    });
    bulkFilterSubcategory.value = selectedSub;
}

function renderAdminGamesTableList(jogos) {
    const tableBody = document.getElementById('admin-games-list-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (Object.keys(jogos).length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: var(--text-gray);">Nenhum jogo no catálogo para gerenciamento individual.</td></tr>`;
        return;
    }

    for (let id in jogos) {
        const j = jogos[id];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600; color:white;">${j.titulo}</td>
            <td><span style="color:var(--neon-cyan);">${j.plataforma.toUpperCase()}</span> / ${j.categoria}</td>
            <td>
                <button class="btn-sm" onclick="openQuickEditGameForm('${id}')" style="border-color:var(--neon-cyan); color:var(--neon-cyan); margin-right:5px;">Editar</button>
                <button class="btn-sm" onclick="deleteIndividualGameByAdmin('${id}')">Excluir</button>
            </td>
        `;
        tableBody.appendChild(tr);
    }
}

window.deleteIndividualGameByAdmin = async function(gameId) {
    if (confirm("Tem certeza de que deseja excluir permanentemente este jogo do catálogo?")) {
        await remove(ref(database, `jogos/${gameId}`));
        alert("Jogo deletado do catálogo com sucesso!");
    }
};

// Alteração Nome de Categoria em Lote
if (btnBulkEditCat) {
    btnBulkEditCat.addEventListener('click', async () => {
        const catSelecionada = bulkFilterCategory.value;
        if (!catSelecionada) { alert("Selecione uma Categoria válida no menu acima para renomear!"); return; }

        const novoNome = prompt(`Alterar o nome de todos os jogos da categoria "${catSelecionada}" para:`, catSelecionada);
        if (!novoNome || novoNome.trim() === "" || novoNome.trim() === catSelecionada) return;

        let atualizados = 0;
        const updates = {};
        
        for (let id in cachedGames) {
            if (cachedGames[id].categoria === catSelecionada) {
                updates[`jogos/${id}/categoria`] = novoNome.trim();
                atualizados++;
            }
        }

        if (atualizados > 0) {
            await update(ref(database), updates);
            alert(`Sucesso! ${atualizados} jogos foram migrados para a categoria "${novoNome.trim()}".`);
            bulkFilterCategory.value = "";
        }
    });
}

// Remoção em Lote (Categoria ou Subcategoria)
if (btnBulkDeleteCat) {
    btnBulkDeleteCat.addEventListener('click', async () => {
        const catValue = bulkFilterCategory.value;
        const subValue = bulkFilterSubcategory.value;

        if (!catValue && !subValue) { alert("Você deve selecionar pelo menos uma Categoria ou Subcategoria para deletar em lote."); return; }

        let mensagemConfirmacao = "";
        if (catValue && subValue) mensagemConfirmacao = `TODOS os jogos que pertencem à categoria "${catValue}" E subcategoria "${subValue}" concomitantemente?`;
        else if (catValue) mensagemConfirmacao = `TODOS os jogos contidos na categoria "${catValue}"?`;
        else mensagemConfirmacao = `TODOS os jogos contidos na subcategoria "${subValue}"?`;

        if (confirm(`🚨 ATENÇÃO CRÍTICA!\n\nVocê deseja mesmo EXCLUIR DEFINITIVAMENTE ${mensagemConfirmacao}\n\nEsta operação não pode ser revertida.`)) {
            let deletados = 0;
            for (let id in cachedGames) {
                let match = true;
                if (catValue && cachedGames[id].categoria !== catValue) match = false;
                if (subValue && cachedGames[id].subcategoria !== subValue) match = false;

                if (match) {
                    await remove(ref(database, `jogos/${id}`));
                    deletados++;
                }
            }
            alert(`Ação de lote concluída! ${deletados} jogos foram removidos com sucesso.`);
            bulkFilterCategory.value = "";
            bulkFilterSubcategory.value = "";
        }
    });
}

// Backup / Exportação JSON
if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
        if (Object.keys(cachedGames).length === 0) { alert("O catálogo atual está vazio. Nada para exportar."); return; }
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cachedGames, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `backup_catalogo_games_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });
}

// Importação de Catálogo via JSON
if (importJsonFile) {
    importJsonFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const importedData = JSON.parse(event.target.result);
                if (typeof importedData !== 'object' || importedData === null) { throw new Error("Formato inválido."); }

                if (confirm(`Detectado arquivo de backup contendo novos cards de jogos.\n\nDeseja realizar a mesclagem destes dados no seu banco do Firebase Realtime Database?`)) {
                    const updates = {};
                    for (let gameId in importedData) {
                        const jogo = importedData[gameId];
                        if (jogo.titulo && jogo.plataforma && jogo.url_rom) {
                            updates[`jogos/${gameId}`] = jogo;
                        }
                    }
                    await update(ref(database), updates);
                    alert("Importação estrutural realizada com sucesso!");
                }
            } catch (err) {
                alert("Falha na leitura do arquivo JSON. Verifique se a estrutura está íntegra.\nErro: " + err.message);
            }
            importJsonFile.value = "";
        };
        reader.readAsText(file);
    });
}

// --- LISTA DE USUÁRIOS E BANIMENTOS ---
async function loadAdminUsersTable() {
    const tableBody = document.getElementById('admin-users-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const snapshot = await get(ref(database, 'usuarios'));
    const usuarios = snapshot.val() || {};

    let totalVisiveis = 0;

    for (let uid in usuarios) {
        const p = usuarios[uid].perfil;
        if (!p || await isAdminEmail(p.email)) continue;
        if (p.banido === true) continue;

        totalVisiveis++;
        const statusExclusao = p.solicitou_exclusao ? `<span style="color:#ff4757; font-weight:bold;">⚠️ SOLICITADA</span>` : "Nenhuma";
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.nome} ${p.sobrenome}</td>
            <td>${p.email}</td>
            <td>${p.cidade}</td>
            <td>${statusExclusao}</td>
            <td><button class="btn-sm" onclick="executePurgeUserByAdmin('${uid}')" style="background:#ff4757; color:white;">Expulsar e Limpar</button></td>
        `;
        tableBody.appendChild(tr);
    }

    if (totalVisiveis === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-gray);">Nenhum usuário ativo registrado no sistema.</td></tr>`;
    }
}

window.executePurgeUserByAdmin = async function(userUid) {
    if (confirm("Confirmar banimento definitivo? O usuário desaparecerá da lista, terá seus dados deletados e será bloqueado de entrar no sistema imediatamente.")) {
        try {
            await update(ref(database, `usuarios/${userUid}/perfil`), { 
                banido: true, 
                solicitou_exclusao: false,
                nome: "Usuário",
                sobrenome: "Banido",
                cidade: "Removido"
            });
            
            await remove(ref(database, `usuarios/${userUid}/favoritos`));
            await remove(ref(database, `usuarios/${userUid}/saves`));
            
            alert("Usuário banido e dados removidos com sucesso!");
            loadAdminUsersTable();
        } catch (err) {
            alert("Erro ao executar ação: " + err.message);
        }
    }
};

// --- MOTOR DE INICIALIZAÇÃO DO EMULADOR (EMULATORJS) ---
window.launchGame = function(system, romUrl, gameTitle) {
    if (document.getElementById('catalog-screen')) document.getElementById('catalog-screen').classList.add('hidden');
    const emuScreen = document.getElementById('emulator-screen');
    if (emuScreen) emuScreen.classList.remove('hidden');
    if (document.getElementById('playing-title')) document.getElementById('playing-title').textContent = `Jogando: ${gameTitle}`;

    const wrapper = document.getElementById('player-wrapper-target');
    if (wrapper) wrapper.innerHTML = `<div id="emulator-player"><div id="game-canvas"></div></div>`;

    window.EJS_player = '#game-canvas';
    window.EJS_core = system; 
    window.EJS_gameUrl = romUrl; 
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/latest/data/'; 
    
    window.EJS_startOnLoaded = true; 
    window.EJS_AdUrl = ''; 
    window.EJS_myserver = 'true';
    window.EJS_disableLoadState = false; 
    window.EJS_forceLoadOnStart = true; 

    const sanitizedSaveKey = `${system}_${gameTitle.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const fileSaveName = `${gameTitle.replace(/[^a-zA-Z0-9]/g, "_")}.sav`;

    window.EJS_onLogin = async function() {
        if (!currentUId) return;
        try {
            const snapshot = await get(ref(database, `usuarios/${currentUId}/saves/${sanitizedSaveKey}`));
            if (snapshot.exists()) {
                const base64Data = snapshot.val().dados_base64;
                const binaryString = atob(base64Data);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
                
                if (typeof window.EJS_LoadState === 'function') {
                    window.EJS_LoadState(bytes);
                    console.log("Progresso binário injetado com sucesso!");
                }
            }
        } catch (err) { console.error("Erro na leitura de save:", err); }
    };

    window.EJS_onSaveState = async function(data) {
        if (!currentUId) { alert("Conecte-se em uma conta para sincronizar o progresso!"); return; }
        
        let binary = "";
        const bytes = new Uint8Array(data);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
        const base64String = btoa(binary);

        try {
            await set(ref(database, `usuarios/${currentUId}/saves/${sanitizedSaveKey}`), {
                nome_arquivo: fileSaveName,
                dados_base64: base64String,
                updated_at: Date.now(), 
                atualizado_em: Date.now()
            });
            alert("Progresso arquivado na nuvem com sucesso! 💾🔥");
        } catch (err) { alert("Falha na gravação do save: " + err.message); }
    };

    const script = document.createElement('script');
    script.src = 'https://cdn.emulatorjs.org/latest/data/loader.js';
    script.async = true;
    document.body.appendChild(script);
};

window.uploadAndPlay = function() {
    const fileInput = document.getElementById('rom-upload');
    let system = document.getElementById('system-select') ? document.getElementById('system-select').value : 'nes';
    
    if (!fileInput || fileInput.files.length === 0) { alert("Selecione um arquivo de ROM válido!"); return; }

    const file = fileInput.files[0];
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'smd' || extension === 'gen' || extension === 'md') system = 'segaMD'; 
    else if (extension === 'sms') system = 'segaMS';
    else if (extension === 'gg') system = 'gg';

    if (activeBlobUrl) { URL.revokeObjectURL(activeBlobUrl); }
    activeBlobUrl = URL.createObjectURL(file);
    launchGame(system, activeBlobUrl, file.name);
};

if (document.getElementById('rom-upload')) {
    document.getElementById('rom-upload').addEventListener('change', (e) => {
        const display = document.getElementById('file-name-display');
        if (display) display.textContent = e.target.files.length > 0 ? e.target.files[0].name : "Nenhum arquivo selecionado";
    });
}

window.closeEmulator = function() {
    sessionStorage.setItem('emu_purge_active', 'true');
    window.location.reload();
};

window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('emu_purge_active') === 'true') {
        sessionStorage.removeItem('emu_purge_active');
        if (document.getElementById('emulator-screen')) document.getElementById('emulator-screen').classList.add('hidden');
        if (document.getElementById('catalog-screen')) document.getElementById('catalog-screen').classList.remove('hidden');
    }
});



// =======================================================
// MENU DE NAVEGAÇÃO DINÂMICO (alimentado pelo painel admin)
// Caminho no banco: config/menu
// =======================================================
let cachedMenu = {};
let cachedLayout = {};

function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function safeUrl(url) {
    const u = String(url || "").trim();
    return /^(https?:|mailto:|tel:|\/|#)/i.test(u) ? u : "#";
}

function renderNavbarMenu(menu) {
    const container = document.getElementById('dynamic-menu-links');
    if (!container) return;
    const items = Object.entries(menu || {})
        .map(([id, it]) => ({ id, ...it }))
        .filter(it => it.ativo !== false)
        .sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0));
    if (items.length === 0) return; // mantém os links padrão do HTML
    container.innerHTML = items.map(it =>
        `<a href="${escapeHtml(safeUrl(it.url))}" ${it.novaAba !== false ? 'target="_blank" rel="noopener"' : ''} class="btn-home">${escapeHtml(it.icone || '')} ${escapeHtml(it.rotulo)}</a>`
    ).join('');
}

onValue(ref(database, 'config/menu'), (snap) => {
    cachedMenu = snap.val() || {};
    renderNavbarMenu(cachedMenu);
    if (document.getElementById('admin-menu-section') && !document.getElementById('admin-menu-section').classList.contains('hidden')) renderAdminMenuTable();
});

function resetMenuForm() {
    ['m-edit-id', 'm-label', 'm-icon', 'm-url'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    const ord = document.getElementById('m-order'); if (ord) ord.value = Object.keys(cachedMenu).length + 1;
    const nt = document.getElementById('m-newtab'); if (nt) nt.checked = true;
    const at = document.getElementById('m-active'); if (at) at.checked = true;
    const b = document.getElementById('btn-save-menu-item'); if (b) b.textContent = "Adicionar Item ao Menu ➕";
}

function renderAdminMenuTable() {
    const body = document.getElementById('admin-menu-table-body');
    if (!body) return;
    const items = Object.entries(cachedMenu).map(([id, it]) => ({ id, ...it }))
        .sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0));
    if (items.length === 0) {
        body.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-gray);">Nenhum item cadastrado. O menu padrão está sendo exibido.</td></tr>`;
        return;
    }
    body.innerHTML = items.map(it => `
        <tr>
            <td>${escapeHtml(it.ordem)}</td>
            <td>${escapeHtml(it.icone || '')} ${escapeHtml(it.rotulo)} ${it.ativo === false ? '<em style="color:var(--text-gray)">(oculto)</em>' : ''}</td>
            <td style="word-break:break-all; font-size:0.8rem;">${escapeHtml(it.url)}</td>
            <td>
                <button class="btn-home" data-menu-edit="${it.id}">✏️</button>
                <button class="btn-sm" data-menu-del="${it.id}">❌</button>
            </td>
        </tr>`).join('');
}

document.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-menu-edit]');
    const delBtn = e.target.closest('[data-menu-del]');
    if (!isAdminMode) return;
    if (editBtn) {
        const id = editBtn.dataset.menuEdit; const it = cachedMenu[id]; if (!it) return;
        document.getElementById('m-edit-id').value = id;
        document.getElementById('m-label').value = it.rotulo || "";
        document.getElementById('m-icon').value = it.icone || "";
        document.getElementById('m-url').value = it.url || "";
        document.getElementById('m-order').value = it.ordem || 0;
        document.getElementById('m-newtab').checked = it.novaAba !== false;
        document.getElementById('m-active').checked = it.ativo !== false;
        document.getElementById('btn-save-menu-item').textContent = "Salvar Alterações do Item 💾";
    }
    if (delBtn) {
        if (!confirm("Excluir este item do menu?")) return;
        await remove(ref(database, `config/menu/${delBtn.dataset.menuDel}`));
    }
});

const btnSaveMenuItem = document.getElementById('btn-save-menu-item');
if (btnSaveMenuItem) btnSaveMenuItem.addEventListener('click', async () => {
    if (!isAdminMode) return;
    const rotulo = document.getElementById('m-label').value.trim();
    const url = document.getElementById('m-url').value.trim();
    if (!rotulo || !url) { alert("Preencha o nome e o link do item."); return; }
    const id = document.getElementById('m-edit-id').value || ('item_' + Date.now());
    try {
        await set(ref(database, `config/menu/${id}`), {
            rotulo, url,
            icone: document.getElementById('m-icon').value.trim(),
            ordem: Number(document.getElementById('m-order').value) || 0,
            novaAba: document.getElementById('m-newtab').checked,
            ativo: document.getElementById('m-active').checked
        });
        resetMenuForm();
    } catch (err) { alert("Erro ao salvar: " + err.message); }
});
const btnCancelMenu = document.getElementById('btn-cancel-menu-item');
if (btnCancelMenu) btnCancelMenu.addEventListener('click', resetMenuForm);

const btnImportDefaultMenu = document.getElementById('btn-import-default-menu');
if (btnImportDefaultMenu) btnImportDefaultMenu.addEventListener('click', async () => {
    if (!isAdminMode) return;
    if (Object.keys(cachedMenu).length && !confirm("Isso adicionará os links padrão ao menu atual. Continuar?")) return;
    const links = document.querySelectorAll('#dynamic-menu-links a');
    const base = Object.keys(cachedMenu).length;
    const updates = {};
    links.forEach((a, i) => {
        const txt = a.textContent.trim();
        const m = txt.match(/^(\S+)\s+(.*)$/);
        updates[`item_${Date.now()}_${i}`] = { rotulo: m ? m[2] : txt, icone: m ? m[1] : "", url: a.getAttribute('href'), ordem: base + i + 1, novaAba: a.target === '_blank', ativo: true };
    });
    await update(ref(database, 'config/menu'), updates);
});

// =======================================================
// LAYOUT / VISUAL DO SITE (config/layout)
// =======================================================
const LAYOUT_DEFAULTS = {
    temaPadrao: 'padrao',
    corDestaque: '',
    logoParte1: "Workin'",
    logoParte2: "Store",
    logoQuadrada: '',
    logoRetangular: '',
    mostrarBotaoTema: true,
    rodapeTexto: "© Workin'Store — Todos os direitos reservados.",
    rodapeLinkTexto: '',
    rodapeLinkUrl: '',
    whatsapp: ''
};

function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "");
    return m ? `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}` : null;
}

function applyLayout(cfg) {
    const c = { ...LAYOUT_DEFAULTS, ...(cfg || {}) };
    const root = document.documentElement;

    // Tema padrão (só aplica se o visitante não escolheu um tema manualmente)
    let userTheme = null; try { userTheme = localStorage.getItem('gw-theme'); } catch (e) {}
    if (!userTheme && c.temaPadrao) root.setAttribute('data-theme', c.temaPadrao);

    // Cor de destaque personalizada
    const rgb = hexToRgb(c.corDestaque);
    if (rgb) {
        root.style.setProperty('--accent', c.corDestaque);
        root.style.setProperty('--accent-2', c.corDestaque);
        root.style.setProperty('--accent-strong', c.corDestaque);
        root.style.setProperty('--accent-rgb', rgb);
    } else {
        ['--accent', '--accent-2', '--accent-strong', '--accent-rgb'].forEach(v => root.style.removeProperty(v));
    }

    const logo = document.getElementById('logo-text');
    if (logo) logo.innerHTML = `${escapeHtml(c.logoParte1)}<span>${escapeHtml(c.logoParte2)}</span>`;
    const lq = document.getElementById('logo-square');
    const lw = document.getElementById('logo-wide');
    const okImg = u => /^(https?:|data:image\/)/i.test(String(u || ''));
    if (lq) { if (okImg(c.logoQuadrada)) { lq.src = c.logoQuadrada; lq.classList.remove('hidden'); } else lq.classList.add('hidden'); }
    if (lw) { if (okImg(c.logoRetangular)) { lw.src = c.logoRetangular; lw.classList.remove('hidden'); } else lw.classList.add('hidden'); }
    if (logo) logo.classList.toggle('hidden', okImg(c.logoRetangular));

    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) themeBtn.style.display = c.mostrarBotaoTema === false ? 'none' : '';

    const fText = document.getElementById('footer-attribution-text');
    const fLink = document.getElementById('footer-attribution-link');
    if (fText) fText.textContent = c.rodapeTexto || '';
    if (fLink) {
        if (c.rodapeLinkTexto && c.rodapeLinkUrl) {
            fLink.textContent = c.rodapeLinkTexto;
            fLink.href = safeUrl(c.rodapeLinkUrl);
            fLink.classList.remove('hidden');
        } else fLink.classList.add('hidden');
    }

    const wa = document.getElementById('whatsapp-float');
    const digits = String(c.whatsapp || '').replace(/\D/g, '');
    if (wa) {
        if (digits) { wa.href = `https://wa.me/${digits}`; wa.classList.remove('hidden'); }
        else wa.classList.add('hidden');
    }
}

onValue(ref(database, 'config/layout'), (snap) => {
    cachedLayout = snap.val() || {};
    applyLayout(cachedLayout);
});

function fillLayoutForm() {
    const c = { ...LAYOUT_DEFAULTS, ...cachedLayout };
    const set_ = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ""; };
    set_('l-theme', c.temaPadrao);
    set_('l-accent', c.corDestaque || '#2f8cff');
    document.getElementById('l-accent-enabled').checked = !!c.corDestaque;
    set_('l-logo1', c.logoParte1);
    set_('l-logo2', c.logoParte2);
    document.getElementById('l-show-theme').checked = c.mostrarBotaoTema !== false;
    set_('l-footer-text', c.rodapeTexto);
    set_('l-footer-link-text', c.rodapeLinkTexto);
    set_('l-footer-link-url', c.rodapeLinkUrl);
    set_('l-whatsapp', formatPhone(c.whatsapp));
    set_('l-logo-square', c.logoQuadrada);
    set_('l-logo-wide', c.logoRetangular);
    refreshPreview('l-logo-square'); refreshPreview('l-logo-wide');
}

const btnSaveLayout = document.getElementById('btn-save-layout');
if (btnSaveLayout) btnSaveLayout.addEventListener('click', async () => {
    if (!isAdminMode) return;
    const v = id => document.getElementById(id).value.trim();
    const data = {
        temaPadrao: v('l-theme'),
        corDestaque: document.getElementById('l-accent-enabled').checked ? v('l-accent') : '',
        logoParte1: v('l-logo1'),
        logoParte2: v('l-logo2'),
        mostrarBotaoTema: document.getElementById('l-show-theme').checked,
        rodapeTexto: v('l-footer-text'),
        rodapeLinkTexto: v('l-footer-link-text'),
        rodapeLinkUrl: v('l-footer-link-url'),
        whatsapp: v('l-whatsapp').replace(/\D/g, ''),
        logoQuadrada: v('l-logo-square'),
        logoRetangular: v('l-logo-wide')
    };
    try {
        await set(ref(database, 'config/layout'), data);
        alert("✅ Layout atualizado com sucesso!");
    } catch (err) { alert("Erro ao salvar layout: " + err.message); }
});
const btnResetLayout = document.getElementById('btn-reset-layout');
if (btnResetLayout) btnResetLayout.addEventListener('click', async () => {
    if (!isAdminMode || !confirm("Restaurar o visual padrão do site?")) return;
    await set(ref(database, 'config/layout'), LAYOUT_DEFAULTS);
    fillLayoutForm();
});


// =======================================================
// SPINNER DE LOGIN
// =======================================================
function showLoginSpinner(text) {
    const el = document.getElementById('login-spinner');
    const t = document.getElementById('login-spinner-text');
    if (t && text) t.textContent = text;
    if (el) el.classList.remove('hidden');
}
function hideLoginSpinner() {
    const el = document.getElementById('login-spinner');
    if (el) el.classList.add('hidden');
}

// =======================================================
// MÁSCARA DE WHATSAPP: +55 (88) 99999-9999
// =======================================================
function formatPhone(value) {
    let d = String(value || '').replace(/\D/g, '').slice(0, 13);
    if (!d) return '';
    let out = '+' + d.slice(0, 2);
    if (d.length > 2) out += ' (' + d.slice(2, 4);
    if (d.length > 4) out += ') ';
    const rest = d.slice(4);
    if (rest.length > 0) {
        if (rest.length <= 8) out += rest.length > 4 ? rest.slice(0, 4) + '-' + rest.slice(4) : rest;
        else out += rest.slice(0, 5) + '-' + rest.slice(5);
    }
    return out;
}
document.querySelectorAll('.phone-mask').forEach(inp => {
    inp.addEventListener('input', () => { inp.value = formatPhone(inp.value); });
    inp.addEventListener('keypress', e => { if (e.key.length === 1 && !/\d/.test(e.key)) e.preventDefault(); });
});

// =======================================================
// IMAGENS: LINK OU UPLOAD EM BASE64 (com redimensionamento)
// =======================================================
function fileToBase64(file, maxSize = 512) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) { reject(new Error('Arquivo não é uma imagem.')); return; }
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
        reader.onload = () => {
            if (file.type === 'image/svg+xml' || file.type === 'image/gif') { resolve(reader.result); return; }
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88));
            };
            img.onerror = () => reject(new Error('Imagem inválida.'));
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}
function refreshPreview(inputId) {
    const inp = document.getElementById(inputId);
    const prev = document.getElementById(inputId + '-preview');
    if (!inp || !prev) return;
    const v = inp.value.trim();
    if (/^(https?:|data:image\/)/i.test(v)) { prev.src = v; prev.style.visibility = 'visible'; }
    else if (inputId === 'ap-photo-url') prev.src = "https://win98icon.org/styles/asset/windows98/v1/user_computer-0.png";
    else prev.style.visibility = 'hidden';
}
function bindImagePicker(inputId, fileId, maxSize) {
    const inp = document.getElementById(inputId);
    const file = document.getElementById(fileId);
    if (!inp) return;
    inp.addEventListener('input', () => refreshPreview(inputId));
    if (file) file.addEventListener('change', async () => {
        try { inp.value = await fileToBase64(file.files[0], maxSize); refreshPreview(inputId); }
        catch (err) { alert(err.message); }
        file.value = '';
    });
}
// a prévia da foto do perfil usa o id "ap-photo-preview"
(function fixProfilePreviewId() {
    const p = document.getElementById('ap-photo-preview');
    if (p) p.id = 'ap-photo-url-preview';
})();
bindImagePicker('ap-photo-url', 'ap-photo-file', 400);
bindImagePicker('l-logo-square', 'l-logo-square-file', 256);
bindImagePicker('l-logo-wide', 'l-logo-wide-file', 800);
document.querySelectorAll('[data-clear]').forEach(b => b.addEventListener('click', () => {
    const id = b.getAttribute('data-clear');
    const el = document.getElementById(id);
    if (el) { el.value = ''; refreshPreview(id); }
}));

// =======================================================
// PERFIL DO ADMINISTRADOR
// =======================================================
const DEFAULT_AVATAR = "https://win98icon.org/styles/asset/windows98/v1/user_computer-0.png";
function applyAdminProfileToNavbar(p) {
    p = p || {};
    const display = p.apelido || [p.nome, p.sobrenome].filter(Boolean).join(' ') || "Diretor Admin";
    if (userName) userName.textContent = display;
    if (userAvatar) userAvatar.src = p.foto || (currentUser && currentUser.photoURL) || DEFAULT_AVATAR;
}
async function fillAdminProfileForm() {
    if (!currentUId) return;
    const snap = await get(ref(database, `usuarios/${currentUId}/perfil`));
    const p = snap.exists() ? snap.val() : {};
    const s = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
    s('ap-nome', p.nome); s('ap-sobrenome', p.sobrenome); s('ap-apelido', p.apelido);
    s('ap-cidade', p.cidade); s('ap-whatsapp', formatPhone(p.whatsapp)); s('ap-bio', p.bio);
    s('ap-email', p.email || (currentUser && currentUser.email)); s('ap-photo-url', p.foto);
    refreshPreview('ap-photo-url');
}
const btnSaveAdminProfile = document.getElementById('btn-save-admin-profile');
if (btnSaveAdminProfile) btnSaveAdminProfile.addEventListener('click', async () => {
    if (!isAdminMode || !currentUId) return;
    const v = id => document.getElementById(id).value.trim();
    const data = {
        nome: v('ap-nome'), sobrenome: v('ap-sobrenome'), apelido: v('ap-apelido'),
        cidade: v('ap-cidade'), whatsapp: v('ap-whatsapp').replace(/\D/g, ''),
        bio: v('ap-bio'), foto: v('ap-photo-url'),
        email: currentUser ? currentUser.email : v('ap-email')
    };
    if (!data.nome) { alert("Informe pelo menos o nome."); return; }
    btnSaveAdminProfile.disabled = true;
    try {
        await update(ref(database, `usuarios/${currentUId}/perfil`), data);
        applyAdminProfileToNavbar(data);
        alert("✅ Perfil atualizado com sucesso!");
    } catch (err) { alert("Erro ao salvar perfil: " + err.message); }
    btnSaveAdminProfile.disabled = false;
});
