import React, { useEffect, useState } from 'react';
import Layout from '../common/Layout';
import SalesChart from './SalesChart';
import CategoryPieChart from './CategoryPieChart';
import OrderTrendChart from './OrderTrendChart';
import api from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
const STAT_CARDS = [
  { key: 'total_sales',         label: 'Total Sales',    prefix: '₱', format: v => Number(v).toLocaleString(),  colorClass: 'text-primary',   bgClass: 'bg-primary/10' },
  { key: 'total_orders',        label: 'Total Orders',   prefix: '',  format: v => Number(v).toLocaleString(),  colorClass: 'text-blue-500',  bgClass: 'bg-blue-500/10' },
  { key: 'average_order_value', label: 'Avg. Order',     prefix: '₱', format: v => Number(v).toFixed(2),        colorClass: 'text-success',   bgClass: 'bg-success/10' },
  { key: 'pending_orders',      label: 'Pending Orders', prefix: '',  format: v => Number(v || 0),              colorClass: 'text-warning',   bgClass: 'bg-warning/10' },
];

export default function AdminDashboard() {
  const [summary, setSummary] = useState({});
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary'),
      api.get('/reports/daily'),
    ])
      .then(([summaryRes, dailyRes]) => {
        setSummary(summaryRes.data);
        setDailyData(dailyRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="flex flex-col gap-6 w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time summary of your canteen's performance</p>
          </div>
          <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-full shadow-sm text-xs font-semibold text-muted-foreground whitespace-nowrap">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            Live Data
          </div>
        </div>

        {/* Section Label */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Key Metrics</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse bg-muted/40 border-border">
                <CardContent className="h-[140px]"></CardContent>
              </Card>
            ))
          ) : (
            STAT_CARDS.map((c, i) => {
              return (
                <Card key={i} className="overflow-hidden relative border-border/50 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${c.colorClass.split('-')[1]} to-transparent opacity-50`}></div>
                  <CardContent className="p-6 py-8 flex items-center gap-5 min-h-[140px]">
                    <div>
                      <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{c.label}</div>
                      <div className={`text-3xl font-extrabold tracking-tight ${c.colorClass}`}>
                        {c.prefix}{c.format(summary[c.key] ?? 0)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Section Label */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Analytics</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <SalesChart data={dailyData} />
          <CategoryPieChart />
          <OrderTrendChart data={dailyData} />
        </div>

      </div>
    </Layout>
  );
}