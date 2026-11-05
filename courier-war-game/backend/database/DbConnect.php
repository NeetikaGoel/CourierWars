<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/DatabaseConfig.php';

//for the connection part,we will use mysqli extension for php which is improved version of mysql and helps us to connect php to mysql database

//we could have also used pdo extension but mysqli is more simple and easy to use as of now hehee
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);  //so this line will turn mysql errors into exceptions and return it gracefully and not silently which is not nice 

//errors occur at runtime and disrupt flow coz occur by env/system
//exceptions we can handle nicely coz occur in code and we can correct it

//CONNECT PHP TO MYSQL DATABASE
$host = DatabaseConfig::host(); //DB SHOULD ALSO RUN ON SAME MACHINE OR ENV VALUE CAN OVERRIDE THIS
$username = DatabaseConfig::username();  //MYSQL USERNAME
$password = DatabaseConfig::password(); //MYSQL PASSWORD
$database = DatabaseConfig::databaseName(); //DB NAME
$port = DatabaseConfig::port(); //MYSQL PORT

//since this can throw exception so put in try catch
try {
    //first we need conn variable to have connection to db obj
    $conn = new mysqli($host, $username, $password, $database, $port);

    //this sets charset so utf8mb4 text like user name is handled correctly
    $conn->set_charset(DatabaseConfig::charset());
} 

catch (mysqli_sql_exception $exception) 
{
    throw new RuntimeException('Courier War database connection failed!!', 0, $exception);
}
