// Servicio de almacenamiento: convertir archivos a Base64
export const storageService = {
  /**
   * Convierte un File de imagen a una cadena Base64.
   */
  uploadFacturaImage: async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },
}; 