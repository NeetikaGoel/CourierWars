<?php

declare(strict_types=1);

//so this is for representing http response
class JsonResponse
{
    private int $statusCode;
    private array $body; //for the response body
    private array $headers;

    //add constructor now
    public function __construct(array $body,int $statusCode=200,array $headers=[])
    {
        $this->body=$body;
        $this->statusCode=$statusCode;
        $this->headers=$headers;
    }

    public function send():void
    {
        http_response_code($this->statusCode);

        header('Content-Type: application/json'); //Tells client the response body is JSON
        header('X-Content-Type-Options: nosniff'); //Prevents browser from guessing a different content type
        header('X-Frame-Options: DENY'); //Prevents our API response/page from being embedded in an iframe
        //Clickjacking means attacker embeds ur page/API UI invisibly inside another site and tricks user into clicking something -- so it prevents that 
        header('Referrer-Policy: no-referrer'); //Prevents browser from sending referrer URL information
        //Normally browser may send previous page URL to next request- without this header, browser may leak that URL as referrer so hence this line avoids leaking internal URLs/query params
        header("Content-Security-Policy: default-src 'self'"); //Allows browser resources only from same origin by default --CSP controls what resources browser is allowed to load

        foreach ($this->headers as $name=>$value) 
            {
                header($name . ': ' . $value);
            }

        echo json_encode($this->body,JSON_PRETTY_PRINT);
    }


    //add getters now
    public function getStatusCode():int
    {
        return $this->statusCode;
    }

    public function getBody():array
    {
        return $this->body;
    }
}