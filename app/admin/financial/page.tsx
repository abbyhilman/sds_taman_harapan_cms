'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/admin/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { staggerContainer, staggerItem, fadeInUp, fadeInDown } from '@/components/ui/animated';

const RechartsChart = dynamic(() => import('@/components/admin/CashFlowChart'), {
  loading: () => <Skeleton className="h-80 w-full" />,
  ssr: false
});

interface ChartData { month: string; actual: number | null; forecast: number | null; }
interface Summary { total_collected: number; total_expected: number; overall_payment_rate: number; months_analyzed: number; }
interface ForecastData { month: string; predicted_rate: number; predicted_amount: number; }

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
};

export default function FinancialDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const { toast } = useToast();

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/forecast-cashflow?months=6&forecast=3');
      const data = await res.json();
      if (data.success) {
        setChartData(data.chart_data || []);
        setSummary(data.summary);
        setForecast(data.forecast || []);
      } else {
        toast({ title: 'Gagal memuat data', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Terjadi kesalahan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchForecast(); }, [fetchForecast]);

  const trend = forecast.length >= 2 
    ? forecast[forecast.length - 1].predicted_rate - (summary?.overall_payment_rate || 0) : 0;

  const statCards = [
    { label: 'Total Terkumpul', value: formatCurrency(summary?.total_collected || 0), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Total Target', value: formatCurrency(summary?.total_expected || 0), icon: DollarSign, color: 'bg-blue-100 text-blue-600' },
    { label: 'Tingkat Pembayaran', value: `${summary?.overall_payment_rate?.toFixed(1)}%`, icon: TrendingUp, color: 'bg-cyan-100 text-cyan-600' },
    { label: 'Tren Proyeksi', value: `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`, icon: trend >= 0 ? TrendingUp : TrendingDown, color: trend >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600', valueColor: trend >= 0 ? 'text-green-600' : 'text-red-600' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div 
          className="max-w-6xl mx-auto space-y-6"
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          {/* Header */}
          <motion.div 
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            variants={fadeInDown}
          >
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                Financial Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Proyeksi Cash Flow & Analisis Pembayaran SPP</p>
            </div>
            <Button onClick={fetchForecast} disabled={loading} variant="outline">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh Data
            </Button>
          </motion.div>

          {/* Summary Cards */}
          <motion.div className="grid gap-4 md:grid-cols-4" variants={staggerContainer}>
            {statCards.map((card, i) => (
              <motion.div key={card.label} variants={staggerItem} whileHover={{ y: -2 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${card.color}`}>
                        <card.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{card.label}</p>
                        {loading ? <Skeleton className="h-7 w-24" /> : (
                          <p className={`text-xl font-bold ${card.valueColor || ''}`}>{card.value}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Chart */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Grafik Tingkat Pembayaran SPP
                  </span>
                  <div className="flex gap-4 text-sm font-normal">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Data Aktual</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> Proyeksi AI</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-80 w-full" /> : <RechartsChart data={chartData} />}
              </CardContent>
            </Card>
          </motion.div>

          {/* Forecast Details */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detail Proyeksi 3 Bulan Ke Depan</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div className="grid gap-4 md:grid-cols-3" variants={staggerContainer} initial="hidden" animate="show">
                  {loading ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  )) : forecast.map((f, i) => (
                    <motion.div 
                      key={i} 
                      className="p-4 rounded-lg border bg-gradient-to-br from-orange-50 to-white hover:shadow-md transition-shadow"
                      variants={staggerItem}
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="text-sm text-muted-foreground">{formatMonth(f.month)}</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">{f.predicted_rate.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground mt-1">Est. {formatCurrency(f.predicted_amount)}</p>
                      <Badge variant="outline" className="mt-2">Proyeksi AI</Badge>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
