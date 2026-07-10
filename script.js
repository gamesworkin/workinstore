
console.log("Sistema em processamento criativo..."); 

// Efeito simples de interação: a barra de progresso acelera ao mover o mouse
window.addEventListener('mousemove', () => {
    document.querySelector('.bar').style.animationDuration = '0.5s';
});
