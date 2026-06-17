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
    placeOrder: (items) => api.post('/orders', { items }),

    /**
     * Update the status of an order (admin/cashier)
     * @param {number} id - Order ID
     * @param {string} status - New status (e.g. 'Preparing', 'Ready', 'Completed')
     */
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

export default orderService;
