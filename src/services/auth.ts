import { supabase } from './supabase';
import { User, LoginCredentials } from '../types/user';

const AUTH_KEY = 'mk_auth';

export const auth = {
    login: async (credentials: LoginCredentials): Promise<User | null> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', credentials.username)
            .eq('password', credentials.password)
            .single();
        if (error || !data) return null;
        localStorage.setItem(AUTH_KEY, JSON.stringify(data));
        return data;
    },

    logout: (): void => {
        localStorage.removeItem(AUTH_KEY);
    },

    getCurrentUser: (): User | null => {
        const u = localStorage.getItem(AUTH_KEY);
        return u ? JSON.parse(u) : null;
    },

    isAuthenticated: (): boolean => {
        return !!auth.getCurrentUser();
    },

    isAdmin: (): boolean => {
        const user = auth.getCurrentUser();
        return user?.role === 'admin';
    }
}; 