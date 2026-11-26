<?php
declare(strict_types=1);

// this exception carries an api error code and http status so the controller can answer without guessing
class MatchServiceException extends RuntimeException
{
    private string $_errorCode;
    private int $_httpStatus;
    private array $_details;

    public function __construct(string $errorCode, string $message, int $httpStatus, array $details = [])
    {
        parent::__construct($message);
        $this->_errorCode = $errorCode;
        $this->_httpStatus = $httpStatus;
        $this->_details = $details;
    }

    public function getErrorCode(): string
    {
        return $this->_errorCode;
    }

    public function getHttpStatus(): int
    {
        return $this->_httpStatus;
    }

    public function getDetails(): array
    {
        return $this->_details;
    }
}
