import React, { useState } from 'react';
import api from '../../services/api';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';

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

  const handleToggle = async () => {
    setToggling(true);
    try {
      await api.patch(`/menu/${item.id}/toggle`);
      onToggle?.(); 
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update availability.');
    } finally {
      setToggling(false);
    }
  };

  const available = item.is_available && item.stock > 0;

  return (
    <Card className="overflow-hidden relative group transition-all hover:-translate-y-1 hover:shadow-md border-border/50 flex flex-col h-full">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
      
      {/* Image Container */}
      <div className="w-full h-36 bg-muted relative flex items-center justify-center overflow-hidden border-b border-border/50">
        {item.image ? (
          <img 
            src={`${process.env.REACT_APP_API_BASE_URL}/storage/${item.image}`} 
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} 
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 text-5xl" style={{ display: item.image ? 'none' : 'flex' }}>
          🍽️
        </div>
        
        {/* Availability Badge */}
        <div className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border backdrop-blur-md ${available ? 'bg-success/15 text-success border-success/20' : 'bg-destructive/15 text-destructive border-destructive/20'}`}>
          {available ? '● Available' : '○ Unavailable'}
        </div>

        {/* High Demand Badge */}
        {prediction?.predicted_label === 'High Demand' && (
          <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm flex items-center gap-1 z-10">
            HOT
          </div>
        )}
      </div>

      {/* Body */}
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
          {item.category?.name || '—'}
        </div>
        <h3 className="font-bold text-foreground text-base leading-tight mb-3">
          {item.name}
        </h3>
        
        <div className="mt-auto flex items-end justify-between">
          <div className="text-xl font-extrabold text-primary tracking-tight">
            ₱{Number(item.price).toFixed(2)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full ${item.stock > 10 ? 'bg-success' : item.stock > 0 ? 'bg-warning' : 'bg-destructive'}`} />
            {item.stock} in stock
          </div>
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className="p-3 pt-0 flex gap-2 flex-wrap">
        {userRole === 'admin' && (
          <>
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-semibold text-blue-500 hover:text-blue-600 border-border/50" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-semibold text-destructive hover:text-destructive border-border/50" onClick={handleDelete}>
              Delete
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`w-full h-8 text-xs font-bold border-border/50 ${item.is_available ? 'text-success hover:text-success hover:bg-success/10' : 'text-warning hover:text-warning hover:bg-warning/10'}`}
              onClick={handleToggle}
              disabled={toggling}
            >
              {toggling ? 'Loading...' : item.is_available ? <>Available</> : <>Unavailable</>}
            </Button>
          </>
        )}
        {userRole === 'customer' && (
          <Button 
            className="w-full font-bold shadow-sm"
            disabled={!available}
            onClick={() => onAddToCart?.(item)}
          >
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}