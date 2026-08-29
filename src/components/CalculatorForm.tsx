import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import type { ActivityLevel, Goal, Inputs, Sex } from '@/types';
import { LABELS, RANGES } from '@/lib/constants';
import { validateInputs } from '@/lib/validation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import i18n from '@/i18n/es.json';

type FieldError = 'required' | 'invalid' | 'clamped';

export interface CalculatorFormProps {
  inputs: Inputs;
  onChange: (partial: Partial<Inputs>) => void;
  errors?: Partial<Record<keyof Inputs, FieldError>>;
}

const TIP = {
  sex: 'Masculino o femenino define la fórmula del metabolismo basal.',
  age: `Edad en años (${RANGES.age.min}–${RANGES.age.max}).`,
  height: `Altura en centímetros (${RANGES.heightCm.min}–${RANGES.heightCm.max}).`,
  weight: `Peso en kilogramos (${RANGES.weightKg.min}–${RANGES.weightKg.max}).`,
  bodyFat: `Opcional. Porcentaje de grasa (${RANGES.bodyFatPct.min}–${RANGES.bodyFatPct.max}). Activa Katch-McArdle.`,
  activity: 'Nivel de actividad física promedio por semana.',
  goal: 'Ajuste calórico aplicado sobre tu gasto energético total.',
} as const;

const REQUIRED_MSG = 'Campo requerido';

function Field({
  id,
  label,
  tooltip,
  error,
  children,
}: {
  id: string;
  label: string;
  tooltip: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <button
          type="button"
          aria-label={`Información sobre ${label}`}
          title={tooltip}
          className="rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
      {error && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function NumberField({
  id,
  label,
  tooltip,
  value,
  min,
  max,
  step = 1,
  optional = false,
  error,
  onChange,
}: {
  id: string;
  label: string;
  tooltip: string;
  value: number | undefined;
  min: number;
  max: number;
  step?: number;
  optional?: boolean;
  error?: string;
  onChange: (v: number | undefined) => void;
}) {
  const [draft, setDraft] = useState(value === undefined ? '' : String(value));
  const prev = useRef(value);
  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      setDraft(value === undefined ? '' : String(value));
    }
  }, [value]);

  const inRange = (n: number) => n >= min && n <= max;

  const handleChange = (raw: string) => {
    setDraft(raw);
    if (raw.trim() === '') {
      if (optional) onChange(undefined);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    if (inRange(n)) onChange(n);
  };

  const handleBlur = () => {
    if (draft.trim() === '') {
      if (optional) onChange(undefined);
      return;
    }
    const n = Number(draft);
    if (!Number.isFinite(n)) return;
    if (!inRange(n)) {
      const clamped = Math.round(Math.min(max, Math.max(min, n)));
      onChange(clamped);
      setDraft(String(clamped));
      toast(i18n.clamped);
    }
  };

  return (
    <Field id={id} label={label} tooltip={tooltip} error={error}>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={draft}
        min={min}
        max={max}
        step={step}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        aria-invalid={!!error}
      />
    </Field>
  );
}

export function CalculatorForm({ inputs, onChange, errors }: CalculatorFormProps) {
  const fieldErrors = errors ?? validateInputs(inputs).errors;
  const requiredError = (k: keyof Inputs) =>
    fieldErrors[k] === 'required' || fieldErrors[k] === 'invalid' ? REQUIRED_MSG : undefined;

  return (
    <div className="space-y-4">
      <Field id="sex" label={i18n.sex} tooltip={TIP.sex} error={requiredError('sex')}>
        <RadioGroup
          value={inputs.sex}
          onValueChange={(v) => onChange({ sex: v as Sex })}
          className="flex gap-4"
        >
          {(['male', 'female'] as Sex[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <RadioGroupItem id={`sex-${s}`} value={s} />
              <Label htmlFor={`sex-${s}`}>{LABELS.sex[s]}</Label>
            </div>
          ))}
        </RadioGroup>
      </Field>

      <NumberField
        id="age"
        label={i18n.age}
        tooltip={TIP.age}
        value={inputs.age}
        min={RANGES.age.min}
        max={RANGES.age.max}
        onChange={(v) => {
          if (v !== undefined) onChange({ age: v });
        }}
        error={requiredError('age')}
      />

      <NumberField
        id="heightCm"
        label={i18n.height}
        tooltip={TIP.height}
        value={inputs.heightCm}
        min={RANGES.heightCm.min}
        max={RANGES.heightCm.max}
        onChange={(v) => {
          if (v !== undefined) onChange({ heightCm: v });
        }}
        error={requiredError('heightCm')}
      />

      <NumberField
        id="weightKg"
        label={i18n.weight}
        tooltip={TIP.weight}
        value={inputs.weightKg}
        min={RANGES.weightKg.min}
        max={RANGES.weightKg.max}
        onChange={(v) => {
          if (v !== undefined) onChange({ weightKg: v });
        }}
        error={requiredError('weightKg')}
      />

      <NumberField
        id="bodyFatPct"
        label={i18n.bodyFat}
        tooltip={TIP.bodyFat}
        value={inputs.bodyFatPct}
        min={RANGES.bodyFatPct.min}
        max={RANGES.bodyFatPct.max}
        optional
        onChange={(v) => onChange({ bodyFatPct: v })}
        error={requiredError('bodyFatPct')}
      />

      <Field id="activity" label={i18n.activity} tooltip={TIP.activity} error={requiredError('activity')}>
        <Select
          value={inputs.activity}
          onValueChange={(v) => onChange({ activity: v as ActivityLevel })}
        >
          <SelectTrigger id="activity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(LABELS.activity) as ActivityLevel[]).map((a) => (
              <SelectItem key={a} value={a}>
                {LABELS.activity[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field id="goal" label={i18n.goal} tooltip={TIP.goal} error={requiredError('goal')}>
        <RadioGroup
          value={inputs.goal}
          onValueChange={(v) => onChange({ goal: v as Goal })}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {(Object.keys(LABELS.goal) as Goal[]).map((g) => (
            <div key={g} className="flex items-center gap-2">
              <RadioGroupItem id={`goal-${g}`} value={g} />
              <Label htmlFor={`goal-${g}`} className="text-xs font-normal">
                {LABELS.goal[g]}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </Field>
    </div>
  );
}
