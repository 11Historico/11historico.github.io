// src/components/GameHome.tsx

import { useState } from "react";
import type { EasyModeSeasonRangeId, GameDifficulty } from "../types/game";
import { EASY_MODE_SEASON_RANGES } from "../data/easyModeSeasonRanges";
import { APP_VERSION, APP_VERSION_NAME } from "../config/appVersion";

import "./GameHome.css";
import CompetitionIcon from "./CompetitionIcon";
import SupportButton from "./SupportButton";

interface GameHomeProps {
  hasSavedGame: boolean;
  difficulty: GameDifficulty;
  onDifficultyChange: (difficulty: GameDifficulty) => void;
  easyModeSeasonRangeId: EasyModeSeasonRangeId;
  onEasyModeSeasonRangeChange: (rangeId: EasyModeSeasonRangeId) => void;
  onNewGame: () => void;
  onContinueGame: () => void;
  onCareerPreview: () => void;
  onViewLocalRanking: () => void;
  onViewGlobalRanking: () => void;
}

const DIFFICULTY_OPTIONS: Array<{
  id: GameDifficulty;
  label: string;
  description: string;
}> = [
  {
    id: "normal",
    label: "Fácil",
    description: "Más accesible. Permite elegir el rango histórico del draft.",
  },
  {
    id: "dificil",
    label: "Normal",
    description: "Equilibrado. Ganar la Liga cuesta, pero es posible.",
  },
  {
    id: "leyenda",
    label: "Leyenda",
    description: "Madrid, Barça y Atlético aprietan de verdad.",
  },
];

const FEEDBACK_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfSHQS1PVKoWNl8u7mTrYO2Fchuj-2UC82Ap4AVktUnBrBZ8A/viewform?usp=publish-editor";
const PUBLIC_GAME_URL = "https://ikeritu.github.io/11Historico/";
const SHARE_TEXT = "Construye tu Athletic histórico, sobrevive temporada a temporada y compite en Liga, Copa y Europa.";

export function GameHome({
  hasSavedGame,
  difficulty,
  onDifficultyChange,
  easyModeSeasonRangeId,
  onEasyModeSeasonRangeChange,
  onNewGame,
  onContinueGame,
  onCareerPreview,
  onViewLocalRanking,
  onViewGlobalRanking,
}: GameHomeProps) {
  const [shareStatus, setShareStatus] = useState("");
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const selectedDifficulty = DIFFICULTY_OPTIONS.find((option) => option.id === difficulty);

  const handleShareGame = async () => {
    setShareStatus("");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Once histórico Zurigorri",
          text: SHARE_TEXT,
          url: PUBLIC_GAME_URL,
        });
        return;
      }

      await navigator.clipboard.writeText(PUBLIC_GAME_URL);
      setShareStatus("Enlace copiado");
    } catch {
      setShareStatus("Copia el enlace desde la barra del navegador");
    }
  };

  return (
    <main className="game-home game-home--public-release">
      <section className="game-home-hero" aria-label="Portada Once histórico Zurigorri">
        <div className="game-home-top-row">
          <div className="game-home-badge" aria-label="Versión actual">
            <span aria-hidden="true">⚪</span>
            <span aria-hidden="true">🔴</span>
            <span>{APP_VERSION}</span>
          </div>

          <a
            className="game-home-help-link"
            href={FEEDBACK_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Enviar feedback de Once histórico Zurigorri"
          >
            ?
          </a>
        </div>

        <div className="game-home-main-grid">
          <div className="game-home-intro">
            <p className="game-home-kicker">Simulador de carrera · Athletic histórico</p>
            <h1>Construye tu Athletic histórico y sobrevive temporada a temporada</h1>

            <p className="game-home-subtitle">
              Elige jugadores de distintas épocas, compite en Liga, Copa y Europa,
              gana títulos, acumula palmarés y pelea por entrar en el ranking.
            </p>

            <p className="game-home-objective">
              <strong>Objetivo de la carrera:</strong> cada temporada, clasifícate para Europa o gana la Copa del Rey.
            </p>

            <div className="game-home-public-pillars" aria-label="Resumen del juego">
              <article>
                <strong>1</strong>
                <span>Elige jugadores históricos</span>
                <p>Construye un once único con leyendas y temporadas reales del Athletic.</p>
              </article>
              <article>
                <strong>2</strong>
                <span>Compite en Liga, Copa y Europa</span>
                <p>Sobrevive a cada temporada y juega noches europeas si te clasificas.</p>
                <div className="game-home-competition-icons" aria-hidden="true">
                  <CompetitionIcon kind="liga" />
                  <CompetitionIcon kind="copa" />
                  <CompetitionIcon kind="champions" />
                </div>
              </article>
              <article>
                <strong>3</strong>
                <span>Gana títulos y entra al ranking</span>
                <p>El palmarés suma puntos y convierte cada carrera en una historia distinta.</p>
              </article>
            </div>

            <div className="game-home-feature-chips" aria-label="Funciones principales">
              <span>🏆 Liga, Copa y Supercopa</span>
              <span>🌍 Champions · Europa League · Conference</span>
              <span>🎡 Ruleta de la Suerte</span>
              <span>📈 Ranking local/global</span>
            </div>
          </div>

          <div className="game-home-control-panel" aria-label="Panel principal">
            <section className="game-home-difficulty-card" aria-label="Seleccionar dificultad">
              <div className="game-home-difficulty-header">
                <strong>Dificultad</strong>
                <span>{selectedDifficulty?.label ?? "Normal"}</span>
              </div>

              <div className="game-home-difficulty-options" role="group" aria-label="Opciones de dificultad">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={difficulty === option.id ? "difficulty-option-active" : ""}
                    aria-pressed={difficulty === option.id}
                    onClick={() => onDifficultyChange(option.id)}
                  >
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </button>
                ))}
              </div>

              {selectedDifficulty && <p className="game-home-difficulty-copy">{selectedDifficulty.description}</p>}

              {difficulty === "normal" && (
                <details className="game-home-season-range-card">
                  <summary>Rango de temporadas del modo fácil</summary>
                  <div className="game-home-season-range-options">
                    {EASY_MODE_SEASON_RANGES.map((range) => (
                      <button
                        key={range.id}
                        type="button"
                        className={easyModeSeasonRangeId === range.id ? "season-range-option-active" : ""}
                        aria-pressed={easyModeSeasonRangeId === range.id}
                        onClick={() => onEasyModeSeasonRangeChange(range.id)}
                      >
                        <strong>{range.label}</strong>
                        <small>{range.description}</small>
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </section>

            <div className="game-home-actions" aria-label="Acciones principales">
              <div className="game-home-action-group" aria-label="Empezar">
                <button type="button" className="primary-home-button" onClick={onCareerPreview}>
                  <span aria-hidden="true">▷</span>
                  <span>Jugar carrera</span>
                </button>

                <div className="game-home-secondary-actions">
                  <button type="button" className="secondary-home-button" onClick={onNewGame}>
                    <span aria-hidden="true">»</span>
                    <span>Partida rápida</span>
                  </button>

                  {hasSavedGame && (
                    <button type="button" className="secondary-home-button" onClick={onContinueGame}>
                      <span aria-hidden="true">↻</span>
                      <span>Continuar</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="game-home-action-group" aria-label="Explorar">
                <div className="game-home-explore-actions">
                  <button
                    type="button"
                    className="secondary-home-button"
                    onClick={() => setShowHowToPlay((current) => !current)}
                    aria-expanded={showHowToPlay}
                  >
                    <span aria-hidden="true">ⓘ</span>
                    <span>Cómo funciona</span>
                  </button>

                  <button type="button" className="secondary-home-button" onClick={onViewGlobalRanking}>
                    <span aria-hidden="true">★</span>
                    <span>Ver ranking</span>
                  </button>

                  <button type="button" className="secondary-home-button" onClick={onViewLocalRanking}>
                    <span aria-hidden="true">▤</span>
                    <span>Ranking local</span>
                  </button>
                </div>
              </div>

              <div className="game-home-action-group" aria-label="Compartir">
                <button type="button" className="share-home-button" onClick={handleShareGame}>
                  <span aria-hidden="true">↗</span>
                  <span>Compartir juego</span>
                </button>

                {shareStatus && <p className="share-home-message" role="status">{shareStatus}</p>}
              </div>
            </div>
          </div>
        </div>

        {showHowToPlay && (
          <section className="how-to-play-card" aria-label="Cómo funciona Once histórico Zurigorri">
            <div className="how-to-play-header">
              <h2>Cómo funciona</h2>
              <p>Una carrera se gana sobreviviendo objetivos, acumulando títulos y mejorando tu ranking.</p>
            </div>

            <div className="how-to-play-steps">
              <article><strong>Objetivo</strong><p>Clasifícate para Europa o gana la Copa del Rey. Ese es el mínimo para seguir vivo.</p></article>
              <article><strong>Game Over</strong><p>Si fallas el objetivo o desciendes, la carrera termina y se guarda tu resultado.</p></article>
              <article><strong>Supervivencia</strong><p>Si sobrevives, avanzas otra temporada con recompensas, prestigio y más presión.</p></article>
              <article>
                <strong>Palmarés</strong>
                <p>Liga, Copa, Supercopa y títulos europeos suman puntos para el ranking.</p>
                <div className="game-home-competition-icons" aria-hidden="true">
                  <CompetitionIcon kind="liga" />
                  <CompetitionIcon kind="copa" />
                  <CompetitionIcon kind="supercopa" />
                </div>
              </article>
              <article>
                <strong>Europa</strong>
                <p>Champions, Europa League y Conference tienen calendario, semifinal, final y títulos propios.</p>
                <div className="game-home-competition-icons" aria-hidden="true">
                  <CompetitionIcon kind="champions" />
                  <CompetitionIcon kind="europa" />
                  <CompetitionIcon kind="conference" />
                </div>
              </article>
            </div>
          </section>
        )}

        <SupportButton variant="home" />

        <footer className="game-home-footer">
          <span>{APP_VERSION}: {APP_VERSION_NAME}</span>
          <a href={FEEDBACK_URL} target="_blank" rel="noreferrer">Feedback ↗</a>
        </footer>
      </section>
    </main>
  );
}

export default GameHome;
