<?php

namespace App\Services;

use App\Exceptions\FlaskServiceException;
use Illuminate\Support\Facades\Http;

class FlaskPredictionService
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.flask.url', 'http://localhost:5000');
    }

    /**
     * @param array $items
     * @return array
     * @throws FlaskServiceException
     */
    public function predictBatch(array $items): array
    {
        try {
            $response = Http::timeout(10)->post("{$this->baseUrl}/predict", [
                'items' => $items,
            ]);

            // Allow 400 as it's part of the contract to return JSON errors
            if (!$response->successful() && $response->status() !== 400) {
                throw new FlaskServiceException("Flask API error: " . $response->status());
            }

            return $response->json();
        } catch (\Exception $e) {
            if ($e instanceof FlaskServiceException) {
                throw $e;
            }
            throw new FlaskServiceException("Failed to communicate with Flask service: " . $e->getMessage());
        }
    }

    /**
     * @return array
     * @throws FlaskServiceException
     */
    public function getMetrics(): array
    {
        try {
            $response = Http::timeout(10)->get("{$this->baseUrl}/metrics");

            if (!$response->successful()) {
                throw new FlaskServiceException("Flask API error: " . $response->status());
            }

            return $response->json();
        } catch (\Exception $e) {
            if ($e instanceof FlaskServiceException) {
                throw $e;
            }
            throw new FlaskServiceException("Failed to communicate with Flask service: " . $e->getMessage());
        }
    }
}
