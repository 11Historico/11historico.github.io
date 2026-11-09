# Informe: estilos de los rivales europeos (fase 10)

Es la auditoría de la fase 10 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`. **No cambia el juego.** Medida sobre la v0.25.104.

Reproducible con `npm run audit:european-styles` (`scripts/auditEuropeanRivalStyles.ts`). Los números de abajo son con `--matches=20000 --tournaments=2000`.

## Cómo es hoy

- **El rival europeo tiene todas sus líneas iguales a su media** (`buildUniformRivalTeam`, en `src/europe/europeanMatchEngine.ts`). Por eso la previa enseña «Nivel del rival» en las dos filas del duelo de líneas.
- **Tu equipo sí juega con sus líneas reales** (v0.25.77).
- **El planteamiento solo mira la diferencia de medias**, no las líneas (`getApproachGoalMultipliers` en `src/simulation/matchEngine.ts`):
  - ofensivo, más goles en los dos lados; defensivo, menos;
  - rinde más atacar si eres favorito y cerrarte si no lo eres.
- Pasa lo mismo en la Liga, donde los rivales sí tienen líneas.

## Qué se ha medido

- **Estilo** = mover el ataque y la defensa del rival en sentidos contrarios, con la misma media ponderada del motor (los dos pesan 0,22):
  - ofensivo: más ataque y menos defensa;
  - defensivo: al revés;
  - con ±3 y con ±6.
- **Tu equipo:** el de la partida de prueba `career-strong`, con tus líneas reales, a media de simulación 85 en la parte 1, y 84 y 86 en la parte 2.
- **Comprobación previa:** el rival uniforme de la auditoría da el mismo marcador que el juego en **2000 de 2000** partidos.

## 1. Partido a partido

Puntos por partido según el planteamiento, la mitad en casa, 20.000 partidos por casilla. «Fuerza frente a hoy» compara los puntos con el equilibrado: en positivo, el rival es más flojo.

| Rival | Estilo | Defensivo | Equilibrado | Ofensivo | Mejor | Fuerza frente a hoy |
| --- | --- | --- | --- | --- | --- | --- |
| Champions, 90 | Uniforme (hoy) | **0,85** | 0,80 | 0,75 | Defensivo | — |
| | Ofensivo ±3 | **0,90** | 0,86 | 0,80 | Defensivo | +0,06 |
| | Defensivo ±3 | **0,89** | 0,86 | 0,82 | Defensivo | +0,06 |
| | Ofensivo ±6 | **0,88** | 0,83 | 0,80 | Defensivo | +0,04 |
| | Defensivo ±6 | **0,93** | 0,86 | 0,83 | Defensivo | +0,06 |
| Champions, 86 | Uniforme (hoy) | 1,04 | 1,03 | 1,04 | Empate | — |
| | Ofensivo ±3 | 1,06 | 1,09 | 1,10 | Ofensivo | +0,06 |
| | Defensivo ±3 | 1,03 | 1,03 | 1,06 | Ofensivo | 0,00 |
| | Ofensivo ±6 | 1,06 | 1,05 | 1,03 | Defensivo | +0,02 |
| | Defensivo ±6 | 1,04 | 1,02 | 1,00 | Defensivo | −0,02 |
| Europa League, 82 | Uniforme (hoy) | 1,34 | 1,39 | 1,40 | Empate | — |
| | Ofensivo ±3 | 1,33 | 1,33 | 1,33 | Empate | −0,07 |
| | Defensivo ±3 | 1,35 | 1,39 | 1,39 | Empate | 0,00 |
| | Ofensivo ±6 | 1,29 | 1,29 | 1,32 | Ofensivo | −0,10 |
| | Defensivo ±6 | 1,34 | 1,41 | **1,45** | Ofensivo | +0,01 |
| Conference, 76 | Uniforme (hoy) | 1,74 | 1,83 | **1,95** | Ofensivo | — |
| | Ofensivo ±3 | 1,73 | 1,83 | **1,91** | Ofensivo | 0,00 |
| | Defensivo ±3 | 1,71 | 1,83 | **1,92** | Ofensivo | 0,00 |
| | Ofensivo ±6 | 1,67 | 1,79 | **1,89** | Ofensivo | −0,04 |
| | Defensivo ±6 | 1,71 | 1,82 | **1,91** | Ofensivo | −0,01 |

«Empate» significa que los planteamientos quedan a 0,02 puntos o menos, dentro del ruido.

**Lo que dice:**
1. **El estilo apenas cambia qué planteamiento conviene.** Lo decide la diferencia de nivel, como hoy:
   - contra un rival más fuerte, defensivo;
   - contra uno más flojo, ofensivo;
   - en un partido igualado, da casi igual.

   El estilo solo cambia la elección cuando los planteamientos ya estaban empatados: la diferencia es de 0,03 a 0,04 puntos por partido, casi nada.
2. **Ningún planteamiento domina siempre.** El riesgo que avisó la auditoría de la v0.25.87, que defender salga siempre mejor, no aparece: defensivo gana contra los fuertes y ofensivo contra los flojos.
3. **El estilo cambia algo la fuerza del rival aunque la media sea la misma.** Va de −0,10 a +0,06 puntos por partido, porque el motor no es simétrico: el ataque pesa 0,52 al crear ocasiones y la defensa 0,50 al frenarlas, los goles esperados se redondean y tienen un mínimo y un máximo.
   - Con ±3, casi siempre queda en ±0,07.
   - Con ±6, un rival ofensivo de Europa League te quita 0,10 puntos por partido.
4. **Sí cambia lo que ves y cómo acaban los partidos.** Contra un rival ofensivo hay más goles en las dos porterías; contra uno defensivo, menos. Por ejemplo, contra el rival de 82: 0,92-0,94 frente a 0,82-0,72.

## 2. Fase inicial completa

Probabilidad de pasar a semifinales (top 2) y puntos medios en la fase inicial. Son 2.000 torneos por casilla con las mismas semillas.
- Los estilos se reparten por club según su nombre: un tercio ofensivos, un tercio defensivos y un tercio uniformes.
- «Decide bien» elige en cada partido el planteamiento que más puntos da contra ese rival y ese estilo.

| Competición | Tu media | Decisiones | Hoy | Estilos ±3 | Estilos ±6 |
| --- | --- | --- | --- | --- | --- |
| Champions | 84 | No decide | 10 % · 5,5 | 10 % · 5,5 | 10 % · 5,5 |
| | 84 | Decide bien | 11 % · 5,8 | 11 % · 5,8 | 12 % · 5,8 |
| | 86 | No decide | 13 % · 6,1 | 13 % · 6,1 | 14 % · 6,2 |
| | 86 | Decide bien | 14 % · 6,3 | 14 % · 6,3 | 15 % · 6,4 |
| Europa League | 84 | No decide | 28 % · 8,0 | 27 % · 7,9 | 28 % · 7,9 |
| | 84 | Decide bien | 30 % · 8,2 | 30 % · 8,2 | 30 % · 8,2 |
| | 86 | No decide | 35 % · 8,8 | 35 % · 8,8 | 36 % · 8,8 |
| | 86 | Decide bien | 40 % · 9,1 | 40 % · 9,1 | 40 % · 9,1 |
| Conference | 84 | No decide | 54 % · 10,2 | 54 % · 10,2 | 53 % · 10,1 |
| | 84 | Decide bien | 61 % · 10,7 | 61 % · 10,7 | 60 % · 10,7 |
| | 86 | No decide | 63 % · 11,0 | 62 % · 10,9 | 61 % · 10,8 |
| | 86 | Decide bien | 68 % · 11,5 | 68 % · 11,4 | 68 % · 11,4 |

**Lo que dice:**
- **El equilibrio de Europa no cambia.** Con ±3, todas las casillas quedan a 1 punto de hoy o menos; con ±6, a 2 puntos o menos.
- **Decidir bien vale lo mismo que hoy.** Entre 1 y 7 puntos más de pasar, según la competición, porque el estilo apenas mueve la elección.

**Límites de la medición:**
- Los partidos entre rivales de la tabla siguen siendo uniformes. Con estilos también los tendrían; el efecto sería pequeño, porque los estilos se compensan entre clubes.
- Solo se ha medido la fase inicial, sin semifinales ni final.
- No se han medido las decisiones del descanso.
- Tu equipo es el de la partida de prueba, con líneas bastante parejas: ataque 96, defensa 94. Un once muy desequilibrado podría notar algo más el estilo del rival.

## Opciones

| Opción | Qué es | Equilibrio | Qué ganas |
| --- | --- | --- | --- |
| **A. Dejarlo como está** | El rival sigue con una sola media | Sin cambios | Nada |
| **B. Estilos ±3** (recomendada) | Cada club con un estilo fijo: ofensivo, defensivo o equilibrado, con 3 puntos de diferencia por línea | Pasar a semifinales, a 1 punto o menos de hoy | La previa enseña el ataque y la defensa reales del rival («Su ataque 91 · Su defensa 85»), como en la Liga. Los partidos cambian de carácter: más abiertos o más cerrados |
| **C. Estilos ±6** | Lo mismo con 6 puntos | A 2 puntos o menos de hoy; un rival ofensivo de nivel medio te quita hasta 0,10 puntos por partido | Estilos más marcados y más reconocibles |
| **D. Que el planteamiento dependa de las líneas** | Por ejemplo, que atacar rinda más contra una defensa floja | Por medir. Toca el motor de partidos, que comparten Liga, Copa y Supercopa | La decisión sí cambiaría según el rival. Es un cambio grande, para una fase propia |

**Recomendación: B.**
- Europa pasaría a funcionar como la Liga: el rival tiene líneas, las barras del duelo enseñan las suyas y el equilibrio no cambia.
- Hay que ser claros: el estilo **no** hará que el planteamiento correcto cambie según el rival. Eso solo lo conseguiría la opción D, que toca el motor de todas las competiciones.
- Si lo que buscas es que la decisión cambie según el rival, B no basta y habría que plantear D.

**Si eliges B o C:**
- El estilo de cada club se fijaría a mano en `src/europe/europeanOpponents.ts`, junto a su media.
- `buildUniformRivalTeam` pasaría a usarlo, y la previa dejaría de enseñar «Nivel del rival».
- Antes de abrir el PR se repetirían esta auditoría, `npm run audit:europe` y `npm run audit:rating`.
