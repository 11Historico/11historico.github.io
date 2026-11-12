# Informe: la ruleta con riesgo elegido (I5), medida

Es la idea I5 de `INFORME_IDEAS_DECISIONES_v0_25_107.md`. El usuario pidió «mide la I5». Es una auditoría: **no cambia el juego.**

## La idea

Antes de girar la ruleta de temporada, eliges el tipo:
- **Prudente:** +0,5, 0 o −0,5 de media, con las probabilidades de premio, nada y castigo de la zona de puntería.
- **A todo o nada:** +1 o −1. La probabilidad de ganar se ajusta a 0,5 + 0,25 × (premio − castigo), para que tenga el mismo valor esperado que la prudente con la misma puntería.

La pregunta es si elegir el riesgo según cómo vaya la temporada es una decisión que cuenta.

## Cómo se ha medido

- **Valor esperado por zona,** calculado directamente con las zonas y los pesos de `src/career/seasonLuckWheel.ts`.
- **Carreras completas** con las funciones del juego (`scripts/auditCareerRunner.ts`):
  - La ruleta sale en los mismos momentos que en el juego: al terminar la jornada 19, o antes si te eliminan de la Copa, siempre hasta la jornada 25 (2/3 de la Liga). Una vez por temporada.
  - El cambio de media se aplica a la media visible hasta final de temporada (`applySeasonLuckWheelRatingDelta`) y después la compresión de carrera, como en `LeagueSimulatorView`.
  - **Puntería supuesta:** centro perfecto 10 %, zona buena 30 %, equilibrada 35 %, exterior 20 % y extremo 5 %.
  - La ruleta tiene su propio azar, fijado por carrera y temporada. Así todas las formas de jugar ven la misma puntería y la misma tirada, y la comparación con «rechazarla» es sobre la misma carrera.
  - 300 carreras por caso: Normal y Fácil × draft «mejor media» y «al azar». Planteamiento y descanso bien decididos, sin cartas.
- **Seis formas de jugarla:**
  1. rechazarla, como en las auditorías de siempre;
  2. la ruleta de hoy, solo con la media (los cambios de jugador o entrenador cuentan 0);
  3. siempre prudente;
  4. siempre a todo o nada;
  5. según la tabla: arriesgar si vas del 8.º para abajo (fuera de Europa) y ser prudente si estás dentro;
  6. al revés que la anterior, para ver si el sentido importa.

**Comprobación del corredor:** con la ruleta rechazada a través del gancho nuevo, las carreras salen idénticas a las de siempre (el script lo comprueba antes de medir).

Reproducible con `npm run audit:wheel-risk` (o `node .audit-dist/auditLuckWheelRisk.js --careers=N`).

## Resultados

### Valor esperado por zona (media visible)

La ruleta de hoy, contando solo la media: un premio vale +0,30 de media (porque la mitad de los premios son cambios de jugador o entrenador) y un castigo, −0,55.

| Zona | Puntería supuesta | Premio / nada / castigo | Hoy (solo media) | Prudente | A todo o nada: gana | A todo o nada |
| --- | --- | --- | --- | --- | --- | --- |
| Centro perfecto | 10 % | 100 / 0 / 0 | +0,30 | +0,50 | 75,0 % | +0,50 |
| Zona buena | 30 % | 50 / 35 / 15 | +0,07 | +0,18 | 58,8 % | +0,18 |
| Zona equilibrada | 35 % | 40 / 40 / 20 | +0,01 | +0,10 | 55,0 % | +0,10 |
| Zona exterior | 20 % | 25 / 45 / 30 | −0,09 | −0,03 | 48,8 % | −0,03 |
| Extremo | 5 % | 10 / 40 / 50 | −0,25 | −0,20 | 40,0 % | −0,20 |

- **Con la puntería supuesta:** hoy +0,02, y prudente y a todo o nada +0,12 de media visible. En la simulación es un 55 % de eso: unas +0,07.
- **La dispersión** es la que cambia: la prudente se mueve ±0,4 y la de a todo o nada, ±1.
- Las dos variantes valen más que la de hoy contando solo la media, porque la de hoy pone la mitad de sus premios en cambios de jugador o entrenador.

### Carreras: media de los 4 casos

| Ruleta | Temporadas superadas | Pasa la 1.ª | Puntos en la 1.ª | Títulos por temporada | Puntuación | Frente a rechazarla |
| --- | --- | --- | --- | --- | --- | --- |
| Rechazarla (hoy) | 2,19 | 75,2 % | 58,4 | 0,38 | 28,0 | - |
| La de hoy, solo la media | 2,16 | 75,0 % | 58,3 | 0,36 | 27,5 | −0,5 |
| Siempre prudente | 2,22 | 75,3 % | 58,3 | 0,37 | 28,3 | +0,3 |
| Siempre a todo o nada | 2,25 | 75,8 % | 58,5 | 0,37 | 28,6 | +0,6 |
| Según la tabla: arriesga fuera de Europa | 2,23 | 75,4 % | 58,3 | 0,38 | 28,4 | +0,4 |
| Al revés: arriesga dentro de Europa | 2,29 | 75,7 % | 58,5 | 0,37 | 29,3 | +1,3 |

### Carreras: frente a rechazarla, en la misma carrera

Diferencia de puntuación con su margen al 95 %.

| Ruleta | Normal · mejor media | Normal · al azar | Fácil · mejor media | Fácil · al azar |
| --- | --- | --- | --- | --- |
| La de hoy, solo la media | −1,6 ±2,0 | −0,8 ±0,8 | +1,3 ±3,8 | −1,0 ±1,9 |
| Siempre prudente | −1,7 ±2,1 | −0,7 ±1,0 | +3,8 ±4,8 | −0,3 ±1,8 |
| Siempre a todo o nada | −0,8 ±3,1 | 0,0 ±1,6 | +4,2 ±5,2 | −0,8 ±3,0 |
| Según la tabla | −1,1 ±2,5 | +0,5 ±1,3 | +3,2 ±4,8 | −0,9 ±2,1 |
| Al revés | −0,7 ±3,0 | −0,9 ±1,4 | +6,9 ±5,5 | −0,1 ±2,9 |

Las tablas de cada caso, con los giros por temporada y la media obtenida por giro, salen en la consola de `npm run audit:wheel-risk`.

- **La ruleta sale todas las temporadas.** Una de cada cuatro veces, al caer en la Copa antes de la jornada 19.
- **La media obtenida por giro** cuadra con el cálculo: unas +0,1 en las variantes y +0,02 en la de hoy.
- **Rechazadas por la regla de plausibilidad del ranking:** 0 de 7.200.

## Conclusiones

1. **Ninguna forma de jugarla se distingue de rechazarla.** Todas las diferencias caben en el margen de error. Las temporadas superadas van de 2,16 a 2,29, la 1.ª temporada se pasa entre el 75,0 y el 75,8 %, y los puntos de la 1.ª, entre 58,3 y 58,5.
2. **Elegir el riesgo según la tabla no sirve de nada.** «Arriesga fuera de Europa» y «al revés» dan lo mismo (+0,4 y +1,3, dentro del margen). Así que **no hay una respuesta buena que el jugador pueda aprender:** la decisión no cuenta en el resultado.
3. **El motivo es el tamaño.** ±1 de media visible son ±0,55 en la simulación, durante media Liga como mucho: unos ±0,3 puntos esperados en la temporada. Ni el riesgo más alto mueve un puesto.
4. **No infla el ranking.** El valor esperado es el mismo, y las carreras no se mueven.
5. **Es el mismo resultado que I2 e I3:** una decisión con tope pequeño no cambia una Liga de 38 jornadas.

**Lo que sí daría:** la sensación de decidir, un momento de tensión al girar y una variante más llamativa (+1 o −1). Pero es una decisión que el jugador no puede aprender a tomar bien, porque no hay nada que aprender.

## Opciones

- **A. Dejarla como está.** La ruleta de hoy sigue igual; I5 se descarta como decisión.
- **B. Hacerla solo por la sensación.** Construir el selector prudente / a todo o nada, sabiendo que no cambia las carreras. Toca lógica de recompensas (`seasonLuckWheel.ts`) y `SeasonLuckWheelModal.tsx`, así que necesita permiso.
- **C. Un tope mayor (por ejemplo, ±2 o ±3)** para que la decisión se note. Eso sí puede mover el ranking y cambiar el equilibrio de la ruleta, así que habría que medirlo antes.

Recomiendo **A**: la medición dice que la idea no cumple lo que prometía, que era una decisión que dependa de tu temporada.

## Limitaciones

- **La puntería es un supuesto.** Con mejor puntería, las dos variantes valen algo más, pero siguen siendo iguales entre sí.
- **Solo la media:** los cambios de jugador o entrenador de la ruleta de hoy no se simulan (el once de la auditoría no cambia). Por eso la fila «la de hoy» infravalora la ruleta real.
- **Una sola regla situacional** (dentro o fuera de Europa). Otras reglas, como según los puntos que faltan para salvarse, no se han probado, pero con un efecto de ±0,3 puntos tampoco tendrían margen.
- **Sin cartas,** para que la ruleta sea lo único que cambia.

## Archivos

- `scripts/auditCareerRunner.ts`: el gancho opcional `wheel` en `playSeason` y `playCareer`. Sin el gancho, nada cambia.
- `scripts/auditLuckWheelRisk.ts`: la auditoría nueva.
- `package.json`: `audit:wheel-risk`.
