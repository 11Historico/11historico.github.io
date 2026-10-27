// src/components/PlayerRound.tsx

import { useMemo, useRef, useState } from "react";

import type {
  Formation,
  FormationSlot,
  PlayerPosition,
  PlayerSeason,
  SelectedPlayer,
  SeasonId,
} from "../types/game";

import {
  canPlayerFillSlotInNaturalLine,
  getAvailableSlotsForPlayer,
  getFormationLineForPlayerPosition,
  isPlayerAlreadySelected,
  resolvePlayerSlotPlacement,
} from "../domain/positionRules";

import { getAvailableAthleticSeasons, getPlayersBySeason } from "../data/athleticSeasons";
import { RATING_METHOD_LABELS } from "../data/sources";
import TacticalPitch from "./TacticalPitch";

import "./PlayerRound.css";

interface PlayerRoundProps {
  roundNumber: number;
  totalRounds?: number;
  season: SeasonId;
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
  lastSelection?: SelectedPlayer;
  strictOpenSlotLine?: FormationSlot["line"];
  onSelectPlayer: (selection: SelectedPlayer) => void;

  // Se mantiene como opcional para no romper App.tsx si todavía lo pasa,
  // pero ya no se muestra ningún botón para cambiar la temporada.
  onSkipRound?: () => void;
}

type SortKey =
  | "overall"
  | "pace"
  | "shooting"
  | "passing"
  | "dribbling"
  | "defending"
  | "physical"
  | "goalkeeping"
  | "mentality";

const POSITION_FILTERS: Array<{
  label: string;
  value: "ALL" | FormationSlot["line"];
}> = [
  { label: "Todos", value: "ALL" },
  { label: "Porteros", value: "goalkeeper" },
  { label: "Defensas", value: "defense" },
  { label: "Medios", value: "midfield" },
  { label: "Delanteros", value: "attack" },
];

const SORT_OPTIONS: Array<{ label: string; value: SortKey }> = [
  { label: "Media", value: "overall" },
  { label: "Ritmo", value: "pace" },
  { label: "Tiro", value: "shooting" },
  { label: "Pase", value: "passing" },
  { label: "Regate", value: "dribbling" },
  { label: "Defensa", value: "defending" },
  { label: "Físico", value: "physical" },
  { label: "Portería", value: "goalkeeping" },
  { label: "Mentalidad", value: "mentality" },
];

function getSlotLineForPosition(position: PlayerPosition): FormationSlot["line"] {
  return getFormationLineForPlayerPosition(position);
}

function playerMatchesLineFilter(
  player: PlayerSeason,
  filter: "ALL" | FormationSlot["line"]
): boolean {
  if (filter === "ALL") return true;

  return player.positions.some((position) => getSlotLineForPosition(position) === filter);
}

function filterSlotsByStrictLine(
  player: PlayerSeason,
  slots: FormationSlot[],
  strictOpenSlotLine?: FormationSlot["line"]
): FormationSlot[] {
  if (!strictOpenSlotLine) return slots;

  return slots.filter((slot) =>
    canPlayerFillSlotInNaturalLine(player, slot, strictOpenSlotLine),
  );
}

function isValidStrictLineSlot(
  player: PlayerSeason,
  slot: FormationSlot,
  strictOpenSlotLine?: FormationSlot["line"],
): boolean {
  if (!strictOpenSlotLine) return true;

  return canPlayerFillSlotInNaturalLine(player, slot, strictOpenSlotLine);
}

function getSortValue(player: PlayerSeason, sortKey: SortKey): number {
  if (sortKey === "overall") return player.overall;

  return player.skills[sortKey];
}

function getPlayerMainRole(player: PlayerSeason): string {
  if (player.tacticalSlotLabels && player.tacticalSlotLabels.length > 0) {
    return player.tacticalSlotLabels.join(" / ");
  }

  return player.positions.join(" / ");
}

function getDataConfidenceLabel(value: number): string {
  if (value >= 0.85) return "Dato alto";
  if (value >= 0.7) return "Dato medio";
  if (value >= 0.55) return "Dato parcial";

  return "Estimado";
}

function normalizePlayerIdentity(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isPlayerNameAlreadySelected(
  player: PlayerSeason,
  selectedPlayers: SelectedPlayer[]
): boolean {
  const normalizedPlayerName = normalizePlayerIdentity(player.name);

  return selectedPlayers.some(
    (selected) =>
      normalizePlayerIdentity(selected.playerSeason.name) === normalizedPlayerName
  );
}

function getDeterministicIndex(seed: string, total: number): number {
  if (total <= 1) return 0;

  const hash = seed.split("").reduce((value, char) => {
    return ((value << 5) - value + char.charCodeAt(0)) | 0;
  }, 0);

  return Math.abs(hash) % total;
}

function getSkillLabel(skill: SortKey): string {
  const option = SORT_OPTIONS.find((item) => item.value === skill);
  return option?.label ?? skill;
}


function getPlayerPlacementMessage(player: PlayerSeason, slots: FormationSlot[]): string {
  if (slots.length === 0) {
    return `${player.name} no tiene posiciones disponibles en esta formación.`;
  }

  const labels = slots.map((slot) => slot.label).join(" / ");
  return `Coloca a ${player.name} en ${labels}`;
}

type DashboardSkillKey =
  | "pace"
  | "shooting"
  | "passing"
  | "dribbling"
  | "defending"
  | "physical";

const DASHBOARD_SKILLS: Array<{
  key: DashboardSkillKey;
  label: string;
  shortLabel: string;
}> = [
  { key: "pace", label: "Ritmo", shortLabel: "RIT" },
  { key: "shooting", label: "Tiro", shortLabel: "TIR" },
  { key: "passing", label: "Pase", shortLabel: "PAS" },
  { key: "dribbling", label: "Regate", shortLabel: "REG" },
  { key: "defending", label: "Defensa", shortLabel: "DEF" },
  { key: "physical", label: "Fisico", shortLabel: "FIS" },
];

function averageNumbers(values: number[]): number {
  if (values.length === 0) return 0;

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getDashboardPlayers(
  selectedPlayers: SelectedPlayer[],
  selectedPlayer?: PlayerSeason
): PlayerSeason[] {
  if (selectedPlayer) {
    return [selectedPlayer];
  }

  return selectedPlayers.map((selected) => selected.playerSeason);
}

function getDashboardSkillAverage(players: PlayerSeason[], key: DashboardSkillKey): number {
  return averageNumbers(players.map((player) => player.skills[key]));
}

function getRadarPoint(index: number, total: number, value: number): string {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / total;
  const radius = 36 * Math.max(0.05, value / 100);
  const x = 50 + Math.cos(angle) * radius;
  const y = 50 + Math.sin(angle) * radius;

  return `${x.toFixed(2)},${y.toFixed(2)}`;
}

function getRadarAxisPoint(index: number, total: number, radius: number): string {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / total;
  const x = 50 + Math.cos(angle) * radius;
  const y = 50 + Math.sin(angle) * radius;

  return `${x.toFixed(2)},${y.toFixed(2)}`;
}

function SkillsDashboard({
  formation,
  selectedPlayers,
  selectedPlayer,
}: {
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
  selectedPlayer?: PlayerSeason;
}) {
  const dashboardPlayers = getDashboardPlayers(selectedPlayers, selectedPlayer);
  const hasPlayers = dashboardPlayers.length > 0;
  const overallAverage = averageNumbers(dashboardPlayers.map((player) => player.overall));
  const goalkeepingAverage = averageNumbers(
    dashboardPlayers
      .filter((player) => player.positions.includes("POR"))
      .map((player) => player.skills.goalkeeping)
  );
  const mentalityAverage = averageNumbers(dashboardPlayers.map((player) => player.skills.mentality));

  const skillValues = DASHBOARD_SKILLS.map((skill) => ({
    ...skill,
    value: getDashboardSkillAverage(dashboardPlayers, skill.key),
  }));

  const radarPoints = hasPlayers
    ? skillValues.map((skill, index) => getRadarPoint(index, skillValues.length, skill.value)).join(" ")
    : "";

  const bestSkill = skillValues.reduce(
    (best, skill) => (skill.value > best.value ? skill : best),
    skillValues[0]
  );

  const weakestSkill = skillValues.reduce(
    (weakest, skill) => (skill.value < weakest.value ? skill : weakest),
    skillValues[0]
  );

  return (
    <section className="skills-dashboard-panel">
      <header className="skills-dashboard-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Habilidades</h2>
        </div>
        <strong>{hasPlayers ? overallAverage : "-"}</strong>
      </header>

      <p className="skills-dashboard-subtitle">
        {selectedPlayer
          ? `Previsualizando a ${selectedPlayer.name}`
          : `${selectedPlayers.length}/${formation.slots.length} jugadores elegidos`}
      </p>

      <div className="skills-radar-card">
        <svg className="skills-radar" viewBox="0 0 100 100" role="img" aria-label="Radar de habilidades">
          {[12, 24, 36].map((radius) => (
            <polygon
              key={radius}
              points={DASHBOARD_SKILLS.map((_, index) =>
                getRadarAxisPoint(index, DASHBOARD_SKILLS.length, radius)
              ).join(" ")}
              className="skills-radar-grid"
            />
          ))}

          {DASHBOARD_SKILLS.map((skill, index) => (
            <line
              key={skill.key}
              x1="50"
              y1="50"
              x2={getRadarAxisPoint(index, DASHBOARD_SKILLS.length, 40).split(",")[0]}
              y2={getRadarAxisPoint(index, DASHBOARD_SKILLS.length, 40).split(",")[1]}
              className="skills-radar-axis"
            />
          ))}

          {hasPlayers && <polygon points={radarPoints} className="skills-radar-area" />}
          {hasPlayers &&
            skillValues.map((skill, index) => {
              const [cx, cy] = getRadarPoint(index, skillValues.length, skill.value).split(",");

              return (
                <circle key={skill.key} cx={cx} cy={cy} r="2.2" className="skills-radar-dot" />
              );
            })}
        </svg>

        <div className="skills-radar-labels">
          {skillValues.map((skill) => (
            <span key={skill.key}>
              {skill.shortLabel} {hasPlayers ? skill.value : "-"}
            </span>
          ))}
        </div>
      </div>

      <div className="skills-dashboard-bars">
        {skillValues.map((skill) => (
          <div key={skill.key} className="skill-dashboard-row">
            <div>
              <span>{skill.label}</span>
              <strong>{hasPlayers ? skill.value : "-"}</strong>
            </div>
            <i>
              <b style={{ width: `${hasPlayers ? skill.value : 0}%` }} />
            </i>
          </div>
        ))}
      </div>

      <div className="skills-dashboard-mini-grid">
        <article>
          <span>Porteria</span>
          <strong>{goalkeepingAverage || "-"}</strong>
        </article>
        <article>
          <span>Mentalidad</span>
          <strong>{hasPlayers ? mentalityAverage : "-"}</strong>
        </article>
      </div>

      {hasPlayers ? (
        <div className="skills-dashboard-summary">
          <strong>Punto fuerte: {bestSkill.label}</strong>
          <span>Area a vigilar: {weakestSkill.label}</span>
        </div>
      ) : (
        <div className="skills-dashboard-summary">
          <strong>Sin datos todavía</strong>
          <span>El radar se activará con tu primera elección.</span>
        </div>
      )}
    </section>
  );
}

function canPlayerBeDraftedNow(params: {
  player: PlayerSeason;
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
  strictOpenSlotLine?: FormationSlot["line"];
}): boolean {
  const { player, formation, selectedPlayers, strictOpenSlotLine } = params;

  if (isPlayerAlreadySelected(player, selectedPlayers)) {
    return false;
  }

  return filterSlotsByStrictLine(
    player,
    getAvailableSlotsForPlayer({
      player,
      formation,
      selectedPlayers,
    }),
    strictOpenSlotLine,
  ).length > 0;
}

export function PlayerRound({
  roundNumber,
  totalRounds = 11,
  season,
  formation,
  selectedPlayers,
  lastSelection,
  strictOpenSlotLine,
  onSelectPlayer,
}: PlayerRoundProps) {
  const [search, setSearch] = useState("");
  const [lineFilter, setLineFilter] = useState<"ALL" | FormationSlot["line"]>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [compatibleOnly, setCompatibleOnly] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>(undefined);
  const formationBoardRef = useRef<HTMLElement | null>(null);

  function scrollToFormationBoard() {
    formationBoardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const seasonPlayers = getPlayersBySeason(season);

  const fallbackDraftSeason = useMemo(() => {
    const currentSeasonHasCompatiblePlayer = seasonPlayers.some((player) =>
      canPlayerBeDraftedNow({
        player,
        formation,
        selectedPlayers,
        strictOpenSlotLine,
      })
    );

    if (currentSeasonHasCompatiblePlayer) {
      return undefined;
    }

    const compatibleSeasonIds = getAvailableAthleticSeasons()
      .filter((seasonId) => seasonId !== season)
      .filter((seasonId) =>
        getPlayersBySeason(seasonId).some((player) =>
          canPlayerBeDraftedNow({
            player,
            formation,
            selectedPlayers,
            strictOpenSlotLine,
          })
        )
      );

    if (compatibleSeasonIds.length === 0) {
      return undefined;
    }

    const deterministicIndex = getDeterministicIndex(
      `${season}-${formation.id}-${selectedPlayers.map((player) => player.slotId).join("|")}`,
      compatibleSeasonIds.length,
    );

    return compatibleSeasonIds[deterministicIndex];
  }, [formation, season, seasonPlayers, selectedPlayers, strictOpenSlotLine]);

  const effectiveDraftSeason = fallbackDraftSeason ?? season;

  const draftPlayerPool = useMemo(() => {
    if (!fallbackDraftSeason) {
      return seasonPlayers;
    }

    return getPlayersBySeason(fallbackDraftSeason);
  }, [fallbackDraftSeason, seasonPlayers]);

  const usingEmergencyDraftPool = Boolean(fallbackDraftSeason);

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return draftPlayerPool
      .filter((player) => {
        if (normalizedSearch.length > 0) {
          const normalizedName = player.name.toLowerCase();

          if (!normalizedName.includes(normalizedSearch)) {
            return false;
          }
        }

        if (!playerMatchesLineFilter(player, lineFilter)) {
          return false;
        }

        if (compatibleOnly &&
            !canPlayerBeDraftedNow({
              player,
              formation,
              selectedPlayers,
              strictOpenSlotLine,
            })) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const diff = getSortValue(b, sortKey) - getSortValue(a, sortKey);

        if (diff !== 0) return diff;

        return a.name.localeCompare(b.name);
      });
  }, [compatibleOnly, draftPlayerPool, formation, lineFilter, search, selectedPlayers, sortKey, strictOpenSlotLine]);

  const selectedPlayer = useMemo(() => {
    const player = draftPlayerPool.find((item) => item.id === selectedPlayerId);

    if (!player) return undefined;

    if (isPlayerAlreadySelected(player, selectedPlayers)) {
      return undefined;
    }

    const availableSlots = filterSlotsByStrictLine(
      player,
      getAvailableSlotsForPlayer({
        player,
        formation,
        selectedPlayers,
      }),
      strictOpenSlotLine,
    );

    return availableSlots.length > 0 ? player : undefined;
  }, [draftPlayerPool, formation, selectedPlayerId, selectedPlayers, strictOpenSlotLine]);

  const availableSlotsForSelectedPlayer = useMemo(() => {
    if (!selectedPlayer) return [];

    return filterSlotsByStrictLine(
      selectedPlayer,
      getAvailableSlotsForPlayer({
        player: selectedPlayer,
        formation,
        selectedPlayers,
      }),
      strictOpenSlotLine,
    );
  }, [formation, selectedPlayer, selectedPlayers, strictOpenSlotLine]);

  const highlightedSlotIds = useMemo(
    () => availableSlotsForSelectedPlayer.map((slot) => slot.id),
    [availableSlotsForSelectedPlayer]
  );

  function resetDraftSelection() {
    setSelectedPlayerId(undefined);
  }

  function handleSelectPlayer(player: PlayerSeason) {
    const availableSlots = filterSlotsByStrictLine(
      player,
      getAvailableSlotsForPlayer({
        player,
        formation,
        selectedPlayers,
      }),
      strictOpenSlotLine,
    );

    if (availableSlots.length === 0) {
      setSelectedPlayerId(undefined);
      return;
    }

    setSelectedPlayerId((currentPlayerId) =>
      currentPlayerId === player.id ? undefined : player.id
    );
  }


  function handleSlotClick(slot: FormationSlot) {
    if (!selectedPlayer) return;

    if (isPlayerAlreadySelected(selectedPlayer, selectedPlayers)) {
      setSelectedPlayerId(undefined);
      return;
    }

    if (!isValidStrictLineSlot(selectedPlayer, slot, strictOpenSlotLine)) return;

    const placement = resolvePlayerSlotPlacement(selectedPlayer, slot);

    if (!placement.canPlace || !placement.assignedPosition) return;

    onSelectPlayer({
      slotId: slot.id,
      position: placement.assignedPosition,
      playerSeason: selectedPlayer,
    });

    setSelectedPlayerId(undefined);
    setSearch("");
    setLineFilter("ALL");
    setSortKey("overall");
  }

  function handleQuickPlacePlayer(player: PlayerSeason, slot: FormationSlot) {
    if (isPlayerAlreadySelected(player, selectedPlayers) || isPlayerNameAlreadySelected(player, selectedPlayers)) {
      return;
    }

    if (!isValidStrictLineSlot(player, slot, strictOpenSlotLine)) return;

    const placement = resolvePlayerSlotPlacement(player, slot);

    if (!placement.canPlace || !placement.assignedPosition) return;

    onSelectPlayer({
      slotId: slot.id,
      position: placement.assignedPosition,
      playerSeason: player,
    });

    setSelectedPlayerId(undefined);
    setSearch("");
    setLineFilter("ALL");
    setSortKey("overall");
  }

  return (
    <section className="player-round">
      <header className="player-round-header">
        <div>
          <p className="eyebrow">Ronda {roundNumber}/{totalRounds}</p>
          <h1>Temporada {effectiveDraftSeason}</h1>
          <p>
            {strictOpenSlotLine
              ? "Elige un sustituto natural para el hueco generado por el cambio de formación."
              : "Elige un jugador y colócalo directamente en una de las posiciones iluminadas del campo."}
          </p>
        </div>

        <div className="round-status-card">
          <span>Formación</span>
          <strong>{formation.name}</strong>
          <small>{selectedPlayers.length}/{formation.slots.length} puestos cubiertos</small>
        </div>
      </header>

      {lastSelection && (
        <div className="last-selection-banner">
          <span>Última elección</span>
          <strong>
            {lastSelection.playerSeason.name} como {lastSelection.position}
          </strong>
          <small>
            Temporada {lastSelection.playerSeason.season} · Media {lastSelection.playerSeason.overall}
          </small>
        </div>
      )}

      <button
        type="button"
        className="mobile-draft-summary"
        aria-label={`Ir al campo de la formación ${formation.name}`}
        onClick={scrollToFormationBoard}
      >
        <strong>{formation.name}</strong>
        <span>{selectedPlayers.length}/{formation.slots.length} jugadores</span>
        <span>Temporada {effectiveDraftSeason}</span>
        <em>Ver campo ↓</em>
      </button>

      <div className="player-round-layout player-round-layout-interactive">
        <aside className="draft-left-column">
          <SkillsDashboard
            formation={formation}
            selectedPlayers={selectedPlayers}
            selectedPlayer={selectedPlayer}
          />
        </aside>

        <main className="players-panel">
          {usingEmergencyDraftPool && (
            <div className="emergency-draft-banner">
              <strong>Resorteo de temporada activado</strong>
              <span>
                Ha salido {season}, pero no tiene jugadores compatibles con el puesto libre restante.
                Nuevo sorteo: {effectiveDraftSeason}. Se muestra toda la plantilla.
              </span>
            </div>
          )}
<section
            className={`draft-placement-helper ${
              selectedPlayer ? "draft-placement-helper-active" : ""
            } ${
              selectedPlayer && availableSlotsForSelectedPlayer.length === 0
                ? "draft-placement-helper-warning"
                : ""
            }`}
          >
            {selectedPlayer ? (
              <>
                <div>
                  <span>Jugador seleccionado</span>
                  <strong>
                    {getPlayerPlacementMessage(selectedPlayer, availableSlotsForSelectedPlayer)}
                  </strong>
                  <small>
                    {availableSlotsForSelectedPlayer.length > 0
                      ? "Haz clic directamente en una posición iluminada del campo."
                      : "Elige otro jugador o revisa los puestos libres."}
                  </small>
                </div>

                <button type="button" onClick={resetDraftSelection}>
                  Cancelar selección
                </button>
              </>
            ) : (
              <>
                <div>
                  <span>Draft interactivo</span>
                  <strong>Elige un jugador y colócalo en el campo</strong>
                  <small>
                    {strictOpenSlotLine
                      ? "Para este premio solo se muestran puestos naturales del hueco que has abierto."
                      : "Las posiciones compatibles se iluminarán automáticamente."}
                  </small>
                </div>
              </>
            )}
          </section>

          <div className="players-toolbar">
            <input
              type="search"
              placeholder="Buscar jugador..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={lineFilter}
              onChange={(event) =>
                setLineFilter(event.target.value as "ALL" | FormationSlot["line"])
              }
            >
              {POSITION_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>

            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Ordenar por {option.label}
                </option>
              ))}
            </select>

            <label className="compatible-only-toggle">
              <input
                type="checkbox"
                checked={compatibleOnly}
                onChange={(event) => setCompatibleOnly(event.target.checked)}
              />
              Solo colocables
            </label>
          </div>

          <div className="players-count">
            {filteredPlayers.length} jugadores disponibles en la búsqueda
          </div>

          <div className="players-grid">
            {filteredPlayers.map((player) => {
              const alreadySelected =
                isPlayerAlreadySelected(player, selectedPlayers) ||
                isPlayerNameAlreadySelected(player, selectedPlayers);
              const availableSlots = filterSlotsByStrictLine(
                player,
                getAvailableSlotsForPlayer({
                  player,
                  formation,
                  selectedPlayers,
                }),
                strictOpenSlotLine,
              );
              const hasAvailableSlot = availableSlots.length > 0;

              const selectable = !alreadySelected && hasAvailableSlot;
              const active = selectedPlayer?.id === player.id;

              return (
                <article
                  key={player.id}
                  className={`player-card ${active ? "player-card-active" : ""} ${
                    !selectable ? "player-card-disabled" : ""
                  }`}
                >
                  <div className="player-card-header">
                    <div>
                      <h2>{player.name}</h2>
                      <p>{getPlayerMainRole(player)}</p>
                    </div>

                    <div className="overall-badge">
                      <span>MED</span>
                      <strong>{player.overall}</strong>
                    </div>
                  </div>

                  {hasAvailableSlot && !alreadySelected && (
                    <div className="compatible-slots-chip">
                      Encaja en: {availableSlots.map((slot) => slot.label).join(" · ")}
                    </div>
                  )}

                  <div className="player-skills">
                    <span>RIT {player.skills.pace}</span>
                    <span>TIR {player.skills.shooting}</span>
                    <span>PAS {player.skills.passing}</span>
                    <span>REG {player.skills.dribbling}</span>
                    <span>DEF {player.skills.defending}</span>
                    <span>FIS {player.skills.physical}</span>
                    {player.positions.includes("POR") && (
                      <span>POR {player.skills.goalkeeping}</span>
                    )}
                    <span>MEN {player.skills.mentality}</span>
                  </div>

                  <div className="player-meta">
                    <span>{getDataConfidenceLabel(player.dataConfidence)}</span>
                    <span>{RATING_METHOD_LABELS[player.ratingMethod]}</span>
                    <span>{getSkillLabel(sortKey)}: {getSortValue(player, sortKey)}</span>
                  </div>

                  {alreadySelected && (
                    <p className="player-warning">Este jugador ya fue seleccionado en otra temporada.</p>
                  )}

                  {!alreadySelected && !hasAvailableSlot && (
                    <p className="player-warning">No encaja en ningún puesto libre.</p>
                  )}

                  {selectable && (
                    <div className="player-card-slot-actions" aria-label={`Colocar a ${player.name}`}>
                      {availableSlots.slice(0, 3).map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleQuickPlacePlayer(player, slot)}
                        >
                          Añadir en {slot.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!selectable}
                    onClick={() => handleSelectPlayer(player)}
                  >
                    {active ? "Cancelar selección" : alreadySelected ? "Ya elegido" : selectable ? "Seleccionar y colocar" : "Sin hueco libre"}
                  </button>
                </article>
              );
            })}
          </div>
        </main>

        <aside className="interactive-draft-column">
          <section className="interactive-draft-board" ref={formationBoardRef} id="draft-formation-board">
            <header>
              <div>
                <p className="eyebrow">Tu once</p>
                <h2>{formation.name}</h2>
              </div>
              <small>{selectedPlayers.length}/{formation.slots.length}</small>
            </header>

            <TacticalPitch
              formation={formation}
              selectedPlayers={selectedPlayers}
              highlightedSlotIds={highlightedSlotIds}
              onSlotClick={handleSlotClick}
              showNames
              compact
            />

            <div className="interactive-draft-help">
              {!selectedPlayer && (
                <>
                  <strong>Selecciona un jugador</strong>
                  <span>Después haz clic en una posición iluminada del campo.</span>
                </>
              )}

              {selectedPlayer && availableSlotsForSelectedPlayer.length > 0 && (
                <>
                  <strong>{selectedPlayer.name}</strong>
                  <span>
                    Puede jugar en: {availableSlotsForSelectedPlayer.map((slot) => slot.label).join(" · ")}
                  </span>
                  
                  <div className="placement-slot-buttons">
                    {availableSlotsForSelectedPlayer.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        className="placement-slot-button"
                        onClick={() => handleSlotClick(slot)}
                      >
                        Anadir en {slot.label}
                      </button>
                    ))}
                  </div>

                  <button type="button" onClick={resetDraftSelection}>
                    Cancelar selección
                  </button>
                </>
              )}

              {selectedPlayer && availableSlotsForSelectedPlayer.length === 0 && (
                <>
                  <strong>{selectedPlayer.name}</strong>
                  <span>No puede ocupar ningun puesto libre de tu once.</span>
                  <button type="button" onClick={resetDraftSelection}>
                    Cancelar selección
                  </button>
                </>
              )}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

export default PlayerRound;

















