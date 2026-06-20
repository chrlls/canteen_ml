<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class HasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!in_array($request->user()->role, $roles)) {
            return response()->json(['error' => 'Forbidden — insufficient role'], 403);
        }

        return $next($request);
    }
}
