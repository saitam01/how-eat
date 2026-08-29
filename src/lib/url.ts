import type { ActivityLevel, AppState, Goal, Inputs, Macros, PresetKey, Sex } from '@/types';
import { DEFAULT_INPUTS, DEFAULT_MACROS, DEFAULT_PRESET, PRESETS, RANGES } from '@/lib/constants';
import { normalizeTo100 } from '@/lib/macros';
import { resolvePreset } from '@/lib/validation';
import { loadPersisted } from './storage';

const ACTIVITIES: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very', 'extra'];
const GOALS: Goal[] = [
  'maintain',
  'lose_mild',
  'lose',
  'lose_aggressive',
  'gain_mild',
  'gain',
  'gain_aggressive',
];
const PRESETS_KEYS: PresetKey[] = ['estandar', 'alta_proteina', 'keto', 'personalizado'];
const SEXES: Sex[] = ['male', 'female'];
const num = (v: string | null) => (v === null ? null : Number(v));

// Serialize full state → query string (omits bodyFatPct when absent).
export function serializeParams(state: AppState): string {
  const p = new URLSearchParams();
  p.set('s', state.inputs.sex);
  p.set('a', String(state.inputs.age));
  p.set('h', String(state.inputs.heightCm));
  p.set('w', String(state.inputs.weightKg));
  if (state.inputs.bodyFatPct !== undefined) p.set('b', String(state.inputs.bodyFatPct));
  p.set('ac', state.inputs.activity);
  p.set('g', state.inputs.goal);
  p.set('p', String(state.macros.proteinPct));
  p.set('c', String(state.macros.carbsPct));
  p.set('f', String(state.macros.fatPct));
  p.set('pr', state.preset);
  return p.toString();
}

export function shareUrl(state: AppState): string {
  const base =
    typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  return `${base}?${serializeParams(state)}`;
}

// Parse URL params → Partial<AppState> with ONLY valid fields. Returns invalid=true if any
// recognized-but-malformed param was present.
export function parseUrlParams(
  search: string = typeof window !== 'undefined' ? window.location.search : '',
): { partial: Partial<AppState>; invalid: boolean } {
  const p = new URLSearchParams(search);
  const partial: Partial<AppState> = {};
  let invalid = false;
  const sex = p.get('s');
  if (sex) {
    if (SEXES.includes(sex as Sex)) partial.inputs = { ...(partial.inputs || {}), sex: sex as Sex } as Inputs;
    else invalid = true;
  }
  const a = num(p.get('a'));
  if (a !== null) {
    if (Number.isFinite(a) && a >= RANGES.age.min && a <= RANGES.age.max)
      (partial.inputs || (partial.inputs = {} as Inputs)).age = Math.round(a);
    else invalid = true;
  }
  const h = num(p.get('h'));
  if (h !== null) {
    if (Number.isFinite(h) && h >= RANGES.heightCm.min && h <= RANGES.heightCm.max)
      (partial.inputs || (partial.inputs = {} as Inputs)).heightCm = Math.round(h);
    else invalid = true;
  }
  const w = num(p.get('w'));
  if (w !== null) {
    if (Number.isFinite(w) && w >= RANGES.weightKg.min && w <= RANGES.weightKg.max)
      (partial.inputs || (partial.inputs = {} as Inputs)).weightKg = Math.round(w);
    else invalid = true;
  }
  const b = num(p.get('b'));
  if (b !== null) {
    if (Number.isFinite(b) && b >= RANGES.bodyFatPct.min && b <= RANGES.bodyFatPct.max)
      (partial.inputs || (partial.inputs = {} as Inputs)).bodyFatPct = Math.round(b);
    else invalid = true;
  }
  const ac = p.get('ac');
  if (ac) {
    if (ACTIVITIES.includes(ac as ActivityLevel))
      (partial.inputs || (partial.inputs = {} as Inputs)).activity = ac as ActivityLevel;
    else invalid = true;
  }
  const g = p.get('g');
  if (g) {
    if (GOALS.includes(g as Goal)) (partial.inputs || (partial.inputs = {} as Inputs)).goal = g as Goal;
    else invalid = true;
  }
  const pct = (k: 'proteinPct' | 'carbsPct' | 'fatPct', key: string) => {
    const v = num(p.get(key));
    if (v !== null) {
      if (Number.isFinite(v) && v >= 0 && v <= 100)
        (partial.macros || (partial.macros = {} as Macros))[k] = Math.round(v);
      else invalid = true;
    }
  };
  pct('proteinPct', 'p');
  pct('carbsPct', 'c');
  pct('fatPct', 'f');
  const pr = p.get('pr');
  if (pr) {
    if (PRESETS_KEYS.includes(pr as PresetKey)) partial.preset = pr as PresetKey;
    else invalid = true;
  }
  return { partial, invalid };
}

// Hydration precedence: valid URL param > localStorage > default (design §10.1).
export function loadState(): { state: AppState; invalidParams: boolean } {
  const { partial, invalid } = parseUrlParams();
  const ls = loadPersisted();
  const state: AppState = {
    inputs: { ...DEFAULT_INPUTS, ...(ls?.inputs || {}), ...(partial.inputs || {}) },
    macros: { ...DEFAULT_MACROS, ...(ls?.macros || {}), ...(partial.macros || {}) },
    preset: partial.preset || ls?.preset || DEFAULT_PRESET,
  };
  state.macros = normalizeTo100(state.macros);
  state.preset = resolvePreset(state.macros) ?? state.preset;
  return { state, invalidParams: invalid };
}
