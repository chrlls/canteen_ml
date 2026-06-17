import React from 'react';

export default function OrderReceipt({ order, onClose }) {
  if (!order) return null;

  const items = order.order_items || order.items || [];
  const total = order.total_amount || items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        .rcpt-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
          z-index: 300; display: flex; align-items: center; justify-content: center;
          padding: 1rem; font-family: 'Poppins', sans-serif;
        }
        .rcpt-modal {
          background: #fff; border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04);
          width: 100%; max-width: 380px;
          animation: rcptIn 0.28s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
        }
        .rcpt-modal::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #e74c3c, #ff8a80, #e74c3c);
          background-size: 200% 100%; animation: rcptShim 3s linear infinite;
        }
        @keyframes rcptShim  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes rcptIn    { from{opacity:0;transform:scale(0.93) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }

        /* Header */
        .rcpt-header {
          padding: 2rem 1.75rem 1.25rem; text-align: center;
          border-bottom: 1px solid #f0f0f0;
        }
        .rcpt-check {
          width: 60px; height: 60px; border-radius: 50%;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.75rem; margin: 0 auto 0.85rem;
          box-shadow: 0 6px 20px rgba(231,76,60,0.35),
                      0 0 0 4px rgba(231,76,60,0.1), 0 0 0 8px rgba(231,76,60,0.05);
        }
        .rcpt-success-title {
          font-size: 1.3rem; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;
        }
        .rcpt-order-num {
          font-size: 0.78rem; color: #bbb; font-weight: 500;
        }
        .rcpt-order-num span { color: #e74c3c; font-weight: 700; }

        /* Divider */
        .rcpt-divider {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0 1.75rem; margin: 1rem 0;
        }
        .rcpt-divider-line { flex: 1; height: 1px; background: #f0f0f0; }
        .rcpt-divider-text { font-size: 0.63rem; color: #ccc; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; }

        /* Items */
        .rcpt-items { padding: 0 1.75rem; max-height: 200px; overflow-y: auto; }
        .rcpt-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.5rem 0; border-bottom: 1px solid #f7f7f7;
          font-size: 0.85rem;
        }
        .rcpt-item:last-child { border: none; }
        .rcpt-item-name  { color: #1a1a2e; font-weight: 500; flex: 1; }
        .rcpt-item-qty   { color: #bbb; font-size: 0.75rem; margin: 0 0.75rem; }
        .rcpt-item-price { color: #1a1a2e; font-weight: 700; }

        /* Total */
        .rcpt-total-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem 1.75rem;
          border-top: 2px solid #f0f0f0; border-bottom: 1px solid #f0f0f0;
          margin-top: 0.25rem;
        }
        .rcpt-total-lbl { font-size: 0.75rem; font-weight: 700; color: #bbb; text-transform: uppercase; letter-spacing: 0.08em; }
        .rcpt-total-val { font-size: 1.5rem; font-weight: 800; color: #e74c3c; }

        /* Footer */
        .rcpt-footer { padding: 1.25rem 1.75rem 1.5rem; }
        .rcpt-pills {
          display: flex; justify-content: center; gap: 0.5rem;
          margin-bottom: 1.1rem; flex-wrap: wrap;
        }
        .rcpt-pill {
          background: #f7f7f7; border: 1px solid #eee; border-radius: 20px;
          padding: 0.25rem 0.75rem; font-size: 0.68rem; color: #888; font-weight: 500;
        }
        .rcpt-close-btn {
          width: 100%; padding: 0.95rem;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: #fff; border: none; border-radius: 14px;
          font-family: 'Poppins', sans-serif; font-size: 0.9rem; font-weight: 700;
          cursor: pointer; letter-spacing: 0.06em;
          box-shadow: 0 6px 20px rgba(231,76,60,0.38);
          transition: transform 0.18s, box-shadow 0.18s;
          position: relative; overflow: hidden;
        }
        .rcpt-close-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent 60%);
          pointer-events: none;
        }
        .rcpt-close-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(231,76,60,0.45); }
      `}</style>

      <div className="rcpt-overlay" onClick={onClose}>
        <div className="rcpt-modal" onClick={e => e.stopPropagation()}>

          {/* Success header */}
          <div className="rcpt-header">
            <div className="rcpt-check">🎉</div>
            <div className="rcpt-success-title">Order Placed!</div>
            <div className="rcpt-order-num">
              Order <span>#{order.order_number || order.id}</span> confirmed
            </div>
          </div>

          {/* Items divider */}
          <div className="rcpt-divider">
            <div className="rcpt-divider-line" />
            <span className="rcpt-divider-text">Order Summary</span>
            <div className="rcpt-divider-line" />
          </div>

          {/* Items list */}
          <div className="rcpt-items">
            {items.map((item, i) => (
              <div key={i} className="rcpt-item">
                <span className="rcpt-item-name">{item.menu_item?.name || item.name}</span>
                <span className="rcpt-item-qty">×{item.quantity}</span>
                <span className="rcpt-item-price">₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="rcpt-total-row">
            <span className="rcpt-total-lbl">Total Paid</span>
            <span className="rcpt-total-val">₱{Number(total).toFixed(2)}</span>
          </div>

          {/* Footer */}
          <div className="rcpt-footer">
            <div className="rcpt-pills">
              <span className="rcpt-pill">🍽️ Being Prepared</span>
              <span className="rcpt-pill">⚡ Est. 10-15 min</span>
            </div>
            <button className="rcpt-close-btn" onClick={onClose}>
              Done ✓
            </button>
          </div>

        </div>
      </div>
    </>
  );
}