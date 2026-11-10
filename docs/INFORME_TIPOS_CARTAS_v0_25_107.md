# Los 14 tipos de carta (idea del usuario, v0.25.107)

**Lo que pidió el usuario (2026-11-10):**
- al menos 9 tipos de carta; en cada sorteo, eliges 1 de 6;
- sus 6 cartas: +2, +4, +6, Defensa total, Ataque total y Efecto San Mamés;
- «todas las tuyas más las mías, mide las cartas»: se suman las 8 propuestas (Fortín fuera, Clásico, Remontada, Portero inspirado, Mediocampo, Doble o nada, Ojeador y Revancha);
- 4 cartas al empezar la temporada, y cartas de más al llegar a una ronda de Copa, ganar al líder, encadenar una racha sin perder o ganar a un rival potente en Europa.

**No cambia el juego.** Las cartas solo existen dentro de la auditoría.

## Resultado en una frase

**Con el mazo completo y un uso sensato, las Copas suben un 53 % (de 0,15 a 0,23 por temporada) y la puntuación un 22 %, sin ninguna carrera rechazada.** Pero las cartas no valen lo que dice su rareza: el Fortín fuera, que es común, vale como un +7; Mediocampo y Remontada casi no hacen nada, y Doble o nada no cuesta nada.

## Método

**Script:** `npm run audit:card-types`, en `scripts/auditCardTypes.ts`.
- Los efectos que no son media (los goles, el campo, la prórroga y los penaltis) se añaden al motor solo en esta auditoría, con `scripts/auditCardTypes.vite.ts`.
- La auditoría de las cartas de media (`audit:cards`) sale idéntica a la de antes.

**Dos partes:**
1. **Sonda.** Cada carta en un partido suelto:
   - 12 equipos del draft de mejor media, en dificultad Normal;
   - rivales de tu media −4, igual, +4 y +8, en casa y fuera;
   - 250 partidos por equipo y caso.

   Se mide en «+N de media equivalente»: el bonus de media que daría lo mismo.
2. **Carreras.** El mazo completo con las reglas para ganar cartas, en los cuatro casos de siempre:
   - dificultad Normal y Fácil;
   - draft de mejor media y al azar;
   - 300 carreras por caso, 14.400 en total.

**Las cartas:**

| Rareza (probabilidad) | Cartas | Efecto |
| --- | --- | --- |
| Común (50 %) | +2 | +2 a toda la media |
| | Mediocampo | +6 solo en el control |
| | Fortín fuera | fuera de casa: campo neutral. El rival pierde su ventaja de local y tú, la penalización de visitante |
| | Revancha | +3; si pierdes, vuelve a la mano |
| | Ojeador | en el siguiente sorteo ves 1 de las 6 boca arriba |
| Rara (35 %) | +4 | +4 a toda la media |
| | Defensa total | el rival marca un 40 % menos |
| | Ataque total | marcas un 40 % más y el rival un 10 % más |
| | Clásico | +5 contra un rival con más media |
| | Remontada | si vas perdiendo al descanso, la segunda parte con +6; si no, no se gasta |
| | Portero inspirado | solo en eliminatorias: ganas la prórroga de Copa o Supercopa el 80 % de las veces; en Europa, los penaltis (85 % de acierto frente al 65 %) |
| Épica (15 %) | +6 | +6 a toda la media |
| | Efecto San Mamés | en casa: subes a la media del rival si es mayor que la tuya |
| | Doble o nada | +6; si pierdes, el siguiente partido juegas con −2 |

Dentro de cada rareza, todas las cartas tienen la misma probabilidad.

**Cómo se ganan:**
- 4 al empezar la temporada;
- +1 al llegar a cuartos de Copa y +1 al llegar a la final;
- +1 al ganar al líder de Liga, si el líder no eres tú;
- +1 por cada 8 partidos seguidos sin perder, en cualquier competición;
- +1 al ganar en Europa a un rival con más media que tú.

Puedes tener como mucho 6 en la mano y caducan al acabar la temporada. Se pueden usar en cualquier partido, también en la Supercopa, como mucho una por partido.

**El jugador de la auditoría («uso sensato»):**
- en las eliminatorias, gasta su mejor carta;
- en Liga, solo gasta las que le sobran (más cartas que eliminatorias le quedan) y empieza por la que menos vale en una eliminatoria;
- desde la jornada 36 gasta lo que le quede;
- en la Copa y en Europa decide bien el planteamiento y el descanso, como en las otras auditorías.

## 1) Cuánto vale cada carta en un partido

| Carta | Rareza | Dónde vale | Liga: puntos por partido | Liga: equivale a | Eliminatoria: pasar | Eliminatoria: equivale a |
| --- | --- | --- | --- | --- | --- | --- |
| +2 | Común | siempre | +0,12 | +2,0 | +4,5 pts | +2,0 |
| Mediocampo | Común | siempre | +0,04 | **+0,5** | +1,2 pts | **+0,4** |
| Fortín fuera | Común | fuera de casa | +0,46 | **+7,4** | +11,6 pts | **+6,3** |
| Revancha | Común | siempre | +0,14 | +3,0 | +6,0 pts | +3,0 |
| +4 | Rara | siempre | +0,22 | +4,0 | +8,7 pts | +4,0 |
| Defensa total | Rara | siempre | +0,28 | +4,7 | +9,1 pts | +4,2 |
| Ataque total | Rara | siempre | +0,12 | +2,2 | +4,7 pts | +2,1 |
| Clásico | Rara | rival con más media | +0,26 | +5,0 | +9,6 pts | +5,0 |
| Remontada | Rara | siempre | +0,04 | **+0,5** | +1,7 pts | **+0,6** |
| Portero inspirado | Rara | eliminatorias | - | - | +4,8 pts | +2,2 |
| +6 | Épica | siempre | +0,34 | +6,0 | +12,2 pts | +6,0 |
| Efecto San Mamés | Épica | en casa, rival con más media | +0,40 | +5,8 | +16,6 pts | +6,4 |
| Doble o nada | Épica | siempre | +0,34 | +6,0 | +12,2 pts | +6,0 |

**Notas:**
- **Revancha** vuelve a la mano en el 45 % de los partidos, así que cada carta se usa más de una vez.
- **Remontada** solo se activa (y se gasta) en el 30 % de los partidos. Aun así, por carta gastada vale unos +1,7.
- **Doble o nada:** con ella pierdes el 39 % de los partidos. El −2 del partido siguiente cuesta solo 0,11 puntos, así que el coste medio es de 0,04 puntos por carta. **En la práctica es un +6 sin riesgo.**
- **Efecto San Mamés:** vale tanta media como la diferencia con el rival. En la sonda, con rivales de +4 y +8, sale una media de +6.

## 2) Carreras

Media de los cuatro casos:

| Cartas | Ganadas por temporada | Temporadas superadas | Puntos en la 1.ª | Copas por temporada | Títulos por temporada | Puntuación | Frente a sin cartas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sin cartas (hoy) | - | 2,19 | 58,4 | 0,15 | 0,38 | 28,0 | - |
| **Mazo completo, uso sensato** | 7,2 | 2,51 | 58,7 | **0,23** | **0,52** | 34,1 | **+22 %** |
| Mazo completo, en el siguiente partido | 7,0 | 2,57 | 59,9 | 0,15 | 0,42 | 33,0 | +18 % |
| Solo +2 / +4 / +6, uso sensato | 7,0 | 2,47 | 58,9 | 0,21 | 0,51 | 33,4 | +19 % |
| 5 al empezar | 8,0 | 2,47 | 59,0 | 0,23 | 0,54 | 33,7 | +21 % |
| Racha de 6 | 8,1 | 2,46 | 59,0 | 0,22 | 0,54 | 33,5 | +20 % |
| Racha de 10 | 6,7 | 2,39 | 58,7 | 0,22 | 0,51 | 32,3 | +15 % |
| Sin extras (solo las 4) | 4,0 | 2,28 | 58,6 | 0,18 | 0,46 | 30,0 | +7 % |
| Extra: solo Copa | 5,0 | 2,37 | 58,5 | 0,21 | 0,50 | 31,7 | +13 % |
| Extra: solo líder | 4,7 | 2,34 | 58,8 | 0,18 | 0,47 | 30,9 | +10 % |
| Extra: solo racha de 8 | 4,8 | 2,29 | 58,6 | 0,19 | 0,47 | 30,4 | +9 % |
| Extra: solo Europa | 4,6 | 2,24 | 58,6 | 0,18 | 0,46 | 29,6 | +6 % |

Salvo donde se indica, las filas usan el mazo completo y el uso sensato.

**Cartas ganadas por temporada con el mazo completo:**
- 4 al empezar;
- 1,0 de Copa;
- 0,7 por ganar al líder;
- 0,9 por rachas;
- 0,6 de Europa.

Casi nunca se pierden por tener la mano llena (0,1 por temporada) y caducan unas 0,5.

**El margen:**
- en cada caso, ±0,2-0,4 temporadas y ±3-6 de puntuación;
- en la media de los cuatro casos, más o menos la mitad.

**Ninguna carrera queda rechazada** por la regla de plausibilidad del ranking: 14.400 simuladas.

**Qué cartas se usan** (mazo completo, uso sensato), por temporada:

| Carta | Usadas | Ganados con ella | Perdidos con ella |
| --- | --- | --- | --- |
| Revancha | 0,90 | 64 % | 26 % |
| Fortín fuera | 0,76 | 71 % | 25 % |
| Mediocampo | 0,70 | 47 % | 30 % |
| +2 | 0,69 | 61 % | 25 % |
| Ojeador | 0,61 (en sorteos) | - | - |
| +4 | 0,46 | 71 % | 25 % |
| Defensa total | 0,45 | 74 % | 21 % |
| Ataque total | 0,41 | 66 % | 25 % |
| Doble o nada | 0,39 | 75 % | 22 % |
| +6 | 0,38 | 76 % | 22 % |
| Clásico | 0,31 | 40 % | 41 % |
| Remontada | 0,30 | 19 % | 58 % |
| Portero inspirado | 0,30 | 76 % | 24 % |
| Efecto San Mamés | 0,14 | 48 % | 26 % |

Clásico, Remontada y San Mamés ganan menos porque solo se usan en partidos difíciles: contra rivales mejores o cuando ya vas perdiendo.

## Lo que dicen los datos

1. **El impacto sigue siendo real y está en los títulos.**
   - Las Copas suben de 0,15 a 0,23 por temporada y los títulos totales de 0,38 a 0,52.
   - Usadas en el siguiente partido, dan casi la misma supervivencia (+0,38 temporadas) pero ninguna Copa de más.
   - Hay decisión: guardarlas para las eliminatorias o gastarlas en Liga.
2. **El mazo variado vale lo mismo que el de solo +2, +4 y +6:** +22 % frente a +19 %. La variedad no infla el juego; cambia cómo se juega, porque hay cartas que solo sirven fuera de casa, contra un grande o en las eliminatorias.
3. **Lo que da el impacto son las cartas de más.**
   - Con solo las 4 del inicio de temporada, la puntuación sube un 7 %.
   - De los extras, el que más aporta es el de la Copa (+13 %), seguido del líder (+10 %), la racha (+9 %) y Europa (+6 %).
   - Empezar con 5 en vez de 4, o una racha de 6 en vez de 8, apenas cambia nada (+21 % y +20 % frente a +22 %). Con una racha de 10 baja un poco (+15 %).
4. **La rareza no cuadra con lo que vale cada carta:**
   - **Fortín fuera** (común) vale como un **+7**: es la mejor carta del mazo. Jugar fuera pesa mucho en el motor.
   - **Mediocampo** (común) y **Remontada** (rara) valen **menos de +1** por partido. El control pesa poco en el motor, y la Remontada solo se activa en el 30 % de los partidos.
   - **Ataque total** y **Portero inspirado** (raras) valen como un **+2**, igual que una común.
   - **Doble o nada** (épica) es un **+6 sin coste**: el −2 del partido siguiente casi no se nota.
   - **Revancha** (común) vale +3 y vuelve a la mano casi la mitad de las veces: es de las más usadas.
   - **Defensa total**, **Clásico**, **+4** y **+6** están donde les toca.

## Propuesta

**Recolocar las cartas según lo que valen y retocar las que fallan.**

| Rareza | Cartas | Cambios |
| --- | --- | --- |
| Común (≈ +2) | +2, Ataque total, Portero inspirado, Ojeador, Mediocampo | Ataque total y Portero bajan de rara a común. Mediocampo debería ser «+6 en el control y +2 en el resto» (sin medir) o desaparecer |
| Rara (≈ +4) | +4, Defensa total, Clásico, Revancha, Remontada | Revancha sube de común a rara. Remontada debería ser «+12 la segunda parte» (sin medir), o se queda floja |
| Épica (≈ +6) | +6, Efecto San Mamés, Fortín fuera, Doble o nada | Fortín fuera sube de común a épica. Doble o nada necesita un coste real: si pierdes, pierdes otra carta de la mano (sin medir) |

**Cómo se ganan:** como se ha medido.
- 4 al empezar la temporada;
- +1 al llegar a cuartos de Copa y +1 al llegar a la final;
- +1 al ganar al líder;
- +1 cada 8 partidos sin perder;
- +1 al ganar en Europa a un rival con más media;
- como mucho 6 en la mano.

Quedan 14 tipos, más de los 9 que pedía el usuario.

**Antes de construir, convendría medir de nuevo las tres cartas retocadas** (Mediocampo, Remontada y Doble o nada) y el mazo con la rareza nueva. La inflación esperada no cambia mucho, porque las cartas solo se recolocan y el valor medio del mazo es parecido.

**Permiso:** construirlo toca el modo carrera, la entrada del simulador, el motor de partidos (para Defensa total, Ataque total, Fortín fuera y Portero inspirado), las recompensas y el guardado de la partida. Sería una fase nueva con su versión.

## Limitaciones

- **Remontada** se aproxima así: si vas perdiendo al descanso, el partido se repite con las mismas tiradas y +3 durante los 90 minutos, que equivale a unos +6 en la segunda parte. El motor no simula las dos partes por separado.
- **El campo neutral del Fortín fuera** quita las penalizaciones de visitante del motor y la ventaja del rival pequeño en casa en la Copa. En Europa no toca la ventaja de local de la prórroga.
- **El Portero inspirado** fija la prórroga de Copa y Supercopa al 80 %, y los penaltis europeos al 85 % frente al 65 %.
- **La sonda usa rivales con la misma media en todas las líneas.** En las carreras, los rivales son los reales.
- **El jugador de la auditoría usa reglas fijas.** Una persona que mire la tabla o el cuadro de Copa sacaría algo más.
- **No mide cómo se siente** robar una carta ni ver las otras 5.
