import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../common/Layout';
import api from '../../services/api';

// ✅ Capitalized to match DB enum
const SC = {
  Pending:   { label: 'Pending',   color: '#f39c12', bg: 'rgba(243,156,18,0.1)'  },
  Preparing: { label: 'Preparing', color: '#3498db', bg: 'rgba(52,152,219,0.1)'  },
  Ready:     { label: 'Ready',     color: '#27ae60', bg: 'rgba(39,174,96,0.1)'   },
  Completed: { label: 'Completed', color: '#3498db', bg: 'rgba(52,152,219,0.1)'  },
  Cancelled: { label: 'Cancelled', color: '#bbb',    bg: 'rgba(187,187,187,0.1)' },
};

export default function OrderHistory() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [show, setShow]         = useState(false);

  const fetchOrders = useCallback(() => {
    api.get('/orders')
      .then(r => setOrders(r.data))
      .catch(console.log)
      .finally(() => { setLoading(false); setTimeout(() => setShow(true), 60); });
  }, []);

  useEffect(() => {
    fetchOrders();
    // ✅ Auto-refresh every 5s so status updates show in real-time
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const TABS = ['all', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        .oh { font-family:'Poppins',sans-serif; }

        .oh-header { margin-bottom: 1.5rem; }
        .oh-title { font-size:1.45rem;font-weight:800;color:#1a1a2e;margin-bottom:2px;letter-spacing:-0.3px; }
        .oh-sub   { font-size:0.8rem;color:#aaa; }

        .oh-live {
          display:inline-flex;align-items:center;gap:5px;
          background:#f8f8f8;border:1px solid #ebebeb;
          border-radius:20px;padding:0.25rem 0.65rem;
          font-size:0.65rem;font-weight:600;color:#888;
          margin-left:0.75rem;vertical-align:middle;
        }
        .oh-live-dot {
          width:6px;height:6px;border-radius:50%;background:#27ae60;
          animation:ohPulse 2s infinite;display:inline-block;
        }
        @keyframes ohPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.2)} }

        .oh-tabs { display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:1.25rem; }
        .oh-tab {
          padding:0.35rem 1rem;border-radius:20px;border:1.5px solid #e8e8e8;
          background:#fff;font-family:'Poppins',sans-serif;font-size:0.78rem;
          font-weight:500;color:#888;cursor:pointer;transition:all 0.18s;
        }
        .oh-tab:hover { border-color:#e74c3c;color:#e74c3c; }
        .oh-tab.active {
          background:linear-gradient(135deg,#e74c3c,#c0392b);
          border-color:transparent;color:#fff;
          box-shadow:0 3px 10px rgba(231,76,60,0.3);
        }

        .oh-list { display:flex;flex-direction:column;gap:0.75rem; }

        .oh-card {
          background:#fff;border-radius:16px;border:1px solid #f0f0f0;
          box-shadow:0 2px 10px rgba(0,0,0,0.055);overflow:hidden;
          position:relative;
          opacity:0;transform:translateY(14px);
          transition:opacity 0.45s ease,transform 0.45s ease,box-shadow 0.2s;
        }
        .oh-card::before {
          content:'';position:absolute;top:0;left:0;right:0;height:3px;
          background:linear-gradient(90deg,#e74c3c,#ff8a80,#e74c3c);
          background-size:200% 100%;animation:ohShim 3s linear infinite;
        }
        @keyframes ohShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .oh-card.show { opacity:1;transform:translateY(0); }
        .oh-card:hover { box-shadow:0 6px 20px rgba(0,0,0,0.09); }

        .oh-card-header {
          display:flex;align-items:center;gap:1rem;
          padding:1rem 1.25rem;cursor:pointer;transition:background 0.15s;
        }
        .oh-card-header:hover { background:#fafafa; }

        .oh-order-num { font-size:0.9rem;font-weight:800;color:#1a1a2e; }
        .oh-date      { font-size:0.72rem;color:#bbb;margin-top:2px; }
        .oh-badge     { padding:0.22rem 0.7rem;border-radius:20px;font-size:0.68rem;font-weight:700;white-space:nowrap; }
        .oh-total     { font-size:1.05rem;font-weight:800;color:#e74c3c;margin-left:auto;white-space:nowrap; }
        .oh-chevron   { color:#bbb;font-size:0.75rem;transition:transform 0.2s;margin-left:6px;flex-shrink:0; }
        .oh-chevron.open { transform:rotate(180deg); }

        .oh-body { padding:0 1.25rem 1.1rem;border-top:1px solid #f5f5f5; }
        .oh-items-title {
          font-size:0.7rem;font-weight:700;color:#bbb;
          text-transform:uppercase;letter-spacing:0.08em;margin:0.85rem 0 0.5rem;
        }
        .oh-item-row {
          display:flex;justify-content:space-between;
          font-size:0.82rem;color:#555;padding:0.3rem 0;
          border-bottom:1px solid #f7f7f7;
        }
        .oh-item-row:last-child { border:none; }

        .oh-empty {
          background:#fff;border-radius:16px;border:1px solid #f0f0f0;
          box-shadow:0 2px 10px rgba(0,0,0,0.055);
          text-align:center;padding:3rem;color:#bbb;font-size:0.9rem;
        }
        .oh-empty-icon { font-size:2.5rem;margin-bottom:0.5rem; }

        .oh-shimmer {
          background:linear-gradient(90deg,#f0f0f0 25%,#fafafa 50%,#f0f0f0 75%);
          background-size:200% 100%;animation:shimmer 1.4s infinite;
          border-radius:16px;height:68px;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <div className="oh">
        {/* Header */}
        <div className="oh-header">
          <div className="oh-title">
            📋 Order History
            <span className="oh-live">
              <span className="oh-live-dot" /> Live
            </span>
          </div>
          <div className="oh-sub">{filtered.length} orders found</div>
        </div>

        {/* Tabs */}
        <div className="oh-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`oh-tab${filter === t ? ' active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t === 'all' ? 'All Orders' : t}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="oh-list">
            {[1,2,3,4].map(i => <div key={i} className="oh-shimmer" />)}
          </div>
        ) : (
          <div className="oh-list">
            {filtered.length === 0 ? (
              <div className="oh-empty">
                <div className="oh-empty-icon">📭</div>
                <p style={{ fontWeight: 600 }}>No orders found.</p>
                <p style={{ fontSize: '0.78rem', marginTop: 4 }}>
                  {filter === 'all' ? 'Place your first order from Browse Menu!' : `No ${filter} orders yet.`}
                </p>
              </div>
            ) : (
              filtered.map((order, idx) => {
                const s = SC[order.status] || SC.Pending;
                const isOpen = expanded === order.id;
                return (
                  <div
                    key={order.id}
                    className={`oh-card${show ? ' show' : ''}`}
                    style={{ transitionDelay: `${Math.min(idx * 0.05, 0.4)}s` }}
                  >
                    <div className="oh-card-header" onClick={() => setExpanded(isOpen ? null : order.id)}>
                      <div>
                        <div className="oh-order-num">#{order.order_number}</div>
                        <div className="oh-date">
                          {new Date(order.created_at).toLocaleDateString('en-PH', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <span className="oh-badge" style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                      <span className="oh-total">₱{Number(order.total_amount).toFixed(2)}</span>
                      <span className={`oh-chevron${isOpen ? ' open' : ''}`}>▼</span>
                    </div>

                    {isOpen && (
                      <div className="oh-body">
                        <div className="oh-items-title">Items Ordered</div>
                        {/* ✅ Fixed: order.order_items not order.items */}
                        {order.order_items?.map((item, i) => (
                          <div key={i} className="oh-item-row">
                            <span>{item.menu_item?.name || 'Item'} × {item.quantity}</span>
                            <span style={{ fontWeight: 600, color: '#e74c3c' }}>
                              ₱{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'0.6rem', fontWeight:700, color:'#1a1a2e' }}>
                          Total: ₱{Number(order.total_amount).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}