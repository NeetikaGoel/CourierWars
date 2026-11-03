
-- TINYINT (1 byte = 8 bits) → Signed: -128 to 127 | Unsigned: 0 to 255
-- SMALLINT (2 bytes = 16 bits) → Signed: -32,768 to 32,767 | Unsigned: 0 to 65,535
-- MEDIUMINT (3 bytes = 24 bits) → Signed: -8,388,608 to 8,388,607 | Unsigned: 0 to 16,777,215
-- INT (4 bytes = 32 bits) → Signed: -2,147,483,648 to 2,147,483,647 | Unsigned: 0 to 4,294,967,295
-- BIGINT (8 bytes = 64 bits) → Signed: -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 | Unsigned: 0 to 18,446,744,073,709,551,615

-- BOOLEAN ALSO BRACKET THING GONE, JUST 1 BIT IT WILL TAKE

-- ENGINE INNO DB

-- ADD COMMENTS TOO


## Values deliberately not stored because they are derivable - 

# USER STATS TABLE
 
total_losses = total_matches - total_wins

saboteur_matches = total_matches - courier_matches

courier_losses = courier_matches - courier_wins

saboteur_wins = total_wins - courier_wins

saboteur_losses = saboteur_matches - saboteur_wins

total_hurdles_activated =
  hurdle_red_traffic_light_count
+ hurdle_road_block_count
+ hurdle_construction_work_count
+ hurdle_traffic_jam_count
+ hurdle_closed_gate_count
+ hurdle_wrong_direction_sign_count
+ hurdle_broken_road_count
+ hurdle_moving_barrier_count
+ hurdle_security_checkpoint_count

total_ability_uses =
  ability_speed_boost_count
+ ability_shield_count
+ ability_reveal_route_count


# MATCH HISTORY TABLE

match_duration_ms = ended_at - started_at

total_hurdles_activated =
  hurdle_red_traffic_light_count
+ hurdle_road_block_count
+ hurdle_construction_work_count
+ hurdle_traffic_jam_count
+ hurdle_closed_gate_count
+ hurdle_wrong_direction_sign_count
+ hurdle_broken_road_count
+ hurdle_moving_barrier_count
+ hurdle_security_checkpoint_count

total_ability_uses =
  ability_speed_boost_count
+ ability_shield_count
+ ability_reveal_route_count



MYSQL COMMAND TO CHECK

mysql -u root -p -e "
USE courier_war;
SHOW TABLES;
SELECT 'cw_users' AS table_name, COUNT(*) AS row_count FROM cw_users
UNION ALL
SELECT 'cw_user_stats', COUNT(*) FROM cw_user_stats
UNION ALL
SELECT 'cw_match_history', COUNT(*) FROM cw_match_history;
"