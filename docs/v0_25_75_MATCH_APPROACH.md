# v0.25.75 — Planteamiento y perfil del entrenador

Fase 2 de la auditoría de control del usuario: la primera decisión real después del draft. Toca el simulador con aprobación expresa del usuario, solo en Copa, Europa y Supercopa.

## Qué cambia

- **Planteamiento:** antes de cada partido de Copa y Europa, y una vez para toda la Supercopa, el usuario elige Defensivo, Equilibrado u Ofensivo. La previa recalcula las probabilidades al cambiar de opción.
- **Efecto en los goles esperados:** Ofensivo trae más goles en los dos lados y Defensivo menos. En un partido igualado es ±10 % para los dos. Según la diferencia de nivel, hasta ±10 % más: atacar rinde al favorito y cerrarse al inferior, y el planteamiento contrario se paga.
- **Entrenador:**
  - Con habilidad europea de 86 o más, suma +1 a la media en Europa, como ya pasaba con la de Copa en la Copa.
  - Con ataque de 86 o más, el planteamiento ofensivo da un 5 % más de goles a favor.
  - Con defensa de 86 o más, el defensivo da un 5 % menos de goles en contra.
  - La previa muestra cuándo suma.
- **Resultado:** al acabar, una frase compara el marcador con el mismo partido en equilibrado, jugado con las mismas tiradas. Es una comparación real, no una frase decorativa.

## Qué no cambia

- **Liga:** no tiene planteamiento y sus resultados son idénticos.
- **Equilibrado:** es el partido de siempre, y es la opción inicial.
- **Ratings, plantillas y datos de entrenadores:** sin tocar.
- **Prórroga y penaltis:** no dependen del planteamiento.
- **Guardado:** el planteamiento elegido no se guarda; al recargar vuelve a Equilibrado.

## Comprobación

Comparación de 4.000 partidos de Liga, 3.000 europeos, 1.000 Supercopas y 24 temporadas completas con la aleatoriedad fijada, antes y después del cambio, sin elegir planteamiento: resultados idénticos.

La tabla sale de `npm run audit:approach`, que es reproducible (4.000 partidos por casilla, mitad en casa y mitad fuera en Europa). Pasar en semifinal o final incluye prórroga y penaltis.

### Europa: probabilidad de pasar en semifinal o final

| Cruce | Defensivo | Equilibrado | Ofensivo |
| --- | --- | --- | --- |
| Inferior (76 vs 84) | 27,0 % | 24,6 % | 23,1 % |
| Igualado (82 vs 82) | 44,3 % | 45,0 % | 46,2 % |
| Favorito (88 vs 80) | 64,0 % | 67,4 % | 69,8 % |

### Copa: probabilidad de ganar el título

| Media del equipo | Defensivo | Equilibrado | Ofensivo |
| --- | --- | --- | --- |
| 76 | 1,0 % | 1,0 % | 1,2 % |
| 82 | 2,4 % | 2,8 % | 3,4 % |
| 88 | 6,1 % | 8,8 % | 12,1 % |

### Supercopa: probabilidad de ganar el título

| Media del equipo | Defensivo | Equilibrado | Ofensivo |
| --- | --- | --- | --- |
| 76 | 20,8 % | 18,1 % | 16,2 % |
| 82 | 31,9 % | 31,0 % | 29,8 % |
| 88 | 51,3 % | 53,8 % | 56,4 % |

## Decisiones de calibración

- **±10 % fijo para los dos equipos se descartó.** Elegir movía las probabilidades menos de 1 punto, dentro del ruido: era una decisión de adorno.
- **Efecto según el nivel, con intensidad 0,1.** Se probó también 0,2, que casi doblaba el título de Copa para una media 88 (de 8,7 % a 15,1 %). Se eligió 0,1 por prudencia.
- **Límite conocido:** el motor redondea los goles, así que el efecto va a saltos. En algún cruce una opción no mueve nada: un 88 contra un 76 en casa tiene casi las mismas probabilidades con Defensivo que con Equilibrado. La previa lo muestra tal cual, porque usa el motor real.

## Validación

```bash
npm run typecheck
npx eslint src scripts
npm test
npm run qa:ci
npx playwright test
npm run audit:approach
```

Riesgo: medio. Cambia el resultado de Copa, Europa y Supercopa cuando el usuario elige un planteamiento distinto de Equilibrado, y el de Europa con un entrenador especialista.
