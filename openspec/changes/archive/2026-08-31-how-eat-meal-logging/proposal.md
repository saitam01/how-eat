# Proposal: how-eat-meal-logging

> **Change ID:** `how-eat-meal-logging`
> **Status:** proposed (initial draft)
> **Source PRD:** `PRD.md` (repository root, v1.0, 2026-08-28) — out‑of‑scope items for v1 MVP
> **Created by:** el Gentleman (assistant) on 2026-08-31
> **Last updated:** 2026-08-31

---

## TL;DR

Este change agrega la capacidad de **registro diario de comidas** y **búsqueda de alimentos** a la aplicación `how-eat`. Permite al usuario buscar alimentos (por nombre o código de barra), registrar porciones, ver el total de macros y calorías consumidas en el día, y comparar con sus objetivos de TDEE y macros. La funcionalidad se construye sobre la base existente de cálculo de TDEE y macros, manteniendo el enfoque offline‑first y sin backend (usa una base de datos de alimentos empaquetada o un índice estático).

---

## Why (Problem & Context)

En el MVP v1 (`how-eat-mvp`) se excluieron intencionalmente características como el registro diario de comidas y la integración con bases de datos de alimentos (PRD §2). Sin embargo, muchos usuarios expresaron la necesidad de llevar un seguimiento de lo que realmente comen para ajustar su dieta a los objetivos calculados. Añadir esta característica transforma la herramienta de una simple calculadora en un asistente de nutrición básico, aumentando su valor y retención.

---

## What Changes (Capabilities)

Este change introduce dos capacidades principales:

1. **`food-search`** — Interfaz para buscar alimentos mediante nombre o código de barra, mostrando información macronutricional por porción (energia, proteína, carbohidratos, grasa). Utiliza un conjunto de datos estático empaquetado (por ejemplo, una versión reducida de OpenFoodFacts o USDB) para permitir búsqueda offline.

2. **`meal-logging`** — Diario de comidas donde el usuario puede agregar alimentos encontrados, seleccionar porciones (gramos, unidades, tazas), y ver acumulados diarios de energía y macros. El acumulado se compara con los objetivos de TDEE y macros calculados previamente, mostrando déficit/exceso.

### Supporting (non‑spec) scaffolding

- Actualización de `src/lib/constants.ts` para incluir factores de conversión de unidades de alimentos.
- Nuevos hooks: `useFoodSearch.ts`, `useMealLog.ts`.
- Componentes UI: `FoodSearch.tsx`, `MealLog.tsx`, `FoodItemCard.tsx`.
- Actualización de `src/types/index.ts` con nuevos tipos (`FoodItem`, `MealEntry`, `DailyTotals`).
- Persistencia opcional: el registro de comidas se guarda en `localStorage` bajo una clave versionada (p.e. `how-eat-meals:v1`).
- El resultado de la búsqueda puede guardarse como favoritos.

---

## Business Rules

- Cada alimento tiene valores por 100 g (o por unidad estándar) de energía (kcal), proteína (g), carbohidratos (g), grasa (g).
- Al registrar una porción, los macros se calculan proportionalmente.
- El diario muestra totales diarios y el porcentaje respecto al objetivo de TDEE y de cada macro (según la distribución actual del usuario).
- Si el usuario no tiene un objetivo de macro definido (por ejemplo, está en Personalizado), se muestra solo la energía.
- Los alimentos buscados se almacenan en un caché local para acceso rápido.

---

## Edge Cases

- Alimento no encontrado: mostrar mensaje y permitir intentar con otro término.
- Porción inválida o cero: bloquear registro y mostrar error.
- Límite de tamaño de la base de datos de alimentos: usar solo un subconjunto (por ejemplo, los 500 alimentos más comunes) para mantener el bundle bajo control.
- Formatos de código de barra: soportar EAN‑13 y UPC‑A; si no se tiene cámara, se ingresa manualmente.

---

## TDD / Test Vectors

Se escribirán pruebas unitarias para:

- `food-search`: búsqueda por nombre devuelve resultados esperados; búsqueda por código de barra devuelve el alimento correcto.
- `meal-logging`: agregar una entrada actualiza totales correctamente; eliminar una entrada resta los macros; el diario persiste en recarga.

Se buscará **90 % de cobertura** en los nuevos módulos de lib y hooks.

---

## Decisiones acordadas (basadas en revisión interactiva)

- **Base de datos de alimentos:** **Conjunto estático offline** (se incluirá un subconjunto empaquetado de alimentos para búsqueda totalmente offline).
- **Unidad de porción predeterminada:** **100 g (estándar nutricional)** como unidad base para todos los alimentos.
- **Visualización del progreso diario:** **Barras de progreso** para energía y cada macro, indicando porcentaje alcanzado.

---

## Open Questions / Risks

- **Tamaño de la base de datos de alimentos**: mantenerla pequeña para no afectar el bundle; considerar carga diferida o partición.
- **Precisión de los datos**: depender de la calidad del dataset empaquetado; incluir aviso de que los valores son estimaciones.
- **Interfaz de entrada de código de barra**: sin cámara, depende de entrada manual; considerar futuro soporte de cámara mediante API del navegador (requiere HTTPS).

---
