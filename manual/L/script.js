document.addEventListener('DOMContentLoaded', () => {
    // 1. Bloqueio do botão direito nos QR codes
    const qrImages = document.querySelectorAll('.no-context');

    qrImages.forEach(image => {
        image.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        image.addEventListener('dragstart', (event) => {
            event.preventDefault();
        });
    });

    // 2. Funcionalidade para baixar o manual via PDF
    const btnPdf = document.getElementById('btn-pdf');
    if (btnPdf) {
        btnPdf.addEventListener('click', () => {
            // Altera dinamicamente o título do documento para ser o nome padrão do arquivo PDF
            const originalTitle = document.title;
            document.title = "Manual_OPL_FMCB_Funtuna";
            
            // Abre o utilitário nativo de salvar/imprimir do sistema
            window.print();
            
            // Restaura o título do site na aba do navegador após fechar a janela
            document.title = originalTitle;
        });
    }
});
