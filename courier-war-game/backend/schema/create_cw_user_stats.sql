CREATE DATABASE IF NOT EXISTS courier_war
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE courier_war;

-- TINYINT  (1 byte  = 8 bits)  -> Signed: -128 to 127 | Unsigned: 0 to 255
-- SMALLINT (2 bytes = 16 bits) -> Signed: -32,768 to 32,767 | Unsigned: 0 to 65,535
-- MEDIUMINT (3 bytes = 24 bits) -> Signed: -8,388,608 to 8,388,607 | Unsigned: 0 to 16,777,215
-- INT      (4 bytes = 32 bits) -> Signed: -2,147,483,648 to 2,147,483,647 | Unsigned: 0 to 4,294,967,295
-- BIGINT   (8 bytes = 64 bits) -> Signed: very large | Unsigned: 0 to 18,446,744,073,709,551,615

-- This table stores base stats only
-- Values like losses, Saboteur matches, and hard difficulty wins will be calculated in code
-- Guests also get stats rows as per final review decision

-- DERIVED STATS FROM THIS TABLE WILL BE NOW::

-- total_losses = total_matches - total_wins

-- saboteur_matches = total_matches - courier_matches

-- courier_losses = courier_matches - courier_wins

-- saboteur_wins = total_wins - courier_wins

-- saboteur_losses = saboteur_matches - saboteur_wins

-- courier_hard_wins = courier_wins - courier_easy_wins - courier_medium_wins

-- saboteur_hard_wins = saboteur_wins - saboteur_easy_wins - saboteur_medium_wins


CREATE TABLE IF NOT EXISTS cw_user_stats
(
    user_id BIGINT UNSIGNED PRIMARY KEY COMMENT 'User id from cw_users.user_id',

    preferred_role ENUM('courier', 'saboteur', 'any') CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL DEFAULT 'any' COMMENT 'Preferred role selected by user',

    last_played_role ENUM('courier', 'saboteur') CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL COMMENT 'Last role played by user, null if no completed match exists',

    total_matches MEDIUMINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total completed matches played by user',

    total_wins MEDIUMINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total completed matches won by user',

    courier_matches MEDIUMINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total completed matches played as Courier',

    courier_wins MEDIUMINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total completed matches won as Courier',

    courier_easy_wins MEDIUMINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total Courier wins in Easy difficulty',

    courier_medium_wins MEDIUMINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total Courier wins in Medium difficulty',

    saboteur_easy_wins MEDIUMINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total Saboteur wins in Easy difficulty',

    saboteur_medium_wins MEDIUMINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total Saboteur wins in Medium difficulty',

    fastest_delivery_ms MEDIUMINT UNSIGNED DEFAULT NULL COMMENT 'Fastest Courier delivery time in milliseconds, null if no Courier delivery win exists',

    best_saboteur_delay_ms MEDIUMINT UNSIGNED DEFAULT NULL COMMENT 'Best Saboteur delay performance in milliseconds, null if no Saboteur win exists',

    total_obstacle_energy_spent SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime obstacle energy spent while playing Saboteur',

    hurdle_red_traffic_light_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime Red Traffic Light activation count',

    hurdle_road_block_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime Road Block activation count',

    hurdle_construction_work_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime Construction Work activation count',

    hurdle_traffic_jam_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime Traffic Jam activation count',

    hurdle_closed_gate_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime Closed Gate activation count',

    hurdle_wrong_direction_sign_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime Wrong Direction Sign activation count',

    hurdle_broken_road_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime Broken Road activation count',

    hurdle_moving_barrier_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime Moving Barrier activation count',

    hurdle_security_checkpoint_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime Security Checkpoint activation count',

    ability_speed_boost_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime Speed Boost usage count',

    ability_shield_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime Shield usage count',

    ability_reveal_route_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime Reveal Route usage count',

    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Record creation timestamp',

    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'Last update timestamp',

    CONSTRAINT fk_cw_user_stats_user_id
        FOREIGN KEY (user_id) REFERENCES cw_users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT check_cw_user_stats_total_wins_valid
        CHECK (total_wins<=total_matches),

    CONSTRAINT check_cw_user_stats_courier_matches_valid
        CHECK (courier_matches<=total_matches),

    CONSTRAINT check_cw_user_stats_courier_wins_valid
        CHECK (courier_wins<=courier_matches),

    CONSTRAINT check_cw_user_stats_courier_wins_total_valid
        CHECK (courier_wins<=total_wins),

    CONSTRAINT check_cw_user_stats_courier_difficulty_wins_valid
        CHECK ((courier_easy_wins+courier_medium_wins)<=courier_wins),

    CONSTRAINT check_cw_user_stats_saboteur_difficulty_wins_valid
        CHECK ((saboteur_easy_wins+saboteur_medium_wins)<=(total_wins-courier_wins)),

    CONSTRAINT check_cw_user_stats_fastest_delivery_valid
        CHECK (fastest_delivery_ms IS NULL OR fastest_delivery_ms>0),

    CONSTRAINT check_cw_user_stats_best_saboteur_delay_valid
        CHECK (best_saboteur_delay_ms IS NULL OR best_saboteur_delay_ms>0)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci
  COMMENT='Courier War user stats table for registered and guest users';