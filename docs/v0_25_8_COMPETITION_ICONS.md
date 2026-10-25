# v0.25.8 — Iconos por competición

Punto P2 del informe de la capa gráfica 2D: un icono propio por competición, para leer de un vistazo en qué torneo se juega.

## Qué cambia

- `src/components/CompetitionIcon.tsx`: componente con seis iconos de trazo (`liga`, `copa`, `supercopa`, `champions`, `europa`, `conference`). Son formas originales (campo, copa, copa con estrella, estrella, chevrones, banderín) y usan `currentColor`, así que heredan el color de cada tema. Cada icono tiene `role="img"` y un `aria-label` con el nombre de la competición.
- Se muestra en:
  - la cabecera de cada partido de Liga y Copa (`match-sequence-tag`);
  - la tarjeta de Copa del Rey del simulador;
  - el distintivo de la noche europea (Champions, Europa League o Conference).

## Decisiones

- No se usan logos ni símbolos de UEFA, LaLiga ni de la Copa del Rey. Son formas genéricas; las etiquetas de texto siguen siendo la marca.
- El icono acompaña al texto y no lo sustituye, para no depender solo del dibujo.

## Validación

- `tests/unit/competitionIcon.test.tsx`: cada icono se renderiza como imagen accesible con su nombre y cada uno tiene forma distinta. Vitest incluye ahora `tests/unit/**/*.test.{ts,tsx}`.
- Comprobado en la app: el icono de campo aparece junto a "LaLiga · Jornada 18" en la cabecera del partido.
- Los iconos europeos no se han visto en pantalla todavía, porque requieren una noche europea; los cubre la prueba de renderizado.
- `npm test`, `typecheck`, `lint`, `qa:tech-debt` completo y `npm run test:e2e` pasan.
