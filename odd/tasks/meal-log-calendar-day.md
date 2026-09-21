# Feature: Meal-log calendar-day dimension + hygiene

**Rama:** `feat/meal-log-calendar-day`
**Estado:** en curso
**Decisión de diseño:** día calendario automático (local `YYYY-MM-DD`); vista default = hoy, navegación solo al pasado, "limpiar" borra el día seleccionado.

## Contexto

El registro de comidas ("diario") acumula todas las entradas para siempre: `MealEntry` solo
tiene `timestamp` y `useMealLog` reduce sobre el arreglo completo. La pestaña "diario" y
`WeeklyPlan` mienten semánticamente (acumulado vs. día/semana). Este feature agrega una
dimensión temporal real y limpia deuda menor.

## Tareas

- [ ] **1. Limpieza de deuda** — eliminar `console.log` de debug en `useMealLog.ts`, corregir
      "Peito de pavo" → "Pechuga de pavo" en `food-db.ts`, borrar dead code `convertToPer100g`
      (`food-search-utils.ts`) y su bloque de tests.
- [ ] **2. CI** — agregar `.github/workflows/ci.yml` (install + typecheck + lint + test + build).
- [ ] **3. Modelo de datos** — agregar `date: string` (`YYYY-MM-DD`) a `MealEntry`; migrar
      `how-eat-meals:v1` → `v2` con fecha de hoy para entradas legacy; tests.
- [ ] **4. `src/lib/date.ts`** — helpers puros (`toLocalDate`, `groupByDate`, `entriesForDate`,
      `listDates`); cobertura 100%.
- [ ] **5. `useMealLog`** — estado `selectedDate` (default hoy); `totals`/`progress` solo del
      día seleccionado; `addEntry` asigna fecha; `clear` limpia el día seleccionado.
- [ ] **6. UI de día** — navegación ◀ hoy ▶ en la pestaña "diario" + strings i18n.
- [ ] **7. `WeeklyPlan`** — reconciliar contra consumos reales por día (últimos 7 días) o
      etiquetar explícitamente como proyección.
- [ ] **8. Verificación final** — `typecheck`, `lint`, `test`, coverage gates, `build`.

## Evidencia de commits

| WU | Commit | Resultado |
|----|--------|-----------|
| 1  |        |           |
| 2  |        |           |
| 3  |        |           |
| 4  |        |           |
| 5  |        |           |
| 6  |        |           |
| 7  |        |           |
| 8  |        |           |

## Notas

- `unitPer100G` se conserva como metadato de porción en `FoodItem` (sin consumidores hoy,
  candidato a feature futuro de porciones).
- Cobertura gateada por `openspec/config.yaml` (strict TDD): `calculations.ts`, `storage.ts`,
  `url.ts`. El nuevo `date.ts` se mantiene en 100% por política del feature.
