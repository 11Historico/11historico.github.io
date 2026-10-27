import type { SeasonLuckWheelTriggerEvent, SeasonLuckWheelResultGroup } from "./seasonLuckWheel";

export const SEASON_LUCK_WHEEL_APPEARANCE_TEXTS: Record<SeasonLuckWheelTriggerEvent, string[]> = {
  copa_elimination: [
    "La eliminación copera ha dejado al vestuario tocado. El equipo necesita una reacción.",
    "El sueño de la Copa se ha terminado, pero la temporada aún puede cambiar de rumbo.",
    "La prensa aprieta tras la caída en Copa. El club busca una chispa.",
    "El golpe copero obliga a tomar decisiones. La suerte llama a la puerta.",
  ],
  europe_elimination: [
    "Europa se escapa antes de tiempo. El vestuario mira al entrenador esperando una respuesta.",
    "La noche europea deja heridas, pero también una oportunidad para cambiar el destino.",
    "El equipo cae en Europa y el ambiente se vuelve imprevisible.",
    "La eliminación continental abre una semana decisiva en Lezama.",
  ],
  mid_season: [
    "La temporada llega a su ecuador. Es momento de arriesgar o conservar.",
    "Con media campaña por delante, el club puede dar un golpe de timón.",
    "El calendario se aprieta y el equipo necesita definir su rumbo.",
    "La segunda vuelta comienza con una oportunidad inesperada.",
  ],
  bad_streak: [
    "La mala dinámica empieza a pesar. Algo debe cambiar.",
    "El vestuario acusa los últimos resultados. La suerte podría intervenir.",
    "La grada exige una reacción inmediata.",
    "El equipo necesita aire antes de que la temporada se complique.",
  ],
  good_streak: [
    "El equipo está lanzado. Puede ser el momento de aprovechar la inercia.",
    "La confianza crece y el club se permite soñar.",
    "La dinámica positiva abre una oportunidad inesperada.",
    "El grupo cree en sí mismo. La suerte podría multiplicar el impulso.",
  ],
};

export const SEASON_LUCK_WHEEL_RESULT_TEXTS: Record<SeasonLuckWheelResultGroup, string[]> = {
  positive: [
    "El vestuario reacciona con fuerza. El equipo sale reforzado.",
    "La decisión cambia el ambiente. Hay energía nueva en el grupo.",
    "La suerte sonríe al Athletic. El equipo gana confianza.",
    "El golpe anímico es inmediato. La plantilla sube una marcha.",
    "El cuerpo técnico encuentra la tecla adecuada.",
    "El grupo se une en el momento justo.",
    "La afición empuja y el equipo responde.",
    "Una decisión valiente abre una nueva dinámica.",
    "El equipo recupera frescura y determinación.",
    "La temporada cambia de color tras este impulso.",
    "El vestuario cree. Y cuando cree, compite mejor.",
    "La presión se convierte en carácter.",
    "La plantilla recibe el mensaje y sube el nivel.",
    "El club encuentra una chispa inesperada.",
    "El equipo parece otro tras este golpe de suerte.",
    "La confianza se dispara en el momento clave.",
    "El entrenador consigue activar al grupo.",
    "La plantilla gana una energía especial.",
    "El destino se pone de cara.",
    "San Mamés empuja y el equipo responde con orgullo.",
  ],
  neutral: [
    "Nada cambia. El equipo deberá seguir peleando con lo que tiene.",
    "La ruleta no altera el rumbo de la temporada.",
    "El vestuario mantiene la calma, pero no recibe ningún impulso extra.",
    "La suerte pasa de largo esta vez.",
    "No hay premio ni castigo. Todo sigue igual.",
    "El grupo acepta el momento y continúa trabajando.",
    "La temporada sigue su curso sin sobresaltos.",
    "La tensión se enfría, pero no hay cambios reales.",
    "El intento queda en nada.",
    "La moneda cae de canto: ni mejora ni castigo.",
    "El equipo no cambia su dinámica.",
    "El club esperaba una señal, pero no llega.",
    "La plantilla seguirá dependiendo de su propio rendimiento.",
    "El ambiente no mejora, pero tampoco empeora.",
    "La ruleta gira, pero el destino no se mueve.",
    "Sin efecto. Todo queda en manos del campo.",
    "El grupo mantiene el pulso competitivo.",
    "La suerte no interviene esta vez.",
    "El marcador emocional queda igual.",
    "No hay golpe de efecto. La temporada continúa.",
  ],
  negative: [
    "La presión pasa factura. El equipo pierde confianza.",
    "La decisión no sale bien y el vestuario queda tocado.",
    "La ruleta castiga al Athletic en el peor momento.",
    "El ambiente se complica tras un giro inesperado.",
    "La plantilla acusa el golpe anímico.",
    "La suerte se gira en contra.",
    "El intento de reacción termina generando más dudas.",
    "La dinámica se enfría de golpe.",
    "El equipo pierde frescura mental.",
    "El vestuario queda marcado por la incertidumbre.",
    "El golpe afecta al rendimiento colectivo.",
    "La grada empieza a impacientarse.",
    "La temporada se endurece.",
    "El equipo deberá remar contra corriente.",
    "La confianza cae en un momento delicado.",
    "El destino no perdona.",
    "La apuesta sale mal.",
    "El club tendrá que recomponerse rápido.",
    "La plantilla baja un punto de intensidad.",
    "El golpe moral se nota en el rendimiento.",
  ],
};

export function getSeasonLuckWheelAppearanceText(
  triggerEvent: SeasonLuckWheelTriggerEvent,
  index: number,
): string {
  const options = SEASON_LUCK_WHEEL_APPEARANCE_TEXTS[triggerEvent];
  return options[Math.abs(Math.floor(index)) % options.length];
}

export function getSeasonLuckWheelResultText(
  group: SeasonLuckWheelResultGroup,
  index: number,
): string {
  const options = SEASON_LUCK_WHEEL_RESULT_TEXTS[group];
  return options[Math.abs(Math.floor(index)) % options.length];
}
