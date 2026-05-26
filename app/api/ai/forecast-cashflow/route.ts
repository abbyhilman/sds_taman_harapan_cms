import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple Moving Average forecasting
function simpleMovingAverage(data: number[], periods: number): number {
  if (data.length < periods) return data.reduce((a, b) => a + b, 0) / data.length;
  const recent = data.slice(-periods);
  return recent.reduce((a, b) => a + b, 0) / periods;
}

// Exponential smoothing for trend detection
function exponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
  if (data.length === 0) return [];
  const smoothed = [data[0]];
  for (let i = 1; i < data.length; i++) {
    smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1]);
  }
  return smoothed;
}

// Forecast next N months
function forecastNextMonths(historicalRates: number[], months: number = 3): number[] {
  if (historicalRates.length === 0) return Array(months).fill(0);
  
  const smoothed = exponentialSmoothing(historicalRates);
  const trend = smoothed.length >= 2 
    ? (smoothed[smoothed.length - 1] - smoothed[smoothed.length - 2]) 
    : 0;
  
  const baseValue = simpleMovingAverage(historicalRates, 3);
  const forecasts: number[] = [];
  
  for (let i = 1; i <= months; i++) {
    // Apply trend with dampening factor
    const forecast = Math.min(100, Math.max(0, baseValue + trend * i * 0.5));
    forecasts.push(Math.round(forecast * 100) / 100);
  }
  
  return forecasts;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6');
    const forecastMonths = parseInt(searchParams.get('forecast') || '3');

    // Get historical invoice data (last N months)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .gte('due_date', startDate.toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Group invoices by month
    const monthlyData: Record<string, { total: number; paid: number; count: number }> = {};
    
    (invoices || []).forEach(inv => {
      const date = new Date(inv.due_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, paid: 0, count: 0 };
      }
      
      monthlyData[monthKey].total += Number(inv.amount);
      monthlyData[monthKey].count += 1;
      if (inv.status_bayar === 'paid') {
        monthlyData[monthKey].paid += Number(inv.amount);
      }
    });

    // Calculate payment rates per month
    const sortedMonths = Object.keys(monthlyData).sort();
    const historicalData = sortedMonths.map(month => {
      const data = monthlyData[month];
      return {
        month,
        total_amount: data.total,
        paid_amount: data.paid,
        invoice_count: data.count,
        payment_rate: data.total > 0 ? (data.paid / data.total) * 100 : 0
      };
    });

    // Generate forecasts
    const paymentRates = historicalData.map(d => d.payment_rate);
    const forecastedRates = forecastNextMonths(paymentRates, forecastMonths);
    
    // Calculate average monthly amount for forecast
    const avgMonthlyAmount = historicalData.length > 0
      ? historicalData.reduce((sum, d) => sum + d.total_amount, 0) / historicalData.length
      : 0;

    // Generate forecast months
    const lastMonth = sortedMonths.length > 0 
      ? new Date(sortedMonths[sortedMonths.length - 1] + '-01')
      : new Date();
    
    const forecastData = forecastedRates.map((rate, i) => {
      const forecastDate = new Date(lastMonth);
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      
      return {
        month: monthKey,
        predicted_rate: rate,
        predicted_amount: Math.round(avgMonthlyAmount * (rate / 100)),
        is_forecast: true
      };
    });

    // Summary statistics
    const totalCollected = historicalData.reduce((sum, d) => sum + d.paid_amount, 0);
    const totalExpected = historicalData.reduce((sum, d) => sum + d.total_amount, 0);
    const overallRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    return NextResponse.json({
      success: true,
      summary: {
        total_collected: totalCollected,
        total_expected: totalExpected,
        overall_payment_rate: Math.round(overallRate * 100) / 100,
        months_analyzed: historicalData.length
      },
      historical: historicalData,
      forecast: forecastData,
      chart_data: [
        ...historicalData.map(d => ({
          month: d.month,
          actual: d.payment_rate,
          forecast: null
        })),
        ...forecastData.map(d => ({
          month: d.month,
          actual: null,
          forecast: d.predicted_rate
        }))
      ]
    });

  } catch (error) {
    console.error('Forecast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
