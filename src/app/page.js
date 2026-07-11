'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getDashboardMetrics } from '@/actions/dashboard';
import { TrendingUp, DollarSign, Activity, ShoppingCart, PackageOpen, Tag, BarChart3, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import MetricCard from '@/components/dashboard/MetricCard';
import InsightCard from '@/components/dashboard/InsightCard';
import CreditSalesTable from '@/components/dashboard/CreditSalesTable';

export default function Dashboard() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(true);

  // Metrics
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    grossProfit: 0,
    profitMargin: 0,
    transactionCount: 0,
    atv: 0,
    stockValue: 0,
    lowStockCount: 0,
    topProduct: { name: 'N/A', units: 0 }
  });

  // Chart Data
  const [salesTrend, setSalesTrend] = useState([]);
  const [paymentData, setPaymentData] = useState([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status !== 'authenticated') return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const data = await getDashboardMetrics();
        if (data) {
          setMetrics(data.metrics);
          setSalesTrend(data.salesTrend);
          setPaymentData(data.paymentData);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [status, router]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading advanced analytics...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <style jsx global>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1.5rem;
        }
        .col-3 { grid-column: span 3 / span 3; }
        .col-4 { grid-column: span 4 / span 4; }
        .col-8 { grid-column: span 8 / span 8; }
        .col-12 { grid-column: span 12 / span 12; }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: repeat(6, 1fr);
          }
          .col-3 { grid-column: span 3 / span 3; }
          .col-4 { grid-column: span 6 / span 6; }
          .col-8 { grid-column: span 6 / span 6; }
        }

        @media (max-width: 640px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .col-3, .col-4, .col-8, .col-12 { 
            grid-column: span 1 / span 1; 
          }
        }
      `}</style>

      {/* Row 1: Executive KPIs */}
      <div>
        <h2 className="heading-2" style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--foreground)' }}>Executive Dashboard</h2>
        <div className="dashboard-grid">
          <div className="col-3">
            <MetricCard 
              title="Total Sales" 
              icon={<TrendingUp size={18} />} 
              value={`Ksh ${metrics.totalSales.toLocaleString()}`} 
              subline="This month's revenue"
              accentColor="#3b82f6"
            />
          </div>
          <div className="col-3">
            <MetricCard 
              title="Gross Profit" 
              icon={<DollarSign size={18} />} 
              value={`Ksh ${metrics.grossProfit.toLocaleString()}`} 
              subline="Before operating expenses"
              accentColor="#10b981"
            />
          </div>
          <div className="col-3">
            <MetricCard 
              title="Profit Margin" 
              icon={<Activity size={18} />} 
              value={`${metrics.profitMargin.toFixed(1)}%`} 
              subline="Average yield per sale"
              accentColor="#8b5cf6"
            />
          </div>
          <div className="col-3">
            <MetricCard 
              title="Transactions" 
              icon={<ShoppingCart size={18} />} 
              value={metrics.transactionCount.toLocaleString()} 
              subline="Total closed orders"
              accentColor="#f59e0b"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Operational Insights */}
      <div>
        <h2 className="heading-2" style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--foreground)' }}>Operational Insights</h2>
        <div className="dashboard-grid">
          <div className="col-3">
            <InsightCard 
              title="Low Stock Items"
              value={metrics.lowStockCount.toLocaleString()}
              context="Items with ≤ 5 units left"
              status={metrics.lowStockCount > 0 ? 'danger' : 'success'}
              onClick={() => router.push('/products?filter=low-stock')}
            />
          </div>
          <div className="col-3">
            <InsightCard 
              title="Top Selling Product"
              value={metrics.topProduct.name}
              context={`${metrics.topProduct.qty} units sold this month`}
              status="neutral"
            />
          </div>
          <div className="col-3">
            <InsightCard 
              title="Avg. Transaction Value"
              value={`Ksh ${metrics.atv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              context="Average order size"
              status="neutral"
            />
          </div>
          <div className="col-3">
            <InsightCard 
              title="Stock Value at Risk"
              value={`Ksh ${metrics.stockValue.toLocaleString()}`}
              context="Total inventory valuation"
              status="warning"
            />
          </div>
        </div>
      </div>

      {/* Row 3: Visual Charts */}
      <div>
        <h2 className="heading-2" style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--foreground)' }}>Performance Trends</h2>
        <div className="dashboard-grid" style={{ minHeight: '350px' }}>
          
          <div className="col-8 glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--muted-foreground)' }}>
              <BarChart3 size={18} className="text-primary" /> 
              <h3 style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sales Trend (Last 7 Days)</h3>
            </div>
            <div className="chart-container" style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `${value / 1000}k`} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                    formatter={(value) => [`Ksh ${value.toLocaleString()}`, 'Sales']}
                    cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line type="monotone" dataKey="Sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'var(--background)' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-4 glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--muted-foreground)' }}>
              <Tag size={18} className="text-primary" /> 
              <h3 style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue by Payment</h3>
            </div>
            <div className="chart-container" style={{ flex: 1 }}>
              {paymentData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>No Data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `Ksh ${value.toLocaleString()}`}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Active Credit Sales */}
      <div>
        <h2 className="heading-2" style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--foreground)' }}>Outstanding Credit Sales</h2>
        <CreditSalesTable />
      </div>

    </div>
  );
}

