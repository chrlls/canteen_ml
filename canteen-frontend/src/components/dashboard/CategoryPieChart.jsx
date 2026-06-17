import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const COLORS = ['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c'];

function CategoryPieChart() {
    const [data, setData] = useState([]);

    useEffect(() => {
        api.get('/reports/categories')
            .then(res => {
                // Parse total as a number so recharts can render it
                const parsed = res.data.map(item => ({
                    ...item,
                    total: parseFloat(item.total),
                }));
                setData(parsed);
            })
            .catch(err => console.log(err));
    }, []);

    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                >
                    {data.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => `₱${Number(value).toLocaleString()}`}
                    contentStyle={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.8rem',
                        borderRadius: '10px',
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                />
                <Legend
                    wrapperStyle={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.75rem',
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

export default CategoryPieChart;