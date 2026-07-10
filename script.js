
// Simulação de "progresso" no console para os desenvolvedores
console.log("Iniciando carregamento dos módulos...");
setTimeout(() => console.log("Carregando banco de dados de usuários..."), 1000);
setTimeout(() => console.log("Sincronizando loja online..."), 2500);
setTimeout(() => console.log("Portal pronto para receber novas camadas!"), 4000);

// Pequena interação: O título muda levemente
const title = document.querySelector('h1');
title.addEventListener('mouseover', () => {
    title.style.color = '#ffcc00';
});
title.addEventListener('mouseout', () => {
    title.style.color = '#fff';
});
