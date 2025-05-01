import { User } from '../types/user';

export const auth = {
    getCurrentUser: (): User | null => {
        const userStr = sessionStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    setCurrentUser: (user: User) => {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    },

    logout: () => {
        sessionStorage.removeItem('currentUser');
    }
}; 