import type { Macros, MacroKey, PresetKey } from '@/types';
import { LABELS, PRESET_KEYS } from '@/lib/constants';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import i18n from '@/i18n/es.json';

const MACRO_KEYS: MacroKey[] = ['proteinPct', 'carbsPct', 'fatPct'];

export interface MacroSlidersProps {
  macros: Macros;
  onLiveDrag: (moved: MacroKey, v: number) => void;
  onCommit: (moved: MacroKey, v: number) => void;
  preset: PresetKey;
  onPreset: (key: PresetKey) => void;
}

export function MacroSliders({
  macros,
  onLiveDrag,
  onCommit,
  preset,
  onPreset,
}: MacroSlidersProps) {
  const sum = macros.proteinPct + macros.carbsPct + macros.fatPct;

  const handleLiveDrag = (key: MacroKey, v: number) => {
    onLiveDrag(key, v);
    if (preset !== 'personalizado') onPreset('personalizado');
  };

  const handleCommit = (key: MacroKey, v: number) => {
    onCommit(key, v);
    if (preset !== 'personalizado') onPreset('personalizado');
  };

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{i18n.macros}</h2>
        <span
          className={
            sum === 100
              ? 'rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
              : 'rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700'
          }
          aria-live="polite"
        >
          {`${i18n.sumBadge} ${sum}%`}
        </span>
      </div>

      {MACRO_KEYS.map((key) => (
        <div key={key} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <Label>{LABELS.macro[key]}</Label>
            <span className="tabular-nums text-muted-foreground">{macros[key]}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[macros[key]]}
            onValueChange={(v) => handleLiveDrag(key, v[0])}
            onValueCommit={(v) => handleCommit(key, v[0])}
            aria-label={LABELS.macro[key]}
          />
        </div>
      ))}

      <div role="tablist" aria-label={i18n.preset} className="flex flex-wrap gap-2 pt-1">
        {PRESET_KEYS.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={preset === p}
            onClick={() => onPreset(p)}
            className={
              preset === p
                ? 'rounded-md border border-brand bg-brand px-3 py-1.5 text-xs font-medium text-brand-fg'
                : 'rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent'
            }
          >
            {LABELS.preset[p]}
          </button>
        ))}
      </div>
    </div>
  );
}
