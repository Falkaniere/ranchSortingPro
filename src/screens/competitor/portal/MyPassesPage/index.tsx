import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { CompetitionHistoryEntry } from '../../../../services/firebase/competitorHistory';
import { CompetitorProfile } from '../../../../core/models/CompetitorProfile';
import MyPasses from '../MyPasses';

interface OutletCtx {
  history: CompetitionHistoryEntry[];
  profile: CompetitorProfile | null;
}

export default function MyPassesPage() {
  const { history } = useOutletContext<OutletCtx>();
  return <MyPasses history={history} />;
}
