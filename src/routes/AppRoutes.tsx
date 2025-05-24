import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../components/auth/Login';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { ClientDashboard } from '../components/client/ClientDashboard';
import { CreateInvoice } from '../components/admin/CreateInvoice';
import { CreateUser } from '../components/admin/CreateUser';
import { RegisterPayment } from '../components/admin/RegisterPayment';
import { PaymentList } from '../components/admin/PaymentList';
import { PrivateRoute } from '../components/auth/PrivateRoute';
import { UserList } from '../components/admin/UserList';
import { auth } from '../services/auth';
import { ReportsDashboard } from '../components/admin/ReportsDashboard';
import NotFound from '../components/shared/NotFound';
import Forbidden from '../components/shared/Forbidden';
import ServerError from '../components/shared/ServerError';
import Maintenance from '../components/shared/Maintenance';
import NoResults from '../components/shared/NoResults';
import ComingSoon from '../components/shared/ComingSoon';
import UserProfile from '../components/shared/UserProfile';
import FAQ from '../components/shared/FAQ';
import About from '../components/shared/About';
import { BankAccountsPage } from '../components/admin/BankAccountsPage';
import ChangePassword from '../components/auth/ChangePassword';

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
        path="/admin/payment/list"
        element={
          <PrivateRoute requireAdmin>
            <PaymentList />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <PrivateRoute requireAdmin>
            <ReportsDashboard />
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
        path="/admin/user/list"
        element={
          <PrivateRoute requireAdmin>
            <UserList />
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
        path="/cuentas-bancarias"
        element={
          <PrivateRoute>
            <BankAccountsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/change-password"
        element={<ChangePassword />}
      />
      <Route
        path="/"
        element={
          <Navigate to="/login" />
        }
      />
      {/* Páginas de estado y utilitarias */}
      <Route path="/403" element={<Forbidden />} />
      <Route path="/500" element={<ServerError />} />
      <Route path="/503" element={<Maintenance />} />
      <Route path="/no-results" element={<NoResults />} />
      <Route path="/coming-soon" element={<ComingSoon />} />
      <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/about" element={<About />} />
      {/* Ruta 404: Página no encontrada */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}; 