
// Script simples para simular atividade
console.log("Portal em desenvolvimento...");

// Efeito simples de log no console para dar um toque técnico
setInterval(() => {
    const status = ["Otimizando loja...", "Configurando servidores...", "Preparando patchs..."];
    console.log("Status: " + status[Math.floor(Math.random() * status.length)]);
}, 5000);
