<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model {
    protected $fillable = [
        'category_id', 'name', 'description',
        'price', 'stock', 'is_available', 'image'
    ];

    public function category() {
        return $this->belongsTo(Category::class);
    }

    public function orderItems() {
        return $this->hasMany(OrderItem::class);
    }

    public function inventoryLogs() {
        return $this->hasMany(InventoryLog::class);
    }
}