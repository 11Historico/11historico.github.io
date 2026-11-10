# Cierre del roadmap: Europa y la sensación de influir (v0.25.107)

El informe `INFORME_EUROPA_E_INFLUENCIA_v0_25_91.md` partía de una queja: «es como si todo fuera al azar y lo único que yo pudiera hacer es el draft inicial». El usuario había jugado una carrera de cuatro temporadas sin pasar nunca de la fase inicial europea.

Desde entonces, el roadmap `ROADMAP_MEJORAS_v0_25_91.md` ha hecho todo lo que proponía ese informe, menos la fase 12, que el usuario rechazó. Este informe repite la medición del original con el juego de la v0.25.107 para ver si la queja queda resuelta.

**No cambia el juego.** Se repite con `npm run audit:europe -- --tournaments=1000`.

## Qué ha cambiado desde la v0.25.91

| Propuesta | Hecha en | Qué hace |
| --- | --- | --- |
| U1 y U2: probabilidad de pasar y zona marcada | v0.25.95 | La tabla europea dice cómo vas y quién pasa. |
| U3: «tu decisión» | v0.25.96 | El balance de decisiones de la temporada. |
| U6: balance europeo | v0.25.97 | Al cerrar la temporada: qué era lo normal con tu equipo. |
| G1: rivales fijos por club | v0.25.98 | Nivel fijo ±1 por club y techo de 91. |
| G2: rivales con estilo | v0.25.105 | Estilo ofensivo, equilibrado o defensivo, de ±3 por línea. |
| Sorteo justo | v0.25.106 | La semifinal y la final ya no repiten rival entre partidas. |
| G5: formato | v0.25.107 | El 3.º y el 4.º juegan una previa por entrar en semifinales. |
| G3 y G4: prioridad de temporada y rotación | — | Rechazadas por el usuario (fase 12). |

## Cómo se mide

- Es el mismo método del informe original: 1.000 torneos por casilla, con las mismas tres formas de decidir.
  - «Decide bien» elige el planteamiento con más puntos esperados (en la previa, con más probabilidad de pasar). En el descanso arriesga si va perdiendo y cierra si va ganando.
  - «No decide» juega equilibrado y no toca nada en el descanso.
  - «Decide mal» hace lo contrario de decidir bien.
- El script se ha puesto al día con el juego:
  - pasa a los rivales su estilo;
  - juega la previa, con prórroga y penaltis;
  - usa las semillas con la forma de las del juego (`auditGameId`).
- «Llega a semifinales» suma los que pasan directos y los que ganan la previa.

## Resultado

Probabilidad de llegar a semifinales: decide bien / no decide / decide mal.

| Tu rating de simulación | Champions, v0.25.91 → ahora | Europa League, v0.25.91 → ahora | Conference, v0.25.91 → ahora |
| --- | --- | --- | --- |
| 82 | 9 / 8 / 3 → 17 / 11 / 4 % | 26 / 19 / 12 → 42 / 32 / 23 % | 57 / 44 / 32 → 73 / 61 / 50 % |
| **84** | **11 / 10 / 5 → 22 / 15 / 6 %** | **33 / 23 / 16 → 51 / 39 / 30 %** | 64 / 52 / 39 → 80 / 70 / 57 % |
| 86 | 16 / 14 / 7 → 29 / 19 / 11 % | 45 / 33 / 23 → 64 / 50 / 39 % | 72 / 61 / 45 → 85 / 77 / 64 % |
| 88 | 20 / 17 / 10 → 37 / 26 / 16 % | 53 / 41 / 29 → 71 / 60 / 48 % | 78 / 67 / 49 → 88 / 82 / 69 % |
| 90 | 28 / 23 / 14 → 48 / 33 / 23 % | 62 / 49 / 35 → 76 / 67 / 53 % | 83 / 71 / 53 → 91 / 86 / 73 % |

El margen es de unos ±3 puntos por casilla.

### Lo que aporta cada parte, con 84 en Europa League

| | Decide bien | No decide | Decide mal |
| --- | --- | --- | --- |
| Pasa directo (top 2) | 35 % | 25 % | 18 % |
| Juega la previa | 31 % | 28 % | 27 % |
| Gana la previa | 53 % | 49 % | 46 % |
| **Llega a semifinales** | **51 %** | **39 %** | **30 %** |

Las tablas completas, con posición, puntos y rival medio, salen del script.

## Diagnóstico

1. **Pasar ya no es lo raro.**
   - Con 84 en Europa League, decidiendo bien, se llega a semifinales una de cada dos veces. Antes era una de cada tres.
   - La racha del usuario, cuatro temporadas sin pasar, ocurría un 20 % de las veces decidiendo bien (0,67⁴). Ahora ocurre un 6 % (0,49⁴); sin decidir, baja del 35 % al 14 %.
   - En Champions sigue costando: con 84, el 22 %. El rival medio es de 87,9, por encima de tu rating de simulación. Es el nivel de la competición, no el azar.
2. **Tus decisiones pesan más que antes, en puntos.** Diferencia entre decidir bien y decidir mal:

   | Con 84 | v0.25.91 | Ahora |
   | --- | --- | --- |
   | Champions | 6 puntos | 16 puntos |
   | Europa League | 17 puntos | 21 puntos |
   | Conference | 25 puntos | 23 puntos |

   En proporción pesan algo menos, porque la base es más alta. En Europa League antes decidir bien duplicaba la probabilidad (×2,1) y ahora la multiplica por 1,7.
3. **Casi todo el aumento viene de la previa.**
   - Pasar directo apenas cambia: con 84 en Europa League, del 33 / 23 / 16 % al 35 / 25 / 18 %.
   - Los rivales fijos y con estilo hacen el torneo legible y justo, pero no más fácil. El rival medio se queda donde estaba (81,8 frente a 82).
4. **En la previa las decisiones pesan poco:**
   - con 84 en Europa League, se gana el 53 % decidiendo bien y el 46 % decidiendo mal: solo 7 puntos;
   - la decisión pesa sobre todo en los 6 partidos de la fase inicial;
   - un partido único con prórroga y penaltis se acerca a la moneda al aire, como en cualquier eliminatoria.
5. **Lo que no se ha tocado:** en Liga sigue sin haber decisiones. Las palancas pensadas para eso (G3 y G4) se rechazaron, y este informe no las vuelve a proponer.

## Conclusión

La queja de fondo queda atendida con números:
- **Se pasa más.** El fallo repetido deja de ser lo normal.
- **La influencia es mayor:** decidir bien frente a mal vale entre 16 y 23 puntos con 84.
- **La influencia se ve:** la probabilidad de pasar, el balance de decisiones y el balance europeo del cierre.

**Opciones:**
- **A. Dejarlo así (recomendada).** El roadmap queda cerrado; no hace falta cambiar nada.
- **B. Medir el peso de la decisión en la previa.** Solo si se quiere que también cuente en ese partido. Tocaría el motor europeo en sus eliminatorias (previa, semifinal y final), así que necesitaría permiso y medición.

## Método y limitaciones

- **Script:** `scripts/auditEuropePhase.ts`, que desde este informe también juega la previa y pasa el estilo de cada rival. La tabla de la v0.25.91 solo se reproduce en el commit de aquel informe, porque desde entonces han cambiado el script, las semillas y los rivales.
- **Comparación con la v0.25.91:** esas cifras salen de aquel informe. Entre medias cambiaron las semillas (v0.25.106) y los rivales (v0.25.98 y v0.25.105), así que la comparación mezcla todos los cambios. Es lo que se busca: el antes y el después del roadmap.
- **Odds:** el jugador simulado calcula las odds con 60 muestras; el juego usa 300.
- **Líneas:** el usuario juega con las líneas iguales a su media, como en el informe original.
- **Margen:** con 1.000 torneos por casilla es de unos ±3 puntos.
- **No mide cómo se siente.** Para eso está la prueba de sensaciones de QA del informe original.
