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
        Schema::create('demand_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained()->onDelete('cascade');
            $table->date('week_start'); // Monday of the predicted ISO week
            $table->enum('predicted_label', ['High Demand', 'Low Demand']);
            $table->decimal('confidence_score', 5, 4)->nullable(); // e.g. 0.8734
            $table->integer('actual_units_sold')->nullable(); // filled in after the week passes, for predicted-vs-actual comparison
            $table->timestamps();

            // One prediction per item per week
            $table->unique(['menu_item_id', 'week_start']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('demand_predictions');
    }
};
