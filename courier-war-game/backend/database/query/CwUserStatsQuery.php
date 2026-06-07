<?php
declare(strict_types=1);

//this file stores SQL queries for cw_user_stats table
class CwUserStatsQuery
{
    //query to create default stats row for registered or guest user
    public static function insertDefaultStats(): string
    {
        return 'INSERT INTO cw_user_stats (user_id, preferred_role) VALUES (?,?)';
    }

    //query to get stats by user id
    public static function selectByUserId(): string
    {
        return 'SELECT user_id, preferred_role, last_played_role, total_matches, total_wins, courier_matches, courier_wins, courier_easy_wins, courier_medium_wins, saboteur_easy_wins, saboteur_medium_wins, fastest_delivery_ms, best_saboteur_delay_ms, total_obstacle_energy_spent, hurdle_red_traffic_light_count, hurdle_road_block_count, hurdle_construction_work_count, hurdle_traffic_jam_count, hurdle_closed_gate_count, hurdle_wrong_direction_sign_count, hurdle_broken_road_count, hurdle_moving_barrier_count, hurdle_security_checkpoint_count, ability_speed_boost_count, ability_shield_count, ability_reveal_route_count, created_at, updated_at FROM cw_user_stats WHERE user_id=? LIMIT 1';
    }

    //query to update preferred role
    public static function updatePreferredRole(): string
    {
        return 'UPDATE cw_user_stats SET preferred_role=? WHERE user_id=?';
    }

    //query to update last played role
    public static function updateLastPlayedRole(): string
    {
        return 'UPDATE cw_user_stats SET last_played_role=? WHERE user_id=?';
    }

    //query to add one Courier match
    public static function addCourierMatch(): string
    {
        return 'UPDATE cw_user_stats SET total_matches=total_matches+1, courier_matches=courier_matches+1 WHERE user_id=?';
    }

    //query to add one Courier win
    public static function addCourierWin(): string
    {
        return 'UPDATE cw_user_stats SET total_wins=total_wins+1, courier_wins=courier_wins+1 WHERE user_id=?';
    }

    //query to add one Courier easy win
    public static function addCourierEasyWin(): string
    {
        return 'UPDATE cw_user_stats SET courier_easy_wins=courier_easy_wins+1 WHERE user_id=?';
    }

    //query to add one Courier medium win
    public static function addCourierMediumWin(): string
    {
        return 'UPDATE cw_user_stats SET courier_medium_wins=courier_medium_wins+1 WHERE user_id=?';
    }

    //query to update fastest delivery if new value is better
    public static function updateFastestDeliveryIfBetter(): string
    {
        return 'UPDATE cw_user_stats SET fastest_delivery_ms=IF(fastest_delivery_ms IS NULL OR ?<fastest_delivery_ms, ?, fastest_delivery_ms) WHERE user_id=?';
    }

    //query to add Courier ability usage counts
    public static function addAbilityCounts(): string
    {
        return 'UPDATE cw_user_stats SET ability_speed_boost_count=ability_speed_boost_count+?, ability_shield_count=ability_shield_count+?, ability_reveal_route_count=ability_reveal_route_count+? WHERE user_id=?';
    }

    //query to add one Saboteur match, saboteur_matches is derived so only total_matches changes
    public static function addSaboteurMatch(): string
    {
        return 'UPDATE cw_user_stats SET total_matches=total_matches+1 WHERE user_id=?';
    }

    //query to add one Saboteur win, saboteur_wins is derived from total_wins minus courier_wins
    public static function addSaboteurWin(): string
    {
        return 'UPDATE cw_user_stats SET total_wins=total_wins+1 WHERE user_id=?';
    }

    //query to add one Saboteur easy win
    public static function addSaboteurEasyWin(): string
    {
        return 'UPDATE cw_user_stats SET saboteur_easy_wins=saboteur_easy_wins+1 WHERE user_id=?';
    }

    //query to add one Saboteur medium win
    public static function addSaboteurMediumWin(): string
    {
        return 'UPDATE cw_user_stats SET saboteur_medium_wins=saboteur_medium_wins+1 WHERE user_id=?';
    }

    //query to update best Saboteur delay if new value is better
    public static function updateBestSaboteurDelayIfBetter(): string
    {
        return 'UPDATE cw_user_stats SET best_saboteur_delay_ms=IF(best_saboteur_delay_ms IS NULL OR ?>best_saboteur_delay_ms, ?, best_saboteur_delay_ms) WHERE user_id=?';
    }

    //query to add obstacle energy spent
    public static function addObstacleEnergySpent(): string
    {
        return 'UPDATE cw_user_stats SET total_obstacle_energy_spent=total_obstacle_energy_spent+? WHERE user_id=?';
    }

    //query to add hurdle usage counts
    public static function addHurdleCounts(): string
    {
        return 'UPDATE cw_user_stats SET hurdle_red_traffic_light_count=hurdle_red_traffic_light_count+?, hurdle_road_block_count=hurdle_road_block_count+?, hurdle_construction_work_count=hurdle_construction_work_count+?, hurdle_traffic_jam_count=hurdle_traffic_jam_count+?, hurdle_closed_gate_count=hurdle_closed_gate_count+?, hurdle_wrong_direction_sign_count=hurdle_wrong_direction_sign_count+?, hurdle_broken_road_count=hurdle_broken_road_count+?, hurdle_moving_barrier_count=hurdle_moving_barrier_count+?, hurdle_security_checkpoint_count=hurdle_security_checkpoint_count+? WHERE user_id=?';
    }
}
