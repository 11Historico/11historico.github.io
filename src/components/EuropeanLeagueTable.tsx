// src/components/EuropeanLeagueTable.tsx

import { buildEuropeanLeaguePhaseTable } from "../europe/europeanLeagueTable";
import type { EuropeanTournamentState } from "../europe/europeanTypes";
import { USER_TEAM_NAME } from "../simulation/leagueTable";

export function EuropeanLeagueTable({ tournament }: { tournament: EuropeanTournamentState }) {
  const rows = buildEuropeanLeaguePhaseTable(tournament, USER_TEAM_NAME);

  return (
    <section className="table-card european-league-table" aria-label="Clasificación de la competición europea">
      <h2>Clasificación europea · fase de liga</h2>

      <div className="league-table">
        <div className="league-table-head">
          <span>#</span>
          <span>Equipo</span>
          <span>Pts</span>
          <span>DG</span>
        </div>

        {rows.map((row, index) => (
          <div key={row.teamId} className={`league-table-row ${row.isUser ? "league-table-row-user" : ""}`}>
            <span>{index + 1}</span>
            <span>{row.teamName}</span>
            <strong>{row.points}</strong>
            <span>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default EuropeanLeagueTable;
