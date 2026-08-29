import { useCallback, useEffect, useState } from 'react';
import type { PresetKey } from '@/types';
import { useCalculator } from '@/hooks/useCalculator';
import { loadState, shareUrl } from '@/lib/url';
import { CalculatorForm } from '@/components/CalculatorForm';
import { MacroSliders } from '@/components/MacroSliders';
import { ResultCard } from '@/components/ResultCard';
import { ShareButton } from '@/components/ShareButton';
import { Disclaimer } from '@/components/Disclaimer';
import { toast, Toaster } from '@/components/ui/toast';
import i18n from '@/i18n/es.json';

export function App() {
  const [initial] = useState(() => loadState());
  const calc = useCalculator(initial.state);

  useEffect(() => {
    if (initial.invalidParams) toast(i18n.invalidParams);
    // run once after the initial state is known
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreset = useCallback(
    (key: PresetKey) => {
      if (key === 'personalizado') calc.setPreset('personalizado');
      else calc.applyPreset(key);
    },
    [calc],
  );

  const url = shareUrl({ inputs: calc.inputs, macros: calc.macros, preset: calc.preset });

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">how-eat</h1>
          <p className="text-sm text-muted-foreground">
            Calculá tus calorías y macros. Sin cuenta, sin servidor, sin red.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <CalculatorForm inputs={calc.inputs} onChange={calc.setInputs} />
            <MacroSliders
              macros={calc.macros}
              onLiveDrag={calc.onMacroLiveDrag}
              onCommit={calc.onMacroCommit}
              preset={calc.preset}
              onPreset={handlePreset}
            />
          </section>

          <aside className="space-y-4 md:sticky md:top-6 md:self-start">
            <ResultCard result={calc.result} onReset={calc.reset} />
            <ShareButton url={url} disabled={calc.shareDisabled} onCopied={() => undefined} />
          </aside>
        </div>

        <Disclaimer />
      </main>
      <Toaster />
    </>
  );
}
