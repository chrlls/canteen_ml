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

export default function ReportsPage() {
    const [bestSelling, setBestSelling] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [isPredicting, setIsPredicting] = useState(false);
    
    // Sort and Search for Predictions
    const [searchPredict, setSearchPredict] = useState('');
    const [sortPredict, setSortPredict] = useState({ key: 'name', direction: 'asc' });

    useEffect(() => {
        api.get('/reports/best-selling').then(res => setBestSelling(res.data));
        api.get('/reports/daily').then(res => setDailyData(res.data)).catch(console.error);
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

    const filteredPredictions = predictions.filter(p =>
        p.menu_item?.name.toLowerCase().includes(searchPredict.toLowerCase())
    );

    const sortedPredictions = [...filteredPredictions].sort((a, b) => {
        const { key, direction } = sortPredict;
        let aVal, bVal;
        
        if (key === 'name') {
            aVal = a.menu_item?.name || '';
            bVal = b.menu_item?.name || '';
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

    return (
        <Layout>
            <div className="flex flex-col gap-6 w-full pb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            📈 Sales Reports & Analytics
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">View revenue, popular items, and AI demand forecasts</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SalesChart data={dailyData} />
                    <CategoryPieChart />
                    <OrderTrendChart data={dailyData} />
                </div>

                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                        <CardTitle className="flex items-center gap-2">🏆 Best Selling Items</CardTitle>
                        <CardDescription>Top 10 items by quantity sold all time</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground w-16">#</TableHead>
                                        <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Item</TableHead>
                                        <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Qty Sold</TableHead>
                                        <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bestSelling.map((item, i) => (
                                        <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                                            <TableCell className="font-bold text-foreground text-sm">{item.menu_item?.name}</TableCell>
                                            <TableCell className="font-extrabold text-blue-500">{item.total_qty}</TableCell>
                                            <TableCell className="font-extrabold text-primary">₱{Number(item.total_revenue).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {bestSelling.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                                No sales data available.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* AI Demand Forecast Section */}
                <Card className="border-border/50 shadow-sm overflow-hidden relative border-t-4 border-t-indigo-500">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/50 bg-muted/10 pb-5">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                AI Demand Forecast (Next 7 Days)
                            </CardTitle>
                            <CardDescription className="max-w-xl">
                                Predicts menu item demand using a Logistic Regression model trained on historical context.
                            </CardDescription>
                        </div>
                        <Button
                            onClick={handleGenerateForecast}
                            disabled={isPredicting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                        >
                            {isPredicting ? (
                                <>Generating...</>
                            ) : (
                                <>Generate Weekly Forecast</>
                            )}
                        </Button>
                    </CardHeader>

                    <CardContent className="p-6">
                        {/* Metrics Grid */}
                        {metrics && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4">
                                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Accuracy</div>
                                    <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">{(metrics.accuracy * 100).toFixed(1)}%</div>
                                </div>
                                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4">
                                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Precision</div>
                                    <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">{(metrics.precision * 100).toFixed(1)}%</div>
                                </div>
                                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4">
                                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Recall</div>
                                    <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">{(metrics.recall * 100).toFixed(1)}%</div>
                                </div>
                                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4">
                                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">F1 Score</div>
                                    <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">{(metrics.f1_score * 100).toFixed(1)}%</div>
                                </div>
                            </div>
                        )}
                        
                        {metrics && (
                            <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-3 rounded-lg mb-6 border border-border/50">
                                <div>Model last trained at: <span className="font-semibold text-foreground">{new Date(metrics.trained_at).toLocaleString()}</span></div>
                                <div className="mt-1">Notes: <span className="text-foreground">{metrics.notes}</span></div>
                            </div>
                        )}

                        <div className="mb-4">
                            <Input
                                type="text"
                                placeholder="Search predicted items by name..."
                                value={searchPredict}
                                onChange={e => setSearchPredict(e.target.value)}
                                className="max-w-sm h-10"
                            />
                        </div>

                        <div className="border border-border/50 rounded-xl overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSortPredict('name')}>
                                            Menu Item {sortPredict.key === 'name' ? (sortPredict.direction === 'asc' ? '(Asc)' : '(Desc)') : ''}
                                        </TableHead>
                                        <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSortPredict('label')}>
                                            Predicted Demand {sortPredict.key === 'label' ? (sortPredict.direction === 'asc' ? '(Asc)' : '(Desc)') : ''}
                                        </TableHead>
                                        <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSortPredict('confidence')}>
                                            Confidence {sortPredict.key === 'confidence' ? (sortPredict.direction === 'asc' ? '(Asc)' : '(Desc)') : ''}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedPredictions.map((p, i) => (
                                        <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-bold text-foreground text-sm">
                                                {p.menu_item?.name}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border backdrop-blur-md ${p.predicted_label === 'High Demand' ? 'bg-destructive/15 text-destructive border-destructive/20' : 'bg-success/15 text-success border-success/20'}`}>
                                                    {p.predicted_label === 'High Demand' ? 'HIGH DEMAND' : 'LOW DEMAND'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {(p.confidence_score * 100).toFixed(2)}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {sortedPredictions.length === 0 && predictions.length > 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <p className="font-medium text-sm">No predictions matched your search.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {predictions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <p className="font-medium text-sm">No predictions found for this week.</p>
                                                    <p className="text-xs mt-1">Click 'Generate Weekly Forecast' to run the model.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}