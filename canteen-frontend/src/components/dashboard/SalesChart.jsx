import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

function SalesChart() {
    const [data, setData] = useState([]);

    useEffect(() => {
        api.get('/reports/daily')
            .then(res => setData(res.data.slice(0, 7).reverse()))
            .catch(err => console.log(err));
    }, []);

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default SalesChart;