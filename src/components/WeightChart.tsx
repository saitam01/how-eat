import type { WeightEntry } from '@/lib/types';
import i18n from '@/i18n/es.json';

interface WeightChartProps {
  entries: WeightEntry[];
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 150;
const HORIZONTAL_PADDING = 20;
const VERTICAL_PADDING = 20;

export function WeightChart({ entries }: WeightChartProps) {
  if (entries.length === 0) return null;

  if (entries.length === 1) {
    return <p className="text-sm text-muted-foreground">{i18n.weightChartHint}</p>;
  }

  const weights = entries.map((entry) => entry.weightKg);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const isFlat = minWeight === maxWeight;
  const rangePadding = isFlat ? 0 : (maxWeight - minWeight) * 0.1;
  const lowerBound = minWeight - rangePadding;
  const upperBound = maxWeight + rangePadding;
  const usableWidth = CHART_WIDTH - HORIZONTAL_PADDING * 2;
  const usableHeight = CHART_HEIGHT - VERTICAL_PADDING * 2;

  const points = entries.map((entry, index) => {
    const x = HORIZONTAL_PADDING + (usableWidth * index) / (entries.length - 1);
    const y = isFlat
      ? CHART_HEIGHT / 2
      : VERTICAL_PADDING + ((upperBound - entry.weightKg) / (upperBound - lowerBound)) * usableHeight;
    return { entry, x, y };
  });
  const polylinePoints = points.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const minPoint = points.find(({ entry }) => entry.weightKg === minWeight) as (typeof points)[number];
  const maxPoint = points.find(({ entry }) => entry.weightKg === maxWeight) as (typeof points)[number];

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className="h-40 w-full text-primary"
      role="img"
      aria-label={i18n.weightChartAria}
    >
      <polyline points={polylinePoints} fill="none" stroke="currentColor" strokeWidth={2} />
      {points.map(({ entry, x, y }) => (
        <circle key={entry.id} cx={x} cy={y} r={3} fill="currentColor" />
      ))}
      <text x={minPoint.x} y={Math.max(12, minPoint.y - 8)} textAnchor="middle" className="fill-current text-[10px]">
        {minWeight} kg
      </text>
      <text x={maxPoint.x} y={Math.min(CHART_HEIGHT - 4, maxPoint.y + 14)} textAnchor="middle" className="fill-current text-[10px]">
        {maxWeight} kg
      </text>
    </svg>
  );
}
