import React, { useEffect, useState } from 'react';
import Layout from '../common/Layout';
import SalesChart from './SalesChart';
import CategoryPieChart from './CategoryPieChart';
import OrderTrendChart from './OrderTrendChart';
import api from '../../services/api';

function ReportsPage() {
    const [bestSelling, setBestSelling] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [isPredicting, setIsPredicting] = useState(false);

    useEffect(() => {
        api.get('/reports/best-selling').then(res => setBestSelling(res.data));
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

    return (
        <Layout>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">📈 Sales Reports & Analytics</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Daily Sales Revenue</h3>
                    <SalesChart />
                </div>
                <div className="bg-white rounded-2xl shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Sales by Category</h3>
                    <CategoryPieChart />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Order Trend (30 Days)</h3>
                <OrderTrendChart />
            </div>

            <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">🏆 Best Selling Items</h3>
                <table className="w-full text-sm">
                    <thead className="text-left text-gray-500 border-b">
                        <tr>
                            <th className="pb-2">#</th>
                            <th className="pb-2">Item</th>
                            <th className="pb-2">Qty Sold</th>
                            <th className="pb-2">Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bestSelling.map((item, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="py-2 text-gray-400">{i + 1}</td>
                                <td className="py-2 font-medium text-gray-800">{item.menu_item?.name}</td>
                                <td className="py-2 text-blue-500 font-semibold">{item.total_quantity}</td>
                                <td className="py-2 text-orange-500 font-semibold">₱{Number(item.total_revenue).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* AI Demand Forecast Section */}
            <div className="bg-white rounded-2xl shadow p-6 border-t-4 border-indigo-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span>🔮</span> AI Demand Forecast (Next 7 Days)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Predicts menu item demand using a Logistic Regression model trained on historical context.
                        </p>
                    </div>
                    <button
                        onClick={handleGenerateForecast}
                        disabled={isPredicting}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold py-2 px-5 rounded-lg shadow-md transition-colors flex items-center gap-2"
                    >
                        {isPredicting ? (
                            <>
                                <span className="animate-spin text-lg">↻</span> Generating...
                            </>
                        ) : (
                            <>
                                <span>⚡</span> Generate Weekly Forecast
                            </>
                        )}
                    </button>
                </div>

                {/* Metrics Bar */}
                {metrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Accuracy</div>
                            <div className="text-xl font-extrabold text-indigo-700">{(metrics.accuracy * 100).toFixed(1)}%</div>
                        </div>
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Precision</div>
                            <div className="text-xl font-extrabold text-indigo-700">{(metrics.precision * 100).toFixed(1)}%</div>
                        </div>
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Recall</div>
                            <div className="text-xl font-extrabold text-indigo-700">{(metrics.recall * 100).toFixed(1)}%</div>
                        </div>
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">F1 Score</div>
                            <div className="text-xl font-extrabold text-indigo-700">{(metrics.f1_score * 100).toFixed(1)}%</div>
                        </div>
                    </div>
                )}
                
                {metrics && (
                    <div className="text-xs text-gray-400 mb-4 font-mono bg-gray-50 p-2 rounded border inline-block">
                        Model last trained at: {new Date(metrics.trained_at).toLocaleString()}
                        <br/>
                        Notes: {metrics.notes}
                    </div>
                )}

                {/* Predictions Grid */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-gray-500 border-b">
                            <tr>
                                <th className="pb-2 pl-2">Menu Item</th>
                                <th className="pb-2">Predicted Demand</th>
                                <th className="pb-2">Confidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.map((p, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="py-3 pl-2 font-medium text-gray-800">
                                        {p.menu_item?.name}
                                    </td>
                                    <td className="py-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            p.predicted_label === 'High Demand' 
                                                ? 'bg-red-100 text-red-600 border border-red-200 shadow-sm' 
                                                : 'bg-green-100 text-green-600 border border-green-200'
                                        }`}>
                                            {p.predicted_label === 'High Demand' ? '🔥 High Demand' : '✅ Low Demand'}
                                        </span>
                                    </td>
                                    <td className="py-3 font-mono text-gray-500">
                                        {(p.confidence_score * 100).toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                            {predictions.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="text-center py-8 text-gray-400">
                                        No predictions found for this week. Click 'Generate Weekly Forecast' to run the model.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </Layout>
    );
}

export default ReportsPage;