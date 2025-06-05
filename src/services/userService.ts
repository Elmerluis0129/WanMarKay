import { supabase } from './supabase';
import { User } from '../types/user';
import { logService } from './logService';
import { auth } from './auth';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, password, email, role, cedula, phone, address, mustChangePassword, passwordHistory, passwordChangedAt, created_at')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((d: any) => ({
      id: d.id,
      username: d.username,
      fullName: d.full_name,
      password: d.password,
      email: d.email || '',
      role: d.role,
      cedula: d.cedula,
      phone: d.phone,
      address: d.address,
      mustChangePassword: d.mustChangePassword,
      passwordHistory: d.passwordHistory || [],
      passwordChangedAt: d.passwordChangedAt,
      createdAt: d.created_at
    }));
  },
  addUser: async (user: User): Promise<User> => {
    const userData = {
      username: user.username,
      full_name: user.fullName,
      password: user.password,
      email: user.email,
      role: user.role,
      cedula: user.cedula,
      phone: user.phone,
      address: user.address,
      mustChangePassword: user.mustChangePassword,
      passwordHistory: user.passwordHistory || [],
      passwordChangedAt: user.passwordChangedAt,
      created_at: user.createdAt || new Date().toISOString(),
      first_login: true
    };

    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select('id, username, full_name, password, email, role, cedula, phone, address, mustChangePassword, passwordHistory, passwordChangedAt, created_at')
      .single();
    
    if (error || !data) throw error;
    
    return {
      id: data.id,
      username: data.username,
      fullName: data.full_name,
      password: data.password,
      email: data.email || '',
      role: data.role,
      cedula: data.cedula,
      phone: data.phone,
      address: data.address,
      mustChangePassword: data.mustChangePassword,
      passwordHistory: data.passwordHistory || [],
      passwordChangedAt: data.passwordChangedAt,
      createdAt: data.created_at
    };
  },
  updateUser: async (user: User): Promise<User> => {
    const userData = {
      username: user.username,
      full_name: user.fullName,
      password: user.password,
      email: user.email,
      role: user.role,
      cedula: user.cedula,
      phone: user.phone,
      address: user.address,
      mustChangePassword: user.mustChangePassword,
      passwordHistory: user.passwordHistory || [],
      passwordChangedAt: user.passwordChangedAt,
      created_at: user.createdAt
    };

    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', user.id)
      .select('id, username, full_name, password, email, role, cedula, phone, address, mustChangePassword, passwordHistory, passwordChangedAt, created_at')
      .single();
    if (error || !data) throw error;
    const updatedUser: User = {
      id: data.id,
      username: data.username,
      fullName: data.full_name,
      password: data.password,
      email: data.email || '',
      role: data.role,
      cedula: data.cedula,
      phone: data.phone,
      address: data.address,
      mustChangePassword: data.mustChangePassword,
      passwordHistory: data.passwordHistory || []
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
  // Obtiene usuarios paginados y filtrados por search
  getUsersPaginated: async (
    page = 1,
    pageSize = 10,
    search = ''
  ): Promise<{ data: User[]; count: number }> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    // Construir filtro de búsqueda en username, full_name, role o address
    let query = supabase
      .from('users')
      .select('id, username, full_name, password, email, role, cedula, phone, address', { count: 'exact' })
      .range(from, to);
    if (search) {
      const term = `%${search}%`;
      query = query.or(
        `username.ilike.${term},full_name.ilike.${term},role.ilike.${term},address.ilike.${term}`
      );
    }
    const { data, error, count } = await query;
    if (error) throw error;
    const users: User[] = (data || []).map((d: any) => ({
      id: d.id,
      username: d.username,
      fullName: d.full_name,
      password: d.password,
      email: d.email || '',
      role: d.role,
      cedula: d.cedula,
      phone: d.phone,
      address: d.address,
      mustChangePassword: d.mustChangePassword,
      passwordHistory: d.passwordHistory || [],
      passwordChangedAt: d.passwordChangedAt
    }));
    return { data: users, count: count || 0 };
  },
  // Puedes añadir deleteUser... según necesidades
};
