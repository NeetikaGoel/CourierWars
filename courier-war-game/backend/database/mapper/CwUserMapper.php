<?php
declare(strict_types=1);

// importing user entity first now
require_once __DIR__ . '/../../entity/CwUser.php'; 

//this mapper converts cw_users database rows into CwUser entities
class CwUserMapper
{
    //this maps many database rows to many CwUser objects
    public function getMappingRows(array $rows): array
    {
        $mappedRows = []; // this will store mapped entities

        foreach ($rows as $row) // looping through all db rows
        {
            $mappedRows[] = $this->getMappingSingleRow($row); // mapping each row and add it to result
        }

        return $mappedRows; // return all mapped user entities
    }

    //this maps one database row to one CwUser object
    public function getMappingSingleRow(array $row): CwUser
    {
        return new CwUser(
            (int)$row['user_id'], 
            (string)$row['username'], 
            $row['name'] === null ? null : (string)$row['name'], // map name nullable
            $row['email'] === null ? null : (string)$row['email'], // map email nullable
            $row['password_hash'] === null ? null : (string)$row['password_hash'], // map password hash nullable
            (string)$row['created_at'], 
            (string)$row['updated_at'] 
        );
    }
}
