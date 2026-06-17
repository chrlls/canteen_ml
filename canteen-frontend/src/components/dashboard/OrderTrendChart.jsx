import React, { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import api from '../../services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { TrendingUp } from 'lucide-react';

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
        <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader>
                <CardTitle>Order Trend</CardTitle>
                <CardDescription>
                    Showing total revenue for the last 30 days
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <ChartContainer config={chartConfig} className="w-full h-full max-h-[250px]">
                    <AreaChart
                        accessibilityLayer
                        data={data}
                        margin={{ left: 12, right: 12 }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                            dataKey="total"
                            type="natural"
                            fill="var(--color-total)"
                            fillOpacity={0.4}
                            stroke="var(--color-total)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="border-t border-border/50 pt-4 mt-auto">
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 leading-none font-medium text-foreground">
                            Order activity stable <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex items-center gap-2 leading-none text-muted-foreground">
                            Last 30 Days
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}