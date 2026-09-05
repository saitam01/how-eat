import { FoodItem } from './types';

/**
 * Convert a FoodItem's nutrients to per 100g basis.
 * If the item already uses unit '100g' or lacks unitPer100G, returns a shallow copy.
 * Otherwise, multiplies energyKcal, proteinG, carbsG, fatG by unitPer100G
 * and sets unit to '100g' and unitPer100G to 1 for consistency.
 */
export function convertToPer100g(item: FoodItem): FoodItem {
  // If unit is already 100g or missing, or unitPer100G not provided, assume per 100g.
  if (!item.unit || item.unit === '100g' || !item.unitPer100G) {
    return { ...item };
  }
  const factor = item.unitPer100G;
  return {
    ...item,
    energyKcal: item.energyKcal * factor,
    proteinG: item.proteinG * factor,
    carbsG: item.carbsG * factor,
    fatG: item.fatG * factor,
    // After conversion, treat as per 100g
    unit: '100g',
    unitPer100G: 1,
  };
}
