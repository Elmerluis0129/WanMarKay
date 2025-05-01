import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../components/auth/Login';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { ClientDashboard } from '../components/client/ClientDashboard';
import { CreateInvoice } from '../components/admin/CreateInvoice';
import { CreateUser } from '../components/admin/CreateUser';
import { RegisterPayment } from '../components/admin/RegisterPayment';
import { PrivateRoute } from '../components/auth/PrivateRoute';
import { auth } from '../services/auth';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          auth.isAuthenticated() ? (
            <Navigate to={auth.isAdmin() ? '/admin' : '/client'} />
          ) : (
            <Login />
          )
        } 
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute requireAdmin>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/invoice/create"
        element={
          <PrivateRoute requireAdmin>
            <CreateInvoice />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/payment/register"
        element={
          <PrivateRoute requireAdmin>
            <RegisterPayment />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/user/create"
        element={
          <PrivateRoute requireAdmin>
            <CreateUser />
          </PrivateRoute>
        }
      />
      <Route
        path="/client"
        element={
          <PrivateRoute>
            <ClientDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/"
        element={
          <Navigate to="/login" />
        }
      />
    </Routes>
  );
}; 