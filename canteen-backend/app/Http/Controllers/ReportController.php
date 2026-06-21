<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function summary()
    {
        return response()->json([
            'total_sales'         => Order::where('status', 'Completed')->sum('total_amount'),
            'total_orders'        => Order::where('status', '!=', 'Cancelled')->count(),
            'average_order_value' => Order::where('status', 'Completed')->avg('total_amount'),
            'pending_orders'      => Order::where('status', 'Pending')->count(),
        ]);
    }

    public function dailySales()
    {
        $sales = Order::where('status', 'Completed')
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->limit(30)
            ->get();

        return response()->json($sales);
    }

    public function bestSelling()
    {
        $now = now();
        $items = OrderItem::selectRaw('menu_item_id, SUM(quantity) as total_qty, SUM(price * quantity) as total_revenue')
            ->whereHas('order', function($q) use ($now) {
                $q->where('created_at', '>=', $now->copy()->subDays(7))
                  ->where('status', 'Completed');
            })
            ->with('menuItem')
            ->groupBy('menu_item_id')
            ->orderBy('total_qty', 'desc')
            ->limit(10)
            ->get();

        return response()->json($items);
    }

    public function categoryBreakdown()
    {
        $sales = OrderItem::join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->selectRaw('categories.name, SUM(order_items.price * order_items.quantity) as total')
            ->groupBy('categories.name')
            ->whereHas('order', function($q) {
                $q->where('status', 'Completed');
            })
            ->get();

        return response()->json($sales);
    }
}