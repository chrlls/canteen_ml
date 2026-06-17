import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts';
import api from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { TrendingUp } from 'lucide-react';

export default function SalesChart({ data: propData }) {
    const [data, setData] = useState([]);

    const chartConfig = {
        total: {
            label: "Revenue",
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
        <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader>
                <CardTitle>Daily Sales Revenue</CardTitle>
                <CardDescription>Last 7 Days</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <ChartContainer config={chartConfig} className="w-full h-full max-h-[250px]">
                    <BarChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="total" fill="var(--color-total)" radius={8} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm border-t border-border/50 pt-4 mt-auto">
                <div className="flex gap-2 leading-none font-medium text-foreground">
                    Sales are active <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="leading-none text-muted-foreground">
                    Showing daily revenue for the last 7 days
                </div>
            </CardFooter>
        </Card>
    );
}