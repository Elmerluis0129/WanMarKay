export type UserRole = 'admin' | 'client';

export interface User {
    id: string;
    fullName: string;
    email: string;
    password: string; // En una aplicación real, esto estaría hasheado
    role: UserRole;
}

export interface LoginCredentials {
    email: string;
    password: string;
} 