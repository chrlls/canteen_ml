import React, { useState, useCallback, useRef } from 'react';
import Layout from '../common/Layout';
import orderService from '../../services/orderService';
import usePolling from '../../hooks/usePolling';
import ORDER_STATUS from '../../constants/orderStatus';
import { ChevronDown, ChevronUp, PackageOpen } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const { notify } = useToast();
  const prevOrdersRef = useRef([]);

  const fetchOrders = useCallback(() => {
    orderService.getOrders()
      .then(res => {
          const newOrders = res.data;
          if (prevOrdersRef.current.length > 0) {
              newOrders.forEach(newOrder => {
                  const oldOrder = prevOrdersRef.current.find(o => o.id === newOrder.id);
                  if (oldOrder && oldOrder.status !== newOrder.status) {
                      if (newOrder.status === 'Preparing') {
                          notify(`Order #${newOrder.order_number} is now being processed!`, 'info');
                      } else if (newOrder.status === 'Ready') {
                          notify(`Order #${newOrder.order_number} is ready for pick up!`, 'success');
                      }
                  }
              });
          }
          prevOrdersRef.current = newOrders;
          setOrders(newOrders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [notify]);

  usePolling(fetchOrders, 5000);

  const TABS = ['all', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <Layout hideNavbar={true}>
      <div className="w-full max-w-5xl mx-auto py-6 flex flex-col gap-6">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mt-2 mb-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#1e293b]">
              Purchase History
            </h1>

          </div>
          <p className="text-[15px] font-medium text-slate-500/90 tracking-wide">{filtered.length} orders found</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                filter === t
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {t === 'all' ? 'All Orders' : t}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-4">
             {[1,2,3,4].map(i => (
                <div key={i} className="h-24 w-full bg-muted/40 rounded-2xl animate-pulse border border-border" />
             ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border shadow-sm text-muted-foreground gap-4">
                <PackageOpen size={48} className="opacity-20" />
                <div className="text-center">
                  <p className="font-bold text-foreground">No orders found.</p>
                  <p className="text-sm mt-1">{filter === 'all' ? 'Place your first order from Order Food!' : `No ${filter} orders yet.`}</p>
                </div>
              </div>
            ) : (
              filtered.map((order) => {
                const s = ORDER_STATUS[order.status] || ORDER_STATUS.Pending;
                const isOpen = expanded === order.id;

                return (
                  <div
                    key={order.id}
                    className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
                  >
                    <div 
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                    >
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                             <span className="text-lg font-bold text-primary">#{order.id}</span>
                         </div>
                         <div>
                            <div className="font-extrabold text-foreground tracking-tight">{order.order_number}</div>
                            <div className="text-xs text-muted-foreground font-medium mt-0.5">
                              {new Date(order.created_at).toLocaleDateString('en-PH', {
                                month: 'short', day: 'numeric', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/2">
                        <span 
                            className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border"
                            style={{ backgroundColor: s.bg, color: s.color, borderColor: s.border }}
                        >
                          {s.label || order.status}
                        </span>
                        
                        <div className="flex items-center gap-4">
                            <span className="font-extrabold text-lg text-primary whitespace-nowrap">
                              ₱{Number(order.total_amount).toFixed(2)}
                            </span>
                            <div className="text-muted-foreground">
                               {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-2 border-t border-border/40 bg-muted/10 animate-in fade-in slide-in-from-top-2 duration-300">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Items Ordered</h3>
                        <div className="flex flex-col gap-2">
                            {order.order_items?.map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0 text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="font-medium text-foreground">{item.quantity}x</div>
                                        <div className="text-foreground/80">{item.menu_item?.name || 'Unknown Item'}</div>
                                    </div>
                                    <div className="font-bold text-foreground">
                                        ₱{(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <div className="flex items-center gap-4 px-4 py-2 bg-background rounded-lg border border-border">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Total</span>
                                <span className="font-extrabold text-foreground">₱{Number(order.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}