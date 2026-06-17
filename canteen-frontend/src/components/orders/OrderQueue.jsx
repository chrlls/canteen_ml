import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

const STATUS_COLORS = {
    Pending:   { bg: 'rgba(243,156,18,0.12)',  color: '#f39c12', border: 'rgba(243,156,18,0.25)'  },
    Preparing: { bg: 'rgba(52,152,219,0.12)',  color: '#3498db', border: 'rgba(52,152,219,0.25)'  },
    Ready:     { bg: 'rgba(39,174,96,0.12)',   color: '#27ae60', border: 'rgba(39,174,96,0.25)'   },
    Completed: { bg: 'rgba(150,150,150,0.10)', color: '#999',    border: 'rgba(150,150,150,0.2)'  },
    Cancelled: { bg: 'rgba(231,76,60,0.10)',   color: '#e74c3c', border: 'rgba(231,76,60,0.2)'    },
};

const nextStatus = {
    Pending:   'Preparing',
    Preparing: 'Ready',
    Ready:     'Completed',
};

const nextLabel = {
    Pending:   '🔥 Start Preparing',
    Preparing: '✅ Mark Ready',
    Ready:     '🎉 Complete',
};

function OrderQueue() {
    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [pulse, setPulse]           = useState(false);
    const [updating, setUpdating]     = useState(null);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await api.get('/orders');
            const sorted = res.data.sort((a, b) => {
                const priority = { Pending: 0, Preparing: 1, Ready: 2, Completed: 3, Cancelled: 4 };
                return (priority[a.status] ?? 9) - (priority[b.status] ?? 9);
            });
            setOrders(sorted);
            setLastUpdate(new Date());
            setPulse(true);
            setTimeout(() => setPulse(false), 500);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000); // ✅ every 5 seconds
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const updateStatus = async (id, status) => {
        setUpdating(id);
        try {
            await api.patch(`/orders/${id}/status`, { status });
            await fetchOrders(); // ✅ immediate refresh
        } catch {
            alert('Failed to update status.');
        } finally {
            setUpdating(null);
        }
    };

    const timeAgo = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (diff < 60)   return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
                .oq { font-family: 'Poppins', sans-serif; }
                .oq-card {
                    background: #fff; border-radius: 20px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
                    border: 1px solid #f0f0f0; overflow: hidden; position: relative;
                }
                .oq-card::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, #e74c3c, #ff8a80, #e74c3c);
                    background-size: 200% 100%; animation: oqShim 3s linear infinite;
                }
                @keyframes oqShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                .oq-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 1.25rem 1.5rem 1rem; flex-wrap: wrap; gap: 0.5rem;
                    border-bottom: 1px solid #f5f5f5;
                }
                .oq-title { font-size: 1.1rem; font-weight: 800; color: #1a1a2e; }
                .oq-sub   { font-size: 0.68rem; color: #bbb; margin-top: 2px; }
                .oq-live {
                    display: flex; align-items: center; gap: 6px;
                    background: #f8f8f8; border: 1px solid #ebebeb;
                    border-radius: 20px; padding: 0.3rem 0.8rem;
                    font-size: 0.68rem; font-weight: 600; color: #888;
                }
                .oq-live-dot {
                    width: 7px; height: 7px; border-radius: 50%; background: #27ae60;
                    animation: oqPulse 2s ease-in-out infinite;
                }
                @keyframes oqPulse {
                    0%,100%{opacity:1;transform:scale(1);box-shadow:0 0 0 0 rgba(39,174,96,0.4)}
                    50%    {opacity:0.8;transform:scale(1.15);box-shadow:0 0 0 4px rgba(39,174,96,0)}
                }
                .oq-live-dot.pulse { background: #e74c3c; }
                .oq-body { padding: 1.25rem 1.5rem 1.5rem; }
                .oq-empty { text-align: center; padding: 3rem 1rem; color: #bbb; }
                .oq-empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
                .oq-table { width: 100%; border-collapse: collapse; }
                .oq-table th {
                    text-align: left; padding: 0.5rem 0.75rem;
                    font-size: 0.67rem; color: #bbb; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.09em;
                    border-bottom: 1px solid #f0f0f0;
                }
                .oq-table td {
                    padding: 0.85rem 0.75rem; border-bottom: 1px solid #f8f8f8;
                    font-size: 0.82rem; vertical-align: middle;
                }
                .oq-table tr:last-child td { border-bottom: none; }
                .oq-table tr:hover td { background: #fafafa; }
                .oq-order-num  { font-weight: 800; color: #1a1a2e; font-size: 0.82rem; }
                .oq-order-time { font-size: 0.65rem; color: #bbb; margin-top: 1px; }
                .oq-customer   { color: #555; font-weight: 500; }
                .oq-total      { color: #e74c3c; font-weight: 800; }
                .oq-status-badge {
                    padding: 0.22rem 0.65rem; border-radius: 20px;
                    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.04em;
                    display: inline-block;
                }
                .oq-items-list { font-size: 0.72rem; color: #888; }
                .oq-items-list span { display: block; }
                .oq-action-btn {
                    padding: 0.4rem 0.85rem; border: none; border-radius: 8px;
                    font-family: 'Poppins', sans-serif; font-size: 0.72rem; font-weight: 700;
                    cursor: pointer; transition: opacity 0.18s, transform 0.18s;
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    color: #fff; box-shadow: 0 2px 8px rgba(231,76,60,0.25);
                    white-space: nowrap;
                }
                .oq-action-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
                .oq-action-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
                .oq-shimmer {
                    background: linear-gradient(90deg,#f0f0f0 25%,#fafafa 50%,#f0f0f0 75%);
                    background-size: 200% 100%; animation: oqShimLoad 1.4s infinite;
                    border-radius: 12px; height: 48px; margin-bottom: 0.5rem;
                }
                @keyframes oqShimLoad { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
            `}</style>

            <div className="oq">
                <div className="oq-card">
                    <div className="oq-header">
                        <div>
                            <div className="oq-title">📋 Order Queue</div>
                            <div className="oq-sub">
                                {lastUpdate ? `Updated ${timeAgo(lastUpdate.toISOString())}` : 'Loading...'}
                                {' · '}{orders.length} order{orders.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div className="oq-live">
                            <span className={`oq-live-dot ${pulse ? 'pulse' : ''}`} />
                            Live · 5s
                        </div>
                    </div>

                    <div className="oq-body">
                        {loading ? (
                            [1,2,3].map(i => <div key={i} className="oq-shimmer" />)
                        ) : orders.length === 0 ? (
                            <div className="oq-empty">
                                <div className="oq-empty-icon">📭</div>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No orders yet</p>
                                <p style={{ fontSize: '0.75rem', marginTop: 4 }}>New orders appear here automatically</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="oq-table">
                                    <thead>
                                        <tr>
                                            <th>Order</th>
                                            <th>Customer</th>
                                            <th>Items</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => {
                                            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.Pending;
                                            return (
                                                <tr key={order.id}>
                                                    <td>
                                                        <div className="oq-order-num">{order.order_number}</div>
                                                        <div className="oq-order-time">{order.created_at ? timeAgo(order.created_at) : ''}</div>
                                                    </td>
                                                    <td className="oq-customer">{order.user?.name || '—'}</td>
                                                    <td>
                                                        <div className="oq-items-list">
                                                            {order.order_items?.slice(0, 2).map((item, i) => (
                                                                <span key={i}>{item.menu_item?.name || 'Item'} ×{item.quantity}</span>
                                                            ))}
                                                            {order.order_items?.length > 2 && (
                                                                <span style={{ color: '#bbb' }}>+{order.order_items.length - 2} more</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="oq-total">₱{Number(order.total_amount).toFixed(2)}</td>
                                                    <td>
                                                        <span className="oq-status-badge"
                                                            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {nextStatus[order.status] && (
                                                            <button
                                                                className="oq-action-btn"
                                                                disabled={updating === order.id}
                                                                onClick={() => updateStatus(order.id, nextStatus[order.status])}
                                                            >
                                                                {updating === order.id ? '⏳' : nextLabel[order.status]}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default OrderQueue;