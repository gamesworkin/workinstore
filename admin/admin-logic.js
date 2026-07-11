// Certifique-se de preencher abaixo com seu config real
const firebaseConfig = {
    apiKey: "AIzaSyDiAP2IvsfPac29qzFA71sbLYuizVxZ9HQ",
    authDomain: "portal-workin-store.firebaseapp.com",
    projectId: "portal-workin-store",
    storageBucket: "portal-workin-store.firebasestorage.app",
    messagingSenderId: "803334158041",
    appId: "1:803334158041:web:5ef4069e7ec3a5973970c8"
  };

firebase.initializeApp(firebaseConfig);

// Renderiza lista para editar/excluir
firebase.database().ref('servicos/').on('value', snap => {
    const lista = document.getElementById('lista-itens');
    lista.innerHTML = '';
    snap.forEach(child => {
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `<span>${child.val().title}</span> 
        <button style="width:auto; background:red;" onclick="deletar('${child.key}')">Apagar</button>`;
        lista.appendChild(div);
    });
});

function salvarItem() {
    firebase.database().ref('servicos/').push({
        title: document.getElementById('s-title').value,
        desc: document.getElementById('s-desc').value,
        url: document.getElementById('s-url').value,
        logo: document.getElementById('s-logo').value
    }).then(() => alert("Salvo!"));
}

function deletar(key) {
    if(confirm("Apagar este serviço?")) firebase.database().ref('servicos/'+key).remove();
}

function logout() { firebase.auth().signOut().then(() => window.location.href = "index.html"); }
