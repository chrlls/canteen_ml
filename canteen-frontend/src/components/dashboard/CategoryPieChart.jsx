import React, { useEffect, useState } from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import api from '../../services/api';
import { Card, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

export default function CategoryPieChart() {
    const [data, setData] = useState([]);
    const [config, setConfig] = useState({ sales: { label: "Sales" } });

    const [totalValue, setTotalValue] = useState(0);

    useEffect(() => {
        api.get('/reports/categories')
            .then(res => {
                const colors = ['#f97316', '#fca5a5', '#fbbf24', '#e5e7eb', '#f3f4f6'];
                
                const totalSales = res.data.reduce((sum, item) => sum + parseFloat(item.total), 0);
                setTotalValue(totalSales);
                
                const formattedData = res.data.map((item, index) => {
                    const key = item.name.toLowerCase().replace(/\s+/g, '');
                    const sales = parseFloat(item.total);
                    const percentage = totalSales > 0 ? Math.round((sales / totalSales) * 100) : 0;
                    return {
                        category: key,
                        name: item.name,
                        sales: sales,
                        percentage: percentage,
                        fill: colors[index % colors.length]
                    };
                });
                
                // Sort by sales descending to match typical donut charts (largest first)
                formattedData.sort((a, b) => b.sales - a.sales);
                
                // Re-apply colors after sort so largest is orange
                formattedData.forEach((item, index) => {
                    item.fill = colors[index % colors.length];
                });

                const newConfig = { sales: { label: "Sales" } };
                formattedData.forEach((item) => {
                    newConfig[item.category] = {
                        label: item.name,
                        color: item.fill
                    };
                });
                
                setData(formattedData);
                setConfig(newConfig);
            })
            .catch(console.error);
    }, []);

    return (
        <Card className="h-full border border-gray-100 rounded-2xl shadow-sm flex flex-col p-6 pb-2">
            <div className="mb-2">
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Sales by category</h2>
                <p className="text-[13px] text-gray-400 mt-0.5">All-time distribution</p>
            </div>
            <CardContent className="flex-1 p-0 flex items-center">
                {data.length > 0 ? (
                    <div className="flex w-full items-center justify-between">
                        {/* Donut Chart Side */}
                        <div className="relative w-1/2 flex justify-center items-center">
                            <ChartContainer
                                config={config}
                                className="aspect-square w-[160px] h-[160px]"
                            >
                                <PieChart>
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                    <Pie 
                                        data={data} 
                                        dataKey="sales" 
                                        nameKey="category" 
                                        innerRadius={55} 
                                        outerRadius={80} 
                                        stroke="none"
                                        paddingAngle={2}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                            
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[17px] font-extrabold text-slate-800">
                                    ₱{(totalValue / 1000).toFixed(1)}K
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium -mt-1">last 7d</span>
                            </div>
                        </div>

                        {/* Custom Legend Side */}
                        <div className="w-1/2 flex flex-col gap-3 pl-4">
                            {data.map((item, i) => (
                                <div key={i} className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                        <span className="text-[13px] font-medium text-slate-700">{item.name}</span>
                                    </div>
                                    <span className="text-[13px] text-gray-400 font-medium">{item.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full h-[200px] text-sm text-gray-400">Loading...</div>
                )}
            </CardContent>
        </Card>
    );
}