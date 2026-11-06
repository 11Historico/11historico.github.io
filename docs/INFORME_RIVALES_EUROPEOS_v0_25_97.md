# Medias de los rivales europeos (v0.25.97)

Fase 8 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`. El usuario apuntó que algunos rivales europeos tenían medias desproporcionadas. Esta auditoría lo mide. **No cambia el juego.**

Se repite con `npm run audit:european-opponents`; con `--tournaments=N` cambia el número de torneos por casilla. Tarda unos 10 segundos.

## Cómo se eligen hoy (`src/europe/europeanOpponents.ts`)

- Cada competición tiene una lista de clubes: 20 en Champions, 20 en Europa League y 10 en Conference.
- En cada torneo se sortean los rivales y **a cada uno se le sortea una media dentro del rango de la competición:**

| Competición | Rango | Media |
| --- | --- | --- |
| Champions | 82-94 | 88 |
| Europa League | 76-88 | 82 |
| Conference | 70-82 | 76 |

- La semifinal y la final eligen rival del mismo modo.
- Los rivales europeos **no progresan** con las temporadas de carrera.

## Resultados

### 1. La media no depende del club

En 2.000 sorteos, **todos los clubes de una competición tienen la misma media y el mismo rango:**

| Competición | Media de cada club | Mínima y máxima de cada club | Veces que un club supera a Barça y Madrid (91) |
| --- | --- | --- | --- |
| Champions | 87,9-88,2 | 82 y 94 | 19-24 % de sus apariciones |
| Europa League | 81,6-82,3 | 76 y 88 | nunca |
| Conference | 75,8-76,2 | 70 y 82 | nunca |

- **En la Champions,** el Celtic, el Club Brugge y el Red Bull Salzburgo tienen la misma media que el Bayern, el City o el PSG: 88. Uno de cada cinco partidos son más fuertes que el Barça y el Real Madrid.
- **En la Europa League,** el Lech Poznań y el Ferencváros tienen la misma media que el Leverkusen, el Tottenham o la Roma: 82.
- **En la Conference,** el Valletta o el Vaduz pueden salir con 82, por encima de Osasuna (81).

Es lo que el usuario vio como «desproporcionado»: el nombre del club no dice nada de su nivel, y de un torneo a otro el mismo club puede pasar de 76 a 88.

### 2. Los rivales europeos no siguen la progresión de la carrera

Los rivales de LaLiga suben con las temporadas superadas, hasta +3; los europeos, no:

| Temporadas superadas | Bonus LaLiga | 1.º LaLiga | 3.º | Media LaLiga | Último |
| --- | --- | --- | --- | --- | --- |
| 0 | +0 | 91 | 87 | 80,4 | 74 |
| 3 | +1,5 | 92,5 | 88,5 | 81,9 | 75,5 |
| 6 o más | +3 | 94 | 90 | 83,4 | 77 |

**Al empezar la carrera:**
- La Champions (media 88) está entre el Atlético y los dos grandes.
- La Europa League (82) está algo por encima de la media de LaLiga.
- La Conference (76) está casi en el último puesto.

**Tras seis temporadas,** la Europa League queda por debajo de la media de LaLiga (83,4) y la Conference por debajo del último (77). Europa se hace relativamente más fácil con el tiempo, y la Liga, más difícil.

### 3. Algunos clubes salen más que otros

Con 6 rivales de una lista de 20, cada club debería salir en el 40 % de los torneos de Champions y de Europa League. **El VfB Stuttgart sale en el 52 % y el Manchester City, en el 46 %.** En la Conference, que tiene 10 clubes, el Zimbru Chișinău sale en el 83 %, frente al 80 % esperado.

Es un sesgo pequeño del barajado: usa el generador de números del propio módulo y el primer número de cada semilla se parece entre semillas. No cambia la dificultad, pero esos clubes se repiten más.

### 4. El rango pesa poco en la probabilidad de pasar

Probabilidad de pasar la fase de liga sin decidir (planteamiento equilibrado), con 300 torneos por casilla. La columna derecha usa una escala alternativa de ejemplo, que baja el techo de cada competición sin tocar el suelo:

| Competición | Tu rating europeo | Hoy | Escala alternativa |
| --- | --- | --- | --- |
| Champions 82-94 → 82-91 | 84 | 9 % | 11 % |
| | 86 | 12 % | 15 % |
| | 88 | 15 % | 19 % |
| Europa League 76-88 → 76-86 | 84 | 24 % | 28 % |
| | 86 | 32 % | 37 % |
| | 88 | 41 % | 47 % |
| Conference 70-82 → 70-80 | 84 | 53 % | 57 % |
| | 86 | 60 % | 65 % |
| | 88 | 67 % | 70 % |

- **Quitar los rivales «imposibles»** (techo 91 en Champions) sube la probabilidad de pasar solo de 2 a 6 puntos.
- **Lo que más pesa:**
  - **El formato:** pasan 2 de 7.
  - **El nivel medio de los rivales frente a tu rating:** con 84 en Europa League, tu equipo está solo 2 puntos por encima del rival medio.
- **Cuadra con lo medido antes:** `INFORME_EUROPA_E_INFLUENCIA_v0_25_91.md` daba un 23 % para 84 en Europa League sin decidir, y aquí sale un 24 %.

## Conclusiones para la fase 9

1. **Fijar la media por club arregla lo «desproporcionado».** Es un cambio de percepción, más que de dificultad: que el Bayern sea siempre fuerte y el Lech Poznań siempre más flojo, con poca variación por temporada. Hace falta una media para cada uno de los 50 clubes, y son datos de Europa protegidos.
2. **Topar la Champions en 91** quita el caso más chocante: rivales más fuertes que los grandes de LaLiga. Hace la Champions algo más asequible, de 2 a 4 puntos.
3. **Decidir si los rivales europeos progresan con la carrera,** como los de LaLiga. Hoy no lo hacen, y Europa se abarata con los años.
4. **Si se quiere que pasar sea bastante más fácil,** el rango no basta. Habría que tocar el formato (fase 13) o el nivel medio de los rivales, y medirlo aparte.
5. **El sesgo del barajado** se puede corregir sin cambiar la dificultad, aprovechando el mismo cambio.

Ninguno de estos cambios está hecho: son la base para decidir la fase 9, que necesita permiso.

## Método

- **Script:** `scripts/auditEuropeanOpponents.ts`.
  - **Medias:** `pickEuropeanOpponents` con 2.000 semillas por competición, 8 rivales por sorteo: los 6 de la fase y los de semifinal y final.
  - **LaLiga:** `getInitialCareerLeagueRivals` con `applyCareerRivalProgression`.
  - **Probabilidad:** `estimateEuropeanSemifinalChance` (v0.25.95) sobre torneos de `createEuropeanTournamentForQualification`, con 60 simulaciones por torneo, en equilibrado. La escala alternativa reescala linealmente la media de cada rival.
- **Limitaciones:**
  - La probabilidad es sin decidir. Decidiendo bien sube unos 10 puntos en la Europa League (ver el informe v0.25.91).
  - La escala alternativa es solo un ejemplo para medir el peso del rango; no es una propuesta.
