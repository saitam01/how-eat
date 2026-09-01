import type { FoodItem } from './types';

const foodItems: FoodItem[] = [
  // ─── Proteínas magras ───────────────────────────────────────
  { id: 'p01', name: 'Pechuga de pollo', category: 'protein', energyKcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, unit: '100g' },
  { id: 'p02', name: 'Peito de pavo', category: 'protein', energyKcal: 104, proteinG: 22, carbsG: 0, fatG: 2, unit: '100g' },
  { id: 'p03', name: 'Carne molida magra (95/5)', category: 'protein', energyKcal: 137, proteinG: 21, carbsG: 0, fatG: 5, unit: '100g' },
  { id: 'p04', name: 'Atún en agua', category: 'protein', energyKcal: 82, proteinG: 19, carbsG: 0, fatG: 1.4, unit: '100g' },
  { id: 'p05', name: 'Salmón fresco', category: 'protein', energyKcal: 206, proteinG: 22, carbsG: 0, fatG: 12, unit: '100g' },
  { id: 'p06', name: 'Huevo', category: 'protein', energyKcal: 155, proteinG: 13, carbsG: 1.1, fatG: 11, unit: '100g' },
  { id: 'p07', name: 'Huevo (pieza)', category: 'protein', energyKcal: 78, proteinG: 6.5, carbsG: 0.6, fatG: 5.5, unit: 'pieza', unitPer100G: 2 },
  { id: 'p08', name: 'Merluza', category: 'protein', energyKcal: 86, proteinG: 18, carbsG: 0, fatG: 1, unit: '100g' },
  { id: 'p09', name: 'Congrio', category: 'protein', energyKcal: 129, proteinG: 17, carbsG: 0, fatG: 6.5, unit: '100g' },
  { id: 'p10', name: 'Camarones', category: 'protein', energyKcal: 99, proteinG: 24, carbsG: 0.2, fatG: 0.3, unit: '100g' },
  { id: 'p11', name: 'Lomo de cerdo magro', category: 'protein', energyKcal: 143, proteinG: 26, carbsG: 0, fatG: 3.5, unit: '100g' },
  { id: 'p12', name: 'Carne vacuna mongolia', category: 'protein', energyKcal: 150, proteinG: 23, carbsG: 0, fatG: 6, unit: '100g' },

  // ─── Frutas chilenas ────────────────────────────────────────
  { id: 'f01', name: 'Palta (aguacate)', category: 'fruit', energyKcal: 160, proteinG: 2, carbsG: 9, fatG: 15, unit: '100g' },
  { id: 'f02', name: 'Frambuesa', category: 'fruit', energyKcal: 52, proteinG: 1.2, carbsG: 12, fatG: 0.7, unit: '100g' },
  { id: 'f03', name: 'Arándano (blueberry)', category: 'fruit', energyKcal: 57, proteinG: 0.7, carbsG: 14, fatG: 0.3, unit: '100g' },
  { id: 'f04', name: 'Chirimoya', category: 'fruit', energyKcal: 75, proteinG: 1.7, carbsG: 18, fatG: 0.3, unit: '100g' },
  { id: 'f05', name: 'Lúcuma', category: 'fruit', energyKcal: 98, proteinG: 1.5, carbsG: 22, fatG: 0.4, unit: '100g' },
  { id: 'f06', name: 'Piña', category: 'fruit', energyKcal: 50, proteinG: 0.5, carbsG: 13, fatG: 0.1, unit: '100g' },
  { id: 'f07', name: 'Papaya', category: 'fruit', energyKcal: 43, proteinG: 0.5, carbsG: 11, fatG: 0.3, unit: '100g' },
  { id: 'f08', name: 'Manzana', category: 'fruit', energyKcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, unit: '100g' },
  { id: 'f09', name: 'Plátano', category: 'fruit', energyKcal: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, unit: '100g' },
  { id: 'f10', name: 'Naranja', category: 'fruit', energyKcal: 47, proteinG: 0.9, carbsG: 12, fatG: 0.1, unit: '100g' },
  { id: 'f11', name: 'Durazno', category: 'fruit', energyKcal: 39, proteinG: 0.9, carbsG: 10, fatG: 0.3, unit: '100g' },
  { id: 'f12', name: 'Cereza', category: 'fruit', energyKcal: 50, proteinG: 1, carbsG: 12, fatG: 0.3, unit: '100g' },
  { id: 'f13', name: 'Mandarina', category: 'fruit', energyKcal: 53, proteinG: 0.8, carbsG: 13, fatG: 0.3, unit: '100g' },

  // ─── Verduras chilenas ──────────────────────────────────────
  { id: 'v01', name: 'Zapallo (calabaza)', category: 'vegetable', energyKcal: 26, proteinG: 1, carbsG: 6.5, fatG: 0.1, unit: '100g' },
  { id: 'v02', name: 'Poroto verde (chauchas)', category: 'vegetable', energyKcal: 31, proteinG: 1.8, carbsG: 7, fatG: 0.1, unit: '100g' },
  { id: 'v03', name: 'Choclo (elote)', category: 'vegetable', energyKcal: 86, proteinG: 3.3, carbsG: 19, fatG: 1.4, unit: '100g' },
  { id: 'v04', name: 'Espinaca', category: 'vegetable', energyKcal: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, unit: '100g' },
  { id: 'v05', name: 'Betarraga (remolacha)', category: 'vegetable', energyKcal: 43, proteinG: 1.6, carbsG: 10, fatG: 0.2, unit: '100g' },
  { id: 'v06', name: 'Zanahoria', category: 'vegetable', energyKcal: 41, proteinG: 0.9, carbsG: 10, fatG: 0.2, unit: '100g' },
  { id: 'v07', name: 'Brócoli', category: 'vegetable', energyKcal: 34, proteinG: 2.8, carbsG: 7, fatG: 0.4, unit: '100g' },
  { id: 'v08', name: 'Lechuga', category: 'vegetable', energyKcal: 15, proteinG: 1.4, carbsG: 2.9, fatG: 0.2, unit: '100g' },
  { id: 'v09', name: 'Tomate', category: 'vegetable', energyKcal: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, unit: '100g' },
  { id: 'v10', name: 'Palmitos', category: 'vegetable', energyKcal: 22, proteinG: 2.5, carbsG: 4.6, fatG: 0.1, unit: '100g' },
  { id: 'v11', name: 'Apio', category: 'vegetable', energyKcal: 14, proteinG: 0.7, carbsG: 3, fatG: 0.2, unit: '100g' },
  { id: 'v12', name: 'Pimentón', category: 'vegetable', energyKcal: 31, proteinG: 1, carbsG: 6, fatG: 0.3, unit: '100g' },

  // ─── Legumbres y granos ─────────────────────────────────────
  { id: 'l01', name: 'Lentejas cocidas', category: 'legume', energyKcal: 116, proteinG: 9, carbsG: 20, fatG: 0.4, unit: '100g' },
  { id: 'l02', name: 'Porotos cocidos', category: 'legume', energyKcal: 127, proteinG: 8.7, carbsG: 23, fatG: 0.5, unit: '100g' },
  { id: 'l03', name: 'Garbanzos cocidos', category: 'legume', energyKcal: 164, proteinG: 8.9, carbsG: 27, fatG: 2.6, unit: '100g' },
  { id: 'l04', name: 'Quinoa cocida', category: 'legume', energyKcal: 120, proteinG: 4.4, carbsG: 21, fatG: 1.9, unit: '100g' },
  { id: 'l05', name: 'Avena en hojuelas', category: 'legume', energyKcal: 389, proteinG: 16.9, carbsG: 66, fatG: 6.9, unit: '100g' },
  { id: 'l06', name: 'Arroz integral cocido', category: 'legume', energyKcal: 111, proteinG: 2.6, carbsG: 23, fatG: 0.9, unit: '100g' },
  { id: 'l07', name: 'Porotos negros', category: 'legume', energyKcal: 132, proteinG: 8.9, carbsG: 24, fatG: 0.5, unit: '100g' },

  // ─── Lácteos ────────────────────────────────────────────────
  { id: 'd01', name: 'Yogurt griego natural', category: 'dairy', energyKcal: 59, proteinG: 10, carbsG: 3.6, fatG: 0.7, unit: '100g' },
  { id: 'd02', name: 'Leche descremada', category: 'dairy', energyKcal: 34, proteinG: 3.4, carbsG: 5, fatG: 0.1, unit: '100g' },
  { id: 'd03', name: 'Queso fresco', category: 'dairy', energyKcal: 264, proteinG: 18, carbsG: 3, fatG: 20, unit: '100g' },
  { id: 'd04', name: 'Requesón', category: 'dairy', energyKcal: 98, proteinG: 11, carbsG: 4.3, fatG: 4.3, unit: '100g' },
  { id: 'd05', name: 'Leche de soya', category: 'dairy', energyKcal: 33, proteinG: 2.8, carbsG: 1.8, fatG: 1.6, unit: '100g' },
  { id: 'd06', name: 'Yogur natural', category: 'dairy', energyKcal: 59, proteinG: 3.5, carbsG: 5, fatG: 1.5, unit: '100g' },

  // ─── Grasas saludables ──────────────────────────────────────
  { id: 'g01', name: 'Aceite de oliva', category: 'fat', energyKcal: 884, proteinG: 0, carbsG: 0, fatG: 100, unit: '100g' },
  { id: 'g02', name: 'Almendras', category: 'fat', energyKcal: 579, proteinG: 21, carbsG: 22, fatG: 50, unit: '100g' },
  { id: 'g03', name: 'Nueces', category: 'fat', energyKcal: 654, proteinG: 15, carbsG: 14, fatG: 65, unit: '100g' },
  { id: 'g04', name: 'Semillas de chía', category: 'fat', energyKcal: 486, proteinG: 16.5, carbsG: 42, fatG: 30.7, unit: '100g' },
  { id: 'g05', name: 'Semillas de linaza', category: 'fat', energyKcal: 534, proteinG: 18, carbsG: 29, fatG: 42, unit: '100g' },
  { id: 'g06', name: 'Maní', category: 'fat', energyKcal: 567, proteinG: 26, carbsG: 16, fatG: 49, unit: '100g' },
  { id: 'g07', name: 'Crema de maní natural', category: 'fat', energyKcal: 588, proteinG: 25, carbsG: 20, fatG: 50, unit: '100g' },

  // ─── Granos y cereales ──────────────────────────────────────
  { id: 'gr01', name: 'Pan integral', category: 'grain', energyKcal: 247, proteinG: 13, carbsG: 41, fatG: 4.2, unit: '100g' },
  { id: 'gr02', name: 'Rebanada de pan integral', category: 'grain', energyKcal: 75, proteinG: 4, carbsG: 12, fatG: 1.3, unit: 'rebanada', unitPer100G: 3.33 },
  { id: 'gr03', name: 'Arroz integral', category: 'grain', energyKcal: 111, proteinG: 2.6, carbsG: 23, fatG: 0.9, unit: '100g' },
  { id: 'gr04', name: 'Quinoa seca', category: 'grain', energyKcal: 368, proteinG: 14, carbsG: 64, fatG: 6, unit: '100g' },
  { id: 'gr05', name: 'Fideos integrales', category: 'grain', energyKcal: 348, proteinG: 13, carbsG: 72, fatG: 2.5, unit: '100g' },

  // ─── Snacks fitness ─────────────────────────────────────────
  { id: 's01', name: 'Barra de proteína', category: 'snack', energyKcal: 350, proteinG: 30, carbsG: 40, fatG: 10, unit: 'pieza', unitPer100G: 2.5 },
  { id: 's02', name: 'Frutos secos mixtos', category: 'snack', energyKcal: 607, proteinG: 20, carbsG: 21, fatG: 54, unit: '100g' },
  { id: 's03', name: 'Galletas de avena', category: 'snack', energyKcal: 380, proteinG: 10, carbsG: 55, fatG: 12, unit: '100g' },
  { id: 's04', name: 'Semillas de girasol', category: 'snack', energyKcal: 584, proteinG: 21, carbsG: 20, fatG: 51, unit: '100g' },
  { id: 's05', name: 'Shake de proteína (polvo)', category: 'snack', energyKcal: 375, proteinG: 80, carbsG: 8, fatG: 3, unit: '100g' },
];

export const foodDB = {
  items: foodItems,
};
