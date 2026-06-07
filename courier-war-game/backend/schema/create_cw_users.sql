CREATE DATABASE IF NOT EXISTS courier_war
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE courier_war;

-- TINYINT  (1 byte  = 8 bits)  -> Signed: -128 to 127 | Unsigned: 0 to 255
-- SMALLINT (2 bytes = 16 bits) -> Signed: -32,768 to 32,767 | Unsigned: 0 to 65,535
-- MEDIUMINT (3 bytes = 24 bits) -> Signed: -8,388,608 to 8,388,607 | Unsigned: 0 to 16,777,215
-- INT      (4 bytes = 32 bits) -> Signed: -2,147,483,648 to 2,147,483,647 | Unsigned: 0 to 4,294,967,295
-- BIGINT   (8 bytes = 64 bits) -> Signed: very large | Unsigned: 0 to 18,446,744,073,709,551,615

-- BOOLEAN in MySQL is treated like TINYINT(1)
-- We are not storing is_guest because it can be derived from email and password_hash
-- Registered user: email IS NOT NULL AND password_hash IS NOT NULL
-- Guest user: email IS NULL AND password_hash IS NULL

CREATE TABLE IF NOT EXISTS cw_users
(
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary user id for registered and guest users',

    username VARCHAR(32) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL COMMENT 'Unique username for registered user or generated guest username',

    name VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Display name shown in game UI',

    email VARCHAR(255) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL COMMENT 'Registered user email, null for guest users',

    password_hash VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL COMMENT 'Password hash for registered users, null for guest users',

    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Record creation timestamp',

    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'Last update timestamp',

    UNIQUE KEY uq_cw_users_username(username),

    UNIQUE KEY uq_cw_users_email(email),

    CONSTRAINT check_cw_users_username_length
        CHECK (CHAR_LENGTH(username) BETWEEN 3 AND 32),

    CONSTRAINT check_cw_users_name_length
    CHECK (name IS NULL OR CHAR_LENGTH(TRIM(name)) BETWEEN 1 AND 40),

    CONSTRAINT check_cw_users_email_length
        CHECK (email IS NULL OR CHAR_LENGTH(email) BETWEEN 6 AND 255),

    CONSTRAINT check_cw_users_password_hash_length
        CHECK (password_hash IS NULL OR CHAR_LENGTH(password_hash) BETWEEN 20 AND 255),

    CONSTRAINT check_cw_users_registered_or_guest_valid
        CHECK
        (
            (email IS NULL AND password_hash IS NULL)
            OR
            (email IS NOT NULL AND password_hash IS NOT NULL)
        )
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci
  COMMENT='Courier War users table for registered and guest users';