import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { v4 as uuidv4 } from 'uuid';

// Crear usuario administrador inicial y usuario de prueba si no existen usuarios
const USERS_KEY = 'mk_users';
const users = localStorage.getItem(USERS_KEY);
if (!users) {
  const initialUsers = [
    {
      id: uuidv4(),
      fullName: 'Administrador',
      email: 'admin@marykay.com',
      password: 'admin123',
      role: 'admin'
    },
    {
      id: uuidv4(),
      fullName: 'Usuario de Prueba',
      email: 'test@example.com',
      password: 'test123',
      role: 'client'
    }
  ];
  localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
