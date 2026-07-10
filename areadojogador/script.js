// ==========================================================================
// CONFIGURAÇÃO DO FIREBASE (Substitua pelos dados do seu Console Firebase)
// ==========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyBu7DKMzV-LwEKcnDYK7Y-1q9pNSCHE7jE",
    authDomain: "pre-venda-4168c.firebaseapp.com",
    databaseURL: "https://pre-venda-4168c-default-rtdb.firebaseio.com/",
    projectId: "pre-venda-4168c",
    storageBucket: "pre-venda-4168c.firebasestorage.app",
    messagingSenderId: "113812783935",
    appId: "1:113812783935:web:2b1229abdd35be7b73898a"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

const GOOGLE_WEB_APP_URL = "COLE_AQUI_O_LINK_DO_APP_DA_WEB_DO_GOOGLE";

// Elementos HTML
const viewAuth = document.getElementById('view-auth');
const viewCliente = document.getElementById('view-cliente');
const viewClienteBloqueado = document.getElementById('view-cliente-bloqueado');
const viewAdmin = document.getElementById('view-admin');
const modalFormEnvio = document.getElementById('modal-formulario-envio');
const modalDetailsContainerGamer = document.getElementById('modal-details-container-gamer');
const modalDetalhesJogo = document.getElementById('modal-detalhes-jogo');
const modalEditarPerfil = document.getElementById('modal-editar-perfil');
const modalEsqueciSenha = document.getElementById('modal-esqueci-senha');
const gridCardsCliente = document.getElementById('grid-cards-cliente');
const listaUsuariosAdmin = document.getElementById('lista-usuarios-admin');
const listaCardsCriados = document.getElementById('lista-cards-criados');
const inputWhatsApp = document.getElementById('cad-whatsapp');
const perfWhatsApp = document.getElementById('perf-whatsapp');
const btnRetrairVitrine = document.getElementById('btn-retrair-vitrine');
const wrapperRetratilVitrine = document.getElementById('wrapper-retratil-vitrine');

let usuarioLogadoUid = null;
let dadosClienteAtual = {};
let filtroAdminAtual = "pendentes";
let comprovanteBase64Global = "";

// Sistema de Sanfona para recolher a vitrine de compras da Dashboard
if (btnRetrairVitrine && wrapperRetratilVitrine) {
    btnRetrairVitrine.addEventListener('click', () => {
        wrapperRetratilVitrine.classList.toggle('escondido');
        if (wrapperRetratilVitrine.classList.contains('escondido')) {
            btnRetrairVitrine.innerText = "Exibir Vitrine";
        } else {
            btnRetrairVitrine.innerText = "Ocultar Vitrine";
        }
    });
}

// Máscaras Dinâmicas para WhatsApp (Cadastro e Perfil)
function aplicarMascaraWhats(elemento) {
    if (!elemento) return;
    let value = elemento.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 6) { value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`; }
    else if (value.length > 2) { value = `(${value.slice(0, 2)}) ${value.slice(2)}`; }
    else if (value.length > 0) { value = `(${value}`; }
    elemento.value = value;
}

if (inputWhatsApp) {
    inputWhatsApp.addEventListener('input', (e) => aplicarMascaraWhats(e.target));
}
if (perfWhatsApp) {
    perfWhatsApp.addEventListener('input', (e) => aplicarMascaraWhats(e.target));
}

// Criptografia Simples Visual de Senha em Tela
const loginShadowPass = document.getElementById('login-shadow-pass');
const loginSenhaReal = document.getElementById('login-senha');
if (loginShadowPass && loginSenhaReal) {
    loginShadowPass.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length < loginSenhaReal.value.length) {
            loginSenhaReal.value = loginSenhaReal.value.slice(0, val.length);
        } else if (val.length > loginSenhaReal.value.length) {
            const charAdicionado = val.slice(-1);
            if (charAdicionado !== "•") loginSenhaReal.value += charAdicionado;
        }
        loginShadowPass.value = "•".repeat(loginSenhaReal.value.length);
    });
}

function validarProvedorEmail(email) {
    const emailLimpo = email.trim().toLowerCase();
    if (emailLimpo === "teste@teste.com") return true;
    const provedoresValidos = ["gmail.com", "hotmail.com", "outlook.com", "outlook.com.br", "yahoo.com", "yahoo.com.br", "icloud.com", "live.com", "uol.com.br", "terra.com.br", "bol.com.br"];
    const dominio = emailLimpo.split('@')[1];
    return provedoresValidos.includes(dominio);
}

function irParaTela(tela) {
    if (viewAuth) viewAuth.classList.remove('active');
    if (viewCliente) viewCliente.classList.remove('active');
    if (viewClienteBloqueado) viewClienteBloqueado.classList.remove('active');
    if (viewAdmin) viewAdmin.classList.remove('active');
    if (tela) tela.classList.add('active');
}

// Chaves de Abas Login/Cadastro
const tabLogin = document.getElementById('tab-login');
const tabCadastro = document.getElementById('tab-cadastro');
if (tabLogin && tabCadastro) {
    tabLogin.addEventListener('click', () => {
        document.getElementById('form-login').classList.add('active');
        document.getElementById('form-cadastro-auth').classList.remove('active');
        tabLogin.classList.add('active');
        tabCadastro.classList.remove('active');
    });
    tabCadastro.addEventListener('click', () => {
        document.getElementById('form-cadastro-auth').classList.add('active');
        document.getElementById('form-login').classList.remove('active');
        tabCadastro.classList.add('active');
        tabLogin.classList.remove('active');
    });
}

// Configuração das 3 Abas do Admin
const tabSolicPendentes = document.getElementById('tab-solic-pendentes');
const tabSolicConcluidos = document.getElementById('tab-solic-concluidos');
const tabSolicCadastrados = document.getElementById('tab-solic-cadastrados');

if (tabSolicPendentes && tabSolicConcluidos && tabSolicCadastrados) {
    tabSolicPendentes.addEventListener('click', () => {
        filtroAdminAtual = "pendentes";
        tabSolicPendentes.classList.add('active');
        tabSolicConcluidos.classList.remove('active');
        tabSolicCadastrados.classList.remove('active');
        document.getElementById('container-reset-pre-venda').style.display = "none";
        inicializarPainelAdmin();
    });
    tabSolicConcluidos.addEventListener('click', () => {
        filtroAdminAtual = "concluidos";
        tabSolicConcluidos.classList.add('active');
        tabSolicPendentes.classList.remove('active');
        tabSolicCadastrados.classList.remove('active');
        document.getElementById('container-reset-pre-venda').style.display = "block";
        inicializarPainelAdmin();
    });
    tabSolicCadastrados.addEventListener('click', () => {
        filtroAdminAtual = "cadastrados";
        tabSolicCadastrados.classList.add('active');
        tabSolicPendentes.classList.remove('active');
        tabSolicConcluidos.classList.remove('active');
        document.getElementById('container-reset-pre-venda').style.display = "none";
        inicializarPainelAdmin();
    });
}

// ==========================================================================
// MONITOR DE SESSÃO COM SENSOR ADAPTADO CONTRA MÚLTIPLAS COMPRAS
// ==========================================================================
auth.onAuthStateChanged(user => {
    if (user) {
        usuarioLogadoUid = user.uid;
        if (user.email === "admin@admin.com") {
            irParaTela(viewAdmin);
            inicializarPainelAdmin();
            ouvirCardsGlobaisAdmin();
            ouvirEPovoarMenuVisualAdmin(); 
        } else {
            // Escuta activa (.on) para sincronizar e ocultar patches comprados na vitrine imediatamente
            database.ref('usuarios/' + user.uid).on('value', snapshot => {
                const dados = snapshot.val();
                if (dados) {
                    dadosClienteAtual = dados;

                    if (dados.status_cadastro === "solicitou_exclusao") {
                        irParaTela(viewClienteBloqueado);
                        return;
                    }

                    const displayNameElem = document.getElementById('user-display-name');
                    if (displayNameElem) {
                        displayNameElem.innerText = `${dados.nome} ${dados.sobrenome}`;
                    }
                    
                    const areaPendente = document.getElementById('area-compra-pendente');
                    const caixaAnalise = document.getElementById('caixa-alerta-analise-comprovante');

                    const temPedidosPendentes = dados.pedidos && Object.keys(dadosClienteAtual.pedidos).length > 0;

                    if (temPedidosPendentes) {
                        if (areaPendente) areaPendente.style.display = "block";
                        if (caixaAnalise) caixaAnalise.style.display = "block";
                    } else {
                        if (caixaAnalise) caixaAnalise.style.display = "none";
                    }
                    
                    povoarVitrineDeVendasCliente(dados.jogos_liberados || {});
                    irParaTela(viewCliente);
                    ouvirCardsDoCliente(user.uid);
                    ouvirEConstruunMenuCliente(); 
                    inicializarBotaoWhatsApp();
                }
            });
        }
    } else {
        usuarioLogadoUid = null;
        irParaTela(viewAuth);
    }
});

// FUNÇÃO REESTRUTURADA COM DUPLA CHECAGEM: Oculta itens comprados ou que já estão na fila de análise
function povoarVitrineDeVendasCliente(jogosLiberadosUsuario) {
    const areaPendente = document.getElementById('area-compra-pendente');
    const containerVitrine = document.getElementById('grid-vitrine-vendas');
    if (!containerVitrine || !areaPendente) return;
    
    database.ref('cards_disponiveis').once('value', snapshot => {
        const cardsGlobais = snapshot.val();
        if (!cardsGlobais) { areaPendente.style.display = "none"; return; }
        
        containerVitrine.innerHTML = "";
        let totalDisponiveisVenda = 0;

        // Lista os IDs de patches que possuem pedidos em análise
        const idsPatchesComPedidoPendente = [];
        if (dadosClienteAtual.pedidos) {
            Object.keys(dadosClienteAtual.pedidos).forEach(pId => {
                const p = dadosClienteAtual.pedidos[pId];
                if (p.id_card_comprado) {
                    idsPatchesComPedidoPendente.push(p.id_card_comprado);
                }
            });
        }

        Object.keys(cardsGlobais).forEach(cardId => {
            const jaAdquirido = jogosLiberadosUsuario[cardId] === true;
            const jaEmAnalise = idsPatchesComPedidoPendente.includes(cardId);

            // Regra: só renderiza o card na vitrine se não foi comprado E não está em análise
            if (!jaAdquirido && !jaEmAnalise) {
                totalDisponiveisVenda++;
                const cardVitrine = document.createElement('div');
                cardVitrine.className = 'game-card';
                cardVitrine.style.border = "1px dashed #242f41";
                
                const precoExibicao = cardsGlobais[cardId].preco || "R$ 10,00";
                
                cardVitrine.innerHTML = `
                    <img src="${cardsGlobais[cardId].capa_url}" style="opacity: 0.65;">
                    <h4 style="color:#aaa;">[Disponível] ${cardsGlobais[cardId].titulo}</h4>
                    <div style="position:absolute; top:10px; right:10px; background:#00ff66; color:#000; font-size:0.7rem; font-weight:bold; padding:3px 6px; border-radius:3px;">${precoExibicao}</div>
                `;
                cardVitrine.onclick = () => abrirModalJogo(cardsGlobais[cardId], true, cardId);
                containerVitrine.appendChild(cardVitrine);
            }
        });

        const temPedidos = dadosClienteAtual.pedidos && Object.keys(dadosClienteAtual.pedidos).length > 0;

        if (totalDisponiveisVenda > 0 || temPedidos) {
            areaPendente.style.display = "block";
        } else {
            areaPendente.style.display = "none";
        }
    });
}

function fecharModalJogo() { 
    if (modalDetailsContainerGamer) modalDetailsContainerGamer.classList.remove('active'); 
}

// ==========================================================================
// SISTEMA DE CÓPIA BLINDADO CORRIGIDO (SEM ERROS DE EXECUÇÃO)
// ==========================================================================
function ejecutarCopiaGamerBlindada(textoParaCopiar, elementoBotao) {
    const textoOriginal = elementoBotao.innerHTML;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textoParaCopiar).then(() => {
            elementoBotao.innerHTML = "✅ Copiado";
            setTimeout(() => { elementoBotao.innerHTML = textoOriginal; }, 2000);
        }).catch(() => ejecutarMetodoCopiaAntigo(textoParaCopiar, elementoBotao, textoOriginal));
    } else {
        executarMetodoCopiaAntigo(textoParaCopiar, elementoBotao, textoOriginal);
    }
}

function ejecutarMetodoCopiaAntigo(texto, botao, textoOrig) {
    const textarea = document.createElement("textarea");
    textarea.value = texto;
    textarea.style.position = "fixed"; 
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try { 
        document.execCommand("copy"); 
        botao.innerHTML = "✅ Copiado"; 
    } catch (err) {
        console.error("Falha ao copiar texto", err);
    }
    document.body.removeChild(textarea);
    setTimeout(() => { botao.innerHTML = textoOrig; }, 2000);
}

function abrirModalJogo(card, modoLojaVenda = false, cardId = "") {
    const imgCapa = document.getElementById('modal-jogo-capa');
    if (!imgCapa) return;
    imgCapa.src = card.capa_url;
    document.getElementById('modal-jogo-titulo').innerText = card.titulo;
    document.getElementById('modal-jogo-descricao').innerText = card.descricao;
    imgCapa.addEventListener('dragstart', (e) => e.preventDefault());

    const containerSenha = document.getElementById('container-senha-protegida-modal');
    const btnRevelarSenha = document.getElementById('btn-revelar-senha-modal');
    const areaTextoSenha = document.getElementById('area-texto-senha-secreta');
    const textoSenhaReal = document.getElementById('texto-senha-secreta-real');
    const btnCopiarSenha = document.getElementById('btn-copiar-senha-modal');
    const containerDownloads = document.getElementById('modal-jogo-botoes');
    const btnAdquirirLoja = document.getElementById('btn-adquirir-patch-vitrine');
    
    const blocoPixPreview = document.getElementById('bloco-pix-dinamico-preview');
    const txtPixPreviewReal = document.getElementById('texto-pix-dinamico-preview-real');
    const btnCopiarPixPreview = document.getElementById('btn-copiar-pix-preview-dinamico');

    if (btnRevelarSenha) btnRevelarSenha.style.display = "block";
    if (areaTextoSenha) areaTextoSenha.style.display = "none";
    if (containerSenha) containerSenha.style.display = "none";
    if (containerDownloads) containerDownloads.style.display = "none";
    if (btnAdquirirLoja) btnAdquirirLoja.style.display = "none";
    if (blocoPixPreview) blocoPixPreview.style.display = "none";

    const precoFinalCard = card.preco || "R$ 10,00";
    const pixFinalCard = card.pix || "88988470190";

    if (modoLojaVenda) {
        if (txtPixPreviewReal) txtPixPreviewReal.innerText = pixFinalCard;
        if (blocoPixPreview) blocoPixPreview.style.display = "block";
        if (btnCopiarPixPreview) {
            btnCopiarPixPreview.onclick = (e) => { 
                e.stopPropagation();
                ejecutarCopiaGamerBlindada(pixFinalCard, btnCopiarPixPreview); 
            };
        }

        document.getElementById('texto-preco-botao-dinamico').innerText = precoFinalCard;
        if (btnAdquirirLoja) btnAdquirirLoja.style.display = "block";
        
        if (btnAdquirirLoja) {
            btnAdquirirLoja.onclick = () => {
                fecharModalJogo();
                document.getElementById('id-card-escolhido-compra').value = cardId;
                document.getElementById('titulo-envio-comprovante-dinamico').innerText = `Adquirir: ${card.titulo}`;
                document.getElementById('texto-preco-modal-checkout').innerText = precoFinalCard;
                document.getElementById('texto-chave-pix-checkout').innerText = pixFinalCard;
                
                comprovanteBase64Global = "";
                if (fileInfoElement) fileInfoElement.innerText = "Nenhum arquivo selecionado";
                if (inputComprovanteElement) inputComprovanteElement.value = "";
                
                const btnCopiarCheckout = document.getElementById('btn-copiar-pix-checkout');
                if (btnCopiarCheckout) {
                    btnCopiarCheckout.onclick = () => {
                        ejecutarCopiaGamerBlindada(pixFinalCard, btnCopiarCheckout);
                    };
                }
                if (modalFormEnvio) modalFormEnvio.classList.add('active');
            };
        }
    } else {
        if (containerDownloads) containerDownloads.style.display = "flex";
        if (card.senha_patch && card.senha_patch.trim() !== "") {
            if (textoSenhaReal) textoSenhaReal.innerText = card.senha_patch.trim();
            if (containerSenha) containerSenha.style.display = "block";
            if (btnRevelarSenha && areaTextoSenha) {
                btnRevelarSenha.onclick = () => { btnRevelarSenha.style.display = "none"; areaTextoSenha.style.display = "block"; };
            }
            if (btnCopiarSenha && textoSenhaReal) {
                btnCopiarSenha.onclick = () => { 
                    ejecutarCopiaGamerBlindada(textoSenhaReal.innerText, btnCopiarSenha); 
                };
            }
        }
        
        if (containerDownloads) {
            containerDownloads.innerHTML = "";
            if (card.botoes) {
                card.botoes.forEach(btn => {
                    const buttonElement = document.createElement('button');
                    buttonElement.className = 'btn-download-dinamico';
                    buttonElement.innerText = btn.texto;
                    buttonElement.style.width = "100%";
                    buttonElement.style.cursor = "pointer";
                    buttonElement.addEventListener('dragstart', (e) => e.preventDefault());
                    buttonElement.addEventListener('click', () => { window.open(btn.url, '_blank'); });
                    containerDownloads.appendChild(buttonElement);
                });
            }
        }
    }
    if (modalDetailsContainerGamer) modalDetailsContainerGamer.classList.add('active');
}

function alimentarSelectComCards(selectElement, jogosJaLiberados = {}) {
    if (!selectElement) return;
    database.ref('cards_disponiveis').once('value', snapshot => {
        const cards = snapshot.val() || {};
        Object.keys(cards).forEach(cardId => {
            const opt = document.createElement('option'); opt.value = cardId;
            opt.innerText = cards[cardId].titulo + (jogosJaLiberados[cardId] ? " (Ativo)" : "");
            selectElement.appendChild(opt);
        });
    });
}

function ouvirCardsDoCliente(uid) {
    if (!gridCardsCliente) return;
    database.ref(`usuarios/${uid}/jogos_liberados`).on('value', snapshotLiberados => {
        gridCardsCliente.innerHTML = "";
        const liberados = snapshotLiberados.val() || {};
        const chavesLiberadas = Object.keys(liberados);

        chavesLiberadas.forEach(cardId => {
            database.ref(`cards_disponiveis/${cardId}`).once('value', cardSnap => {
                const card = cardSnap.val();
                if (card) {
                    const cardElement = document.createElement('div');
                    cardElement.className = 'game-card';
                    cardElement.innerHTML = `<img src="${card.capa_url}"><h4>${card.titulo}</h4>`;
                    cardElement.addEventListener('contextmenu', (e) => { e.preventDefault(); return false; });
                    cardElement.addEventListener('click', () => abrirModalJogo(card, false));
                    gridCardsCliente.appendChild(cardElement);
                }
            });
        });
    });
}

function ouvirEConstruunMenuCliente() {
    const menuContainer = document.getElementById('area-menu-dinamico');
    const linksList = document.getElementById('container-links-menu');
    if (!linksList || !menuContainer) return;

    database.ref('configuracao_menu_json').on('value', snapshot => {
        linksList.innerHTML = ""; 
        const jsonString = snapshot.val() || "";
        if (!jsonString.trim()) { menuContainer.style.display = "none"; return; }
        try {
            const categorias = JSON.parse(jsonString);
            if (Array.isArray(categorias) && categorias.length > 0) {
                categorias.forEach(item => {
                    const liCat = document.createElement('li'); 
                    liCat.className = 'nav-dinamica-item';
                    
                    const aCat = document.createElement('a'); 
                    aCat.className = 'nav-link-item'; 
                    aCat.innerText = item.categoria;
                    
                    if (item.tipo === "link" && item.url_categoria) { 
                        aCat.href = item.url_categoria; 
                        aCat.target = "_blank"; 
                    } else if (item.tipo === "menu") {
                        aCat.href = "javascript:void(0);";
                        
                        liCat.addEventListener('click', (e) => {
                            e.stopPropagation();
                            document.querySelectorAll('.nav-dinamica-item').forEach(el => {
                                if (el !== liCat) el.classList.remove('submenu-visivel');
                            });
                            liCat.classList.toggle('submenu-visivel');
                        });
                    }
                    liCat.appendChild(aCat);
                    
                    if (item.tipo !== "link" && item.subcategorias && Array.isArray(item.subcategorias) && item.subcategorias.length > 0) {
                        const ulSub = document.createElement('ul'); 
                        ulSub.className = 'submenu-dinamico';
                        item.subcategorias.forEach(sub => {
                            const liSub = document.createElement('li'); 
                            const aSub = document.createElement('a');
                            aSub.innerText = sub.texto; 
                            aSub.href = sub.url; 
                            aSub.target = "_blank";
                            
                            aSub.addEventListener('click', (e) => { e.stopPropagation(); });
                            
                            liSub.appendChild(aSub); 
                            ulSub.appendChild(liSub);
                        });
                        liCat.appendChild(ulSub);
                    }
                    linksList.appendChild(liCat);
                });
                menuContainer.style.display = "block";
            } else { menuContainer.style.display = "none"; }
        } catch (e) { menuContainer.style.display = "none"; }
    });
}

document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dinamica-item').forEach(el => el.classList.remove('submenu-visivel'));
});

function inicializarBotaoWhatsApp() {
    const whatsappNumero = "5588988470190"; 
    const btnWhats = document.getElementById('btn-whatsapp-flutuante');
    if (btnWhats) {
        btnWhats.href = `https://api.whatsapp.com/send?phone=${whatsappNumero}&text=Ol%C3%A1,%20preciso%20de%20ajuda%20no%20Hub!`;
    }
}

function ouvirEPovoarMenuVisualAdmin() {
    const containerVisual = document.getElementById('construtor-menu-visual-container');
    if (!containerVisual) return;
    database.ref('configuracao_menu_json').once('value', snapshot => {
        containerVisual.innerHTML = ""; const rawJson = snapshot.val() || "";
        if (!rawJson.trim()) return;
        try {
            const categoriasData = JSON.parse(rawJson);
            if (Array.isArray(categoriasData)) {
                categoriasData.forEach(cat => {
                    adicionarBlocoCategoriaVisual(cat.categoria, cat.subcategorias, cat.tipo || "menu", cat.url_categoria || "");
                });
            }
        } catch (e) {}
    });
}

function adicionarBlocoCategoriaVisual(nomeCategoria = "", subcategoriasArr = [], tipoCategoria = "menu", urlCategoria = "") {
    const containerVisual = document.getElementById('construtor-menu-visual-container');
    if (!containerVisual) return;
    const blocoId = 'cat-' + Date.now() + Math.floor(Math.random() * 100);
    const divBloco = document.createElement('div'); divBloco.className = 'bloco-categoria-visual'; divBloco.id = blocoId;
    divBloco.innerHTML = `
        <div style="display: flex; gap: 10px; margin-bottom: 5px; align-items:center;">
            <input type="text" class="input-nome-categoria" placeholder="Título da Categoria" value="${nomeCategoria}" style="margin-bottom:0; font-weight:bold; border-color:#00ff66;">
            <button type="button" onclick="removerBlocoCategoriaVisual('${blocoId}')" class="btn-sair" style="margin-top:0; padding:6px 12px; height:38px;">Deletar</button>
        </div>
        <div class="radio-tipo-container">
            <label><input type="radio" name="tipo-${blocoId}" value="menu" ${tipoCategoria === "menu" ? "checked" : ""} onclick="alternarTipoCategoriaVisual('${blocoId}')"> 📁 Menu Retrátil</label>
            <label><input type="radio" name="tipo-${blocoId}" value="link" ${tipoCategoria === "link" ? "checked" : ""} onclick="alternarTipoCategoriaVisual('${blocoId}')"> 🔗 Link Direto</label>
        </div>
        <div class="container-url-categoria-direta" style="display: ${tipoCategoria === "link" ? "block" : "none"}; margin-bottom: 10px;">
            <input type="url" class="input-url-categoria" placeholder="URL de Destino" value="${urlCategoria}" style="margin-bottom:0; border-color:#00ff66;">
        </div>
        <div class="wrapper-subcategorias-area" style="display: ${tipoCategoria === "menu" ? "block" : "none"};">
            <div class="container-subcategorias-rows" style="padding-left: 15px; border-left: 2px dashed #242f41;"></div>
            <button type="button" onclick="adicionarLinhaSubcategoriaVisual('${blocoId}')" class="btn-link" style="color:#00ff66; margin-top: 5px; font-size: 0.8rem; text-align: left; display:block;">+ Adicionar Link</button>
        </div>
    `;
    containerVisual.appendChild(divBloco);
    if (subcategoriasArr && subcategoriasArr.length > 0) {
        subcategoriasArr.forEach(sub => { adicionarLinhaSubcategoriaVisual(blocoId, sub.texto, sub.url); });
    }
}

function alternarTipoCategoriaVisual(blocoId) {
    const bloco = document.getElementById(blocoId);
    if (!bloco) return;
    const tipo = bloco.querySelector(`input[name="tipo-${blocoId}"]:checked`).value;
    const areaSub = bloco.querySelector('.wrapper-subcategorias-area');
    const areaUrlDireta = bloco.querySelector('.container-url-categoria-direta');
    if (tipo === 'link') { 
        if (areaSub) areaSub.style.display = 'none'; 
        if (areaUrlDireta) areaUrlDireta.style.display = 'block'; 
    } else { 
        if (areaSub) areaSub.style.display = 'block'; 
        if (areaUrlDireta) areaUrlDireta.style.display = 'none'; 
    }
}

function adicionarLinhaSubcategoriaVisual(blocoId, txtLink = "", urlLink = "") {
    const bloco = document.getElementById(blocoId);
    if (!bloco) return;
    const containerRows = bloco.querySelector('.container-subcategorias-rows');
    if (!containerRows) return;
    const rowId = 'row-' + Date.now() + Math.floor(Math.random() * 100);
    const divRow = document.createElement('div'); divRow.className = 'linha-subcategoria-visual'; divRow.id = rowId;
    divRow.innerHTML = `
        <input type="text" class="sub-txt" placeholder="Texto" value="${txtLink}" style="flex: 1;">
        <input type="url" class="sub-url" placeholder="URL" value="${urlLink}" style="flex: 1.5;">
        <button type="button" onclick="document.getElementById('${rowId}').remove()" class="btn-sair" style="background:#421414; color:#ff3333; margin-top:0; border:1px solid #ff3333; height:38px; padding:0 10px;">Excluir</button>
    `;
    containerRows.appendChild(divRow);
}

// CORREÇÃO: Erro de digitação 'inline.querySelector' corrigido para 'linha.querySelector' para salvar o layout corretamente
const btnSalvarVisualMenu = document.getElementById('btn-salvar-visual-menu');
if (btnSalvarVisualMenu) {
    btnSalvarVisualMenu.addEventListener('click', async () => {
        const blocos = document.querySelectorAll('.bloco-categoria-visual');
        const estruturaMenuFinal = []; let dadosValidos = true;
        blocos.forEach(bloco => {
            const nomeCat = bloco.querySelector('.input-nome-categoria').value.trim(); if (!nomeCat) return;
            const tipoSelecionado = bloco.querySelector(`input[name="tipo-${bloco.id}"]:checked`).value;
            const urlCategoriaDireta = bloco.querySelector('.input-url-categoria').value.trim();
            const subcategorias = [];
            if (tipoSelecionado === "link") { if (!urlCategoriaDireta) dadosValidos = false; }
            else {
                const linesSub = bloco.querySelectorAll('.linha-subcategoria-visual');
                linesSub.forEach(linha => {
                    const txt = linha.querySelector('.sub-txt').value.trim();
                    const url = linha.querySelector('.sub-url').value.trim();
                    if (txt && url) subcategorias.push({ texto: txt, url: url });
                    else if (txt || url) dadosValidos = false;
                });
            }
            estruturaMenuFinal.push({ categoria: nomeCat, tipo: tipoSelecionado, url_categoria: tipoSelecionado === "link" ? urlCategoriaDireta : "", subcategorias: tipoSelecionado === "menu" ? subcategorias : [] });
        });
        if (!dadosValidos) { alert("⚠️ Existem campos incompletos no construtor."); return; }
        try {
            await database.ref('configuracao_menu_json').set(estruturaMenuFinal.length > 0 ? JSON.stringify(estruturaMenuFinal, null, 2) : "");
            alert("🚀 Menu Horizontal atualizado com sucesso!");
        } catch (e) { alert("Erro: " + e.message); }
    });
}

function removerBlocoCategoriaVisual(blocoId) {
    if (confirm("⚠️ Deseja deletar toda essa categoria?")) { 
        const elem = document.getElementById(blocoId);
        if (elem) elem.remove(); 
    }
}

const formCriarCard = document.getElementById('form-criar-card');
if (formCriarCard) {
    formCriarCard.addEventListener('submit', async (e) => {
        e.preventDefault(); const idEdicao = document.getElementById('card-id-edicao').value;
        const botoes = [];
        for (let i = 1; i <= 4; i++) {
            const txt = document.getElementById(`btn-txt-${i}`).value.trim();
            const url = document.getElementById(`btn-url-${i}`).value.trim();
            if (txt && url) botoes.push({ texto: txt, url: url });
        }
        
        const dadosCard = { 
            titulo: document.getElementById('card-titulo').value.trim(), 
            capa_url: document.getElementById('card-capa').value.trim(), 
            descricao: document.getElementById('card-descricao').value.trim(), 
            preco: document.getElementById('card-preco').value.trim(), 
            pix: document.getElementById('card-pix').value.trim(), 
            senha_patch: document.getElementById('card-senha-patch').value.trim(), 
            botoes: botoes 
        };

        try {
            if (idEdicao) { await database.ref(`cards_disponiveis/${idEdicao}`).set(dadosCard); alert("🔄 Card updated!"); cancelarEdicaoCard(); }
            else { await database.ref('cards_disponiveis').push(dadosCard); alert("🎯 Novo Card criado!"); formCriarCard.reset(); }
        } catch (error) { alert("Erro: " + error.message); }
    });
}

function ouvirCardsGlobaisAdmin() {
    if (!listaCardsCriados) return;
    database.ref('cards_disponiveis').on('value', snapshot => {
        listaCardsCriados.innerHTML = ""; const cards = snapshot.val();
        if (!cards) { listaCardsCriados.innerHTML = `<p style="color:#aaa; font-size:0.9rem;">Nenhum card.</p>`; return; }
        Object.keys(cards).forEach(id => {
            const div = document.createElement('div'); div.className = 'user-item'; div.style.borderLeft = "3px solid #00ff66";
            div.innerHTML = `
                <div style="display:flex; gap:10px; align-items:center;">
                    <img src="${cards[id].capa_url}" style="width:40px; height:50px; object-fit:cover; border-radius:4px;">
                    <div>
                        <p style="margin:0; font-weight:bold; color:#fff;">${cards[id].titulo}</p>
                        <p style="margin:2px 0 0 0; font-size:0.75rem; color:#00ff66;">${cards[id].preco || 'R$ 10,00'}</p>
                    </div>
                </div>
                <div style="display:flex; gap:5px; margin-top:10px;">
                    <button class="btn-visualizar-comprovante" style="margin:0; background:#24334c; border-color:#00ff66; color:#00ff66;" onclick="carregarCardParaEdicao('${id}')">✏️ Editar</button>
                    <button class="btn-visualizar-comprovante" style="margin:0; background:#3d1c1c; border-color:#ff3333; color:#ff3333;" onclick="deletarCardDoSistema('${id}')">🗑️ Apagar</button>
                </div>
            `;
            listaCardsCriados.appendChild(div);
        });
    });
}

function carregarCardParaEdicao(id) {
    database.ref(`cards_disponiveis/${id}`).once('value', snapshot => {
        const card = snapshot.val(); if (!card) return;
        document.getElementById('card-id-edicao').value = id;
        document.getElementById('card-titulo').value = card.titulo;
        document.getElementById('card-capa').value = card.capa_url;
        document.getElementById('card-descricao').value = card.descricao;
        document.getElementById('card-preco').value = card.preco || "";
        document.getElementById('card-pix').value = card.pix || "";
        document.getElementById('card-senha-patch').value = card.senha_patch || "";
        for(let i=1; i<=4; i++) { document.getElementById(`btn-txt-${i}`).value = ""; document.getElementById(`btn-url-${i}`).value = ""; }
        if (card.botoes) { card.botoes.forEach((btn, index) => { document.getElementById(`btn-txt-${index+1}`).value = btn.texto; document.getElementById(`btn-url-${index+1}`).value = btn.url; }); }
        document.getElementById('titulo-form-card').innerText = "✏️ Editando Card";
        document.getElementById('btn-cancelar-edicao').style.display = "block";
        document.getElementById('btn-salvar-card').innerText = "ATUALIZAR CARD";
    });
}

function cancelarEdicaoCard() {
    const hiddenId = document.getElementById('card-id-edicao');
    if (hiddenId) hiddenId.value = "";
    if (formCriarCard) formCriarCard.reset();
    document.getElementById('titulo-form-card').innerText = "1. Criar Novo Card de Jogo";
    document.getElementById('btn-cancelar-edicao').style.display = "none"; 
    document.getElementById('btn-salvar-card').innerText = "SALVAR CARD";
}
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener('click', cancelarEdicaoCard);
}

async function deletarCardDoSistema(id) {
    if (confirm("⚠️ Deseja apagar este card?")) { await database.ref(`cards_disponiveis/${id}`).remove(); alert("Card excluído."); }
}

const btnExportarCards = document.getElementById('btn-exportar-cards');
if (btnExportarCards) {
    btnExportarCards.addEventListener('click', () => {
        database.ref('cards_disponiveis').once('value', snapshot => {
            const data = snapshot.val(); if(!data) return alert("Vazio.");
            const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'backup-cards.json'; a.click();
        });
    });
}

function inicializarPainelAdmin() {
    if (!listaUsuariosAdmin) return;
    database.ref('cards_disponiveis').once('value', snapshotCards => {
        const cacheCardsGlobais = snapshotCards.val() || {};

        database.ref('usuarios').on('value', snapshot => {
            listaUsuariosAdmin.innerHTML = ""; const users = snapshot.val();
            if (!users) { listaUsuariosAdmin.innerHTML = `<p style="color:#aaa; padding:15px;">Nenhum usuário.</p>`; return; }

            let contagemFiltrados = 0;

            Object.keys(users).forEach(uid => {
                if (users[uid].email === "admin@admin.com") return;

                const status = users[uid].status_cadastro || 'pendente_pagamento';
                const temPedidos = users[uid].pedidos && Object.keys(users[uid].pedidos).length > 0;

                if (filtroAdminAtual === "pendentes" && !temPedidos) return;
                if (filtroAdminAtual === "concluidos" && status !== "pago") return;
                if (filtroAdminAtual === "cadastrados" && status !== "cliente_cadastrado" && status !== "solicitou_exclusao") return;

                let listaJogosAtivosHtml = "";
                const jogos = users[uid].jogos_liberados || {};
                const keysJogos = Object.keys(jogos);
                if (keysJogos.length === 0) { listaJogosAtivosHtml = "<li style='color:#ff3333;'>Nenhum card ativo</li>"; }
                else {
                    keysJogos.forEach(gameId => {
                        const tituloJogo = cacheCardsGlobais[gameId] ? cacheCardsGlobais[gameId].titulo : `ID: ${gameId.slice(-6)}`;
                        listaJogosAtivosHtml += `<li style="display:flex; justify-content:space-between; align-items:center; background:#141d26; padding:5px; margin:3px 0; border-radius:4px; font-size:0.8rem;"><span>🎮 ${tituloJogo}</span><button onclick="removerAcessoJogo('${uid}', '${gameId}')" style="background:none; border:none; color:#ff3333; cursor:pointer;">[Remover]</button></li>`;
                    });
                }

                const estiloGamerSelectCorrigido = `style="width:100%; height:40px; background:#1c2434; border:1px solid #242f41; border-radius:4px; color:#fff; padding:0 10px; margin-bottom:10px; font-size:0.85rem;"`;

                if (filtroAdminAtual === "pendentes") {
                    Object.keys(users[uid].pedidos).forEach(pedidoId => {
                        contagemFiltrados++;
                        const pedido = users[uid].pedidos[pedidoId];
                        const idCardComprado = pedido.id_card_comprado;
                        const dadosCard = cacheCardsGlobais[idCardComprado];

                        const userBox = document.createElement('div');
                        userBox.className = 'user-item';
                        userBox.style.borderLeft = "4px solid #ffcc00";

                        const tagJogoEscolhidoLoja = dadosCard
                            ? `<p style="background:#132219; border:1px solid #00ff66; color:#00ff66; padding:6px; border-radius:4px; font-size:0.85rem; margin-bottom:10px;">🎯 <strong>Patch Solicitado:</strong> ${dadosCard.titulo} (${dadosCard.preco || 'R$ 10,00'})</p>`
                            : `<p style="background:#221313; border:1px solid #ff3333; color:#ff3333; padding:6px; border-radius:4px; font-size:0.85rem; margin-bottom:10px;">⚠️ Card do Patch removido do sistema.</p>`;

                        const btnComp = pedido.comprovante_base64 && pedido.comprovante_base64.length > 10
                            ? `<button class="btn-visualizar-comprovante" onclick="abrirComprovantePedidoNovaAba('${uid}', '${pedidoId}')">👁️ Ver Comprovante Enviado</button>`
                            : `<p style="color:#ff3333; font-size:0.8rem; margin:5px 0;">Erro: Sem arquivo anexado.</p>`;

                        userBox.innerHTML = `
                            <div class="user-info">
                                <p><strong>Jogador:</strong> ${users[uid].nome} ${users[uid].sobrenome}</p>
                                <p><strong>E-mail:</strong> ${users[uid].email}</p>
                                <p><strong>WhatsApp:</strong> ${users[uid].whatsapp || 'Não cadastrado'}</p>
                                ${tagJogoEscolhidoLoja}
                                ${btnComp}
                            </div>
                            <button class="btn-inject" onclick="aprovarPedidoEspecifico('${uid}', '${pedidoId}', '${idCardComprado}')">Confirmar Pagamento & Liberar Patch</button>
                            <button class="btn-sair" onclick="recusarPedidoEspecifico('${uid}', '${pedidoId}')" style="width:100%; font-size:0.8rem; padding:6px; margin-top:5px; background:#211212; border:1px dashed #ff3333; color:#ff5555;">❌ Recusar/Deletar esta solicitação</button>
                        `;
                        listaUsuariosAdmin.appendChild(userBox);
                    });
                } else {
                    contagemFiltrados++;
                    const userBox = document.createElement('div');
                    userBox.className = 'user-item';

                    if (status === "solicitou_exclusao") {
                        userBox.style.border = "2px solid #ff3333";
                    }

                    if (filtroAdminAtual === "concluidos") {
                        userBox.innerHTML = `
                            <div class="user-info">
                                <p><strong>🏆 Jogador Ativo (Temporada):</strong> ${users[uid].nome} ${users[uid].sobrenome}</p>
                                <p><strong>WhatsApp:</strong> ${users[uid].whatsapp || 'Não cadastrado'}</p>
                                <p><strong>E-mail:</strong> ${users[uid].email}</p>
                                <div style="margin: 10px 0; background:#1b2430; padding:8px; border-radius:4px;">
                                    <p style="margin:0 0 5px 0; font-size:0.8rem; color:#00ff66;">Cards Ativos na Conta:</p>
                                    <ul style="margin:0; padding:0; list-style:none;">${listaJogosAtivosHtml}</ul>
                                </div>
                            </div>
                            <div style="display:flex; gap:5px; align-items:center; margin-bottom:10px;">
                                <select id="select-game-${uid}" ${estiloGamerSelectCorrigido} style="margin:0; flex:1; height:40px;"><option value="">+ Injetar Card Extra</option></select>
                                <button class="btn-gamer" onclick="injetarCardDiretoAdmin('${uid}')" style="margin:0; height:40px; width:45px; padding:0;">+</button>
                            </div>
                            <button class="btn-sair" onclick="excluirSolicitacaoEComprovante('${uid}')" style="width:100%; font-size:0.8rem; padding:6px; background:#2d1313; border:1px solid #ff3333; color:#ff3333;">📦 Mover Manualmente para Cadastrados (Recuar)</button>
                        `;
                    } else {
                        let botoesAbaCadastrados = `
                            <div style="display:flex; gap:5px; align-items:center;">
                                <select id="select-game-${uid}" ${estiloGamerSelectCorrigido} style="margin:0; flex:1; height:40px;"><option value="">Injetar Novo Patch Direto</option></select>
                                <button class="btn-gamer" onclick="injetarCardDiretoAdmin('${uid}')" style="margin:0; height:40px; width:45px; padding:0;">+</button>
                            </div>
                        `;

                        if (status === "solicitou_exclusao") {
                            botoesAbaCadastrados = `
                                <div style="background:#281216; border:1px solid #ff3333; padding:10px; border-radius:4px; text-align:center;">
                                    <p style="color:#ff3333; font-weight:bold; font-size:0.85rem; margin-bottom:8px;">⚠️ O USUÁRIO SOLICITOU A EXCLUSÃO DA CONTA</p>
                                    <button class="btn-gamer" style="background:#ff3333; color:#fff; font-size:0.8rem; padding:8px;" onclick="deletarUsuarioDoBancoTotal('${uid}', '${users[uid].email}')">🚨 APAGAR DADOS DO BANCO TOTAL</button>
                                </div>
                            `;
                        }

                        userBox.innerHTML = `
                            <div class="user-info">
                                <p><strong>👥 Cliente da Base Comercial:</strong> ${users[uid].nome} ${users[uid].sobrenome}</p>
                                <p><strong>WhatsApp:</strong> ${users[uid].whatsapp || 'Não cadastrado'}</p>
                                <p><strong>E-mail:</strong> ${users[uid].email}</p>
                                <div style="margin: 10px 0; background:#161c26; border:1px solid #242f41; padding:8px; border-radius:4px;">
                                    <p style="margin:0 0 5px 0; font-size:0.8rem; color:#8899a6;">Patrimônio de Jogos do Cliente:</p>
                                    <ul style="margin:0; padding:0; list-style:none;">${listaJogosAtivosHtml}</ul>
                                </div>
                            </div>
                            ${botoesAbaCadastrados}
                        `;
                    }
                    listaUsuariosAdmin.appendChild(userBox);
                    const selectElement = document.getElementById(`select-game-${uid}`);
                    if (selectElement) alimentarSelectComCards(selectElement, users[uid].jogos_liberados);
                }
            });

            if (contagemFiltrados === 0) {
                listaUsuariosAdmin.innerHTML = `<p style="color:#aaa; padding:15px; text-align:center;">Nenhum jogador ou pedido pendente nesta aba.</p>`;
            }
        });
    });
}

function abrirComprovantePedidoNovaAba(uid, pedidoId) {
    database.ref(`usuarios/${uid}/pedidos/${pedidoId}/comprovante_base64`).once('value', snapshot => {
        const base64Data = snapshot.val();
        if (base64Data) {
            const novaAba = window.open();
            if (!novaAba) return;
            if (base64Data.startsWith("data:application/pdf")) { novaAba.document.write(`<iframe src="${base64Data}" width="100%" height="100%" style="border:none;"></iframe>`); }
            else { novaAba.document.write(`<body style="background:#0b0e14; margin:0; display:flex; align-items:center; justify-content:center;"><img src="${base64Data}" style="max-width:100%; max-height:100vh; border:2px solid #00ff66; border-radius:8px;"></body>`); }
        }
    });
}

async function aprovarPedidoEspecifico(uid, pedidoId, cardId) {
    if (confirm("Deseja confirmar o pagamento deste comprovante e liberar o patch na conta do usuário?")) {
        try {
            await database.ref(`usuarios/${uid}/jogos_liberados/${cardId}`).set(true);
            await database.ref(`usuarios/${uid}/status_cadastro`).set("pago");
            await database.ref(`usuarios/${uid}/pedidos/${pedidoId}`).remove();
            alert("🔥 Pagamento aprovado e jogo liberado com sucesso!");
        } catch (error) { alert("Erro ao processar: " + error.message); }
    }
}

async function recusarPedidoEspecifico(uid, pedidoId) {
    if (confirm("Tem certeza que deseja recusar e deletar esta solicitação pendente?")) {
        try {
            await database.ref(`usuarios/${uid}/pedidos/${pedidoId}`).remove();
            alert("Solicitação excluída.");
        } catch (error) { alert("Erro: " + error.message); }
    }
}

async function injetarCardDiretoAdmin(uid) {
    const selectElement = document.getElementById(`select-game-${uid}`);
    if (!selectElement) return;
    const selectedCardId = selectElement.value;
    if (!selectedCardId) return alert("Selecione um patch válido para injetar.");
    try {
        await database.ref(`usuarios/${uid}/status_cadastro`).set("pago");
        await database.ref(`usuarios/${uid}/jogos_liberados/${selectedCardId}`).set(true);
        alert("🔥 Patch injetado direto!");
    } catch (error) { alert("Erro: " + error.message); }
}

async function removerAcessoJogo(uid, gameId) {
    if (confirm("Deseja remover o acesso deste card da conta do jogador?")) {
        await database.ref(`usuarios/${uid}/jogos_liberados/${gameId}`).remove();
        alert("Acesso removido!");
    }
}

async function excluirSolicitacaoEComprovante(uid) {
    if (confirm("Deseja arquivar e mover este cliente para a aba de 'Clientes Cadastrados'?")) {
        try {
            await database.ref(`usuarios/${uid}/pedidos`).remove();
            await database.ref(`usuarios/${uid}/status_cadastro`).set("cliente_cadastrado");
            alert("Mergulhado com sucesso na lista de cadastrados!");
        } catch (error) { alert("Erro: " + error.message); }
    }
}

async function deletarUsuarioDoBancoTotal(uid, email) {
    if (confirm(`🚨 ALERTA CRÍTICO:\nDeseja deletar totalmente a conta e registros de ${email}?`)) {
        try {
            await database.ref(`usuarios/${uid}`).remove();
            alert("Conta e registros eliminados do banco de dados!");
        } catch (error) { alert("Erro: " + error.message); }
    }
}

async function deslogar() {
    if (confirm("Deseja realmente sair do sistema?")) {
        usuarioLogadoUid = null;
        dadosClienteAtual = {};
        await auth.signOut();
    }
}

function verificarArquivo(arquivo) {
    if (!arquivo || !fileInfoElement) return;
    
    if (arquivo.size > 4 * 1024 * 1024) {
        alert("⚠️ Arquivo muito grande! O limite máximo permitido é de 4MB.");
        if (inputComprovanteElement) inputComprovanteElement.value = "";
        comprovanteBase64Global = "";
        fileInfoElement.innerText = "Nenhum arquivo selecionado";
        return;
    }
    
    fileInfoElement.innerText = `Carregando: ${arquivo.name} (${(arquivo.size / 1024).toFixed(1)} KB)...`;
    
    const leitor = new FileReader();
    leitor.onload = function(evento) {
        comprovanteBase64Global = evento.target.result;
        fileInfoElement.innerText = `✅ Pronto: ${arquivo.name}`;
    };
    leitor.onerror = function() {
        alert("Erro ao ler o arquivo comprovante.");
        fileInfoElement.innerText = "Erro no carregamento do arquivo";
        comprovanteBase64Global = "";
    };
    leitor.readAsDataURL(arquivo);
}

// Interceptador e motor lógico do formulário de login corrigido para evitar travamentos
const formLoginElement = document.getElementById('form-login');
if (formLoginElement) {
    formLoginElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const senha = document.getElementById('login-senha').value;
        const btnLogar = document.getElementById('btn-logar');
        
        if (!email || !senha) {
            alert("Preencha todos os campos.");
            return;
        }
        
        if (btnLogar) {
            btnLogar.innerText = "Logando...";
            btnLogar.disabled = true;
        }
        
        try {
            await auth.signInWithEmailAndPassword(email, senha);
        } catch (erro) {
            alert("Erro ao autenticar: " + erro.message);
            if (btnLogar) {
                btnLogar.innerText = "LOGAR NO HUB";
                btnLogar.disabled = false;
            }
        }
    });
}

// INTERCEPTADOR DO MODAL INTERNO DO "ESQUECI MINHA SENHA"
const btnEsqueciSenha = document.getElementById('btn-esqueci-senha');
if (btnEsqueciSenha) {
    btnEsqueciSenha.addEventListener('click', function() {
        const emailLogin = document.getElementById('login-email').value.trim();
        const inputRecuperarEmail = document.getElementById('recuperar-email');
        
        // Copia o valor digitado na tela de login para dentro do modal interno (facilidade para o gamer)
        if (inputRecuperarEmail) {
            inputRecuperarEmail.value = emailLogin;
        }
        
        if (modalEsqueciSenha) {
            modalEsqueciSenha.classList.add('active');
        }
    });
}

// Ouvinte para fechar o modal interno ao clicar no "X"
const btnFecharEsqueciSenha = document.getElementById('btn-fechar-esqueci-senha');
if (btnFecharEsqueciSenha) {
    btnFecharEsqueciSenha.addEventListener('click', function() {
        if (modalEsqueciSenha) {
            modalEsqueciSenha.classList.remove('active');
        }
    });
}

// Interceptador do formulário de redefinição de senha do modal interno
const formRecuperarSenhaInterno = document.getElementById('form-recuperar-senha-interno');
if (formRecuperarSenhaInterno) {
    formRecuperarSenhaInterno.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const emailRedefinicao = document.getElementById('recuperar-email').value.trim();
        const btnSubmeterRecuperacao = formRecuperarSenhaInterno.querySelector('button[type="submit"]');
        
        if (!emailRedefinicao) {
            alert("⚠️ Por favor, informe um e-mail válido.");
            return;
        }
        
        let textoOriginalBotao = "";
        if (btnSubmeterRecuperacao) {
            textoOriginalBotao = btnSubmeterRecuperacao.innerText;
            btnSubmeterRecuperacao.innerText = "ENVIANDO LINK...";
            btnSubmeterRecuperacao.disabled = true;
        }
        
        try {
            await auth.sendPasswordResetEmail(emailRedefinicao);
            alert("🚀 Link de redefinição enviado com sucesso!\nVerifique a sua caixa de entrada ou a pasta de spam.");
            if (modalEsqueciSenha) modalEsqueciSenha.classList.remove('active');
            formRecuperarSenhaInterno.reset();
        } catch (erro) {
            alert("Erro ao enviar redefinição: " + erro.message);
        } finally {
            if (btnSubmeterRecuperacao) {
                btnSubmeterRecuperacao.innerText = textoOriginalBotao;
                btnSubmeterRecuperacao.disabled = false;
            }
        }
    });
}

// FORMULÁRIO DE CADASTRO (CRIAR CONTA COM FEEDBACK VISUAL)
const formCadastroAuth = document.getElementById('form-cadastro-auth');
if (formCadastroAuth) {
    formCadastroAuth.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nome = document.getElementById('cad-nome').value.trim();
        const sobrenome = document.getElementById('cad-sobrenome').value.trim();
        const whatsapp = document.getElementById('cad-whatsapp').value.trim();
        const email = document.getElementById('cad-email').value.trim();
        const senha = document.getElementById('cad-senha').value;
        const btnCadastrar = formCadastroAuth.querySelector('button[type="submit"]');
        
        // Validações básicas de segurança
        if (!nome || !sobrenome || !whatsapp || !email || !senha) {
            alert("⚠️ Preencha todos os campos do formulário.");
            return;
        }
        
        if (!validarProvedorEmail(email)) {
            alert("⚠️ Por favor, utilize um provedor de e-mail válido (Ex: Gmail, Hotmail, Outlook, Yahoo).");
            return;
        }
        
        if (senha.length < 6) {
            alert("⚠️ A senha deve conter no mínimo 6 dígitos.");
            return;
        }
        
        // Ativa o feedback visual "Criando conta..." no botão (Disparado tanto no clique quanto no Enter)
        let textoBotaoOriginal = "";
        if (btnCadastrar) {
            textoBotaoOriginal = btnCadastrar.innerText;
            btnCadastrar.innerText = "Criando conta...";
            btnCadastrar.disabled = true;
        }
        
        try {
            // 1. Cria a autenticação no Firebase Auth
            const credencial = await auth.createUserWithEmailAndPassword(email, senha);
            const uid = credencial.user.uid;
            
            // 2. Monta o objeto com a mesma estrutura consumida pelo monitor de sessões (.on)
            const novosDadosUsuario = {
                nome: nome,
                sobrenome: sobrenome,
                email: email,
                whatsapp: whatsapp,
                status_cadastro: "cliente_cadastrado", // Status padrão inicial da base comercial
                jogos_liberados: {},
                pedidos: {}
            };
            
            // 3. Grava as propriedades do jogador no Realtime Database
            await database.ref(`usuarios/${uid}`).set(novosDadosUsuario);
            
            alert("🎯 Conta criada com sucesso! Seja bem-vindo ao HUB.");
            formCadastroAuth.reset();
            
        } catch (erro) {
            alert("Erro ao criar conta: " + erro.message);
            // Devolve o estado original do botão caso falhe
            if (btnCadastrar) {
                btnCadastrar.innerText = textoBotaoOriginal;
                btnCadastrar.disabled = false;
            }
        }
    });
}

// CORREÇÃO: Ouvintes adicionados para Abrir e Fechar as Configurações de Perfil do usuário
const btnAbrirPerfil = document.getElementById('btn-abrir-perfil');
if (btnAbrirPerfil) {
    btnAbrirPerfil.addEventListener('click', function() {
        if (modalEditarPerfil) {
            // Popula os dados do cliente atual nos campos do modal antes de abrir
            document.getElementById('perf-email').value = dadosClienteAtual.email || "";
            document.getElementById('perf-nome').value = dadosClienteAtual.nome || "";
            document.getElementById('perf-sobrenome').value = dadosClienteAtual.sobrenome || "";
            document.getElementById('perf-whatsapp').value = dadosClienteAtual.whatsapp || "";
            
            modalEditarPerfil.classList.add('active');
        }
    });
}

const btnFecharPerfil = document.getElementById('btn-fechar-perfil');
if (btnFecharPerfil) {
    btnFecharPerfil.addEventListener('click', function() {
        if (modalEditarPerfil) {
            modalEditarPerfil.classList.remove('active');
        }
    });
}

// Ouvinte para salvar as alterações do formulário de perfil do cliente
const formEditarPerfilCliente = document.getElementById('form-editar-perfil-cliente');
if (formEditarPerfilCliente) {
    formEditarPerfilCliente.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!usuarioLogadoUid) return;
        
        const novoNome = document.getElementById('perf-nome').value.trim();
        const novoSobrenome = document.getElementById('perf-sobrenome').value.trim();
        const novoWhatsapp = document.getElementById('perf-whatsapp').value.trim();
        
        try {
            await database.ref(`usuarios/${usuarioLogadoUid}`).update({
                nome: novoNome,
                sobrenome: novoSobrenome,
                whatsapp: novoWhatsapp
            });
            alert("⚙️ Perfil atualizado com sucesso!");
            if (modalEditarPerfil) modalEditarPerfil.classList.remove('active');
        } catch (error) {
            alert("Erro ao atualizar perfil: " + error.message);
        }
    });
}

// Ouvinte para o botão de solicitar exclusão de conta dentro do perfil
const btnSolicitarExclusaoConta = document.getElementById('btn-solicitar-exclusao-conta');
if (btnSolicitarExclusaoConta) {
    btnSolicitarExclusaoConta.addEventListener('click', async function() {
        if (!usuarioLogadoUid) return;
        if (confirm("🚨 ATENÇÃO CRÍTICA:\nDeseja realmente solicitar o encerramento dos seus dados? Seu acesso será suspenso imediatamente.")) {
            try {
                await database.ref(`usuarios/${usuarioLogadoUid}/status_cadastro`).set("solicitou_exclusao");
                if (modalEditarPerfil) modalEditarPerfil.classList.remove('active');
            } catch (error) {
                alert("Erro ao processar solicitação: " + error.message);
            }
        }
    });
}

// Amarrações de escuta contra cliques de segurança visual e proteção contra botões fantasmas
const btnFecharFormElement = document.getElementById('btn-fechar-form');
if (btnFecharFormElement) {
    btnFecharFormElement.addEventListener('click', () => {
        if (modalFormEnvio) modalFormEnvio.classList.remove('active');
    });
}

const inputComprovanteElement = document.getElementById('comprovante');
const dropZoneElement = document.getElementById('drop-zone');
const fileInfoElement = document.getElementById('file-info');
const formComprovanteElement = document.getElementById('form-comprovante');

if (dropZoneElement && inputComprovanteElement) {
    dropZoneElement.onclick = function() {
        inputComprovanteElement.click();
    };
    inputComprovanteElement.onchange = function(e) {
        if (e.target.files && e.target.files[0]) {
            verificarArquivo(e.target.files[0]);
        }
    };
}

if (formComprovanteElement) {
    formComprovanteElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const cardIdEscolhido = document.getElementById('id-card-escolhido-compra').value;
        if (!cardIdEscolhido) {
            alert("Erro interno: Nenhum card foi selecionado para compra.");
            return;
        }
        
        if (!comprovanteBase64Global || comprovanteBase64Global.length < 50) {
            alert("⚠️ Por favor, selecione ou anexe um arquivo de comprovante PIX antes de concluir.");
            return;
        }
        
        if (!usuarioLogadoUid) {
            alert("Sua sessão expirou. Logue novamente antes de enviar.");
            return;
        }
        
        const btnSub = document.getElementById('btn-enviar-tudo');
        if (btnSub) {
            btnSub.innerText = "ENVIANDO COMPROVANTE...";
            btnSub.disabled = true;
        }
        
        try {
            const novoPedidoDados = {
                id_card_comprado: cardIdEscolhido,
                comprovante_base64: comprovanteBase64Global,
                timestamp: Date.now()
            };
            
            await database.ref(`usuarios/${usuarioLogadoUid}/pedidos`).push(novoPedidoDados);
            await database.ref(`usuarios/${usuarioLogadoUid}/status_cadastro`).set("comprovante_enviado");
            
            alert("🚀 Comprovante enviado com sucesso!\nO administrador analisará este pedido para liberação.");
            
            if (modalFormEnvio) modalFormEnvio.classList.remove('active');
            if (formComprovanteElement) formComprovanteElement.reset();
            comprovanteBase64Global = "";
            if (fileInfoElement) fileInfoElement.innerText = "Nenhum arquivo selecionado";
            
            auth.currentUser.reload();
            
        } catch (erro) {
            alert("Erro de comunicação com o banco: " + erro.message);
        } finally {
            if (btnSub) {
                btnSub.innerText = "CONCLUIR INSCRIÇÃO";
                btnSub.disabled = false;
            }
        }
    });
}

const btnResetGeral = document.getElementById('btn-reset-geral-temporada');
if (btnResetGeral) {
    btnResetGeral.addEventListener('click', async () => {
        const conf1 = confirm("⚠️ ATENÇÃO - FIM DA PRÉ-VENDA:\n\nDeseja continuar?");
        if (conf1) {
            try {
                btnResetGeral.innerText = "ARQUIVANDO TEMPORADA..."; btnResetGeral.disabled = true;
                const snapshot = await database.ref('usuarios').once('value');
                const usuarios = snapshot.val();
                if (usuarios) {
                    const loteMudancas = {};
                    Object.keys(usuarios).forEach(uid => {
                        if (usuarios[uid].email !== "admin@admin.com" && usuarios[uid].status_cadastro === "pago") {
                            loteMudancas[`usuarios/${uid}/status_cadastro`] = "cliente_cadastrado";
                            loteMudancas[`usuarios/${uid}/pedidos`] = null; 
                        }
                    });
                    await database.ref().update(loteMudancas);
                    alert("🗂️ Temporada encerrada e arquivada com sucesso!");
                }
            } catch (error) { alert("Erro no reset geral: " + error.message); }
            finally {
                btnResetGeral.innerText = "📦 ARQUIVAR APROVADOS DA TEMPORADA"; btnResetGeral.disabled = false;
            }
        }
    });
}

document.addEventListener('contextmenu', (e) => {
    const viewCli = document.getElementById('view-cliente');
    if (viewCli && viewCli.classList.contains('active')) {
        const target = e.target.closest('.game-card, .modal-content, img, #container-senha-protegida-modal');
        if (target) { e.preventDefault(); return false; }
    }
});
