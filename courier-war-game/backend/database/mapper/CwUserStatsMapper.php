<?php
declare(strict_types=1);

// importing user stats entity first now
require_once __DIR__ . '/../../entity/CwUserStats.php';

//this mapper converts cw_user_stats database rows into CwUserStats entities
class CwUserStatsMapper
{
    //this maps many database rows to many CwUserStats objects
    public function getMappingRows(array $rows): array
    {
        $mappedRows = []; // this will store mapped stats entities
        foreach ($rows as $row) // looping through all db rows
        {
            $mappedRows[] = $this->getMappingSingleRow($row); // mapping each row and add it to result
        }
        return $mappedRows; // return all mapped stats entities
    }

    //this maps one database row to one CwUserStats object
    public function getMappingSingleRow(array $row): CwUserStats
    {
        return new CwUserStats(
            (int)$row['user_id'],
            (string)$row['preferred_role'],
            $row['last_played_role'] === null ? null : (string)$row['last_played_role'], //nullable
            (int)$row['total_matches'],
            (int)$row['total_wins'],
            (int)$row['courier_matches'],
            (int)$row['courier_wins'],
            (int)$row['courier_easy_wins'],
            (int)$row['courier_medium_wins'],
            (int)$row['saboteur_easy_wins'],
            (int)$row['saboteur_medium_wins'],
            $row['fastest_delivery_ms'] === null ? null : (int)$row['fastest_delivery_ms'], // nullable
            $row['best_saboteur_delay_ms'] === null ? null : (int)$row['best_saboteur_delay_ms'], // nullable
            (int)$row['total_obstacle_energy_spent'],
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
            (string)$row['created_at'],
            (string)$row['updated_at']
        );
    }
}
