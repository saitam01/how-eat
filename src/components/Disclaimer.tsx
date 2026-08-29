import i18n from '@/i18n/es.json';

export function Disclaimer() {
  return (
    <div
      role="note"
      className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
    >
      {i18n.disclaimer}
    </div>
  );
}
