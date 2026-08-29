import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppState, Inputs, Macros, MacroKey, PresetKey } from '@/types';
import { DEFAULT_INPUTS, DEFAULT_MACROS, DEFAULT_PRESET, PRESETS } from '@/lib/constants';
import { calculate } from '@/lib/calculations';
import { validateInputs } from '@/lib/validation';
import { redistributeMacros } from '@/lib/macros';
import { savePersisted } from '@/lib/storage';
import { useDebouncedValue } from './useDebouncedValue';

const SAVE_DEBOUNCE_MS = 300;

type NonPersonalizadoPreset = Exclude<PresetKey, 'personalizado'>;

export interface UseCalculator {
  inputs: Inputs;
  macros: Macros;
  preset: PresetKey;
  result: ReturnType<typeof calculate> | null;
  isValid: boolean;
  sum: number;
  shareDisabled: boolean;
  setInputs: (partial: Partial<Inputs>) => void;
  setMacros: (macros: Macros) => void;
  setPreset: (preset: PresetKey) => void;
  applyPreset: (key: NonPersonalizadoPreset) => void;
  reset: () => void;
  onMacroCommit: (moved: MacroKey, v: number) => void;
  onMacroLiveDrag: (moved: MacroKey, v: number) => void;
}

/**
 * Owns the full calculator `AppState` and derives the live result. Persists a valid
 * state to localStorage (debounced) so a reload restores the last computation (design §11).
 */
export function useCalculator(initial?: AppState): UseCalculator {
  const [inputs, setInputsState] = useState<Inputs>(initial?.inputs ?? DEFAULT_INPUTS);
  const [macros, setMacrosState] = useState<Macros>(initial?.macros ?? DEFAULT_MACROS);
  const [preset, setPresetState] = useState<PresetKey>(initial?.preset ?? DEFAULT_PRESET);

  const result = useMemo(
    () => (validateInputs(inputs).ok ? calculate(inputs, macros) : null),
    [inputs, macros],
  );
  const isValid = useMemo(() => validateInputs(inputs).ok, [inputs]);
  const sum = macros.proteinPct + macros.carbsPct + macros.fatPct;
  const shareDisabled = !isValid || sum !== 100;

  const setInputs = useCallback((partial: Partial<Inputs>) => {
    setInputsState((prev) => ({ ...prev, ...partial }));
  }, []);
  const setMacros = useCallback((m: Macros) => setMacrosState(m), []);
  const setPreset = useCallback((p: PresetKey) => setPresetState(p), []);

  const applyPreset = useCallback((key: NonPersonalizadoPreset) => {
    setMacrosState({ ...PRESETS[key] });
    setPresetState(key);
  }, []);

  const reset = useCallback(() => {
    setInputsState({ ...DEFAULT_INPUTS });
    setMacrosState({ ...DEFAULT_MACROS });
    setPresetState(DEFAULT_PRESET);
  }, []);

  const onMacroCommit = useCallback((moved: MacroKey, v: number) => {
    setMacrosState((prev) => redistributeMacros(moved, v, prev));
  }, []);

  const onMacroLiveDrag = useCallback((moved: MacroKey, v: number) => {
    setMacrosState((prev) => ({ ...prev, [moved]: Math.round(v) }));
  }, []);

  // Debounced persistence: only persist when the (now-stable) inputs are valid.
  const state = useMemo<AppState>(() => ({ inputs, macros, preset }), [inputs, macros, preset]);
  const debounced = useDebouncedValue(state, SAVE_DEBOUNCE_MS);
  useEffect(() => {
    if (validateInputs(debounced.inputs).ok) savePersisted(debounced);
  }, [debounced]);

  return {
    inputs,
    macros,
    preset,
    result,
    isValid,
    sum,
    shareDisabled,
    setInputs,
    setMacros,
    setPreset,
    applyPreset,
    reset,
    onMacroCommit,
    onMacroLiveDrag,
  };
}
