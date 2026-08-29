# PRD: Calculadora Local de Consumo Calórico (TDEE + Macros)

> **Proyecto:** `how-eat` — Página estática local para cálculo de gasto energético y objetivos de macronutrientes  
> **Versión:** 1.0 (MVP)  
> **Fecha:** 2026-08-28  
> **Autor:** el Gentleman + usuario

---

## 1. Resumen Ejecutivo

Una **página web estática, offline-first, single-page** que permite a cualquier persona calcular su **TDEE (Gasto Energético Total Diario)** y **objetivos de macronutrientes** ingresando sus datos antropométricos, nivel de actividad y objetivo (mantener, bajar, subir). Cero backend, cero dependencias de cálculo, instalable como archivo HTML único o servida con `vite preview`.

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui (copy-paste) + lucide-react (iconos)  
**Deploy:** `npm run build` → carpeta `dist/` lista para GitHub Pages, Netlify, Vercel, o `file://` directo.

---

## 2. Alcance (MVP v1)

### ✅ Incluido

- Formulario de entrada: sexo, edad, altura, peso, % grasa corporal (opcional), nivel de actividad, objetivo
- Cálculo **BMR** (Mifflin-St Jeor + Katch-McArdle si hay % grasa)
- Cálculo **TDEE** (multiplicadores de actividad estándar)
- Objetivo calórico: mantenimiento / déficit (-20% / -15% / -10%) / superávit (+10% / +15% / +20%)
- **Distribución de macros** con sliders interactivos (proteína / carbohidratos / grasa) + presets (Estándar, Alta Proteína, Keto, Zone, Personalizado)
- Resultado visible: calorías objetivo + gramos por macro + desglose calórico
- Validación de entradas (rangos realistas, tooltips explicativos)
- Persistencia en `localStorage` (último cálculo)
- Compartir resultado (URL con query params + botón copiar)
- Accesibilidad básica (labels, ARIA, contraste, navegación teclado)
- Responsive: móvil ≥ 375px, desktop ≥ 1024px

### ❌ Fuera de alcance (v2+)

- Registro diario de comidas / buscador de alimentos
- Base de datos de alimentos chilenos / OpenFoodFacts
- Historial de peso / gráficos de progreso
- PWA / Service Worker
- Export CSV / PDF
- Múltiples perfiles de usuario
- Modo oscuro (solo light theme v1)
- Tests E2E (unitarios de fórmulas sí)

---

## 3. Usuario Objetivo

| Perfil | Necesidad | Prioridad |
| -------- | ----------- | ----------- |
| **Persona activa recreacional** | Saber cuánto comer para mantener/bajar/subir sin apps complejas | Alta |
| **Deportista amateur** | Ajustar macros según entreno, usar Katch-McArdle con % grasa | Media |
| **Nutricionista / Coach** | Herramienta rápida para estimar punto de partida con pacientes | Baja |

**No objetivo:** Reemplazar consulta profesional. Incluye disclaimer visible.

---

## 4. Especificación Funcional

### 4.1 Entradas (Formulario)

| Campo | Tipo | Rango / Opciones | Default | Validación |
| ------- | ------ | ------------------ | --------- | ------------ |
| Sexo | Radio | `male` \| `female` | `male` | Requerido |
| Edad | Number | 10–100 | 30 | Entero, ≥10 ≤100 |
| Altura | Number (cm) | 100–250 | 175 | Entero, cm |
| Peso | Number (kg) | 30–300 | 75 | Decimal 0.1, kg |
| % Grasa corporal | Number (opcional) | 3–60 | — | Decimal 0.1, habilita Katch-McArdle |
| Nivel de actividad | Select | `sedentary` (1.2), `light` (1.375), `moderate` (1.55), `very` (1.725), `extra` (1.9) | `moderate` | Requerido |
| Objetivo | Radio | `maintain` (0%), `lose_mild` (-10%), `lose` (-15%), `lose_aggressive` (-20%), `gain_mild` (+10%), `gain` (+15%), `gain_aggressive` (+20%) | `maintain` | Requerido |

**Tooltips** en cada campo: fórmulas usadas, referencias, cómo medir % grasa.

### 4.2 Cálculos (Motor Matemático — `src/lib/calculations.ts`)

```typescript
// Tipos
type Sex = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
type Goal = 'maintain' | 'lose_mild' | 'lose' | 'lose_aggressive' | 'gain_mild' | 'gain' | 'gain_aggressive';

interface Inputs {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;     // opcional
  activity: ActivityLevel;
  goal: Goal;
}

interface Macros {
  proteinPct: number;   // % calorías
  carbsPct: number;
  fatPct: number;
}

interface Result {
  bmr: number;           // kcal/día
  tdee: number;          // kcal/día
  targetCalories: number;// kcal/día (TDEE ajustado por goal)
  macros: {
    protein: { grams: number; calories: number; pct: number };
    carbs:   { grams: number; calories: number; pct: number };
    fat:     { grams: number; calories: number; pct: number };
  };
  formulaUsed: 'mifflin' | 'katch-mcardle';
}
```

**Fórmulas:**

```typescript
// BMR Mifflin-St Jeor (gold standard población general)
function bmrMifflin({sex, weightKg, heightCm, age}: Inputs): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

// BMR Katch-McArdle (si se conoce % grasa → LBM)
function bmrKatchMcArdle({weightKg, bodyFatPct}: Inputs): number {
  const lbm = weightKg * (1 - bodyFatPct / 100); // masa magra kg
  return 370 + 21.6 * lbm;
}

// TDEE = BMR × multiplicador
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

// Goal adjustment
const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  maintain: 0,
  lose_mild: -0.10,
  lose: -0.15,
  lose_aggressive: -0.20,
  gain_mild: 0.10,
  gain: 0.15,
  gain_aggressive: 0.20,
};

// Macros: calorías → gramos (4/4/9)
function caloriesToGrams(calories: number, pct: number, kcalPerGram: number): number {
  return Math.round((calories * pct / 100) / kcalPerGram);
}
```

**Lógica de selección de fórmula:**

- Si `bodyFatPct` presente y válido → Katch-McArdle (más preciso para atletas)
- Sino → Mifflin-St Jeor

### 4.3 Distribución de Macros (Sliders + Presets)

| Preset | Proteína | Carbohidratos | Grasa |
| -------- | ---------- | --------------- | ------- |
| **Estándar** | 30% | 40% | 30% |
| **Alta Proteína** | 40% | 30% | 30% |
| **Keto** | 20% | 5% | 75% |
| **Zone** | 30% | 40% | 30% |
| **Personalizado** | Slider | Slider | Slider (auto-suma 100%) |

**UI Sliders:**

- 3 sliders vinculados: mover uno redistribuye proporcionalmente en los otros dos
- Botón "Resetear a preset"
- Validación visual: suma = 100% (badge verde/rojo)

### 4.4 Salida (Resultado)

Tarjeta de resultado con:

- **Calorías objetivo** (grande, prominente)
- **BMR** y **TDEE** (texto menor, informativo)
- **Tabla de macros**: 3 filas × 3 columnas (Macro | Gramos | Calorías | %)
- **Desglose visual**: 3 barras de progreso horizontales (proteína/carbs/grasa)
- **Botones**: "Copiar enlace", "Resetear formulario"

### 4.5 Persistencia y Compartir

- `localStorage.key = 'how-eat:v1'` → guarda `Inputs + Macros` (JSON)
- Al cargar: hidratar formulario si existe
- **Compartir**: `window.location.origin + '?' + new URLSearchParams(inputs).toString()`
- URL compartible recrea el estado exacto al abrir

---

## 5. Especificación No Funcional

| Atributo | Requisito |
| ---------- | ----------- |
| **Rendimiento** | FCP < 1.5s, TTI < 2.5s en móvil 3G simulado; bundle JS < 50KB gzipped |
| **Accesibilidad** | WCAG 2.1 AA: contraste ≥4.5:1, focus visible, labels asociados, ARIA live en resultado |
| **Navegadores** | Chrome/Edge/Firefox/Safari últimos 2 versiones (ES2022) |
| **Offline** | Funciona 100% offline tras primera carga (sin SW, solo archivos estáticos) |
| **Seguridad** | Sin red, sin eval, sin innerHTML dinámico, CSP estricto en `index.html` |
| **Internacionalización** | Español (Rioplatense neutro) v1; i18n-ready (claves en `src/i18n/es.json`) |
| **Mantenibilidad** | ESLint + Prettier + TypeScript strict; fórmulas en `src/lib/` puras y testeables |

---

## 6. Arquitectura Técnica

```
how-eat/
├── index.html              # Entrada, CSP, meta tags
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx            # Bootstrap React
│   ├── App.tsx             # Componente raíz
│   ├── index.css           # Tailwind imports + custom CSS vars
│   ├── lib/
│   │   ├── calculations.ts # Fórmulas puras (exportadas, testeables)
│   │   ├── constants.ts    # Multiplicadores, presets, labels
│   │   ├── storage.ts      # localStorage helpers (get/set/clear)
│   │   └── url.ts          # serialize/parse query params
│   ├── components/
│   │   ├── ui/             # shadcn/ui copiados (button, input, label, select, slider, card, separator, tooltip)
│   │   ├── CalculatorForm.tsx
│   │   ├── MacroSliders.tsx
│   │   ├── ResultCard.tsx
│   │   ├── ShareButton.tsx
│   │   └── Disclaimer.tsx
│   ├── hooks/
│   │   ├── useCalculator.ts   # Orquesta inputs → result (memo)
│   │   └── useLocalStorage.ts # Hook genérico
│   ├── i18n/
│   │   └── es.json
│   └── types/
│       └── index.ts
└── tests/
    └── calculations.test.ts  # Vitest: fórmulas + edge cases
```

**Flujo de datos:**

```
URL params / localStorage
         ↓
   useCalculator hook (derive result)
         ↓
   CalculatorForm → MacroSliders → ResultCard
         ↓              ↓
   localStorage    URL share
```

---

## 7. UI / UX Detallado

### 7.1 Layout (Single Page)

```
┌─────────────────────────────────────────────────────────────┐
│  Header: logo + título "how-eat" + subtitle                │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                          │
│  PANEL IZQUIERDO │  PANEL DERECHO (sticky en desktop)       │
│  (formulario)    │                                          │
│                  │  ┌────────────────────────────────────┐  │
│  ┌────────────┐  │  │  RESULTADO                         │  │
│  │ Datos      │  │  │  🔥 2,450 kcal/día                 │  │
│  │ personales │  │  ├────────────────────────────────────┤  │
│  ├────────────┤  │  │  BMR: 1,680  |  TDEE: 2,604        │  │
│  │ Actividad  │  │  ├────────────────────────────────────┤  │
│  │ Objetivo   │  │  │  MACROS                            │  │
│  └────────────┘  │  │  ┌─────────┬───────┬────────┬────┐  │
│                  │  │  │ Proteína│ 184g  │  736k  │ 30%│  │
│  ┌────────────┐  │  │  │ Carbs   │ 245g  │  980k  │ 40%│  │
│  │ % Grasa    │  │  │  │ Grasa   │  82g  │  736k  │ 30%│  │
│  │ (opcional) │  │  │  └─────────┴───────┴────────┴────┘  │
│  └────────────┘  │  ├────────────────────────────────────┤  │
│                  │  │  [████████░░] Proteína  30%         │
│  ┌────────────┐  │  │  [████████████] Carbs      40%       │
│  │ Macros     │  │  │  [████████░░] Grasa       30%        │
│  │ (presets + │  │  ├────────────────────────────────────┤  │
│  │  sliders)  │  │  │  [Copiar enlace]  [Resetear]       │  │
│  └────────────┘  │  └────────────────────────────────────┘  │
│                  │                                          │
│  Disclaimer      │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

**Breakpoints:**

- `< 768px`: Paneles apilados (formulario arriba, resultado abajo)
- `≥ 768px`: Side-by-side, panel derecho `position: sticky; top: 1.5rem`

### 7.2 Componentes shadcn/ui a copiar

| Componente | Archivo origen shadcn | Uso |
| ------------ | ---------------------- | ----- |
| `Button` | `button.tsx` | Resetear, Copiar enlace |
| `Input` | `input.tsx` | Edad, altura, peso, % grasa |
| `Label` | `label.tsx` | Todos los labels |
| `Select` | `select.tsx` | Nivel actividad |
| `RadioGroup` | `radio-group.tsx` | Sexo, Objetivo |
| `Slider` | `slider.tsx` | Macros personalizados (3x) |
| `Card` | `card.tsx` | Resultado, Disclaimer |
| `Separator` | `separator.tsx` | Divisores visuales |
| `Tooltip` | `tooltip.tsx` | Ayuda en cada campo |
| `Toast` | `toast.tsx` | "Enlace copiado" |

**Copiar desde:** `https://ui.shadcn.com/docs/components/` → pegar en `src/components/ui/` ajustando imports a `@/lib/utils` (cn helper).

### 7.3 Estilos / Tailwind

- Paleta: `slate` (neutro) + `emerald` (acento primario) + `amber` (advertencia) + `rose` (error)
- Tipografía: `Inter` (variable font, self-hosted en `public/fonts/`)
- Espaciado: escala 4px (Tailwind default)
- Radio: `rounded-lg` (tarjetas), `rounded-md` (inputs), `rounded-full` (botones)
- Sombras: `shadow-sm` (cards), `shadow-md` (sticky panel)

---

## 8. Validación y Manejo de Errores

| Escenario | Comportamiento |
| ----------- | ---------------- |
| Campo vacío requerido | Deshabilitar cálculo, mostrar inline error al blur/submit |
| Valor fuera de rango | Clamp silencioso al límite + toast informativo |
| % macros ≠ 100% | Badge rojo "Suma 97%" + deshabilitar compartir |
| localStorage corrupto | `try/catch` → limpiar y usar defaults |
| URL params inválidos | Ignorar, cargar defaults + toast "Parámetros inválidos" |

---

## 9. Testing (Mínimo v1)

| Qué | Herramienta | Cobertura objetivo |
| ----- | ------------- | ------------------- |
| Fórmulas (BMR, TDEE, macros, edge cases) | Vitest | 100% `src/lib/calculations.ts` |
| Helpers storage/url | Vitest | 90% |
| Render smoke test | Vitest + React Testing Library | App monta sin error |
| TypeScript | `tsc --noEmit` | 0 errores |

**No v1:** E2E (Playwright), visual regression, performance budgets automatizados.

---

## 10. Hitos y Entregables

| Hito | Descripción | Criterio de aceptación |
| ------ | ------------- | ------------------------ |
| **H1: Setup** | `npm create vite@latest how-eat -- --template react-ts` + Tailwind + shadcn/ui copiados | `npm run dev` levanta, `npm run build` genera `dist/` |
| **H2: Motor** | `src/lib/calculations.ts` + tests | Tests pasan, fórmulas validadas vs calculadoras de referencia |
| **H3: Formulario** | `CalculatorForm` + validación + localStorage | Persiste y restaura al recargar |
| **H4: Macros UI** | `MacroSliders` con presets + sliders vinculados | Suma siempre 100%, preset aplica instantáneo |
| **H5: Resultado** | `ResultCard` + `ShareButton` | URL compartida recrea estado exacto |
| **H6: Polish** | Accesibilidad, responsive, disclaimer, favicon, meta tags | Lighthouse ≥90 en todas las categorías |
| **H7: Deploy** | GitHub Pages / Netlify / Vercel | URL pública funcional |

---

## 11. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
| -------- | -------------- | --------- | ------------ |
| Fórmula Katch-McArdle con % grasa inválido | Media | Medio | Validar rango 3–60, fallback a Mifflin |
| Sliders macros desincronizados | Baja | Alto | Usar estado derivado único (un solo source of truth) |
| Bundle > 50KB gzipped | Baja | Medio | `vite build --mode analyze`, tree-shaking, solo iconos usados |
| localStorage lleno / bloqueado | Muy baja | Bajo | `try/catch`, fallback a estado en memoria |

---

## 12. Referencias y Fuentes

- **Mifflin MD et al.** "A new predictive equation for resting energy expenditure in healthy individuals." *Am J Clin Nutr* 1990.
- **Katch FI, McArdle WD.** "Prediction of body density from simple anthropometric measurements." *Med Sci Sports Exerc* 1973.
- **USDA FoodData Central** — referencia composicional (para v2).
- **OpenFoodFacts** — API y dump SQLite (para v2 códigos de barra).
- **shadcn/ui** — Componentes accesibles copy-paste.
- **Guía Alimentaria para la Población Argentina / Chilena** — porciones y alimentos base (para v2 JSON curado).

---

## 13. Aprobación

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Product Owner | (usuario) | | |
| Tech Lead | el Gentleman | | |

---

> **Nota:** Este PRD es documento vivo. Cambios se registran en `CHANGELOG.md` y requieren re-aprobación si alteran alcance v1.
