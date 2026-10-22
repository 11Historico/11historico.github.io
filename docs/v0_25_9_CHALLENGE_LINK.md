# v0.25.9 — Enlace de reto

Punto P2 del informe de crecimiento: que una carrera pueda compartirse como reto con un enlace.

## Qué cambia

- `src/career/challengeLink.ts`: codifica la marca (puntuación, temporadas, mejor posición y palmarés de seis tipos de título) en el parámetro `?reto=`, en base64url. `parseChallenge` valida cada campo con límites y devuelve `null` si algo no encaja. Nunca lanza.
- `src/components/CareerSeasonOutcome.tsx`: botón "Copiar enlace de reto" en el panel de compartir de la carrera.
- `src/components/ChallengeBanner.tsx`: aviso en la home con la marca recibida. No inicia ninguna carrera.
- `src/App.tsx`: lee el parámetro al cargar y muestra el aviso en la home. "Cerrar" lo quita de la URL con `history.replaceState`.

## Privacidad

El enlace no lleva nick, fechas ni identificadores. Es la misma información que ya se comparte en el texto de carrera, codificada.

## Validación

- `tests/unit/challengeLink.test.ts`: 5 pruebas (ida y vuelta, enlace sin datos personales, URL base, valores fuera de rango, tipos incorrectos).
- `tests/e2e/smoke.spec.ts`: abrir `/?reto=…` muestra el aviso; "Cerrar" lo oculta y quita el parámetro.
- `npm test`, `typecheck`, `lint`, `qa:tech-debt` completo y `npm run test:e2e` (4 pruebas) pasan.

## Pendiente

- El enlace se genera al terminar la carrera. No hay enlace en el resumen de temporada todavía.
