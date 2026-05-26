'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';

interface ChartData {
  month: string;
  actual: number | null;
  forecast: number | null;
}

interface CashFlowChartProps {
  data: ChartData[];
}

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
};

// Custom animated dot component
const AnimatedDot = ({ cx, cy, fill, index }: { cx?: number; cy?: number; fill: string; index?: number }) => {
  if (cx === undefined || cy === undefined) return null;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={fill}
      stroke="#fff"
      strokeWidth={2}
      style={{
        opacity: 0,
        animation: `fadeInScale 0.4s ease-out ${(index || 0) * 0.1}s forwards`,
      }}
    />
  );
};

export default function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <div className="relative">
      <style jsx global>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes drawLine {
          from {
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fadeInArea {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .recharts-line-curve {
          stroke-dasharray: 1000;
          animation: drawLine 1.5s ease-out forwards;
        }
        .recharts-area-area {
          opacity: 0;
          animation: fadeInArea 0.8s ease-out 0.3s forwards;
        }
      `}</style>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: number) => [`${value?.toFixed(1)}%`, '']} 
            labelFormatter={formatMonth}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="actual" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorActual)" 
            name="Aktual" 
            connectNulls={false}
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#10b981" 
            strokeWidth={2.5} 
            dot={(props) => <AnimatedDot {...props} fill="#10b981" />}
            activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
            name="Aktual" 
            connectNulls={false}
            animationDuration={1500}
            animationEasing="ease-out"
          />
          <Area 
            type="monotone" 
            dataKey="forecast" 
            stroke="#f97316" 
            fillOpacity={1} 
            fill="url(#colorForecast)" 
            name="Proyeksi" 
            connectNulls={false} 
            strokeDasharray="5 5"
            animationDuration={1200}
            animationEasing="ease-out"
            animationBegin={300}
          />
          <Line 
            type="monotone" 
            dataKey="forecast" 
            stroke="#f97316" 
            strokeWidth={2.5} 
            strokeDasharray="5 5" 
            dot={(props) => <AnimatedDot {...props} fill="#f97316" />}
            activeDot={{ r: 7, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
            name="Proyeksi" 
            connectNulls={false}
            animationDuration={1500}
            animationEasing="ease-out"
            animationBegin={300}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
