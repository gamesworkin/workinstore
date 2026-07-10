// app.js

// CONFIGURAÇÃO DO SEU FIREBASE (Substitua com suas credenciais oficiais do Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyD5VJ5pdgBXRD3ODIsbhO9jJcOZ2MnR-3E",
    authDomain: "kits-opl.firebaseapp.com",
    databaseURL: "https://kits-opl-default-rtdb.firebaseio.com",
    projectId: "kits-opl",
    storageBucket: "kits-opl.firebasestorage.app",
    messagingSenderId: "493713565781",
    appId: "1:493713565781:web:f40dc124537e344bc80cdc"
};

// Inicialização estável do Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
const auth = firebase.auth();

// Banco de Ícones e Texto de Gatilhos
const TriggersMap = {
    urgency: `<span class="marketing-badge"><i class="fa-solid fa-fire-flame-curved"></i> Últimas Unidades!</span>`,
    countdown: `<span class="marketing-badge"><i class="fa-solid fa-hourglass-half"></i> Expira em breve!</span>`,
    exclusive: `<span class="marketing-badge"><i class="fa-solid fa-gem"></i> Recomendado pela Comunidade</span>`
};

// Cache local de produtos estruturados em JSON
let localProductsCache = {};

// ========================================================
// LÓGICA DO MENU RESPONSIVO (DROPDOWN INTELEGENTE)
// ========================================================
function toggleResponsiveMenu() {
    const navLinks = document.getElementById('nav-links');
    if(navLinks) navLinks.classList.toggle('active');
}

function closeResponsiveMenu() {
    const navLinks = document.getElementById('nav-links');
    if(navLinks) navLinks.classList.remove('active');
}

// Atualiza o ícone do botão hambúrguer dependendo do nível de acesso
function updateMenuToggleButton(isAdmin) {
    const toggleBtn = document.getElementById('menu-toggle-btn');
    if (!toggleBtn) return;
    
    if (isAdmin) {
        // Se for admin logado: Ícone de Engrenagem
        toggleBtn.innerHTML = `<i class="fa-solid fa-gear"></i>`;
    } else {
        // Se for usuário normal: Ícone de Seta indicando expansão
        toggleBtn.innerHTML = `<i class="fa-solid fa-chevron-down"></i>`;
    }
}

// ========================================================
// CAPTURA AUTOMÁTICA DO ENTER PARA LOGIN
// ========================================================
document.getElementById('login-modal').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        loginAdmin();
    }
});

// ========================================================
// COMPORTAMENTO INTERFACE MÓDULOS & MODAIS
// ========================================================

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.toggle('hidden');
}

function closeProductModal() {
    toggleModal('product-modal');
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('modal-product-title').innerHTML = `<i class="fa-solid fa-square-plus"></i> CADASTRAR NOVO ANÚNCIO`;
    document.getElementById('btn-save-product').innerText = "PUBLICAR ANÚNCIO";
}

// ========================================================
// VALIDAÇÃO EXCLUSIVA DE ADMIN (REQUISITO FUNDAMENTAL)
// ========================================================
auth.onAuthStateChanged((user) => {
    // Só será considerado Administrador se o e-mail for exatamente admin@admin.com
    if (user && user.email === "admin@admin.com") {
        document.body.classList.add('admin-logged');
        updateMenuToggleButton(true); // Engrenagem para Admin
    } else {
        document.body.classList.remove('admin-logged');
        updateMenuToggleButton(false); // Seta para Usuário Comum
        
        // Proteção: Fecha telas administrativas caso um usuário comum tente logar
        document.getElementById('product-modal').classList.add('hidden');
        document.getElementById('dashboard-modal').classList.add('hidden');
    }
    renderProducts();
});

// ========================================================
// SISTEMA DE ENVIO E LOADING DA CONTA
// ========================================================

function loginAdmin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const loginBtn = document.getElementById('btn-submit-login');
    
    if(!email || !password) {
        alert("Preencha todos os campos do terminal de acesso!");
        return;
    }

    // FEEDBACK VISUAL
    loginBtn.innerText = "LOGANDO...";
    loginBtn.disabled = true;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((result) => {
            if(result.user.email !== "admin@admin.com") {
                alert("Login efetuado! Você entrou como Usuário Cliente. Recursos de Admin ocultados.");
            }
            toggleModal('login-modal');
        })
        .catch(error => {
            alert("Falha no acesso: " + error.message);
        })
        .finally(() => {
            loginBtn.innerText = "ENTRAR NO SISTEMA";
            loginBtn.disabled = false;
            document.getElementById('admin-email').value = '';
            document.getElementById('admin-password').value = '';
        });
}

function logoutAdmin() {
    if(confirm("Deseja encerrar a sessão?")) {
        auth.signOut();
    }
}

// ========================================================
// SALVAMENTO / EDIÇÃO NO REALTIME DATABASE (JSON)
// ========================================================

document.getElementById('product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const prodId = document.getElementById('prod-id').value;
    
    const payloadAnuncio = {
        title: document.getElementById('prod-title').value,
        image: document.getElementById('prod-img').value,
        description: document.getElementById('prod-desc').value,
        price: document.getElementById('prod-price').value,
        link: document.getElementById('prod-link').value,
        trigger: document.getElementById('prod-trigger').value
    };

    if (prodId) {
        database.ref(`produtos/${prodId}`).set(payloadAnuncio)
            .then(() => {
                alert('Anúncio updated no banco de dados!');
                closeProductModal();
            })
            .catch(err => alert('Erro na atualização: ' + err.message));
    } else {
        database.ref('produtos').push(payloadAnuncio)
            .then(() => {
                alert('Anúncio adicionado com sucesso!');
                closeProductModal();
            })
            .catch(err => alert('Erro ao salvar no banco: ' + err.message));
    }
});

function openEditMode(productId) {
    const item = localProductsCache[productId];
    if (!item) return;

    document.getElementById('prod-id').value = productId;
    document.getElementById('prod-title').value = item.title;
    document.getElementById('prod-img').value = item.image;
    document.getElementById('prod-desc').value = item.description;
    document.getElementById('prod-price').value = item.price;
    document.getElementById('prod-link').value = item.link;
    document.getElementById('prod-trigger').value = item.trigger;

    document.getElementById('modal-product-title').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> EDITAR ANÚNCIO SELECIONADO`;
    document.getElementById('btn-save-product').innerText = "SALVAR ALTERAÇÕES";
    
    document.getElementById('product-modal').classList.remove('hidden');
}

function deleteProduct(productId) {
    if(confirm("Deseja remover permanentemente este anúncio da base de dados?")) {
        database.ref(`produtos/${productId}`).remove()
            .then(() => alert("Item deletado com sucesso!"))
            .catch(error => alert("Erro ao deletar: " + error.message));
    }
}

// ========================================================
// SINCRONIZAÇÃO EM TEMPO REAL E RENDERIZAÇÃO
// ========================================================

function renderProducts() {
    const mainGrid = document.getElementById('products-grid');
    const tableBody = document.getElementById('admin-table-body');
    
    database.ref('produtos').off();
    database.ref('produtos').on('value', (snapshot) => {
        mainGrid.innerHTML = '';
        tableBody.innerHTML = '';
        
        const data = snapshot.val();
        localProductsCache = data || {}; 
        
        const isAdmin = document.body.classList.contains('admin-logged');
        
        if (data) {
            Object.keys(data).forEach((id) => {
                const item = data[id];
                const badge = TriggersMap[item.trigger] || '';
                
                let cardControls = '';
                if(isAdmin) {
                    cardControls = `
                        <div class="admin-card-controls">
                            <button class="card-action-btn edit" onclick="openEditMode('${id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                            <button class="card-action-btn delete" onclick="deleteProduct('${id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    `;
                }

                const cardHTML = `
                    <div class="product-card">
                        ${cardControls}
                        <img src="${item.image}" alt="${item.title}" loading="lazy">
                        <div class="product-info">
                            ${badge}
                            <h3>${item.title}</h3>
                            <p>${item.description}</p>
                            <div class="price">R$ ${parseFloat(item.price).toFixed(2)}</div>
                            <a href="${item.link}" target="_blank" class="buy-btn">Comprar Agora</a>
                        </div>
                    </div>
                `;
                mainGrid.innerHTML += cardHTML;

                // Linhas do Menu Geral Dashboard
                const triggerText = item.trigger !== 'none' ? item.trigger.toUpperCase() : 'NENHUM';
                const rowHTML = `
                    <tr>
                        <td><img src="${item.image}"></td>
                        <td><strong>${item.title}</strong></td>
                        <td style="color:#00ff66;">R$ ${parseFloat(item.price).toFixed(2)}</td>
                        <td><span style="font-size:12px; color:#ff0055;">${triggerText}</span></td>
                        <td>
                            <button class="card-action-btn edit" onclick="toggleModal('dashboard-modal'); openEditMode('${id}')"><i class="fa-solid fa-pen"></i></button>
                            <button class="card-action-btn delete" onclick="deleteProduct('${id}')"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += rowHTML;
            });

            // ========================================================
            // ADOÇÃO NOVA: BLOQUEIO DE BOTÃO DIREITO APENAS NOS CARDS
            // ========================================================
            const cards = document.querySelectorAll('.product-card');
            cards.forEach(card => {
                card.addEventListener('contextmenu', function(event) {
                    event.preventDefault(); // Cancela a abertura do menu de inspeção nativo
                });
            });

        } else {
            mainGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#555;">Nenhum anúncio carregado.</p>`;
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#555;">Nenhum registro para exibir.</td></tr>`;
        }
    });
}

// ========================================================
// IMPORTAÇÃO E EXPORTAÇÃO EM JSON
// ========================================================

function exportDataJSON() {
    if (Object.keys(localProductsCache).length === 0) {
        alert("Não existem anúncios cadastrados para exportação.");
        return;
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localProductsCache, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "backup_anuncios_gamer.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importDataJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (confirm("Isto irá mesclar os itens importados com seu banco de dados atual. Confirmar?")) {
                Object.keys(importedData).forEach(key => {
                    database.ref('produtos').push(importedData[key]);
                });
                alert("Importação de dados JSON concluída!");
                document.getElementById('import-file').value = '';
            }
        } catch (err) {
            alert("Erro: Arquivo JSON inválido. " + err.message);
        }
    };
    reader.readAsText(file);
}
