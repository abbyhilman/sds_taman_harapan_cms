'use client';

import { useEffect, useState } from 'react';

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
  const [isVisible, setIsVisible] = useState(false);
  const path = buildPath(data);
  const fillPath = `${path} L 100,100 L 0,100 Z`;
  const pathLength = 300; // Approximate path length

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path 
        d={fillPath} 
        fill={`url(#gradient-${color.replace('#', '')})`}
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.8s ease-out',
        }}
      />
      <path 
        d={path} 
        fill="none" 
        stroke={color} 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        vectorEffect="non-scaling-stroke"
        style={{
          strokeDasharray: pathLength,
          strokeDashoffset: isVisible ? 0 : pathLength,
          transition: 'stroke-dashoffset 1.2s ease-out',
        }}
      />
    </svg>
  );
}

export function PpdbDonutChart({ total, accepted, loading }: PpdbDonutChartProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const inProgress = Math.max(total - accepted, 0);
  const targetPercent = total > 0 ? Math.round((accepted / total) * 100) : 0;

  useEffect(() => {
    if (loading || total === 0) {
      setAnimatedPercent(0);
      return;
    }

    // Animate from 0 to target
    let start: number | null = null;
    const duration = 1000; // 1 second

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercent(Math.round(eased * targetPercent));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetPercent, loading, total]);

  const gradient = total > 0 
    ? `conic-gradient(#10b981 0 ${animatedPercent}%, #06b6d4 ${animatedPercent}% 100%)`
    : 'conic-gradient(#e2e8f0 0 100%)';

  const data = [
    { name: 'Diterima', value: accepted, color: '#10b981' },
    { name: 'Dalam Proses', value: inProgress, color: '#06b6d4' },
  ];

  return (
    <>
      <div 
        className="relative mx-auto flex h-[240px] w-[240px] items-center justify-center rounded-full p-6"
        style={{ 
          background: gradient,
          transition: 'transform 0.3s ease-out',
          transform: animatedPercent > 0 ? 'scale(1)' : 'scale(0.95)',
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
          <span 
            className="text-3xl font-bold text-slate-950"
            style={{
              opacity: loading ? 0.5 : 1,
              transition: 'opacity 0.3s ease-out',
            }}
          >
            {loading ? '-' : total}
          </span>
          <span className="text-xs text-muted-foreground">Total Pendaftar</span>
          {!loading && total > 0 && (
            <span 
              className="mt-1 text-sm font-semibold text-emerald-600"
              style={{
                opacity: animatedPercent > 0 ? 1 : 0,
                transition: 'opacity 0.5s ease-out 0.3s',
              }}
            >
              {animatedPercent}% diterima
            </span>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div 
            key={item.name} 
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
            style={{
              opacity: loading ? 0.5 : 1,
              transform: loading ? 'translateX(-10px)' : 'translateX(0)',
              transition: `all 0.4s ease-out ${index * 0.1}s`,
            }}
          >
            <div className="flex items-center gap-3">
              <span 
                className="h-3 w-3 rounded-full" 
                style={{ 
                  backgroundColor: item.color,
                  transform: loading ? 'scale(0)' : 'scale(1)',
                  transition: 'transform 0.3s ease-out',
                }} 
              />
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
