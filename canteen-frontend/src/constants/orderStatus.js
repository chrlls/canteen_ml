/**
 * Canonical order status definitions.
 * Completed is grey (not blue) because it is a terminal/done state, not in-progress.
 */
const ORDER_STATUS = {
    Pending:   { color: '#f39c12', bg: 'rgba(243,156,18,0.12)',  border: 'rgba(243,156,18,0.25)',  label: 'Pending'   },
    Preparing: { color: '#3498db', bg: 'rgba(52,152,219,0.12)',  border: 'rgba(52,152,219,0.25)',  label: 'Preparing' },
    Ready:     { color: '#27ae60', bg: 'rgba(39,174,96,0.12)',   border: 'rgba(39,174,96,0.25)',   label: 'Ready'     },
    Completed: { color: '#999999', bg: 'rgba(150,150,150,0.10)', border: 'rgba(150,150,150,0.20)', label: 'Completed' },
    Cancelled: { color: '#e74c3c', bg: 'rgba(231,76,60,0.10)',   border: 'rgba(231,76,60,0.20)',   label: 'Cancelled' },
};

export default ORDER_STATUS;
