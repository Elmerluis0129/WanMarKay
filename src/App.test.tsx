import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('muestra la pantalla de login', () => {
  render(<App />);
  expect(screen.getByText(/Mary Kay - Iniciar Sesión/i)).toBeInTheDocument();
});
