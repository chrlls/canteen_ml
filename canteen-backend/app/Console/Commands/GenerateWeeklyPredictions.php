<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\PredictionController;
use Illuminate\Http\Request;

class GenerateWeeklyPredictions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'predict:weekly';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically generate weekly AI demand predictions and sync metrics';

    /**
     * Execute the console command.
     */
    public function handle(PredictionController $controller)
    {
        $this->info('Starting Weekly Demand Prediction generation...');
        
        $request = new Request();
        $response = $controller->generateWeeklyPredictions($request);
        
        $status = $response->getStatusCode();
        if ($status === 200) {
            $this->info('✅ Weekly predictions generated successfully.');
        } else {
            $this->error('❌ Failed to generate predictions. Status: ' . $status);
        }

        $this->info('Syncing metrics...');
        $syncResponse = $controller->syncMetrics();
        if ($syncResponse->getStatusCode() === 200) {
            $this->info('✅ Metrics synced successfully.');
        } else {
            $this->error('❌ Failed to sync metrics.');
        }
    }
}
