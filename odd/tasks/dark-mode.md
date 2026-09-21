# Feature: Modo oscuro (dark mode)

**Rama:** `feat/dark-mode`
**Estado:** completado.

## Contexto

Fase 3, feature 1 (elegida por el usuario). La app es light-only (shadcn/ui con tokens
`hsl(var(--x))` en `:root`). Agregar dark mode con estrategia `class` de Tailwind + toggle
persistido, y adaptar los colores hardcodeados light-only (error/badges).

## Tareas

- [x] **1. Core dark mode** — `tailwind.config.js` (`darkMode: 'class'`), bloque `.dark` de
      tokens en `index.css`, hook `useTheme` (persistencia + clase en `<html>`), componente
      `ThemeToggle`, wiring en `App.tsx` + key i18n.
- [x] **2. Variantes `dark:`** — adaptar colores hardcodeados en `CalculatorForm`,
      `MacroSliders`, `FoodSearch`, `WeeklyPlan`.
- [x] **3. Verificación** — `typecheck`, `lint`, `test`, `build`.

## Evidencia de commits

| WU | Commit | Resultado |
|----|--------|-----------|
| 1  | `7fbfdfe` | dark mode core + toggle + variantes |
| 2  | `7fbfdfe` | variantes `dark:` colores estado |
| 3  | —        | typecheck/lint/test(129)/build OK |

## Notas

- Default `light` (preserva comportamiento actual); toggle manual persistido en `how-eat:theme`.
- "System" (prefers-color-scheme) es mejora futura.
