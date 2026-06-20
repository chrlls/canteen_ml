<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$now = \Illuminate\Support\Carbon::now();
echo "--- 7-Day Order Quantities ---\n";
foreach (\App\Models\MenuItem::all() as $item) {
    $sold = \App\Models\OrderItem::where('menu_item_id', $item->id)
        ->whereHas('order', function($q) use ($now) {
            $q->where('created_at', '>=', $now->copy()->subDays(7));
        })->sum('quantity');
    echo $item->name . ": " . $sold . "\n";
}
echo "------------------------------\n";
