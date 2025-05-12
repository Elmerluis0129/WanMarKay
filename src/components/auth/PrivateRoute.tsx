import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../services/auth';

interface PrivateRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
    children, 
    requireAdmin = false 
}) => {
    const isAuthenticated = auth.isAuthenticated();
    const isAdmin = auth.isAdmin();

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/403" />;
    }

    return <>{children}</>;
}; 