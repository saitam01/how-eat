import { FormEvent, useState } from 'react';
import { RANGES } from '@/lib/constants';
import { useWeightLog } from '@/hooks/useWeightLog';
import { WeightChart } from '@/components/WeightChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import i18n from '@/i18n/es.json';

function formatUp(value: number): string {
  return String(Math.ceil(value * 10) / 10);
}

export function WeightLog() {
  const { entries, addEntry, removeEntry } = useWeightLog();
  const [weight, setWeight] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const weightKg = Number(weight);
    const invalid =
      !Number.isFinite(weightKg) ||
      weight.trim() === '' ||
      weightKg < RANGES.weightKg.min ||
      weightKg > RANGES.weightKg.max;

    if (invalid) {
      setIsInvalid(true);
      return;
    }

    addEntry(weightKg);
    setWeight('');
    setIsInvalid(false);
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{i18n.weightTitle}</h2>
      <form className="flex gap-2" onSubmit={handleSubmit} noValidate>
        <Input
          type="number"
          step="0.1"
          min={RANGES.weightKg.min}
          max={RANGES.weightKg.max}
          aria-label={i18n.weightPlaceholder}
          placeholder={i18n.weightPlaceholder}
          value={weight}
          onChange={(event) => {
            setWeight(event.target.value);
            setIsInvalid(false);
          }}
        />
        <Button type="submit">{i18n.weightAdd}</Button>
      </form>
      {isInvalid && <p className="text-sm text-destructive">{i18n.weightInvalid}</p>}

      <WeightChart entries={entries} />

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">{i18n.weightEmpty}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...entries].reverse().map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <p className="text-sm font-medium tabular-nums">
                {entry.date} — {formatUp(entry.weightKg)} kg
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeEntry(entry.id)}
                aria-label={i18n.weightRemoveAria}
                className="text-destructive hover:text-destructive"
              >
                {i18n.weightRemove}
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
