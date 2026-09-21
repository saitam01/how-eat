import i18n from '@/i18n/es.json';

export type TabKey = 'calculator' | 'diario' | 'plan' | 'progreso';

interface TabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'calculator', label: i18n.tabCalculator },
  { key: 'diario', label: i18n.tabDiario },
  { key: 'plan', label: i18n.tabPlan },
  { key: 'progreso', label: i18n.tabProgress },
];

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div
      className="flex gap-1 rounded-lg bg-muted p-1"
      role="tablist"
      aria-label="Navegación principal"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={
            active === tab.key
              ? 'flex-1 rounded-md bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors'
              : 'flex-1 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
