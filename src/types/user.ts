export type UserRole = 'admin' | 'client';

export interface User {
    id: string;
    username: string;   // nuevo usuario para login
    fullName: string;
    password: string; // En una aplicación real, esto estaría hasheado
    role: UserRole;
}

export interface LoginCredentials {
    username: string;
    password: string;
} 