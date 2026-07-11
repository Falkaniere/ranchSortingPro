import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Qualifiers from './index';
import { AuthProvider } from 'context/AuthContext';
import { CompetitionProvider } from 'context/CompetitionContext';
import { ResultsProvider } from 'context/ResultContext';
import { ToastProvider } from 'components/ui/Toast';

// Renders the real screen inside the real provider tree it depends on.
// The previous version of this test passed `rounds`/`results`/`setResults`
// props that the component never reads (it consumes CompetitionContext and
// ResultContext instead) and asserted on text — "🏇 Qualificatórias" — that
// the component does not render. It therefore validated nothing: a textbook
// false positive. This version exercises the actual component + context wiring.
function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/competition/test-id/record']}>
      <AuthProvider>
        <CompetitionProvider>
          <ResultsProvider>
            <ToastProvider>
              <Qualifiers />
            </ToastProvider>
          </ResultsProvider>
        </CompetitionProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Qualifiers screen', () => {
  it('renders the empty state when no duos have been drawn', async () => {
    renderScreen();
    // With an empty CompetitionContext there are no duos, so the screen must
    // guide the organizer back to the draw step instead of showing a form.
    // findByText awaits the async auth-state settle so state updates are flushed.
    expect(await screen.findByText('Nenhuma dupla cadastrada')).toBeInTheDocument();
  });

  it('shows the page title', async () => {
    renderScreen();
    expect(await screen.findByText('Qualificatória')).toBeInTheDocument();
  });
});
