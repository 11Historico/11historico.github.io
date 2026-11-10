# Comodines de descanso en Liga (idea I3, v0.25.107)

El usuario pidió «mide la I3», del informe `INFORME_IDEAS_DECISIONES_v0_25_107.md`.

La idea:
- tienes N comodines por temporada;
- cuando un partido de Liga llega al descanso empatado o perdiendo y te queda alguno, la simulación se para;
- decides si gastarlo (arriesgar o cerrar) o guardarlo.

Se esperaba que gastar ahora o guardar fuera una decisión de verdad y que el número de comodines pusiera tope al efecto.

**No cambia el juego.** Los comodines solo existen dentro de la auditoría.

## Resultado en una frase

**Con 2 o 3 comodines el efecto no se distingue del azar. Con 5 se nota poco: un punto por temporada.** Además, guardar no rinde más que gastar enseguida, así que no hay decisión de «cuándo». Lo único que cuenta es arriesgar si pierdes y cerrar si ganas, que es la regla fija que ya existe.

## Método

- **Script:** `npm run audit:league`, ampliado con los jugadores «Comodín N» en `scripts/auditLeagueDecisions.ts`.
- **Carreras:** 300 por caso, con las funciones reales del juego.
- **Casos:**
  - dificultad normal y fácil;
  - draft de mejor media y al azar.
- **Copa y Europa:** decide bien en todos los casos, como el jugador de hoy.
- **Comodines:** N = 2, 3 y 5 por temporada; se recargan cada temporada.
- **La parada:** solo si al descanso vas empatando o perdiendo y te queda algún comodín. Ganando, no se para.
- **Techo:** «sin tope» se para en todos esos descansos.

**Formas de gastar el comodín:**

| Jugador | Qué hace en cada parada |
| --- | --- |
| Gasta en cuanto puede | Perdiendo, arriesga. Empatando, arriesga si eres más fuerte y cierra si eres más débil. |
| Solo si pierde | Perdiendo, arriesga. Empatando, lo guarda. |
| Solo si pierde contra un grande | Arriesga solo si pierde contra un rival de su nivel o mejor; si no, lo guarda. |
| Al azar | Elige al azar entre guardar, arriesgar y cerrar. |
| Decide mal | Perdiendo, cierra. Empatando, hace lo contrario de lo que conviene. |

Las cifras son la media de los cuatro casos, comparada con el jugador de hoy, que no decide nada en Liga. Las tablas completas salen del script.

**El margen:** en cada caso, ±0,2 temporadas y ±0,9 puntos. En la media de los cuatro, más o menos la mitad.

## Resultados

| Jugador | Paradas por temporada | Comodines gastados | Temporadas superadas | Puntos en la 1.ª temporada | Puntuación |
| --- | --- | --- | --- | --- | --- |
| **2 comodines:** gasta en cuanto puede | 2 | 2 | +0,04 | +0,2 | −1 % |
| **2:** solo si pierde | 7 | 2 | +0,04 | +0,1 | −2 % |
| **2:** decide mal | 2 | 2 | 0,00 | −0,1 | −3 % |
| **3 comodines:** gasta en cuanto puede | 3 | 3 | +0,12 | +0,3 | +1 % |
| **3:** solo si pierde | 10 | 3 | +0,09 | +0,4 | +1 % |
| **3:** solo si pierde contra un grande | 22 | 2,2 | 0,00 | +0,6 | −2 % |
| **3:** al azar | 4,6 | 3 | −0,05 | +0,3 | −4 % |
| **3:** decide mal | 3 | 3 | −0,10 | −0,1 | −6 % |
| **5 comodines:** gasta en cuanto puede | 5 | 5 | +0,22 | +1,1 | +7 % |
| **5:** solo si pierde | 16,5 | 4,9 | +0,21 | +1,1 | +6 % |
| **5:** solo si pierde contra un grande | 26 | 2,6 | +0,07 | +0,5 | 0 % |
| **5:** al azar | 7,6 | 5 | +0,04 | +0,6 | 0 % |
| **5:** decide mal | 5 | 5 | −0,17 | −0,3 | −11 % |
| **Sin tope:** gasta en cuanto puede | 27 | 27 | +1,32 | +3,3 | +53 % |
| **Sin tope:** solo si pierde | 27 | 8 | +0,32 | +1,3 | +10 % |

Las paradas son de dificultad normal con el draft de mejor media; en los otros casos salen parecidas.

Ninguna carrera queda rechazada por la regla de plausibilidad del ranking.

## Lo que dicen los datos

1. **Cada comodín vale una décima de punto.**
   - Sin tope y gastando siempre: 27 usos dan 3,3 puntos.
   - Solo cuando vas perdiendo: 8 usos dan 1,3 puntos.
   - En los dos casos sale a unas 0,11 puntos por uso.
   - Con 3 comodines son unas 0,3 puntos por temporada, menos de lo que cambia la tabla de una temporada a otra.
2. **Guardar no compensa.**
   - «Solo si pierde» rinde lo mismo que «gasta en cuanto puede» (+0,21 frente a +0,22 temporadas con 5), pero se para el triple de veces.
   - Guardar para los grandes rinde menos: al descanso vas perdiendo contra ellos menos veces de lo que parece, y los comodines se quedan sin usar.
   - La mejor jugada es gastarlos en cuanto se pueda. Eso es una regla fija, no una decisión.
3. **Lo que sí cuenta es arriesgar o cerrar.** Con 5 comodines, de decidir bien a decidir mal hay unas 0,4 temporadas. Pero es la regla de siempre: arriesga si pierdes y cierra si ganas.
4. **El tope funciona.** Con 2-5 comodines la puntuación no se infla: como mucho +7 %, frente a +53 % sin tope. Ese +53 % es lo mismo que pasaba con decidir en todos los partidos (v0.25.80).
5. **Las paradas cuestan.** Si quieres guardar comodines, la Liga se para en 10-26 descansos por temporada. Va contra el criterio de pocas paradas: el botón «Simular» deja de servir.

## Qué propongo

- **Descartar la I3.** Sus tres objetivos quedan así:

  | Objetivo | Resultado |
  | --- | --- |
  | Pesar de verdad | Con 2-3 comodines no pesa: el efecto queda dentro del margen. |
  | No tener respuesta fija | Sí la tiene: gastar en cuanto puedas. |
  | Pocas paradas | Solo se cumple si nunca guardas. |

  Lo único que se cumple es no inflar el ranking.
- **La I4 (partidos marcados) seguramente sale igual.** Usa las mismas piezas: el planteamiento con su regla fija «ataca si eres favorito» (`INFORME_PLANTEAMIENTO_LINEAS_v0_25_107.md`) y el descanso. Además, con 3 partidos tendría menos usos que 3 comodines. No merece la pena medirla salvo que el usuario lo pida.
- **Lo que queda es la I5,** la ruleta con riesgo elegido. No depende del motor del partido, y la decisión (prudente o a todo o nada según cómo vas) no tiene respuesta fija si el valor esperado es el mismo.
- **La conclusión de fondo:** en este motor, una decisión de partido vale unas 0,1-0,2 puntos. Ninguna decisión de Liga con tope moverá la temporada de forma visible sin inflar el ranking. La Liga seguirá siendo el reflejo del draft.

## Limitaciones

- **El jugador gasta con reglas simples.** No mira la tabla: no guarda el comodín para cuando se juega el descenso o el objetivo en las últimas jornadas. Una persona podría sacar algo más guardándolos para el final, pero cada uso sigue valiendo una décima de punto.
- **El azar de la carrera:** cambiar un resultado de Liga mueve las tiradas de todo lo que viene después. Por eso «decide mal» con 2 comodines puede salir igual o mejor que hoy en algún caso suelto. Las conclusiones salen de la media de los cuatro casos y del techo «sin tope».
- **No mide cómo se siente.** Que la Liga se pare unas pocas veces podría gustar aunque pese poco; eso lo decide el usuario.
