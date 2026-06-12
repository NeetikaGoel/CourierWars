<?php
declare(strict_types=1);

class DifficultyValue
{
    public const EASY = 'easy';
    public const MEDIUM = 'medium'; 
    public const HARD = 'hard';

    //if we want all
    public static function all(): array 
    {
        return [self::EASY, self::MEDIUM, self::HARD]; 
    }
}
