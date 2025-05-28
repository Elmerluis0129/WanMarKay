import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../services/auth';

interface PrivateRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    requireSuperAdmin?: boolean;
    requireAdminOrSuperAdmin?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
    children, 
    requireAdmin = false,
    requireSuperAdmin = false,
    requireAdminOrSuperAdmin = false
}) => {
    const isAuthenticated = auth.isAuthenticated();
    const isAdmin = auth.isAdmin();
    const isSuperAdmin = auth.isSuperAdmin();

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (requireSuperAdmin && !isSuperAdmin) {
        return <Navigate to="/403" />;
    }

    if (requireAdminOrSuperAdmin && !isAdmin && !isSuperAdmin) {
        return <Navigate to="/403" />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/403" />;
    }

    return <>{children}</>;
};