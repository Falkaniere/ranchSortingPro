import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { generateUniqueDuos } from 'core/logic/pairing';
import { useResults } from 'context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { CompetitorForm } from './CompetitorForm';
import { CompetitorList } from './CompetitorList';
import { AthletePickerModal } from './AthletePickerModal';
import { ExcelImportModal } from './ExcelImportModal';

export default function Registration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { setDuosMeta } = useResults();
  const { competitors, numRounds, setCompetitors, setDuos, setNumRounds, competition } = useCompetition();
  const isFinished = competition?.status === 'finished';

  const [isSorting, setIsSorting] = useState(false);
  const [athletePickerOpen, setAthletePickerOpen] = useState(false);
  const [sheetImportOpen, setSheetImportOpen] = useState(false);

  const handleSortDuos = useCallback(function handleSortDuos() {
    if (competitors.length < 2) {
      toast('É necessário pelo menos 2 competidores para sortear as duplas.', 'error');
      return;
    }
    setIsSorting(true);
    try {
      const normalized = competitors.map((c) => ({ ...c, passes: numRounds }));
      const { duos, warnings } = generateUniqueDuos(normalized, {
        passesPerCompetitor: numRounds,
        method: 'auto',
      });

      const duosWithLabels = duos.map((duo) => {
        const riderOne = competitors.find((c) => c.id === duo.riderOneId);
        const riderTwo = competitors.find((c) => c.id === duo.riderTwoId);
        const label = `${riderOne?.name ?? '?'} & ${riderTwo?.name ?? '?'}`;
        return { ...duo, label };
      });

      setDuos(duosWithLabels);
      setDuosMeta(duosWithLabels);

      if (warnings.length > 0) {
        warnings.forEach((w) => toast(w, 'warning'));
      } else {
        toast(`${duosWithLabels.length} duplas geradas com sucesso!`, 'success');
      }
      navigate(`/competition/${id}/duos`);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setIsSorting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitors, numRounds, id]);

  const openAthletePicker = useCallback(() => setAthletePickerOpen(true), []);
  const openSheetImport = useCallback(() => setSheetImportOpen(true), []);

  const canSort = competitors.length >= 2;

  return (
    <div>
      <PageHeader
        title="Inscrições"
        subtitle={`${competitors.length} competidor${competitors.length !== 1 ? 'es' : ''} cadastrado${competitors.length !== 1 ? 's' : ''}`}
        actions={
          canSort && !isFinished ? (
            <Button onClick={handleSortDuos} loading={isSorting}>
              Sortear Duplas →
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        {!isFinished && (
          <CompetitorForm
            competitors={competitors}
            setCompetitors={setCompetitors}
            numRounds={numRounds}
            setNumRounds={setNumRounds}
            competitionId={id}
            onOpenAthletePicker={openAthletePicker}
            onOpenSheetImport={openSheetImport}
          />
        )}

        <CompetitorList
          competitors={competitors}
          setCompetitors={setCompetitors}
          isFinished={isFinished}
          competitionId={id}
          numRounds={numRounds}
          canSort={canSort}
          isSorting={isSorting}
          onSortDuos={handleSortDuos}
        />
      </div>

      <AthletePickerModal
        isOpen={athletePickerOpen}
        onClose={() => setAthletePickerOpen(false)}
        competitors={competitors}
        setCompetitors={setCompetitors}
        numRounds={numRounds}
        competitionId={id}
      />

      <ExcelImportModal
        isOpen={sheetImportOpen}
        onClose={() => setSheetImportOpen(false)}
        competitors={competitors}
        setCompetitors={setCompetitors}
        numRounds={numRounds}
        competitionId={id}
      />
    </div>
  );
}
