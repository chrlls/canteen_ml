import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../common/Layout';
import SalesChart from './SalesChart';
import CategoryPieChart from './CategoryPieChart';
import OrderTrendChart from './OrderTrendChart';
import api from '../../services/api';
import { DollarSign, ShoppingCart, CreditCard, Clock, TrendingUp, Package, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';


export default function AdminDashboard() {
    const { user } = useAuth();
    const [summary, setSummary] = useState({});
    const [dailyData, setDailyData] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [bestSellingItems, setBestSellingItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/reports/summary'),
            api.get('/reports/daily'),
            api.get('/orders'),
            api.get('/inventory/low-stock'),
            api.get('/reports/best-selling')
        ])
            .then(([summaryRes, dailyRes, ordersRes, stockRes, bestRes]) => {
                setSummary(summaryRes.data);
                setDailyData(dailyRes.data);
                setRecentOrders(ordersRes.data.slice(0, 7));
                setLowStockItems(stockRes.data.slice(0, 10));
                setBestSellingItems(bestRes.data.slice(0, 10));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const timeAgo = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <Layout hideNavbar={true}>
            <div className="flex flex-col gap-6 w-full">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-[#1e293b]">Hello, Admin</h1>
                        <p className="text-[15px] font-medium text-slate-500/90 mt-1.5 tracking-wide">Here's a quick overview of what's happening today.</p>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* Revenue Card */}
                    <Link to="/reports" className="block focus-visible:ring-2 focus-visible:ring-primary rounded-2xl outline-none">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow h-full">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-[13px] font-semibold text-gray-500">Total revenue</h3>
                                <div className="bg-red-50 p-2 rounded-[10px] text-red-400">
                                    <DollarSign size={16} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="text-[26px] font-semibold text-[#1e293b] tracking-tight mb-2">
                                    ₱{(Number(summary.total_sales) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                                    <TrendingUp size={12} strokeWidth={3} />
                                    <span>+12.4% vs last week</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Orders Card */}
                    <Link to="/orders" className="block focus-visible:ring-2 focus-visible:ring-primary rounded-2xl outline-none">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow h-full">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-[13px] font-semibold text-gray-500">Total Orders</h3>
                                <div className="bg-red-50 p-2 rounded-[10px] text-red-400">
                                    <ShoppingCart size={16} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="text-[26px] font-semibold text-[#1e293b] tracking-tight mb-2">
                                    {(Number(summary.total_orders) || 0).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                                    <TrendingUp size={12} strokeWidth={3} />
                                    <span>+6.1% vs last week</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Avg Order Value Card */}
                    <Link to="/reports" className="block focus-visible:ring-2 focus-visible:ring-primary rounded-2xl outline-none">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow h-full">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-[13px] font-semibold text-gray-500">Avg. order value</h3>
                                <div className="bg-red-50 p-2 rounded-[10px] text-red-400">
                                    <CreditCard size={16} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="text-[26px] font-semibold text-[#1e293b] tracking-tight mb-2">
                                    ₱{(Number(summary.average_order_value) || 0).toFixed(2)}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                                    <span>about the same</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Pending Orders Card */}
                    <Link to="/orders" className="block focus-visible:ring-2 focus-visible:ring-primary rounded-2xl outline-none">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow h-full">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-[13px] font-semibold text-gray-500">Pending Orders</h3>
                                <div className="bg-red-50 p-2 rounded-[10px] text-red-400">
                                    <Clock size={16} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="text-[26px] font-semibold text-[#1e293b] tracking-tight mb-2">
                                    {summary.pending_orders || 0}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#e15b4d]">
                                    <span>out of {(Number(summary.total_orders) || 0).toLocaleString()} total orders</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <SalesChart data={dailyData} />
                    <CategoryPieChart />
                    <OrderTrendChart data={dailyData} />
                </div>
                {/* Operational Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">

                    {/* Column 1: Recent Orders */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-lg font-semibold text-[#1e293b] flex items-center gap-2">
                            <Package size={18} className="text-primary" /> Recent Orders
                        </h2>
                        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden h-full">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/30">
                                    <tr>
                                        <th className="py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[20%]">Order ID</th>
                                        <th className="py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[40%]">Items</th>
                                        <th className="py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[20%]">Status</th>
                                        <th className="py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right w-[20%]">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {recentOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-[13px] font-medium text-muted-foreground">No recent orders.</td>
                                        </tr>
                                    ) : (
                                        recentOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-sm text-[#1e293b]">#{order.id.toString().padStart(4, '0')}</div>
                                                    <div className="text-[11px] font-medium text-muted-foreground">{timeAgo(order.created_at)}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-xs font-medium text-slate-600 line-clamp-2 leading-tight">
                                                        {order.order_items?.map(i => `${i.quantity}x ${i.menu_item?.name}`).join(', ') || 'No items'}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${order.status === 'Completed' ? 'bg-success/10 text-success' : order.status === 'Pending' ? 'bg-warning/10 text-warning' : order.status === 'Cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-blue-500/10 text-blue-500'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm font-semibold text-[#1e293b] text-right">
                                                    ₱{(Number(order.total_amount) || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Column 2: Top Selling Items */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-lg font-semibold text-[#1e293b] flex items-center gap-2">
                            <TrendingUp size={18} className="text-success" /> Top Selling Items
                        </h2>
                        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 flex flex-col gap-3 h-full">
                            {bestSellingItems.length === 0 ? (
                                <div className="text-[13px] font-medium text-muted-foreground text-center py-2">No sales data yet.</div>
                            ) : (
                                bestSellingItems.map((item, index) => (
                                    <div key={item.menu_item_id} className="flex justify-between items-center pb-3 border-b border-border/50 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="font-bold text-muted-foreground text-xs shrink-0 w-4">{index + 1}.</div>
                                            <div className="font-semibold text-sm text-[#1e293b] truncate">{item.menu_item?.name || 'Unknown Item'}</div>
                                        </div>
                                        <div className="font-semibold text-sm text-[#1e293b] shrink-0 pl-2">
                                            {item.total_qty} <span className="text-xs text-muted-foreground font-medium">sold</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Column 3: Low Stock Alerts */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-lg font-semibold text-[#1e293b] flex items-center gap-2">
                            <AlertTriangle size={18} className="text-warning" /> Low Stock Alerts
                        </h2>
                        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 flex flex-col gap-3 h-full">
                            {lowStockItems.length === 0 ? (
                                <div className="flex items-center gap-2 text-success text-[13px] font-medium">
                                    <CheckCircle2 size={16} /> All items are adequately stocked.
                                </div>
                            ) : (
                                lowStockItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center pb-3 border-b border-border/50 last:border-0 last:pb-0">
                                        <div className="font-semibold text-sm text-[#1e293b] truncate pr-2">{item.name}</div>
                                        <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded bg-destructive/10 text-destructive text-xs font-semibold">
                                            <AlertCircle size={12} /> {item.stock} left
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </Layout>
    );
}