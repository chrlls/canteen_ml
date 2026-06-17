<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder {
    public function run() {
        $categories = ['Meals', 'Snacks', 'Beverages', 'Desserts', 'Combos'];
        foreach ($categories as $cat) {
            Category::create(['name' => $cat]);
        }
    }
}