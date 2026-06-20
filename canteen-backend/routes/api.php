<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PredictionController;

// Public Routes (no login required)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes (login required)
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Menu
    Route::get('/menu', [MenuController::class, 'index']);
    Route::get('/menu/{id}', [MenuController::class, 'show']);
    Route::middleware('role:admin')->group(function () {
        Route::post('/menu', [MenuController::class, 'store']);
        Route::put('/menu/{id}', [MenuController::class, 'update']);
        Route::delete('/menu/{id}', [MenuController::class, 'destroy']);
        Route::patch('/menu/{id}/toggle', [MenuController::class, 'toggleAvailability']);
    });

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::middleware('role:admin')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    });

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::middleware('role:admin,cashier')->group(function () {
        Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    });

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::get('/inventory/low-stock', [InventoryController::class, 'lowStock']);
    Route::get('/inventory/logs', [InventoryController::class, 'logs']);
    Route::middleware('role:admin,cashier')->group(function () {
        Route::patch('/inventory/{id}/adjust', [InventoryController::class, 'adjust']);
    });

    // Reports (Admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/reports/summary', [ReportController::class, 'summary']);
        Route::get('/reports/daily', [ReportController::class, 'dailySales']);
        Route::get('/reports/best-selling', [ReportController::class, 'bestSelling']);
        Route::get('/reports/categories', [ReportController::class, 'categoryBreakdown']);
    });

    // User Management (Admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });

    // ML Predictions
    Route::middleware('role:admin')->group(function () {
        Route::post('/predict/generate', [PredictionController::class, 'generateWeeklyPredictions']);
        Route::post('/predict/metrics/sync', [PredictionController::class, 'syncMetrics']);
    });
    Route::get('/predict', [PredictionController::class, 'latestPredictions']);
    Route::get('/predict/metrics/latest', [PredictionController::class, 'latestMetrics']);
});