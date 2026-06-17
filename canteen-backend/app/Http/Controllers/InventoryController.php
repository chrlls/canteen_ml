<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\InventoryLog;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index()
    {
        return response()->json(MenuItem::with('category')
            ->select('id', 'name', 'stock', 'is_available', 'category_id')
            ->get());
    }

    public function restock(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
            'reason'   => 'nullable|string'
        ]);

        $item = MenuItem::findOrFail($id);
        $item->increment('stock', $request->quantity);

        InventoryLog::create([
            'menu_item_id'    => $id,
            'quantity_change' => $request->quantity,
            'reason'          => $request->reason ?? 'Manual restock'
        ]);

        return response()->json($item);
    }

    // Called by PATCH /inventory/{id}/adjust
    public function adjust(Request $request, $id)
    {
        $request->validate([
            'quantity_change' => 'required|integer',
            'reason'          => 'required|string|max:255',
        ]);

        $item = MenuItem::findOrFail($id);

        $newStock = $item->stock + $request->quantity_change;

        // Prevent stock going negative — return error instead of silently clamping
        if ($newStock < 0) {
            return response()->json([
                'message' => 'Stock cannot go below zero. Current stock: ' . $item->stock,
            ], 422);
        }

        $item->stock = $newStock;
        $item->save();

        InventoryLog::create([
            'menu_item_id'    => $item->id,
            'quantity_change' => $request->quantity_change,
            'reason'          => $request->reason,
        ]);

        return response()->json([
            'message' => 'Stock adjusted successfully.',
            'item'    => $item,
        ]);
    }

    public function logs()
    {
        return response()->json(InventoryLog::with('menuItem')->latest()->get());
    }

    public function lowStock()
    {
        return response()->json(MenuItem::where('stock', '<', 10)->get());
    }
}