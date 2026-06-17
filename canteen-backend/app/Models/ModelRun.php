<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModelRun extends Model
{
    protected $fillable = [
        'accuracy',
        'precision',
        'recall',
        'f1_score',
        'training_rows',
        'trained_at',
        'notes',
    ];

    protected $casts = [
        'accuracy' => 'float',
        'precision' => 'float',
        'recall' => 'float',
        'f1_score' => 'float',
        'training_rows' => 'integer',
        'trained_at' => 'datetime',
    ];
}
