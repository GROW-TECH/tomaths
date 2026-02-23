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
    echo json_encode(array(
        "success" => false,
        "message" => "Invalid JSON"
    ));
    exit;
}

/* ================= INPUT ================= */
$orderId   = isset($data['razorpay_order_id']) ? $data['razorpay_order_id'] : '';
$paymentId = isset($data['razorpay_payment_id']) ? $data['razorpay_payment_id'] : '';
$signature = isset($data['razorpay_signature']) ? $data['razorpay_signature'] : '';
$userId    = isset($data['user_id']) ? intval($data['user_id']) : 0;
$courseId  = isset($data['course_id']) ? intval($data['course_id']) : 0;

if ($orderId == '' || $paymentId == '' || $signature == '' || $userId == 0 || $courseId == 0) {
    echo json_encode(array(
        "success" => false,
        "message" => "Missing required fields"
    ));
    exit;
}

/* ================= VERIFY SIGNATURE ================= */
$keyId     = "rzp_live_Remrhpj0npbETD";
$keySecret = "Kr7NnAfh3gDlO165YGKc8uns";

$generatedSignature = hash_hmac(
    "sha256",
    $orderId . "|" . $paymentId,
    $keySecret
);

if ($generatedSignature !== $signature) {
    echo json_encode(array(
        "success" => false,
        "message" => "Invalid signature"
    ));
    exit;
}

/* ================= FETCH AMOUNT FROM RAZORPAY ================= */
$ch = curl_init("https://api.razorpay.com/v1/payments/" . $paymentId);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERPWD => $keyId . ":" . $keySecret
]);

$response = curl_exec($ch);

if ($response === false) {
    echo json_encode(array(
        "success" => false,
        "message" => "Failed to fetch payment"
    ));
    exit;
}

curl_close($ch);

$paymentData = json_decode($response, true);

if (!isset($paymentData['amount'])) {
    echo json_encode(array(
        "success" => false,
        "message" => "Invalid Razorpay response"
    ));
    exit;
}

/* Convert paise → rupees */
$amount = $paymentData['amount'] / 100;

/* ================= DB ================= */
$conn = new mysqli("localhost", "admin_maths", "admin_maths123", "admin_maths");

if ($conn->connect_error) {
    echo json_encode(array(
        "success" => false,
        "message" => "DB connection failed"
    ));
    exit;
}

/* ================= DUPLICATE CHECK & UPDATE ================= */
$check = $conn->prepare("SELECT id, expiry_date FROM payments WHERE payment_id = ?");
$check->bind_param("s", $paymentId);
$check->execute();
$checkResult = $check->get_result();
$existingPayment = $checkResult->fetch_assoc();
$check->close();

if ($existingPayment) {
    echo json_encode(array(
        "success" => true,
        "message" => "Payment already exists",
        "expiry_date" => $existingPayment['expiry_date']
    ));
    exit;
}

// Also check if user already has this course and update it
$existingCourse = $conn->prepare("SELECT id FROM payments WHERE user_id = ? AND course_id = ? AND status = 'SUCCESS'");
$existingCourse->bind_param("ii", $userId, $courseId);
$existingCourse->execute();
$existingCourseResult = $existingCourse->get_result();
$hasExistingCourse = $existingCourseResult->fetch_assoc();
$existingCourse->close();

if ($hasExistingCourse) {
    // Update existing payment with new expiry
    $update = $conn->prepare("UPDATE payments SET expiry_date = ? WHERE user_id = ? AND course_id = ? AND status = 'SUCCESS'");
    $update->bind_param("sii", $expiryDate, $userId, $courseId);
    $update->execute();
    $update->close();
    
    echo json_encode(array(
        "success" => true,
        "message" => "Course expiry updated successfully",
        "expiry_date" => $expiryDate
    ));
    exit;
}

/* ================= GET COURSE DURATION & CALCULATE EXPIRY ================= */
$startDate = date("Y-m-d H:i:s");

// Get course duration
$courseQ = $conn->prepare("SELECT duration FROM courses WHERE id = ?");
$courseQ->bind_param("i", $courseId);
$courseQ->execute();
$result = $courseQ->get_result();
$course = $result->fetch_assoc();
$courseQ->close();

// Calculate expiry based on duration
if ($course && isset($course['duration'])) {
    $durationText = trim($course['duration']);
    
    // Log for debugging
    file_put_contents(
        dirname(__FILE__) . "/verify_debug.log",
        date("Y-m-d H:i:s") . " - Course ID: $courseId, Raw Duration: '$durationText'\n",
        FILE_APPEND
    );
    
    // Parse duration
    if (preg_match('/(\d+)\s*month/i', $durationText, $matches)) {
        $months = intval($matches[1]);
        $expiryDate = date("Y-m-d H:i:s", strtotime("+$months months"));
        file_put_contents(
            dirname(__FILE__) . "/verify_debug.log",
            date("Y-m-d H:i:s") . " - Matched MONTH: $months months, Expiry: $expiryDate\n",
            FILE_APPEND
        );
    } elseif (preg_match('/(\d+)\s*day/i', $durationText, $matches)) {
        $days = intval($matches[1]);
        $expiryDate = date("Y-m-d H:i:s", strtotime("+$days days"));
        file_put_contents(
            dirname(__FILE__) . "/verify_debug.log",
            date("Y-m-d H:i:s") . " - Matched DAY: $days days, Expiry: $expiryDate\n",
            FILE_APPEND
        );
    } elseif (preg_match('/(\d+)\s*hrs?/i', $durationText, $matches)) {
        $hours = intval($matches[1]);
        $expiryDate = date("Y-m-d H:i:s", strtotime("+$hours hours"));
        file_put_contents(
            dirname(__FILE__) . "/verify_debug.log",
            date("Y-m-d H:i:s") . " - Matched HRS: $hours hours, Expiry: $expiryDate\n",
            FILE_APPEND
        );
    } elseif (preg_match('/(\d+)\s*hour/i', $durationText, $matches)) {
        $hours = intval($matches[1]);
        $expiryDate = date("Y-m-d H:i:s", strtotime("+$hours hours"));
        file_put_contents(
            dirname(__FILE__) . "/verify_debug.log",
            date("Y-m-d H:i:s") . " - Matched HOUR: $hours hours, Expiry: $expiryDate\n",
            FILE_APPEND
        );
    } else {
        // Default to 2 months if parsing fails
        $expiryDate = date("Y-m-d H:i:s", strtotime("+2 months"));
        file_put_contents(
            dirname(__FILE__) . "/verify_debug.log",
            date("Y-m-d H:i:s") . " - Parsing failed, defaulting to 2 months. Duration: '$durationText'\n",
            FILE_APPEND
        );
    }
    
    // Validate calculated expiry date
    if (!$expiryDate || $expiryDate === '') {
        $expiryDate = date("Y-m-d H:i:s", strtotime("+2 months"));
        file_put_contents(
            dirname(__FILE__) . "/verify_debug.log",
            date("Y-m-d H:i:s") . " - Invalid expiry date calculated, using default 2 months\n",
            FILE_APPEND
        );
    }
} else {
    // Default to 2 months if no duration found
    $expiryDate = date("Y-m-d H:i:s", strtotime("+2 months"));
    file_put_contents(
        dirname(__FILE__) . "/verify_debug.log",
        date("Y-m-d H:i:s") . " - No duration found, defaulting to 2 months\n",
        FILE_APPEND
    );
}

/* ================= INSERT ================= */
$currency = "INR";
$status   = "SUCCESS";

$stmt = $conn->prepare("
INSERT INTO payments 
(user_id, course_id, order_id, payment_id, signature, amount, currency, status, created_at, expiry_date)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
    "iisssissss",
    $userId,
    $courseId,
    $orderId,
    $paymentId,
    $signature,
    $amount,
    $currency,
    $status,
    $startDate,
    $expiryDate
);

if (!$stmt->execute()) {
    echo json_encode(array(
        "success" => false,
        "message" => "DB insert failed",
        "sql_error" => $stmt->error
    ));
    exit;
}

/* ================= SUCCESS ================= */
// Validate expiry date before returning
if (!$expiryDate) {
    $expiryDate = date("Y-m-d H:i:s", strtotime("+2 months"));
    file_put_contents(
        dirname(__FILE__) . "/verify_debug.log",
        date("Y-m-d H:i:s") . " - No expiry date set, using default 2 months\n",
        FILE_APPEND
    );
}

echo json_encode(array(
    "success" => true,
    "message" => "Payment verified & stored successfully",
    "amount" => $amount,
    "expiry_date" => $expiryDate
));

// Final debug log
file_put_contents(
    dirname(__FILE__) . "/verify_debug.log",
    date("Y-m-d H:i:s") . " - FINAL RESPONSE: success=true, expiry_date=$expiryDate\n",
    FILE_APPEND
);
?>
