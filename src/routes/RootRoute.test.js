import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { RootRoute } from './RootRoute';
import { useAuth } from '../context/AuthContext';

// Isola o RootRoute do Firebase e das telas reais, mockando o contexto de auth
// e os componentes filhos por seus efeitos observáveis.
jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../screens/Landing', () => ({
  __esModule: true,
  default: () => <div>Landing pública</div>,
}));
jest.mock('../screens/Dashboard', () => ({
  __esModule: true,
  default: () => <div>Dashboard do organizador</div>,
}));

function renderRoot() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/competitor/provas" element={<div>Provas do competidor</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  useAuth.mockReset();
});

test('visitante não autenticado vê a landing page', () => {
  useAuth.mockReturnValue({ user: null, userType: 'organizer', isLoading: false });
  renderRoot();
  expect(screen.getByText('Landing pública')).toBeInTheDocument();
});

test('organizador autenticado vê o dashboard', () => {
  useAuth.mockReturnValue({ user: { uid: 'x' }, userType: 'organizer', isLoading: false });
  renderRoot();
  expect(screen.getByText('Dashboard do organizador')).toBeInTheDocument();
});

test('competidor autenticado é redirecionado para as provas', () => {
  useAuth.mockReturnValue({ user: { uid: 'x' }, userType: 'competitor', isLoading: false });
  renderRoot();
  expect(screen.getByText('Provas do competidor')).toBeInTheDocument();
});

test('enquanto carrega, não mostra a landing nem redireciona', () => {
  useAuth.mockReturnValue({ user: null, userType: 'organizer', isLoading: true });
  renderRoot();
  expect(screen.queryByText('Landing pública')).not.toBeInTheDocument();
  expect(screen.queryByText('Provas do competidor')).not.toBeInTheDocument();
});
