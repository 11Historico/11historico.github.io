# v0.25.85 — Textos de la temporada que cuadran con lo jugado

Al jugar una carrera hasta el Game Over aparecieron varios textos que no cuadraban con lo que había pasado. Solo cambia el texto: ningún resultado, regla ni premio.

## Qué cambia

| Dónde | Antes | Ahora |
| --- | --- | --- |
| **Tarjeta Supercopa** del resumen de temporada, cuando no te clasificaste | «Sin título» · «No salva la temporada» | «No jugada» · «No clasificado» |
| **Tarjeta Descenso**, si no desciendes | «Sigue vivo si cumple objetivo», también en el Game Over | «Mantiene la categoría» |
| **Copa del Rey**, al perder la final | «Eliminado en Final · Campeón: X» | «Subcampeón · Campeón: X» |
| **Pantalla del once, cabecera de la Liga y resumen final**, en carrera | Siempre «Liga 25/26» / «LaLiga 25/26» | La temporada en curso, por ejemplo «LaLiga 27/28» |

## Detalles

- **Supercopa:** el resultado de la temporada guarda ahora si se jugó la Supercopa (`playedSupercopa`). Las temporadas terminadas antes de esta versión no lo saben y siguen diciendo «Sin título».
- **Temporada:** en partida rápida sigue saliendo «25/26», que es la temporada de los rivales y del calendario. En carrera se usa la misma temporada que la cabecera «Carrera Athletic · 2027/28», en formato corto.
- **Subcampeón:** sale en el resumen de temporada, en el resumen final y en el estado de la Copa durante la Liga. Cambia el texto de `getCupStatusLabel`; la Copa se juega igual.

## Comprobación

- `tests/unit/cupStatusLabel.test.ts`: perder la final da «Subcampeón», y las demás rondas siguen diciendo en cuál caíste.
- Revisado en el navegador con una carrera guardada.
