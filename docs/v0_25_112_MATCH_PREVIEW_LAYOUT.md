# v0.25.112 — La previa, ordenada

Es la tarea que el usuario apuntó al ver la previa con las cartas: «mejorar esta vista». Después pidió «mejora la vista de la previa» y aprobó el diseño con «sí».

## Lo que fallaba (v0.25.111)

- **Columnas desequilibradas:** la previa y las cartas iban en una columna estrecha, y a la derecha solo había dos botones, con mucho hueco.
- **Textos partidos:** la cabecera («…EN SAN / MAMÉS») y los nombres de los equipos se partían.
- **Cartas desiguales:** eran de alturas distintas, y con 3 cartas quedaba un hueco.
- **Probabilidades lejos:** quedaban debajo de las cartas, y al elegir una carta no se veía cuánto sumaba.
- **El control de velocidad** quedaba suelto abajo.

## La vista nueva

**En escritorio:**
1. **Arriba**, el título y el diagnóstico a la izquierda; a la derecha, los botones y la velocidad, juntos.
2. **Debajo, la previa a todo el ancho:**
   - la cabecera en una línea;
   - el enfrentamiento como un marcador, con el local a la izquierda;
   - los dos duelos de líneas uno al lado del otro;
   - el planteamiento, en Copa y Europa;
   - las probabilidades;
   - y las cartas.
3. **Lo que suma la carta:** con una carta elegida, tu media enseña de cuánto a cuánto sube («88 → 96») y la victoria, cuánto gana («+18 con la carta»). Para eso la previa calcula también las probabilidades sin la carta.
4. **Las cartas:** todas de la misma altura, con la descripción en 3 líneas como mucho (entera, al pasar el ratón). Caben 4 por fila.

**En una columna** (hasta 1.100 px): igual, pero los botones van después de la previa, como antes.

**En el móvil:** cada equipo va en su línea con su media a la derecha, y caben 2 cartas por fila.

Vale para las previas de Liga, Copa y Europa.

## Qué cambia en el código

- **`LeagueSimulatorView.tsx`:**
  - la tarjeta pasa a tener tres zonas (`league-actions-head`, `league-actions-side` y la previa a todo el ancho);
  - el componente `PreviewTeams`;
  - las probabilidades sin la carta (`matchPreviewWithoutCard` y `europeanOddsWithoutCard`), que solo se calculan con una carta elegida.
- **`MatchOddsBar.tsx`:** `baseline`, para «(+N con la carta)».
- **`LeagueSimulatorView.css`, `MatchCards.css` y `MatchOddsBar.css`:** la disposición, las cartas de la misma altura y el móvil.

**Lo que no cambia:** los datos, las reglas y el motor.

## Comprobación

**En el navegador, midiendo la página** (el panel estaba oculto):

| Tamaño | Disposición | Resultado |
| --- | --- | --- |
| 1.440 px | estado y botones en una fila; previa a todo el ancho | la cabecera y el enfrentamiento en una línea, los duelos uno al lado del otro y 4 cartas por fila |
| 1.024 px | una columna | — |
| 375 px | móvil | cada equipo en una línea y 2 cartas por fila |

- **Con una carta elegida** se vio «88 → 96» y «Victoria 55 % (+18 con la carta)».
- **En los tres tamaños:** nada se sale de la pantalla, todas las cartas miden lo mismo y no hay errores en la consola.

**Comprobaciones:** pasan `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y `npm run test:e2e`.
