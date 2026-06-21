<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // ✅ Customer only sees their own orders
        if ($user->role === 'customer') {
            $orders = Order::with('orderItems.menuItem')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            // Admin / Cashier sees all orders
            $orders = Order::with('orderItems.menuItem', 'user')
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $request->validate([
            'items'                  => 'required|array',
            'items.*.menu_item_id'   => 'required|exists:menu_items,id',
            'items.*.quantity'       => 'required|integer|min:1',
            'order_type'             => 'required|in:Take Away,Dine In',
        ]);

        $total = 0;
        foreach ($request->items as $item) {
            $menuItem = MenuItem::findOrFail($item['menu_item_id']);
            $total += $menuItem->price * $item['quantity'];
        }

        $order = Order::create([
            'user_id'      => $request->user()->id,
            'order_number' => 'TEMP',
            'total_amount' => $total,
            'status'       => 'Pending', // ✅ Capitalized
            'order_type'   => $request->order_type,
        ]);

        $order->order_number = str_pad($order->id, 3, '0', STR_PAD_LEFT);
        $order->save();

        foreach ($request->items as $item) {
            $menuItem = MenuItem::findOrFail($item['menu_item_id']);
            OrderItem::create([
                'order_id'     => $order->id,
                'menu_item_id' => $item['menu_item_id'],
                'quantity'     => $item['quantity'],
                'price'        => $menuItem->price,
            ]);
            $menuItem->decrement('stock', $item['quantity']);
        }

        return response()->json($order->load('orderItems.menuItem'), 201);
    }

    public function show($id)
    {
        return response()->json(
            Order::with('orderItems.menuItem', 'user')->findOrFail($id)
        );
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Pending,Preparing,Ready,Completed', // Cancelled goes through cancel()
        ]);

        $order = Order::findOrFail($id);

        if ($order->status === 'Completed' || $order->status === 'Cancelled') {
            return response()->json(['message' => 'Cannot update a completed or cancelled order'], 400);
        }

        $order->update(['status' => $request->status]);
        return response()->json($order);
    }

    public function cancel(Request $request, $id)
    {
        $request->validate([
            'cancellation_reason' => 'required|in:Out of stock,Customer changed mind,Order error,Payment issue',
        ]);

        $order = Order::findOrFail($id);

        $user = $request->user();
        if ($user->role === 'customer') {
            if ($order->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized to cancel this order'], 403);
            }
            if ($order->status !== 'Pending') {
                return response()->json(['message' => 'Customers can only cancel Pending orders'], 400);
            }
        }

        if ($order->status === 'Completed' || $order->status === 'Cancelled') {
            return response()->json(['message' => 'Cannot cancel a completed or already cancelled order'], 400);
        }

        $order->update([
            'status' => 'Cancelled',
            'cancellation_reason' => $request->cancellation_reason
        ]);

        return response()->json($order);
    }
}