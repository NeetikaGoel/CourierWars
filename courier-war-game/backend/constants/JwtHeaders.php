<?php
declare(strict_types=1);

//new file storing jwt header field names
class JwtHeaders
{
    //header fields here
    public const SIGNING_ALGORITHM = 'alg'; // signing algo
    public const TOKEN_TYPE = 'typ'; // token format type
    public const TOKEN_TYPE_JWT = 'JWT';
}
