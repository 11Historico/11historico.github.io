# Informe: la media 82 del Real Oviedo

Es la tarea que el usuario apuntó: «revisar el valor de Oviedo que tiene +82». Después pidió «mide el Oviedo». Es una auditoría: **no cambia el juego.**

## De dónde puede salir

El Real Oviedo tiene media base **77** (`src/data/laliga2526Teams.ts`). La previa no enseña esa media, sino la ajustada, que es la que juega el partido:

| Ajuste | Dónde | Cuánto | Cuándo |
| --- | --- | --- | --- |
| Forma de temporada | `getTeamSeasonForm` y `applySeasonFormToRival` (`leagueSimulator.ts`) | de −3 a +6 | en Liga; cambia cada temporada con una semilla |
| Progresión de rivales | `getRivalDifficultyBonus` (`careerRules.ts`) | +0,5 por temporada, hasta +3 | en Liga, desde la 2.ª temporada de carrera |
| Impulso del rival inferior | `applyCupRivalContext` | sube la media un 60 % del impulso | en Copa, si eres favorito |
| Ventaja del pequeño en casa | `adjustCupRivalByVenueAndRound` | — | no se aplica al Oviedo: solo vale para equipos de 76 o menos |

**La forma del Oviedo tiene una tabla propia** desde la v0.15.7. La subieron para que dejara de bajar casi siempre: el objetivo era pasar de unos 73 descensos de cada 100 a la zona de 55-65.

| Forma | −3 | −1 | 0 | +2 | +4 | +5 | +6 | Media |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Oviedo | 6 % | 11 % | 23 % | 24 % | 20 % | 11 % | 5 % | +1,8 |

La tabla general de su nivel (de 76 a 77) va de −5 a +6 y tiene media +0,4. El Oviedo también tiene +2,4 ocultos en `getAverageRivalRating`, que no salen en la previa. Cuentan en sus partidos contra otros rivales y en el cálculo del impulso de Copa.

## Cómo se ha medido

- **Con las funciones del juego:** temporadas completas de Liga y Copa con `createUserLeagueSimulation`, `simulateNextUserLeagueMatch` y `simulateNextCupMatch`.
- **Antes de cada partido** contra el Oviedo se apunta la media que enseña la previa (`getNextUserMatchInfo`).
- **Volumen:** 2.000 temporadas por fila, en las temporadas 1, 2, 3, 4 y 7 de carrera, en Normal y en Fácil. Los rivales llevan la progresión de esa temporada (`applyCareerRivalProgression`).
- Reproducible con `npm run audit:oviedo` (o `node .audit-dist/auditOviedoRating.js --seasons=N`).

## Resultados

### En Liga

La forma es la misma toda la temporada, así que hay un valor por temporada. Sale igual en Normal y en Fácil, porque la dificultad no cambia a los rivales.

| Temporada de carrera | Progresión | Media en la previa | 82 o más | Reparto |
| --- | --- | --- | --- | --- |
| 1.ª | +0 | 78,9 | **16 %** | 74: 6 % · 76: 11 % · 77: 23 % · 79: 23 % · 81: 21 % · 82: 10 % · 83: 6 % |
| 2.ª | +0,5 | 79,9 | **37 %** | 75: 6 % · 77: 11 % · 78: 22 % · 80: 24 % · 82: 20 % · 83: 12 % · 84: 5 % |
| 3.ª | +1 | 79,8 | **36 %** | 75: 6 % · 77: 12 % · 78: 24 % · 80: 22 % · 82: 20 % · 83: 11 % · 84: 5 % |
| 4.ª | +1,5 | 80,8 | **35 %** | 76: 6 % · 78: 12 % · 79: 22 % · 81: 26 % · 83: 20 % · 84: 10 % · 85: 5 % |
| 7.ª | +3 | 81,8 | **59 %** | 77: 7 % · 79: 11 % · 80: 23 % · 82: 22 % · 84: 20 % · 85: 11 % · 86: 6 % |

**Cómo se llega a 82:**
- En la 1.ª temporada, con forma +5 o +6.
- Desde la 2.ª, con +4, por el redondeo: 77,5 + 4 = 81,5, que se redondea a 82.
- En la 7.ª, con +2.

### En Copa

La Copa usa la media base, sin forma ni progresión.

| Dificultad | Partidos contra el Oviedo | Media en la previa | Reparto |
| --- | --- | --- | --- |
| Normal | 523 | 78,1 | 77–79 |
| Fácil | 591 | 78,5 | 77–79 |

En la Copa no llega nunca a 82: como mucho, 79.

## Conclusiones

1. **El 82 sale de la Liga, de la forma de temporada.** Es una temporada buena del Oviedo, de +5 o más; o de +4 desde la 2.ª temporada de carrera, por la progresión de rivales.
2. **No es un error.** Es la media con la que juega ese partido, y viene de una decisión de balance de la v0.15.7: la tabla de forma propia del Oviedo, más favorable que la general, para que no bajase casi siempre.
3. **No es raro:** pasa en una de cada seis temporadas en la 1.ª, en una de cada tres desde la 2.ª y en más de la mitad desde la 7.ª.
4. **Lo que confunde es que no se explica.** La previa enseña 82 sin decir que el Oviedo es de 77 y está en una temporada buena.

## Opciones

- **A. Dejarlo como está.** Es el balance de Liga ya cerrado (v0.15.7).
- **B. Que la previa explique la forma.** Por ejemplo: «82 (77, +5 de forma)» o «en racha». Es solo interfaz: no cambia ninguna media ni el balance.
- **C. Recortar la cola alta de la forma del Oviedo** (por ejemplo, hasta +4). Toca el balance de Liga cerrado y los descensos, así que pide permiso explícito y repetir `audit:balance` para ver cuánto baja.

Recomiendo **B**: el número es correcto, lo que falta es que se entienda.

## Limitaciones

- **Progresión aproximada:** los rivales de cada temporada son los iniciales con la progresión aplicada. En una carrera real, el Oviedo puede haber bajado y no estar.
- **Copa:** solo se apuntan los partidos en que el sorteo pone al Oviedo, unos 100 por fila.
- **Europa** no se mide, porque el Oviedo no juega en Europa.

## Archivos

- `scripts/auditOviedoRating.ts`: la auditoría nueva.
- `package.json`: `audit:oviedo`.
