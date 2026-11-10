# v0.25.108 — Cartas de partido

Es la idea de cartas del usuario, medida en `docs/INFORME_CARTAS_v0_25_107.md` y `docs/INFORME_TIPOS_CARTAS_v0_25_107.md`. Se construye el mazo retocado («Retoques medidos»). El usuario dio permiso con «haz las cartas» y aprobó el plan con «sí».

## Las reglas

**Solo en el modo carrera.**

**Cuántas:**
- 4 al empezar cada temporada, antes de la Supercopa si se juega.
- +1 al llegar a cuartos de Copa (al ganar los octavos) y +1 al llegar a la final (al ganar la semifinal).
- +1 al ganar en Liga al líder, si el líder no eres tú.
- +1 por cada 8 partidos seguidos sin perder, en cualquier competición. La cuenta vuelve a empezar al llegar a 8 y al empezar la temporada.
- +1 al ganar en Europa a un rival con más media que tú.
- Como mucho 6 en la mano, contando las que faltan por elegir. Con la mano llena, la carta que se gana se pierde, y se avisa.
- Caducan al acabar la temporada.

**El sorteo:**
- 6 cartas boca abajo y eliges 1.
- La tuya se da la vuelta y se resalta; después, las otras 5.
- Rareza al 50 / 35 / 15 % y, dentro de cada rareza, todas con la misma probabilidad.
- Las 6 salen de una semilla de la partida, la temporada y el número de sorteo: recargar no cambia lo que hay boca abajo. Lo elegido se guarda en el momento.

**Las cartas** (la media es la de simulación, la que enseña la previa):

| Rareza | Carta | Efecto |
| --- | --- | --- |
| Común | +2 | +2 a toda la media |
| | Ataque total | goles esperados propios ×1,4 y del rival ×1,1 (en goles reales, unos +25 % y algo más en contra) |
| | Portero inspirado | solo en eliminatorias: prórroga de Copa y Supercopa al 80 %; penaltis europeos al 85 % frente al 65 % |
| | Ojeador | en el siguiente sorteo, una de las 6 sale boca arriba; se gasta sola |
| | Mediocampo | +6 en el control y +2 en el resto |
| Rara | +4 | +4 a toda la media |
| | Defensa total | goles esperados del rival ×0,6 (en goles reales, unos −30 %) |
| | Clásico | +5 contra un rival con más media |
| | Revancha | +3; si pierdes, vuelve a la mano |
| | Remontada | si vas perdiendo al descanso, la segunda parte con +12; si no, no se gasta |
| Épica | +6 | +6 a toda la media |
| | Efecto San Mamés | en casa: subes a la media del rival si es mayor |
| | Fortín fuera | fuera de casa: campo neutral |
| | Doble o nada | +6; si pierdes, pierdes otra carta de la mano |

**Cuándo se usan:**
- En la previa de cualquier partido de Liga, Copa, Supercopa o Europa.
- Como mucho una por partido: la que eliges vale para el siguiente partido que juegues.
- La previa recalcula tu media, el duelo de líneas y las probabilidades con la carta.
- Las que no valen en ese partido salen apagadas y dicen por qué.
- Con la simulación automática o «Saltar hasta próximo evento», la carta elegida vale para el primer partido.

## Qué cambia en el código

- **`src/career/matchCards.ts` (nuevo):** el mazo, la mano, los sorteos, el efecto de cada carta según el partido y lo que pasa después: gastar la carta, Revancha, Remontada, Doble o nada y las cartas ganadas. Son funciones puras.
- **`src/simulation/matchEngine.ts`:** `MatchCardEffect`, opcional en `simulateMatch`.
  - Multiplica los goles esperados.
  - Campo neutral: sin la penalización del visitante ni la ventaja del local.
  - Remontada: con las mismas tiradas, si vas perdiendo al descanso, la primera parte se queda y la segunda sale del partido con la media de más.

  Sin carta, el partido es exactamente el de antes.
- **`leagueSimulator.ts`:**
  - la carta llega a la Liga y a la Copa;
  - el Fortín fuera quita la ventaja del rival pequeño que juega en casa;
  - el Portero inspirado decide la prórroga;
  - `getNextUserMatchInfo` da el rival, el campo y el líder sin calcular probabilidades.
- **`supercopaRules.ts` y `europeanMatchEngine.ts`:** la carta y el Portero inspirado. `getSupercopaUserOpponent`.
- **`App.tsx`:** la mano vive aquí, como el torneo europeo, porque la Supercopa se juega antes de la Liga. Se crea al empezar cada temporada de carrera y se guarda con la partida (`careerMatchCards`).
- **`LeagueSimulatorView.tsx` y `CareerSupercopa.tsx`:**
  - la mano en la previa;
  - la carta en todos los caminos de simulación (partido a partido, automática, saltar al próximo evento, Copa entera y descanso);
  - el sorteo espera a que acabe el partido, el descanso y la ruleta;
  - ganar una carta para la simulación, como la ruleta.
- **`MatchCards.tsx` y `MatchCards.css` (nuevos):** la mano, las notas tras el partido y el sorteo.
- **`audit:card-types`:** ya no parchea el motor; le pasa la carta al motor del juego.

## Partidas guardadas

- **Sin cartas** (las de antes de esta versión): la temporada en curso sigue sin cartas y las recibe al empezar la siguiente.
- **Partida rápida:** sin cartas.

## Lo que no cambia

El ranking y su fórmula: el usuario dijo que aún no hay ranking real. Tampoco cambian los ratings, las plantillas, el calendario ni el orden de los partidos, y un partido de Copa o Europa pendiente sigue bloqueando la Liga.

## Comprobación

- **`tests/unit/matchCards.test.ts`** (17 tests):
  - el mazo y sus rarezas;
  - las condicionales;
  - el sorteo determinista, el Ojeador y las proporciones de rareza;
  - gastar, Revancha, Remontada y Doble o nada;
  - las cartas ganadas y la mano llena;
  - en el motor: sin carta es idéntico, Ataque total y Defensa total cambian los goles, el Fortín solo actúa fuera, la Remontada no toca la primera parte y el Portero gana más tandas.
- **`audit:league`:** la fila «(hoy)» sale idéntica a la de `main`.
- **`audit:card-types`:** con el motor del juego, la sonda y las carreras del mazo retocado salen idénticas a las del informe.
- `npm run typecheck`, `npx eslint src scripts` y `npm test` pasan.
