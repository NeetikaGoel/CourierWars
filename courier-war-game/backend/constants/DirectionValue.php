<?php
declare(strict_types=1);

class DirectionValue
{
    public const LEFT = 'left'; // x-1
    public const RIGHT = 'right'; // x+1
    public const UP = 'up'; // y-1
    public const DOWN = 'down'; // y+1

    public const NONE = 'none'; // no movt direction

    //to get all directions at once
    public static function all(): array
    {
        return [self::LEFT, self::RIGHT, self::UP, self::DOWN, self::NONE];
    }

    //to get only movt directions = so dont include none in this
    public static function movementOnly(): array
    {
        return [self::LEFT, self::RIGHT, self::UP, self::DOWN]; 
    }
}
