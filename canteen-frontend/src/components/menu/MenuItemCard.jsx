import React, { useState } from 'react';
import api from '../../services/api';

export default function MenuItemCard({ item, onEdit, onDelete, onAddToCart, onToggle, userRole, prediction }) {

  const [toggling, setToggling] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await api.delete(`/menu/${item.id}`);
      onDelete?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete item.');
    }
  };

  // ✅ Toggle calls API with item.id directly, then refreshes
  const handleToggle = async () => {
    setToggling(true);
    try {
      await api.patch(`/menu/${item.id}/toggle`);
      onToggle?.(); // just calls fetchItems in MenuList
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update availability.');
    } finally {
      setToggling(false);
    }
  };

  const available = item.is_available && item.stock > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

        .mic {
          background: #fff; border-radius: 18px;
          border: 1px solid #f0f0f0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.055);
          overflow: hidden; display: flex; flex-direction: column;
          font-family: 'Poppins', sans-serif;
          transition: transform 0.22s, box-shadow 0.22s;
          position: relative;
        }
        .mic::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #e74c3c, #ff8a80, #e74c3c);
          background-size: 200% 100%;
          animation: micShim 3s linear infinite;
          z-index: 2;
        }
        @keyframes micShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .mic:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.1); }

        .mic-img {
          width: 100%; height: 140px; background: #f7f7f7;
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
          border-bottom: 1px solid #f0f0f0;
        }
        .mic-img img { width:100%; height:100%; object-fit:cover; }
        .mic-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #fafafa, #f0f0f0);
          font-size: 3rem;
        }

        .mic-avail {
          position: absolute; top: 10px; right: 10px;
          padding: 0.22rem 0.65rem; border-radius: 20px;
          font-size: 0.63rem; font-weight: 700; letter-spacing: 0.04em;
          backdrop-filter: blur(4px);
        }
        .mic-avail.yes { background: rgba(39,174,96,0.15); color: #27ae60; border: 1px solid rgba(39,174,96,0.2); }
        .mic-avail.no  { background: rgba(231,76,60,0.12); color: #e74c3c; border: 1px solid rgba(231,76,60,0.18); }

        .mic-body { padding: 1rem 1.1rem 0.6rem; flex: 1; display: flex; flex-direction: column; }
        .mic-cat  { font-size: 0.63rem; font-weight: 700; color: #bbb; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 4px; }
        .mic-name { font-size: 0.92rem; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; line-height: 1.3; }
        .mic-price-row { display: flex; align-items: baseline; gap: 8px; margin-top: auto; margin-bottom: 4px; }
        .mic-price { font-size: 1.25rem; font-weight: 800; color: #e74c3c; letter-spacing: -0.3px; }
        .mic-stock { font-size: 0.68rem; color: #bbb; font-weight: 500; display: flex; align-items: center; gap: 4px; }
        .mic-stock-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

        /* Actions */
        .mic-actions { display: flex; gap: 6px; padding: 0 1.1rem 1.1rem; flex-wrap: wrap; }

        .mic-btn-sm {
          padding: 0.45rem 0.65rem; border-radius: 10px;
          border: 1.5px solid #ebebeb; background: transparent;
          font-size: 0.75rem; font-weight: 600; cursor: pointer;
          transition: all 0.18s; flex-shrink: 0;
          font-family: 'Poppins', sans-serif;
          display: flex; align-items: center; gap: 4px;
        }
        .mic-btn-sm.edit { color: #3498db; }
        .mic-btn-sm.edit:hover { border-color: #3498db; background: rgba(52,152,219,0.07); }
        .mic-btn-sm.del  { color: #e74c3c; }
        .mic-btn-sm.del:hover  { border-color: #e74c3c; background: rgba(231,76,60,0.07); }

        /* ✅ Toggle button */
        .mic-btn-toggle {
          padding: 0.45rem 0.65rem; border-radius: 10px;
          font-size: 0.75rem; font-weight: 700;
          cursor: pointer; transition: all 0.18s; flex-shrink: 0;
          font-family: 'Poppins', sans-serif;
          display: flex; align-items: center; gap: 4px;
          border: 1.5px solid;
        }
        .mic-btn-toggle.available {
          color: #27ae60;
          border-color: rgba(39,174,96,0.35);
          background: rgba(39,174,96,0.08);
        }
        .mic-btn-toggle.available:hover {
          background: rgba(39,174,96,0.18);
          border-color: #27ae60;
        }
        .mic-btn-toggle.unavailable {
          color: #f39c12;
          border-color: rgba(243,156,18,0.35);
          background: rgba(243,156,18,0.08);
        }
        .mic-btn-toggle.unavailable:hover {
          background: rgba(243,156,18,0.18);
          border-color: #f39c12;
        }
        .mic-btn-toggle:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Add to cart */
        .mic-btn-add {
          flex: 1; padding: 0.6rem; border: none; border-radius: 12px;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: #fff; font-family: 'Poppins', sans-serif; font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: opacity 0.18s, transform 0.18s;
          box-shadow: 0 3px 10px rgba(231,76,60,0.3);
          position: relative; overflow: hidden;
        }
        .mic-btn-add::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          pointer-events: none;
        }
        .mic-btn-add:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .mic-btn-add:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
      `}</style>

      <div className="mic">
        {/* Image */}
        <div className="mic-img">
          {item.image
            ? <img src={`http://127.0.0.1:8000/storage/${item.image}`} alt={item.name}
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            : null
          }
          <div className="mic-img-placeholder" style={{ display: item.image ? 'none' : 'flex' }}>🍽️</div>
          <span className={`mic-avail ${available ? 'yes' : 'no'}`}>
            {available ? '● Available' : '○ Unavailable'}
          </span>
          {prediction?.predicted_label === 'High Demand' && (
            <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(231,76,60,0.5)', zIndex: 10 }}>
              <span>🔥</span> HIGH DEMAND
            </div>
          )}
        </div>

        {/* Body */}
        <div className="mic-body">
          <div className="mic-cat">{item.category?.name || '—'}</div>
          <div className="mic-name">{item.name}</div>
          <div className="mic-price-row">
            <span className="mic-price">₱{Number(item.price).toFixed(2)}</span>
          </div>
          <div className="mic-stock">
            <span className="mic-stock-dot"
              style={{ background: item.stock > 10 ? '#27ae60' : item.stock > 0 ? '#f39c12' : '#e74c3c' }} />
            {item.stock} in stock
          </div>
        </div>

        {/* Actions */}
        <div className="mic-actions">
          {userRole === 'admin' && (
            <>
              <button className="mic-btn-sm edit" onClick={onEdit}>✏️ Edit</button>
              <button className="mic-btn-sm del" onClick={handleDelete}>🗑️ Delete</button>
              {/* ✅ Toggle button shows current state, click to flip */}
              <button
                className={`mic-btn-toggle ${item.is_available ? 'available' : 'unavailable'}`}
                onClick={handleToggle}
                disabled={toggling}
                title="Click to toggle availability"
              >
                {toggling ? '⏳' : item.is_available ? '✅ Available' : '⛔ Unavailable'}
              </button>
            </>
          )}
          {userRole === 'customer' && (
            <button
              className="mic-btn-add"
              disabled={!available}
              onClick={() => onAddToCart?.(item)}
            >
              + Add to Cart
            </button>
          )}
        </div>
      </div>
    </>
  );
}