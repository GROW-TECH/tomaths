import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  BookOpen,
  X,               // for close button
} from "lucide-react";

/* ================= TYPES ================= */
interface User {
  id: number;
  name: string;
  email: string;
}

interface Test {
  id: number;
  test_name: string;
  test_url: string;
  created_at: string;
}

interface Course {
  id: number;
  title: string;
  price: number;
}

/* ================= CONFIG ================= */
const API_BASE = "https://xiadot.com/admin_maths/api";
const RAZORPAY_KEY = "rzp_live_Remrhpj0npbETD";

export default function TestSeriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  // ========== NEW: State for iframe modal ==========
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  const course: Course = {
    id: 8,
    title: "Geometry - Aptitude Topic wise Test-Series + PDF",
    price: 1,
  };

  /* ================= LOAD USER & CHECK ENROLLMENT ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        checkEnrollment(userData.id);
      } catch (e) {
        console.error("Failed to parse user", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  /* ================= CHECK ENROLLMENT ================= */
  const checkEnrollment = (userId: number) => {
    setLoading(true);
    fetch(`${API_BASE}/check_enrollment.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        course_id: course.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.enrolled) {
          setEnrolled(true);
          loadTests(userId);
        } else {
          setEnrolled(false);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Enrollment check failed:", err);
        setMessage("Failed to check enrollment");
        setMessageType("error");
        setLoading(false);
      });
  };

  /* ================= LOAD TESTS ================= */
  const loadTests = (userId: number) => {
    fetch(`${API_BASE}/get_tests.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        course_id: course.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.tests) {
          setTests(data.tests);
        } else {
          setMessage(data.message || "Failed to load tests");
          setMessageType("error");
        }
      })
      .catch((err) => {
        console.error("Failed to load tests:", err);
        setMessage("Failed to load tests");
        setMessageType("error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  /* ================= PAYMENT HANDLER ================= */
  const handlePayment = () => {
    if (!user) {
      setMessage("Please login to purchase this course");
      setMessageType("error");
      return;
    }

    setPaymentLoading(true);
    setMessage("");

    fetch(`${API_BASE}/create_order.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: course.price }),
    })
      .then((res) => res.json())
      .then((orderData) => {
        if (!orderData.success || !orderData.order_id) {
          throw new Error(orderData.message || "Order creation failed");
        }

        const options = {
          key: RAZORPAY_KEY,
          amount: orderData.amount,
          currency: "INR",
          name: "TO Maths",
          description: course.title,
          order_id: orderData.order_id,
          handler: (response: any) => {
            verifyPayment(response);
          },
          modal: {
            ondismiss: () => {
              setPaymentLoading(false);
              setMessage("Payment cancelled");
              setMessageType("error");
            },
          },
          theme: { color: "#2563eb" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      })
      .catch((err) => {
        console.error("Payment error:", err);
        setMessage(err.message || "Payment failed");
        setMessageType("error");
        setPaymentLoading(false);
      });
  };

  /* ================= VERIFY PAYMENT ================= */
  const verifyPayment = (response: any) => {
    fetch(`${API_BASE}/verify_payment.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        user_id: user?.id,
        course_id: course.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage("✅ Payment successful! Loading your tests...");
          setMessageType("success");
          setEnrolled(true);
          if (user) {
            loadTests(user.id);
          }
        } else {
          setMessage(data.message || "Payment verification failed");
          setMessageType("error");
        }
      })
      .catch((err) => {
        console.error("Verification error:", err);
        setMessage("Payment verification failed");
        setMessageType("error");
      })
      .finally(() => {
        setPaymentLoading(false);
      });
  };

  /* ================= LOADING STATE ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  /* ================= NOT LOGGED IN ================= */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <AlertCircle size={64} className="text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">
            Please login to access the test series
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  /* ================= NOT ENROLLED ================= */
  if (!enrolled) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Lock size={32} />
                <h1 className="text-3xl font-bold">{course.title}</h1>
              </div>
              <p className="text-blue-100">
                Get access to comprehensive test series and study materials
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-4 ${
                  messageType === "success"
                    ? "bg-green-50 text-green-700"
                    : messageType === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {messageType === "success" && <CheckCircle size={20} />}
                  {messageType === "error" && <XCircle size={20} />}
                  {messageType === "info" && <AlertCircle size={20} />}
                  <span>{message}</span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">What's Included?</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
                    <span>Topic-wise test series with detailed solutions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
                    <span>Downloadable PDF study materials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
                    <span>Practice questions with explanations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
                    <span>Lifetime access to all materials</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 mb-1">Course Price</p>
                    <p className="text-4xl font-bold text-blue-600">
                      ₹{course.price}
                    </p>
                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {paymentLoading ? "Processing..." : "Buy Now"}
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-500 text-center">
                🔒 Secure payment powered by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================= ENROLLED - SHOW TESTS ================= */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold">{course.title}</h1>
          </div>
          <p className="text-gray-600">
            Welcome back, <span className="font-semibold">{user.name}</span>! You have access to all tests.
          </p>
        </div>

        {/* Success Message */}
        {message && messageType === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={20} />
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Tests Grid */}
        {tests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <AlertCircle size={64} className="text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No Tests Available Yet
            </h2>
            <p className="text-gray-500">
              Tests will be added soon. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <h3 className="text-white font-semibold text-lg">
                    {test.test_name}
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-500 mb-4">
                    Added: {new Date(test.created_at).toLocaleDateString()}
                  </p>
                  {/* ===== CHANGED: anchor → button ===== */}
                  <button
                    onClick={() => setSelectedTest(test)}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors"
                  >
                    Start Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========== IFRAME MODAL ========== */}
        {selectedTest && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTest(null)} // click overlay to close
          >
            <div
              className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800 truncate">
                  {selectedTest.test_name}
                </h2>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body - iframe */}
              <div className="flex-1 w-full">
                <iframe
                  src={selectedTest.test_url}
                  title={selectedTest.test_name}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals" // adjust as needed
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}