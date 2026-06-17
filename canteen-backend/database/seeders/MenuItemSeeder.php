<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\MenuItem;

class MenuItemSeeder extends Seeder {
    public function run() {
        $items = [
            // Meals (category_id: 1)
            ['category_id' => 1, 'name' => 'Chicken Adobo', 'price' => 85, 'stock' => 50],
            ['category_id' => 1, 'name' => 'Pork Sinigang', 'price' => 90, 'stock' => 40],
            ['category_id' => 1, 'name' => 'Beef Caldereta', 'price' => 95, 'stock' => 35],
            ['category_id' => 1, 'name' => 'Fried Chicken', 'price' => 80, 'stock' => 60],
            ['category_id' => 1, 'name' => 'Pork Chop', 'price' => 75, 'stock' => 45],
            ['category_id' => 1, 'name' => 'Fish Fillet', 'price' => 70, 'stock' => 30],
            ['category_id' => 1, 'name' => 'Chicken Curry', 'price' => 85, 'stock' => 40],
            // Snacks (category_id: 2)
            ['category_id' => 2, 'name' => 'Fries', 'price' => 35, 'stock' => 80],
            ['category_id' => 2, 'name' => 'Hotdog on Stick', 'price' => 20, 'stock' => 100],
            ['category_id' => 2, 'name' => 'Cheese Bread', 'price' => 15, 'stock' => 90],
            ['category_id' => 2, 'name' => 'Lumpia', 'price' => 10, 'stock' => 120],
            ['category_id' => 2, 'name' => 'Banana Cue', 'price' => 15, 'stock' => 70],
            ['category_id' => 2, 'name' => 'Squid Balls', 'price' => 20, 'stock' => 100],
            // Beverages (category_id: 3)
            ['category_id' => 3, 'name' => 'Bottled Water', 'price' => 15, 'stock' => 200],
            ['category_id' => 3, 'name' => 'Coke 250ml', 'price' => 25, 'stock' => 150],
            ['category_id' => 3, 'name' => 'Pineapple Juice', 'price' => 20, 'stock' => 100],
            ['category_id' => 3, 'name' => 'Iced Tea', 'price' => 25, 'stock' => 120],
            ['category_id' => 3, 'name' => 'Coffee', 'price' => 30, 'stock' => 80],
            ['category_id' => 3, 'name' => 'Chocolate Milk', 'price' => 30, 'stock' => 90],
            // Desserts (category_id: 4)
            ['category_id' => 4, 'name' => 'Halo-Halo', 'price' => 45, 'stock' => 50],
            ['category_id' => 4, 'name' => 'Leche Flan', 'price' => 35, 'stock' => 40],
            ['category_id' => 4, 'name' => 'Buko Pandan', 'price' => 30, 'stock' => 45],
            ['category_id' => 4, 'name' => 'Mais Con Yelo', 'price' => 30, 'stock' => 40],
            ['category_id' => 4, 'name' => 'Ice Cream', 'price' => 25, 'stock' => 60],
            ['category_id' => 4, 'name' => 'Brownies', 'price' => 20, 'stock' => 50],
            // Combos (category_id: 5)
            ['category_id' => 5, 'name' => 'Meal + Drink Combo', 'price' => 99, 'stock' => 50],
            ['category_id' => 5, 'name' => 'Snack + Drink Combo', 'price' => 45, 'stock' => 60],
            ['category_id' => 5, 'name' => 'Rice + Viand + Drink', 'price' => 110, 'stock' => 40],
            ['category_id' => 5, 'name' => 'Student Budget Meal', 'price' => 75, 'stock' => 55],
            ['category_id' => 5, 'name' => 'Dessert + Drink Combo', 'price' => 55, 'stock' => 35],
        ];

        foreach ($items as $item) {
            MenuItem::create(array_merge($item, [
                'description' => 'Delicious ' . $item['name'],
                'is_available' => true
            ]));
        }
    }
}