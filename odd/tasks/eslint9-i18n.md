# Feature: Fase 2 — eslint 9 + i18n completa

**Rama:** `chore/eslint9-i18n`
**Estado:** completado (eslint 9 + i18n).

## Contexto

Fase 2 del plan de mejoras. Decisión del usuario: migrar eslint 8→9 y completar i18n
(mover strings hardcodeadas a `es.json`); **diferir** el bump mayor de vite/vitest
(vulns dev-only documentadas). Sin nuevo idioma (solo español).

## Tareas

- [x] **1. eslint 9** — migrar `.eslintrc.cjs` → `eslint.config.js` (flat config),
      bump `eslint@^9`, `eslint-plugin-react-hooks` a versión con flat config;
      preservar reglas/behavior; `npm run lint` OK.
- [x] **2. i18n** — mover strings hardcodeadas de `App.tsx`, `WeeklyPlan.tsx`,
      `MealLog.tsx`, `FoodSearch.tsx` a `es.json` con output renderizado idéntico;
      `npm run build` y `npm test` OK.
- [x] **3. Verificación final** — `typecheck`, `lint`, `test` (con `--coverage`), `build`.

## Evidencia de commits

| WU | Commit | Resultado |
|----|--------|-----------|
| 1  | `0869d2f` | eslint 9 flat config |
| 2  | `1e22e75` | i18n completa (21 keys) |
| 3  | —        | typecheck/lint/test(126)/build OK |

## Notas

- Vulns dev-only (vite/vitest/esbuild/@vitest/*) quedan **diferidas**; requieren
  vite 8 + vitest 5 (breaking). Ver `npm audit`.
- `i18n` solo español; `en.json` + selector de idioma es feature futuro.
