<?php

namespace App\Http\Controllers;

use App\Exceptions\FlaskServiceException;
use App\Models\DemandPrediction;
use App\Models\MenuItem;
use App\Models\ModelRun;
use App\Services\FlaskPredictionService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class PredictionController extends Controller
{
    protected FlaskPredictionService $flaskService;

    public function __construct(FlaskPredictionService $flaskService)
    {
        $this->flaskService = $flaskService;
    }

    public function generateWeeklyPredictions(Request $request)
    {
        try {
            $now = Carbon::now();
            $weekStart = $now->copy()->startOfWeek();

            // Fetch menu items, excluding 'Combos' category
            $menuItems = \App\Models\MenuItem::with('category')
                ->whereHas('category', function($q) {
                    $q->where('name', '!=', 'Combos');
                })
                ->get();
            $itemsPayload = [];
            $itemMap = [];

            foreach ($menuItems as $item) {
                $categoryName = $item->category ? $item->category->name : 'Unknown';

                // Calculate real-time quantity sold over the last 7 days
                $total_units_sold = \App\Models\OrderItem::where('menu_item_id', $item->id)
                    ->whereHas('order', function($q) use ($now) {
                        $q->where('created_at', '>=', $now->copy()->subDays(7))
                          ->where('status', 'Completed');
                    })->sum('quantity');
                
                $avg_daily_units = round($total_units_sold / 7, 2);

                $itemsPayload[] = [
                    'item_name' => $item->name,
                    'category' => $categoryName,
                    'total_units_sold' => (int) $total_units_sold,
                    'avg_daily_units' => (float) $avg_daily_units,
                    'unit_price' => (float) $item->price,
                ];

                // Map item_name back to menu_item_id
                $itemMap[$item->name] = $item->id;
            }

            if (empty($itemsPayload)) {
                return response()->json(['message' => 'No menu items found to predict'], 400);
            }

            $response = $this->flaskService->predictBatch($itemsPayload);

            // Handle Flask 400 errors (e.g., malformed payload overall)
            if (isset($response['error']) && !isset($response['predictions'])) {
                return response()->json(['message' => 'Flask rejected payload', 'details' => $response['error']], 400);
            }

            if (!empty($response['errors'])) {
                Log::warning('Flask returned errors for some items during prediction batch', ['errors' => $response['errors']]);
            }

            $predictions = $response['predictions'] ?? [];
            $updatedCount = 0;

            foreach ($predictions as $prediction) {
                $itemName = $prediction['item_name'];
                $menuItemId = $itemMap[$itemName] ?? null;

                if ($menuItemId) {
                    DemandPrediction::updateOrCreate(
                        [
                            'menu_item_id' => $menuItemId,
                            'week_start' => $weekStart->format('Y-m-d'),
                        ],
                        [
                            'predicted_label' => $prediction['predicted_label'],
                            'confidence_score' => $prediction['confidence'],
                        ]
                    );
                    $updatedCount++;
                }
            }

            return response()->json([
                'message' => 'Weekly predictions generated successfully',
                'processed' => $updatedCount,
                'errors' => $response['errors'] ?? []
            ]);

        } catch (FlaskServiceException $e) {
            Log::error('FlaskServiceException in generateWeeklyPredictions: ' . $e->getMessage());
            return response()->json(['error' => 'Prediction service unavailable', 'details' => $e->getMessage()], 503);
        } catch (\Exception $e) {
            Log::error('Unexpected error in generateWeeklyPredictions: ' . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred'], 500);
        }
    }

    public function syncMetrics(Request $request)
    {
        try {
            $metrics = $this->flaskService->getMetrics();

            $modelRun = ModelRun::create([
                'accuracy' => $metrics['accuracy'] ?? 0,
                'precision' => $metrics['precision'] ?? 0,
                'recall' => $metrics['recall'] ?? 0,
                'f1_score' => $metrics['f1_score'] ?? 0,
                'training_rows' => $metrics['training_rows'] ?? null,
                'trained_at' => $metrics['trained_at'] ?? Carbon::now(),
                'notes' => $metrics['notes'] ?? null,
            ]);

            return response()->json([
                'message' => 'Model metrics synced successfully',
                'data' => $modelRun
            ]);

        } catch (FlaskServiceException $e) {
            Log::error('FlaskServiceException in syncMetrics: ' . $e->getMessage());
            return response()->json(['error' => 'Prediction service unavailable', 'details' => $e->getMessage()], 503);
        } catch (\Exception $e) {
            Log::error('Unexpected error in syncMetrics: ' . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred'], 500);
        }
    }

    public function latestPredictions()
    {
        $latestWeek = DemandPrediction::max('week_start');
        
        if (!$latestWeek) {
            return response()->json([]);
        }

        $predictions = DemandPrediction::with('menuItem.category')->where('week_start', $latestWeek)->get();
        return response()->json($predictions);
    }

    public function latestMetrics()
    {
        $metrics = ModelRun::orderBy('trained_at', 'desc')->first();
        return response()->json($metrics);
    }
}
