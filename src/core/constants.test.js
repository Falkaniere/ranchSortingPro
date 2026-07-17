import { competitionTab, COMPETITION_TAB_LABELS } from './constants';

describe('competitionTab', () => {
  it('maps draft to the "open" tab', () => {
    expect(competitionTab('draft')).toBe('open');
  });

  it('maps qualifier and final to the "ongoing" tab', () => {
    expect(competitionTab('qualifier')).toBe('ongoing');
    expect(competitionTab('final')).toBe('ongoing');
  });

  it('maps finished to the "finished" tab', () => {
    expect(competitionTab('finished')).toBe('finished');
  });

  it('has a pt-BR label for every tab', () => {
    expect(COMPETITION_TAB_LABELS.open).toBe('Aberta');
    expect(COMPETITION_TAB_LABELS.ongoing).toBe('Em andamento');
    expect(COMPETITION_TAB_LABELS.finished).toBe('Finalizada');
  });
});
