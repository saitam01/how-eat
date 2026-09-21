# Feature: Historial de peso + gráficos

**Rama:** `feat/weight-history`
**Estado:** completado.

## Contexto

Fase 3, feature 2 (elegida por el usuario). Registro de peso diario persistido y gráfico
de progreso. Gráfico = SVG custom liviano (sin recharts, para no inflar el bundle).

## Tareas

- [x] **1. Modelo + storage** — `WeightEntry` en `types.ts`, `weight-storage.ts` (v1), tests.
- [x] **2. Hook + UI** — `useWeightLog`, `WeightChart` (SVG), `WeightLog` (input+lista+chart),
      tab `progreso` en `TabBar`, wiring en `App.tsx`, keys i18n, tests.
- [x] **3. Verificación** — `typecheck`, `lint`, `test`, `build`.

## Evidencia de commits

| WU | Commit | Resultado |
|----|--------|-----------|
| 1  | `024389e` | modelo + storage |
| 2  | `024389e` | hook + UI + tab |
| 3  | —        | typecheck/lint/test(135)/build OK |

## Notas

- Sin backdating (se registra el peso de hoy); borrado por entrada.
- `en.json`/multi-idioma y "system" theme quedan para después.
