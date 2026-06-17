import React, { useEffect, useState } from 'react';
import { Pie, PieChart } from 'recharts';
import api from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent } from '../ui/chart';

export default function CategoryPieChart() {
    const [data, setData] = useState([]);
    const [config, setConfig] = useState({ sales: { label: "Sales" } });

    useEffect(() => {
        api.get('/reports/categories')
            .then(res => {
                // Tailwind standard colors for pie chart segments
                const colors = ['#E64D3D', '#eb6b5e', '#f08980', '#f5a8a1', '#fac6c2'];
                
                const formattedData = res.data.map((item, index) => {
                    const key = item.name.toLowerCase().replace(/\s+/g, '');
                    return {
                        category: key,
                        name: item.name,
                        sales: parseFloat(item.total),
                        fill: colors[index % colors.length]
                    };
                });
                
                const newConfig = { sales: { label: "Sales" } };
                formattedData.forEach((item, index) => {
                    newConfig[item.category] = {
                        label: item.name,
                        color: colors[index % colors.length]
                    };
                });
                
                setData(formattedData);
                setConfig(newConfig);
            })
            .catch(console.error);
    }, []);

    return (
        <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader className="items-center pb-2">
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>All Time Revenue Distribution</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0 flex items-center justify-center">
                {data.length > 0 ? (
                    <ChartContainer
                        config={config}
                        className="mx-auto aspect-square max-h-[250px] w-full"
                    >
                        <PieChart>
                            <Pie data={data} dataKey="sales" nameKey="category" />
                            <ChartLegend
                                content={<ChartLegendContent nameKey="category" />}
                                className="-translate-y-2 flex-wrap gap-2 *:basis-1/3 *:justify-center"
                            />
                        </PieChart>
                    </ChartContainer>
                ) : (
                    <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">Loading...</div>
                )}
            </CardContent>
        </Card>
    );
}