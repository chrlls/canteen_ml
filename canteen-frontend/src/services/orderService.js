import api from './api';

const orderService = {
    /**
     * Fetch all orders (for queue, history, POS)
     */
    getOrders: () => api.get('/orders'),

    /**
     * Place a new order
     * @param {Array} items - [{ menu_item_id, quantity }]
     */
    placeOrder: (payload) => api.post('/orders', payload),

    /**
     * Update the status of an order (admin/cashier)
     * @param {number} id - Order ID
     * @param {string} status - New status (e.g. 'Preparing', 'Ready', 'Completed')
     */
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),

    /**
     * Cancel an order with a reason
     * @param {number} id - Order ID
     * @param {string} cancellation_reason
     */
    cancelOrder: (id, cancellation_reason) => api.patch(`/orders/${id}/cancel`, { cancellation_reason }),
};

export default orderService;
