import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Cell } from 'recharts';
import api from '../../services/api';
import { Card, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

export default function SalesChart({ data: propData }) {
    const [data, setData] = useState([]);

    const chartConfig = {
        total: {
            label: "Revenue",
            color: "#f97316",
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
            
            // Backfill missing days up to 7 days
            const latestDate = new Date(rawData[0].date);
            const paddedData = [];
            
            for (let i = 6; i >= 0; i--) {
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
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Daily sales revenue</h2>
                <p className="text-[13px] text-gray-400 mt-0.5">Last 7 days</p>
            </div>
            <CardContent className="flex-1 p-0">
                <ChartContainer config={chartConfig} className="w-full h-full max-h-[220px]">
                    <BarChart accessibilityLayer data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                        />
                        <ChartTooltip cursor={{ fill: 'transparent' }} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="total" radius={[6, 6, 6, 6]} barSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === data.length - 1 ? "#f97316" : "#fed7aa"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}