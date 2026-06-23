<?php
declare(strict_types=1);

//a new file again for storing fixed jwt format values
class JwtFormatValue
{
    public const TOKEN_PART_SEPARATOR = '.'; // separator btw jwt header payload and sign
    public const TOKEN_PART_COUNT = 3; // jwt must have header payload and sign

    public const BASE64_BLOCK_SIZE = 4; // base64 works in blocks of 4 chars
    public const BASE64_PADDING_CHAR = '='; // base64 padding char

    public const BASE64_STANDARD_CHAR_LIST = '+/'; // normal base64 chars
    public const BASE64_URL_SAFE_CHAR_LIST = '-_'; // jwt base64url chars
}
