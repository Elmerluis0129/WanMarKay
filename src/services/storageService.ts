import { supabase } from './supabase';

export const storageService = {
  // Sube un archivo al bucket 'assest' dentro de la carpeta 'facturas'
  uploadFacturaImage: async (file: File, invoiceId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${invoiceId}.${ext}`;
    const path = `facturas/${fileName}`;

    // 1) Subida
    const { error: uploadError } = await supabase
      .storage
      .from('assest')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;

    // 2) Devolver solo la ruta para almacenarla en la BD
    return path;
  },

  // Genera un signed URL válido por el tiempo especificado (en segundos)
  createSignedUrl: async (path: string, expiresInSec = 31536000): Promise<string> => {
    const { data, error } = await supabase
      .storage
      .from('assest')
      .createSignedUrl(path, expiresInSec);
    if (error || !data.signedUrl) throw error || new Error('No se generó signed URL');
    return data.signedUrl;
  },

  // Descarga un blob de la imagen si se necesita
  downloadFacturaImage: async (path: string): Promise<Blob> => {
    const { data, error } = await supabase
      .storage
      .from('assest')
      .download(path);
    if (error || !data) throw error;
    return data;
  },
}; 