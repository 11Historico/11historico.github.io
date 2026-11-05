# Roadmap de mejoras (desde v0.25.91)

Reúne en un solo plan lo que el usuario fue apuntando durante su carrera de prueba (temporadas 2025/26 a 2029/30) y las propuestas del informe `docs/INFORME_EUROPA_E_INFLUENCIA_v0_25_91.md`.

**Objetivo:**
- que el jugador entienda lo que pasa;
- que vea su influencia;
- que tenga decisiones con peso;
- todo sin romper el equilibrio ni el ranking.

Cada fase es un PR con su versión, changelog y documento de fase, con el flujo del proyecto:
1. Rama y PR.
2. CI en verde.
3. Fusión cuando la pidas, y etiqueta solo si la pides.

Las fases que tocan el equilibrio van primero en un commit local con números, y el PR se abre solo con «abre el PR».

**Bloqueos:**
- **[AUTO]:** lo puedo hacer yo con las pruebas existentes.
- **[DECISIÓN]:** necesita tu decisión de producto o de equilibrio.
- **[PERMISO]:** toca datos o reglas protegidos por `AGENTS.md` (ratings, UEFA/Europa, simulador). Necesita permiso explícito.

**Tamaño:**
- **S:** menos de un día.
- **M:** uno o dos días.
- **L:** varios días.

---

## Resumen

| Ola | Fase | Versión | Qué | Tamaño | Bloqueo |
| --- | --- | --- | --- | --- | --- |
| 1 · Textos y claridad | 1 | v0.25.92 | Textos de fin de temporada y entre temporadas | S | [AUTO] |
| | 2 | v0.25.93 | Aviso para seguir la Liga tras Copa o Europa | S | [AUTO] |
| 2 · Fuerza que se entiende | 3 | v0.25.94 | Rating de simulación con un decimal, sin redondeo | S | [DECISIÓN] |
| | 4 | v0.25.95 | Fuerza y líneas en la escala de los rivales | M | [AUTO] |
| 3 · Influencia visible en Europa | 5 | v0.25.96 | Zona de semifinales y probabilidad de pasar | M | [AUTO] |
| | 6 | v0.25.97 | «Tu decisión» tras cada partido | M | [AUTO] |
| | 7 | v0.25.98 | Balance europeo al cerrar la temporada | S | [AUTO] |
| 4 · Europa más justa | 8 | auditoría | Medias de los rivales europeos | S | [AUTO] |
| | 9 | v0.26.0 | Rivales europeos en la escala de la carrera y fijos por club | M | [PERMISO] |
| | 10 | v0.26.1 | Rivales europeos con estilo de juego | M | [PERMISO] |
| | 11 | — | Supercopa con el rating visible o el comprimido | S | [DECISIÓN] |
| 5 · Decisiones en Liga | 12 | v0.27.0 | Prioridad de temporada o rotación (una de las dos) | L | [PERMISO] |
| | 13 | — | Formato europeo con eliminatoria previa | L | [PERMISO] |
| 6 · Gráficos 2D | 14-18 | v0.27.x | Mejoras visuales por pantallas | M cada una | [AUTO] |
| Siempre | QA | — | Pruebas y auditorías de cada ola | — | [AUTO] |
| Mantenimiento | — | — | Ramas, documentos sueltos y aparcados | S | [TÚ] |

Las olas 1 a 3 son solo visuales o de texto y no tocan el equilibrio. Atacan directamente la queja de fondo, «todo es azar». Recomiendo hacerlas en orden y sin esperar a las demás.

---

## Ola 1 — Textos y claridad

### Fase 1 · v0.25.92 — Textos de fin de temporada y entre temporadas
Son seis textos, todos apuntados durante la partida:

**Pantalla «Temporada superada»** (probablemente `src/components/CareerSeasonOutcome.tsx`):
1. **Tarjeta Copa del Rey:** «No salva la temporada» sale aunque el objetivo ya esté cumplido por Liga o Europa. Con el objetivo cumplido, se quita o se cambia, por ejemplo «Objetivo ya cumplido por la Liga». Si el objetivo falla, como en el Game Over, se mantiene: ahí es correcto.
2. **Tarjeta Liga:** «1.º · 68 puntos» no dice «Campeón». Pasa a «1.º · Campeón · 68 puntos».
3. **Línea de objetivo**, en esta pantalla y en la de entre temporadas: si se gana la Liga, «Objetivo cumplido: campeón de Liga y clasificación a Champions League».

**Pantalla «Temporada superada. Toca decidir.»:**

4. **Prestigio europeo** (`src/career/europeanPrestige.ts:101`): «la campaña se queda en la fase inicial» sale en cualquier eliminación antes de semifinales. Debe decir la ronda real. Solo cambia el texto; los bonus no se tocan.
5. **«…no desbloquea premio extra en esta versión»** (`src/components/CareerInterseasonReward.tsx:99`): pasa a «Europa mantiene viva la carrera, pero no da premio extra».
6. **Dos puntuaciones:** etiquetar los «10 pts» del palmarés (puntos por títulos) y los «40 puntos» del reto (puntuación del ranking) para que no parezcan el mismo número.

- **Riesgo:** bajo. Algunos QA comprueban textos literales: hay que revisarlos con `npm run qa:ci`.
- **Cierre:** typecheck, lint, tests, QA, Playwright y una revisión en el navegador con una partida guardada en cada pantalla.

### Fase 2 · v0.25.93 — Aviso para seguir la Liga tras Copa o Europa
- **Qué:** al terminar un partido de Copa o Europa, dejar claro que hay que volver a pulsar «Simular» para seguir la Liga. Por ejemplo, el aviso «Sigue la Liga: pulsa Simular» y el botón resaltado.
- **Archivo:** `src/components/LeagueSimulatorView.tsx` (tarjeta de acciones).
- **Límite:** no se relaja la regla de que un partido pendiente de Copa o Europa bloquea la Liga.
- **Riesgo:** bajo. Algunos QA comprueban textos de esa tarjeta.

---

## Ola 2 — Fuerza que se entiende

### Fase 3 · v0.25.94 — Rating de simulación con un decimal
- **Qué:** quitar el redondeo a entero de la compresión (`src/career/teamPower.ts`) y mostrar un decimal. Así 87 → 83,9 y 88 → 84,4, en vez de 84 las dos veces.
- **Medido** (`docs/INFORME_RATING_SIMULACION_v0_25_90.md`): sin efecto medible en el equilibrio.
- **Por qué es [DECISIÓN]:** cambia un número que entra en el simulador, aunque el efecto medido sea nulo.
- **Va con la fase 4:** las dos tocan la misma pantalla.

### Fase 4 · v0.25.95 — Fuerza y líneas en la escala de los rivales
- **Qué:** opción 1, elegida por el usuario.
  - En el resumen del equipo (`TeamSummary`), mostrar «Tu fuerza en LaLiga: 84 · Real Madrid y Barcelona 91 · Atlético 87».
  - Mostrar también las líneas que juegan (ataque, defensa, portero, control), ya comprimidas, junto a las de los grandes o del rival de la jornada.
  - El 85 del once y el 88 de la temporada quedan como datos del once histórico.
- **Datos:** `buildCareerTeamPowerPreview` en `src/career/teamPower.ts`.
- **Riesgo:** bajo. Es solo visual.

---

## Ola 3 — Influencia visible en Europa

### Fase 5 · v0.25.96 — Zona de semifinales y probabilidad de pasar
- **Qué:**
  - En la tabla europea (`src/components/EuropeanLeagueTable.tsx`), marcar las filas de los 2 primeros. Hoy la regla está escrita encima, pero las filas no se distinguen.
  - Añadir «Probabilidad de pasar: 31 %» y lo que necesitas, por ejemplo «Con 4 puntos en 2 partidos pasas casi seguro».
- **Cómo:** con el patrón del rango esperado de Liga (`src/simulation/expectedLeagueRange.ts`):
  - una función pura en `src/europe/` simula los partidos que faltan con semillas propias y sin `Math.random`;
  - se calcula en un `setTimeout`.
- **Riesgo:** medio. Que el cálculo consuma azar de la partida. Lo cubre un test, como en el rango esperado.

### Fase 6 · v0.25.97 — «Tu decisión» tras cada partido
- **Qué:** tras cada partido de Copa, Europa o Supercopa, una línea con el efecto de la decisión. Por ejemplo, «El planteamiento defensivo subió tu probabilidad de puntuar del 48 % al 57 %», o «Arriesgar en el descanso te dio un gol».
- **Cómo:**
  - El partido ya guarda `approachEffect` y `halfTimeEffect`.
  - La comparación con la alternativa se hace con la misma semilla, como en el descanso.
- **Riesgo:** medio. El texto tiene que ser honesto: nunca atribuir un gol a la decisión si no fue así.

### Fase 7 · v0.25.98 — Balance europeo al cerrar la temporada
- **Qué:** en el resumen de la temporada, una línea del tipo «Con tu equipo, lo normal era pasar 1 de cada 3 veces».
- **Por qué:** caer por azar no se siente igual que caer sin saber por qué.
- **Riesgo:** bajo. Reutiliza el cálculo de la fase 5.

---

## Ola 4 — Europa más justa (equilibrio)

### Fase 8 · Auditoría — Medias de los rivales europeos
- **Qué:** listar los rivales por competición con su media y compararlos con LaLiga y con el rating de simulación del usuario. Señalar los casos raros.
- **Ya medido** (`INFORME_EUROPA_E_INFLUENCIA_v0_25_91.md`):
  - Las medias se sortean en cada torneo, sin depender del club.
  - En la Champions, la media es 88, por encima del Atlético, y el máximo es 94, por encima del Barça y el Madrid.
  - Con 84 se pasa la fase de Champions un 11 % de las veces decidiendo bien.
- **Sin versión:** solo documentación.

### Fase 9 · v0.26.0 — Rivales europeos en la escala de la carrera y fijos por club
- **Qué:**
  - Cada club tiene un nivel fijo dentro de su competición, con poca variación por temporada.
  - La Champions no pasa del nivel de Barcelona y Real Madrid.
- **Cómo:**
  1. Medir con `npm run audit:europe`, más `audit:rating` y `audit:league` para ver el efecto en la carrera y el ranking.
  2. Commit local con números y PR solo con «abre el PR».
- **Bloqueo:** [PERMISO]. Toca los datos de Europa (`src/europe/europeanOpponents.ts`).

### Fase 10 · v0.26.1 — Rivales europeos con estilo
- **Qué:**
  - Cada club tiene un perfil por líneas, por ejemplo «ataca mucho, defiende poco», que se ve en la previa.
  - El duelo de líneas y el planteamiento pasan a depender del rival.
- **Cómo:** cambiar `buildUniformRivalTeam` en `src/europe/europeanMatchEngine.ts` por un perfil y quitar `rivalHasOnlyOverall`.
- **Medir:** que la media del rival se mantiene y que ningún planteamiento domina siempre. La auditoría v0.25.87 avisó del riesgo de «defiende siempre».
- **Bloqueo:** [PERMISO].

### Fase 11 · Decisión — Rating de la Supercopa
- **Qué:** la Supercopa usa hoy el rating visible (88) y la Liga y la Copa el comprimido (84). Hay que decidir si es intencionado.
- **Si se cambia:** se mide y va en su propia fase.

---

## Ola 5 — Decisiones en Liga (equilibrio)

En Liga se juegan 38 de los 40-48 partidos de la temporada sin ninguna decisión. La auditoría v0.25.87 desaconseja dar más peso a las decisiones en los partidos grandes, porque infla el ranking y acaba en «defiende siempre». Estas propuestas buscan decisiones con coste, de suma cero.

### Fase 12 · v0.27.0 — Prioridad de temporada o rotación (elegir una)
- **Opción A, prioridad de temporada:** antes de empezar eliges Liga, Copa o Europa. Sumas +1 en la elegida y −0,5 en las otras.
- **Opción B, rotación:** en la jornada de Liga anterior a una noche europea puedes rotar: −1 en ese partido de Liga y +1 en el europeo.
- **Cómo:** medir las dos con el método de siempre. El objetivo es que «decidir bien» mejore algo sin inflar el ranking más de lo aceptado.
- **Bloqueo:** [PERMISO]. Toca el modo carrera y el simulador.

### Fase 13 · Formato europeo con eliminatoria previa
- **Qué:** los 2 primeros pasan a semifinales, y el 3.º y el 4.º juegan una eliminatoria previa a partido único.
- **Riesgo:** sube los títulos europeos y el ranking. Va el último y solo si lo anterior no basta.
- **Bloqueo:** [PERMISO].

---

## Ola 6 — Gráficos 2D

Son clubes reales sin escudos ni equipaciones, así que todo es genérico: sin marcas de la UEFA ni de LaLiga, y siempre con texto además del color, por accesibilidad.

| Fase | Qué | Dónde |
| --- | --- | --- |
| 14 | Escudos genéricos por país: los colores de la bandera y las iniciales del club | Previa europea, tabla y cuadro |
| 15 | Estética de noche europea: azul noche, focos y un patrón de estrellas genérico | Pantalla del partido europeo |
| 16 | Duelo de líneas visual: barras enfrentadas (tu ataque contra su defensa…) | Previa y partido; con la fase 10, se ven los estilos |
| 17 | Línea de tiempo del partido: goles, dominio y la decisión del descanso marcada | Secuencia del partido |
| 18 | Vitrina del palmarés con copas genéricas, y un destello al acertar el centro perfecto de la ruleta | Palmarés y ruleta |

Las fases 16 y 17 refuerzan la ola 3: hacen ver dónde influiste. Pueden ir antes que el resto de la ola 6.

---

## QA en todas las olas

- **Auditoría nueva:** `npm run audit:europe` (`scripts/auditEuropePhase.ts`). Mide cualquier cambio en Europa.
- **Tests por añadir:**
  - el desempate de la tabla europea y la regla de los 2 primeros;
  - que la probabilidad de pasar (fase 5) no consuma `Math.random`.
- **Prueba e2e:** una fase europea completa hasta semifinales con una partida guardada y semilla fija. Hoy se comprueban la tabla y la regla, pero no el paso a semifinales.
- **Prueba de sensaciones** tras cada ola:
  - ¿Entiendes por qué ganaste o perdiste?
  - ¿Sabes qué necesitas en el siguiente partido?
  - ¿Cambiarías tu decisión?

---

## Mantenimiento

- **Ramas locales ya fusionadas en main:** más de cien, acumuladas desde la v0.25.2. Se pueden borrar con `git branch -d` (solo borra las ramas fusionadas) cuando lo confirmes con «bórralas».
- **Aparcado:**
  - GoatCounter;
  - el documento sin añadir `docs/INFORME_AUDITORIA_CONTROL_v0_25_73.md`;
  - ramas antiguas en origin;
  - TypeScript 7 (#34).

## Hecho en esta tanda

- **v0.25.87-v0.25.90:** cuadro de Copa, rango esperado en Liga, Supercopa partido a partido y Supercopa en dos pasos con cuadro.
- **v0.25.91:** premio seguro en el centro perfecto de la ruleta.
- **Auditorías:** peso de las decisiones, rating de simulación y Europa e influencia.
