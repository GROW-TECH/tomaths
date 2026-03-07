<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

require_once __DIR__ . "/config.php";

try {
    if (!$conn) {
        throw new Exception("Database connection failed");
    }

    if (empty($_POST["id"])) {
        throw new Exception("Course ID is required");
    }
    if (empty($_POST["course_name"])) {
        throw new Exception("Course name is required");
    }
    if (empty($_POST["price"])) {
        throw new Exception("Offer price is required");
    }

    $id = (int)$_POST["id"];
    $course_name = trim($_POST["course_name"]);
    $description = isset($_POST["description"]) ? $_POST["description"] : "";
    $price = $_POST["price"];
    $actual_price = isset($_POST["actual_price"]) ? $_POST["actual_price"] : "";

    // Handle multiple category_ids and subcategory_ids
    $category_id = "";
    $subcategory_id = "";
    
    // Handle category_ids (JSON array) - take first one
    if (isset($_POST["category_ids"])) {
        $decoded = json_decode($_POST["category_ids"], true);
        if (is_array($decoded) && !empty($decoded)) {
            $category_id = $decoded[0]; // Take first category
        }
    }
    
    // Handle subcategory_ids (JSON array) - take first one  
    if (isset($_POST["subcategory_ids"])) {
        $decoded = json_decode($_POST["subcategory_ids"], true);
        if (is_array($decoded) && !empty($decoded)) {
            $subcategory_id = $decoded[0]; // Take first subcategory
        }
    }
    
    // Fallback to single values for backward compatibility
    if (empty($category_id) && isset($_POST["category_id"])) {
        $category_id = $_POST["category_id"];
    }
    if (empty($subcategory_id) && isset($_POST["subcategory_id"])) {
        $subcategory_id = $_POST["subcategory_id"];
    }
    
    $exam_id = isset($_POST["exam_id"]) ? $_POST["exam_id"] : "";
    $exam_name = isset($_POST["exam_name"]) ? $_POST["exam_name"] : "";

    // YouTube URL
    $youtube_url = isset($_POST["youtube_url"]) ? trim($_POST["youtube_url"]) : "";

    // Duration
    $duration_value = (isset($_POST["duration_value"]) && is_numeric($_POST["duration_value"]))
        ? (int)$_POST["duration_value"]
        : 0;
    $duration_unit = isset($_POST["duration_unit"]) ? $_POST["duration_unit"] : "Days";

    $duration_in_hours = 0;
    if ($duration_unit == "Days") {
        $duration_in_hours = $duration_value * 24;
    } elseif ($duration_unit == "Months") {
        $duration_in_hours = $duration_value * 30 * 24;
    } elseif ($duration_unit == "Years") {
        $duration_in_hours = $duration_value * 365 * 24;
    } elseif ($duration_unit == "Hrs") {
        $duration_in_hours = $duration_value;
    }
    $duration_display = $duration_value . " " . $duration_unit;

    // Highlights
    if (isset($_POST["highlights"])) {
        $decoded = json_decode($_POST["highlights"], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid highlights format");
        }
        if (!is_array($decoded)) {
            throw new Exception("Highlights must be array");
        }
        $highlights = json_encode($decoded);
    } else {
        // If highlights not sent, keep existing value
        $checkStmt = $conn->prepare("SELECT highlights FROM courses WHERE id = ?");
        $checkStmt->bind_param("i", $id);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $row = $result->fetch_assoc();
        $highlights = $row["highlights"];
        $checkStmt->close();
    }

    // Image upload (optional)
    $imageName = null;
    if (isset($_FILES["image"]) && $_FILES["image"]["name"] != "") {
        $ext = strtolower(pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION));
        $allowed = array("jpg", "jpeg", "png", "webp");
        if (!in_array($ext, $allowed)) {
            throw new Exception("Invalid image type");
        }
        $uploadDir = __DIR__ . "/../uploads/";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $imageName = time() . "_" . uniqid() . "." . $ext;
        if (!move_uploaded_file($_FILES["image"]["tmp_name"], $uploadDir . $imageName)) {
            throw new Exception("Image upload failed");
        }
    }

    // SQL with youtube_url and exam_name
    if ($imageName) {
        $sql = "UPDATE courses SET
                    course_name = ?,
                    description = ?,
                    price = ?,
                    actual_price = ?,
                    duration = ?,
                    duration_minutes = ?,
                    image = ?,
                    category_id = ?,
                    subcategory_id = ?,
                    exam_id = ?,
                    exam_name = ?,
                    highlights = ?,
                    youtube_url = ?
                WHERE id = ?";
    } else {
        $sql = "UPDATE courses SET
                    course_name = ?,
                    description = ?,
                    price = ?,
                    actual_price = ?,
                    duration = ?,
                    duration_minutes = ?,
                    category_id = ?,
                    subcategory_id = ?,
                    exam_id = ?,
                    exam_name = ?,
                    highlights = ?,
                    youtube_url = ?
                WHERE id = ?";
    }

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception($conn->error);
    }

    // Bind parameters
    if ($imageName) {
        $stmt->bind_param(
            "ssssssssssssi",
            $course_name,
            $description,
            $price,
            $actual_price,
            $duration_display,
            $duration_in_hours,
            $imageName,
            $category_id,
            $subcategory_id,
            $exam_id,
            $exam_name,
            $highlights,
            $youtube_url,
            $id
        );
    } else {
        $stmt->bind_param(
            "sssssssssssi",
            $course_name,
            $description,
            $price,
            $actual_price,
            $duration_display,
            $duration_in_hours,
            $category_id,
            $subcategory_id,
            $exam_id,
            $exam_name,
            $highlights,
            $youtube_url,
            $id
        );
    }

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    echo json_encode(array(
        "success" => true,
        "message" => "Course updated successfully",
        "debug" => [
            "received_category_ids" => isset($_POST["category_ids"]) ? $_POST["category_ids"] : "not set",
            "received_subcategory_ids" => isset($_POST["subcategory_ids"]) ? $_POST["subcategory_ids"] : "not set",
            "used_category_id" => $category_id,
            "used_subcategory_id" => $subcategory_id
        ]
    ));

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => $e->getMessage()
    ));
}

$conn->close();
?>
