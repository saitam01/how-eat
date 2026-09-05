import type { Result } from '@/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { buildAnnouncement } from '@/lib/result';
import { Button } from '@/components/ui/button';
import i18n from '@/i18n/es.json';

export interface ResultCardProps {
  result: Result | null;
  onReset: () => void;
}

const MACRO_ROWS: { key: 'protein' | 'carbs' | 'fat'; labelKey: 'protein' | 'carbs' | 'fat' }[] = [
  { key: 'protein', labelKey: 'protein' },
  { key: 'carbs', labelKey: 'carbs' },
  { key: 'fat', labelKey: 'fat' },
];

export function ResultCard({ result, onReset }: ResultCardProps) {
  const announcement = useDebouncedValue(result ? buildAnnouncement(result) : '', 500);

  if (result === null) return null;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background p-4 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {i18n.target}
        </p>
        <div className="mt-1 text-3xl font-bold tabular-nums">
          {result.targetCalories}{' '}
          <span className="text-base font-normal text-muted-foreground">{i18n.calories}</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {i18n.bmr}: {result.bmr} {i18n.calories} · {i18n.tdee}: {result.tdee} {i18n.calories}
      </p>

      <div className="overflow-hidden rounded-md border border-border">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          <span>{i18n.macros}</span>
          <span className="text-right">{i18n.grams}</span>
          <span className="text-right">{i18n.calories}</span>
          <span className="text-right">%</span>
        </div>
        {MACRO_ROWS.map(({ key, labelKey }) => {
          const m = result.macros[key];
          return (
            <div
              key={key}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 border-t border-border px-3 py-2 text-sm"
            >
              <div className="space-y-1">
                <span className="block">{i18n[labelKey]}</span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${m.pct}%` }} />
                </div>
              </div>
              <span className="text-right tabular-nums">
                {m.grams} {i18n.grams}
              </span>
              <span className="text-right tabular-nums">
                {m.calories} {i18n.calories}
              </span>
              <span className="text-right tabular-nums">{m.pct}%</span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {i18n.formula}:{' '}
        {result.formulaUsed === 'katch-mcardle' ? 'Katch-McArdle' : 'Mifflin-St Jeor'}
      </p>

      <Button variant="outline" onClick={onReset} className="w-full">
        {i18n.reset}
      </Button>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
