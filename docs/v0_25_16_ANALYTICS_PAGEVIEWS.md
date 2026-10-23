# v0.25.16 — Visitas contadas desde la portada

## Problema

En v0.25.14 el script de GoatCounter se cargaba solo con el primer evento. GoatCounter cuenta una visita cuando carga su script, así que las visitas a la portada no se contaban hasta que alguien empezaba una carrera.

## Solución

`initAnalytics()` (en `src/services/analytics.ts`) carga el script al arrancar la aplicación. `src/main.tsx` la llama una vez. Sin `VITE_ANALYTICS_HOST` no hace nada.

## Validación

- `tests/unit/analytics.test.ts`: la analítica sigue desactivada por defecto y las dos funciones no lanzan en Node.
- Tras el despliegue: abrir la portada desde una conexión sin bloqueadores y comprobar en el panel de GoatCounter que cuenta la visita.
