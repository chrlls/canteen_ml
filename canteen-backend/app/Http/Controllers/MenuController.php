<?php
namespace App\Http\Controllers;
use App\Models\MenuItem;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index()
    {
        return response()->json(MenuItem::with('category')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name'        => 'required|string',
            'price'       => 'required|numeric',
            'stock'       => 'required|integer',
        ]);

        $data = $request->only(['name', 'price', 'stock', 'category_id', 'is_available']);
        $data['is_available'] = $request->input('is_available', 1);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('menu', 'public');
        }

        $item = MenuItem::create($data);
        return response()->json($item->load('category'), 201);
    }

    public function show($id)
    {
        return response()->json(MenuItem::with('category')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $item = MenuItem::findOrFail($id);

        $data = $request->only(['name', 'price', 'stock', 'category_id']);

        // ✅ Handle is_available properly (FormData sends it as "1" or "0")
        if ($request->has('is_available')) {
            $data['is_available'] = filter_var($request->input('is_available'), FILTER_VALIDATE_BOOLEAN);
        }

        // ✅ Handle image upload
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('menu', 'public');
        }

        $item->update($data);
        return response()->json($item->load('category'));
    }

    public function destroy($id)
    {
        MenuItem::findOrFail($id)->delete();
        return response()->json(['message' => 'Menu item deleted']);
    }

    public function toggleAvailability($id)
    {
        $item = MenuItem::findOrFail($id);
        $item->update(['is_available' => !$item->is_available]);
        return response()->json($item);
    }
}