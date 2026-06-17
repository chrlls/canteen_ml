import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

function OrderTrendChart() {
    const [data, setData] = useState([]);

    useEffect(() => {
        api.get('/reports/daily')
            .then(res => setData(res.data.reverse()))
            .catch(err => console.log(err));
    }, []);

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
}

export default OrderTrendChart;