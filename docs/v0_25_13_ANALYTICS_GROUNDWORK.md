# v0.25.13 — Base de analítica sin cookies (desactivada)

Prepara la analítica decidida (ver `docs/ANALITICA_SIN_COOKIES_DISENO.md`) sin activarla.

## Qué cambia

- `src/services/analytics.ts`: `trackEvent("career_start" | "game_over")`. Sin `VITE_ANALYTICS_HOST` no hace nada. Con la variable, carga el script del proveedor y envía el evento sin propiedades. Los eventos que se producen antes de cargar el script se guardan y se envían al cargarlo.
- `src/App.tsx`: llama a `trackEvent` al empezar una carrera y al llegar al Game Over.
- `public/privacidad.html`: el canal de peticiones de borrado es ikeritu@hotmail.com, y la fecha de actualización es 23/10/2026.

## Lo que no cambia

- La nota de privacidad sigue diciendo "No usamos analítica", que es cierto mientras la variable no esté definida.
- No se escribe nada en cookies ni en `localStorage` para la analítica.

## Pendiente para activar

Ver la lista en `docs/ANALITICA_SIN_COOKIES_DISENO.md` (apartado "Lo que queda antes de activar"): código del sitio, política del proveedor vigente, URL del script, variable en GitHub Pages y cambio de la nota en el mismo PR.

## Validación

- `tests/unit/analytics.test.ts`: desactivada por defecto y sin errores al llamar a `trackEvent` en Node.
- `npm test`, `typecheck`, `lint` y `qa:tech-debt` completo pasan (ver PR).
