import type { ChangeEvent } from 'react';
import { foodDB } from '@/lib/food-db';
import { FOOD_REPEAT_LIMITS } from '@/lib/food-profile';
import type { Allergen, DietaryPattern, FoodProfileInput, StrictIntolerance } from '@/lib/types';
import i18n from '@/i18n/es.json';

export interface FoodPreferencesProps {
  profile: FoodProfileInput;
  onChange: (changes: Partial<FoodProfileInput>) => void;
}

const allergenOptions: readonly [Allergen, string][] = [
  ['egg', 'Huevo'], ['fish', 'Pescado'], ['gluten', 'Gluten'], ['milk', 'Leche'],
  ['peanut', 'Maní'], ['sesame', 'Sésamo'], ['shellfish', 'Mariscos'], ['soy', 'Soja'], ['tree-nut', 'Frutos secos'],
];
const intoleranceOptions: readonly [StrictIntolerance, string][] = [
  ['gluten', 'Gluten'], ['lactose', 'Lactosa'], ['legume', 'Legumbres'], ['soy', 'Soja'],
];
const patternOptions: readonly [DietaryPattern, string][] = [
  ['omnivore', 'Omnívoro'], ['vegetarian', 'Vegetariano'], ['vegan', 'Vegano'],
];

function toggle<T extends string>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function selectedFoodIds(event: ChangeEvent<HTMLSelectElement>): string[] {
  return Array.from(event.currentTarget.selectedOptions, (option) => option.value);
}

function FoodSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: readonly string[];
  onChange: (ids: string[]) => void;
}) {
  const categories = [...new Set(foodDB.items.map((food) => food.category))];
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <select
        id={id}
        multiple
        value={value as string[]}
        onChange={(event) => onChange(selectedFoodIds(event))}
        className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      >
        {categories.map((category) => (
          <optgroup key={category} label={i18n[`category${category.charAt(0).toUpperCase()}${category.slice(1)}` as keyof typeof i18n] as string}>
            {foodDB.items.filter((food) => food.category === category).map((food) => (
              <option key={food.id} value={food.id}>{food.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">{i18n.foodPreferencesMultiSelectHint}</p>
    </div>
  );
}

export function FoodPreferences({ profile, onChange }: FoodPreferencesProps) {
  return (
    <section className="space-y-6" aria-labelledby="food-preferences-title">
      <div>
        <h2 id="food-preferences-title" className="text-xl font-bold">{i18n.foodPreferencesTitle}</h2>
        <p className="text-sm text-muted-foreground">{i18n.foodPreferencesDescription}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="dietary-pattern" className="text-sm font-medium">{i18n.foodPreferencesPattern}</label>
        <select id="dietary-pattern" value={profile.dietaryPattern} onChange={(event) => onChange({ dietaryPattern: event.target.value as DietaryPattern })} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          {patternOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{i18n.foodPreferencesAllergies}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {allergenOptions.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={profile.allergens.includes(value)} onChange={() => onChange({ allergens: toggle(profile.allergens, value) })} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{i18n.foodPreferencesIntolerances}</legend>
        <p className="text-sm text-muted-foreground">{i18n.foodPreferencesIntolerancesHint}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {intoleranceOptions.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={profile.strictIntolerances.includes(value)} onChange={() => onChange({ strictIntolerances: toggle(profile.strictIntolerances, value) })} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <FoodSelect id="excluded-foods" label={i18n.foodPreferencesExclusions} value={profile.excludedFoodIds} onChange={(excludedFoodIds) => onChange({ excludedFoodIds })} />
      <FoodSelect id="preferred-foods" label={i18n.foodPreferencesPreferred} value={profile.preferredFoodIds} onChange={(preferredFoodIds) => onChange({ preferredFoodIds })} />

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="max-food-repeats" className="text-sm font-medium">{i18n.foodPreferencesFoodRepeats}</label>
          <input id="max-food-repeats" type="number" inputMode="numeric" min={FOOD_REPEAT_LIMITS.food.min} max={FOOD_REPEAT_LIMITS.food.max} value={profile.maxFoodRepeatsPerWeek} onChange={(event) => onChange({ maxFoodRepeatsPerWeek: Math.max(FOOD_REPEAT_LIMITS.food.min, Math.min(FOOD_REPEAT_LIMITS.food.max, Number(event.target.value) || FOOD_REPEAT_LIMITS.food.min)) })} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="max-variety-repeats" className="text-sm font-medium">{i18n.foodPreferencesGroupRepeats}</label>
          <input id="max-variety-repeats" type="number" inputMode="numeric" min={FOOD_REPEAT_LIMITS.varietyGroup.min} max={FOOD_REPEAT_LIMITS.varietyGroup.max} value={profile.maxVarietyGroupRepeatsPerWeek} onChange={(event) => onChange({ maxVarietyGroupRepeatsPerWeek: Math.max(FOOD_REPEAT_LIMITS.varietyGroup.min, Math.min(FOOD_REPEAT_LIMITS.varietyGroup.max, Number(event.target.value) || FOOD_REPEAT_LIMITS.varietyGroup.min)) })} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" />
        </div>
      </fieldset>
    </section>
  );
}
