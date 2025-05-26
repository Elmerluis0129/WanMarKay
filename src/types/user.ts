export type UserRole = 'admin' | 'client';

export interface User {
    id: string;
    username: string;   // nuevo usuario para login
    fullName: string;
    password: string; // En una aplicación real, esto estaría hasheado
    email: string; // correo electrónico obligatorio
    role: UserRole;
    cedula?: string;
    phone?: string;
    address?: string;
    mustChangePassword?: boolean;
    passwordHistory?: string[];
    passwordChangedAt?: string;
    createdAt?: string; // Fecha de creación del usuario
}

export interface LoginCredentials {
    username: string;
    password: string;
} 