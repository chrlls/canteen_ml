import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

export default function OrderReceipt({ order, onClose }) {
  if (!order) return null;

  const items = order.order_items || order.items || [];
  const total = order.total_amount || items.reduce((s, i) => s + i.price * i.quantity, 0);

  const statusConfig = {
      Pending: {
          title: 'Order Placed',
          desc: 'has been placed and is waiting to be cooked.',
          icon: '⏳',
          colorClass: 'bg-amber-500/15 text-amber-500 ring-amber-500/5',
          pill1: 'WAITING TO COOK',
          pill2: 'IN QUEUE'
      },
      Preparing: {
          title: 'Order Preparing',
          desc: 'is currently being prepared in the kitchen.',
          icon: '🍳',
          colorClass: 'bg-blue-500/15 text-blue-500 ring-blue-500/5',
          pill1: 'BEING PREPARED',
          pill2: 'EST. 10-15 MIN'
      },
      Ready: {
          title: 'Order Ready',
          desc: 'is ready for pickup or serving.',
          icon: '🔔',
          colorClass: 'bg-success/15 text-success ring-success/5',
          pill1: 'READY FOR PICKUP',
          pill2: 'AT COUNTER'
      },
      Completed: {
          title: 'Order Completed',
          desc: 'has been successfully completed.',
          icon: '✓',
          colorClass: 'bg-success/15 text-success ring-success/5',
          pill1: 'COMPLETED',
          pill2: 'THANK YOU'
      },
      Cancelled: {
          title: 'Order Cancelled',
          desc: 'has been cancelled.',
          icon: '✕',
          colorClass: 'bg-destructive/15 text-destructive ring-destructive/5',
          pill1: 'CANCELLED',
          pill2: 'REFUNDED'
      }
  };

  const status = order.status || 'Pending';
  const config = statusConfig[status] || statusConfig.Pending;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-border/50 shadow-xl">
        <div className="p-6 pb-2 pt-8">
            <div className="flex flex-col items-center text-center space-y-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ring-4 font-extrabold ${config.colorClass}`}>
                    {config.icon}
                </div>
                <DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground">{config.title}</DialogTitle>
                <DialogDescription className="text-sm font-medium text-muted-foreground">
                    Order <span className="text-foreground font-bold">#{order.order_number || order.id}</span> {config.desc}
                </DialogDescription>
            </div>

            <Separator className="my-4" />
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 text-center">Order Summary</div>

            <ScrollArea className="max-h-[220px] -mx-4 px-4">
                <div className="space-y-3">
                    {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground leading-none">{item.menu_item?.name || item.name}</span>
                            <span className="text-xs font-medium text-muted-foreground">×{item.quantity}</span>
                        </div>
                        <span className="font-extrabold text-foreground">₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    ))}
                </div>
            </ScrollArea>

            <Separator className="my-4" />
            
            <div className="flex justify-between items-center px-1 mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Paid</span>
                <span className="text-2xl font-extrabold text-primary tracking-tight">₱{Number(total).toFixed(2)}</span>
            </div>
        </div>

        <div className="bg-muted/30 p-6 pt-4 border-t border-border/50 flex flex-col gap-4">
            <div className="flex justify-center gap-2">
                <div className="inline-flex items-center gap-1.5 bg-background border border-border/60 rounded-full px-3 py-1.5 text-[11px] font-bold text-muted-foreground shadow-sm uppercase tracking-wider">
                    {config.pill1}
                </div>
                {config.pill2 && (
                    <div className="inline-flex items-center gap-1.5 bg-background border border-border/60 rounded-full px-3 py-1.5 text-[11px] font-bold text-muted-foreground shadow-sm uppercase tracking-wider">
                        {config.pill2}
                    </div>
                )}
            </div>
            <Button onClick={onClose} className="w-full h-11 text-base font-bold shadow-md">
                Done
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}