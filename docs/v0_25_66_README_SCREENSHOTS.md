# v0.25.66 — Capturas en el README

## Problema

El README no tenía ninguna imagen del juego: quien llegaba al repositorio no veía cómo es sin abrir la web.

## Cambio

- **`README.md`:** nueva sección "Capturas", después de "Enlace online", con cuatro capturas en una tabla de 2 × 2:

  | Archivo | Pantalla | Cómo se obtiene |
  |---|---|---|
  | `docs/screenshots/portada.jpg` | Portada | Carga inicial |
  | `docs/screenshots/draft.jpg` | Draft, ronda 1 | Carrera nueva, 4-3-3, semilla 3 |
  | `docs/screenshots/liga.jpg` | Simulación de Liga | Partida de prueba fuerte, jornada 13, con el último partido terminado |
  | `docs/screenshots/temporada-superada.jpg` | Temporada superada | La misma partida, al final de la temporada |

  Son JPEG (calidad 82) de 1280 × 800 y ocupan unos 450 kB entre las cuatro.
- **`tests/e2e/readme-screenshots.spec.ts`:** genera las capturas con semillas fijas y las partidas de prueba de `tests/e2e/fixtures`. Se salta salvo que se defina `README_SCREENSHOTS=1`, así que no alarga el CI ni sobrescribe las imágenes.

## Cómo regenerarlas

En PowerShell:

```powershell
$env:README_SCREENSHOTS="1"; npx playwright test tests/e2e/readme-screenshots.spec.ts; Remove-Item Env:README_SCREENSHOTS
```

Conviene hacerlo cuando cambie la interfaz de alguna de las cuatro pantallas. La insignia de versión de la portada y de la barra de fases muestra la versión con la que se generaron.

## Qué no cambia

Juego, estilos y pruebas existentes.

## Detectado al hacer las capturas (sin cambiar aquí)

- **Botón «Saltar»:** el de la secuencia de partido de Liga y Copa se ve sin estilo (borde y letra del navegador). `.secondary-league-button` solo tiene estilo completo dentro de `.league-buttons`. Viene de la v0.24.9i. La captura de la Liga se hizo con el partido ya terminado para no mostrarlo.
- **Etiqueta `mixed`:** las tarjetas del draft muestran la etiqueta interna `mixed`, en inglés, junto a "Dato medio".

## Validación

- `npm run typecheck`, `npx eslint src scripts` y `npm test` sin errores.
- `npm run qa:ci` en verde.
- `npx playwright test`: 15 tests en verde y los 2 de capturas saltados.
- Revisión visual de las cuatro capturas.
