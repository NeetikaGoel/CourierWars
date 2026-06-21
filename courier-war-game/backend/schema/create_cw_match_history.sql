CREATE DATABASE IF NOT EXISTS courier_war
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE courier_war;

-- TINYINT  (1 byte  = 8 bits)  -> Signed: -128 to 127 | Unsigned: 0 to 255
-- SMALLINT (2 bytes = 16 bits) -> Signed: -32,768 to 32,767 | Unsigned: 0 to 65,535
-- MEDIUMINT (3 bytes = 24 bits) -> Signed: -8,388,608 to 8,388,607 | Unsigned: 0 to 16,777,215
-- INT      (4 bytes = 32 bits) -> Signed: -2,147,483,648 to 2,147,483,647 | Unsigned: 0 to 4,294,967,295
-- BIGINT   (8 bytes = 64 bits) -> Signed: very large | Unsigned: 0 to 18,446,744,073,709,551,615

-- This table stores completed match summary only
-- It does not store every Courier move, every hover, every click, or full replay history
-- Map seed will be stored in cache and logs for now, not in this table

CREATE TABLE IF NOT EXISTS cw_match_history
(
    match_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Completed match id',

    difficulty ENUM('easy', 'medium', 'hard') CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL DEFAULT 'medium' COMMENT 'Difficulty selected for the match',

    map_version VARCHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'v1' COMMENT 'Map version used for the match',

    map_generation_version VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'city_map_generation_v7' COMMENT 'Map generation version used for the match',

    courier_user_id BIGINT UNSIGNED NOT NULL COMMENT 'User id of the Courier player from cw_users.user_id',

    saboteur_user_id BIGINT UNSIGNED NOT NULL COMMENT 'User id of the Saboteur player from cw_users.user_id',

    started_at DATETIME(3) NOT NULL COMMENT 'Match start timestamp',

    ended_at DATETIME(3) NOT NULL COMMENT 'Match end timestamp',

    winner_role ENUM('courier', 'saboteur') CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL COMMENT 'Winner role for completed match',

    end_reason ENUM('delivered', 'timerExpired', 'courierLivesZero', 'forfeit', 'draw') CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL COMMENT 'Reason why match ended',

    timer_total_ms MEDIUMINT UNSIGNED NOT NULL DEFAULT 300000 COMMENT 'Total match timer in milliseconds',

    time_remaining_ms MEDIUMINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Remaining match time in milliseconds when match ended',

    courier_lives_remaining TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Courier lives remaining at match end, valid range 0 to 3',

    delivery_progress_pct TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Delivery progress percentage at match end, valid range 0 to 100',

    obstacle_energy_spent MEDIUMINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Obstacle energy spent by Saboteur during match',

    obstacle_energy_remaining MEDIUMINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Obstacle energy remaining for Saboteur at match end',

    hurdle_red_traffic_light_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Red Traffic Light activations in this match',

    hurdle_road_block_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Road Block activations in this match',

    hurdle_construction_work_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Construction Work activations in this match',

    hurdle_traffic_jam_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Traffic Jam activations in this match',

    hurdle_closed_gate_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Closed Gate activations in this match',

    hurdle_wrong_direction_sign_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Wrong Direction Sign activations in this match',

    hurdle_broken_road_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Broken Road activations in this match',

    hurdle_moving_barrier_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Moving Barrier activations in this match',

    hurdle_security_checkpoint_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Security Checkpoint activations in this match',

    ability_speed_boost_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Speed Boost uses in this match',

    ability_shield_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Shield uses in this match',

    ability_reveal_route_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Reveal Route uses in this match',

    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Record creation timestamp',

    INDEX idx_cw_match_history_courier_user_id (courier_user_id),

    INDEX idx_cw_match_history_saboteur_user_id (saboteur_user_id),

    CONSTRAINT fk_cw_match_history_courier_user_id
        FOREIGN KEY (courier_user_id) REFERENCES cw_users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_cw_match_history_saboteur_user_id
        FOREIGN KEY (saboteur_user_id) REFERENCES cw_users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT check_cw_match_history_time_order_valid
        CHECK (ended_at>=started_at),

    CONSTRAINT check_cw_match_history_timer_total_valid
        CHECK (timer_total_ms>0),

    CONSTRAINT check_cw_match_history_time_remaining_valid
        CHECK (time_remaining_ms<=timer_total_ms),

    CONSTRAINT check_cw_match_history_courier_lives_valid
        CHECK (courier_lives_remaining<=3),

    CONSTRAINT check_cw_match_history_delivery_progress_valid
        CHECK (delivery_progress_pct<=100)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci
  COMMENT='Courier War completed match history table';