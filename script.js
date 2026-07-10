:root { --accent: #6366f1; --accent2: #ec4899; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
    background: #050505; color: #fff; font-family: 'Inter', sans-serif;
    height: 100vh; display: flex; justify-content: center; align-items: center;
    overflow: hidden; perspective: 1000px;
}

/* Fundo Entrelaçado */
.light-layer { position: absolute; width: 100%; height: 100%; z-index: 0; filter: blur(120px); }
.blob { position: absolute; border-radius: 50%; opacity: 0.5; animation: weave 12s infinite alternate ease-in-out; }
.b1 { width: 40vw; height: 40vw; background: var(--accent); top: -10%; left: -10%; }
.b2 { width: 40vw; height: 40vw; background: var(--accent2); bottom: -10%; right: -10%; animation-delay: -4s; }
.b3 { width: 30vw; height: 30vw; background: #8b5cf6; top: 30%; left: 30%; animation-delay: -8s; }

@keyframes weave {
    0% { transform: scale(1) translate(0, 0); }
    100% { transform: scale(1.3) translate(50px, 50px); }
}

/* Conteúdo Responsivo */
.content { z-index: 1; text-align: center; width: 90%; max-width: 500px; }
.logo-box { width: 280px; height: 280px; margin: 0 auto 2rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 30px; display: flex; align-items: center; justify-content: center; }
.logo-box img { max-width: 80%; }
h1 { font-size: clamp(2rem, 5vw, 3rem); margin-bottom: 1rem; }

/* Barra 1 a 100% */
.progress-container { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin: 20px 0; }
.progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.3s; }
#percent { font-weight: bold; color: var(--accent2); }

@media (max-width: 600px) { .logo-box { width: 200px; height: 200px; } }
