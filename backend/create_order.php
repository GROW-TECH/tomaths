<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
date_default_timezone_set('Asia/Kolkata');

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

/* ================= PRE-FLIGHT ================= */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    echo json_encode(array("success" => true));
    exit;
}

/* ================= READ INPUT ================= */
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Invalid JSON input"
    ));
    exit;
}

/* ================= VALIDATE AMOUNT ================= */
$amount = isset($data['amount']) ? intval($data['amount']) : 0;

if ($amount <= 0) {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Invalid amount. Must be greater than 0"
    ));
    exit;
}

/* ================= RAZORPAY CREDENTIALS ================= */
$keyId = "rzp_live_Remrhpj0npbETD";
$keySecret = "Kr7NnAfh3gDlO165YGKc8uns";

/* ================= CREATE RAZORPAY ORDER ================= */
$orderData = array(
    "amount" => $amount,  // Amount in paise (100 paise = 1 rupee)
    "currency" => "INR",
    "receipt" => "receipt_" . time(),
    "notes" => array(
        "created_at" => date("Y-m-d H:i:s")
    )
);

$ch = curl_init("https://api.razorpay.com/v1/orders");

curl_setopt_array($ch, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($orderData),
    CURLOPT_USERPWD => $keyId . ":" . $keySecret,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_TIMEOUT => 30
));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);

curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Failed to create order: " . $curlError
    ));
    exit;
}

$orderResponse = json_decode($response, true);

if (!isset($orderResponse['id'])) {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Failed to create Razorpay order",
        "razorpay_error" => $orderResponse['description'] ?? "Unknown error",
        "http_code" => $httpCode
    ));
    exit;
}

/* ================= SUCCESS RESPONSE ================= */
echo json_encode(array(
    "success" => true,
    "order_id" => $orderResponse['id'],
    "amount" => $orderResponse['amount'],
    "currency" => $orderResponse['currency'],
    "receipt" => $orderResponse['receipt']
));
?>
