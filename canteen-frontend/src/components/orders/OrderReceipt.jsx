import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { CheckCircle2, Clock, ChefHat } from 'lucide-react';

export default function OrderReceipt({ order, onClose }) {
  if (!order) return null;

  const items = order.order_items || order.items || [];
  const total = order.total_amount || items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-border/50 shadow-xl">
        {/* Header Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/80 to-primary animate-pulse" />
        
        <div className="p-6 pb-2">
            <div className="flex flex-col items-center text-center space-y-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mb-1 ring-4 ring-success/5">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground">Order Placed Successfully</DialogTitle>
                <DialogDescription className="text-sm font-medium text-muted-foreground">
                    Order <span className="text-foreground font-bold">#{order.order_number || order.id}</span> has been confirmed.
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
                <div className="inline-flex items-center gap-1.5 bg-background border border-border/60 rounded-full px-3 py-1.5 text-[11px] font-bold text-muted-foreground shadow-sm">
                    <ChefHat className="w-3.5 h-3.5 text-primary" /> BEING PREPARED
                </div>
                <div className="inline-flex items-center gap-1.5 bg-background border border-border/60 rounded-full px-3 py-1.5 text-[11px] font-bold text-muted-foreground shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-warning" /> EST. 10-15 MIN
                </div>
            </div>
            <Button onClick={onClose} className="w-full h-11 text-base font-bold shadow-md">
                Done
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}