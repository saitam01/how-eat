import { useState } from 'react';
import type { FoodItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import i18n from '@/i18n/es.json';

const KCAL_PER_GRAM: Record<string, number> = { protein: 4, carbs: 4, fat: 9 };

interface FoodItemCardProps {
  food: FoodItem;
  onSelect: (food: FoodItem, quantity: number) => void;
}

export function FoodItemCard({ food, onSelect }: FoodItemCardProps) {
  const [quantity, setQuantity] = useState(1);

  const step = 0.5;
  const min = 0.5;
  const max = 10;

  const preview = {
    calories: Math.round(food.energyKcal * quantity * 10) / 10,
    protein: Math.round(food.proteinG * quantity * 10) / 10,
    carbs: Math.round(food.carbsG * quantity * 10) / 10,
    fat: Math.round(food.fatG * quantity * 10) / 10,
  };

  const handleDecrease = () => setQuantity((q) => Math.max(min, q - step));
  const handleIncrease = () => setQuantity((q) => Math.min(max, q + step));

  const handleAdd = () => {
    onSelect(food, quantity);
    setQuantity(1);
  };

  return (
    <Card className="p-3">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium">{food.name}</h3>
            <p className="text-xs text-muted-foreground">{i18n.per100g}</p>
          </div>
        </div>

        {/* Macro preview */}
        <div className="grid grid-cols-4 gap-1 text-xs">
          <div>
            <span className="text-muted-foreground">{i18n.calories}</span>
            <p className="font-medium tabular-nums">{preview.calories}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{i18n.protein}</span>
            <p className="font-medium tabular-nums">{preview.protein}g</p>
          </div>
          <div>
            <span className="text-muted-foreground">{i18n.carbs}</span>
            <p className="font-medium tabular-nums">{preview.carbs}g</p>
          </div>
          <div>
            <span className="text-muted-foreground">{i18n.fat}</span>
            <p className="font-medium tabular-nums">{preview.fat}g</p>
          </div>
        </div>

        {/* Stepper + Add */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleDecrease}
              disabled={quantity <= min}
              aria-label={`Reducir cantidad`}
            >
              −
            </Button>
            <span className="w-10 text-center text-sm font-mono tabular-nums">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleIncrease}
              disabled={quantity >= max}
              aria-label={`Aumentar cantidad`}
            >
              +
            </Button>
          </div>
          <Button onClick={handleAdd} className="h-8 flex-1 text-xs">
            {i18n.add}
          </Button>
        </div>
      </div>
    </Card>
  );
}
