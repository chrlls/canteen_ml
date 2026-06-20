<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\MenuItem;

class MenuItemSeeder extends Seeder {
    public function run() {
        $items = [
            // Meals (category_id: 1)
            ['category_id' => 1, 'name' => 'Chicken Adobo', 'price' => 85, 'stock' => 50, 'image' => 'menu/LHvLOh98kB8m7tlWkNk8jTcPny3taYsU0dXSXr3K.jpg'],
            ['category_id' => 1, 'name' => 'Pork Sinigang', 'price' => 90, 'stock' => 40, 'image' => 'menu/44G1HdT7AXjvP0dQPhi00uX4kIFt1NaNMDirnGuc.jpg'],
            ['category_id' => 1, 'name' => 'Beef Caldereta', 'price' => 95, 'stock' => 35, 'image' => 'menu/292W9wCZiuNPj7SK3o06ByrIa0PTjbqyOjlR7lIn.jpg'],
            ['category_id' => 1, 'name' => 'Fried Chicken', 'price' => 80, 'stock' => 60, 'image' => 'menu/20pSb2GXhGSwnkrPTAw5o4PAkae0hsOqYIe5TThK.jpg'],
            ['category_id' => 1, 'name' => 'Pork Chop', 'price' => 75, 'stock' => 45, 'image' => 'menu/QyuqBLAWT09XqDEuxaNZ3hIfHLILyeSKKKr3BCbV.jpg'],
            ['category_id' => 1, 'name' => 'Fish Fillet', 'price' => 70, 'stock' => 30, 'image' => 'menu/fQz0RP9dEjKNjSUIco93dFAJ0AgCzsI5ul5BQuTc.jpg'],
            ['category_id' => 1, 'name' => 'Chicken Curry', 'price' => 85, 'stock' => 40, 'image' => 'menu/vsQVsfY6mVl9ElOTzSz1eOco4fbBMV3lxXWsHSV6.jpg'],
            // Snacks (category_id: 2)
            ['category_id' => 2, 'name' => 'Fries', 'price' => 35, 'stock' => 80, 'image' => 'menu/SSYgYLEBZFCguDkf9xq3OOJmONKuSTT26ikSrPjg.jpg'],
            ['category_id' => 2, 'name' => 'Hotdog on Stick', 'price' => 20, 'stock' => 100, 'image' => 'menu/QzLcjNSvRwzXncCVWbZhQoMkmjxw7yQdWATETlNx.jpg'],
            ['category_id' => 2, 'name' => 'Cheese Bread', 'price' => 15, 'stock' => 90, 'image' => 'menu/sj0VyadwjZBLjqq8zFULsQjjOpE81zpkkfTSGHn8.jpg'],
            ['category_id' => 2, 'name' => 'Lumpia', 'price' => 10, 'stock' => 120, 'image' => 'menu/IRjAeXnfbVDf13Ybz5XYRmDDDCJcJcRuKv4oVUPa.jpg'],
            ['category_id' => 2, 'name' => 'Banana Cue', 'price' => 15, 'stock' => 70, 'image' => 'menu/XsJwtSWLeq2DuhIFVnUwV69JgAZ9tF9fjp9H3Xpt.jpg'],
            ['category_id' => 2, 'name' => 'Squid Balls', 'price' => 20, 'stock' => 100, 'image' => 'menu/fhntZyfF4H7Xm98vyIwVnZfiaKigxq5Hzb0ojxS8.jpg'],
            // Beverages (category_id: 3)
            ['category_id' => 3, 'name' => 'Bottled Water', 'price' => 15, 'stock' => 200, 'image' => 'menu/wccoDbPXWTa0YtlehCqRKiLcS4rN7rwDn9EG0vW5.jpg'],
            ['category_id' => 3, 'name' => 'Coke 250ml', 'price' => 25, 'stock' => 150, 'image' => 'menu/rRcJ1P91WnA4dyO46h8BgfAgdaYp4lGixn8ieY35.jpg'],
            ['category_id' => 3, 'name' => 'Pineapple Juice', 'price' => 20, 'stock' => 100, 'image' => 'menu/WshtURQd3vdBnM8mOkFPYSKgLW2erv45qpG6sTA8.jpg'],
            ['category_id' => 3, 'name' => 'Iced Tea', 'price' => 25, 'stock' => 120, 'image' => 'menu/ZgAa0v7TR4ioulpiQVMzEQCHovUthQg1PsJ25Ede.jpg'],
            ['category_id' => 3, 'name' => 'Coffee', 'price' => 30, 'stock' => 80, 'image' => 'menu/Ag3Ja6LeUKHFAI1aMvl7TiJNldTu3QG69LKsS15q.jpg'],
            ['category_id' => 3, 'name' => 'Chocolate Milk', 'price' => 30, 'stock' => 90, 'image' => 'menu/0nJeas6eCXoUzhHqDJ7UHUMoXzBsbXyBeyvdHoUo.jpg'],
            // Desserts (category_id: 4)
            ['category_id' => 4, 'name' => 'Halo-Halo', 'price' => 45, 'stock' => 50, 'image' => 'menu/V3jYJBrlXInHpOMJr58enOvZXQMhdAbs6rrmqugh.jpg'],
            ['category_id' => 4, 'name' => 'Leche Flan', 'price' => 35, 'stock' => 40, 'image' => 'menu/eFzjzMfXvlfGqbxQn3EPMe0Dlbcg6VPzaYMKhRjV.jpg'],
            ['category_id' => 4, 'name' => 'Buko Pandan', 'price' => 30, 'stock' => 45, 'image' => 'menu/2S8TI3BFm6m9SC6YiJ5VYlyW5zF8uDDzN3RYrvlu.jpg'],
            ['category_id' => 4, 'name' => 'Mais Con Yelo', 'price' => 30, 'stock' => 40, 'image' => 'menu/5btXhB1UeBusXIm2YiOrRYU9wPW8YhAg1rymvFvX.jpg'],
            ['category_id' => 4, 'name' => 'Ice Cream', 'price' => 25, 'stock' => 60, 'image' => 'menu/YPqIlMbijlrCrmFeFdY9U1WplAAa3GaBskaJgfdh.jpg'],
            ['category_id' => 4, 'name' => 'Brownies', 'price' => 20, 'stock' => 50, 'image' => 'menu/cviPXiKJnDDxP8dFCRGHZnd0gVSeo59zzLg6M3r5.jpg'],
            // Combos (category_id: 5)
            ['category_id' => 5, 'name' => 'Meal + Drink Combo', 'price' => 99, 'stock' => 50, 'image' => 'menu/Fi6PduD6wq5QBTfs08dbLSnRa2Zh3dw8uKTE0Q11.jpg'],
            ['category_id' => 5, 'name' => 'Snack + Drink Combo', 'price' => 45, 'stock' => 60, 'image' => 'menu/ahxcvg3y7E7W85ty0sL9grdXymrDRtbvnTNblHby.jpg'],
            ['category_id' => 5, 'name' => 'Rice + Viand + Drink', 'price' => 110, 'stock' => 40, 'image' => 'menu/8UrtTOouzdJN31aiXOdKBTc7Mo25Y8UAooAmJ1BS.jpg'],
            ['category_id' => 5, 'name' => 'Student Budget Meal', 'price' => 75, 'stock' => 55, 'image' => 'menu/ni1NpExSLGXpKAUsDW9OfgLcsBGVvhdXnqVFYUsW.jpg'],
            ['category_id' => 5, 'name' => 'Dessert + Drink Combo', 'price' => 55, 'stock' => 35, 'image' => 'menu/m06gY78rcrQiairWWflhP4bai7d242msTCW2iEJ8.jpg'],
        ];

        foreach ($items as $item) {
            MenuItem::create(array_merge($item, [
                'description' => 'Delicious ' . $item['name'],
                'is_available' => true
            ]));
        }
    }
}