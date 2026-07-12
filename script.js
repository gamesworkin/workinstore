// CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDiAP2IvsfPac29qzFA71sbLYuizVxZ9HQ",
  authDomain: "portal-workin-store.firebaseapp.com",
  databaseURL: "https://portal-workin-store-default-rtdb.firebaseio.com",
  projectId: "portal-workin-store",
  storageBucket: "portal-workin-store.firebasestorage.app",
  messagingSenderId: "803334158041",
  appId: "1:803334158041:web:5ef4069e7ec3a5973970c8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// --- Navegação Mobile ---
function toggleMenu() {
    const nav = document.getElementById('nav-links');
    nav.classList.toggle('active');
}

// --- Lógica de Login ---
const loginBtn = document.getElementById('login-btn');
const loginModal = document.getElementById('modal-admin');

async function processarLogin() {
    const email = document.getElementById('email-admin').value;
    const pass = document.getElementById('password-admin').value;
    
    loginBtn.innerText = "Logando...";
    loginBtn.disabled = true;

    try {
        await auth.signInWithEmailAndPassword(email, pass);
        location.reload();
    } catch (err) {
        alert("Erro: " + err.message);
        loginBtn.innerText = "Entrar";
        loginBtn.disabled = false;
    }
}

loginBtn.addEventListener('click', processarLogin);
document.getElementById('email-admin').addEventListener('keypress', (e) => { if (e.key === 'Enter') processarLogin(); });
document.getElementById('password-admin').addEventListener('keypress', (e) => { if (e.key === 'Enter') processarLogin(); });

// --- Gestão de Conteúdo ---
let editId = null;

function renderizarPortal() {
    db.ref('conteudo').on('value', (snapshot) => {
        const data = snapshot.val() || {};
        
        // Render Cabeçalho
        const nav = document.getElementById('menu-items');
        const listMenu = document.getElementById('lista-menu-admin');
        nav.innerHTML = ''; listMenu.innerHTML = '';
        
        const menuArray = Object.entries(data.menu || {}).sort((a,b) => (a[1].ordem || 0) - (b[1].ordem || 0));
        menuArray.forEach(([id, item]) => {
            nav.innerHTML += `<li><a onclick="abrirMenu('${item.nome.replace(/'/g, "\\'")}', '${item.valor.replace(/'/g, "\\'")}', '${item.tipo}'); toggleMenu();">${item.nome}</a></li>`;
            listMenu.innerHTML += `<li>${item.nome} <button onclick="editar('menu', '${id}')" class="btn-subtle">Editar</button> <button onclick="deletar('menu/${id}')" class="btn-subtle">Excluir</button></li>`;
        });

        // Render Cards
        const grid = document.getElementById('servicos');
        const listCards = document.getElementById('lista-cards-admin');
        grid.innerHTML = ''; listCards.innerHTML = '';
        
        const cardsArray = Object.entries(data.cards || {}).sort((a,b) => (a[1].ordem || 0) - (b[1].ordem || 0));
        cardsArray.forEach(([id, c]) => {
            grid.innerHTML += `
                <div class="card" onclick="abrirModalServico('${c.titulo.replace(/'/g, "\\'")}', '${c.desc.replace(/'/g, "\\'")}', '${c.logo}', '${c.link}')">
                    <img src="${c.logo}" style="width:40px; margin-bottom:10px;">
                    <h3>${c.titulo}</h3>
                </div>`;
            listCards.innerHTML += `<li>${c.titulo} <button onclick="editar('cards', '${id}')" class="btn-subtle">Editar</button> <button onclick="deletar('cards/${id}')" class="btn-subtle">Excluir</button></li>`;
        });
    });
}

function salvarMenu() {
    const data = { 
        nome: document.getElementById('menu-nome').value, 
        valor: document.getElementById('menu-valor').value, 
        ordem: parseInt(document.getElementById('menu-ordem').value) || 0,
        tipo: document.querySelector('input[name="tipo"]:checked').value 
    };
    if(editId) { db.ref('conteudo/menu/' + editId).set(data); editId = null; alert("Editado com sucesso!"); }
    else { db.ref('conteudo/menu').push(data); alert("Adicionado com sucesso!"); }
}

function salvarCard() {
    const data = { 
        titulo: document.getElementById('card-titulo').value, 
        logo: document.getElementById('card-logo').value, 
        ordem: parseInt(document.getElementById('card-ordem').value) || 0,
        desc: document.getElementById('card-desc').value, 
        link: document.getElementById('card-link').value 
    };
    if(editId) { db.ref('conteudo/cards/' + editId).set(data); editId = null; alert("Editado com sucesso!"); }
    else { db.ref('conteudo/cards').push(data); alert("Adicionado com sucesso!"); }
}

function editar(tipo, id) {
    editId = id;
    db.ref('conteudo/' + tipo + '/' + id).once('value', snap => {
        const item = snap.val();
        if(tipo === 'menu') { 
            document.getElementById('menu-nome').value = item.nome; 
            document.getElementById('menu-valor').value = item.valor; 
            document.getElementById('menu-ordem').value = item.ordem; 
        } else { 
            document.getElementById('card-titulo').value = item.titulo; 
            document.getElementById('card-logo').value = item.logo; 
            document.getElementById('card-ordem').value = item.ordem; 
            document.getElementById('card-desc').value = item.desc; 
            document.getElementById('card-link').value = item.link; 
        }
    });
}

function deletar(path) { if(confirm("Confirmar exclusão?")) db.ref('conteudo/' + path).remove(); }

// --- Modais ---
function abrirMenu(nome, valor, tipo) {
    if (tipo === 'link') window.open(valor, '_blank');
    else { document.getElementById('modal-body').innerHTML = `<h2>${nome}</h2><p style="margin-top:20px;">${valor}</p>`; document.getElementById('modal-generic').style.display = 'flex'; }
}

function abrirModalServico(titulo, desc, logo, link) {
    document.getElementById('modal-body').innerHTML = `
        <img src="${logo}" style="width:60px; margin-bottom:15px;">
        <h2>${titulo}</h2>
        <p style="margin: 20px 0;">${desc}</p>
        <button class="btn-neon" onclick="window.open('${link}', '_blank')">Acessar</button>
    `;
    document.getElementById('modal-generic').style.display = 'flex';
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

// --- Autenticação ---
auth.onAuthStateChanged(user => {
    const panel = document.getElementById('admin-panel');
    const btn = document.getElementById('btn-admin');
    if (user) {
        panel.classList.remove('hidden');
        btn.innerText = "Logout";
        btn.onclick = () => auth.signOut().then(() => location.reload());
    } else {
        btn.onclick = () => loginModal.style.display = 'flex';
    }
});

function exportarDados() {
    db.ref('conteudo').once('value').then(snap => {
        const blob = new Blob([JSON.stringify(snap.val())], {type: "application/json"});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "backup.json"; a.click();
    });
}

function importarDados() {
    const input = prompt("Cole o JSON da estrutura:");
    if(input) db.ref('conteudo').set(JSON.parse(input)).then(() => alert("Dados importados!"));
}

renderizarPortal();
