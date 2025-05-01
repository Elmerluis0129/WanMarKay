import { User, LoginCredentials } from '../types/user';
import { storage } from '../utils/storage';

const AUTH_KEY = 'mk_auth';

export const auth = {
    login: (credentials: LoginCredentials): User | null => {
        const users = storage.getUsers();
        const user = users.find(
            u => u.email === credentials.email && u.password === credentials.password
        );
        
        if (user) {
            localStorage.setItem(AUTH_KEY, JSON.stringify(user));
            return user;
        }
        
        return null;
    },

    logout: (): void => {
        localStorage.removeItem(AUTH_KEY);
    },

    getCurrentUser: (): User | null => {
        const user = localStorage.getItem(AUTH_KEY);
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: (): boolean => {
        return !!auth.getCurrentUser();
    },

    isAdmin: (): boolean => {
        const user = auth.getCurrentUser();
        return user?.role === 'admin';
    }
}; 