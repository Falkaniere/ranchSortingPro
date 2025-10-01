import React from 'react';
import { DuoGroup } from 'core/models/Duo';
import './index.css';

export interface ResultsRow {
  duoId: string;
  duoLabel: string;
  group: DuoGroup;
  cattleCount?: number;
  timeSeconds?: number;
  position?: number;
  totalCattle?: number;
  totalTimeSeconds?: number;
}

interface ResultsTableProps {
  title: string;
  rows: ResultsRow[];
  showTotals?: boolean;
}

export default function ResultsTable({
  title,
  rows,
  showTotals,
}: ResultsTableProps) {
  return (
    <div className="results-table">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Position</th>
            <th>Duo</th>
            <th>Group</th>
            {showTotals ? (
              <>
                <th>Total Cattle</th>
                <th>Total Time</th>
              </>
            ) : (
              <>
                <th>Cattle</th>
                <th>Time</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.duoId}>
              <td data-label="Position">{r.position ?? idx + 1}</td>
              <td data-label="Duo">{r.duoLabel}</td>
              <td data-label="Group">{r.group}</td>
              {showTotals ? (
                <>
                  <td data-label="Total Cattle">{r.totalCattle}</td>
                  <td data-label="Total Time">{r.totalTimeSeconds}</td>
                </>
              ) : (
                <>
                  <td data-label="Cattle">{r.cattleCount}</td>
                  <td data-label="Time">{r.timeSeconds}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
