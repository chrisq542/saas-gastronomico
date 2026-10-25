/**
 * Procesa y comprime una imagen seleccionada por el usuario en el cliente
 * convirtiéndola a una cadena Data URL en Base64 optimizada para guardarse
 * directamente en la base de datos (PostgreSQL TEXT).
 */
export async function fileToBase64Optimized(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: 'image/webp' | 'image/jpeg' | 'image/png';
  } = {}
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('El archivo seleccionado no es una imagen válida.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al decodificar la imagen.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Mantener relación de aspecto
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('No se pudo inicializar el lienzo para procesar la imagen.'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          let base64 = canvas.toDataURL(mimeType, quality);
          if (mimeType === 'image/webp' && base64.startsWith('data:image/png')) {
            base64 = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(base64);
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Convierte un archivo PDF a Base64 data URL para almacenamiento seguro
 */
export async function pdfFileToBase64(
  file: File,
  maxSizeBytes: number = 10 * 1024 * 1024
): Promise<string> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('El archivo seleccionado debe ser un documento en formato PDF.');
  }

  if (file.size > maxSizeBytes) {
    throw new Error('El archivo PDF excede el límite recomendado de 10 MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al procesar el archivo PDF.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

