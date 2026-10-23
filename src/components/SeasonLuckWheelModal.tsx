import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import {
  SEASON_LUCK_WHEEL_PRECISION_ZONES,
  SEASON_LUCK_WHEEL_PRIZE_SEGMENTS,
  declineSeasonLuckWheel,
  resolveSeasonLuckWheel,
  type SeasonLuckWheelOffer,
  type SeasonLuckWheelPrecisionZone,
  type SeasonLuckWheelResolvedResult,
  type SeasonLuckWheelState,
} from "../career/seasonLuckWheel";

import "./SeasonLuckWheelModal.css";

interface SeasonLuckWheelModalProps {
  offer: SeasonLuckWheelOffer;
  onDecline: (state: SeasonLuckWheelState) => void;
  onResolve: (result: SeasonLuckWheelResolvedResult) => void;
}

const MAX_FRAME_DELTA_MS = 50;

function getZoneWidth(zoneId: SeasonLuckWheelPrecisionZone["id"]): number {
  const zone = SEASON_LUCK_WHEEL_PRECISION_ZONES.find((candidate) => candidate.id === zoneId);
  return zone ? zone.maxDistanceFromCenter - zone.minDistanceFromCenter : 0;
}

/**
 * Anchos reales (en fracciones, usables como `fr` de grid) de las 5 bandas
 * "Malo / Neutro / Bueno / Neutro / Malo" que se ven sobre la barra de
 * precisión. Se calculan a partir de SEASON_LUCK_WHEEL_PRECISION_ZONES en
 * vez de repartir la barra en quintos iguales: las zonas reales no miden lo
 * mismo (el centro "Bueno" es casi el triple de ancho que cada "Neutro").
 */
const ZONE_LABEL_GRID_TEMPLATE = (() => {
  const bad = getZoneWidth("outer") + getZoneWidth("edge");
  const neutral = getZoneWidth("balanced");
  const good = (getZoneWidth("perfect_center") + getZoneWidth("good_center")) * 2;

  return [bad, neutral, good, neutral, bad].map((width) => `${width}fr`).join(" ");
})();

function getPrizeClass(group: string): string {
  if (group === "positive") return "season-wheel-prize-positive";
  if (group === "negative") return "season-wheel-prize-negative";
  return "season-wheel-prize-neutral";
}

function getResultGroupLabel(group: string): string {
  if (group === "positive") return "Premio positivo";
  if (group === "negative") return "Castigo";
  return "Sin efecto";
}

function getResultTitle(result: SeasonLuckWheelResolvedResult): string {
  if (result.resultType === "rating_plus_0_5") return "+0.5 de media de temporada";
  if (result.resultType === "player_change") return "Cambio de jugador";
  if (result.resultType === "coach_change") return "Cambio de entrenador";
  if (result.resultType === "rating_plus_1") return "+1.0 de media de temporada";
  if (result.resultType === "rating_plus_1_and_player_change") return "+1.0 y cambio de jugador";
  if (result.resultType === "rating_minus_0_5") return "-0.5 de media de temporada";
  if (result.resultType === "rating_minus_1") return "-1.0 de media de temporada";
  return "Sin efecto";
}

function getSegmentColor(segment: { group: string; resultType: string }): string {
  if (segment.resultType === "rating_plus_1_and_player_change") return "#05895e";
  if (segment.resultType === "rating_plus_1") return "#0f9d58";
  if (segment.resultType === "player_change") return "#0891b2";
  if (segment.resultType === "coach_change") return "#7aa321";
  if (segment.resultType === "rating_plus_0_5") return "#14a65d";
  if (segment.resultType === "rating_minus_1") return "#b91c1c";
  if (segment.resultType === "rating_minus_0_5") return "#dc2626";
  return "#e7b416";
}

function getSegmentShortParts(segment: { resultType: string; label: string }): string[] {
  if (segment.resultType === "rating_plus_0_5") return ["+0.5"];
  if (segment.resultType === "player_change") return ["Jug."];
  if (segment.resultType === "coach_change") return ["Entr."];
  if (segment.resultType === "rating_plus_1") return ["+1"];
  if (segment.resultType === "rating_plus_1_and_player_change") return ["+1", "Jug."];
  if (segment.resultType === "rating_minus_0_5") return ["-0.5"];
  if (segment.resultType === "rating_minus_1") return ["-1"];
  return [segment.label];
}

function getSegmentLegendLabel(segment: { resultType: string; label: string }): string {
  if (segment.resultType === "rating_plus_0_5") return "+0.5 = +0.5 media de temporada";
  if (segment.resultType === "player_change") return "Jug. = cambio de jugador";
  if (segment.resultType === "coach_change") return "Entr. = cambio de entrenador";
  if (segment.resultType === "rating_plus_1") return "+1 = +1.0 media de temporada";
  if (segment.resultType === "rating_plus_1_and_player_change") return "+1 + Jug. = +1.0 media y cambio de jugador";
  if (segment.resultType === "rating_minus_0_5") return "-0.5 = -0.5 media de temporada";
  if (segment.resultType === "rating_minus_1") return "-1 = -1.0 media de temporada";
  return "Sin efecto = la temporada sigue igual";
}

function getResultDetail(result: SeasonLuckWheelResolvedResult): string {
  if (result.ratingDelta !== 0) {
    return `Efecto activo hasta final de temporada: ${result.ratingDelta > 0 ? "+" : ""}${result.ratingDelta.toFixed(1)} en todas las líneas del equipo.`;
  }

  if (result.requiresPlayerChange && result.requiresCoachChange) {
    return "Premio de cambio listo: al continuar se abrirá el flujo para ejecutarlo en esta temporada.";
  }

  if (result.requiresPlayerChange) {
    return "Premio de cambio de jugador listo: al continuar elegirás a quién sacar y un sustituto compatible.";
  }

  if (result.requiresCoachChange) {
    return "Premio de cambio de entrenador listo: al continuar elegirás nuevo técnico o podrás cancelar el cambio.";
  }

  return "No se modifica el rendimiento del equipo.";
}

export default function SeasonLuckWheelModal({
  offer,
  onDecline,
  onResolve,
}: SeasonLuckWheelModalProps) {
  const [stage, setStage] = useState<"offer" | "playing" | "resolved">("offer");
  const dialogRef = useRef<HTMLDivElement>(null);

  // El foco va al diálogo en cada etapa (no al botón de parar): así una pulsación de Enter
  // no detiene la flecha sin querer. Tab recorre los botones del diálogo.
  useEffect(() => {
    dialogRef.current?.focus();
  }, [stage]);
  const [position, setPosition] = useState(0.5);
  const [result, setResult] = useState<SeasonLuckWheelResolvedResult | undefined>();
  const directionRef = useRef(1);
  const frameRef = useRef<number | undefined>(undefined);
  const lastFrameRef = useRef<number | undefined>(undefined);
  const playingStartedAtRef = useRef<number | undefined>(undefined);

  const targetSegmentIndex = useMemo(() => {
    if (!result) return -1;
    return SEASON_LUCK_WHEEL_PRIZE_SEGMENTS.findIndex(
      (segment) => segment.resultType === result.resultType,
    );
  }, [result]);

  const wheelBackground = useMemo(() => {
    const segmentCount = Math.max(1, offer.prizeSegments.length);
    const segmentAngle = 360 / segmentCount;
    const stops = offer.prizeSegments.map((segment, index) => {
      const start = index * segmentAngle;
      const end = (index + 1) * segmentAngle;
      return `${getSegmentColor(segment)} ${start}deg ${end}deg`;
    });

    return `conic-gradient(from ${-segmentAngle / 2}deg, ${stops.join(", ")})`;
  }, [offer.prizeSegments]);

  const wheelRotation = useMemo(() => {
    if (!result || targetSegmentIndex < 0) return 0;
    const segmentCount = Math.max(1, SEASON_LUCK_WHEEL_PRIZE_SEGMENTS.length);
    const segmentAngle = 360 / segmentCount;
    return 1440 + (360 - targetSegmentIndex * segmentAngle);
  }, [result, targetSegmentIndex]);

  const prizeLegend = useMemo(() => {
    const seen = new Set<string>();
    return offer.prizeSegments.filter((segment) => {
      if (seen.has(segment.resultType)) return false;
      seen.add(segment.resultType);
      return true;
    });
  }, [offer.prizeSegments]);

  useEffect(() => {
    if (stage !== "playing") return undefined;

    const animate = (timestamp: number) => {
      const previousTimestamp = lastFrameRef.current ?? timestamp;
      // Tras una pausa (pestaña oculta o tirón de fotogramas) el salto sería enorme
      // y la flecha acabaría en un extremo, la zona con más riesgo de castigo.
      const deltaMs = Math.min(timestamp - previousTimestamp, MAX_FRAME_DELTA_MS);
      lastFrameRef.current = timestamp;
      playingStartedAtRef.current ??= timestamp;

      setPosition((current) => {
        const elapsedSeconds = Math.max(0, (timestamp - playingStartedAtRef.current!) / 1000);
        const baseSpeed = 0.00075;
        const accelerationPerSecond = 0.00023;
        const maxSpeed = 0.00235;
        const speed = Math.min(maxSpeed, baseSpeed + elapsedSeconds * accelerationPerSecond);
        let next = current + directionRef.current * deltaMs * speed;

        if (next >= 1) {
          next = 1;
          directionRef.current = -1;
        }

        if (next <= 0) {
          next = 0;
          directionRef.current = 1;
        }

        return next;
      });

      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== undefined) {
        window.cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = undefined;
      lastFrameRef.current = undefined;
      playingStartedAtRef.current = undefined;
    };
  }, [stage]);

  function handleDecline() {
    onDecline(declineSeasonLuckWheel({
      seasonId: offer.seasonId,
      triggerEvent: offer.triggerEvent,
      appearanceText: offer.appearanceText,
    }));
  }

  function handleStop() {
    const resolved = resolveSeasonLuckWheel({
      seasonId: offer.seasonId,
      triggerEvent: offer.triggerEvent,
      precisionPosition: position,
      randomGroup: Math.random(),
      randomPrize: Math.random(),
      randomText: Math.random(),
    });

    setResult(resolved);
    setStage("resolved");
  }

  function handleContinue() {
    if (!result) return;
    onResolve(result);
  }

  return (
    <div
      className="season-wheel-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="season-wheel-title"
      tabIndex={-1}
      ref={dialogRef}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "Tab") return;
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <section className="season-wheel-modal">
        <div className="season-wheel-header">
          <span className="season-wheel-eyebrow">Ruleta de la temporada</span>
          <h2 id="season-wheel-title">La suerte llama a San Mamés</h2>
          <p>{offer.appearanceText}</p>
        </div>

        <div className="season-wheel-content">
          <div className="season-wheel-disc-shell" aria-label="Ruleta con 12 quesitos de premios visibles">
            <div
              className={`season-wheel-disc ${stage === "playing" ? "season-wheel-disc-spinning" : ""} ${result ? "season-wheel-disc-resolved" : ""}`}
              style={{
                background: wheelBackground,
                ...(result ? { transform: `rotate(${wheelRotation}deg)` } : {}),
              }}
            >
              {offer.prizeSegments.map((segment, index) => (
                <span
                  key={`${segment.resultType}-${index}`}
                  className={`season-wheel-prize ${getPrizeClass(segment.group)}`}
                  style={{ transform: `rotate(${index * (360 / offer.prizeSegments.length) - 90}deg)` }}
                >
                  {getSegmentShortParts(segment).map((part) => (
                    <span key={part}>{part}</span>
                  ))}
                </span>
              ))}
            </div>
            <strong className="season-wheel-disc-center">Aupa</strong>
          </div>

          <div className="season-wheel-precision-panel">
            <div
              className="season-wheel-zone-labels"
              aria-hidden="true"
              style={{ gridTemplateColumns: ZONE_LABEL_GRID_TEMPLATE }}
            >
              <span>Malo</span>
              <span>Neutro</span>
              <span>Bueno</span>
              <span>Neutro</span>
              <span>Malo</span>
            </div>

            <div className="season-wheel-precision-bar">
              <span className="season-wheel-precision-center" />
              <span className="season-wheel-precision-marker" style={{ left: `${position * 100}%` }}>
                ↓
              </span>
            </div>

            <p>
              Para cerca del centro para mejorar tus opciones. En los extremos aumenta el riesgo de castigo.
              La flecha empieza lenta y acelera poco a poco.
            </p>

            <div className="season-wheel-prize-legend" aria-label="Leyenda de premios de la ruleta">
              <strong>Premios</strong>
              <ul>
                {prizeLegend.map((segment) => (
                  <li key={segment.resultType} className={getPrizeClass(segment.group)}>
                    {getSegmentLegendLabel(segment)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {stage === "offer" && (
          <div className="season-wheel-actions">
            <button type="button" className="season-wheel-primary" onClick={() => setStage("playing")}>
              Jugar ruleta
            </button>
            <button type="button" className="season-wheel-secondary" onClick={handleDecline}>
              No jugar
            </button>
          </div>
        )}

        {stage === "playing" && (
          <div className="season-wheel-actions">
            <button type="button" className="season-wheel-primary season-wheel-stop" onClick={handleStop}>
              Parar flecha
            </button>
          </div>
        )}

        {stage === "resolved" && result && (
          <article className={`season-wheel-result ${getPrizeClass(result.resultGroup)}`}>
            <span>{getResultGroupLabel(result.resultGroup)} · {result.precisionZone.label}</span>
            <h3>{getResultTitle(result)}</h3>
            <p>{result.resultText}</p>
            <small>{getResultDetail(result)}</small>
            <button type="button" className="season-wheel-primary" onClick={handleContinue}>
              Continuar temporada
            </button>
          </article>
        )}
      </section>
    </div>
  );
}
