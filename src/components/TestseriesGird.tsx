import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, Lock, BookOpen, Calendar, ExternalLink, Sparkles } from "lucide-react";

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
  course_id: number;
  course_name?: string;
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
  const [paid, setPaid] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  const course: Course = {
    id: 8,
    title: "Geometry - Aptitude Topic wise Test-Series + PDF",
    price: 1,
  };

  /* ================= LOAD USER & CHECK PAYMENT ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        checkPayment(userData.id);
      } catch (e) {
        console.error("Failed to parse user", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  /* ================= CHECK PAYMENT & GET TESTS ================= */
  const checkPayment = (userId: number) => {
    setLoading(true);
    
    // First check if user has paid
    fetch(`${API_BASE}/check_payment.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        course_id: course.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPaid(data.paid);
          
          // If paid, fetch tests from tests.php
          if (data.paid) {
            fetchTests();
          } else {
            setLoading(false);
          }
        } else {
          setMessage(data.message || "Failed to check payment");
          setMessageType("error");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Payment check failed:", err);
        setMessage("Failed to check payment status");
        setMessageType("error");
        setLoading(false);
      });
  };

  /* ================= FETCH TESTS FROM tests.php ================= */
  const fetchTests = () => {
    fetch(`${API_BASE}/tests.php?course_id=${course.id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Tests fetched:", data);
        if (data.success && data.data) {
          setTests(data.data);
        } else {
          setMessage("No tests found for this course");
          setMessageType("info");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch tests:", err);
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
          
          if (user) {
            setTimeout(() => {
              checkPayment(user.id);
            }, 1000);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" size={32} />
          </div>
          <p className="mt-6 text-gray-700 font-semibold text-lg">Loading your content...</p>
        </div>
      </div>
    );
  }

  /* ================= NOT LOGGED IN ================= */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-2xl text-center max-w-md w-full">
          <div className="bg-yellow-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={48} className="text-yellow-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-8 text-base sm:text-lg">
            Please login to access the test series and course materials
          </p>
          <button
            onClick={() => window.location.href = "/"}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl w-full"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  /* ================= NOT PAID - SHOW BUY PAGE ================= */
  if (!paid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 sm:p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                    <Lock size={32} />
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">{course.title}</h1>
                </div>
                <p className="text-blue-100 text-base sm:text-lg max-w-2xl">
                  Unlock comprehensive test series, detailed solutions, and downloadable study materials
                </p>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-4 sm:p-5 border-l-4 ${
                  messageType === "success"
                    ? "bg-green-50 border-green-500 text-green-700"
                    : messageType === "error"
                    ? "bg-red-50 border-red-500 text-red-700"
                    : "bg-blue-50 border-blue-500 text-blue-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  {messageType === "success" && <CheckCircle size={24} className="flex-shrink-0" />}
                  {messageType === "error" && <XCircle size={24} className="flex-shrink-0" />}
                  {messageType === "info" && <AlertCircle size={24} className="flex-shrink-0" />}
                  <span className="font-medium">{message}</span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6 sm:p-10">
              <div className="mb-10">
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">What You'll Get</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="bg-green-500 p-2 rounded-lg flex-shrink-0">
                      <CheckCircle className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">Topic-wise Tests</h3>
                      <p className="text-gray-600 text-sm">Comprehensive tests with detailed solutions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="bg-blue-500 p-2 rounded-lg flex-shrink-0">
                      <CheckCircle className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">Downloadable PDFs</h3>
                      <p className="text-gray-600 text-sm">Study materials for offline access</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <div className="bg-purple-500 p-2 rounded-lg flex-shrink-0">
                      <CheckCircle className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">Practice Questions</h3>
                      <p className="text-gray-600 text-sm">Step-by-step explanations included</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
                    <div className="bg-orange-500 p-2 rounded-lg flex-shrink-0">
                      <CheckCircle className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">Lifetime Access</h3>
                      <p className="text-gray-600 text-sm">Learn at your own pace, anytime</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 sm:p-8 mb-6 shadow-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-blue-100 mb-2 text-lg font-medium">Special Offer Price</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-5xl sm:text-6xl font-bold text-white">
                        ₹{course.price}
                      </p>
                      <span className="text-blue-200 text-xl">only</span>
                    </div>
                    <p className="text-blue-100 mt-2">One-time payment • Lifetime access</p>
                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="bg-white text-blue-600 hover:bg-gray-50 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-2xl w-full sm:w-auto"
                  >
                    {paymentLoading ? "Processing..." : "Buy Now"}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                  <Lock size={16} />
                  100% Secure payment powered by Razorpay
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================= PAID - SHOW TESTS ================= */
  
  // If a test is selected, show the iframe
  if (selectedTest) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Header Bar */}
        <div className="bg-white shadow-lg px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedTest(null)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← Back to Tests
            </button>
            <div className="hidden sm:block">
              <h2 className="font-bold text-gray-800 text-lg">{selectedTest.test_name}</h2>
              <p className="text-sm text-gray-500">{course.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">Logged in as: <span className="font-semibold text-blue-600">{user?.name}</span></span>
          </div>
        </div>

        {/* Iframe Container */}
        <div className="flex-1 relative">
          <iframe
            src={selectedTest.test_url}
            title={selectedTest.test_name}
            className="w-full h-full absolute inset-0"
            frameBorder="0"
            allowFullScreen
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg">
                <BookOpen size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{course.title}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
                    <CheckCircle size={18} />
                    <span className="font-semibold text-sm">Full Access Granted</span>
                  </div>
                  <p className="text-gray-600">
                    Welcome back, <span className="font-semibold text-blue-600">{user.name}</span>!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {message && messageType === "success" && (
          <div className="bg-white rounded-xl shadow-lg border-l-4 border-green-500 p-5 mb-8">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle size={24} />
              <span className="font-semibold text-lg">{message}</span>
            </div>
          </div>
        )}

        {/* Tests Grid */}
        {tests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 sm:p-16 text-center">
            <div className="bg-gray-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={64} className="text-gray-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-3">
              No Tests Available Yet
            </h2>
            <p className="text-gray-500 text-lg">
              New tests will be added soon. Please check back later.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Available Tests <span className="text-blue-600">({tests.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test, index) => (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2 duration-300"
                >
                  <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="text-white text-sm font-semibold">Test {index + 1}</span>
                        </div>
                        <Sparkles className="text-white opacity-80" size={20} />
                      </div>
                      <h3 className="text-white font-bold text-xl mb-2 leading-tight">
                        {test.test_name}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-gray-500 mb-5 text-sm">
                      <Calendar size={16} />
                      <span>
                        {new Date(test.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedTest(test);
                      }}
                      href="#"
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold text-lg transition-all shadow-md hover:shadow-lg cursor-pointer"
                    >
                      Start Test
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}