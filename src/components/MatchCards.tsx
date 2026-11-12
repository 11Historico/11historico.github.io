// src/components/MatchCards.tsx
//
// Cartas de partido (v0.25.108): la mano en la previa y el sorteo de 6 boca abajo.

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import {
  MATCH_CARD_DRAW_REASON_TEXT,
  MATCH_CARD_HAND_LIMIT,
  MATCH_CARD_RARITY_LABEL,
  MATCH_CARDS_PER_SEASON,
  getMatchCard,
  getMatchCardHalftimePlay,
  getMatchCardPlay,
  getPendingMatchCardDraw,
  type MatchCardId,
  type MatchCardSituation,
  type MatchCardsState,
} from "../career/matchCards";

import "./MatchCards.css";

function CardFace({ id, compact = false, description }: { id: MatchCardId; compact?: boolean; description?: string }) {
  const card = getMatchCard(id);

  return (
    <>
      <span className="match-card-rarity">{MATCH_CARD_RARITY_LABEL[card.rarity]}</span>
      <strong className="match-card-name">{card.name}</strong>
      {!compact && <span className="match-card-description">{description ?? card.description}</span>}
    </>
  );
}

/**
 * La mano: en la previa, tocas una carta para jugar con ella el siguiente partido; en el descanso
 * de Copa y Europa (v0.25.110, `halftime`), una para la segunda parte, con su efecto en goles.
 */
export function MatchCardsHand({
  cards,
  situation,
  onArm,
  halftime = false,
}: {
  cards: MatchCardsState;
  situation: MatchCardSituation | undefined;
  onArm: (index: number | undefined) => void;
  halftime?: boolean;
}) {
  if (cards.hand.length === 0) {
    if (halftime) return null;
    return (
      <div className="match-cards-hand match-cards-hand-empty">
        <span className="match-cards-hand-title">Tus cartas (0/{MATCH_CARD_HAND_LIMIT})</span>
        <small>
          Ganas cartas al llegar a cuartos o a la final de Copa, al ganar al líder, con 8 partidos sin perder o al
          ganar en Europa a un rival con más media.
        </small>
      </div>
    );
  }

  const armedId = cards.armedIndex === undefined ? undefined : cards.hand[cards.armedIndex];
  const hint = halftime ? "si quieres, elige una para la segunda parte" : "toca una para jugar con ella";

  return (
    <div className={`match-cards-hand${armedId ? " match-cards-hand-has-armed" : ""}`} role="group" aria-label={halftime ? "Tus cartas para la segunda parte" : "Tus cartas para este partido"}>
      <span className="match-cards-hand-title">
        {halftime ? "Cartas para la segunda parte" : `Tus cartas (${cards.hand.length}/${MATCH_CARD_HAND_LIMIT})`} ·{" "}
        {armedId ? <strong className="match-cards-hand-armed-name">Juegas con {getMatchCard(armedId).name}</strong> : hint}
      </span>
      <div className="match-cards-hand-list">
        {cards.hand.map((id, index) => {
          const { play, unavailableReason } = !situation
            ? { play: undefined, unavailableReason: undefined }
            : halftime
              ? getMatchCardHalftimePlay(id, situation)
              : getMatchCardPlay(id, situation);
          const description = halftime && play && "text" in play ? play.text : undefined;
          const armed = cards.armedIndex === index;
          const card = getMatchCard(id);

          return (
            <button
              key={`${id}-${index}`}
              type="button"
              className={`match-card match-card-${card.rarity}${armed ? " match-card-armed" : ""}`}
              aria-pressed={armed}
              disabled={!play}
              title={unavailableReason ?? description ?? card.description}
              onClick={() => onArm(armed ? undefined : index)}
            >
              {/* v0.25.110: la carta elegida se ve de un vistazo, con un color igual para todas las rarezas. */}
              {armed && <span className="match-card-in-use">En uso</span>}
              <CardFace id={id} description={description} />
              {unavailableReason && <span className="match-card-unavailable">{unavailableReason}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
/** Lo que pasó con las cartas en el último partido. */
export function MatchCardsNotes({ notes }: { notes?: string[] }) {
  if (!notes || notes.length === 0) return null;

  return (
    <ul className="match-cards-notes" aria-label="Cartas">
      {notes.map((note) => (
        <li key={note}>{note}</li>
      ))}
    </ul>
  );
}

// Tiempo hasta dar la vuelta a las 5 que no elegiste.
const REVEAL_OTHERS_DELAY_MS = 1100;

/** El sorteo: 6 boca abajo, eliges 1, se da la vuelta y después se ven las otras 5. */
export function MatchCardDraw({
  cards,
  onPick,
  onClose,
}: {
  cards: MatchCardsState;
  onPick: (index: number) => void;
  onClose: () => void;
}) {
  const pending = getPendingMatchCardDraw(cards);
  const result = cards.lastDraw;
  const [othersRevealed, setOthersRevealed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!result) return undefined;
    const timeoutId = window.setTimeout(() => setOthersRevealed(true), REVEAL_OTHERS_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [result]);

  const reason = result?.reason ?? pending?.reason;
  if (!reason) return null;

  const options = result?.options ?? pending?.options ?? [];
  const revealedIndex = result?.revealedIndex ?? pending?.revealedIndex;
  // «Carta 2 de 4» también mientras se ve el resultado: la elegida ya no está pendiente.
  const seasonStartLeft = cards.pendingDraws.filter((item) => item === "season_start").length;
  const title = reason === "season_start"
    ? `Carta ${MATCH_CARDS_PER_SEASON - seasonStartLeft + (result ? 0 : 1)} de ${MATCH_CARDS_PER_SEASON}`
    : "Nueva carta";

  return (
    <div
      className="match-card-draw-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-card-draw-title"
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
      <section className="match-card-draw-modal">
        <span className="match-card-draw-eyebrow">{MATCH_CARD_DRAW_REASON_TEXT[reason]}</span>
        <h2 id="match-card-draw-title">{title}</h2>
        <p>
          {result
            ? othersRevealed
              ? "Estas eran las otras cartas."
              : `Te ha tocado: ${getMatchCard(options[result.pickedIndex]).name}.`
            : revealedIndex !== undefined
              ? "El Ojeador te enseña una carta. Elige una de las 6."
              : "Elige una de las 6 cartas boca abajo."}
        </p>

        <div className="match-card-draw-grid">
          {options.map((id, index) => {
            const picked = result?.pickedIndex === index;
            const faceUp = result ? picked || othersRevealed : index === revealedIndex;
            const card = getMatchCard(id);

            return (
              <button
                key={index}
                type="button"
                className={[
                  "match-card",
                  "match-card-draw-card",
                  faceUp ? `match-card-${card.rarity} match-card-face-up` : "match-card-back",
                  picked ? "match-card-picked" : "",
                  result && !picked ? "match-card-not-picked" : "",
                ].join(" ")}
                disabled={Boolean(result)}
                aria-label={faceUp ? `${card.name} (${MATCH_CARD_RARITY_LABEL[card.rarity]})${picked ? ", tu carta" : ""}` : `Carta ${index + 1} boca abajo`}
                onClick={() => onPick(index)}
              >
                {faceUp ? <CardFace id={id} compact={!picked} /> : <span className="match-card-back-mark" aria-hidden="true">?</span>}
              </button>
            );
          })}
        </div>

        {result && (
          <button type="button" className="primary-home-button match-card-draw-continue" onClick={() => { setOthersRevealed(false); onClose(); }}>
            {cards.pendingDraws.length > 0 ? "Siguiente carta" : "Seguir"}
          </button>
        )}
      </section>
    </div>
  );
}
