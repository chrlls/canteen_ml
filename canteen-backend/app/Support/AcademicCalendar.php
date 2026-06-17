<?php

namespace App\Support;

use Illuminate\Support\Carbon;

class AcademicCalendar
{
    public static function isBreakWeek(Carbon $date): bool
    {
        $m = $date->month;
        $d = $date->day;

        // Summer break: ~June 1 - July 31
        if ($m === 6 || $m === 7) {
            return true;
        }

        // Winter break: ~Dec 15 - Jan 5
        if ($m === 12 && $d >= 15) {
            return true;
        }
        if ($m === 1 && $d <= 5) {
            return true;
        }

        return false;
    }

    public static function isExamWeek(Carbon $date): bool
    {
        $m = $date->month;
        $d = $date->day;

        if ($m === 10 && $d >= 14 && $d <= 18) {
            return true;
        }
        if ($m === 12 && $d >= 9 && $d <= 13) {
            return true;
        }
        if ($m === 3 && $d >= 10 && $d <= 14) {
            return true;
        }
        if ($m === 5 && $d >= 12 && $d <= 16) {
            return true;
        }

        return false;
    }

    public static function isEnrollmentWeek(Carbon $date): bool
    {
        $m = $date->month;
        $d = $date->day;

        if ($m === 8 && $d >= 1 && $d <= 7) {
            return true;
        }
        if ($m === 1 && $d >= 6 && $d <= 12) {
            return true;
        }

        return false;
    }
}
