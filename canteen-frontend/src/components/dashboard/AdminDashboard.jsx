import React, { useEffect, useState } from 'react';
import Layout from '../common/Layout';
import SalesChart from './SalesChart';
import CategoryPieChart from './CategoryPieChart';
import OrderTrendChart from './OrderTrendChart';
import api from '../../services/api';

const STAT_CARDS = [
  { key: 'total_sales',         label: 'Total Sales',    icon: '💰', prefix: '₱', format: v => Number(v).toLocaleString(),  color: '#e74c3c', bg: 'rgba(231,76,60,0.09)',   border: 'rgba(231,76,60,0.18)'  },
  { key: 'total_orders',        label: 'Total Orders',   icon: '🧾', prefix: '',  format: v => Number(v).toLocaleString(),  color: '#3498db', bg: 'rgba(52,152,219,0.09)',  border: 'rgba(52,152,219,0.18)' },
  { key: 'average_order_value', label: 'Avg. Order',     icon: '📊', prefix: '₱', format: v => Number(v).toFixed(2),        color: '#27ae60', bg: 'rgba(39,174,96,0.09)',   border: 'rgba(39,174,96,0.18)'  },
  { key: 'pending_orders',      label: 'Pending Orders', icon: '⏳', prefix: '',  format: v => Number(v || 0),              color: '#f39c12', bg: 'rgba(243,156,18,0.09)',  border: 'rgba(243,156,18,0.18)' },
];

export default function AdminDashboard() {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    api.get('/reports/summary')
      .then(r => setSummary(r.data))
      .catch(console.log)
      .finally(() => { setLoading(false); setTimeout(() => setVisible(true), 60); });
  }, []);

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

        /* ── Page wrapper ── */
        .ad { font-family: 'Poppins', sans-serif; position: relative; }

        /* ── Page header ── */
        .ad-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          flex-wrap: wrap; gap: 0.75rem;
          margin-bottom: 1.75rem;
        }
        .ad-page-title {
          font-size: 1.45rem; font-weight: 800; color: #1a1a2e;
          margin-bottom: 0.2rem; letter-spacing: -0.3px;
        }
        .ad-page-sub { font-size: 0.8rem; color: #bbb; font-weight: 400; }

        /* Live badge */
        .ad-live-badge {
          display: flex; align-items: center; gap: 6px;
          background: #fff; border: 1px solid #f0f0f0;
          border-radius: 20px; padding: 0.4rem 0.9rem;
          font-size: 0.72rem; font-weight: 600; color: #888;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          white-space: nowrap;
        }
        .ad-live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #27ae60;
          animation: adPulse 2s ease-in-out infinite;
        }
        @keyframes adPulse {
          0%,100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(39,174,96,0.4); }
          50%      { opacity: 0.8; transform: scale(1.1); box-shadow: 0 0 0 4px rgba(39,174,96,0); }
        }

        /* ── Stat Cards ── */
        .ad-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 1rem; margin-bottom: 1.25rem;
        }
        .ad-stat {
          background: #ffffff;
          border-radius: 18px;
          padding: 1.3rem 1.5rem;
          box-shadow: 0 2px 12px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.04);
          border: 1px solid #f0f0f0;
          display: flex; align-items: center; gap: 1rem;
          opacity: 0; transform: translateY(18px);
          transition: opacity 0.45s ease, transform 0.45s ease, box-shadow 0.22s;
          position: relative; overflow: hidden;
        }
        /* shimmer accent line on top of each card */
        .ad-stat::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--accent), var(--accent-light), var(--accent));
          background-size: 200% 100%;
          animation: shimmerBar 3s linear infinite;
          border-radius: 18px 18px 0 0;
        }
        @keyframes shimmerBar {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ad-stat.show { opacity: 1; transform: translateY(0); }
        .ad-stat:hover {
          box-shadow: 0 8px 28px rgba(0,0,0,0.1);
          transform: translateY(-3px) !important;
        }
        .ad-stat:nth-child(1) { transition-delay: 0.05s; }
        .ad-stat:nth-child(2) { transition-delay: 0.12s; }
        .ad-stat:nth-child(3) { transition-delay: 0.19s; }
        .ad-stat:nth-child(4) { transition-delay: 0.26s; }

        .ad-stat-icon {
          width: 52px; height: 52px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; flex-shrink: 0;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);
        }
        .ad-stat-label {
          font-size: 0.68rem; font-weight: 700; color: #bbb;
          text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 4px;
        }
        .ad-stat-value {
          font-size: 1.65rem; font-weight: 800; line-height: 1.05;
          letter-spacing: -0.5px;
        }
        .ad-stat-trend {
          font-size: 0.68rem; font-weight: 600; color: #27ae60;
          margin-top: 3px;
        }

        /* ── Chart Cards ── */
        .ad-charts-row {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1rem; margin-bottom: 1rem;
        }
        .ad-chart-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 1.4rem 1.5rem;
          box-shadow: 0 2px 12px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.04);
          border: 1px solid #f0f0f0;
          opacity: 0; transform: translateY(14px);
          transition: opacity 0.5s ease, transform 0.5s ease;
          position: relative; overflow: hidden;
        }
        /* Red top accent bar on chart cards */
        .ad-chart-card::before,
        .ad-chart-full::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #e74c3c, #ff8a80, #e74c3c);
          background-size: 200% 100%;
          animation: shimmerBar 3s linear infinite;
          border-radius: 18px 18px 0 0;
        }
        .ad-chart-card.show { opacity: 1; transform: translateY(0); }
        .ad-chart-card:nth-child(1) { transition-delay: 0.32s; }
        .ad-chart-card:nth-child(2) { transition-delay: 0.40s; }

        .ad-chart-full {
          background: #ffffff;
          border-radius: 18px;
          padding: 1.4rem 1.5rem;
          box-shadow: 0 2px 12px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.04);
          border: 1px solid #f0f0f0;
          opacity: 0; transform: translateY(14px);
          transition: opacity 0.5s ease 0.48s, transform 0.5s ease 0.48s;
          position: relative; overflow: hidden;
        }
        .ad-chart-full.show { opacity: 1; transform: translateY(0); }

        .ad-chart-header { margin-bottom: 1.1rem; }
        .ad-chart-title-bar {
          display: flex; align-items: center; gap: 8px; margin-bottom: 3px;
        }
        .ad-chart-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          box-shadow: 0 2px 6px rgba(231,76,60,0.4);
          flex-shrink: 0;
        }
        .ad-chart-title {
          font-size: 0.95rem; font-weight: 700; color: #1a1a2e;
        }
        .ad-chart-sub {
          font-size: 0.72rem; color: #bbb; font-weight: 400;
          padding-left: 16px;
        }

        /* ── Shimmer skeleton ── */
        .ad-shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #fafafa 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 18px;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Section divider label ── */
        .ad-section-label {
          display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 0.9rem; margin-top: 0.25rem;
        }
        .ad-section-line { flex: 1; height: 1px; background: #ebebeb; }
        .ad-section-text {
          font-size: 0.67rem; color: #ccc; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .ad-charts-row { grid-template-columns: 1fr; }
          .ad-header { flex-direction: column; }
        }
      `}</style>

      <div className="ad">

        {/* ── Page Header ── */}
        <div className="ad-header">
          <div>
            <div className="ad-page-title">Dashboard Overview</div>
            <div className="ad-page-sub">Real-time summary of your canteen's performance</div>
          </div>
          <div className="ad-live-badge">
            <span className="ad-live-dot" />
            Live Data
          </div>
        </div>

        {/* ── Section Label ── */}
        <div className="ad-section-label">
          <div className="ad-section-line" />
          <span className="ad-section-text">Key Metrics</span>
          <div className="ad-section-line" />
        </div>

        {/* ── Stat Cards ── */}
        <div className="ad-stats">
          {loading
            ? [1,2,3,4].map(i => <div key={i} className="ad-shimmer" style={{ height: 96 }} />)
            : STAT_CARDS.map((c, i) => (
              <div
                key={i}
                className={`ad-stat ${visible ? 'show' : ''}`}
                style={{
                  '--accent':       c.color,
                  '--accent-light': c.color + '88',
                }}
              >
                <div className="ad-stat-icon" style={{ background: c.bg }}>
                  {c.icon}
                </div>
                <div className="ad-stat-body">
                  <div className="ad-stat-label">{c.label}</div>
                  <div className="ad-stat-value" style={{ color: c.color }}>
                    {c.prefix}{c.format(summary[c.key] ?? 0)}
                  </div>
                </div>
              </div>
            ))
          }
        </div>

        {/* ── Section Label ── */}
        <div className="ad-section-label">
          <div className="ad-section-line" />
          <span className="ad-section-text">Analytics</span>
          <div className="ad-section-line" />
        </div>

        {/* ── Charts Row ── */}
        <div className="ad-charts-row">
          <div className={`ad-chart-card ${visible ? 'show' : ''}`}>
            <div className="ad-chart-header">
              <div className="ad-chart-title-bar">
                <span className="ad-chart-dot" />
                <span className="ad-chart-title">Daily Sales</span>
              </div>
              <div className="ad-chart-sub">Revenue breakdown by day</div>
            </div>
            <SalesChart />
          </div>
          <div className={`ad-chart-card ${visible ? 'show' : ''}`}>
            <div className="ad-chart-header">
              <div className="ad-chart-title-bar">
                <span className="ad-chart-dot" />
                <span className="ad-chart-title">Sales by Category</span>
              </div>
              <div className="ad-chart-sub">Distribution across menu categories</div>
            </div>
            <CategoryPieChart />
          </div>
        </div>

        {/* ── Full-width Chart ── */}
        <div className={`ad-chart-full ${visible ? 'show' : ''}`}>
          <div className="ad-chart-header">
            <div className="ad-chart-title-bar">
              <span className="ad-chart-dot" />
              <span className="ad-chart-title">Order Trend</span>
            </div>
            <div className="ad-chart-sub">Last 30 days of order activity</div>
          </div>
          <OrderTrendChart />
        </div>

      </div>
    </Layout>
  );
}