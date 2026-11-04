# v0.25.89 — La Supercopa no se salta partidos

La Supercopa reproduce sus partidos uno detrás de otro: las dos semifinales y la final. A veces salían los tres a la vez y la pantalla terminaba en un segundo, sin ver ninguno.

## Causa

- `MatchSequence` avisa con `onPlayingChange(false)` al acabar el partido y también al desmontarse. Ese segundo aviso está en la limpieza de un efecto que depende de la propia función.
- `CareerSupercopa` le pasaba una función nueva en cada pintado y, al recibir `false`, pasaba al partido siguiente. Así, cualquier repintado de la pantalla ejecutaba la limpieza y adelantaba un partido.
- En modo desarrollo, StrictMode monta, desmonta y vuelve a montar cada efecto, así que ocurría siempre.
- La prueba e2e se hace sobre la build sin StrictMode, y en esa prueba no se repintaba. Por eso pasaba.

## Arreglo

- `MatchSequence` tiene un aviso nuevo, `onFinished`, que solo se da cuando el partido llega a su final.
- La Supercopa usa ese aviso para pasar al partido siguiente, y el paso es idempotente: si llega dos veces, avanza una sola.
- `onPlayingChange` pasa a ser opcional y no cambia para Liga y Copa, que le pasan una función estable.

## Archivos

- `src/components/MatchSequence.tsx`: `onFinished`.
- `src/components/CareerSupercopa.tsx`: usa `onFinished` en vez de `onPlayingChange`.

## Comprobación

- En el navegador, en modo desarrollo y con la misma partida guardada:
  - **Sin el arreglo:** al pulsar «Simular Supercopa» salían los tres partidos en «Previa» y la pantalla terminaba en 1 s.
  - **Con el arreglo:** cada partido avanza hasta el final y después empieza el siguiente. La Supercopa dura unos 12 s.
- `tests/e2e/europe-supercopa.spec.ts` (la Supercopa partido a partido, sobre la build) sigue pasando.
