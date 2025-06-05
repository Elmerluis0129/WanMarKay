import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../../services/auth';
import { User } from '../../types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const user: User | null = auth.getCurrentUser();
  const location = useLocation();

  // Si el cliente está en primer login y NO está en /profile, forzar a /profile
  if (
    user &&
    user.role === 'client' &&
    user.first_login === true &&
    location.pathname !== '/profile'
  ) {
    return <Navigate to="/profile" replace />;
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
