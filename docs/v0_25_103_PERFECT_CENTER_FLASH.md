# v0.25.103 — Destello del centro perfecto

Es la fase 18 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`, ola 6, y solo es visual. El usuario decidió dejar la vitrina del palmarés como está y aplicar solo el destello de la ruleta. Con esto se cierra la ola 6.

## El cambio

**`src/components/SeasonLuckWheelModal.tsx`:** cuando el resultado cae en la zona `perfect_center`:
- la barra de precisión recibe la clase `season-wheel-precision-bar-perfect`;
- la tarjeta del resultado recibe `season-wheel-result-perfect`.

**`src/components/SeasonLuckWheelModal.css`:**
- **Barra:** borde dorado y un destello dorado que sale del centro y se abre hacia los lados (`seasonWheelPerfectFlash`, 1,1 s, una sola vez).
- **Tarjeta del resultado:** contorno dorado y un brillo que se apaga (`seasonWheelPerfectGlow`, 1,4 s, una sola vez).
- **Con `prefers-reduced-motion: reduce`:** sin animaciones; quedan el borde y el contorno dorados.

El aviso no depende solo del color: el resultado ya decía en texto «Centro perfecto» (v0.25.91).

## Sin cambios

- Los premios, las zonas y la probabilidad de la ruleta.
- La vitrina del palmarés.

## Comprobación

- **Navegador:** la ruleta montada sola con la flecha quieta en el centro, con Chrome.
  - Al parar, la barra y la tarjeta llevan sus clases, con las animaciones `seasonWheelPerfectFlash` y `seasonWheelPerfectGlow`, y el resultado dice «Centro perfecto».
  - Con movimiento reducido, las dos animaciones valen `none`.
  - Sin errores.
- `npm run typecheck`, `npx eslint src scripts`, `npm test` y `npm run qa:ci` pasan.
