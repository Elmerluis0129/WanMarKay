import { supabase } from './supabase';
import { User } from '../types/user';
import { logService } from './logService';
import { auth } from './auth';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, password, role, cedula, phone, address');
    if (error) throw error;
    return (data || []).map((d: any) => ({
      id: d.id,
      username: d.username,
      fullName: d.full_name,
      password: d.password,
      role: d.role,
      cedula: d.cedula,
      phone: d.phone,
      address: d.address
    }));
  },
  addUser: async (user: User): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .insert([{ username: user.username, full_name: user.fullName, password: user.password, role: user.role, cedula: user.cedula, phone: user.phone, address: user.address }])
      .select('id, username, full_name, password, role, cedula, phone, address')
      .single();
    if (error || !data) throw error;
    return {
      id: data.id,
      username: data.username,
      fullName: data.full_name,
      password: data.password,
      role: data.role,
      cedula: data.cedula,
      phone: data.phone,
      address: data.address
    };
  },
  updateUser: async (user: User): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update({ username: user.username, full_name: user.fullName, password: user.password, role: user.role, cedula: user.cedula, phone: user.phone, address: user.address })
      .eq('id', user.id)
      .select('id, username, full_name, password, role, cedula, phone, address')
      .single();
    if (error || !data) throw error;
    const updatedUser: User = {
      id: data.id,
      username: data.username,
      fullName: data.full_name,
      password: data.password,
      role: data.role,
      cedula: data.cedula,
      phone: data.phone,
      address: data.address
    };
    // Registrar acción de edición en el log
    try {
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        await logService.addLog({
          userId: currentUser.id,
          action: 'edit_user',
          entity: 'user',
          entityId: updatedUser.id!,
          changes: updatedUser,
          sessionId: undefined
        });
      }
    } catch (logError) {
      console.error('Error registrando log de usuario', logError);
    }
    return updatedUser;
  },
  // Puedes añadir deleteUser... según necesidades
};
