# Food Search UX Specification

## Purpose

Defines the redesigned food search interface: instant search-as-you-type, category filters, and shadcn/ui components replacing the current DaisyUI classes.

Source: `proposal.md` (food-search-ux capability).

## Requirements

### Requirement: Instant search (no button)

The search MUST trigger automatically as the user types, with a debounce of 200ms. There MUST NOT be a "Buscar" button.

#### Scenario: Type to search

- GIVEN the food search is visible
- WHEN the user types "pollo"
- THEN results SHALL appear after ≤ 200ms debounce
- AND no search button SHALL be present

### Requirement: Category filter chips

The search MUST display category filter chips above the results: "Todos", "Proteínas", "Frutas", "Verduras", "Legumbres", "Lácteos", "Grasas", "Granos", "Snacks".

- "Todos" is active by default
- Clicking a chip filters results to that category
- Only one category can be active at a time
- Active chip has distinct visual style

#### Scenario: Filter by protein

- GIVEN the search shows results for "pollo"
- WHEN the user clicks "Proteínas" chip
- THEN only foods with `category === 'protein'` SHALL be shown

#### Scenario: Back to all

- GIVEN a category filter is active
- WHEN the user clicks "Todos"
- THEN all matching results SHALL be shown regardless of category

### Requirement: shadcn/ui components

The search MUST use shadcn/ui components:
- `Input` for the search field
- `Badge` or styled buttons for category chips
- `Card` for the overall container

MUST NOT use DaisyUI classes (`btn`, `input`, `alert`, etc.).

#### Scenario: No DaisyUI

- GIVEN the FoodSearch component
- WHEN its source is inspected
- THEN no DaisyUI class names SHALL be present

### Requirement: Search by name with diacritics normalization

The search MUST normalize diacritics (á → a, ñ → n, etc.) so searching "avena" finds "Avena" and searching "peito" finds "Peito de pavo".

#### Scenario: Diacritics search

- GIVEN foods with names containing tildes
- WHEN the user types without tildes
- THEN matching results SHALL still appear

### Requirement: Barcode search preserved

The existing barcode search (EAN-13/UPC-A) MUST be preserved. When the query is a valid barcode, search by ID.

#### Scenario: Barcode search

- GIVEN a food with id "7501055300014"
- WHEN the user types "7501055300014"
- THEN that food SHALL appear in results

### Requirement: Empty state

When no results match, show a friendly message: "No se encontraron alimentos para '{query}'".

#### Scenario: No results

- GIVEN the user types "xyz123"
- WHEN results are empty
- THEN the message "No se encontraron alimentos para 'xyz123'" SHALL be shown

### Requirement: Loading state

While the food database is loading (if async), show a loading indicator.

#### Scenario: Loading

- GIVEN the database is loading
- WHEN the search is rendered
- THEN a loading spinner or skeleton SHALL be shown

### Requirement: Accessible search field

The search input MUST have:
- An associated `<label>` or `aria-label`
- Placeholder text: "Buscar alimentos..."
- `aria-describedby` for results count

#### Scenario: Screen reader

- GIVEN the search input
- WHEN queried for accessible name
- THEN it SHALL resolve to "Buscar alimentos..."

---

## Edge Cases

- **Rapid typing** → debounce prevents excessive searches
- **Empty query** → show no results or recent foods (future)
- **Special characters** → normalize and ignore
- **Very long query** → truncate or ignore beyond reasonable length

## Acceptance Criteria

- [ ] Search triggers on type with 200ms debounce
- [ ] No "Buscar" button present
- [ ] Category chips filter correctly
- [ ] "Todos" resets category filter
- [ ] shadcn/ui components used (no DaisyUI)
- [ ] Diacritics normalized in search
- [ ] Barcode search works
- [ ] Empty state shows friendly message
- [ ] Accessible labels present
- [ ] `tsc --noEmit` passes

## Risks

- Category chips may take too much vertical space on mobile — mitigate with horizontal scroll or wrapping.
