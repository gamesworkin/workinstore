// main.js - Portal Principal
const firebaseConfig = {
    apiKey: "AIzaSyDiAP2IvsfPac29qzFA71sbLYuizVxZ9HQ",
    authDomain: "portal-workin-store.firebaseapp.com",
    projectId: "portal-workin-store",
    storageBucket: "portal-workin-store.firebasestorage.app",
    messagingSenderId: "803334158041",
    appId: "1:803334158041:web:5ef4069e7ec3a5973970c8"
  };

// Inicializa apenas se não estiver inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const navHeader = document.getElementById('nav-header');
const grid = document.getElementById('grid');

function loadPortal() {
    const dbRef = firebase.database().ref();

    // Carrega o Cabeçalho
    dbRef.child('header/').on('value', (snapshot) => {
        navHeader.innerHTML = '';
        const links = snapshot.val();
        if (links) {
            Object.values(links).forEach(item => {
                const a = document.createElement('a');
                a.href = item.url;
                a.innerText = item.title;
                a.style.margin = "0 15px";
                a.style.color = "white";
                a.style.textDecoration = "none";
                a.style.fontSize = "1.1rem";
                navHeader.appendChild(a);
            });
        }
    });

    // Carrega os Cards de Serviços (O FOR EACH QUE VOCÊ PEDIU)
    dbRef.child('servicos/').on('value', (snapshot) => {
        grid.innerHTML = ''; // Limpa o grid para evitar duplicatas
        const servicos = snapshot.val();
        
        if (servicos) {
            Object.values(servicos).forEach(servico => {
                const card = document.createElement('div');
                card.className = 'card';
                
                card.innerHTML = `
                    <h3 style="margin-bottom: 10px;">${servico.title}</h3>
                    <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 15px;">${servico.desc}</p>
                    <a href="${servico.url}" style="display: block; background: var(--accent); padding: 10px; border-radius: 8px; text-decoration: none; color: white; font-weight: bold;">Acessar</a>
                `;
                
                grid.appendChild(card);
            });
        }
    });
}

// Executa ao carregar a página
document.addEventListener('DOMContentLoaded', loadPortal);
