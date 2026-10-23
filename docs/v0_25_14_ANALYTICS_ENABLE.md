# v0.25.14 — Analítica sin cookies: activación

Activa la analítica decidida (ver `docs/ANALITICA_SIN_COOKIES_DISENO.md`). Está en una rama sin fusionar hasta confirmar dos cosas.

## Qué cambia

- `.github/workflows/deploy.yml`: el build recibe `VITE_ANALYTICS_HOST` desde la variable del repositorio. Sin la variable, la analítica queda desactivada.
- `public/privacidad.html`: sección "Medición de uso" con GoatCounter, su política y lo que se cuenta. Se elimina la frase "No usamos analítica".
- `scripts/qaP1LowCost.ts`: comprueba la nueva sección y falla si queda el marcador `[REVISAR`.

## Antes de fusionar

1. **Leer la política de GoatCounter** (https://goatcounter.com/privacy) desde una conexión sin bloqueo DNS. Confirmar qué dice sobre la IP y sustituir el marcador `[REVISAR…]` por lo que diga.
2. **Definir la variable** en GitHub: Settings → Secrets and variables → Actions → Variables → `VITE_ANALYTICS_HOST` = `https://futbol11.goatcounter.com`.
3. **Fusionar y desplegar.** A partir de ese despliegue, las visitas y los dos eventos se envían a GoatCounter.

## Límites

- Quien use un bloqueador de rastreadores (por ejemplo, Pi-hole) no enviará datos. Las cifras serán inferiores a las reales.
- Los eventos no llevan propiedades: no se puede segmentar por dificultad ni por resultado.

## Validación

- Build sin variable: sin script del proveedor (verificable en `dist/`).
- Build con variable: visitas y eventos aparecen en el panel de GoatCounter.
- `qa:p1-low-cost` impide publicar la nota con el marcador pendiente.
