<?php
declare(strict_types=1); 

//status of match in its lifecycle
class MatchStatusValue 
{
    public const WAITING = 0; // 1 player is waiting for another
    public const READY = 1; // both roles are assigned and map is being generated
    public const ACTIVE = 2; // gameplay is running
    public const COMPLETED = 3; // match has completed normally
    public const DRAW = 4; //match was cancelled by system or cache loss or anything by agreement maybe or whatever
}
