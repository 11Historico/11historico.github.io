# v0.25.91 — Premio seguro en el centro perfecto de la ruleta

Un jugador paró la flecha de la ruleta de temporada en el centro perfecto y le salió «Sin efecto». Era posible: el centro perfecto solo mejoraba las probabilidades. La pantalla decía «Para cerca del centro para mejorar tus opciones» sin dar cifras, así que lo natural era esperar premio. El usuario eligió que el centro perfecto asegure premio (opción 1).

## Cambio

| Dónde para la flecha | Antes (premio / sin efecto / castigo) | Ahora |
| --- | --- | --- |
| **Centro perfecto** (a 0,06 o menos del centro) | 65 / 30 / 5 | **100 / 0 / 0** |
| Zona buena | 50 / 35 / 15 | igual |
| Zona equilibrada | 40 / 40 / 20 | igual |
| Zona exterior | 25 / 45 / 30 | igual |
| Extremo | 10 / 40 / 50 | igual |

- **Qué premio toca:** el mismo reparto de siempre entre los premios: +0,5 media (40 %), cambio de jugador (30 %), cambio de entrenador (20 %), +1,0 media (8 %) y +1,0 media con cambio de jugador (2 %).
- **Texto de la ruleta:** «En el centro perfecto el premio está asegurado. Cerca del centro mejoras tus opciones; en los extremos aumenta el riesgo de castigo.»
- **Sin cambios:** el ancho de las zonas, la velocidad de la flecha, los premios y castigos, y que la ruleta salga como mucho una vez por temporada.

## Efecto esperado

Solo cambia la tirada en la que se acierta el centro perfecto, que es difícil porque la flecha acelera.

- **Media esperada en esa tirada:** pasa de +0,17 a +0,30 (un premio vale de media +0,30; un castigo, −0,55).
- **Cambios de jugador o entrenador:** pasan de un 34 % a un 52 % de las tiradas en el centro.

La auditoría de carreras no simula la ruleta, así que no hay medición por temporadas. Por el tamaño del cambio (una vez por temporada, solo acertando el centro y menos de medio punto de media) no se espera un efecto apreciable en la dificultad.

## Archivos

- `src/career/seasonLuckWheel.ts`: probabilidades de la zona `perfect_center`.
- `src/components/SeasonLuckWheelModal.tsx`: texto de la explicación.
- `tests/unit/seasonLuckWheelState.test.ts`: el centro perfecto da premio con cualquier tirada y las demás zonas no cambian.
