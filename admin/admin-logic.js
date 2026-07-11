// Substitua com os dados do seu projeto no Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyDiAP2IvsfPac29qzFA71sbLYuizVxZ9HQ",
    authDomain: "portal-workin-store.firebaseapp.com",
    projectId: "portal-workin-store",
    storageBucket: "portal-workin-store.firebasestorage.app",
    messagingSenderId: "803334158041",
    appId: "1:803334158041:web:5ef4069e7ec3a5973970c8"
  };
firebase.initializeApp(firebaseConfig);

const form = document.getElementById('login-form');
const btn = document.getElementById('login-btn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;

    if (email !== "admin@admin.com") {
        alert("Acesso exclusivo para administrador.");
        return;
    }

    btn.innerText = "Autenticando...";
    btn.disabled = true;

    try {
        await firebase.auth().signInWithEmailAndPassword(email, pass);
        window.location.href = "painel.html"; // Redireciona para o painel após logar
    } catch (error) {
        alert("Erro: " + error.message);
        btn.innerText = "Autenticar";
        btn.disabled = false;
    }
});
