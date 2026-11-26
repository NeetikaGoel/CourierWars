<?php
declare(strict_types=1);

//this script checks the courier war database and applies the schema files
//it uses DatabaseConfig so DB_* env overrides behave exactly like the backend
//
//  php backend/scripts/database-setup.php check          print status, exit code below
//  php backend/scripts/database-setup.php apply-schema   create database + missing tables, then check
//
//exit codes: 0 ready | 2 server unreachable | 3 access denied | 4 schema missing | 1 other error

require_once __DIR__ . '/../config/DatabaseConfig.php';

const DATABASE_SETUP_EXIT_READY = 0;
const DATABASE_SETUP_EXIT_ERROR = 1;
const DATABASE_SETUP_EXIT_UNREACHABLE = 2;
const DATABASE_SETUP_EXIT_ACCESS_DENIED = 3;
const DATABASE_SETUP_EXIT_SCHEMA_MISSING = 4;

//mysql client error codes we care about
//1045 wrong password, 1698 account uses another auth plugin (e.g. MariaDB root via unix_socket only),
//1044 login works but no access to the database
const MYSQL_ERROR_ACCESS_DENIED_LIST = [1044, 1045, 1698];
const MYSQL_ERROR_CONNECTION_LIST = [2002, 2003, 2006, 2013];

//schema files in dependency order (stats and history reference users) mapped to the table each creates
const DATABASE_SCHEMA_TABLE_BY_FILE = [
    'create_cw_users.sql' => 'cw_users',
    'create_cw_user_stats.sql' => 'cw_user_stats',
    'create_cw_match_history.sql' => 'cw_match_history',
];

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

//this connects to the server without selecting a database so a missing database is reported as missing schema
function databaseServerConnect(): mysqli
{
    $connection = mysqli_init();
    $connection->options(MYSQLI_OPT_CONNECT_TIMEOUT, DatabaseConfig::timeoutSeconds());
    $connection->real_connect(
        DatabaseConfig::host(),
        DatabaseConfig::username(),
        DatabaseConfig::password(),
        null,
        DatabaseConfig::port()
    );
    $connection->set_charset(DatabaseConfig::charset());

    return $connection;
}

//this returns schema tables that do not exist yet
function databaseTableMissingListGet(mysqli $connection): array
{
    $statement = $connection->prepare(
        'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?'
    );
    $databaseName = DatabaseConfig::databaseName();
    $statement->bind_param('s', $databaseName);
    $statement->execute();
    $result = $statement->get_result();

    $tableExistingList = [];
    while ($row = $result->fetch_assoc()) {
        $tableExistingList[] = $row['TABLE_NAME'];
    }

    return array_values(array_diff(array_values(DATABASE_SCHEMA_TABLE_BY_FILE), $tableExistingList));
}

//this runs one multi statement sql file and drains every result so errors surface
function databaseSchemaFileApply(mysqli $connection, string $schemaFilePath): void
{
    $sql = file_get_contents($schemaFilePath);
    if ($sql === false) {
        throw new RuntimeException('cannot read ' . $schemaFilePath);
    }

    $connection->multi_query($sql);
    do {
        $result = $connection->store_result();
        if ($result instanceof mysqli_result) {
            $result->free();
        }
    } while ($connection->more_results() && $connection->next_result());
}

function databaseTarget(): string
{
    return DatabaseConfig::username() . '@' . DatabaseConfig::host() . ':' . DatabaseConfig::port()
        . '/' . DatabaseConfig::databaseName();
}

$mode = $argv[1] ?? 'check';
if (!in_array($mode, ['check', 'apply-schema'], true)) {
    fwrite(STDERR, "usage: php database-setup.php [check|apply-schema]\n");
    exit(DATABASE_SETUP_EXIT_ERROR);
}

if (DatabaseConfig::databaseName() !== DatabaseConfig::DATABASE_NAME_DEFAULT) {
    //schema files hardcode the default database name
    fwrite(STDERR, 'WARNING: schema files create `' . DatabaseConfig::DATABASE_NAME_DEFAULT
        . '` but DB_NAME is `' . DatabaseConfig::databaseName() . "`\n");
}

try {
    $connection = databaseServerConnect();
} catch (mysqli_sql_exception $exception) {
    if (in_array($exception->getCode(), MYSQL_ERROR_ACCESS_DENIED_LIST, true)) {
        echo 'ACCESS_DENIED ' . databaseTarget() . ': ' . $exception->getMessage() . PHP_EOL;
        exit(DATABASE_SETUP_EXIT_ACCESS_DENIED);
    }
    if (in_array($exception->getCode(), MYSQL_ERROR_CONNECTION_LIST, true)) {
        echo 'UNREACHABLE ' . databaseTarget() . ': ' . $exception->getMessage() . PHP_EOL;
        exit(DATABASE_SETUP_EXIT_UNREACHABLE);
    }
    echo 'ERROR ' . databaseTarget() . ': ' . $exception->getMessage() . PHP_EOL;
    exit(DATABASE_SETUP_EXIT_ERROR);
}

try {
    if ($mode === 'apply-schema') {
        $schemaDirectory = __DIR__ . '/../schema/';
        foreach (array_keys(DATABASE_SCHEMA_TABLE_BY_FILE) as $schemaFileName) {
            databaseSchemaFileApply($connection, $schemaDirectory . $schemaFileName);
            echo 'applied ' . $schemaFileName . PHP_EOL;
        }
    }

    $tableMissingList = databaseTableMissingListGet($connection);
    if ($tableMissingList !== []) {
        echo 'SCHEMA_MISSING ' . databaseTarget() . ': ' . implode(', ', $tableMissingList) . PHP_EOL;
        exit(DATABASE_SETUP_EXIT_SCHEMA_MISSING);
    }

    echo 'READY ' . databaseTarget() . ' (server ' . $connection->server_info . ')' . PHP_EOL;
    exit(DATABASE_SETUP_EXIT_READY);
} catch (mysqli_sql_exception $exception) {
    echo 'ERROR ' . databaseTarget() . ': ' . $exception->getMessage() . PHP_EOL;
    exit(DATABASE_SETUP_EXIT_ERROR);
}
