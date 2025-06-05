export type UserRole = 'superadmin' | 'admin' | 'client';

export interface User {
    id: string;
    username: string;
    first_login?: boolean;  
    fullName?: string;  // Mantener por compatibilidad
    full_name?: string; // Usar este campo para la base de datos
    password: string; 
    email: string; 
    role: UserRole;
    isActive?: boolean; 
    cedula?: string;
    phone?: string;
    address?: string;
    mustChangePassword?: boolean;
    passwordHistory?: string[];
    passwordChangedAt?: string;
    createdAt?: string; 
}

export interface LoginCredentials {
    username: string;
    password: string;
} 