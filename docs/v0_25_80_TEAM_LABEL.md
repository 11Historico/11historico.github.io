# v0.25.80 — La etiqueta del equipo ya informa

Corrige otro hallazgo de `docs/INFORME_TOPE_LINEAS_v0_25_78.md`. Es solo texto de la pantalla final: no cambia ningún resultado.

## Qué cambia

- **El estilo se lee de la plantilla real:** la etiqueta compara la media de delanteros, medios y defensas. Una línea marca el estilo si saca 4 puntos o más a la otra (`PROFILE_LINE_EDGE`). Antes miraba las líneas del rating, que salen casi iguales por el tope.
- **Sin una línea que destaque,** la etiqueta depende del nivel del equipo, como ya ocurría.
- **Sin delanteros (4-6-0),** los medios cuentan como ataque.
- **Desaparece «Equipo físico e intenso»:** salía en el 1 % de los equipos, y el físico no es una línea del campo que se pueda comparar con las demás.

## Reparto de etiquetas

Sale de `npm run audit:linecap` (drafts realistas):

| Etiqueta | Antes | Ahora |
| --- | --- | --- |
| Equipo equilibrado de alto nivel | 0 % | 66 % |
| Equipo ofensivo y vertical | 0 % | 18 % |
| Once histórico de nivel campeón | 8 % | 8 % |
| Equipo competitivo | 0 % | 5 % |
| Equipo dominador de mediocampo | 92 % | 2 % |
| Equipo sólido y competitivo | 0 % | 1 % |
| Equipo físico e intenso | 1 % | Ya no existe |

«Sólido» sale poco porque, en los datos, los delanteros suelen tener más media que los defensas.

## Qué no cambia

- **Partidos, ratings, Liga, Copa y Europa:** la etiqueta no interviene en la simulación. `npm run audit:career` da un resultado idéntico en una prueba de 360 carreras.
- **Puntos fuertes y debilidades:** siguen calculándose con las líneas del rating.

## Comprobación

- `tests/unit/teamRating.test.ts` cubre cada etiqueta y el caso del 4-6-0.
- En el navegador, la pantalla final muestra «Equipo ofensivo y vertical» con un once de delanteros 84, medios 78 y defensas 76, sin errores en la consola.
