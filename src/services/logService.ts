import { supabase } from './supabase';
import { LogEntry } from '../types/log';

export const logService = {
  /**
   * Registra un log de usuario en la base de datos.
   */
  addLog: async (log: Omit<LogEntry, 'id' | 'createdAt'>): Promise<LogEntry> => {
    const timestamp = new Date().toISOString();
    const payload = { ...log, createdAt: timestamp };
    const { data, error } = await supabase
      .from('user_logs')
      .insert([payload])
      .single();
    if (error || !data) throw error;
    const newLog = data as LogEntry;
    // Además, actualizar archivo JSON en Storage (bucket 'logs', fichero 'logs.json')
    try {
      const storage = supabase.storage.from('logs');
      // Descargar logs existentes
      const download = await storage.download('logs.json');
      let logsArray: LogEntry[] = [];
      if (!download.error && download.data) {
        const text = await new Response(download.data).text();
        logsArray = JSON.parse(text);
      }
      logsArray.push(newLog);
      const blob = new Blob([JSON.stringify(logsArray, null, 2)], { type: 'application/json' });
      // Subir JSON actualizado (upsert)
      await storage.upload('logs.json', blob, { upsert: true });
    } catch (storageErr) {
      console.error('Error actualizando logs JSON en Storage', storageErr);
    }
    return newLog;
  },
  /**
   * Obtiene logs de un usuario por su ID.
   */
  getLogsByUser: async (userId: string): Promise<LogEntry[]> => {
    const { data, error } = await supabase
      .from('user_logs')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data as LogEntry[];
  }
}; 