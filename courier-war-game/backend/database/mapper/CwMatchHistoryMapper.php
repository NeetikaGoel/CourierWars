<?php
declare(strict_types=1);

// importing match history entity first now
require_once __DIR__ . '/../../entity/CwMatchHistory.php';

//this mapper converts cw_match_history database rows into CwMatchHistory entities
class CwMatchHistoryMapper
{
    //this maps many database rows to many CwMatchHistory objects
    public function getMappingRows(array $rows): array
    {
        $mappedRows = []; // this will store mapped match history entities

        foreach ($rows as $row) // looping through all db rows
        {
            $mappedRows[] = $this->getMappingSingleRow($row); // mapping each row and add it to result
        }

        return $mappedRows; // return all mapped match history entities
    }

    //this maps one database row to one CwMatchHistory object
    public function getMappingSingleRow(array $row): CwMatchHistory
    {
        return new CwMatchHistory(
            (int)$row['match_id'],
            (string)$row['difficulty'],
            (string)$row['map_version'],
            (string)$row['map_generation_version'],
            (int)$row['courier_user_id'],
            (int)$row['saboteur_user_id'],
            (string)$row['started_at'],
            (string)$row['ended_at'],
            (string)$row['winner_role'],
            (string)$row['end_reason'],
            (int)$row['timer_total_ms'],
            (int)$row['time_remaining_ms'],
            (int)$row['courier_lives_remaining'],
            (int)$row['delivery_progress_pct'],
            (int)$row['obstacle_energy_spent'],
            (int)$row['obstacle_energy_remaining'],
            (int)$row['hurdle_red_traffic_light_count'],
            (int)$row['hurdle_road_block_count'],
            (int)$row['hurdle_construction_work_count'],
            (int)$row['hurdle_traffic_jam_count'],
            (int)$row['hurdle_closed_gate_count'],
            (int)$row['hurdle_wrong_direction_sign_count'],
            (int)$row['hurdle_broken_road_count'],
            (int)$row['hurdle_moving_barrier_count'],
            (int)$row['hurdle_security_checkpoint_count'],
            (int)$row['ability_speed_boost_count'],
            (int)$row['ability_shield_count'],
            (int)$row['ability_reveal_route_count'],
            (string)$row['created_at']
        );
    }
}
