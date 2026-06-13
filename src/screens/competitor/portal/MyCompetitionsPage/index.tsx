import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { CompetitionHistoryEntry } from '../../../../services/firebase/competitorHistory';
import { CompetitorProfile } from '../../../../core/models/CompetitorProfile';
import MyCompetitions from '../MyCompetitions';

interface OutletCtx {
  history: CompetitionHistoryEntry[];
  profile: CompetitorProfile | null;
}

export default function MyCompetitionsPage() {
  const { history } = useOutletContext<OutletCtx>();
  return <MyCompetitions history={history} />;
}
