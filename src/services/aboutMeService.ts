import { supabase } from './supabase';

export interface AboutMe {
  id: string;
  nombre: string;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  contactos: any;
  seccion_marykay: string;
  imagen_cuerpo_completo_url?: string;
  logo_url?: string;
}

export const aboutMeService = {
  async getAboutMe(): Promise<AboutMe> {
    const { data, error } = await supabase
      .from('about_me')
      .select('*')
      .limit(1)
      .single();
    if (error) throw error;
    return data;
  },

  async updateAboutMe(id: string, updates: Partial<AboutMe>): Promise<AboutMe> {
    const { data, error } = await supabase
      .from('about_me')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    window.dispatchEvent(new Event('logo-updated'));
    return data;
  },

  async uploadProfileImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `perfil_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('assets')
      .upload(fileName, file, { upsert: true });
    if (error) throw error;
    // Obtener la URL pública
    const { data: publicUrlData } = supabase.storage
      .from('assets')
      .getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  },
}; 