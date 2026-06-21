import React, { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import api from '../../services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

export default function OrderTrendChart({ data: propData }) {
    const [data, setData] = useState([]);

    const chartConfig = {
        total: {
            label: "Sales Revenue",
            color: "#E64D3D",
        },
    };

    useEffect(() => {
        const processData = (rawData) => {
            if (!rawData || rawData.length === 0) return [];
            
            // Map existing data by date
            const dateMap = {};
            rawData.forEach(d => {
                const dateObj = new Date(d.date);
                dateMap[dateObj.toDateString()] = parseFloat(d.total);
            });
            
            // Backfill missing days so the chart always draws a line/area
            const latestDate = new Date(rawData[0].date);
            const paddedData = [];
            
            for (let i = 29; i >= 0; i--) {
                const d = new Date(latestDate);
                d.setDate(d.getDate() - i);
                paddedData.push({
                    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    total: dateMap[d.toDateString()] || 0
                });
            }
            return paddedData;
        };

        if (propData && propData.length > 0) {
            setData(processData(propData));
        } else {
            api.get('/reports/daily').then(res => {
                setData(processData(res.data));
            });
        }
    }, [propData]);

    return (
        <Card className="h-full border border-gray-100 rounded-2xl shadow-sm flex flex-col p-6 pb-2">
            <div className="mb-6">
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Order Trend</h2>
                <p className="text-[13px] text-gray-400 mt-0.5">Showing total revenue for the last 30 days</p>
            </div>
            <CardContent className="flex-1 p-0 flex flex-col justify-end">
                <ChartContainer config={chartConfig} className="w-full h-full max-h-[220px]">
                    <AreaChart
                        accessibilityLayer
                        data={data}
                        margin={{ left: 12, right: 12 }}
                    >
                        <CartesianGrid vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                            dataKey="total"
                            type="monotone"
                            fill="var(--color-total)"
                            fillOpacity={0.4}
                            stroke="var(--color-total)"
                            strokeWidth={1}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}