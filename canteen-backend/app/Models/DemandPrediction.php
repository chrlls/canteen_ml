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
        'is_break_week',
        'is_exam_week',
        'is_enrollment_week',
    ];

    protected $casts = [
        'week_start' => 'date',
        'is_break_week' => 'boolean',
        'is_exam_week' => 'boolean',
        'is_enrollment_week' => 'boolean',
        'confidence_score' => 'float',
        'actual_units_sold' => 'integer',
    ];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}
