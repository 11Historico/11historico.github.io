# v0.25.78 — Decisión en el descanso

Fase B4 de la auditoría de control del usuario. Toca el simulador con aprobación expresa del usuario, solo en partidos sueltos de Copa y Europa. Es la primera decisión que se toma viendo el marcador.

## Qué cambia

- **Pausa en el minuto 45:** en Copa y Europa, el partido se para con el marcador y el dominio a la vista. No se puede avanzar sin decidir, y la pantalla se desplaza hasta la decisión.
- **Tres opciones:**
  - **Seguir igual:** el partido acaba exactamente como iba a acabar.
  - **Arriesgar:** cada equipo puede marcar un gol más en la segunda parte. La probabilidad depende de sus goles esperados, y el rival tiene algo más de opciones que tú.
  - **Cerrar el partido:** cada gol de la segunda parte, de los dos equipos, tiene un 30 % de probabilidad de no llegar.
- **Frase final:** compara con lo que habría pasado sin tocar nada. Por ejemplo, «Arriesgar cambió el partido: sin tocar nada habrías perdido 1-0 a los 90 minutos».
- **Nada delata el resultado:** mientras se juega, el progreso europeo, la clasificación europea y la tarjeta de Copa siguen como antes del partido. Antes enseñaban el resultado desde el primer segundo.

## Qué no cambia

- **Seguir igual:** no recalcula nada.
- **Primera parte:** sus goles nunca cambian.
- **Liga y Supercopa:** no se paran.
- **«Simular Copa y terminar temporada»:** tampoco se para.
- **Motor:** sin decisión, los resultados son idénticos a los de antes.

## Por qué no se vuelve a simular la segunda parte

El motor calcula el partido de una vez. Si se repitiera con otros goles esperados, al cambiar un gol se desplazarían las tiradas de los siguientes y arriesgar podría acabar con menos goles. Por eso la decisión parte del partido ya calculado y solo añade o anula goles de la segunda parte. Arriesgar nunca quita goles y cerrar nunca los añade, y la comparación de la frase final es exacta.

## Partidas guardadas

El resultado se guarda al pulsar simular, como antes, y la decisión lo sustituye. Si se recarga en el descanso, cuenta como seguir igual: no sirve para repetir una primera parte que ha salido mal.

## Medición

La tabla sale de `npm run audit:approach`, que es reproducible (4.000 partidos por cruce, mitad en casa y mitad fuera). Probabilidad de pasar una eliminatoria europea, según el marcador al descanso:

| Cruce | Al descanso | Seguir igual | Arriesgar | Cerrar |
| --- | --- | --- | --- | --- |
| Inferior (76 vs 84) | Perdiendo | 6,5 % | 7,8 % | 5,0 % |
| Inferior (76 vs 84) | Empatando | 25,8 % | 22,3 % | 30,4 % |
| Inferior (76 vs 84) | Ganando | 64,2 % | 51,7 % | 74,4 % |
| Igualado (82 vs 82) | Perdiendo | 15,2 % | 19,0 % | 11,2 % |
| Igualado (82 vs 82) | Empatando | 45,5 % | 44,7 % | 46,2 % |
| Igualado (82 vs 82) | Ganando | 78,4 % | 73,9 % | 85,5 % |
| Favorito (88 vs 80) | Perdiendo | 26,2 % | 34,0 % | 18,7 % |
| Favorito (88 vs 80) | Empatando | 66,4 % | 66,9 % | 62,1 % |
| Favorito (88 vs 80) | Ganando | 90,8 % | 90,3 % | 94,7 % |

Siempre seguir igual, frente a arriesgar si vas perdiendo y cerrar si vas ganando:

| Cruce | Pasa, seguir igual | Pasa, según marcador | Puntos, seguir igual | Puntos, según marcador |
| --- | --- | --- | --- | --- |
| Inferior (76 vs 84) | 24,1 % | 26,1 % | 0,67 | 0,73 |
| Igualado (82 vs 82) | 44,6 % | 47,3 % | 1,18 | 1,27 |
| Favorito (88 vs 80) | 68,0 % | 70,5 % | 1,82 | 1,91 |

Título de Copa con la misma comparación: media 76, de 1,0 % a 1,2 %; media 82, de 2,6 % a 3,2 %; media 88, de 7,9 % a 9,4 %.

## Decisiones de calibración

- **Primera prueba descartada:** con arriesgar a 0,5 y 0,6 sobre los goles esperados de la segunda parte, y cerrar al 50 %, cerrar yendo por delante era casi un atajo (de 64 % a 82 %) y arriesgar yendo por detrás daba poco.
- **Valores finales:** arriesgar a 0,8 para ti y 0,9 para el rival, y cerrar al 30 %.
- **El empate es el dilema real:** el inferior gana cerrando y pierde arriesgando, y el favorito pierde cerrando. Ir por delante o por detrás tiene una respuesta más clara, y equivocarse se paga.

## Límites

- **Ayuda al que decide bien:** jugar según el marcador da unos 2-3 puntos más por eliminatoria. Es buscado, pero hace la temporada algo más fácil que antes.
- **Un clic más por partido:** cada partido suelto de Copa y Europa exige una decisión.
- **Ruleta de temporada:** si se recarga en el descanso de la eliminatoria de Copa en la que caes, la ruleta que ofrece esa eliminación no aparece.
- **Prórroga:** si una decisión cambia el resultado de un partido de Copa empatado, el desempate se vuelve a sortear, con las mismas probabilidades.
- **Planteamiento:** si la decisión cambia el marcador, la frase del planteamiento desaparece, porque su comparación ya no valdría.
- **Dominio:** no cambia en la segunda parte.

## Comprobación

Comparación antes y después de 4.000 partidos de Liga, 3.000 europeos, 1.000 Supercopas y 24 temporadas completas sin decisión de descanso, sin planteamiento y con cada una de las tres opciones: resultados idénticos.

Revisión en navegador de la pausa europea a 800 px y a 375 px, con la decisión a la vista y sin desbordes. La pausa de Copa la cubre un test de Playwright.

## Validación

```bash
npm run typecheck
npx eslint src scripts
npm test
npm run qa:ci
npx playwright test
npm run audit:approach
```

Riesgo: medio-alto. Cambia el flujo de todos los partidos sueltos de Copa y Europa, y sus resultados cuando el usuario no sigue igual.
