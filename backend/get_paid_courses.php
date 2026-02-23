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

/* ================= DB CONNECTION ================= */
$conn = new mysqli("localhost", "admin_maths", "admin_maths123", "admin_maths");

if ($conn->connect_error) {
    echo json_encode(array(
        "success" => false,
        "message" => "Database connection failed"
    ));
    exit;
}

/* ================= GET COURSES ================= */
$now = date("Y-m-d H:i:s");

// Get all courses with payment info
$query = "
SELECT 
    c.*,
    p.id as payment_id,
    p.user_id,
    p.status as payment_status,
    p.expiry_date,
    p.created_at as payment_created_at,
    CASE 
        WHEN p.id IS NOT NULL AND p.status = 'SUCCESS' AND (p.expiry_date IS NULL OR p.expiry_date > ?) THEN 1
        ELSE 0
    END as paid,
    CASE 
        WHEN p.expiry_date > ? THEN 
            TIMESTAMPDIFF(HOUR, ?, p.expiry_date)
        ELSE 0
    END as days_remaining
FROM courses c
LEFT JOIN payments p ON c.id = p.course_id AND p.user_id = ? AND p.status = 'SUCCESS'
ORDER BY c.id
";

$stmt = $conn->prepare($query);
$stmt->bind_param("ssi", $now, $now, $userId);
$stmt->execute();
$result = $stmt->get_result();

$courses = [];
while ($row = $result->fetch_assoc()) {
    // Calculate days remaining properly
    if ($row['expiry_date']) {
        $expiry = new DateTime($row['expiry_date']);
        $now_dt = new DateTime();
        $diff = $expiry->getTimestamp() - $now_dt->getTimestamp();
        
        // Check if course is expired
        if ($diff <= 0) {
            $row['paid'] = 0; // Mark as not paid if expired
            $row['days_remaining'] = 0;
        } else {
            // For hourly courses, show hours, for others show days
            if (stripos($row['duration'], 'hr') !== false) {
                $row['days_remaining'] = $diff / (60 * 60); // Convert seconds to hours
            } else {
                $row['days_remaining'] = $diff / (60 * 60 * 24); // Convert seconds to days
            }
        }
    } else {
        $row['days_remaining'] = null;
    }
    
    // Debug logging for hourly courses
    if (stripos($row['duration'], 'hr') !== false) {
        file_put_contents(
            dirname(__FILE__) . "/courses_debug.log",
            date("Y-m-d H:i:s") . " - Course: {$row['id']}, Duration: '{$row['duration']}', Expiry: '{$row['expiry_date']}', Days Remaining: {$row['days_remaining']}, Paid: {$row['paid']}\n",
            FILE_APPEND
        );
    }
    
    $courses[] = $row;
}

echo json_encode(array(
    "success" => true,
    "courses" => $courses
));

$stmt->close();
$conn->close();
?>
