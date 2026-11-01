# v0.25.83 — El marcador de la Supercopa se ve

Al probar el juego, en la pantalla de la Supercopa no se leían los resultados y el marcador salía desalineado. Es solo un cambio de estilos.

## La causa

`CareerSupercopa.css` tenía estilos para cualquier `span`, `strong` y `article` dentro de la lista de resultados, de cuando era una lista sencilla. Esa lista ahora contiene el partido en directo, y esos estilos se le aplicaban:

- **Goles invisibles:** el número salía en amarillo sobre el fondo blanco del marcador, y en una barra de todo el ancho en vez de un círculo.
- **Desalineado:** el escudo, el nombre y los goles salían uno debajo de otro.
- **Nombres en mayúsculas:** los textos del partido cogían ese formato de la lista.

## Qué cambia

- **Se quitan esos estilos:** la tarjeta del partido se ve como en Liga y Copa. No se añade ningún estilo nuevo.
- **La lista de participantes no cambia:** conserva los suyos.

## Qué no cambia

- **La Supercopa:** ni sus partidos, ni sus resultados, ni el planteamiento.

## Comprobación

- `tests/e2e/europe-supercopa.spec.ts` comprueba que el número del marcador es rojo, y que en directo se reproduce un partido cada vez.
- En el navegador, el marcador sale con su círculo blanco y alineado, en pantalla de ordenador y de móvil, sin desbordar.
