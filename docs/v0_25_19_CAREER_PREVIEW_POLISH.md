# v0.25.19 — Pantalla de entrada a la carrera

## Problema

- "Ver ranking local" salía sin estilo: usaba la clase `career-home-button`, que no tenía CSS.
- El texto decía "Base preparada para el futuro modo carrera" y "Top 100 global futuro", aunque el modo ya existe.
- La dificultad se elige en la portada, pero esta pantalla no la mostraba.
- "Volver" competía visualmente con la acción principal.
- En móvil el título ocupaba demasiado alto.

## Cambios

- `src/App.tsx` (pantalla `career_preview`): textos revisados; muestra la dificultad elegida con un enlace "Cambiar" a la portada; iconos de competición en las tarjetas; "Ver ranking local" usa `secondary-home-button`; "Volver" pasa a enlace discreto.
- `src/components/GameHome.tsx`: exporta `DIFFICULTY_OPTIONS` para reutilizar los nombres de dificultad.
- `src/App.css`: estilos de iconos, enlaces y dificultad; título más pequeño en móvil.

## Qué no cambia

- La lógica de la carrera, el inicio de partida y las reglas. El texto de "Entre temporadas" se mantiene tal cual, pendiente de revisar contra las reglas.

## Validación

- `npm run typecheck`, `npm run lint:src`, `npm test`.
- QA de versión y de portada.
- `npx playwright test`.
- Revisión visual de la pantalla en escritorio y móvil (375 px).
