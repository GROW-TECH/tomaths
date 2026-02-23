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
$userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
$courseId = isset($data['course_id']) ? intval($data['course_id']) : 0;

if ($userId === 0 || $courseId === 0) {
    echo json_encode(array(
        "success" => false,
        "message" => "Missing user ID or course ID"
    ));
    exit;
}

/* ================= DB CONNECTION ================= */
$conn = new mysqli("localhost", "admin_maths", "admin_maths123", "admin_maths");

if ($conn->connect_error) {
    echo json_encode(array(
        "success" => false,
        "message" => "Database connection failed"
    ));
    exit;
}

/* ================= CHECK ENROLLMENT ================= */
$query = "SELECT id, expiry_date FROM payments WHERE user_id = ? AND course_id = ? AND status = 'SUCCESS'";
$stmt = $conn->prepare($query);
$stmt->bind_param("ii", $userId, $courseId);
$stmt->execute();
$result = $stmt->get_result();

$enrolled = false;
$expiryDate = null;

if ($payment = $result->fetch_assoc()) {
    // Check if payment is still valid (not expired)
    if ($payment['expiry_date']) {
        $expiry = new DateTime($payment['expiry_date']);
        $now = new DateTime();
        $enrolled = $expiry > $now;
        $expiryDate = $payment['expiry_date'];
        
        // Debug logging
        file_put_contents(
            dirname(__FILE__) . "/enrollment_debug.log",
            date("Y-m-d H:i:s") . " - User: $userId, Course: $courseId, Expiry: {$payment['expiry_date']}, Now: " . $now->format('Y-m-d H:i:s') . ", Enrolled: " . ($enrolled ? 'YES' : 'NO') . "\n",
            FILE_APPEND
        );
    } else {
        // If no expiry date, consider it enrolled
        $enrolled = true;
    }
}

echo json_encode(array(
    "success" => true,
    "enrolled" => $enrolled,
    "expiry_date" => $expiryDate
));

$stmt->close();
$conn->close();
?>
