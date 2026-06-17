<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderItem;

class OrderSeeder extends Seeder
{
    public function run()
    {
        $statuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
        $userIds  = [1, 4, 5]; // your actual user IDs

        for ($i = 1; $i <= 200; $i++) {
            $order = Order::create([
                'user_id'      => $userIds[array_rand($userIds)],
                'order_number' => 'ORD-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'total_amount' => 0,
                'status'       => $statuses[array_rand($statuses)],
                'created_at'   => now()->subDays(rand(0, 30))
            ]);

            $total    = 0;
            $numItems = rand(1, 4);

            for ($j = 0; $j < $numItems; $j++) {
                $menuItemId = rand(1, 30);
                $qty        = rand(1, 3);
                $price      = rand(10, 110);

                OrderItem::create([
                    'order_id'     => $order->id,
                    'menu_item_id' => $menuItemId,
                    'quantity'     => $qty,
                    'price'        => $price
                ]);

                $total += $qty * $price;
            }

            $order->update(['total_amount' => $total]);
        }
    }
}