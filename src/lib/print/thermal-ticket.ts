/**
 * Utilidad de impresión de comandas y recibos térmicos de 80mm
 */

export function printThermalTicket(elementId: string = 'thermal-ticket-print'): void {
  if (typeof window === 'undefined') return;

  const ticketElement = document.getElementById(elementId);
  if (!ticketElement) {
    console.error(`Elemento de ticket con ID "${elementId}" no encontrado.`);
    window.print();
    return;
  }

  // Ejecución directa de impresión nativa (optimizada mediante @media print)
  window.print();
}

/**
 * Imprime un ticket en una ventana o iframe oculto para evitar interferencias
 * con la vista principal del KDS o Dashboard.
 */
export function printTicketInIframe(elementId: string): void {
  if (typeof window === 'undefined') return;

  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    console.error(`Ticket element "#${elementId}" not found for iframe print.`);
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket de Comanda</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.25;
            color: #000;
            background: #fff;
            width: 80mm;
            padding: 4mm 5mm;
          }
          .dashed {
            border-bottom: 1px dashed #000;
            margin: 6px 0;
          }
          .bold { font-weight: bold; }
          .center { text-align: center; }
          .right { text-align: right; }
          .left { text-align: left; }
          .big { font-size: 18px; font-weight: bold; }
          .medium { font-size: 14px; font-weight: bold; }
          .small { font-size: 10px; }
          .table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>
        ${sourceElement.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
}
