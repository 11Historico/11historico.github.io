# v0.25.0 — Stable Public Release

Primera versión pública estable de Once histórico Zurigorri. Cierra el arco de Europa Career y la secuencia de partido en Liga, Copa y Europa, y no cambia el balance de Liga ni de Copa aceptado en fases anteriores.

## Qué incluye

- **Modo carrera Athletic:** Liga, Copa del Rey y Supercopa, con objetivo, Game Over y palmarés.
- **Europa Career:** clasificación según el reparto de 7 plazas de LaLiga, con reasignación cuando el campeón de Copa ya está en Europa por Liga. Torneo jugable con fase inicial, semifinal y final, y prórroga y penaltis en las eliminatorias.
- **Secuencia de partido:** previa, reloj, goles en su minuto (Liga y Copa), prórroga y penaltis (Europa) y resultado final. Velocidad Lento / Normal / Rápido guardada en el navegador.
- **Ruleta de temporada** con el premio aplicado igual al que señala la flecha.
- **Ranking local** de carreras en el navegador y **ranking global** con Google Sheets + Apps Script (opcional, requiere endpoint).

## Cambios desde v0.24.9a

Ver `CHANGELOG.md`, entrada v0.25.0, con la lista de PRs fusionados desde #16.

## Validación

- `qa:tech-debt` completo pasa con `VITE_GLOBAL_RANKING_ENDPOINT=""`.
- `typecheck` y `lint` pasan.
- Build de producción pasa.
- Verificación en la app local de la secuencia de partido en Liga, Copa y Europa, de la ruleta y del Game Over.

## Límites conocidos

- El motor europeo no guarda minutos de gol ni el orden de los tiros de la tanda, así que la secuencia europea no muestra goles por minuto.
- El reparto europeo de LaLiga se basa en prensa deportiva; el reglamento oficial no se ha encontrado en fuentes abiertas.
- El bundle de producción supera 500 kB (aviso de Vite). Se aborda en v0.25.1.
- `npm audit` reporta 5 vulnerabilidades. Se aborda en v0.25.1.
- `qa:global-ranking` depende del archivo `.env.local` local. Se hará repetible en v0.25.1.

## Pendiente antes de publicar

- Probar el ranking global de punta a punta en la web publicada (partida, envío con apodo, aparición en el ranking y en la hoja, aviso de duplicado).
- Hacer tres partidas completas de carrera en la web publicada.
- Probar la web en un móvil real.
- Si se edita `.env.local`, guardarlo en UTF-8 sin BOM.
- Capturas de Liga, Copa, Europa, ruleta y Game Over para el README.

## Mensaje de lanzamiento (borrador)

> Once histórico Zurigorri ya tiene versión pública estable. Construye el once histórico del Athletic Club, elige entrenador y simula LaLiga y la Copa del Rey. Si el Athletic se mete en Europa, vive las noches europeas con prórroga y penaltis incluidos. Juega en https://ikeritu.github.io/11Historico/ y cuéntame qué tal te ha ido.

## Etiqueta de versión

La etiqueta no se crea hasta que el PR esté fusionado y aprobado. Cuando llegue el momento:

```bash
git tag -a v0.25.0 -m "v0.25.0 — Stable Public Release"
```

Y después:

```bash
git push origin v0.25.0
```
