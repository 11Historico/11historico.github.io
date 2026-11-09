// src/components/EuropeanLeagueTable.tsx

import { useMemo } from "react";

import { buildEuropeanLeaguePhaseTable } from "../europe/europeanLeagueTable";
import { EUROPEAN_LEAGUE_PHASE_PLAYOFF_POSITIONS, EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS } from "../europe/europeanTournament";
import type { EuropeanTournamentState } from "../europe/europeanTypes";
import { USER_TEAM_NAME } from "../simulation/leagueTable";
import { EuropeanCrest } from "./EuropeanCrest";
import { TeamKitIcon } from "./TeamKitIcon";

export function EuropeanLeagueTable({ tournament, chanceText }: { tournament: EuropeanTournamentState; chanceText?: string }) {
  const rows = useMemo(() => buildEuropeanLeaguePhaseTable(tournament, USER_TEAM_NAME), [tournament]);
  // Las filas solo traen el id: el país para el escudo sale de los rivales del torneo.
  const opponents = new Map(tournament.matches.map((match) => [match.opponent.id, match.opponent]));

  return (
    <section className="table-card european-league-table" aria-label="Clasificación de la competición europea">
      <h2>Clasificación europea · fase de liga</h2>
      <p className="european-league-table-note">
        Pasan a semifinales los {EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS} primeros, marcados en verde. El 3.º y el 4.º, en ámbar,
        juegan una previa a partido único por entrar, en casa del 3.º.
      </p>
      {/* v0.25.95: la probabilidad solo existe mientras queda fase de liga por jugar. */}
      {chanceText && <p className="european-semifinal-chance">{chanceText}</p>}

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
              index < EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS
                ? "league-table-row-qualify"
                : index < EUROPEAN_LEAGUE_PHASE_PLAYOFF_POSITIONS
                  ? "league-table-row-playoff"
                  : ""
            }`}
          >
            <span>{index + 1}</span>
            <span className="team-with-kit">
              {row.isUser ? <TeamKitIcon teamName={row.teamName} compact /> : opponents.has(row.teamId) && <EuropeanCrest opponent={opponents.get(row.teamId)!} compact />}
              <span>{row.teamName}</span>
            </span>
            <strong>{row.points}</strong>
            <span>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default EuropeanLeagueTable;
