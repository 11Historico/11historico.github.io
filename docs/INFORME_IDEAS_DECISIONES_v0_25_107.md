# Ideas para decidir durante la temporada (v0.25.107)

El usuario preguntó si hay alguna acción durante la temporada que afecte de verdad a los resultados, y después pidió buscar ideas. Este informe reúne lo que ya se sabe, descarta lo que no funcionaría y propone ideas nuevas con cómo medir cada una.

**No cambia el juego.** No hay medición nueva: las cifras salen de informes anteriores, y cada idea dice cómo se mediría.

## 1. Lo que hay hoy

| Acción | Dónde | Cuánto pesa |
| --- | --- | --- |
| Planteamiento (equilibrado, ofensivo, defensivo) | Copa, Europa, Supercopa | Poco solo; con el descanso, mucho en Europa |
| Descanso (seguir, arriesgar, cerrar) | Copa, Europa | Es la decisión que más pesa |
| Ruleta (jugar o no, y dónde paras) | Una vez por temporada, si aparece | Centro perfecto: premio seguro; extremo: 50 % de castigo |
| Nada | Los 38 partidos de Liga | — |

- **En Europa, con 84 y en la Europa League,** se llega a semifinales el 51 % de las veces decidiendo bien, el 39 % sin decidir y el 30 % decidiendo mal (`INFORME_CIERRE_EUROPA_v0_25_107.md`).
- **En la carrera completa casi no se nota:** 2,24 temporadas superadas decidiendo bien en Copa y Europa frente a 2,13 sin decidir (`INFORME_DECISIONES_LIGA_v0_25_80.md`). Lo que te mantiene vivo es la Liga, y en ella no se decide.

## 2. Lo que ya se midió y no funciona

- **Decidir en todos los partidos de Liga:** son 38 paradas por temporada y dobla la puntuación (v0.25.80).
- **Plan de temporada o tramo final:** atacar es casi siempre lo mejor, así que no es una decisión (v0.25.80).
- **Planteamiento y descanso en los partidos grandes de Liga:** mueven menos de 1 puesto (v0.25.84). Con más peso se infla el ranking hasta un 80 % y la mejor jugada acaba siendo «en los grandes, defiende» (v0.25.87).
- **Prioridad de temporada y rotación:** rechazadas por el usuario (fase 12). Tampoco se proponen variantes con bonus o malus de media entre competiciones.

**Dos causas de fondo:**
1. **En el motor, una decisión vale poco por partido:** unos 0,2 puntos entre acertar y fallar (v0.25.84). En 38 jornadas eso no mueve la tabla.
2. **El planteamiento solo mira la diferencia de medias** (`getApproachGoalMultipliers` en `src/simulation/matchEngine.ts`). Por eso la respuesta correcta depende solo de si el rival es mejor o peor, y acaba en una regla fija.

## 3. Qué tiene que cumplir una buena idea

1. **Pesa de verdad:** se nota fuera del margen de las auditorías.
2. **No tiene respuesta fija:** la mejor opción cambia según el rival, el marcador o la situación de la temporada.
3. **No infla el ranking**, o tiene un tope fácil de ajustar.
4. **Pocas paradas por temporada:** el botón «Simular» sigue siendo útil.
5. **Respeta lo decidido:** nada entre competiciones, sin vitrina, y el orden de los partidos no se toca.

## 4. Ideas

### I1. Probabilidades en el descanso, solo visual

- **Qué:** al parar en el descanso, cada opción enseña lo que te da: «Arriesgar: ganas 34 %, empatas 30 %, pierdes 36 %». El planteamiento ya enseña algo parecido en la previa.
- **Por qué:** una persona decide entre «bien» y «al azar». Si ve lo que vale cada opción, se acerca a «bien», que es la influencia que el juego ya da y hoy no se ve. Con 84 en la Europa League, de «no decide» a «decide bien» van 12 puntos de semifinales.
- **Cuidado:** no puede delatar el resultado. El partido ya está simulado, así que las probabilidades tienen que salir del marcador al descanso y de los goles esperados, nunca del resultado guardado. Es la regla de la v0.25.78: «nada delata el resultado».
- **Archivos:** `MatchHalfTimeControl.tsx`, más una función pura de odds en `src/simulation/matchEngine.ts` y otra en `src/europe/europeanMatchEngine.ts`, con semillas fijas y sin `Math.random`.
- **Equilibrio:** no cambia el motor. Las auditorías ya suponen un jugador que decide bien, así que las cifras de referencia no se mueven.
- **Permiso:** no hace falta.

### I2. El planteamiento lee las líneas del rival (la opción D de la fase 10)

- **Qué:** atacar rinde más contra una defensa floja y cerrarse rinde más contra un ataque fuerte, en vez de depender solo de la media.
  - Los rivales de Liga ya tienen perfiles distintos: el Celta tiene 79 de ataque y 76 de defensa, y el Atlético 84 y 88.
  - Los europeos tienen estilo desde la v0.25.105.
- **Por qué:** es lo único que rompe la respuesta fija. «Defiende en los grandes» deja de valer, porque contra un grande que defiende mal compensa atacar.
- **Archivos:** `getApproachGoalMultipliers` en `matchEngine.ts`, y su equivalente europeo.
- **Riesgo:** toca el simulador de todas las competiciones.
- **Cómo medir:**
  - `audit:approach`: qué parte de los partidos tiene cada planteamiento como el mejor; el objetivo es que ninguno pase del 60 %;
  - `audit:rating` y `audit:europe`, para ver el efecto en las carreras y en Europa.
- **Permiso:** sí, porque es el simulador de partidos.
- **Nota:** por sí sola no añade decisiones en Liga, pero hace que valga la pena cualquier decisión que se añada después.
- **Medida:** no cumple el objetivo. Las líneas se distinguen demasiado poco y la mejor opción sigue saliendo de la diferencia de nivel (`INFORME_PLANTEAMIENTO_LINEAS_v0_25_107.md`).

La I1 la descartó el usuario («no me gusta»).

### I3. Comodines de descanso en Liga

- **Qué:** tienes, por ejemplo, 3 comodines por temporada.
  - Cuando un partido de Liga llega al descanso empatado o perdiendo y te queda alguno, la simulación se para.
  - Decides si gastarlo (arriesgar o cerrar) o guardarlo para otro partido.
  - Si no quedan comodines, la Liga no se para. También se puede desactivar.
- **Por qué:**
  - Es una decisión de verdad: gastar ahora o guardar depende del rival, de la jornada y de cómo vas en la tabla.
  - El número de comodines es el tope del efecto. Con 3, el ranking no puede inflarse como con 38 decisiones.
- **Cuánto se espera:** poco en la tabla, del orden de medio punto por temporada si cada uso vale lo de la v0.25.84. Usarlo solo cuando vas perdiendo debería valer más por uso. Hay que medirlo.
- **Archivos:**
  - `LeagueSimulatorView.tsx`: la pausa, como la de la Copa;
  - `simulateNextUserLeagueMatch` en `leagueSimulator.ts`: el resultado al descanso;
  - `applyHalfTimeChoice`, que ya existe.
- **Cómo medir:** `audit:league` con un jugador «comodín N», para N = 2, 3 y 5, comparado con el de hoy en temporadas superadas, puntuación y plausibilidad.
- **Permiso:** sí. Reabre lo decidido en la v0.25.78, cuando la Liga se quedó sin descanso, y toca el equilibrio de la carrera.
- **Medida:** cada comodín vale unas 0,1 puntos y guardar no rinde más que gastar enseguida, así que no hay decisión de «cuándo» (`INFORME_COMODINES_DESCANSO_v0_25_107.md`).

### I4. Partidos marcados en Liga

- **Qué:** antes de la temporada, o hasta la jornada anterior, marcas en el calendario hasta 3 partidos de Liga. Solo esos se paran para el planteamiento y el descanso.
- **Por qué:**
  - Eliges dónde te la juegas: el derbi, el rival directo o la última jornada.
  - Las paradas las decides tú, y el número es el tope.
- **Diferencia con I3:** en I4 decides antes de jugar, y en I3 en el momento, con el marcador delante. I3 tiene más de decisión; I4 se planifica mejor.
- **Cuánto se espera:** menos que los partidos grandes (7-12 por temporada), que movían de 2,24 a 2,69 temporadas. Con 3 seguramente quedará dentro del margen salvo que vaya con I2.
- **Cómo medir y permiso:** como I3.

### I5. Ruleta con riesgo elegido

- **Qué:** antes de girar eliges el tipo de ruleta.
  - **Prudente:** premios y castigos pequeños, de +0,5, 0 y −0,5.
  - **A todo o nada:** de +1 o un cambio de jugador, contra −1.
  - Con la misma puntería, las dos tienen el mismo valor esperado.
- **Por qué:** es una decisión que depende de tu temporada. Si te falta poco para cumplir el objetivo, juegas prudente; si vas mal, arriesgas. No infla nada, porque el valor esperado es el mismo.
- **Archivos:** `src/career/seasonLuckWheel.ts` (los segmentos y pesos) y `SeasonLuckWheelModal.tsx`.
- **Cómo medir:**
  - el valor esperado por zona, calculado directamente;
  - `audit:rating`, para comprobar que las carreras no se mueven.
- **Permiso:** sí, porque es lógica de recompensas.

### Descartadas por los datos

| Idea | Por qué no |
| --- | --- |
| Tanda de penaltis jugada (elegir dirección o lanzadores) | Contra una portería al azar, adivinar no cambia la probabilidad: da sensación de control, pero no influencia. Si cuenta el orden de los lanzadores, la respuesta es fija («el mejor, primero»). |
| Cambio de sistema a mitad de temporada | Mismos jugadores con otras líneas. El reparto de las líneas apenas mueve resultados (v0.25.77 y v0.25.80). Solo tendría sentido después de I2. |
| Mercado de invierno con la misma media | Misma razón que el cambio de sistema, y además toca las plantillas. |
| Objetivo de temporada elegido (más difícil a cambio de más puntuación) | No cambia ningún partido. Toca las reglas de la carrera y la fórmula del ranking. |

## 5. Qué propongo

1. **I1, probabilidades en el descanso.** Es solo visual y no necesita permiso. Hace que lo que ya decides se pueda decidir bien.
2. **Medir I2,** el planteamiento que lee las líneas. Necesita permiso. Es la base para que cualquier decisión deje de tener una respuesta fija.
3. **Elegir el tipo de decisión en Liga,** entre I3 (comodines) e I4 (partidos marcados), y medirla después de I2. Es una decisión del usuario: la memoria del proyecto pide preguntar qué tipo de decisión gusta antes de retomar las decisiones en Liga.
4. **I5, la ruleta con riesgo,** cuando se quiera. Es independiente de las demás.

**Lo que hay que esperar:** en una Liga de 38 jornadas, ninguna decisión con tope moverá muchos puestos sin inflar el ranking. Lo realista es esto:
- decisiones que se entienden (I1);
- decisiones que no tienen respuesta fija (I2);
- unos pocos momentos de Liga en los que tu decisión cuenta y lo ves (I3 o I4).

## Limitaciones

- **Sin medición nueva:** los efectos esperados salen de los informes v0.25.80, v0.25.84, v0.25.87 y del cierre de Europa. Cada idea se mediría antes de construirla.
- **No mide cómo se siente:** para eso está la prueba de sensaciones de QA del informe v0.25.91.
