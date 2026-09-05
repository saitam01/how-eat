# Proposal: how-eat-food-search-redesign

> **Change ID:** `how-eat-food-search-redesign`
> **Status:** proposed
> **Source:** User request — restructure app into tabs + redesign food search for Chilean fitness foods
> **Created by:** SDD proposal on 2026-08-31
> **Last updated:** 2026-08-31

---

## TL;DR

Reestructura `how-eat` de una página única apilada a **dos pestañas**:

1. **Calculadora** — setear tu objetivo (formulario de inputs + resultado de TDEE/macros). Es la pantalla existente actual.
2. **Diario** — armar tus comidas (buscador de alimentos chilenos + meal log + progreso hacia los objetivos calculados).

Dentro de la pestaña Diario, se rediseña el buscador: base de datos de ~60 alimentos chilenos saludables altos en proteína, búsqueda instantánea sin botón, filtros por categoría, y stepper +/- en cada card para ajustar cantidad antes de agregar.

---

## Why (Problem & Context)

### Business problem

La app actual mete todo en una sola página: formulario, resultado, buscador de alimentos y meal log apilados en el panel derecho. Esto crea dos problemas:

1. **UX saturada** — el usuario ve demasiadas cosas a la vez. El buscador de alimentos está escondido debajo del resultado, no es intuitivo.
2. **Sin flujo guíado** — no hay separación clara entre "setear mi objetivo" y "armar mis comidas". El usuario no sabe qué viene primero.

Además, el buscador actual tiene:
- 30 alimentos genéricos, ninguno chileno ni orientado a fitness
- Requiere clic en "Buscar" para filtrar
- Sin selección de cantidad antes de agregar
- Componentes DaisyUI que no existen en el proyecto

### Current-state gap

- `src/App.tsx`: página única con `grid md:grid-cols-2`, food search y meal log en el panel derecho
- `src/components/FoodSearch.tsx`: form con botón, clases DaisyUI
- `src/components/FoodItemCard.tsx`: card básica sin stepper
- `src/lib/food-db.ts`: 30 alimentos genéricos

### User need

Un flujo de dos pasos:
1. "Seteo mi objetivo" → calculadora
2. "Armo mis comidas" → buscador + diario

---

## What Changes (Capabilities)

### 1. `app-tabs` — Navegación por pestañas

Reestructurar `src/App.tsx` con dos pestañas:

| Tab | Contenido | Cuándo mostrar |
|-----|-----------|----------------|
| **Calculadora** | CalculatorForm + MacroSliders + ResultCard + ShareButton + Disclaimer | Default al cargar |
| **Diario** | FoodSearch + MealLog + progreso hacia objetivos | Después de calcular |

- Pestañas con estilo consistente (shadcn/ui Tabs o botones custom)
- La pestaña Diario muestra el **progreso** de macros/calorías consumidas vs. el objetivo calculado
- Si no hay objetivo calculado, la pestaña Diario muestra un CTA "Primero calculá tu objetivo"
- Persistir la pestaña activa en `localStorage` para que al recargar quede en la misma

### 2. `food-database` — Base de datos chilena fitness

Reemplazar `src/lib/food-db.ts` con ~60 alimentos curados:

**Criterios de selección:**
- Disponibles en supermercados chilenos (Jumbo, Líder, Unicenter, ferias)
- Orientados a mejorar composición corporal (altos en proteína, buenos macros)
- Solo alimentos saludables (NO completos, empanadas, frituras)

| Categoría | Ejemplos |
|-----------|----------|
| Proteínas magras | Pechuga de pollo, peito de pavo, carne molida magra, atún, salmón, huevos, merluza, congrio, camarones |
| Frutas chilenas | Palta, frambuesa, arándano, chirimoya, Lúcuma, piña, papaya, manzana, plátano, naranja |
| Verduras chilenas | Zapallo, poroto verde, choclo, espinaca, betarraga, zanahoria, brócoli, lechuga, tomate |
| Legumbres/Granos | Lentejas, porotos, garbanzos, quinoa, avena, arroz integral |
| Lácteos | Yogurt griego, leche descremada, queso fresco, requesón |
| Grasas saludables | Palta, aceite de oliva, almendras, nueces, semillas de chía, semillas de linaza |

### 3. `food-search-ux` — Búsqueda instantánea + categorías

Rediseñar `src/components/FoodSearch.tsx`:
- **Búsqueda instantánea** (debounced 200ms, sin botón)
- **Filtros de categoría** con chips clickeables
- Usar **shadcn/ui** (Input, Button, Badge) en vez de DaisyUI
- Mantener `useFoodSearch.ts` pero agregar filtro por categoría

### 4. `food-item-stepper` — Stepper de cantidad en la card

Rediseñar `src/components/FoodItemCard.tsx`:
- **Stepper +/-** para ajustar cantidad (0.5 = 50g a 10 = 1000g, step 0.5)
- **Preview de macros** calculado para la cantidad seleccionada
- Botón "Agregar" que envía la cantidad ajustada
- Diseño con shadcn/ui (Button, Card)

### 5. `meal-log-progress` — Progreso en pestaña Diario

Mejorar `src/components/MealLog.tsx`:
- **Barras de progreso** prominentes para calorías y cada macro vs. objetivo
- **Totales del día** más visibles
- **Indicador** de déficit/exceso por macro

---

## Business Rules

### Pestañas
- Default: Calculadora
- La pestaña Diario requiere un objetivo calculado (si no hay, mostrar CTA)
- Persistir pestaña activa en `localStorage` (`how-eat:active-tab`)

### Base de datos
- Valores por 100g: energía (kcal), proteína (g), carbohidratos (g), grasa (g)
- `category: FoodCategory` obligatorio
- Solo alimentos disponibles en Chile y orientados a fitness

### Stepper
- Cantidad mínima: 0.5 (50g)
- Cantidad máxima: 10 (1000g)
- Step: 0.5
- Macros mostrados = valores por 100g × cantidad

### Búsqueda
- Debounce 200ms
- Filtros de categoría: "Todos" por defecto
- Búsqueda por nombre (normalización de tildes)
- Búsqueda por código de barra mantenida

---

## Edge Cases

- **Sin objetivo calculado** → pestaña Diario muestra "Calculá tu objetivo primero"
- **Sin resultados en búsqueda** → "No se encontraron alimentos" + sugerencia
- **Categoría vacía** → "No hay alimentos en esta categoría"
- **Cantidad decimal** → solo múltiplos de 0.5
- **Mismo alimento varias veces** → crea entradas separadas en meal log
- **Cambiar objetivo en Calculadora** → el progreso en Diario se actualiza automáticamente

---

## Impact

- **Archivos modificados:** `src/App.tsx`, `src/lib/food-db.ts`, `src/lib/types.ts`, `src/components/FoodSearch.tsx`, `src/components/FoodItemCard.tsx`, `src/components/MealLog.tsx`, `src/i18n/es.json`
- **Archivos sin cambios:** `src/hooks/useFoodSearch.ts`, `src/hooks/useMealLog.ts`, `src/hooks/useCalculator.ts`, `src/components/CalculatorForm.tsx`, `src/components/MacroSliders.tsx`, `src/components/ResultCard.tsx`, `src/components/ShareButton.tsx`, `src/components/Disclaimer.tsx`
- **Dependencias nuevas:** ninguna (shadcn/ui ya instalado)
- **Breaking changes:** `FoodItem.category` de `string | undefined` a `FoodCategory` obligatorio

---

## Out of Scope

- Base de datos externa (OpenFoodFacts, USDA)
- Historial de búsqueda frecuente
- IA para estimar macros
- Modo oscuro
- Múltiples perfiles de usuario

---

## Success Criteria

1. La app tiene dos pestañas navegables (Calculadora / Diario)
2. La pestaña Diario muestra progreso hacia el objetivo calculado
3. La base de datos tiene ≥50 alimentos chilenos saludables categorizados
4. La búsqueda funciona al escribir con debounce
5. Los filtros de categoría funcionan
6. El stepper +/- permite ajustar cantidad antes de agregar
7. Los macros se calculan correctamente para la cantidad
8. `tsc --noEmit` sin errores
9. Tests existentes pasan (con updates por `FoodItem.category`)
10. UI usa shadcn/ui, no DaisyUI

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Bundle crece por más alimentos | Baja | Baja | Datos estáticos, impacto mínimo |
| Tests rompen por category obligatoria | Media | Baja | Actualizar mocks en tests |
| Stepper confuso | Baja | Media | Label claro "cantidad (100g = 1 porción)" |
| Pestañas confusas en móvil | Baja | Media | Tabs responsivos, label claro |
| Usuario no entiende el flujo 1→2 | Baja | Media | CTA claro en Diario cuando no hay objetivo |
