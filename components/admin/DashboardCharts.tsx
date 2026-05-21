'use client';

type MiniAreaChartProps = {
  title: string;
  color: string;
  data: { month: string; total: number }[];
};

type PpdbDonutChartProps = {
  total: number;
  accepted: number;
  loading: boolean;
};

const buildPath = (data: { total: number }[]) => {
  const max = Math.max(...data.map((item) => item.total), 1);
  const points = data.map((item, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * 100;
    const y = 90 - (item.total / max) * 70;
    return `${x},${y}`;
  });

  return `M ${points.join(' L ')}`;
};

export function MiniAreaChart({ color, data }: MiniAreaChartProps) {
  const path = buildPath(data);
  const fillPath = `${path} L 100,100 L 0,100 Z`;

  return (
    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={fillPath} fill={color} opacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function PpdbDonutChart({ total, accepted, loading }: PpdbDonutChartProps) {
  const inProgress = Math.max(total - accepted, 0);
  const acceptedPercent = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const gradient = `conic-gradient(#10b981 0 ${acceptedPercent}%, #06b6d4 ${acceptedPercent}% 100%)`;
  const data = [
    { name: 'Diterima', value: accepted, color: '#10b981' },
    { name: 'Dalam Proses', value: inProgress, color: '#06b6d4' },
  ];

  return (
    <>
      <div className="relative mx-auto flex h-[240px] w-[240px] items-center justify-center rounded-full p-6" style={{ background: total > 0 ? gradient : 'conic-gradient(#e2e8f0 0 100%)' }}>
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
          <span className="text-3xl font-bold text-slate-950">{loading ? '-' : total}</span>
          <span className="text-xs text-muted-foreground">Total Pendaftar</span>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-medium text-slate-700">{item.name}</span>
            </div>
            <span className="text-lg font-bold text-slate-950">{loading ? '-' : item.value}</span>
          </div>
        ))}
        <p className="text-xs leading-5 text-muted-foreground">
          Chart lingkaran ini menunjukkan proporsi pendaftar yang diterima dibanding yang masih dalam proses.
        </p>
      </div>
    </>
  );
}
