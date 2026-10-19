/**
 * Utilidades para manejo, conversión y visualización de documentos PDF
 */

/**
 * Convierte un data URL (Base64) a un objeto Blob nativo
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
  const byteString = atob(parts[1] || '');
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

/**
 * Abre un PDF en una nueva pestaña sin restricciones de seguridad de Chromium para data: URLs.
 * Los navegadores modernos bloquean 'top-frame navigation to data: URLs'. Al convertirlo a Blob URL
 * (blob:http...) se abre perfectamente en el visor nativo de PDF de Chrome, Edge, Safari y Firefox.
 */
export function openPdfInNewTab(pdfUrl: string, filename = 'carta-menu.pdf'): void {
  if (!pdfUrl) return;

  if (pdfUrl.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(pdfUrl);
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, '_blank');
      if (!newWin) {
        // En caso de que el navegador bloquee popups emergentes directos
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return;
    } catch (err) {
      console.error('Error abriendo el documento PDF:', err);
    }
  }

  // Si es una URL regular (https://...)
  window.open(pdfUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Descarga directamente un PDF (base64 o URL)
 */
export function downloadPdf(pdfUrl: string, filename = 'carta-menu.pdf'): void {
  if (!pdfUrl) return;

  let downloadUrl = pdfUrl;
  let revokeUrl = false;

  if (pdfUrl.startsWith('data:')) {
    const blob = dataUrlToBlob(pdfUrl);
    downloadUrl = URL.createObjectURL(blob);
    revokeUrl = true;
  }

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (revokeUrl) {
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }
}
