// src/components/EuropeanLeagueTable.tsx

import { useMemo } from "react";

import { buildEuropeanLeaguePhaseTable } from "../europe/europeanLeagueTable";
import { EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS } from "../europe/europeanTournament";
import type { EuropeanTournamentState } from "../europe/europeanTypes";
import { USER_TEAM_NAME } from "../simulation/leagueTable";

export function EuropeanLeagueTable({ tournament }: { tournament: EuropeanTournamentState }) {
  const rows = useMemo(() => buildEuropeanLeaguePhaseTable(tournament, USER_TEAM_NAME), [tournament]);

  return (
    <section className="table-card european-league-table" aria-label="Clasificación de la competición europea">
      <h2>Clasificación europea · fase de liga</h2>
      <p className="european-league-table-note">
        Pasan a semifinales los {EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS} primeros.
      </p>

      <div className="league-table">
        <div className="league-table-head">
          <span>#</span>
          <span>Equipo</span>
          <span>Pts</span>
          <span>DG</span>
        </div>

        {rows.map((row, index) => (
          <div
            key={row.teamId}
            className={`league-table-row ${row.isUser ? "league-table-row-user" : ""} ${
              index < EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS ? "league-table-row-qualify" : ""
            }`}
          >
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
