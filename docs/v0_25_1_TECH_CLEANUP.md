# v0.25.1 — Tech Cleanup

Limpieza técnica posterior a la versión pública estable. No cambia gameplay, balance, simulación, reparto europeo, premios ni ranking.

## Cambios

- **Vulnerabilidades:** `npm audit fix` sin `--force`. `npm audit` reporta 0. Vite pasa de 8.1.2 a 8.3.5 dentro de la misma versión mayor; el resto son dependencias transitivas.
- **Bundle:** los datos históricos de plantillas (`src/data/athletic/`) van en el fragmento `athletic-data` (307 kB). El principal baja de 792 kB a 485 kB y desaparece el aviso de Vite de 500 kB. Los datos siguen cargándose al inicio: no hay carga diferida, así que el comportamiento de la app no cambia. Se comprobó que los datos solo importan tipos, sin ciclos.
- **QA independiente del entorno:** `qa:global-ranking` ya no falla si `.env.local` define un endpoint. Comprueba la etiqueta del backend según la configuración de compilación.
- **QA nuevo:** `qa:bundle-chunking` comprueba la separación del bundle.

## Validación

- `npm audit`: 0 vulnerabilidades.
- `typecheck` y `lint` pasan.
- `qa:tech-debt` completo pasa con `VITE_GLOBAL_RANKING_ENDPOINT=""`.
- `qa:global-ranking` pasa con y sin endpoint en `.env.local`.
- Build de producción sin avisos de tamaño de fragmento.

## Pendiente

- Ramas locales ya fusionadas en `main` (decisión del usuario antes de borrarlas).
- Tamaño del fragmento principal (485 kB) cerca del umbral: si crece, habrá que cargar diferido el draft o las pantallas de carrera.
