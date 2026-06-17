import React, { useEffect, useState } from 'react';
import api from '../../services/api';

function LowStockAlert() {
    const [lowStock, setLowStock] = useState([]);

    useEffect(() => {
        api.get('/inventory/low-stock').then(res => setLowStock(res.data));
    }, []);

    if (lowStock.length === 0) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <h3 className="text-red-600 font-semibold mb-2">⚠️ Low Stock Warning</h3>
            <div className="flex flex-wrap gap-2">
                {lowStock.map(item => (
                    <span key={item.id} className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full">
                        {item.name} ({item.stock} left)
                    </span>
                ))}
            </div>
        </div>
    );
}

export default LowStockAlert;