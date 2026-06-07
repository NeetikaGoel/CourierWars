<?php 
declare(strict_types=1);

class HurdleTypeValue
{
    public const RED_TRAFFIC_LIGHT = 'redTrafficLight'; // this turns a green signal red temporarily
    public const ROAD_BLOCK = 'roadBlock'; // this blocks 1 road temporarily - indefinitely until saboteur removes it
    public const CONSTRUCTION_WORK = 'constructionWork'; // this slows courier on a road temporarily
    public const TRAFFIC_JAM = 'trafficJam'; // this creates a slow movt zone
    public const CLOSED_GATE = 'closedGate'; // this closes tunnel shortcut/bridge entrance
    public const WRONG_DIRECTION_SIGN = 'wrongDirectionSign'; // this misleads route choice near intersections/shortcuts
    public const BROKEN_ROAD = 'brokenRoad'; // this makes a road unavailable temporarily
    public const MOVING_BARRIER = 'movingBarrier'; // this creates timing hazard and may reduce life
    public const SECURITY_CHECKPOINT = 'securityCheckpoint'; // this stops courier briefly

    //if to get all values together
    public static function all(): array 
    {
        return [
            self::RED_TRAFFIC_LIGHT, 
            self::ROAD_BLOCK, 
            self::CONSTRUCTION_WORK, 
            self::TRAFFIC_JAM, 
            self::CLOSED_GATE, 
            self::WRONG_DIRECTION_SIGN, 
            self::BROKEN_ROAD, 
            self::MOVING_BARRIER, 
            self::SECURITY_CHECKPOINT, 
        ]; 
    }
}
