# Food Database Specification

## Purpose

Defines the Chilean fitness-oriented food database that replaces the current 30 generic foods. Every food is available in Chilean supermarkets and selected for supporting body composition goals (high protein, good macros).

Source: `proposal.md` (food-database capability).

## Food Categories

```typescript
type FoodCategory =
  | 'protein'      // Proteínas magras
  | 'fruit'        // Frutas chilenas
  | 'vegetable'    // Verduras chilenas
  | 'legume'       // Legumbres y granos
  | 'dairy'        // Lácteos
  | 'fat'          // Grasas saludables
  | 'grain'        // Granos y cereales
  | 'snack';       // Snacks fitness
```

## Requirements

### Requirement: Category required on every food

Every `FoodItem` in the database MUST have a non-empty `category` field of type `FoodCategory`.

#### Scenario: All items categorized

- GIVEN the food database
- WHEN any item is inspected
- THEN it SHALL have a valid `category` value

### Requirement: Chilean availability

All foods MUST be available in Chilean supermarkets (Jumbo, Líder, Unicenter, ferias) or are common Chilean produce.

#### Scenario: Chilean food

- GIVEN a food item
- WHEN checked for availability
- THEN it SHALL be purchasable in Chile

### Requirement: Fitness orientation

All foods SHOULD be oriented toward body composition improvement: high protein, good micronutrient density, or healthy fats. Junk food, ultra-processed foods, and typical Chilean fast food (completos, empanadas, sopaipillas) MUST be excluded.

#### Scenario: No junk food

- GIVEN the food database
- WHEN reviewed
- THEN no item SHALL be a fast food, ultra-processed, or low-nutrient-density food

### Requirement: Minimum food count

The database MUST contain at least 50 unique foods.

#### Scenario: Database size

- GIVEN the food database
- WHEN counted
- THEN it SHALL have ≥ 50 items

### Requirement: Required nutrients per 100g

Every food MUST provide values per 100g (or per unit with `unitPer100G`): `energyKcal`, `proteinG`, `carbsG`, `fatG`.

#### Scenario: Nutrients present

- GIVEN a food item
- WHEN inspected
- THEN all four nutrient fields SHALL be present and numeric

### Requirement: Categories with minimum items

Each category SHOULD have at least 5 foods to ensure useful filtering.

#### Scenario: Category coverage

- GIVEN the food database
- WHEN grouped by category
- THEN each category SHALL have ≥ 5 items

## Target Foods by Category

### Proteínas magras (`protein`)
Pechuga de pollo, peito de pavo, carne molida magra (95/5), atún en agua, salmón fresco, huevos, merluza, congrio, camarones, lomo de cerdo magro, carne vacuna mongolia

### Frutas chilenas (`fruit`)
Palta (aguacate), frambuesa, arándano (blueberry), chirimoya, lúcuma, piña, papaya, manzana, plátano, naranja, durazno, cereza, mandarina

### Verduras chilenas (`vegetable`)
Zapallo (calabaza), poroto verde (chauchas), choclo (elote), espinaca, betarraga (remolacha), zanahoria, brócoli, lechuga, tomate, palmitos, apio, cebolla, pimentón

### Legumbres y granos (`legume`)
Lentejas cocidas, porotos cocidos, garbanzos cocidos, quinoa cocida, avena en hojuelas, arroz integral cocido, porotos negros

### Lácteos (`dairy`)
Yogurt griego natural, leche descremada, queso fresco, requesón, leche de soya, yogur natural

### Grasas saludables (`fat`)
Palta (aguacate), aceite de oliva, almendras, nueces, semillas de chía, semillas de linaza, maní, crema de maní natural

### Grains (`grain`)
Pan integral, avena en hojuelas, arroz integral, quinoa seca, fideos integrales, tortilla de harina integral

### Snacks fitness (`snack`)
Barra de proteína, frutos secos mixtos, galletas de avena, shakes de proteína (polvo), semillas de girasol

---

## TDD / Test Vectors

| Test | Input | Expected |
|------|-------|----------|
| Database has ≥ 50 items | `foodDB.items.length` | `>= 50` |
| All items have category | every item | `item.category` is valid FoodCategory |
| No junk food | all items | no completos, empanadas, sopaipillas, etc. |
| Protein items have ≥ 15g protein per 100g | protein category | `proteinG >= 15` for most items |
| Chilean fruits present | fruit category | includes palta, frambuesa, Lúcuma, chirimoya |

## Acceptance Criteria

- [ ] ≥ 50 foods in database
- [ ] Every food has a valid `category`
- [ ] All foods available in Chile
- [ ] No junk food or ultra-processed items
- [ ] Each category has ≥ 5 items
- [ ] All nutrients present per 100g
- [ ] Tests pass

## Risks

- Nutritional data accuracy — using approximate values from Chilean food tables and USDA data cross-referenced. Documented as estimates.
