<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder {
    public function run() {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@canteen.com',
            'password' => Hash::make('password'),
            'role' => 'admin'
        ]);
        User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@canteen.com',
            'password' => Hash::make('password'),
            'role' => 'cashier'
        ]);
        User::create([
            'name' => 'Customer User',
            'email' => 'customer@canteen.com',
            'password' => Hash::make('password'),
            'role' => 'customer'
        ]);
    }
}