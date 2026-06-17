<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('model_runs', function (Blueprint $table) {
            $table->id();
            $table->decimal('accuracy', 5, 4);
            $table->decimal('precision', 5, 4);
            $table->decimal('recall', 5, 4);
            $table->decimal('f1_score', 5, 4);
            $table->integer('training_rows')->nullable(); // size of dataset used for this run
            $table->timestamp('trained_at');
            $table->text('notes')->nullable(); // e.g. "trained on Jan 2024 - Dec 2025 synthetic data"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('model_runs');
    }
};
