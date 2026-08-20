// ==========================================================================
// CONFIGURAÇÃO DO FIREBASE
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

const EMAIL_ADMIN = "admin@admin.com";

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
const modalEmailInterno = document.getElementById('modal-email-interno');
const modalSugestao = document.getElementById('modal-sugestao');
const modalPainelAdmin = document.getElementById('modal-painel-admin');
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
let avatarBase64Temp = null;      // null = não alterado
let qrCodeBase64Temp = "";
let cacheMensagensUsuario = {};
let cacheUsuariosDiretorio = {};
let cacheCardsAdmin = {};
let cacheUsuariosAdmin = {};
let buscaUsuariosAdmin = "";

// Referências ativas (para desligar no logout e evitar dados remanescentes)
const referenciasAtivas = [];
function escutar(caminho, evento, callback) {
    const ref = database.ref(caminho);
    ref.on(evento, callback);
    referenciasAtivas.push(ref);
    return ref;
}
function desligarTodasReferencias() {
    while (referenciasAtivas.length) {
        const ref = referenciasAtivas.pop();
        try { ref.off(); } catch (e) { /* ignore */ }
    }
}

function escapar(texto) {
    return String(texto == null ? "" : texto)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function precoParaNumero(preco) {
    if (!preco) return 0;
    const limpo = String(preco).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const valor = parseFloat(limpo);
    return isNaN(valor) ? 0 : valor;
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(ts) {
    if (!ts) return "—";
    try { return new Date(ts).toLocaleString('pt-BR'); } catch (e) { return "—"; }
}

// Sanfona da vitrine
if (btnRetrairVitrine && wrapperRetratilVitrine) {
    btnRetrairVitrine.addEventListener('click', () => {
        wrapperRetratilVitrine.classList.toggle('escondido');
        btnRetrairVitrine.innerText = wrapperRetratilVitrine.classList.contains('escondido') ? "Exibir Vitrine" : "Ocultar Vitrine";
    });
}

// Máscaras Dinâmicas para WhatsApp
function aplicarMascaraWhats(elemento) {
    if (!elemento) return;
    let value = elemento.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 6) { value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`; }
    else if (value.length > 2) { value = `(${value.slice(0, 2)}) ${value.slice(2)}`; }
    else if (value.length > 0) { value = `(${value}`; }
    elemento.value = value;
}
if (inputWhatsApp) inputWhatsApp.addEventListener('input', (e) => aplicarMascaraWhats(e.target));
if (perfWhatsApp) perfWhatsApp.addEventListener('input', (e) => aplicarMascaraWhats(e.target));

// Máscara visual da senha de login
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
    [viewAuth, viewCliente, viewClienteBloqueado, viewAdmin].forEach(v => { if (v) v.classList.remove('active'); });
    if (tela) tela.classList.add('active');
}

function fecharTodosModais() {
    document.querySelectorAll('.modal-form').forEach(m => m.classList.remove('active'));
    if (modalDetailsContainerGamer) modalDetailsContainerGamer.classList.remove('active');
    const lb = document.getElementById('lightbox-qrcode');
    if (lb) lb.classList.remove('active');
}

// Abas Login/Cadastro
const tabLogin = document.getElementById('tab-login');
const tabCadastro = document.getElementById('tab-cadastro');
if (tabLogin && tabCadastro) {
    tabLogin.addEventListener('click', () => {
        document.getElementById('form-login').classList.add('active');
        document.getElementById('form-cadastro-auth').classList.remove('active');
        tabLogin.classList.add('active'); tabCadastro.classList.remove('active');
    });
    tabCadastro.addEventListener('click', () => {
        document.getElementById('form-cadastro-auth').classList.add('active');
        document.getElementById('form-login').classList.remove('active');
        tabCadastro.classList.add('active'); tabLogin.classList.remove('active');
    });
}

// ==========================================================================
// RESET TOTAL DA TELA DE LOGIN (sem resquícios após logout)
// ==========================================================================
function restaurarTelaLoginDoZero() {
    desligarTodasReferencias();
    fecharTodosModais();

    usuarioLogadoUid = null;
    dadosClienteAtual = {};
    comprovanteBase64Global = "";
    avatarBase64Temp = null;
    qrCodeBase64Temp = "";
    cacheMensagensUsuario = {};
    cacheUsuariosDiretorio = {};
    cacheCardsAdmin = {};
    cacheUsuariosAdmin = {};
    filtroAdminAtual = "pendentes";
    buscaUsuariosAdmin = "";

    // Limpa formulários de sessão
    ['form-login', 'form-cadastro-auth', 'form-comprovante', 'form-editar-perfil-cliente',
     'form-recuperar-senha-interno', 'form-nova-mensagem', 'form-sugestao',
     'form-criar-card', 'form-msg-admin'].forEach(id => {
        const f = document.getElementById(id);
        if (f) f.reset();
    });

    if (loginSenhaReal) loginSenhaReal.value = "";
    if (loginShadowPass) { loginShadowPass.value = ""; loginShadowPass.blur(); }
    const emailLogin = document.getElementById('login-email');
    if (emailLogin) emailLogin.value = "";

    const btnLogar = document.getElementById('btn-logar');
    if (btnLogar) { btnLogar.classList.remove('carregando'); btnLogar.innerText = "LOGAR NO HUB"; btnLogar.disabled = false; }
    const btnCadastrarReset = document.getElementById('btn-cadastrar');
    if (btnCadastrarReset) { btnCadastrarReset.classList.remove('carregando'); btnCadastrarReset.innerText = "CADASTRAR E ENTRAR"; btnCadastrarReset.disabled = false; }
    const overlayAuth = document.getElementById('overlay-auth-carregando');
    if (overlayAuth) overlayAuth.classList.remove('active');

    // Volta para a aba "Entrar"
    if (tabLogin && tabCadastro) {
        document.getElementById('form-login').classList.add('active');
        document.getElementById('form-cadastro-auth').classList.remove('active');
        tabLogin.classList.add('active'); tabCadastro.classList.remove('active');
    }

    // Zera conteúdos dinâmicos que ficaram na memória do DOM
    ['grid-cards-cliente', 'grid-vitrine-vendas', 'container-links-menu', 'lista-usuarios-admin',
     'lista-cards-criados', 'lista-email-entrada', 'lista-email-enviados',
     'lista-sugestoes-admin', 'lista-conferencia-pagamentos', 'grid-kpis-dashboard',
     'grid-kpis-relatorios', 'grid-kpis-pagamentos', 'tabela-vendas-patch',
     'tabela-novos-usuarios', 'construtor-menu-visual-container'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = "";
    });

    const fileInfo = document.getElementById('file-info');
    if (fileInfo) fileInfo.innerText = "Nenhum arquivo selecionado";
    const badge = document.getElementById('badge-emails-nao-lidos');
    if (badge) badge.style.display = "none";
    const avatarHeader = document.getElementById('avatar-header-circulo');
    if (avatarHeader) avatarHeader.innerHTML = "?";

    try { sessionStorage.clear(); } catch (e) { /* ignore */ }

    irParaTela(viewAuth);
}

// ==========================================================================
// MONITOR DE SESSÃO
// ==========================================================================
auth.onAuthStateChanged(user => {
    if (user) {
        usuarioLogadoUid = user.uid;
        if (user.email === EMAIL_ADMIN) {
            irParaTela(viewAdmin);
            iniciarAmbienteAdmin();
        } else {
            escutar('usuarios/' + user.uid, 'value', snapshot => {
                const dados = snapshot.val();
                if (!dados) return;
                dadosClienteAtual = dados;

                if (dados.status_cadastro === "solicitou_exclusao") {
                    irParaTela(viewClienteBloqueado);
                    return;
                }

                const displayNameElem = document.getElementById('user-display-name');
                if (displayNameElem) displayNameElem.innerText = `${dados.nome} ${dados.sobrenome}`;
                renderizarAvatarHeader(dados);

                const areaPendente = document.getElementById('area-compra-pendente');
                const caixaAnalise = document.getElementById('caixa-alerta-analise-comprovante');
                const temPedidosPendentes = dados.pedidos && Object.keys(dados.pedidos).length > 0;
                if (temPedidosPendentes) {
                    if (areaPendente) areaPendente.style.display = "block";
                    if (caixaAnalise) caixaAnalise.style.display = "block";
                } else if (caixaAnalise) {
                    caixaAnalise.style.display = "none";
                }

                povoarVitrineDeVendasCliente(dados.jogos_liberados || {});
                irParaTela(viewCliente);
                ouvirCardsDoCliente(user.uid);
                ouvirEConstruirMenuCliente();
                inicializarBotaoWhatsApp();
                ouvirMensagensDoUsuario(user.uid);
            });
        }
    } else {
        restaurarTelaLoginDoZero();
    }
});

function renderizarAvatarHeader(dados) {
    const alvo = document.getElementById('avatar-header-circulo');
    if (!alvo) return;
    if (dados.avatar_base64) {
        alvo.innerHTML = `<img src="${dados.avatar_base64}" alt="Avatar">`;
    } else {
        const iniciais = `${(dados.nome || "?").charAt(0)}${(dados.sobrenome || "").charAt(0)}`.toUpperCase();
        alvo.innerText = iniciais;
    }
}

// ==========================================================================
// VITRINE DO CLIENTE
// ==========================================================================
function povoarVitrineDeVendasCliente(jogosLiberadosUsuario) {
    const areaPendente = document.getElementById('area-compra-pendente');
    const containerVitrine = document.getElementById('grid-vitrine-vendas');
    if (!containerVitrine || !areaPendente) return;

    database.ref('cards_disponiveis').once('value', snapshot => {
        const cardsGlobais = snapshot.val();
        if (!cardsGlobais) { areaPendente.style.display = "none"; return; }

        containerVitrine.innerHTML = "";
        let totalDisponiveisVenda = 0;

        const idsPatchesComPedidoPendente = [];
        if (dadosClienteAtual.pedidos) {
            Object.keys(dadosClienteAtual.pedidos).forEach(pId => {
                const p = dadosClienteAtual.pedidos[pId];
                if (p.id_card_comprado) idsPatchesComPedidoPendente.push(p.id_card_comprado);
            });
        }

        Object.keys(cardsGlobais).forEach(cardId => {
            const jaAdquirido = jogosLiberadosUsuario[cardId] === true;
            const jaEmAnalise = idsPatchesComPedidoPendente.includes(cardId);
            if (!jaAdquirido && !jaEmAnalise) {
                totalDisponiveisVenda++;
                const cardVitrine = document.createElement('div');
                cardVitrine.className = 'game-card';
                cardVitrine.style.border = "1px dashed #242f41";
                const precoExibicao = cardsGlobais[cardId].preco || "R$ 10,00";
                cardVitrine.innerHTML = `
                    <img src="${escapar(cardsGlobais[cardId].capa_url)}" style="opacity: 0.65;">
                    <h4 style="color:#aaa;">[Disponível] ${escapar(cardsGlobais[cardId].titulo)}</h4>
                    <div style="position:absolute; top:10px; right:10px; background:#00ff66; color:#000; font-size:0.7rem; font-weight:bold; padding:3px 6px; border-radius:3px;">${escapar(precoExibicao)}</div>
                `;
                cardVitrine.onclick = () => abrirModalJogo(cardsGlobais[cardId], true, cardId);
                containerVitrine.appendChild(cardVitrine);
            }
        });

        const temPedidos = dadosClienteAtual.pedidos && Object.keys(dadosClienteAtual.pedidos).length > 0;
        areaPendente.style.display = (totalDisponiveisVenda > 0 || temPedidos) ? "block" : "none";
    });
}

function fecharModalJogo() {
    if (modalDetailsContainerGamer) modalDetailsContainerGamer.classList.remove('active');
}

// ==========================================================================
// CÓPIA BLINDADA
// ==========================================================================
function ejecutarCopiaGamerBlindada(textoParaCopiar, elementoBotao) {
    const textoOriginal = elementoBotao.innerHTML;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textoParaCopiar).then(() => {
            elementoBotao.innerHTML = "✅ Copiado";
            setTimeout(() => { elementoBotao.innerHTML = textoOriginal; }, 2000);
        }).catch(() => executarMetodoCopiaAntigo(textoParaCopiar, elementoBotao, textoOriginal));
    } else {
        executarMetodoCopiaAntigo(textoParaCopiar, elementoBotao, textoOriginal);
    }
}

function executarMetodoCopiaAntigo(texto, botao, textoOrig) {
    const textarea = document.createElement("textarea");
    textarea.value = texto;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand("copy");
        botao.innerHTML = "✅ Copiado";
    } catch (err) { console.error("Falha ao copiar texto", err); }
    document.body.removeChild(textarea);
    setTimeout(() => { botao.innerHTML = textoOrig; }, 2000);
}

// ==========================================================================
// MODAL DE JOGO / CHECKOUT COM COPIA E COLA + QR CODE
// ==========================================================================
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
    const copiaColaCard = (card.pix_copia_cola || "").trim();
    const qrCard = card.pix_qr_base64 || "";

    if (modoLojaVenda) {
        if (txtPixPreviewReal) txtPixPreviewReal.innerText = pixFinalCard;
        if (blocoPixPreview) blocoPixPreview.style.display = "block";
        if (btnCopiarPixPreview) {
            btnCopiarPixPreview.onclick = (e) => { e.stopPropagation(); ejecutarCopiaGamerBlindada(pixFinalCard, btnCopiarPixPreview); };
        }

        document.getElementById('texto-preco-botao-dinamico').innerText = precoFinalCard;
        if (btnAdquirirLoja) {
            btnAdquirirLoja.style.display = "block";
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
                if (btnCopiarCheckout) btnCopiarCheckout.onclick = () => ejecutarCopiaGamerBlindada(pixFinalCard, btnCopiarCheckout);

                // PIX Copia e Cola
                const caixaCC = document.getElementById('caixa-copia-cola-checkout');
                const textoCC = document.getElementById('texto-copia-cola-checkout');
                const btnCC = document.getElementById('btn-copiar-copia-cola-checkout');
                if (caixaCC && textoCC) {
                    if (copiaColaCard) {
                        textoCC.value = copiaColaCard;
                        caixaCC.style.display = "block";
                        if (btnCC) btnCC.onclick = () => ejecutarCopiaGamerBlindada(copiaColaCard, btnCC);
                    } else {
                        caixaCC.style.display = "none";
                    }
                }

                // QR Code
                const caixaQR = document.getElementById('caixa-qrcode-checkout');
                const imgQR = document.getElementById('img-qrcode-checkout');
                if (caixaQR && imgQR) {
                    if (qrCard) {
                        imgQR.src = qrCard;
                        caixaQR.style.display = "block";
                        const btnSalvar = document.getElementById('btn-salvar-qr-checkout');
                        const btnAmpliar = document.getElementById('btn-ampliar-qr-checkout');
                        if (btnSalvar) btnSalvar.onclick = () => baixarBase64(qrCard, `qrcode-pix-${(card.titulo || 'patch').replace(/\s+/g, '-').toLowerCase()}.png`);
                        if (btnAmpliar) btnAmpliar.onclick = () => abrirLightboxQr(qrCard);
                    } else {
                        caixaQR.style.display = "none";
                    }
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
                btnCopiarSenha.onclick = () => ejecutarCopiaGamerBlindada(textoSenhaReal.innerText, btnCopiarSenha);
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

function abrirLightboxQr(base64) {
    const lb = document.getElementById('lightbox-qrcode');
    const img = document.getElementById('lightbox-qr-img');
    if (!lb || !img) return;
    img.src = base64;
    lb.classList.add('active');
}
const btnFecharLightboxQr = document.getElementById('btn-fechar-lightbox-qr');
if (btnFecharLightboxQr) btnFecharLightboxQr.addEventListener('click', () => document.getElementById('lightbox-qrcode').classList.remove('active'));

function baixarBase64(base64, nomeArquivo) {
    const a = document.createElement('a');
    a.href = base64;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// ==========================================================================
// CONVERSÃO DE IMAGENS PARA BASE64 (com redimensionamento)
// ==========================================================================
function converterImagemParaBase64(arquivo, ladoMaximo, quadrado) {
    return new Promise((resolve, reject) => {
        if (!arquivo.type.startsWith('image/')) return reject(new Error("Selecione um arquivo de imagem."));
        if (arquivo.size > 6 * 1024 * 1024) return reject(new Error("Imagem muito grande (limite 6MB)."));
        const leitor = new FileReader();
        leitor.onload = () => {
            const img = new Image();
            img.onload = () => {
                let largura = img.width, altura = img.height;
                if (quadrado) {
                    const lado = Math.min(largura, altura);
                    const canvas = document.createElement('canvas');
                    canvas.width = ladoMaximo; canvas.height = ladoMaximo;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, ladoMaximo, ladoMaximo);
                    ctx.drawImage(img, (largura - lado) / 2, (altura - lado) / 2, lado, lado, 0, 0, ladoMaximo, ladoMaximo);
                    return resolve(canvas.toDataURL('image/png'));
                }
                const escala = Math.min(1, ladoMaximo / Math.max(largura, altura));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(largura * escala);
                canvas.height = Math.round(altura * escala);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
            img.src = leitor.result;
        };
        leitor.onerror = () => reject(new Error("Falha ao carregar o arquivo."));
        leitor.readAsDataURL(arquivo);
    });
}

// ==========================================================================
// CARDS DO CLIENTE E MENU HORIZONTAL
// ==========================================================================
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
    escutar(`usuarios/${uid}/jogos_liberados`, 'value', snapshotLiberados => {
        gridCardsCliente.innerHTML = "";
        const liberados = snapshotLiberados.val() || {};
        Object.keys(liberados).forEach(cardId => {
            database.ref(`cards_disponiveis/${cardId}`).once('value', cardSnap => {
                const card = cardSnap.val();
                if (!card) return;
                const cardElement = document.createElement('div');
                cardElement.className = 'game-card';
                cardElement.innerHTML = `<img src="${escapar(card.capa_url)}"><h4>${escapar(card.titulo)}</h4>`;
                cardElement.addEventListener('contextmenu', (e) => { e.preventDefault(); return false; });
                cardElement.addEventListener('click', () => abrirModalJogo(card, false));
                gridCardsCliente.appendChild(cardElement);
            });
        });
    });
}

function ouvirEConstruirMenuCliente() {
    const menuContainer = document.getElementById('area-menu-dinamico');
    const linksList = document.getElementById('container-links-menu');
    if (!linksList || !menuContainer) return;

    escutar('configuracao_menu_json', 'value', snapshot => {
        linksList.innerHTML = "";
        const jsonString = snapshot.val() || "";
        if (!jsonString.trim()) { menuContainer.style.display = "none"; return; }
        try {
            const categorias = JSON.parse(jsonString);
            if (!Array.isArray(categorias) || categorias.length === 0) { menuContainer.style.display = "none"; return; }

            categorias.forEach(item => {
                const liCat = document.createElement('li');
                liCat.className = 'nav-dinamica-item';
                const aCat = document.createElement('a');
                aCat.className = 'nav-link-item';
                aCat.innerText = item.categoria;

                if (item.tipo === "link" && item.url_categoria) {
                    aCat.href = item.url_categoria;
                    if (item.nova_aba !== false) { aCat.target = "_blank"; aCat.rel = "noopener"; }
                } else if (item.tipo === "menu") {
                    aCat.href = "javascript:void(0);";
                    liCat.addEventListener('click', (e) => {
                        e.stopPropagation();
                        document.querySelectorAll('.nav-dinamica-item').forEach(el => { if (el !== liCat) el.classList.remove('submenu-visivel'); });
                        liCat.classList.toggle('submenu-visivel');
                    });
                }
                liCat.appendChild(aCat);

                if (item.tipo !== "link" && Array.isArray(item.subcategorias) && item.subcategorias.length > 0) {
                    const ulSub = document.createElement('ul');
                    ulSub.className = 'submenu-dinamico';
                    item.subcategorias.forEach(sub => {
                        const liSub = document.createElement('li');
                        const aSub = document.createElement('a');
                        aSub.innerText = sub.texto;
                        aSub.href = sub.url;
                        if (sub.nova_aba !== false) { aSub.target = "_blank"; aSub.rel = "noopener"; }
                        aSub.addEventListener('click', (e) => e.stopPropagation());
                        liSub.appendChild(aSub);
                        ulSub.appendChild(liSub);
                    });
                    liCat.appendChild(ulSub);
                }
                linksList.appendChild(liCat);
            });
            menuContainer.style.display = "block";
            verificarEncaixeDoMenu();
        } catch (e) { menuContainer.style.display = "none"; }
    });
}

// Hambúrguer apenas quando o menu não cabe horizontalmente
function verificarEncaixeDoMenu() {
    const menuContainer = document.getElementById('area-menu-dinamico');
    const linksList = document.getElementById('container-links-menu');
    if (!menuContainer || !linksList || menuContainer.style.display === "none") return;

    const estavaEmHamburguer = menuContainer.classList.contains('modo-hamburguer');
    menuContainer.classList.remove('modo-hamburguer', 'aberto');

    const cabe = linksList.scrollWidth <= menuContainer.clientWidth + 1;
    if (!cabe) {
        menuContainer.classList.add('modo-hamburguer');
        if (estavaEmHamburguer) menuContainer.classList.remove('aberto');
    }
}

const btnHamburguerMenu = document.getElementById('btn-hamburguer-menu');
if (btnHamburguerMenu) {
    btnHamburguerMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('area-menu-dinamico').classList.toggle('aberto');
    });
}
window.addEventListener('resize', () => {
    clearTimeout(window.__timerMenu);
    window.__timerMenu = setTimeout(verificarEncaixeDoMenu, 150);
});

document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dinamica-item').forEach(el => el.classList.remove('submenu-visivel'));
});

function inicializarBotaoWhatsApp() {
    const whatsappNumero = "5588988470190";
    const btnWhats = document.getElementById('btn-whatsapp-flutuante');
    if (btnWhats) btnWhats.href = `https://api.whatsapp.com/send?phone=${whatsappNumero}&text=Ol%C3%A1,%20preciso%20de%20ajuda%20no%20Hub!`;
}

// ==========================================================================
// SISTEMA DE ARRASTAR E SOLTAR (mouse + toque) PARA ORDENAÇÃO
// ==========================================================================
function tornarOrdenavel(container, seletorItem) {
    if (!container || container.dataset.ordenavel === "1") return;
    container.dataset.ordenavel = "1";
    container.dataset.seletorItem = seletorItem;

    container.addEventListener('pointerdown', (evento) => {
        const punho = evento.target.closest('.punho-arrasto');
        if (!punho || !container.contains(punho)) return;
        // Garante que o punho pertence a ESTE container (evita conflito entre
        // a lista de categorias e as listas de links dentro de cada categoria)
        if (punho.closest('[data-ordenavel="1"]') !== container) return;

        const item = punho.closest(seletorItem);
        if (!item || item.parentElement !== container) return;

        evento.preventDefault();
        evento.stopPropagation();
        try { punho.setPointerCapture(evento.pointerId); } catch (e) { /* ignora */ }
        item.classList.add('arrastando');

        const mover = (ev) => {
            const irmaos = Array.from(container.children).filter(el => el.matches(seletorItem) && el !== item);
            let referencia = null;
            for (const irmao of irmaos) {
                const r = irmao.getBoundingClientRect();
                if (ev.clientY < r.top + r.height / 2) { referencia = irmao; break; }
            }
            if (referencia) {
                if (referencia !== item.nextElementSibling) container.insertBefore(item, referencia);
            } else if (container.lastElementChild !== item) {
                container.appendChild(item);
            }
        };

        const soltar = () => {
            item.classList.remove('arrastando');
            try { punho.releasePointerCapture(evento.pointerId); } catch (e) { /* ignora */ }
            punho.removeEventListener('pointermove', mover);
            document.removeEventListener('pointermove', mover);
            punho.removeEventListener('pointerup', soltar);
            punho.removeEventListener('pointercancel', soltar);
            document.removeEventListener('pointerup', soltar);
            document.removeEventListener('pointercancel', soltar);
            renumerarOrdem(container);
        };

        punho.addEventListener('pointermove', mover);
        document.addEventListener('pointermove', mover);
        punho.addEventListener('pointerup', soltar);
        punho.addEventListener('pointercancel', soltar);
        // Segurança: se o ponteiro for solto fora do punho, finaliza mesmo assim
        document.addEventListener('pointerup', soltar);
        document.addEventListener('pointercancel', soltar);
    });

    // Ordenação por número digitado
    container.addEventListener('input', (ev) => {
        const campo = ev.target.closest('.input-ordem');
        if (!campo || campo.closest('[data-ordenavel="1"]') !== container) return;
        clearTimeout(campo.__timerOrdem);
        campo.__timerOrdem = setTimeout(() => aplicarOrdemDigitada(container, campo), 350);
    });
    container.addEventListener('change', (ev) => {
        const campo = ev.target.closest('.input-ordem');
        if (!campo || campo.closest('[data-ordenavel="1"]') !== container) return;
        clearTimeout(campo.__timerOrdem);
        aplicarOrdemDigitada(container, campo);
    });
}

// Reescreve os números 1..N na ordem visual atual
function renumerarOrdem(container) {
    if (!container) return;
    const seletorItem = container.dataset.seletorItem;
    if (!seletorItem) return;
    Array.from(container.children)
        .filter(el => el.matches(seletorItem))
        .forEach((el, indice) => {
            const campo = el.querySelector(':scope .input-ordem');
            if (campo) campo.value = indice + 1;
        });
}

// Move o item para a posição digitada pelo usuário
function aplicarOrdemDigitada(container, campo) {
    const seletorItem = container.dataset.seletorItem;
    if (!seletorItem) return;
    const item = campo.closest(seletorItem);
    if (!item || item.parentElement !== container) return;

    const itens = Array.from(container.children).filter(el => el.matches(seletorItem));
    const total = itens.length;
    let destino = parseInt(campo.value, 10);
    if (isNaN(destino)) return;
    if (destino < 1) destino = 1;
    if (destino > total) destino = total;

    const restantes = itens.filter(el => el !== item);
    const referencia = restantes[destino - 1] || null;
    if (referencia) container.insertBefore(item, referencia);
    else container.appendChild(item);

    const foco = document.activeElement === campo;
    renumerarOrdem(container);
    if (foco) { campo.value = destino; campo.focus(); campo.select(); }
    item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ==========================================================================
// CONSTRUTOR VISUAL DO MENU (ADMIN)
// ==========================================================================
function ouvirEPovoarMenuVisualAdmin() {
    const containerVisual = document.getElementById('construtor-menu-visual-container');
    if (!containerVisual) return;
    database.ref('configuracao_menu_json').once('value', snapshot => {
        containerVisual.innerHTML = "";
        const rawJson = snapshot.val() || "";
        tornarOrdenavel(containerVisual, '.bloco-categoria-visual');
        if (!rawJson.trim()) return;
        try {
            const categoriasData = JSON.parse(rawJson);
            if (Array.isArray(categoriasData)) {
                categoriasData.forEach(cat => {
                    adicionarBlocoCategoriaVisual(cat.categoria, cat.subcategorias, cat.tipo || "menu", cat.url_categoria || "", cat.nova_aba !== false);
                });
            }
        } catch (e) { /* json inválido */ }
    });
}

function adicionarBlocoCategoriaVisual(nomeCategoria = "", subcategoriasArr = [], tipoCategoria = "menu", urlCategoria = "", novaAba = true) {
    const containerVisual = document.getElementById('construtor-menu-visual-container');
    if (!containerVisual) return;
    tornarOrdenavel(containerVisual, '.bloco-categoria-visual');

    const blocoId = 'cat-' + Date.now() + Math.floor(Math.random() * 1000);
    const divBloco = document.createElement('div');
    divBloco.className = 'bloco-categoria-visual';
    divBloco.id = blocoId;
    divBloco.innerHTML = `
        <div style="display: flex; gap: 8px; margin-bottom: 5px; align-items:center;">
            <span class="punho-arrasto" title="Arraste para reordenar">⠿</span>
            <input type="number" min="1" class="input-ordem" title="Digite a posição do menu" placeholder="Nº">
            <input type="text" class="input-nome-categoria" placeholder="Título da Categoria" value="${escapar(nomeCategoria)}" style="margin-bottom:0; font-weight:bold; border-color:#00ff66;">
            <button type="button" onclick="removerBlocoCategoriaVisual('${blocoId}')" class="btn-sair" style="margin-top:0; padding:6px 12px; height:38px;">Deletar</button>
        </div>
        <div class="radio-tipo-container">
            <label><input type="radio" name="tipo-${blocoId}" value="menu" ${tipoCategoria === "menu" ? "checked" : ""} onclick="alternarTipoCategoriaVisual('${blocoId}')"> 📁 Menu Retrátil</label>
            <label><input type="radio" name="tipo-${blocoId}" value="link" ${tipoCategoria === "link" ? "checked" : ""} onclick="alternarTipoCategoriaVisual('${blocoId}')"> 🔗 Link Direto</label>
        </div>
        <div class="container-url-categoria-direta" style="display: ${tipoCategoria === "link" ? "block" : "none"}; margin-bottom: 10px;">
            <input type="url" class="input-url-categoria" placeholder="URL de Destino" value="${escapar(urlCategoria)}" style="margin-bottom:8px; border-color:#00ff66;">
            <label class="opcao-inline"><input type="checkbox" class="check-nova-aba-categoria" ${novaAba ? "checked" : ""}> Abrir em outra aba</label>
        </div>
        <div class="wrapper-subcategorias-area" style="display: ${tipoCategoria === "menu" ? "block" : "none"};">
            <div class="container-subcategorias-rows" style="padding-left: 15px; border-left: 2px dashed #242f41;"></div>
            <button type="button" onclick="adicionarLinhaSubcategoriaVisual('${blocoId}')" class="btn-link" style="color:#00ff66; margin-top: 5px; font-size: 0.8rem; text-align: left; display:block;">+ Adicionar Link</button>
        </div>
    `;
    containerVisual.appendChild(divBloco);
    renumerarOrdem(containerVisual);

    const rows = divBloco.querySelector('.container-subcategorias-rows');
    tornarOrdenavel(rows, '.linha-subcategoria-visual');

    if (subcategoriasArr && subcategoriasArr.length > 0) {
        subcategoriasArr.forEach(sub => adicionarLinhaSubcategoriaVisual(blocoId, sub.texto, sub.url, sub.nova_aba !== false));
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

function adicionarLinhaSubcategoriaVisual(blocoId, txtLink = "", urlLink = "", novaAba = true) {
    const bloco = document.getElementById(blocoId);
    if (!bloco) return;
    const containerRows = bloco.querySelector('.container-subcategorias-rows');
    if (!containerRows) return;
    tornarOrdenavel(containerRows, '.linha-subcategoria-visual');

    const rowId = 'row-' + Date.now() + Math.floor(Math.random() * 1000);
    const divRow = document.createElement('div');
    divRow.className = 'linha-subcategoria-visual';
    divRow.id = rowId;
    divRow.innerHTML = `
        <span class="punho-arrasto" title="Arraste para reordenar">⠿</span>
        <input type="number" min="1" class="input-ordem" title="Digite a posição do link" placeholder="Nº">
        <input type="text" class="sub-txt" placeholder="Texto" value="${escapar(txtLink)}" style="flex: 1;">
        <input type="url" class="sub-url" placeholder="URL" value="${escapar(urlLink)}" style="flex: 1.5;">
        <label class="opcao-inline" style="margin:0;"><input type="checkbox" class="check-nova-aba-sub" ${novaAba ? "checked" : ""}> nova aba</label>
        <button type="button" onclick="removerLinhaSubcategoriaVisual('${rowId}')" class="btn-sair" style="background:#421414; color:#ff3333; margin-top:0; border:1px solid #ff3333; height:38px; padding:0 10px;">Excluir</button>
    `;
    containerRows.appendChild(divRow);
    renumerarOrdem(containerRows);
}

const btnSalvarVisualMenu = document.getElementById('btn-salvar-visual-menu');
if (btnSalvarVisualMenu) {
    btnSalvarVisualMenu.addEventListener('click', async () => {
        const blocos = document.querySelectorAll('.bloco-categoria-visual');
        const estruturaMenuFinal = [];
        let dadosValidos = true;

        blocos.forEach(bloco => {
            const nomeCat = bloco.querySelector('.input-nome-categoria').value.trim();
            if (!nomeCat) return;
            const tipoSelecionado = bloco.querySelector(`input[name="tipo-${bloco.id}"]:checked`).value;
            const urlCategoriaDireta = bloco.querySelector('.input-url-categoria').value.trim();
            const novaAbaCategoria = bloco.querySelector('.check-nova-aba-categoria').checked;
            const subcategorias = [];

            if (tipoSelecionado === "link") {
                if (!urlCategoriaDireta) dadosValidos = false;
            } else {
                bloco.querySelectorAll('.linha-subcategoria-visual').forEach(linha => {
                    const txt = linha.querySelector('.sub-txt').value.trim();
                    const url = linha.querySelector('.sub-url').value.trim();
                    const nova = linha.querySelector('.check-nova-aba-sub').checked;
                    if (txt && url) subcategorias.push({ texto: txt, url: url, nova_aba: nova });
                    else if (txt || url) dadosValidos = false;
                });
            }

            estruturaMenuFinal.push({
                categoria: nomeCat,
                tipo: tipoSelecionado,
                url_categoria: tipoSelecionado === "link" ? urlCategoriaDireta : "",
                nova_aba: novaAbaCategoria,
                subcategorias: tipoSelecionado === "menu" ? subcategorias : []
            });
        });

        if (!dadosValidos) { alert("⚠️ Existem campos incompletos no construtor."); return; }
        try {
            await database.ref('configuracao_menu_json').set(estruturaMenuFinal.length > 0 ? JSON.stringify(estruturaMenuFinal, null, 2) : "");
            alert("🚀 Menu Horizontal atualizado com sucesso!");
        } catch (e) { alert("Erro: " + e.message); }
    });
}

function removerLinhaSubcategoriaVisual(rowId) {
    const linha = document.getElementById(rowId);
    if (!linha) return;
    const pai = linha.parentElement;
    linha.remove();
    renumerarOrdem(pai);
}

function removerBlocoCategoriaVisual(blocoId) {
    if (confirm("⚠️ Deseja deletar toda essa categoria?")) {
        const elem = document.getElementById(blocoId);
        const pai = elem ? elem.parentElement : null;
        if (elem) elem.remove();
        renumerarOrdem(pai);
    }
}

// ==========================================================================
// FORMULÁRIO DE CARDS (COM PIX COPIA E COLA + QR CODE)
// ==========================================================================
const btnEscolherQrCard = document.getElementById('btn-escolher-qr-card');
const inputQrCard = document.getElementById('input-qr-card');
const previewQrCard = document.getElementById('preview-qr-card');
const statusQrCard = document.getElementById('status-qr-card');

if (btnEscolherQrCard && inputQrCard) {
    btnEscolherQrCard.addEventListener('click', () => inputQrCard.click());
    inputQrCard.addEventListener('change', async (e) => {
        const arquivo = e.target.files && e.target.files[0];
        if (!arquivo) return;
        try {
            statusQrCard.innerText = "Convertendo imagem...";
            qrCodeBase64Temp = await converterImagemParaBase64(arquivo, 600, true);
            previewQrCard.src = qrCodeBase64Temp;
            statusQrCard.innerText = "✅ QR Code convertido em base64 (1:1).";
        } catch (erro) {
            qrCodeBase64Temp = "";
            statusQrCard.innerText = "❌ " + erro.message;
        }
    });
}
const btnRemoverQrCard = document.getElementById('btn-remover-qr-card');
if (btnRemoverQrCard) {
    btnRemoverQrCard.addEventListener('click', () => {
        qrCodeBase64Temp = "";
        if (previewQrCard) previewQrCard.src = "";
        if (inputQrCard) inputQrCard.value = "";
        if (statusQrCard) statusQrCard.innerText = "Nenhuma imagem carregada.";
    });
}

const formCriarCard = document.getElementById('form-criar-card');
if (formCriarCard) {
    formCriarCard.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idEdicao = document.getElementById('card-id-edicao').value;
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
            pix_copia_cola: document.getElementById('card-pix-copia-cola').value.trim(),
            pix_qr_base64: qrCodeBase64Temp || "",
            senha_patch: document.getElementById('card-senha-patch').value.trim(),
            botoes: botoes
        };

        try {
            if (idEdicao) {
                await database.ref(`cards_disponiveis/${idEdicao}`).set(dadosCard);
                alert("🔄 Card atualizado!");
                cancelarEdicaoCard();
            } else {
                await database.ref('cards_disponiveis').push(dadosCard);
                alert("🎯 Novo Card criado!");
                cancelarEdicaoCard();
            }
        } catch (error) { alert("Erro: " + error.message); }
    });
}

function ouvirCardsGlobaisAdmin() {
    if (!listaCardsCriados) return;
    escutar('cards_disponiveis', 'value', snapshot => {
        cacheCardsAdmin = snapshot.val() || {};
        listaCardsCriados.innerHTML = "";
        const cards = snapshot.val();
        if (!cards) { listaCardsCriados.innerHTML = `<p class="vazio-lista">Nenhum card cadastrado.</p>`; return; }
        Object.keys(cards).forEach(id => {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.style.borderLeft = "3px solid #00ff66";
            div.innerHTML = `
                <div style="display:flex; gap:10px; align-items:center;">
                    <img src="${escapar(cards[id].capa_url)}" style="width:40px; height:50px; object-fit:cover; border-radius:4px;">
                    <div>
                        <p style="margin:0; font-weight:bold; color:#fff;">${escapar(cards[id].titulo)}</p>
                        <p style="margin:2px 0 0 0; font-size:0.75rem; color:#00ff66;">${escapar(cards[id].preco || 'R$ 10,00')}</p>
                        <p style="margin:2px 0 0 0; font-size:0.7rem; color:#8899a6;">
                            ${cards[id].pix_copia_cola ? "🧾 Copia e Cola" : "—"} · ${cards[id].pix_qr_base64 ? "📷 QR Code" : "sem QR"}
                        </p>
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
        const card = snapshot.val();
        if (!card) return;
        abrirAbaAdmin('cards');
        document.getElementById('card-id-edicao').value = id;
        document.getElementById('card-titulo').value = card.titulo;
        document.getElementById('card-capa').value = card.capa_url;
        document.getElementById('card-descricao').value = card.descricao;
        document.getElementById('card-preco').value = card.preco || "";
        document.getElementById('card-pix').value = card.pix || "";
        document.getElementById('card-pix-copia-cola').value = card.pix_copia_cola || "";
        document.getElementById('card-senha-patch').value = card.senha_patch || "";

        qrCodeBase64Temp = card.pix_qr_base64 || "";
        if (previewQrCard) previewQrCard.src = qrCodeBase64Temp;
        if (statusQrCard) statusQrCard.innerText = qrCodeBase64Temp ? "QR Code carregado deste card." : "Nenhuma imagem carregada.";

        for (let i = 1; i <= 4; i++) {
            document.getElementById(`btn-txt-${i}`).value = "";
            document.getElementById(`btn-url-${i}`).value = "";
        }
        if (card.botoes) {
            card.botoes.forEach((btn, index) => {
                if (index > 3) return;
                document.getElementById(`btn-txt-${index + 1}`).value = btn.texto;
                document.getElementById(`btn-url-${index + 1}`).value = btn.url;
            });
        }
        document.getElementById('titulo-form-card').innerText = "✏️ Editando Card";
        document.getElementById('btn-cancelar-edicao').style.display = "block";
        document.getElementById('btn-salvar-card').innerText = "ATUALIZAR CARD";
    });
}

function cancelarEdicaoCard() {
    const hiddenId = document.getElementById('card-id-edicao');
    if (hiddenId) hiddenId.value = "";
    if (formCriarCard) formCriarCard.reset();
    qrCodeBase64Temp = "";
    if (previewQrCard) previewQrCard.src = "";
    if (statusQrCard) statusQrCard.innerText = "Nenhuma imagem carregada.";
    document.getElementById('titulo-form-card').innerText = "Criar Novo Card de Jogo";
    document.getElementById('btn-cancelar-edicao').style.display = "none";
    document.getElementById('btn-salvar-card').innerText = "SALVAR CARD";
}
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
if (btnCancelarEdicao) btnCancelarEdicao.addEventListener('click', cancelarEdicaoCard);

async function deletarCardDoSistema(id) {
    if (confirm("⚠️ Deseja apagar este card?")) {
        await database.ref(`cards_disponiveis/${id}`).remove();
        alert("Card excluído.");
    }
}

const btnExportarCards = document.getElementById('btn-exportar-cards');
if (btnExportarCards) {
    btnExportarCards.addEventListener('click', () => {
        database.ref('cards_disponiveis').once('value', snapshot => {
            const data = snapshot.val();
            if (!data) return alert("Vazio.");
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'backup-cards.json';
            a.click();
        });
    });
}

// ==========================================================================
// PAINEL ADMIN EM MODAL COM ABAS
// ==========================================================================
function abrirAbaAdmin(nomeAba) {
    if (modalPainelAdmin) modalPainelAdmin.classList.add('active');
    document.querySelectorAll('#barra-abas-admin .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.abaAdmin === nomeAba);
    });
    document.querySelectorAll('.pane-admin').forEach(pane => pane.classList.remove('active'));
    const alvo = document.getElementById('aba-admin-' + nomeAba);
    if (alvo) alvo.classList.add('active');

    if (nomeAba === 'relatorios') renderizarRelatorios();
    if (nomeAba === 'pagamentos') renderizarConferenciaPagamentos();
    if (nomeAba === 'mensagens') popularSelectDestinatariosAdmin();
}

document.querySelectorAll('#barra-abas-admin .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => abrirAbaAdmin(btn.dataset.abaAdmin));
});
document.querySelectorAll('.btn-atalho-admin').forEach(btn => {
    btn.addEventListener('click', () => abrirAbaAdmin(btn.dataset.abrirAba));
});
const btnAbrirPainelAdmin = document.getElementById('btn-abrir-painel-admin');
if (btnAbrirPainelAdmin) btnAbrirPainelAdmin.addEventListener('click', () => abrirAbaAdmin('cards'));
const btnFecharPainelAdmin = document.getElementById('btn-fechar-painel-admin');
if (btnFecharPainelAdmin) btnFecharPainelAdmin.addEventListener('click', () => modalPainelAdmin.classList.remove('active'));

function iniciarAmbienteAdmin() {
    inicializarPainelAdmin();
    ouvirCardsGlobaisAdmin();
    ouvirEPovoarMenuVisualAdmin();
    ouvirSugestoesAdmin();

    escutar('usuarios', 'value', snapshot => {
        cacheUsuariosAdmin = snapshot.val() || {};
        renderizarKpisDashboard();
        renderizarConferenciaPagamentos();
        if (document.getElementById('aba-admin-relatorios').classList.contains('active')) renderizarRelatorios();
        popularSelectDestinatariosAdmin();
    });
}

// KPIs
function calcularMetricas() {
    const usuarios = cacheUsuariosAdmin || {};
    const cards = cacheCardsAdmin || {};
    let totalUsuarios = 0, totalPagos = 0, pedidosPendentes = 0, patchesVendidos = 0, faturamento = 0;
    let novos7 = 0, novos30 = 0;
    const agora = Date.now();
    const vendasPorPatch = {};

    Object.keys(usuarios).forEach(uid => {
        const u = usuarios[uid];
        if (!u || u.email === EMAIL_ADMIN) return;
        totalUsuarios++;
        if (u.status_cadastro === "pago") totalPagos++;
        if (u.pedidos) pedidosPendentes += Object.keys(u.pedidos).length;
        if (u.data_cadastro) {
            const dias = (agora - u.data_cadastro) / 86400000;
            if (dias <= 7) novos7++;
            if (dias <= 30) novos30++;
        }
        const jogos = u.jogos_liberados || {};
        Object.keys(jogos).forEach(cardId => {
            if (jogos[cardId] !== true) return;
            patchesVendidos++;
            const card = cards[cardId];
            const valor = precoParaNumero(card && card.preco);
            faturamento += valor;
            const nome = card ? card.titulo : `Card removido (${cardId.slice(-6)})`;
            if (!vendasPorPatch[nome]) vendasPorPatch[nome] = { qtd: 0, total: 0 };
            vendasPorPatch[nome].qtd++;
            vendasPorPatch[nome].total += valor;
        });
    });

    return { totalUsuarios, totalPagos, pedidosPendentes, patchesVendidos, faturamento, novos7, novos30, vendasPorPatch, totalCards: Object.keys(cards).length };
}

function montarKpis(container, itens) {
    if (!container) return;
    container.innerHTML = itens.map(i => `
        <div class="kpi-card ${i.classe || ''}">
            <span>${escapar(i.rotulo)}</span>
            <strong>${escapar(i.valor)}</strong>
        </div>`).join("");
}

function renderizarKpisDashboard() {
    const m = calcularMetricas();
    montarKpis(document.getElementById('grid-kpis-dashboard'), [
        { rotulo: "Faturamento da temporada", valor: formatarMoeda(m.faturamento) },
        { rotulo: "Patches vendidos", valor: m.patchesVendidos },
        { rotulo: "Comprovantes pendentes", valor: m.pedidosPendentes, classe: m.pedidosPendentes ? "alerta" : "" },
        { rotulo: "Usuários cadastrados", valor: m.totalUsuarios },
        { rotulo: "Novos (7 dias)", valor: m.novos7 },
        { rotulo: "Cards no catálogo", valor: m.totalCards }
    ]);
}

function renderizarRelatorios() {
    const m = calcularMetricas();
    montarKpis(document.getElementById('grid-kpis-relatorios'), [
        { rotulo: "Faturamento", valor: formatarMoeda(m.faturamento) },
        { rotulo: "Patches vendidos", valor: m.patchesVendidos },
        { rotulo: "Ticket médio", valor: formatarMoeda(m.patchesVendidos ? m.faturamento / m.patchesVendidos : 0) },
        { rotulo: "Jogadores pagantes", valor: m.totalPagos },
        { rotulo: "Novos em 30 dias", valor: m.novos30 },
        { rotulo: "Pendências", valor: m.pedidosPendentes, classe: m.pedidosPendentes ? "alerta" : "" }
    ]);

    const tabelaVendas = document.getElementById('tabela-vendas-patch');
    const linhas = Object.keys(m.vendasPorPatch).sort((a, b) => m.vendasPorPatch[b].qtd - m.vendasPorPatch[a].qtd);
    tabelaVendas.innerHTML = linhas.length ? `
        <table><thead><tr><th>Patch</th><th>Qtd</th><th>Receita</th></tr></thead><tbody>
        ${linhas.map(n => `<tr><td>${escapar(n)}</td><td>${m.vendasPorPatch[n].qtd}</td><td>${formatarMoeda(m.vendasPorPatch[n].total)}</td></tr>`).join("")}
        </tbody></table>` : `<p class="vazio-lista">Nenhuma venda registrada.</p>`;

    const usuarios = cacheUsuariosAdmin || {};
    const listaUsuarios = Object.keys(usuarios)
        .filter(uid => usuarios[uid] && usuarios[uid].email !== EMAIL_ADMIN)
        .sort((a, b) => (usuarios[b].data_cadastro || 0) - (usuarios[a].data_cadastro || 0))
        .slice(0, 20);
    document.getElementById('tabela-novos-usuarios').innerHTML = listaUsuarios.length ? `
        <table><thead><tr><th>Jogador</th><th>E-mail</th><th>Cadastro</th><th>Patches</th></tr></thead><tbody>
        ${listaUsuarios.map(uid => {
            const u = usuarios[uid];
            const qtd = Object.keys(u.jogos_liberados || {}).length;
            return `<tr><td>${escapar(u.nome + " " + (u.sobrenome || ""))}</td><td>${escapar(u.email)}</td><td>${formatarData(u.data_cadastro)}</td><td>${qtd}</td></tr>`;
        }).join("")}
        </tbody></table>` : `<p class="vazio-lista">Nenhum usuário cadastrado.</p>`;
}

const btnExportarRelatorio = document.getElementById('btn-exportar-relatorio');
if (btnExportarRelatorio) {
    btnExportarRelatorio.addEventListener('click', () => {
        const usuarios = cacheUsuariosAdmin || {};
        const cards = cacheCardsAdmin || {};
        const linhas = [["Jogador", "Email", "WhatsApp", "Status", "Cadastro", "Patches", "Valor total"]];
        Object.keys(usuarios).forEach(uid => {
            const u = usuarios[uid];
            if (!u || u.email === EMAIL_ADMIN) return;
            const jogos = Object.keys(u.jogos_liberados || {});
            const total = jogos.reduce((soma, id) => soma + precoParaNumero(cards[id] && cards[id].preco), 0);
            const nomesJogos = jogos.map(id => (cards[id] ? cards[id].titulo : id)).join(" | ");
            linhas.push([`${u.nome} ${u.sobrenome || ""}`, u.email, u.whatsapp || "", u.status_cadastro || "", formatarData(u.data_cadastro), nomesJogos, total.toFixed(2)]);
        });
        const csv = linhas.map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'relatorio-temporada.csv';
        a.click();
    });
}

// Conferência de pagamentos
function renderizarConferenciaPagamentos() {
    const lista = document.getElementById('lista-conferencia-pagamentos');
    if (!lista) return;
    const usuarios = cacheUsuariosAdmin || {};
    const cards = cacheCardsAdmin || {};
    let totalPendentes = 0, valorPendente = 0;
    let html = "";

    Object.keys(usuarios).forEach(uid => {
        const u = usuarios[uid];
        if (!u || u.email === EMAIL_ADMIN || !u.pedidos) return;
        Object.keys(u.pedidos).forEach(pedidoId => {
            const pedido = u.pedidos[pedidoId];
            const card = cards[pedido.id_card_comprado];
            totalPendentes++;
            valorPendente += precoParaNumero(card && card.preco);
            const temComprovante = pedido.comprovante_base64 && pedido.comprovante_base64.length > 10;
            html += `
                <div class="user-item" style="border-left:4px solid ${temComprovante ? '#ffcc00' : '#ff3333'};">
                    <div class="user-info">
                        <p><strong>Jogador:</strong> ${escapar(u.nome)} ${escapar(u.sobrenome || "")}</p>
                        <p><strong>E-mail:</strong> ${escapar(u.email)}</p>
                        <p><strong>WhatsApp:</strong> ${escapar(u.whatsapp || 'Não cadastrado')}</p>
                        <p><strong>Patch:</strong> ${escapar(card ? card.titulo : 'Card removido')} — ${escapar(card ? (card.preco || 'R$ 10,00') : '—')}</p>
                        <p><strong>Enviado em:</strong> ${formatarData(pedido.timestamp)}</p>
                    </div>
                    ${temComprovante
                        ? `<button class="btn-visualizar-comprovante" onclick="abrirComprovantePedidoNovaAba('${uid}','${pedidoId}')">👁️ Conferir comprovante</button>`
                        : `<p style="color:#ff3333; font-size:0.8rem;">Sem arquivo anexado.</p>`}
                    <button class="btn-inject" onclick="marcarPagamentoValido('${uid}','${pedidoId}','${pedido.id_card_comprado}')">✅ Marcar como VÁLIDO e liberar patch</button>
                    <button class="btn-sair" style="width:100%; margin-top:6px; background:#211212; border:1px dashed #ff3333; color:#ff5555;" onclick="marcarPagamentoInvalido('${uid}','${pedidoId}')">❌ Marcar como inválido</button>
                </div>`;
        });
    });

    montarKpis(document.getElementById('grid-kpis-pagamentos'), [
        { rotulo: "Comprovantes na fila", valor: totalPendentes, classe: totalPendentes ? "alerta" : "" },
        { rotulo: "Valor em conferência", valor: formatarMoeda(valorPendente) }
    ]);
    lista.innerHTML = html || `<p class="vazio-lista">Nenhum comprovante aguardando conferência. ✅</p>`;
}

async function marcarPagamentoValido(uid, pedidoId, cardId) {
    if (!confirm("Confirmar que o comprovante é VÁLIDO e liberar o patch?")) return;
    try {
        const usuario = cacheUsuariosAdmin[uid] || {};
        const card = cacheCardsAdmin[cardId];
        await database.ref(`usuarios/${uid}/jogos_liberados/${cardId}`).set(true);
        await database.ref(`usuarios/${uid}/status_cadastro`).set("pago");
        await database.ref(`usuarios/${uid}/historico_pagamentos`).push({
            id_card: cardId,
            titulo: card ? card.titulo : cardId,
            valor: card ? (card.preco || "") : "",
            status: "valido",
            validado_em: Date.now()
        });
        await database.ref(`usuarios/${uid}/pedidos/${pedidoId}`).remove();
        await enviarMensagemInterna(uid, usuario.email || "", "Pagamento aprovado ✅",
            `Olá ${usuario.nome || ""}, seu comprovante foi conferido e marcado como VÁLIDO. O patch "${card ? card.titulo : ''}" já está liberado na sua conta.`);
        alert("🔥 Pagamento validado e patch liberado!");
    } catch (error) { alert("Erro ao processar: " + error.message); }
}

async function marcarPagamentoInvalido(uid, pedidoId) {
    const motivo = prompt("Descreva o motivo da recusa (será enviado ao jogador):", "Comprovante ilegível ou valor divergente.");
    if (motivo === null) return;
    try {
        const usuario = cacheUsuariosAdmin[uid] || {};
        await database.ref(`usuarios/${uid}/pedidos/${pedidoId}`).remove();
        await enviarMensagemInterna(uid, usuario.email || "", "Comprovante recusado ❌",
            `Seu comprovante não foi validado.\nMotivo: ${motivo}\nVocê pode reenviar um novo comprovante pela vitrine.`);
        alert("Pedido recusado e jogador notificado.");
    } catch (error) { alert("Erro: " + error.message); }
}

// ==========================================================================
// LISTA CLÁSSICA DE USUÁRIOS/PEDIDOS (ABA 3)
// ==========================================================================
const tabSolicPendentes = document.getElementById('tab-solic-pendentes');
const tabSolicConcluidos = document.getElementById('tab-solic-concluidos');
const tabSolicCadastrados = document.getElementById('tab-solic-cadastrados');

function trocarFiltroAdmin(filtro, botaoAtivo) {
    filtroAdminAtual = filtro;
    [tabSolicPendentes, tabSolicConcluidos, tabSolicCadastrados].forEach(b => b && b.classList.remove('active'));
    if (botaoAtivo) botaoAtivo.classList.add('active');
    document.getElementById('container-reset-pre-venda').style.display = filtro === "concluidos" ? "block" : "none";
    inicializarPainelAdmin();
}
if (tabSolicPendentes) tabSolicPendentes.addEventListener('click', () => trocarFiltroAdmin("pendentes", tabSolicPendentes));
if (tabSolicConcluidos) tabSolicConcluidos.addEventListener('click', () => trocarFiltroAdmin("concluidos", tabSolicConcluidos));
if (tabSolicCadastrados) tabSolicCadastrados.addEventListener('click', () => trocarFiltroAdmin("cadastrados", tabSolicCadastrados));

const buscaUsuariosInput = document.getElementById('busca-usuarios-admin');
if (buscaUsuariosInput) {
    buscaUsuariosInput.addEventListener('input', (e) => {
        buscaUsuariosAdmin = e.target.value.trim().toLowerCase();
        inicializarPainelAdmin();
    });
}

function inicializarPainelAdmin() {
    if (!listaUsuariosAdmin) return;
    database.ref('cards_disponiveis').once('value', snapshotCards => {
        const cacheCardsGlobais = snapshotCards.val() || {};
        cacheCardsAdmin = cacheCardsGlobais;

        database.ref('usuarios').once('value', snapshot => {
            listaUsuariosAdmin.innerHTML = "";
            const users = snapshot.val();
            cacheUsuariosAdmin = users || {};
            if (!users) { listaUsuariosAdmin.innerHTML = `<p class="vazio-lista">Nenhum usuário.</p>`; return; }

            let contagemFiltrados = 0;

            Object.keys(users).forEach(uid => {
                if (users[uid].email === EMAIL_ADMIN) return;

                if (buscaUsuariosAdmin) {
                    const alvoBusca = `${users[uid].nome || ""} ${users[uid].sobrenome || ""} ${users[uid].email || ""} ${users[uid].whatsapp || ""}`.toLowerCase();
                    if (!alvoBusca.includes(buscaUsuariosAdmin)) return;
                }

                const status = users[uid].status_cadastro || 'pendente_pagamento';
                const temPedidos = users[uid].pedidos && Object.keys(users[uid].pedidos).length > 0;

                if (filtroAdminAtual === "pendentes" && !temPedidos) return;
                if (filtroAdminAtual === "concluidos" && status !== "pago") return;
                if (filtroAdminAtual === "cadastrados" && status !== "cliente_cadastrado" && status !== "solicitou_exclusao") return;

                let listaJogosAtivosHtml = "";
                const jogos = users[uid].jogos_liberados || {};
                const keysJogos = Object.keys(jogos);
                if (keysJogos.length === 0) {
                    listaJogosAtivosHtml = "<li style='color:#ff3333;'>Nenhum card ativo</li>";
                } else {
                    keysJogos.forEach(gameId => {
                        const tituloJogo = cacheCardsGlobais[gameId] ? cacheCardsGlobais[gameId].titulo : `ID: ${gameId.slice(-6)}`;
                        listaJogosAtivosHtml += `<li style="display:flex; justify-content:space-between; align-items:center; background:#141d26; padding:5px; margin:3px 0; border-radius:4px; font-size:0.8rem;"><span>🎮 ${escapar(tituloJogo)}</span><button onclick="removerAcessoJogo('${uid}', '${gameId}')" style="background:none; border:none; color:#ff3333; cursor:pointer;">[Remover]</button></li>`;
                    });
                }

                const estiloSelect = `style="width:100%; height:40px; background:#1c2434; border:1px solid #242f41; border-radius:4px; color:#fff; padding:0 10px; margin-bottom:10px; font-size:0.85rem;"`;

                if (filtroAdminAtual === "pendentes") {
                    Object.keys(users[uid].pedidos).forEach(pedidoId => {
                        contagemFiltrados++;
                        const pedido = users[uid].pedidos[pedidoId];
                        const idCardComprado = pedido.id_card_comprado;
                        const dadosCard = cacheCardsGlobais[idCardComprado];

                        const userBox = document.createElement('div');
                        userBox.className = 'user-item';
                        userBox.style.borderLeft = "4px solid #ffcc00";

                        const tagJogo = dadosCard
                            ? `<p style="background:#132219; border:1px solid #00ff66; color:#00ff66; padding:6px; border-radius:4px; font-size:0.85rem; margin-bottom:10px;">🎯 <strong>Patch Solicitado:</strong> ${escapar(dadosCard.titulo)} (${escapar(dadosCard.preco || 'R$ 10,00')})</p>`
                            : `<p style="background:#221313; border:1px solid #ff3333; color:#ff3333; padding:6px; border-radius:4px; font-size:0.85rem; margin-bottom:10px;">⚠️ Card do Patch removido do sistema.</p>`;

                        const btnComp = pedido.comprovante_base64 && pedido.comprovante_base64.length > 10
                            ? `<button class="btn-visualizar-comprovante" onclick="abrirComprovantePedidoNovaAba('${uid}', '${pedidoId}')">👁️ Ver Comprovante Enviado</button>`
                            : `<p style="color:#ff3333; font-size:0.8rem; margin:5px 0;">Erro: Sem arquivo anexado.</p>`;

                        userBox.innerHTML = `
                            <div class="user-info">
                                <p><strong>Jogador:</strong> ${escapar(users[uid].nome)} ${escapar(users[uid].sobrenome || "")}</p>
                                <p><strong>E-mail:</strong> ${escapar(users[uid].email)}</p>
                                <p><strong>WhatsApp:</strong> ${escapar(users[uid].whatsapp || 'Não cadastrado')}</p>
                                ${tagJogo}
                                ${btnComp}
                            </div>
                            <button class="btn-inject" onclick="marcarPagamentoValido('${uid}', '${pedidoId}', '${idCardComprado}')">✅ Confirmar Pagamento &amp; Liberar Patch</button>
                            <button class="btn-sair" onclick="marcarPagamentoInvalido('${uid}', '${pedidoId}')" style="width:100%; font-size:0.8rem; padding:6px; margin-top:5px; background:#211212; border:1px dashed #ff3333; color:#ff5555;">❌ Recusar esta solicitação</button>
                        `;
                        listaUsuariosAdmin.appendChild(userBox);
                    });
                } else {
                    contagemFiltrados++;
                    const userBox = document.createElement('div');
                    userBox.className = 'user-item';
                    if (status === "solicitou_exclusao") userBox.style.border = "2px solid #ff3333";

                    if (filtroAdminAtual === "concluidos") {
                        userBox.innerHTML = `
                            <div class="user-info">
                                <p><strong>🏆 Jogador Ativo (Temporada):</strong> ${escapar(users[uid].nome)} ${escapar(users[uid].sobrenome || "")}</p>
                                <p><strong>WhatsApp:</strong> ${escapar(users[uid].whatsapp || 'Não cadastrado')}</p>
                                <p><strong>E-mail:</strong> ${escapar(users[uid].email)}</p>
                                <div style="margin: 10px 0; background:#1b2430; padding:8px; border-radius:4px;">
                                    <p style="margin:0 0 5px 0; font-size:0.8rem; color:#00ff66;">Cards Ativos na Conta:</p>
                                    <ul style="margin:0; padding:0; list-style:none;">${listaJogosAtivosHtml}</ul>
                                </div>
                            </div>
                            <div style="display:flex; gap:5px; align-items:center; margin-bottom:10px;">
                                <select id="select-game-${uid}" ${estiloSelect} style="margin:0; flex:1; height:40px;"><option value="">+ Injetar Card Extra</option></select>
                                <button class="btn-gamer" onclick="injetarCardDiretoAdmin('${uid}')" style="margin:0; height:40px; width:45px; padding:0;">+</button>
                            </div>
                            <button class="btn-sair" onclick="excluirSolicitacaoEComprovante('${uid}')" style="width:100%; font-size:0.8rem; padding:6px; background:#2d1313; border:1px solid #ff3333; color:#ff3333;">📦 Mover para Cadastrados</button>
                        `;
                    } else {
                        let botoes = `
                            <div style="display:flex; gap:5px; align-items:center;">
                                <select id="select-game-${uid}" ${estiloSelect} style="margin:0; flex:1; height:40px;"><option value="">Injetar Novo Patch Direto</option></select>
                                <button class="btn-gamer" onclick="injetarCardDiretoAdmin('${uid}')" style="margin:0; height:40px; width:45px; padding:0;">+</button>
                            </div>`;
                        if (status === "solicitou_exclusao") {
                            botoes = `
                                <div style="background:#281216; border:1px solid #ff3333; padding:10px; border-radius:4px; text-align:center;">
                                    <p style="color:#ff3333; font-weight:bold; font-size:0.85rem; margin-bottom:8px;">⚠️ O USUÁRIO SOLICITOU A EXCLUSÃO DA CONTA</p>
                                    <button class="btn-gamer" style="background:#ff3333; color:#fff; font-size:0.8rem; padding:8px;" onclick="deletarUsuarioDoBancoTotal('${uid}', '${escapar(users[uid].email)}')">🚨 APAGAR DADOS DO BANCO TOTAL</button>
                                </div>`;
                        }
                        userBox.innerHTML = `
                            <div class="user-info">
                                <p><strong>👥 Cliente da Base Comercial:</strong> ${escapar(users[uid].nome)} ${escapar(users[uid].sobrenome || "")}</p>
                                <p><strong>WhatsApp:</strong> ${escapar(users[uid].whatsapp || 'Não cadastrado')}</p>
                                <p><strong>E-mail:</strong> ${escapar(users[uid].email)}</p>
                                <p style="font-size:0.75rem; color:#8899a6;">Cadastro: ${formatarData(users[uid].data_cadastro)}</p>
                                <div style="margin: 10px 0; background:#161c26; border:1px solid #242f41; padding:8px; border-radius:4px;">
                                    <p style="margin:0 0 5px 0; font-size:0.8rem; color:#8899a6;">Patrimônio de Jogos do Cliente:</p>
                                    <ul style="margin:0; padding:0; list-style:none;">${listaJogosAtivosHtml}</ul>
                                </div>
                            </div>
                            ${botoes}`;
                    }
                    listaUsuariosAdmin.appendChild(userBox);
                    const selectElement = document.getElementById(`select-game-${uid}`);
                    if (selectElement) alimentarSelectComCards(selectElement, users[uid].jogos_liberados);
                }
            });

            if (contagemFiltrados === 0) {
                listaUsuariosAdmin.innerHTML = `<p class="vazio-lista">Nenhum jogador ou pedido nesta aba.</p>`;
            }
        });
    });
}

function abrirComprovantePedidoNovaAba(uid, pedidoId) {
    database.ref(`usuarios/${uid}/pedidos/${pedidoId}/comprovante_base64`).once('value', snapshot => {
        const base64Data = snapshot.val();
        if (!base64Data) return;
        const novaAba = window.open();
        if (!novaAba) return;
        if (base64Data.startsWith("data:application/pdf")) {
            novaAba.document.write(`<iframe src="${base64Data}" width="100%" height="100%" style="border:none;"></iframe>`);
        } else {
            novaAba.document.write(`<body style="background:#0b0e14; margin:0; display:flex; align-items:center; justify-content:center;"><img src="${base64Data}" style="max-width:100%; max-height:100vh; border:2px solid #00ff66; border-radius:8px;"></body>`);
        }
    });
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
        inicializarPainelAdmin();
    } catch (error) { alert("Erro: " + error.message); }
}

async function removerAcessoJogo(uid, gameId) {
    if (confirm("Deseja remover o acesso deste card da conta do jogador?")) {
        await database.ref(`usuarios/${uid}/jogos_liberados/${gameId}`).remove();
        alert("Acesso removido!");
        inicializarPainelAdmin();
    }
}

async function excluirSolicitacaoEComprovante(uid) {
    if (confirm("Deseja arquivar e mover este cliente para a aba de 'Clientes Cadastrados'?")) {
        try {
            await database.ref(`usuarios/${uid}/pedidos`).remove();
            await database.ref(`usuarios/${uid}/status_cadastro`).set("cliente_cadastrado");
            alert("Movido com sucesso para a lista de cadastrados!");
            inicializarPainelAdmin();
        } catch (error) { alert("Erro: " + error.message); }
    }
}

async function deletarUsuarioDoBancoTotal(uid, email) {
    if (confirm(`🚨 ALERTA CRÍTICO:\nDeseja deletar totalmente a conta e registros de ${email}?`)) {
        try {
            await database.ref(`usuarios/${uid}`).remove();
            await database.ref(`mensagens/${uid}`).remove();
            alert("Conta e registros eliminados do banco de dados!");
            inicializarPainelAdmin();
        } catch (error) { alert("Erro: " + error.message); }
    }
}

const btnResetGeral = document.getElementById('btn-reset-geral-temporada');
if (btnResetGeral) {
    btnResetGeral.addEventListener('click', async () => {
        if (!confirm("⚠️ ATENÇÃO - FIM DA PRÉ-VENDA:\n\nDeseja arquivar todos os aprovados da temporada?")) return;
        try {
            btnResetGeral.innerText = "ARQUIVANDO TEMPORADA..."; btnResetGeral.disabled = true;
            const snapshot = await database.ref('usuarios').once('value');
            const usuarios = snapshot.val();
            if (usuarios) {
                const loteMudancas = {};
                Object.keys(usuarios).forEach(uid => {
                    if (usuarios[uid].email !== EMAIL_ADMIN && usuarios[uid].status_cadastro === "pago") {
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
    });
}

// ==========================================================================
// SUGESTÕES (CLIENTE -> ADMIN)
// ==========================================================================
const btnSugestaoFlutuante = document.getElementById('btn-sugestao-flutuante');
if (btnSugestaoFlutuante) btnSugestaoFlutuante.addEventListener('click', () => modalSugestao.classList.add('active'));
const btnFecharSugestao = document.getElementById('btn-fechar-sugestao');
if (btnFecharSugestao) btnFecharSugestao.addEventListener('click', () => modalSugestao.classList.remove('active'));

const formSugestao = document.getElementById('form-sugestao');
if (formSugestao) {
    formSugestao.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!usuarioLogadoUid) return;
        const assunto = document.getElementById('sugestao-assunto').value.trim();
        const texto = document.getElementById('sugestao-texto').value.trim();
        if (!assunto || !texto) return alert("Preencha assunto e mensagem.");
        try {
            await database.ref('sugestoes').push({
                uid: usuarioLogadoUid,
                nome: dadosClienteAtual.nome || "",
                sobrenome: dadosClienteAtual.sobrenome || "",
                email: dadosClienteAtual.email || "",
                whatsapp: dadosClienteAtual.whatsapp || "",
                patches: Object.keys(dadosClienteAtual.jogos_liberados || {}).length,
                assunto: assunto,
                texto: texto,
                status: "nova",
                timestamp: Date.now()
            });
            alert("💡 Sugestão enviada ao administrador. Obrigado!");
            formSugestao.reset();
            modalSugestao.classList.remove('active');
        } catch (erro) { alert("Erro ao enviar sugestão: " + erro.message); }
    });
}

function ouvirSugestoesAdmin() {
    const lista = document.getElementById('lista-sugestoes-admin');
    if (!lista) return;
    escutar('sugestoes', 'value', snapshot => {
        const dados = snapshot.val() || {};
        const ids = Object.keys(dados).sort((a, b) => (dados[b].timestamp || 0) - (dados[a].timestamp || 0));
        if (!ids.length) { lista.innerHTML = `<p class="vazio-lista">Nenhuma sugestão recebida.</p>`; return; }
        lista.innerHTML = ids.map(id => {
            const s = dados[id];
            return `
                <div class="user-item" style="border-left:4px solid ${s.status === 'lida' ? '#8899a6' : '#00ff66'};">
                    <div class="user-info">
                        <p><strong>💡 ${escapar(s.assunto || 'Sugestão')}</strong></p>
                        <p style="font-size:0.75rem; color:#8899a6;">${formatarData(s.timestamp)}</p>
                        <p><strong>De:</strong> ${escapar(s.nome)} ${escapar(s.sobrenome || "")}</p>
                        <p><strong>E-mail:</strong> ${escapar(s.email)} · <strong>WhatsApp:</strong> ${escapar(s.whatsapp || '—')}</p>
                        <p><strong>Patches na conta:</strong> ${escapar(s.patches != null ? s.patches : 0)}</p>
                        <div class="corpo-email" style="margin-top:8px;">${escapar(s.texto)}</div>
                    </div>
                    <button class="btn-inject" onclick="responderSugestao('${id}','${s.uid}','${escapar(s.email)}')">↩️ Responder por mensagem interna</button>
                    <button class="btn-sair" style="width:100%; margin-top:6px;" onclick="removerSugestao('${id}')">🗑️ Excluir sugestão</button>
                </div>`;
        }).join("");
    });
}

async function responderSugestao(idSugestao, uidDestino, emailDestino) {
    const resposta = prompt("Escreva a resposta que o jogador receberá na caixa de mensagens:");
    if (!resposta) return;
    try {
        await enviarMensagemInterna(uidDestino, emailDestino, "Resposta à sua sugestão", resposta);
        await database.ref(`sugestoes/${idSugestao}/status`).set("lida");
        alert("Resposta enviada ao jogador!");
    } catch (e) { alert("Erro: " + e.message); }
}

async function removerSugestao(id) {
    if (confirm("Excluir esta sugestão?")) await database.ref(`sugestoes/${id}`).remove();
}

// ==========================================================================
// E-MAIL INTERNO (LOBBY DE MENSAGENS)
// ==========================================================================
async function enviarMensagemInterna(uidDestino, emailDestino, assunto, corpo) {
    const remetenteUid = usuarioLogadoUid || "admin";
    const remetenteNome = (auth.currentUser && auth.currentUser.email === EMAIL_ADMIN)
        ? "Administração do Hub"
        : `${dadosClienteAtual.nome || ""} ${dadosClienteAtual.sobrenome || ""}`.trim();
    const remetenteEmail = (auth.currentUser && auth.currentUser.email) || "";

    const mensagem = {
        de_uid: remetenteUid,
        de_nome: remetenteNome || remetenteEmail,
        de_email: remetenteEmail,
        para_uid: uidDestino,
        para_email: emailDestino,
        assunto: assunto,
        corpo: corpo,
        grupo: `${remetenteUid}_${Date.now()}`,
        timestamp: Date.now()
    };

    await database.ref(`mensagens/${uidDestino}`).push({ ...mensagem, pasta: "entrada", lido: false });
    if (remetenteUid !== uidDestino && remetenteUid !== "admin") {
        await database.ref(`mensagens/${remetenteUid}`).push({ ...mensagem, pasta: "enviado", lido: true });
    }
}

function ouvirMensagensDoUsuario(uid) {
    escutar(`mensagens/${uid}`, 'value', snapshot => {
        cacheMensagensUsuario = snapshot.val() || {};
        const naoLidas = Object.keys(cacheMensagensUsuario)
            .filter(id => cacheMensagensUsuario[id].pasta === "entrada" && !cacheMensagensUsuario[id].lido).length;
        const badge = document.getElementById('badge-emails-nao-lidos');
        if (badge) {
            badge.innerText = naoLidas;
            badge.style.display = naoLidas > 0 ? "inline-block" : "none";
        }
        if (modalEmailInterno && modalEmailInterno.classList.contains('active')) renderizarListasEmail();
    });
}

function renderizarListasEmail() {
    const listaEntrada = document.getElementById('lista-email-entrada');
    const listaEnviados = document.getElementById('lista-email-enviados');
    if (!listaEntrada || !listaEnviados) return;

    const ids = Object.keys(cacheMensagensUsuario).sort((a, b) =>
        (cacheMensagensUsuario[b].timestamp || 0) - (cacheMensagensUsuario[a].timestamp || 0));

    const render = (pasta) => {
        const filtrados = ids.filter(id => cacheMensagensUsuario[id].pasta === pasta);
        if (!filtrados.length) return `<p class="vazio-lista">Nenhuma mensagem aqui.</p>`;
        return filtrados.map(id => {
            const m = cacheMensagensUsuario[id];
            const pessoa = pasta === "entrada" ? m.de_nome || m.de_email : (m.para_email || "destinatário");
            return `
                <div class="item-email ${(!m.lido && pasta === 'entrada') ? 'nao-lido' : ''}">
                    <div onclick="abrirMensagemInterna('${id}')">
                        <h5>${escapar(m.assunto || '(sem assunto)')} ${m.editado ? '<span class="tag-editada">(editada)</span>' : ''}</h5>
                        <p class="meta-email">${pasta === 'entrada' ? 'De' : 'Para'}: ${escapar(pessoa)} · ${formatarData(m.timestamp)}</p>
                    </div>
                    <div class="acoes-item-email">
                        <button type="button" class="btn-mini-msg" onclick="abrirMensagemInterna('${id}')">👁️ Abrir</button>
                        ${pasta === 'entrada'
                            ? `<button type="button" class="btn-mini-msg" onclick="alternarLidoMensagem('${id}')">${m.lido ? '📩 Marcar não lida' : '✅ Marcar lida'}</button>`
                            : `<button type="button" class="btn-mini-msg" onclick="abrirEdicaoMensagem('${id}')">✏️ Editar</button>`}
                        <button type="button" class="btn-mini-msg perigo" onclick="excluirMensagemUsuario('${id}')">🗑️ Excluir</button>
                    </div>
                </div>`;
        }).join("");
    };

    listaEntrada.innerHTML = render("entrada");
    listaEnviados.innerHTML = render("enviado");
}

function trocarAbaEmail(nome) {
    document.querySelectorAll('[data-aba-email]').forEach(b => b.classList.toggle('active', b.dataset.abaEmail === nome));
    document.querySelectorAll('.pane-email').forEach(p => p.classList.remove('active'));
    const alvo = document.getElementById('aba-email-' + nome);
    if (alvo) alvo.classList.add('active');
    document.getElementById('leitor-email').style.display = "none";
}
document.querySelectorAll('[data-aba-email]').forEach(btn => {
    btn.addEventListener('click', () => trocarAbaEmail(btn.dataset.abaEmail));
});

let mensagemAbertaId = null;
function abrirMensagemInterna(id) {
    const m = cacheMensagensUsuario[id];
    if (!m) return;
    mensagemAbertaId = id;
    document.querySelectorAll('.pane-email').forEach(p => p.classList.remove('active'));
    const leitor = document.getElementById('leitor-email');
    leitor.style.display = "block";
    document.getElementById('leitor-email-assunto').innerText = m.assunto || "(sem assunto)";
    document.getElementById('leitor-email-meta').innerText =
        `${m.pasta === 'entrada' ? 'De' : 'Para'}: ${m.pasta === 'entrada' ? (m.de_nome || m.de_email) : m.para_email} · ${formatarData(m.timestamp)}`;
    document.getElementById('leitor-email-corpo').innerText = m.corpo || "";

    const formEditar = document.getElementById('form-editar-mensagem');
    if (formEditar) formEditar.style.display = "none";
    const btnEditar = document.getElementById('btn-editar-email');
    if (btnEditar) btnEditar.style.display = (m.pasta === 'enviado') ? "inline-block" : "none";
    const btnNaoLido = document.getElementById('btn-marcar-nao-lido-email');
    if (btnNaoLido) btnNaoLido.style.display = (m.pasta === 'entrada') ? "inline-block" : "none";

    if (m.pasta === "entrada" && !m.lido && usuarioLogadoUid) {
        database.ref(`mensagens/${usuarioLogadoUid}/${id}/lido`).set(true);
    }
}

// ==========================================================================
// GERENCIAMENTO DAS MENSAGENS DO PRÓPRIO USUÁRIO
// ==========================================================================
function caminhoMinhaMensagem(id) {
    return `mensagens/${usuarioLogadoUid}/${id}`;
}

async function excluirMensagemUsuario(id) {
    if (!usuarioLogadoUid || !cacheMensagensUsuario[id]) return;
    if (!confirm("Excluir esta mensagem da sua caixa? Esta ação não pode ser desfeita.")) return;
    try {
        await database.ref(caminhoMinhaMensagem(id)).remove();
        if (mensagemAbertaId === id) {
            mensagemAbertaId = null;
            trocarAbaEmail('entrada');
        }
        renderizarListasEmail();
    } catch (erro) { alert("Erro ao excluir mensagem: " + erro.message); }
}

async function alternarLidoMensagem(id) {
    const m = cacheMensagensUsuario[id];
    if (!usuarioLogadoUid || !m) return;
    try {
        await database.ref(`${caminhoMinhaMensagem(id)}/lido`).set(!m.lido);
        renderizarListasEmail();
    } catch (erro) { alert("Erro ao atualizar mensagem: " + erro.message); }
}

async function marcarTodasComoLidas() {
    if (!usuarioLogadoUid) return;
    const atualizacoes = {};
    Object.keys(cacheMensagensUsuario).forEach(id => {
        const m = cacheMensagensUsuario[id];
        if (m.pasta === 'entrada' && !m.lido) atualizacoes[`${id}/lido`] = true;
    });
    if (!Object.keys(atualizacoes).length) return alert("Nenhuma mensagem não lida.");
    try {
        await database.ref(`mensagens/${usuarioLogadoUid}`).update(atualizacoes);
        renderizarListasEmail();
    } catch (erro) { alert("Erro: " + erro.message); }
}

async function limparPastaMensagens(pasta) {
    if (!usuarioLogadoUid) return;
    const ids = Object.keys(cacheMensagensUsuario).filter(id => cacheMensagensUsuario[id].pasta === pasta);
    if (!ids.length) return alert("Nenhuma mensagem nesta pasta.");
    if (!confirm(`Excluir ${ids.length} mensagem(ns) da pasta ${pasta === 'entrada' ? 'Entrada' : 'Enviados'}?`)) return;
    const atualizacoes = {};
    ids.forEach(id => { atualizacoes[id] = null; });
    try {
        await database.ref(`mensagens/${usuarioLogadoUid}`).update(atualizacoes);
        mensagemAbertaId = null;
        trocarAbaEmail(pasta === 'entrada' ? 'entrada' : 'enviados');
        renderizarListasEmail();
    } catch (erro) { alert("Erro ao limpar pasta: " + erro.message); }
}

function abrirEdicaoMensagem(id) {
    const m = cacheMensagensUsuario[id];
    if (!m) return;
    if (m.pasta !== 'enviado') return alert("Você só pode editar mensagens que enviou.");
    abrirMensagemInterna(id);
    const form = document.getElementById('form-editar-mensagem');
    if (!form) return;
    document.getElementById('editar-msg-assunto').value = m.assunto || "";
    document.getElementById('editar-msg-corpo').value = m.corpo || "";
    form.style.display = "block";
    document.getElementById('editar-msg-assunto').focus();
}

const btnEditarEmail = document.getElementById('btn-editar-email');
if (btnEditarEmail) btnEditarEmail.addEventListener('click', () => { if (mensagemAbertaId) abrirEdicaoMensagem(mensagemAbertaId); });

const btnExcluirEmail = document.getElementById('btn-excluir-email');
if (btnExcluirEmail) btnExcluirEmail.addEventListener('click', () => { if (mensagemAbertaId) excluirMensagemUsuario(mensagemAbertaId); });

const btnMarcarNaoLido = document.getElementById('btn-marcar-nao-lido-email');
if (btnMarcarNaoLido) {
    btnMarcarNaoLido.addEventListener('click', async () => {
        if (!mensagemAbertaId || !usuarioLogadoUid) return;
        try {
            await database.ref(`${caminhoMinhaMensagem(mensagemAbertaId)}/lido`).set(false);
            mensagemAbertaId = null;
            trocarAbaEmail('entrada');
            renderizarListasEmail();
        } catch (erro) { alert("Erro: " + erro.message); }
    });
}

const btnCancelarEdicaoMsg = document.getElementById('btn-cancelar-edicao-msg');
if (btnCancelarEdicaoMsg) {
    btnCancelarEdicaoMsg.addEventListener('click', () => {
        document.getElementById('form-editar-mensagem').style.display = "none";
    });
}

const formEditarMensagem = document.getElementById('form-editar-mensagem');
if (formEditarMensagem) {
    formEditarMensagem.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!mensagemAbertaId || !usuarioLogadoUid) return;
        const assunto = document.getElementById('editar-msg-assunto').value.trim();
        const corpo = document.getElementById('editar-msg-corpo').value.trim();
        if (!assunto || !corpo) return alert("Preencha assunto e mensagem.");
        try {
            await database.ref(caminhoMinhaMensagem(mensagemAbertaId)).update({
                assunto: assunto,
                corpo: corpo,
                editado: true,
                editado_em: Date.now()
            });
            const idAtual = mensagemAbertaId;
            cacheMensagensUsuario[idAtual] = { ...cacheMensagensUsuario[idAtual], assunto, corpo, editado: true };
            formEditarMensagem.style.display = "none";
            abrirMensagemInterna(idAtual);
            renderizarListasEmail();
            alert("✅ Mensagem atualizada na sua cópia.");
        } catch (erro) { alert("Erro ao editar mensagem: " + erro.message); }
    });
}

const btnVoltarListaEmail = document.getElementById('btn-voltar-lista-email');
if (btnVoltarListaEmail) btnVoltarListaEmail.addEventListener('click', () => trocarAbaEmail('entrada'));

const btnResponderEmail = document.getElementById('btn-responder-email');
if (btnResponderEmail) {
    btnResponderEmail.addEventListener('click', () => {
        const m = cacheMensagensUsuario[mensagemAbertaId];
        if (!m) return;
        trocarAbaEmail('novo');
        const select = document.getElementById('select-destinatario-email');
        const destino = m.pasta === 'entrada' ? m.de_uid : m.para_uid;
        if (select) select.value = destino;
        document.getElementById('input-assunto-email').value = "Re: " + (m.assunto || "");
        document.getElementById('input-corpo-email').focus();
    });
}

function popularSelectDestinatarios(selectId, incluirAdmin = true) {
    const select = document.getElementById(selectId);
    if (!select) return;
    database.ref('usuarios').once('value', snapshot => {
        const usuarios = snapshot.val() || {};
        cacheUsuariosDiretorio = usuarios;
        const opcoes = [];
        Object.keys(usuarios).forEach(uid => {
            const u = usuarios[uid];
            if (!u || uid === usuarioLogadoUid) return;
            if (u.email === EMAIL_ADMIN) {
                if (incluirAdmin) opcoes.unshift(`<option value="${uid}">🛡️ Administração do Hub</option>`);
                return;
            }
            opcoes.push(`<option value="${uid}">${escapar(u.nome || "")} ${escapar(u.sobrenome || "")} — ${escapar(u.email || "")}</option>`);
        });
        select.innerHTML = `<option value="">Selecione o destinatário</option>` + opcoes.join("");
    });
}
function popularSelectDestinatariosAdmin() { popularSelectDestinatarios('select-destinatario-admin', false); }

const btnAbrirEmail = document.getElementById('btn-abrir-email');
if (btnAbrirEmail) {
    btnAbrirEmail.addEventListener('click', () => {
        modalEmailInterno.classList.add('active');
        trocarAbaEmail('entrada');
        renderizarListasEmail();
        popularSelectDestinatarios('select-destinatario-email', true);
    });
}
const btnFecharEmail = document.getElementById('btn-fechar-email');
if (btnFecharEmail) btnFecharEmail.addEventListener('click', () => modalEmailInterno.classList.remove('active'));

const formNovaMensagem = document.getElementById('form-nova-mensagem');
if (formNovaMensagem) {
    formNovaMensagem.addEventListener('submit', async (e) => {
        e.preventDefault();
        const uidDestino = document.getElementById('select-destinatario-email').value;
        const assunto = document.getElementById('input-assunto-email').value.trim();
        const corpo = document.getElementById('input-corpo-email').value.trim();
        if (!uidDestino || !assunto || !corpo) return alert("Preencha destinatário, assunto e mensagem.");
        try {
            const destinatario = cacheUsuariosDiretorio[uidDestino] || {};
            await enviarMensagemInterna(uidDestino, destinatario.email || "", assunto, corpo);
            alert("✉️ Mensagem enviada!");
            formNovaMensagem.reset();
            trocarAbaEmail('enviados');
            renderizarListasEmail();
        } catch (erro) { alert("Erro ao enviar: " + erro.message); }
    });
}

const formMsgAdmin = document.getElementById('form-msg-admin');
if (formMsgAdmin) {
    formMsgAdmin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const uidDestino = document.getElementById('select-destinatario-admin').value;
        const assunto = document.getElementById('assunto-msg-admin').value.trim();
        const corpo = document.getElementById('corpo-msg-admin').value.trim();
        if (!uidDestino || !assunto || !corpo) return alert("Preencha todos os campos.");
        try {
            const destinatario = (cacheUsuariosAdmin[uidDestino] || {});
            await enviarMensagemInterna(uidDestino, destinatario.email || "", assunto, corpo);
            alert("✉️ Mensagem enviada ao jogador!");
            formMsgAdmin.reset();
        } catch (erro) { alert("Erro: " + erro.message); }
    });
}

// ==========================================================================
// LOGIN / CADASTRO / PERFIL
// ==========================================================================
async function deslogar() {
    if (!confirm("Deseja realmente sair do sistema?")) return;
    try { await auth.signOut(); } catch (e) { /* ignore */ }
    restaurarTelaLoginDoZero();
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
    leitor.onload = (evento) => {
        comprovanteBase64Global = evento.target.result;
        fileInfoElement.innerText = `✅ Pronto: ${arquivo.name}`;
    };
    leitor.onerror = () => {
        alert("Erro ao ler o arquivo comprovante.");
        fileInfoElement.innerText = "Erro no carregamento do arquivo";
        comprovanteBase64Global = "";
    };
    leitor.readAsDataURL(arquivo);
}


// ==========================================================================
// ANIMAÇÃO DE CARREGAMENTO (LOGIN / CADASTRO)
// ==========================================================================
function definirCarregandoBotao(botao, ativo) {
    if (!botao) return;
    if (ativo) {
        if (!botao.dataset.textoOriginal) botao.dataset.textoOriginal = botao.innerText;
        botao.classList.add('carregando');
        botao.disabled = true;
    } else {
        botao.classList.remove('carregando');
        botao.disabled = false;
        if (botao.dataset.textoOriginal) botao.innerText = botao.dataset.textoOriginal;
    }
}

function definirCarregandoAuth(ativo, mensagem) {
    const overlay = document.getElementById('overlay-auth-carregando');
    const texto = document.getElementById('texto-auth-carregando');
    if (texto && mensagem) texto.innerText = mensagem;
    if (overlay) overlay.classList.toggle('active', !!ativo);
}

const formLoginElement = document.getElementById('form-login');
if (formLoginElement) {
    formLoginElement.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const senha = document.getElementById('login-senha').value;
        const btnLogar = document.getElementById('btn-logar');
        if (!email || !senha) { alert("Preencha todos os campos."); return; }
        definirCarregandoBotao(btnLogar, true);
        definirCarregandoAuth(true, "CONECTANDO...");
        try {
            await auth.signInWithEmailAndPassword(email, senha);
        } catch (erro) {
            alert("Erro ao autenticar: " + erro.message);
        } finally {
            definirCarregandoBotao(btnLogar, false);
            definirCarregandoAuth(false);
        }
    });
}

const btnEsqueciSenha = document.getElementById('btn-esqueci-senha');
if (btnEsqueciSenha) {
    btnEsqueciSenha.addEventListener('click', function () {
        const emailLogin = document.getElementById('login-email').value.trim();
        const inputRecuperarEmail = document.getElementById('recuperar-email');
        if (inputRecuperarEmail) inputRecuperarEmail.value = emailLogin;
        if (modalEsqueciSenha) modalEsqueciSenha.classList.add('active');
    });
}
const btnFecharEsqueciSenha = document.getElementById('btn-fechar-esqueci-senha');
if (btnFecharEsqueciSenha) btnFecharEsqueciSenha.addEventListener('click', () => modalEsqueciSenha.classList.remove('active'));

const formRecuperarSenhaInterno = document.getElementById('form-recuperar-senha-interno');
if (formRecuperarSenhaInterno) {
    formRecuperarSenhaInterno.addEventListener('submit', async function (e) {
        e.preventDefault();
        const emailRedefinicao = document.getElementById('recuperar-email').value.trim();
        const btn = formRecuperarSenhaInterno.querySelector('button[type="submit"]');
        if (!emailRedefinicao) { alert("⚠️ Por favor, informe um e-mail válido."); return; }
        let textoOriginal = "";
        if (btn) { textoOriginal = btn.innerText; btn.innerText = "ENVIANDO LINK..."; btn.disabled = true; }
        try {
            await auth.sendPasswordResetEmail(emailRedefinicao);
            alert("🚀 Link de redefinição enviado com sucesso!\nVerifique a sua caixa de entrada ou a pasta de spam.");
            if (modalEsqueciSenha) modalEsqueciSenha.classList.remove('active');
            formRecuperarSenhaInterno.reset();
        } catch (erro) {
            alert("Erro ao enviar redefinição: " + erro.message);
        } finally {
            if (btn) { btn.innerText = textoOriginal; btn.disabled = false; }
        }
    });
}

const formCadastroAuth = document.getElementById('form-cadastro-auth');
if (formCadastroAuth) {
    formCadastroAuth.addEventListener('submit', async function (e) {
        e.preventDefault();
        const nome = document.getElementById('cad-nome').value.trim();
        const sobrenome = document.getElementById('cad-sobrenome').value.trim();
        const whatsapp = document.getElementById('cad-whatsapp').value.trim();
        const email = document.getElementById('cad-email').value.trim();
        const senha = document.getElementById('cad-senha').value;
        const btnCadastrar = formCadastroAuth.querySelector('button[type="submit"]');

        if (!nome || !sobrenome || !whatsapp || !email || !senha) { alert("⚠️ Preencha todos os campos do formulário."); return; }
        if (!validarProvedorEmail(email)) { alert("⚠️ Por favor, utilize um provedor de e-mail válido (Ex: Gmail, Hotmail, Outlook, Yahoo)."); return; }
        if (senha.length < 6) { alert("⚠️ A senha deve conter no mínimo 6 dígitos."); return; }

        definirCarregandoBotao(btnCadastrar, true);
        definirCarregandoAuth(true, "CRIANDO SUA CONTA...");

        try {
            const credencial = await auth.createUserWithEmailAndPassword(email, senha);
            const uid = credencial.user.uid;
            await database.ref(`usuarios/${uid}`).set({
                nome, sobrenome, email, whatsapp,
                status_cadastro: "cliente_cadastrado",
                data_cadastro: Date.now(),
                avatar_base64: "",
                jogos_liberados: {},
                pedidos: {}
            });
            alert("🎯 Conta criada com sucesso! Seja bem-vindo ao HUB.");
            formCadastroAuth.reset();
        } catch (erro) {
            alert("Erro ao criar conta: " + erro.message);
        } finally {
            definirCarregandoBotao(btnCadastrar, false);
            definirCarregandoAuth(false);
        }
    });
}

// PERFIL COM AVATAR
const btnAbrirPerfil = document.getElementById('btn-abrir-perfil');
if (btnAbrirPerfil) {
    btnAbrirPerfil.addEventListener('click', function () {
        if (!modalEditarPerfil) return;
        document.getElementById('perf-email').value = dadosClienteAtual.email || "";
        document.getElementById('perf-nome').value = dadosClienteAtual.nome || "";
        document.getElementById('perf-sobrenome').value = dadosClienteAtual.sobrenome || "";
        document.getElementById('perf-whatsapp').value = dadosClienteAtual.whatsapp || "";
        avatarBase64Temp = null;
        const preview = document.getElementById('preview-avatar-perfil');
        if (preview) preview.src = dadosClienteAtual.avatar_base64 || "";
        modalEditarPerfil.classList.add('active');
    });
}
const btnFecharPerfil = document.getElementById('btn-fechar-perfil');
if (btnFecharPerfil) btnFecharPerfil.addEventListener('click', () => modalEditarPerfil.classList.remove('active'));

const btnEscolherAvatar = document.getElementById('btn-escolher-avatar');
const inputAvatarPerfil = document.getElementById('input-avatar-perfil');
if (btnEscolherAvatar && inputAvatarPerfil) {
    btnEscolherAvatar.addEventListener('click', () => inputAvatarPerfil.click());
    inputAvatarPerfil.addEventListener('change', async (e) => {
        const arquivo = e.target.files && e.target.files[0];
        if (!arquivo) return;
        try {
            avatarBase64Temp = await converterImagemParaBase64(arquivo, 320, true);
            document.getElementById('preview-avatar-perfil').src = avatarBase64Temp;
        } catch (erro) { alert(erro.message); }
    });
}
const btnRemoverAvatar = document.getElementById('btn-remover-avatar');
if (btnRemoverAvatar) {
    btnRemoverAvatar.addEventListener('click', () => {
        avatarBase64Temp = "";
        document.getElementById('preview-avatar-perfil').src = "";
    });
}

const formEditarPerfilCliente = document.getElementById('form-editar-perfil-cliente');
if (formEditarPerfilCliente) {
    formEditarPerfilCliente.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!usuarioLogadoUid) return;
        const atualizacao = {
            nome: document.getElementById('perf-nome').value.trim(),
            sobrenome: document.getElementById('perf-sobrenome').value.trim(),
            whatsapp: document.getElementById('perf-whatsapp').value.trim()
        };
        if (avatarBase64Temp !== null) atualizacao.avatar_base64 = avatarBase64Temp;
        try {
            await database.ref(`usuarios/${usuarioLogadoUid}`).update(atualizacao);
            alert("⚙️ Perfil atualizado com sucesso!");
            avatarBase64Temp = null;
            if (modalEditarPerfil) modalEditarPerfil.classList.remove('active');
        } catch (error) { alert("Erro ao atualizar perfil: " + error.message); }
    });
}

const btnSolicitarExclusaoConta = document.getElementById('btn-solicitar-exclusao-conta');
if (btnSolicitarExclusaoConta) {
    btnSolicitarExclusaoConta.addEventListener('click', async function () {
        if (!usuarioLogadoUid) return;
        if (confirm("🚨 ATENÇÃO CRÍTICA:\nDeseja realmente solicitar o encerramento dos seus dados? Seu acesso será suspenso imediatamente.")) {
            try {
                await database.ref(`usuarios/${usuarioLogadoUid}/status_cadastro`).set("solicitou_exclusao");
                if (modalEditarPerfil) modalEditarPerfil.classList.remove('active');
            } catch (error) { alert("Erro ao processar solicitação: " + error.message); }
        }
    });
}

// ==========================================================================
// COMPROVANTE / CHECKOUT
// ==========================================================================
const btnFecharFormElement = document.getElementById('btn-fechar-form');
if (btnFecharFormElement) btnFecharFormElement.addEventListener('click', () => modalFormEnvio.classList.remove('active'));

const inputComprovanteElement = document.getElementById('comprovante');
const dropZoneElement = document.getElementById('drop-zone');
const fileInfoElement = document.getElementById('file-info');
const formComprovanteElement = document.getElementById('form-comprovante');

if (dropZoneElement && inputComprovanteElement) {
    dropZoneElement.onclick = () => inputComprovanteElement.click();
    inputComprovanteElement.onchange = (e) => {
        if (e.target.files && e.target.files[0]) verificarArquivo(e.target.files[0]);
    };
    dropZoneElement.addEventListener('dragover', (e) => { e.preventDefault(); dropZoneElement.classList.add('hover'); });
    dropZoneElement.addEventListener('dragleave', () => dropZoneElement.classList.remove('hover'));
    dropZoneElement.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZoneElement.classList.remove('hover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) verificarArquivo(e.dataTransfer.files[0]);
    });
}

if (formComprovanteElement) {
    formComprovanteElement.addEventListener('submit', async function (e) {
        e.preventDefault();
        const cardIdEscolhido = document.getElementById('id-card-escolhido-compra').value;
        if (!cardIdEscolhido) { alert("Erro interno: Nenhum card foi selecionado para compra."); return; }
        if (!comprovanteBase64Global || comprovanteBase64Global.length < 50) { alert("⚠️ Por favor, anexe o comprovante PIX antes de concluir."); return; }
        if (!usuarioLogadoUid) { alert("Sua sessão expirou. Logue novamente antes de enviar."); return; }

        const btnSub = document.getElementById('btn-enviar-tudo');
        if (btnSub) { btnSub.innerText = "ENVIANDO COMPROVANTE..."; btnSub.disabled = true; }

        try {
            await database.ref(`usuarios/${usuarioLogadoUid}/pedidos`).push({
                id_card_comprado: cardIdEscolhido,
                comprovante_base64: comprovanteBase64Global,
                timestamp: Date.now()
            });
            await database.ref(`usuarios/${usuarioLogadoUid}/status_cadastro`).set("comprovante_enviado");
            alert("🚀 Comprovante enviado com sucesso!\nO administrador analisará este pedido para liberação.");
            if (modalFormEnvio) modalFormEnvio.classList.remove('active');
            formComprovanteElement.reset();
            comprovanteBase64Global = "";
            if (fileInfoElement) fileInfoElement.innerText = "Nenhum arquivo selecionado";
        } catch (erro) {
            alert("Erro de comunicação com o banco: " + erro.message);
        } finally {
            if (btnSub) { btnSub.innerText = "CONCLUIR INSCRIÇÃO"; btnSub.disabled = false; }
        }
    });
}

const btnCopiarPixPainel = document.getElementById('btn-copiar-pix-painel');
if (btnCopiarPixPainel) {
    btnCopiarPixPainel.addEventListener('click', () => {
        const valor = document.getElementById('valor-chave-pix').innerText;
        ejecutarCopiaGamerBlindada(valor, btnCopiarPixPainel);
    });
}

document.addEventListener('contextmenu', (e) => {
    const viewCli = document.getElementById('view-cliente');
    if (viewCli && viewCli.classList.contains('active')) {
        const target = e.target.closest('.game-card, .modal-content, img, #container-senha-protegida-modal');
        if (target) { e.preventDefault(); return false; }
    }
});
