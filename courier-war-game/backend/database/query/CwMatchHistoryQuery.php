<?php

declare(strict_types=1);

//this file stores SQL queries for cw_match_history table
class CwMatchHistoryQuery
{
    //query to insert completed match history row
    public static function insertMatchHistory(): string
    {
        return 'INSERT INTO cw_match_history (difficulty, map_version, map_generation_version, courier_user_id, saboteur_user_id, started_at, ended_at, winner_role, end_reason, timer_total_ms, time_remaining_ms, courier_lives_remaining, delivery_progress_pct, obstacle_energy_spent, obstacle_energy_remaining, hurdle_red_traffic_light_count, hurdle_road_block_count, hurdle_construction_work_count, hurdle_traffic_jam_count, hurdle_closed_gate_count, hurdle_wrong_direction_sign_count, hurdle_broken_road_count, hurdle_moving_barrier_count, hurdle_security_checkpoint_count, ability_speed_boost_count, ability_shield_count, ability_reveal_route_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    }

    //query to get match history by match id
    public static function selectByMatchId(): string
    {
        return 'SELECT match_id, difficulty, map_version, map_generation_version, courier_user_id, saboteur_user_id, started_at, ended_at, winner_role, end_reason, timer_total_ms, time_remaining_ms, courier_lives_remaining, delivery_progress_pct, obstacle_energy_spent, obstacle_energy_remaining, hurdle_red_traffic_light_count, hurdle_road_block_count, hurdle_construction_work_count, hurdle_traffic_jam_count, hurdle_closed_gate_count, hurdle_wrong_direction_sign_count, hurdle_broken_road_count, hurdle_moving_barrier_count, hurdle_security_checkpoint_count, ability_speed_boost_count, ability_shield_count, ability_reveal_route_count, created_at FROM cw_match_history WHERE match_id=? LIMIT 1';
    }

    //query to get recent matches where user played courier or saboteur
    public static function selectRecentByUserId(): string
    {
        return 'SELECT match_id, difficulty, map_version, map_generation_version, courier_user_id, saboteur_user_id, started_at, ended_at, winner_role, end_reason, timer_total_ms, time_remaining_ms, courier_lives_remaining, delivery_progress_pct, obstacle_energy_spent, obstacle_energy_remaining, hurdle_red_traffic_light_count, hurdle_road_block_count, hurdle_construction_work_count, hurdle_traffic_jam_count, hurdle_closed_gate_count, hurdle_wrong_direction_sign_count, hurdle_broken_road_count, hurdle_moving_barrier_count, hurdle_security_checkpoint_count, ability_speed_boost_count, ability_shield_count, ability_reveal_route_count, created_at FROM cw_match_history WHERE courier_user_id=? OR saboteur_user_id=? ORDER BY ended_at DESC LIMIT ?';
    }
}
