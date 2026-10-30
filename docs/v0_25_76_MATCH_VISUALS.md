# v0.25.76 — El partido se ve

Fase 3 de la auditoría de control del usuario: que se vea por qué pasa lo que pasa en el partido. No cambia ningún resultado.

## Qué cambia

- **Líneas en la previa:** Liga, Copa y Supercopa muestran tu ataque contra su defensa y tu defensa contra su ataque, con los ratings que usa el motor.
- **Crónica:** al acabar, una línea cuenta qué duelo explicó el resultado, como «Tu ataque (91) superó a su defensa (74)». Solo aparece si el marcador y los ratings dicen lo mismo. Si no coinciden, o si el partido se decidió en la prórroga, no se cuenta nada.
- **Barra de dominio:** en Liga, Copa, Supercopa y Europa, el reparto de los goles esperados con los que se jugó el partido, de local a visitante. Arranca igualada en la previa y se abre al empezar. Refleja el planteamiento elegido.
- **Mini campo con tu once:** en Liga, Copa y Supercopa. Quien marca se resalta en oro y quien asiste en blanco, a medida que ocurre.
- **Iconos:** escudo, balanza y flecha para los planteamientos, e iconos para los factores del partido, en el estilo de `CompetitionIcon`. La Supercopa pasa a usar su propio icono en la tarjeta del partido, que antes mostraba el de la Liga.

## Qué no cambia

- **Resultados:** el motor solo expone dos datos que ya calculaba, los goles esperados y las líneas, sin ninguna tirada nueva.
- **Ratings, plantillas, balance y reglas:** sin tocar.

## Límites

- **Europa no tiene líneas ni mini campo.** Hoy juega solo con la media y sin goleadores, así que enseñarlos sería inventarlos. Llegarán con la fase 4 (B3).
- **Dominio fijo por partido.** Es el reparto con el que se jugó todo el partido, no evoluciona minuto a minuto: el motor no simula por tramos.
- **Partidas guardadas.** Los resultados anteriores a esta versión no tienen estos datos y se muestran sin barra ni crónica. El mini campo no depende de ellos.

## Comprobación

Comparación antes y después de 4.000 partidos de Liga, 3.000 europeos, 1.000 Supercopas y 24 temporadas completas, sin planteamiento y con cada una de las tres opciones, con la aleatoriedad fijada. Sin contar los dos campos nuevos, resultados idénticos.

Revisión visual a 800 px y a 375 px.

## Validación

```bash
npm run typecheck
npx eslint src scripts
npm test
npm run qa:ci
npx playwright test
```

Riesgo: bajo. Solo añade presentación y dos campos informativos en cada resultado.
