import { supabase } from './supabase';
import { User } from '../types/user';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, password, role');
    if (error) throw error;
    return (data || []).map((d: any) => ({
      id: d.id,
      username: d.username,
      fullName: d.full_name,
      password: d.password,
      role: d.role
    }));
  },
  addUser: async (user: User): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .insert([{ username: user.username, full_name: user.fullName, password: user.password, role: user.role }])
      .select('id, username, full_name, password, role')
      .single();
    if (error || !data) throw error;
    return {
      id: data.id,
      username: data.username,
      fullName: data.full_name,
      password: data.password,
      role: data.role
    };
  },
  // Puedes añadir updateUser, deleteUser... según necesidades
};
