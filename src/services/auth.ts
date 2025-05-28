import { supabase } from './supabase';
import { User, LoginCredentials } from '../types/user';

const AUTH_KEY = 'mk_auth';

export const auth = {
    login: async (credentials: LoginCredentials): Promise<{ user: User | null, error?: string }> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', credentials.username)
                .eq('password', credentials.password)
                .single();
            
            if (error || !data) {
                return { user: null, error: 'Credenciales inválidas' };
            }

            // Verificar si el usuario está activo
            if (data.isActive === false) {
                return { 
                    user: null, 
                    error: 'Su cuenta ha sido desactivada. Por favor, contacte al administrador.' 
                };
            }

            localStorage.setItem(AUTH_KEY, JSON.stringify(data));
            return { user: data };
        } catch (error) {
            console.error('Error during login:', error);
            return { user: null, error: 'Error al iniciar sesión' };
        }
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
        return user?.role === 'admin' || user?.role === 'superadmin';
    },

    isSuperAdmin: (): boolean => {
        const user = auth.getCurrentUser();
        return user?.role === 'superadmin';
    }
}; 