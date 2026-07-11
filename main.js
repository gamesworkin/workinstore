// Inicialize o Firebase no main.js também
const firebaseConfig = {
    apiKey: "AIzaSyDiAP2IvsfPac29qzFA71sbLYuizVxZ9HQ",
    authDomain: "portal-workin-store.firebaseapp.com",
    projectId: "portal-workin-store",
    storageBucket: "portal-workin-store.firebasestorage.app",
    messagingSenderId: "803334158041",
    appId: "1:803334158041:web:5ef4069e7ec3a5973970c8"
  };
firebase.initializeApp(firebaseConfig);

const navMenu = document.getElementById('nav-menu');

// Função para buscar os links no banco de dados e renderizar
function loadHeader() {
    firebase.database().ref('header/').on('value', (snapshot) => {
        navMenu.innerHTML = ''; // Limpa o menu antes de atualizar
        
        const links = snapshot.val();
        
        if (links) {
            Object.values(links).forEach(item => {
                const a = document.createElement('a');
                a.href = item.url;
                a.innerText = item.title;
                a.style.margin = "0 15px";
                a.style.color = "white";
                a.style.textDecoration = "none";
                navMenu.appendChild(a);
            });
        }
    });
}

// Inicializa a função ao carregar a página
document.addEventListener('DOMContentLoaded', loadHeader);
