<?php

declare(strict_types=1);

require_once __DIR__ . '/JsonResponse.php';

class ResponseFactory
{
    //so it can be either success right
    public function success(string $message,array $data=[],int $statusCode=200):JsonResponse
    {
        return new JsonResponse([
            'success'=>true,
            'message'=>$message,
            'data'=>$data,
        ],$statusCode);
    }

    //other response could be error ofc
    public function error(string $message,string $errorId,string $errorMessage,array $errors=[],int $statusCode=400):JsonResponse 
    {
        return new JsonResponse([
            'success'=>false,
            'message'=>$message,
            'error'=>[
                'id'=>$errorId,
                'message'=>$errorMessage,
                'errors'=>$errors,
            ],
            
        ],$statusCode);
    }
}
