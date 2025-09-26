// src/screens/Qualifiers/Qualifiers.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Qualifiers from './index';

describe('Teste de carga - Qualifiers', () => {
  it('renderiza 1000 duplas sem travar', () => {
    // 🔹 Criar 1000 duplas falsas
    const mockRounds = [
      Array.from({ length: 1000 }, (_, i) => [
        { name: `Competidor${i * 2}`, category: 'Aberta' },
        { name: `Competidor${i * 2 + 1}`, category: 'Aberta' },
      ]),
    ];

    // 🔹 Renderizar o componente dentro de um Router
    render(
      <MemoryRouter>
        <Qualifiers rounds={mockRounds} results={[]} setResults={() => {}} />
      </MemoryRouter>
    );

    // 🔹 Validar que renderizou algo
    expect(screen.getByText('🏇 Qualificatórias')).toBeInTheDocument();
  });
});
