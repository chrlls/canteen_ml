<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_item_id',
        'quantity_change',
        'reason',
    ];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}