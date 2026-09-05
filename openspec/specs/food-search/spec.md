# Food Search Specification

## Purpose

Defines the food search capability (`FoodSearch.tsx`) that allows users to query a packaged food database by name or barcode, returning macronutrient information per 100 g (or per standard unit). The search is offline‑first, using a static dataset bundled with the app.

Source: PRD §2 (out‑of‑scope v1), proposal decisions (static dataset, 100 g default unit).

## Types

```typescript
type FoodId = string; // e.g., barcode or internal ID
type FoodName = string;
type Brand = string;
type Category = string;

interface FoodItem {
  id: FoodId;
  name: FoodName;
  brand?: Brand;
  category?: Category;
  // Nutrients per 100 g (or per unit if unit != '100g')
  energyKcal: number; // kcal
  proteinG: number; // grams
  carbsG: number; // grams
  fatG: number; // grams
  unit?: string; // e.g., '100g', 'piece', 'cup' – default '100g'
  unitPer100G?: number; // conversion factor if unit != '100g' (how many units per 100 g)
}
```

## Requirements

### Requirement: Search by name

The system MUST provide a text input that accepts a food name (or partial name) and returns a list of matching foods sorted by relevance.

#### Scenario: Exact match

- GIVEN the food database contains an entry `{id: '001', name: 'Manzana', energyKcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2}`
- WHEN the user searches for `"manzana"`
- THEN the result list SHALL include the apple entry as the top result.

#### Scenario: Partial match

- GIVEN the database contains `"Arroz integral"` and `"Arroz blanco"`
- WHEN the user searches for `"Arroz"`
- THEN both entries SHALL appear in the result list.

### Requirement: Search by barcode

The system MUST accept a numeric barcode (EAN‑13 or UPC‑A) and return the exact food item if present.

#### Scenario: Barcode match

- GIVEN a food item with `id: '7501055300014'` (example barcode)
- WHEN the user enters that barcode
- THEN the result SHALL be that single item.

#### Scenario: Barcode not found

- GIVEN no item with the given barcode
- WHEN the user searches
- THEN the system SHALL show a “No encontrado” message.

### Requirement: Display nutrients per 100 g

Each search result MUST show the energy (kcal), protein (g), carbs (g), and fat (g) per 100 g (or per the displayed unit if different).

#### Scenario: Unit conversion

- GIVEN a food item with `unit: 'piece'` and `unitPer100G: 2` (i.e., 2 pieces = 100 g) and nutrients per piece: `energyKcal: 80`
- WHEN displayed
- THEN the shown values SHALL be per 100 g (i.e., `energyKcal: 160`) unless the UI opts to show per piece; the spec assumes per 100 g for consistency.

### Requirement: Loading and error states

While the search query is in progress, a loading indicator MUST be shown. If the static dataset fails to load, an error message MUST be displayed.

#### Scenario: Dataset load failure

- GIVEN the bundled food JSON is corrupt
- WHEN the app loads
- THEN an error toast SHALL appear and search SHALL be disabled.

## Edge Cases (from proposal)

- **Dataset size**: limited to a subset (e.g., 500 most common foods) to control bundle size.
- **Data quality**: values are estimations; disclaimer may be shown.
- **Barcode entry without camera**: user can type numbers manually; validation ensures correct length (12 or 13 digits) and numeric only.
- **No results**: show informative message and allow refining query.

## TDD / Test Vectors

Unit tests in `tests/food-search.test.ts` MUST cover:

- Name search exact and partial matches return expected items.
- Barcode search returns correct item or null.
- Nutrient values are correctly exposed (per 100 g).
- Loading and error states are handled.
- Search is case‑insensitive and ignores diacritics (optional).

Coverage target: **90 %** for `src/lib/food-db.ts` (if created) and `src/hooks/useFoodSearch.ts`.

## Acceptance Criteria

- [ ] Search by name returns relevant results.
- [ ] Search by barcode returns exact match or not‑found.
- [ ] Nutrient values are displayed correctly per 100 g.
- [ ] Loading and error states are handled appropriately.
- [ ] The static food bundle is limited to the agreed size (e.g., ≤ 500 entries) to keep bundle impact minimal.

## Risks

- **Bundle growth**: mitigated by limiting dataset size and considering lazy‑loading of chunks if needed.
- **User expectation of real‑time data**: addressed by disclaimer that data is estimations and offline‑first.
