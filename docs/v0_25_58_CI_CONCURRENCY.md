# v0.25.58 — CI: concurrencia por rama

## Problema

El CI de algunos PR no llegaba a correr y había que relanzarlo con un commit vacío.

El análisis por roles proponía añadir `workflow_dispatch` para relanzarlo, pero `deploy.yml` ya lo tenía. La causa estaba en `concurrency`. Todas las ejecuciones (PR, push a `main` y lanzamientos a mano) compartían el grupo `pages` con `cancel-in-progress: false`. GitHub solo deja una ejecución pendiente por grupo, así que una nueva cancela a la que estaba esperando.

Casos en el historial:

| Hora (UTC) | PR cancelado | Lo canceló |
|---|---|---|
| 2026-10-27 09:29:21 | `dashboard/boton-palmares` | push a `main` de las 09:29:51 |
| 2026-10-27 10:05:39 | `supercopa/simulacion-partidos` | ejecución de las 10:09:01 |

## Cambio

`.github/workflows/deploy.yml`:

- **Concurrencia por rama o PR:** el grupo pasa a ser `ci-${{ github.ref }}`. Un PR ya no compite con `main` ni con otros PR.
- **Pushes nuevos en un PR:** `cancel-in-progress` vale `true` solo en `pull_request`, así que un push nuevo al PR cancela la ejecución anterior de ese mismo PR. En `main` no se cancela nada.
- **Despliegue:**
  - el job `deploy` mantiene su propio grupo `pages`, así que los despliegues siguen yendo de uno en uno;
  - solo se ejecuta en `main`. Antes, un lanzamiento a mano sobre otra rama intentaba desplegar y fallaba por la regla del entorno `github-pages`, que solo admite `main`.

## Relanzar el CI a mano

En vez de un commit vacío:

```bash
gh workflow run deploy.yml --ref <rama>
```

Así se ejecutan las comprobaciones sobre la rama sin desplegar.

## Qué no cambia

Los pasos del job `build` (typecheck, QA, lint, tests unitarios, build y E2E) y el despliegue desde `main` siguen igual.

## Validación

- El YAML se parsea bien. La condición de `deploy` y los dos grupos de concurrencia son los esperados.
- Comprobación real: el CI de este PR debe arrancar sin commits vacíos. Al fusionar, el push a `main` debe desplegar.
