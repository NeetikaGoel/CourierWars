<?php
declare(strict_types=1);

require_once __DIR__ . '/DbManager.php';

//this will be bridge between db manager and repo files hehe - CUTE ORM STRUCTURE
class OrmManager
{
    //create db manager obj
    private DBManager $dbManager;

    public function __construct()
    {
        $this->dbManager = new DBManager();
    }

    //now its function is taking sql query and mapper and call db manager and fetch rows and map it and return mapped data back
    public function ormManage(string $sql, object $mapper): array
    {
        $rows = $this->dbManager->getAllRows($sql);
        return $mapper->getMappingRows($rows);
    }

    //for 1 row it will map
    public function ormManageForOneRow(string $sql, string $types, array $params, object $mapper): mixed
    {
        $row = $this->dbManager->getOneRowPrepared($sql, $types, $params);

        if ($row === null) {
            return null;
        }

        return $mapper->getMappingSingleRow($row);
    }

    //just run query needed to be done so no mapping
    public function runQuery(string $sql, string $types, array $params): void
    {
        $this->dbManager->runQuery($sql, $types, $params);
    }

    //just insert so no mapping ofc
    public function insertQuery(string $sql, string $types, array $params): int
    {
        return $this->dbManager->insertRowAndReturnId($sql, $types, $params);
    }

    public function ormManageWithParams(string $sql, string $types, array $params, object $mapper): array
    {
        $rows = $this->dbManager->getAllRowsPrepared($sql, $types, $params);
        return $mapper->getMappingRows($rows);
    }

    //NEW FUNCTION FOR EXPLIAN QUERY THING

    public function explainQuery(string $sql, string $types, array $params): array
    {
        return $this->dbManager->explainQuery($sql, $types, $params);
    }
}
