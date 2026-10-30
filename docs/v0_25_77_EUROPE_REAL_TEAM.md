# v0.25.77 — Europa con tu equipo real

Fase 4 de la auditoría de control del usuario (B3). Toca el simulador con aprobación expresa del usuario: cambia los resultados europeos de la partida, también en planteamiento Equilibrado. No cambia Liga, Copa ni Supercopa.

## Qué cambia

- **Tu perfil cuenta en Europa:** antes, dos onces con la misma media jugaban igual. Ahora el equipo juega con sus líneas reales de ataque, defensa, control, mentalidad y portería.
- **Misma fuerza:** todas las líneas se desplazan lo mismo para que su promedio sea la media europea actual, con la dificultad y el entrenador ya incluidos. El perfil reparte la fuerza, no la aumenta.
- **Goleadores y asistentes:** se ven en el partido europeo, con su minuto, y en el mini campo.
- **Previa y crónica:** la previa muestra «Tu ataque 88 · Tu defensa 87 · Nivel del rival 77», y la crónica cuenta el duelo si el marcador y los ratings dicen lo mismo.

## Qué no cambia

- **Estadísticas de la temporada:** por decisión del usuario, los goles y asistencias europeos no suman ni a los goleadores ni a los totales. Un test de Playwright lo comprueba.
- **Rivales europeos:** siguen teniendo un solo número en los datos y no se han inventado líneas. Los textos hablan de «el rival», no de su ataque o su defensa.
- **Prórroga y penaltis:** siguen dependiendo solo de la media. Los goles de la prórroga europea no tienen autor ni minuto, igual que antes.
- **Partidos entre rivales de la clasificación europea:** se simulan como siempre.
- **Liga, Copa, Supercopa, ratings y plantillas:** sin tocar.

## Medición

La tabla sale de `npm run audit:approach`, que es reproducible (4.000 partidos por casilla, mitad en casa y mitad fuera). Pasar en semifinal o final incluye prórroga y penaltis.

| Cruce | Perfil | Puntos por partido | Pasa en semifinal o final | Goles a favor | Goles en contra |
| --- | --- | --- | --- | --- | --- |
| 76 vs 84 | Solo media (antes) | 0,67 | 24,6 % | 0,58 | 1,17 |
| 76 vs 84 | Muy ofensivo | 0,72 | 26,6 % | 0,70 | 1,25 |
| 76 vs 84 | Muy defensivo | 0,66 | 24,3 % | 0,53 | 1,11 |
| 76 vs 84 | Once fuerte de prueba | 0,72 | 26,7 % | 0,58 | 1,12 |
| 76 vs 84 | Once débil de prueba | 0,72 | 26,7 % | 0,58 | 1,12 |
| 82 vs 82 | Solo media (antes) | 1,19 | 45,0 % | 0,82 | 0,92 |
| 82 vs 82 | Muy ofensivo | 1,21 | 46,5 % | 0,92 | 0,99 |
| 82 vs 82 | Muy defensivo | 1,16 | 44,4 % | 0,65 | 0,77 |
| 82 vs 82 | Once fuerte de prueba | 1,19 | 45,0 % | 0,82 | 0,92 |
| 82 vs 82 | Once débil de prueba | 1,19 | 45,0 % | 0,82 | 0,92 |
| 88 vs 80 | Solo media (antes) | 1,81 | 67,4 % | 1,04 | 0,64 |
| 88 vs 80 | Muy ofensivo | 1,71 | 64,1 % | 1,14 | 0,81 |
| 88 vs 80 | Muy defensivo | 1,74 | 65,3 % | 0,92 | 0,58 |
| 88 vs 80 | Once fuerte de prueba | 1,81 | 67,4 % | 1,04 | 0,64 |
| 88 vs 80 | Once débil de prueba | 1,77 | 66,5 % | 1,05 | 0,67 |

«Muy ofensivo» es ataque +8 y defensa -8 respecto a la media, y «muy defensivo», lo contrario. Con todas las líneas iguales, o todas 8 puntos por encima de la media, el resultado es idéntico al de antes en todos los partidos.

## Lectura

- **Sin inflar:** los dos onces de prueba tienen líneas casi planas, y se mueven como mucho unos 2 puntos porcentuales respecto a antes.
- **El estilo se nota en los goles:** con la misma media, un equipo ofensivo marca y encaja más que uno defensivo.
- **Un perfil desequilibrado no es gratis:** al favorito le cuesta hasta unos 3 puntos porcentuales en eliminatorias, y al inferior le ayuda un poco si es ofensivo.
- **Límite conocido:** el motor redondea los goles, así que el efecto va a saltos. Una diferencia mínima de líneas puede mover 2 puntos porcentuales en un cruce concreto, como le pasa a los onces de prueba en 76 contra 84.

## Comprobación

Comparación antes y después de 4.000 partidos de Liga, 3.000 europeos sin perfil, 1.000 Supercopas y 24 temporadas completas, sin planteamiento y con cada una de las tres opciones: resultados idénticos.

Revisión visual de un partido europeo a 800 px, con goleador en la lista y en el mini campo y las estadísticas de la temporada sin cambios.

## Validación

```bash
npm run typecheck
npx eslint src scripts
npm test
npm run qa:ci
npx playwright test
npm run audit:approach
```

Riesgo: medio. Cambia los resultados europeos de todas las partidas, aunque la fuerza media no cambia.
