# Europa y la sensación de influir (v0.25.91)

Un usuario terminó una carrera de cuatro temporadas superadas sin pasar ni una vez de la fase inicial europea. Dijo: «Sigo teniendo la sensación de no poder influir en ningún resultado, es como si todo fuera al azar y lo único que yo pudiera hacer es el draft inicial».

Este informe:
- explica por qué cuesta tanto pasar en Europa, con medición;
- propone mejoras desde cinco roles: diseño de juego, interfaz y experiencia de usuario, desarrollo frontend, QA y diseño gráfico 2D.

**No cambia el juego.** Se repite con `npm run audit:europe`.

## 1. Por qué no pasas de la fase inicial

### Cómo funciona hoy

- **Fase inicial** (`src/europe/europeanTournament.ts`):
  - Es una liguilla de 7 equipos: tú y 6 rivales. Cada uno juega 6 partidos, todos contra todos a un partido.
  - Pasan a semifinales los **2 primeros**.
  - Los partidos entre rivales se simulan aparte, y tú no influyes en ellos.
- **Tu rating en Europa:**
  - Es el rating comprimido de la carrera, el mismo que en Liga: un once de 88-89 visible juega con 84-85.
  - Si el entrenador es especialista en Europa, suma +1.
- **Los rivales** (`src/europe/europeanOpponents.ts`):
  - Su rating sale al azar en cada torneo, dentro de un rango por competición:

| Competición | Rango de rivales | Media |
| --- | --- | --- |
| Champions | 82-94 | 88 |
| Europa League | 76-88 | 82 |
| Conference | 70-82 | 76 |

### Medición

Se jugaron 1.000 fases iniciales por casilla, con el motor y los rivales del juego.
- «Decide bien» elige el planteamiento con más puntos esperados y, en el descanso, arriesga si va perdiendo y cierra si va ganando.
- «Decide mal» hace lo contrario.
- «No decide» deja el planteamiento equilibrado y no toca nada en el descanso.

Probabilidad de pasar a semifinales:

| Tu rating de simulación | Champions (bien / no decide / mal) | Europa League | Conference |
| --- | --- | --- | --- |
| 82 | 9 / 8 / 3 % | 26 / 19 / 12 % | 57 / 44 / 32 % |
| **84** | **11 / 10 / 5 %** | **33 / 23 / 16 %** | 64 / 52 / 39 % |
| 86 | 16 / 14 / 7 % | 45 / 33 / 23 % | 72 / 61 / 45 % |
| 88 | 20 / 17 / 10 % | 53 / 41 / 29 % | 78 / 67 / 49 % |
| 90 | 28 / 23 / 14 % | 62 / 49 / 35 % | 83 / 71 / 53 % |

Las tablas completas, con posición y puntos medios, se obtienen con el script.

### Diagnóstico

1. **El formato es exigente.** Pasan 2 de 7 en 6 partidos. Con siete equipos iguales, cada uno pasaría el 29 % de las veces.
2. **Tus rivales europeos no están en la escala de tu equipo:**
   - A ti se te comprime (88 → 84).
   - En la Europa League, el rival medio (82) está un poco por debajo de ti.
   - En la Champions, el rival medio (88) es más fuerte que el Atlético (87), y el más fuerte (94) supera al Barcelona y al Real Madrid (91). Con 84, pasar de la fase de Champions es un 11 % decidiendo bien.
3. **Con tu equipo, no pasar tres veces seguidas no es raro.** En Europa League, con 84 y decidiendo bien, pasas un 33 % de las veces, así que fallar tres seguidas ocurre alrededor de un 30 %. Además, quien no decide tiene el 23 %.
4. **Los ratings no dependen del club:**
   - Se sortean de nuevo en cada torneo, así que el Lech Poznań puede tener 88 y el Leverkusen 76. Es lo que se apuntó como «medias desproporcionadas».
   - Al jugador le parece injusto y no le deja planificar: el nombre no dice nada.
5. **Los rivales europeos tienen las seis líneas iguales:**
   - El duelo de líneas («tu ataque contra su defensa») no aporta nada en Europa.
   - El planteamiento solo responde a «es más fuerte o más débil».

### Tus decisiones sí cuentan, pero no se ven

En Europa League con 84, decidir bien frente a mal duplica la probabilidad de pasar: del 16 % al 33 %. Es la mayor influencia de las decisiones que hemos medido en el juego. Tiene dos problemas:
- **El azar la tapa:** son seis partidos por temporada, y el resultado de uno no deja ver si la decisión fue buena.
- **El juego no muestra lo que has influido:** no dice cuánto cambió tu probabilidad con tu planteamiento ni con tu decisión del descanso.

### La causa de fondo: en Liga no decides nada

Liga son 38 de los 40-48 partidos de una temporada, y en ellos no hay ninguna decisión: el planteamiento y el descanso solo existen en Copa, Europa y Supercopa.
- La auditoría `INFORME_PESO_DECISIONES_v0_25_87.md` midió que dar más peso a esas decisiones en los partidos grandes de Liga infla el ranking y acaba en «defiende siempre».
- Hace falta otra palanca: decisiones con coste, que no hagan la carrera más fácil en conjunto.

## 2. Propuestas por rol

Ninguna está hecha. Las que tocan el equilibrio se miden antes con el método de siempre.

### Diseño de juego

| # | Propuesta | Qué resuelve | ¿Toca el equilibrio? |
| --- | --- | --- | --- |
| G1 | **Rivales europeos en la escala de la carrera y fijos por club.** Cada club tiene un nivel fijo dentro de su competición: el Bayern siempre fuerte y el Lech Poznań más flojo, con algo de variación por temporada. La Champions no pasa del nivel de Barcelona y Real Madrid. | Rivales legibles y sin sorpresas absurdas. La Champions deja de ser casi imposible. | Sí, hay que medirlo. Los datos UEFA están protegidos y necesitan permiso. |
| G2 | **Rivales con estilo:** a cada club europeo se le da un perfil por líneas (por ejemplo, «ataca mucho, defiende poco») que se ve en la previa. | El planteamiento y el duelo de líneas pasan a depender del rival, no solo de su media. La mejor jugada cambia de un partido a otro: nada de «defiende siempre». | Poco, si la media se mantiene. Se mide. |
| G3 | **Prioridad de temporada (suma cero):** antes de empezar eliges Liga, Copa o Europa. Sumas +1 en la elegida y −0,5 en las otras. | Una decisión con coste real, sin hacer la carrera más fácil en conjunto. | Sí, aunque está pensado para quedar neutro. Se mide. |
| G4 | **Rotar antes de una noche europea:** en la jornada de Liga anterior puedes rotar (−1 en ese partido de Liga, +1 en el europeo). | Lleva decisiones a la Liga sin inflarla. Cada semana europea pide pensar. | Sí, se mide. |
| G5 | **Formato:** los 2 primeros a semifinales y el 3.º y 4.º a una eliminatoria previa a partido único. | Más partidos con algo en juego y menos «todo o nada» tras seis partidos. | Sí: más títulos europeos y más ranking. Se mide. Va el último. |

Orden recomendado: primero G1 y G2 (resuelven la injusticia y dan sentido a la decisión), luego G3 o G4 (llevan decisiones a la Liga) y G5 al final.

### Interfaz y experiencia de usuario

| # | Propuesta | Para qué |
| --- | --- | --- |
| U1 | **Probabilidad de pasar** en la tabla europea, actualizada cada jornada. Con ella, qué necesitas: «Con 4 puntos en 2 partidos pasas casi seguro». | Saber cómo vas y qué te juegas, como el rango esperado en Liga (v0.25.88). |
| U2 | **Zona de semifinales marcada** en la tabla (los 2 primeros). La regla ya aparece encima, pero las filas no se distinguen. | Ver de un vistazo si estás dentro o fuera. |
| U3 | **«Tu decisión» tras cada partido:** por ejemplo, «El planteamiento defensivo subió tu probabilidad de puntuar del 48 % al 57 %», o «Arriesgar en el descanso te dio un gol». | Hacer visible tu influencia aunque el resultado salga mal. |
| U4 | **Fuerza en la escala de los rivales** («Tu fuerza 84 · rival 88»), en vez de 85 y 88 sin contexto. Ya está apuntada como opción 1, con las líneas. | Entender por qué un rival de nombre modesto es favorito. |
| U5 | **Aviso para seguir la Liga tras Copa o Europa.** Ya está apuntado. | Menos confusión entre partidos. |
| U6 | **Balance europeo al cerrar la temporada:** «Con tu equipo, lo normal era pasar 1 de cada 3 veces». | Poner expectativas: perder por azar no se siente igual que perder sin saber por qué. |

### Desarrollo frontend

- **U1 reutiliza el patrón del rango esperado** (`src/simulation/expectedLeagueRange.ts`):
  - Simula los partidos que faltan con semillas propias, sin `Math.random`, en un `setTimeout` para no bloquear la pantalla.
  - Bastan unas 200 simulaciones de los partidos restantes, que es poco trabajo. La función pura iría en `src/europe/`.
- **U3 sale de datos que ya existen:** el partido guarda `approachEffect` y `halfTimeEffect`. Falta comparar con la alternativa usando la misma semilla, como ya se hace en el descanso.
- **G2 cambia el rival:** que deje de tener las líneas iguales (`buildUniformRivalTeam`) para tener un perfil. La interfaz del duelo de líneas ya existe; hay que quitar `rivalHasOnlyOverall`.
- **Sin dependencias nuevas.** Los cambios se quedan en `src/europe/` y en `LeagueSimulatorView`.

### QA / Tester

- **Auditoría nueva:** `npm run audit:europe` (`scripts/auditEuropePhase.ts`). Cualquier cambio de G1-G5 se mide con ella y con `audit:rating` o `audit:league`, para ver su efecto en la carrera y el ranking.
- **Tests unitarios por añadir:**
  - el desempate de la tabla europea;
  - la regla de los 2 primeros;
  - que la probabilidad de pasar (U1) no consuma `Math.random`, como en el test del rango esperado.
- **Prueba e2e:** una fase europea completa hasta semifinales con una partida guardada y semilla fija. Hoy las pruebas comprueban la tabla y la regla, pero no el paso a semifinales.
- **Prueba de sensaciones,** con una lista corta tras cada cambio:
  - ¿Entiendes por qué ganaste o perdiste?
  - ¿Sabes qué necesitas en el siguiente partido?
  - ¿Cambiarías tu decisión?

### Diseño gráfico 2D

Son clubes reales sin escudos ni equipaciones, así que todo es genérico, sin marcas de la UEFA ni de LaLiga.

- **Escudos genéricos por país:** un escudo con los colores de la bandera y las iniciales del club. Distingue rivales de un vistazo sin usar escudos reales.
- **Noches europeas con estética propia:** azul noche, focos de estadio y un patrón de estrellas genérico, sin el balón de estrellas oficial. Se nota que es otra competición.
- **Tabla europea con zonas de color:** verde para las semifinales y gris para eliminado. Siempre con texto además del color, por accesibilidad.
- **Camino a la final:** un cuadro pequeño (fase, semifinal, final) como el de la Copa, para ver cuánto falta.
- **Duelo de líneas visual:** barras enfrentadas (tu ataque contra su defensa, tu defensa contra su ataque) en la previa y en el partido. Con G2 se verían los estilos.
- **Barra de dominio y momentos del partido:** una línea de tiempo con los goles y la decisión del descanso marcados. Así se ve dónde influiste.
- **Vitrina del palmarés:** copas genéricas por competición en una estantería, en vez de solo números.
- **Ruleta:** el centro perfecto con un destello propio al acertar, para premiar la habilidad.

## 3. Qué propongo hacer primero

1. **Hacer visible la influencia** (U1, U2, U3 y U6): solo visual, sin tocar el equilibrio. Es lo que más ataca la sensación de «todo es azar».
2. **Medir G1 y G2:** rivales europeos en la escala de la carrera, fijos por club y con estilo. Necesita permiso, porque toca los datos UEFA.
3. **Después, medir G3 o G4,** para llevar decisiones con coste a la Liga.

## Método y limitaciones

- **Script:** `scripts/auditEuropePhase.ts`. Juega solo la fase inicial, con `createEuropeanTournamentForQualification`, `simulateEuropeanMatch` y la tabla del juego.
- **Odds:** para elegir el planteamiento, el jugador simulado calcula las odds con 60 muestras; el juego usa 300.
- **Líneas:** el usuario juega con las líneas iguales a su media. En el juego juega con sus líneas reales desplazadas a esa media, que es casi lo mismo contra rivales con las líneas iguales.
- **Margen:** con 1.000 torneos por casilla es de unos ±3 puntos porcentuales.
- **No mide cómo se siente.** Para eso está la prueba de sensaciones de QA.
