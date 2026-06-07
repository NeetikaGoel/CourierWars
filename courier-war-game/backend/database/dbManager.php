<?php
declare(strict_types=1);

require_once __DIR__ . '/DbConnect.php';

//now this file will directly talk to db okayyyy
class DBManager
{
    //this helper is needed because mysqli bind_param wants values by reference
    private function bindParams(mysqli_stmt $query, string $types, array $params): void
    {
        if ($types === '' || count($params) === 0) {
            return;
        }

        $bindValues = [];
        $bindValues[] = $types;

        foreach ($params as $key => $value) 
            {
                $bindValues[] = &$params[$key];
            }

        call_user_func_array([$query, 'bind_param'], $bindValues);
    }

    //this was when we wanted all rows
    public function getAllRows(string $sql): array
    {
        global $conn;
        $result = mysqli_query($conn, $sql);
        $rows = [];

        while ($row = mysqli_fetch_assoc($result)) {
            $rows[] = $row;
        }

        return $rows;
    }

    //now since we have parameters too so first prepare teh query fully then run
    public function getAllRowsPrepared(string $sql, string $types, array $params): array
    {
        global $conn;
        $query = $conn->prepare($sql);

        $this->bindParams($query, $types, $params); //connect types and params in the query

        $query->execute(); //execute the command
        $result = $query->get_result(); //whatever result we get from query

        $rows = [];
        while ($row = mysqli_fetch_assoc($result)) //this mysqli fetch assoc gives 1 row at a time in associative array format which is key value type fomrat
        {
            $rows[] = $row;
        }

        $query->close(); //close it if work over, nice to have thing
        return $rows;
    }

    public function getOneRowPrepared(string $sql, string $types, array $params): ?array
    {
        global $conn;
        $query = $conn->prepare($sql);

        $this->bindParams($query, $types, $params);

        $query->execute();
        $result = $query->get_result();
        $row = mysqli_fetch_assoc($result);
        $query->close();

        if ($row === false) {
            return null;
        }

        return $row;
    }

    public function runQuery(string $sql, string $types, array $params): void //NO NEED TO RETURN ANYTHING JUST EXECUTE LIKE IF WE UPDATE USER STATS OR MARK MATCH COMPLETE!!
    {
        global $conn;
        $query = $conn->prepare($sql); //take sql line

        $this->bindParams($query, $types, $params); //types of values taht will be added into query and params the actual values that need to be binded with the query

        $query->execute();
        $query->close();
    }

    //now if want to insert some row like in case of new user id or match id
    public function insertRowAndReturnId(string $sql, string $types, array $params): int
    {
        global $conn;
        $query = $conn->prepare($sql); //take sql line

        $this->bindParams($query, $types, $params); //types of values taht will be added into query and params the actual values that need to be binded with the query

        $query->execute();
        $insertId = $conn->insert_id;
        //THIS INSERT ID CAN ACT LIKE USER ID OR MATCH ID FOR US SO IT IS VERY VERY IMPORTANT!!!!!!
        $query->close();
        return (int)$insertId;
    }


    //FOR EXPLAIN QUERY

    public function explainQuery(string $sql, string $types, array $params): array
    {
        global $conn;

        $explainSql = 'EXPLAIN ' . $sql;
        $query = $conn->prepare($explainSql);

        $this->bindParams($query, $types, $params);

        $query->execute();
        $result = $query->get_result();

        $rows = [];

        while ($row = mysqli_fetch_assoc($result)) {
            $rows[] = $row;
        }

        $query->close();
        return $rows;
    }
}
