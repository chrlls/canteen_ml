<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DemandPrediction extends Model
{
    protected $fillable = [
        'menu_item_id',
        'week_start',
        'predicted_label',
        'confidence_score',
        'actual_units_sold',
    ];

    protected $casts = [
        'week_start' => 'date',
        'confidence_score' => 'float',
        'actual_units_sold' => 'integer',
    ];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}
