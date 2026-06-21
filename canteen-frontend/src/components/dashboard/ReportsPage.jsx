import React, { useEffect, useState } from 'react';
import Layout from '../common/Layout';
import SalesChart from './SalesChart';
import CategoryPieChart from './CategoryPieChart';
import OrderTrendChart from './OrderTrendChart';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DollarSign, ShoppingCart, CreditCard, Zap, TrendingUp, RefreshCw, Clock, Target, Filter, CheckCircle, ArrowLeftRight, Search, Download } from 'lucide-react';

export default function ReportsPage() {
    const [bestSelling, setBestSelling] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [summary, setSummary] = useState({});
    const [metrics, setMetrics] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [isPredicting, setIsPredicting] = useState(false);

    // Sort and Search for Predictions
    const [searchPredict, setSearchPredict] = useState('');
    const [filterDemand, setFilterDemand] = useState('All');
    const [sortPredict, setSortPredict] = useState({ key: 'name', direction: 'asc' });

    useEffect(() => {
        api.get('/reports/best-selling').then(res => setBestSelling(res.data));
        api.get('/reports/daily').then(res => setDailyData(res.data)).catch(console.error);
        api.get('/reports/summary').then(res => setSummary(res.data)).catch(console.error);
        fetchPredictionsData();
    }, []);

    const fetchPredictionsData = () => {
        api.get('/predict/metrics/latest').then(res => setMetrics(res.data)).catch(console.error);
        api.get('/predict').then(res => setPredictions(res.data)).catch(console.error);
    };

    const handleGenerateForecast = async () => {
        setIsPredicting(true);
        try {
            await api.post('/predict/generate');
            await api.post('/predict/metrics/sync');
            fetchPredictionsData();
        } catch (error) {
            console.error('Failed to generate predictions:', error);
            alert('Failed to generate predictions. Please ensure the prediction service is online.');
        } finally {
            setIsPredicting(false);
        }
    };

    const handleSortPredict = (key) => {
        let direction = 'asc';
        if (sortPredict.key === key && sortPredict.direction === 'asc') {
            direction = 'desc';
        }
        setSortPredict({ key, direction });
    };

    const combinedData = predictions.map(p => {
        const salesData = bestSelling.find(bs => bs.menu_item?.name === p.menu_item?.name);
        return {
            ...p,
            total_qty: salesData?.total_qty || 0,
            total_revenue: salesData?.total_revenue || 0
        };
    });

    const filteredPredictions = combinedData.filter(p => {
        const matchesSearch = p.menu_item?.name.toLowerCase().includes(searchPredict.toLowerCase());
        const matchesFilter = filterDemand === 'All' ||
            (filterDemand === 'High demand' && p.predicted_label === 'High Demand') ||
            (filterDemand === 'Low demand' && p.predicted_label !== 'High Demand');
        return matchesSearch && matchesFilter;
    });

    const sortedPredictions = [...filteredPredictions].sort((a, b) => {
        const { key, direction } = sortPredict;
        let aVal, bVal;

        if (key === 'name') {
            aVal = a.menu_item?.name || '';
            bVal = b.menu_item?.name || '';
        } else if (key === 'qty') {
            aVal = a.total_qty || 0;
            bVal = b.total_qty || 0;
        } else if (key === 'revenue') {
            aVal = Number(a.total_revenue) || 0;
            bVal = Number(b.total_revenue) || 0;
        } else if (key === 'label') {
            aVal = a.predicted_label;
            bVal = b.predicted_label;
        } else if (key === 'confidence') {
            aVal = a.confidence_score;
            bVal = b.confidence_score;
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const formatDate = (dateString) => {
        if (!dateString) return "Not yet trained";
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    // KPI Calculations
    const totalRevenue = summary.total_sales || 0;
    const totalOrders = summary.total_orders || 0;
    const avgOrderValue = summary.average_order_value || 0;
    const itemsTrendingHigh = predictions.filter(p => p.predicted_label === 'High Demand').length;
    const totalForecasted = predictions.length;

    const handleExportCSV = () => {
        const headers = ['Item Name', 'Category', 'Sold (7D)', 'Revenue', 'Forecast', 'Confidence'];
        const csvRows = [headers.join(',')];

        sortedPredictions.forEach(p => {
            const category = p.menu_item?.category?.name || p.menu_item?.category || p.category || 'Item';
            const revenue = p.total_revenue || 0;
            const confidence = (p.confidence_score * 100).toFixed(2) + '%';
            
            const row = [
                `"${p.menu_item?.name}"`,
                `"${category}"`,
                p.total_qty || 0,
                revenue,
                `"${p.predicted_label}"`,
                `"${confidence}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `forecast_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout hideNavbar={true}>
            <div className="flex flex-col gap-6 w-full pb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-[#1e293b] flex items-center gap-2">
                            Analytics
                        </h1>
                        <p className="text-[15px] font-medium text-slate-500/90 mt-1.5 tracking-wide">View revenue, popular items, and AI demand forecasts.</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* Revenue Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-[13px] font-semibold text-gray-500">Total revenue</h3>
                            <div className="bg-red-50 p-2 rounded-[10px] text-red-400">
                                <DollarSign size={16} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="mt-2">
                            <div className="text-[26px] font-semibold text-[#1e293b] tracking-tight mb-2">₱{(Number(totalRevenue) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                                <TrendingUp size={12} strokeWidth={3} />
                                <span>+12.4% vs last week</span>
                            </div>
                        </div>
                    </div>

                    {/* Orders Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-[13px] font-semibold text-gray-500">Orders</h3>
                            <div className="bg-red-50 p-2 rounded-[10px] text-red-400">
                                <ShoppingCart size={16} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="mt-2">
                            <div className="text-[26px] font-semibold text-[#1e293b] tracking-tight mb-2">{(Number(totalOrders) || 0).toLocaleString()}</div>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                                <TrendingUp size={12} strokeWidth={3} />
                                <span>+6.1% vs last week</span>
                            </div>
                        </div>
                    </div>

                    {/* Avg Order Value Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-[13px] font-semibold text-gray-500">Avg. order value</h3>
                            <div className="bg-red-50 p-2 rounded-[10px] text-red-400">
                                <CreditCard size={16} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="mt-2">
                            <div className="text-[26px] font-semibold text-[#1e293b] tracking-tight mb-2">₱{(Number(avgOrderValue) || 0).toFixed(0)}</div>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                                <span>about the same</span>
                            </div>
                        </div>
                    </div>

                    {/* Items Trending High Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-[13px] font-semibold text-gray-500">Items trending high</h3>
                            <div className="bg-red-50 p-2 rounded-[10px] text-red-400">
                                <Zap size={16} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="mt-2">
                            <div className="text-[26px] font-semibold text-[#1e293b] tracking-tight mb-2">{itemsTrendingHigh}</div>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#e15b4d]">
                                <span>out of {totalForecasted} forecasted items</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                    <SalesChart data={dailyData} />
                    <CategoryPieChart />
                    <OrderTrendChart data={dailyData} />
                </div>

                {/* Unified Performance & Forecast Section */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-6 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                                Logistic regression demand classifier
                            </h2>
                            <p className="text-[13px] text-gray-500 font-medium">
                                Predicts next week's menu item demand from historical order context.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Button
                                onClick={handleGenerateForecast}
                                disabled={isPredicting}
                                className="bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold px-5 py-2 h-auto rounded-lg shadow-sm"
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${isPredicting ? 'animate-spin' : ''}`} />
                                Generate weekly forecast
                            </Button>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                <Clock size={12} />
                                Last trained {metrics?.created_at ? formatDate(metrics.created_at) : 'Not yet trained'}
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />



                    {/* Model Performance */}
                    <div className="p-6">
                        {metrics && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[13px] font-semibold text-slate-600">Accuracy</div>
                                        <Target size={14} className="text-[#ea580c]" />
                                    </div>
                                    <div className="text-[22px] font-extrabold text-slate-800 tracking-tight">
                                        {(metrics.accuracy * 100).toFixed(1)}%
                                    </div>
                                </div>
                                <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[13px] font-semibold text-slate-600">Precision</div>
                                        <Filter size={14} className="text-[#ea580c]" />
                                    </div>
                                    <div className="text-[22px] font-extrabold text-slate-800 tracking-tight">
                                        {(metrics.precision * 100).toFixed(1)}%
                                    </div>
                                </div>
                                <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[13px] font-semibold text-slate-600">Recall</div>
                                        <CheckCircle size={14} className="text-[#ea580c]" />
                                    </div>
                                    <div className="text-[22px] font-extrabold text-slate-800 tracking-tight">
                                        {(metrics.recall * 100).toFixed(1)}%
                                    </div>
                                </div>
                                <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[13px] font-semibold text-slate-600">F1 score</div>
                                        <ArrowLeftRight size={14} className="text-[#ea580c]" />
                                    </div>
                                    <div className="text-[22px] font-extrabold text-slate-800 tracking-tight">
                                        {(metrics.f1_score * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-100" />

                    {/* Table Filters */}
                    <div className="p-4 px-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#f8fafc]">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search menu items..."
                                    value={searchPredict}
                                    onChange={e => setSearchPredict(e.target.value)}
                                    className="pl-9 h-9 rounded-full border-gray-200 text-sm shadow-sm bg-white"
                                />
                            </div>
                            <div className="hidden sm:flex bg-white border border-gray-200 rounded-full p-0.5 shadow-sm">
                                {['All', 'High demand', 'Low demand'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilterDemand(f)}
                                        className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors ${filterDemand === f
                                            ? 'bg-slate-800 text-white'
                                            : 'text-gray-500 hover:text-slate-800'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[13px] text-gray-500 font-medium hidden sm:inline-block">
                                {filteredPredictions.length} items
                            </span>
                            <Button 
                                onClick={handleExportCSV}
                                variant="outline" 
                                className="h-9 px-4 rounded-full border-gray-200 text-sm shadow-sm bg-white hover:bg-gray-50 font-bold text-slate-700"
                            >
                                <Download size={14} className="mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border-t border-gray-200">
                        <Table className="min-w-[800px]">
                            <TableHeader className="bg-white">
                                <TableRow className="border-b border-gray-200 hover:bg-transparent">
                                    <TableHead className="font-bold text-[11px] text-gray-500 w-12 text-center h-12">#</TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-gray-500 cursor-pointer hover:text-slate-800" onClick={() => handleSortPredict('name')}>
                                        Item {sortPredict.key === 'name' ? (sortPredict.direction === 'asc' ? '↑' : '↓') : ''}
                                    </TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-gray-500 text-center">
                                        Category
                                    </TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-gray-500 cursor-pointer hover:text-slate-800 text-center" onClick={() => handleSortPredict('qty')}>
                                        Sold (7D) {sortPredict.key === 'qty' ? (sortPredict.direction === 'asc' ? '↑' : '↓') : ''}
                                    </TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-gray-500 cursor-pointer hover:text-slate-800 text-center" onClick={() => handleSortPredict('revenue')}>
                                        Revenue {sortPredict.key === 'revenue' ? (sortPredict.direction === 'asc' ? '↑' : '↓') : ''}
                                    </TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-gray-500 cursor-pointer hover:text-slate-800 text-center" onClick={() => handleSortPredict('label')}>
                                        Forecast {sortPredict.key === 'label' ? (sortPredict.direction === 'asc' ? '↑' : '↓') : ''}
                                    </TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-gray-500 cursor-pointer hover:text-slate-800 text-center" onClick={() => handleSortPredict('confidence')}>
                                        Confidence {sortPredict.key === 'confidence' ? (sortPredict.direction === 'asc' ? '↑' : '↓') : ''}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedPredictions.map((p, i) => (
                                    <TableRow key={i} className="hover:bg-slate-50 border-b border-gray-100 transition-colors">
                                        <TableCell className="text-center py-3">
                                            <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-[11px] font-bold text-gray-500">
                                                {i + 1}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-800 text-[13px]">
                                            {p.menu_item?.name}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-gray-100 text-gray-500">
                                                {p.menu_item?.category?.name || 'Item'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-[13px] text-slate-600 text-center font-medium">
                                            {p.total_qty || '-'}
                                        </TableCell>
                                        <TableCell className="font-extrabold text-slate-800 text-[13px] text-center">
                                            {p.total_revenue ? `₱${Number(p.total_revenue).toLocaleString()}` : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {p.predicted_label === 'High Demand' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-red-50 text-[#ea580c]">
                                                    <Zap size={10} fill="currentColor" />
                                                    High demand
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-emerald-50 text-emerald-600">
                                                    <CheckCircle size={10} />
                                                    Low demand
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${p.predicted_label === 'High Demand' ? 'bg-[#ea580c]' : 'bg-gray-400'}`}
                                                        style={{ width: `${(p.confidence_score * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="font-medium text-[12px] text-gray-500 w-12 text-left">
                                                    {(p.confidence_score * 100).toFixed(2)}%
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}