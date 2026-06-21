<?php

declare(strict_types=1);

require_once __DIR__ . '/src/App/Application.php';
require_once __DIR__ . '/Http/Request.php';
require_once __DIR__ . '/Http/ResponseFactory.php';
require_once __DIR__ . '/Logging/Logger.php';

//defining host for local only server
$host = '127.0.0.1';

//defining port for cache server
$port = 8080;

//creating socket server address
$serverAddress = 'tcp://' . $host . ':' . $port;

//creating SOCKET SERVER which will keep running
$serverSocket = stream_socket_server($serverAddress, $errorCode, $errorMessage);

//if server socket was not created then stop startup
if ($serverSocket === false) {
    Logger::logError('Server', 'Failed to start socket server', 'SERVER_SOCKET_START_FAILED', null, [
        'errorCode' => $errorCode,
        'errorMessage' => $errorMessage
    ]);

    echo "Failed to start cache server: " . $errorMessage . PHP_EOL;
    exit(1);
}

//shutdown flag starts as false because server should keep running
$serverShouldStop = false;

//enable signal handling if pcntl exists
if (function_exists('pcntl_async_signals') && function_exists('pcntl_signal')) {
    //enable automatic signal handling
    pcntl_async_signals(true);

    //listen for SIGTERM graceful shutdown
    pcntl_signal(SIGTERM, function () use (&$serverShouldStop) {
        Logger::logInfo('Server', 'SIGTERM received graceful shutdown started', []);

        $serverShouldStop = true;
    });

    //listen for SIGINT graceful shutdown like ctrl c
    pcntl_signal(SIGINT, function () use (&$serverShouldStop) {
        Logger::logInfo('Server', 'SIGINT received graceful shutdown started', []);

        $serverShouldStop = true;
    });
}

//create application object with backend root path ONLY ONCE
$application = new Application(__DIR__);

//log that server has started
Logger::logInfo('Server', 'Cache server started', [
    'host' => $host,
    'port' => $port
]);

//show success message in terminal/log
echo "Cache server started on http://" . $host . ":" . $port . PHP_EOL;

//keep server alive until graceful shutdown signal comes
while ($serverShouldStop === false) {
    //wait for a client request
    $clientSocket = @stream_socket_accept($serverSocket, 1); //This waits for curl/Postman/browser to connect

    //if client was not accepted then continue waiting
    if ($clientSocket === false) {
        continue;
    }

    try {
        //read raw http request from socket
        $rawHttpRequest = serverHttpRequestRead($clientSocket);

        //if request is empty then close client and continue
        if ($rawHttpRequest === '') {
            fclose($clientSocket);
            continue;
        }

        //create request object from raw http request
        $request = Request::createRequestFromRawHttp($rawHttpRequest);

        //let application handle request using same application and same cache service
        $response = $application->handle($request);

        //convert json response object to raw http response text
        $rawHttpResponse = serverHttpResponseBuild($response);

        //send response back to client
        fwrite($clientSocket, $rawHttpResponse);
    } catch (Throwable $exception) {
        //logging unhandled exception at top boundary
        Logger::logError('Server', 'Unhandled server exception', 'SERVER_UNHANDLED_EXCEPTION', $exception, []);

        //creating a fallback response factory
        $responseFactory = new ResponseFactory();

        //creating  a safe general response now
        $response = $responseFactory->error('Internal server error', 'SERVER-5001', 'Unexpected server error', [], 500);

        //convert fallback response to raw http response
        $rawHttpResponse = serverHttpResponseBuild($response);

        //send fallback response to client
        fwrite($clientSocket, $rawHttpResponse);
    }

    //close client connection after response
    fclose($clientSocket);
}

//close main server socket after loop exits
fclose($serverSocket);

//log graceful shutdown completed
Logger::logInfo('Server', 'Cache server stopped gracefully', []);

echo "Cache server stopped gracefully" . PHP_EOL;

//function to read complete raw http request from client socket
function serverHttpRequestRead($clientSocket): string
{
    //start with empty request data
    $requestData = '';

    //read until headers end
    while (strpos($requestData, "\r\n\r\n") === false) {
        //read chunk from socket
        $chunk = fread($clientSocket, 1024);

        //if no chunk then stop reading
        if ($chunk === false || $chunk === '') {
            break;
        }

        //append chunk to request data
        $requestData .= $chunk;
    }

    //split header and body parts
    $requestParts = explode("\r\n\r\n", $requestData, 2);

    //get header text
    $headerText = $requestParts[0] ?? '';

    //get body text already read
    $bodyText = $requestParts[1] ?? '';

    //find content length from headers
    $contentLength = serverContentLengthFind($headerText);

    //keep reading body until full content length is received
    while (strlen($bodyText) < $contentLength) {
        //read remaining body chunk
        $chunk = fread($clientSocket, $contentLength - strlen($bodyText));

        //if no chunk then stop reading
        if ($chunk === false || $chunk === '') {
            break;
        }

        //append chunk to body
        $bodyText .= $chunk;
    }

    //return full raw http request
    return $headerText . "\r\n\r\n" . $bodyText;
}

//function to find content length from raw headers
function serverContentLengthFind(string $headerText): int
{
    //split headers into lines
    $headerLines = preg_split("/\r\n|\n|\r/", $headerText);

    //loop through header lines
    foreach ($headerLines as $headerLine) {
        //check content length header
        if (stripos($headerLine, 'Content-Length:') === 0) {
            //take number after content length
            $contentLengthRaw = trim(substr($headerLine, strlen('Content-Length:')));

            //return integer content length
            return (int)$contentLengthRaw;
        }
    }

    //no body by default
    return 0;
}

//function to build raw http response from JsonResponse
function serverHttpResponseBuild(JsonResponse $response): string
{
    //get http status code
    $statusCode = $response->getStatusCode();

    //get status text
    $statusText = serverStatusTextGet($statusCode);

    //convert response body array to json
    $body = json_encode($response->getBody(), JSON_PRETTY_PRINT);

    //if json encoding fails then use safe fallback json
    if ($body === false) {
        $body = '{"success":false,"message":"Response encoding failed"}';
    }

    //start response with status line
    $rawResponse = 'HTTP/1.1 ' . $statusCode . ' ' . $statusText . "\r\n";

    //tell client response body is json
    $rawResponse .= "Content-Type: application/json\r\n";

    //prevent browser from guessing content type
    $rawResponse .= "X-Content-Type-Options: nosniff\r\n";

    //prevent response from being embedded in iframe
    $rawResponse .= "X-Frame-Options: DENY\r\n";

    //prevent referrer url leakage
    $rawResponse .= "Referrer-Policy: no-referrer\r\n";

    //restrict browser resource loading to same origin
    $rawResponse .= "Content-Security-Policy: default-src 'self'\r\n";

    //tell client response length
    $rawResponse .= 'Content-Length: ' . strlen($body) . "\r\n";

    //close connection after response
    $rawResponse .= "Connection: close\r\n";

    //empty line separates headers and body
    $rawResponse .= "\r\n";

    //append json body
    $rawResponse .= $body;

    //return full http response
    return $rawResponse;
}

//function to map status code to status text
function serverStatusTextGet(int $statusCode): string
{
    //return status text based on status code
    return match ($statusCode) {
        200 => 'OK',
        400 => 'Bad Request',
        401 => 'Unauthorized',
        403 => 'Forbidden',
        404 => 'Not Found',
        405 => 'Method Not Allowed',
        409 => 'Conflict',
        429 => 'Too Many Requests',
        500 => 'Internal Server Error',
        default => 'OK'
    };
}
