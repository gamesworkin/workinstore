// main.js - Portal Principal
const firebaseConfig = {
    apiKey: "AIzaSyDiAP2IvsfPac29qzFA71sbLYuizVxZ9HQ",
    authDomain: "portal-workin-store.firebaseapp.com",
    projectId: "portal-workin-store",
    storageBucket: "portal-workin-store.firebasestorage.app",
    messagingSenderId: "803334158041",
    appId: "1:803334158041:web:5ef4069e7ec3a5973970c8"
  };

// Inicializa o Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const navHeader = document.getElementById('nav-header');
const grid = document.getElementById('grid');

function loadPortal() {
    const dbRef = firebase.database().ref();

    // 1. Carrega o Cabeçalho
    dbRef.child('header/').on('value', (snapshot) => {
        navHeader.innerHTML = '';
        const links = snapshot.val();
        if (links) {
            Object.values(links).forEach(item => {
                const a = document.createElement('a');
                a.href = item.url;
                a.innerText = item.title;
                a.style.margin = "0 10px";
                a.style.color = "white";
                a.style.textDecoration = "none";
                a.style.fontSize = "0.9rem";
                navHeader.appendChild(a);
            });
        }
    });

    // 2. Carrega os Cards de Serviços com Logo
    dbRef.child('servicos/').on('value', (snapshot) => {
        grid.innerHTML = ''; 
        const servicos = snapshot.val();
        
        if (servicos) {
            Object.values(servicos).forEach(servico => {
                const card = document.createElement('div');
                card.className = 'card';
                
                // Verifica se existe logo, se não, não exibe a tag img
                const logoHtml = servico.logo ? 
                    `<img src="${servico.logo}" alt="Logo" style="width: 50px; height: 50px; object-fit: contain; margin-bottom: 10px; display: block;" onerror="this.style.display='none'">` 
                    : '';

                card.innerHTML = `
                    ${logoHtml}
                    <h3 style="margin-bottom: 8px;">${servico.title}</h3>
                    <p style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 15px;">${servico.desc}</p>
                    <a href="${servico.url}" style="display: block; background: #4f46e5; padding: 10px; border-radius: 8px; text-decoration: none; color: white; font-weight: bold; text-align: center;">Acessar</a>
                `;
                
                grid.appendChild(card);
            });
        }
    });
}

// Inicia ao carregar a página
document.addEventListener('DOMContentLoaded', loadPortal);
