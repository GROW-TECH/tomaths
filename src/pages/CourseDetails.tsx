import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Clock, IndianRupee, ShoppingCart } from "lucide-react";
import { useParams } from "react-router-dom";

/* ================= RAZORPAY TYPES ================= */
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
}



/* ================= CONFIG ================= */
const API_BASE = "https://xiadot.com/admin_maths/api";
const RAZORPAY_KEY = "rzp_live_Remrhpj0npbETD";

/* ================= COMPONENT ================= */
export default function CourseDetails() {
  const { slug } = useParams<{ slug: string }>();
const isExam = slug?.startsWith("exam-") || slug?.startsWith("exams/");

  const [rzpReady, setRzpReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | null
  >(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [course, setCourse] = useState<any>(null);
  const [fetchingCourse, setFetchingCourse] = useState(true);
  
  // 🔒 HARD LOCK (prevents double payment forever)
  const paymentLock = useRef(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  /* ================= FETCH COURSE DATA ================= */
  useEffect(() => {
  const fetchDetails = async () => {
    try {
      setFetchingCourse(true);
      setErrorMsg("");

      if (!slug) {
        setErrorMsg("Invalid page");
        setCourse(null);
        return;
      }

      // ✅ EXAM FLOW: /new-courses/exam-5
      if (isExam) {
       const examId = slug
       .replace("exam-", "")
       .replace("exams/", "");

        const res = await fetch(`${API_BASE}/exam.php?action=list`);
        const json = await res.json();

        if (!json?.success) throw new Error(json?.message || "Exam API failed");

        const found = (json.data || []).find((x: any) => String(x.id) === String(examId));
        if (!found) throw new Error("Exam not found");

        // ✅ map exam -> course-like object (so UI same)
        setCourse({
          id: found.id,
          course_name: found.exam_name,
          description: found.subject || "",
          price: found.price,
          duration: found.duration || "",
          image_url: found.image_url || null,
          _type: "exam",
        });

        return;
      }

      // ✅ COURSE FLOW: /new-courses/14-statics  (extract id = 14)
      const courseId = slug.split("-")[0];

      const res = await fetch(`${API_BASE}/get_courses.php`);
      const data = await res.json();

      if (!data?.success || !data.courses?.length) {
        throw new Error("Courses API failed");
      }

      const found = data.courses.find((c: any) => String(c.id) === String(courseId));
      if (!found) throw new Error("Course not found");

      setCourse(found);
    } catch (err: any) {
      setCourse(null);
      setErrorMsg(err.message || "Failed to load details");
    } finally {
      setFetchingCourse(false);
    }
  };

  fetchDetails();
}, [slug, isExam]);


  /* ================= LOAD RAZORPAY ================= */
  useEffect(() => {
    if (window.Razorpay) {
      setRzpReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRzpReady(true);
    script.onerror = () =>
      setErrorMsg("Failed to load payment gateway. Refresh page.");
    document.body.appendChild(script);
  }, []);

  /* ================= BUY NOW ================= */
  const handleBuyNow = async () => {
    // 🔐 Absolute protection
    if (paymentLock.current) return;

    if (!user?.id) {
      setErrorMsg("Please login to continue");
      return;
    }

    if (!rzpReady) {
      setErrorMsg("Payment gateway loading...");
      return;
    }

    paymentLock.current = true;
    setLoading(true);
    setErrorMsg("");

    try {
      /* ================= CREATE ORDER ================= */
      const orderRes = await fetch(`${API_BASE}/create_order.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: course.price,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData?.success || !orderData.order_id) {
        throw new Error(orderData?.message || "Order creation failed");
      }

      /* ================= RAZORPAY OPTIONS ================= */
      const options: RazorpayOptions = {
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: "INR",
        name: "TO Maths",
        description: course.course_name,
        order_id: orderData.order_id,

        handler: async (response) => {
          try {
            /* ================= VERIFY PAYMENT ================= */
            const verifyRes = await fetch(`${API_BASE}/verify-payment.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_id: user.id,
                course_id: course.id,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyData?.success) {
              throw new Error(
                verifyData.message || "Payment verification failed"
              );
            }

            // ✅ ALWAYS SUCCESS ON VERIFIED PAYMENT
            setPaymentStatus("success");
          } catch (err: any) {
            setErrorMsg(err.message || "Verification error");
            setPaymentStatus("failed");
          } finally {
            setLoading(false);
            paymentLock.current = false;
          }
        },

        modal: {
          ondismiss: () => {
            setErrorMsg("Payment cancelled by user");
            setPaymentStatus("failed");
            setLoading(false);
            paymentLock.current = false;
          },
        },

        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || "Unexpected error");
      setPaymentStatus("failed");
      setLoading(false);
      paymentLock.current = false;
    }
  };

  /* ================= SUCCESS PAGE ================= */
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full">
          <div className="mb-6">
            <CheckCircle size={80} className="text-green-600 mx-auto animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Your course has been activated successfully</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Course:</strong> {course?.course_name}
            </p>
            <p className="text-sm text-green-800 mt-1">
              <strong>Amount Paid:</strong> ₹{course?.price}
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/test-series"}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Go to My Courses
          </button>
        </div>
      </div>
    );
  }

  /* ================= FAILED PAGE ================= */
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full">
          <div className="mb-6">
            <XCircle size={80} className="text-red-600 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Payment Failed</h2>
          <p className="text-gray-600 mb-4">We couldn't process your payment</p>
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700 break-words">{errorMsg}</p>
            </div>
          )}
          <button
            onClick={() => {
              setPaymentStatus(null);
              setErrorMsg("");
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ================= LOADING STATE ================= */
  if (fetchingCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading course details...</p>
        </div>
      </div>
    );
  }

  /* ================= ERROR STATE ================= */
  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <AlertCircle size={64} className="text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-6">{errorMsg || "Unable to load course information"}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  /* ================= MAIN COURSE DETAILS PAGE ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center mb-2"> Course Details</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Course Image */}
         

          {/* Course Details */}
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-800 mb-3">
                {course.course_name}
              </h1>
              {course.description && (
                <p className="text-gray-600 text-lg leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>

            {/* Course Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {/* Price Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center mb-2">
                  <IndianRupee className="text-green-600 mr-2" size={24} />
                  <h3 className="text-sm font-semibold text-gray-600 uppercase">Price</h3>
                </div>
                <p className="text-3xl font-bold text-green-700">₹{course.price}</p>
              </div>

              {/* Duration Card */}
              {course.duration && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-center mb-2">
                    <Clock className="text-blue-600 mr-2" size={24} />
                    <h3 className="text-sm font-semibold text-gray-600 uppercase">Duration</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{course.duration}</p>
                </div>
              )}

              {/* Course Type Card */}
             
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                <AlertCircle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-700 text-sm">{errorMsg}</p>
              </div>
            )}

            {/* What You'll Get */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4">What You'll Get:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">Complete topic-wise test series</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">Comprehensive PDF study materials</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">Instant access after payment</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">Lifetime access to course materials</span>
                </li>
              </ul>
            </div>

            {/* Purchase Section */}
            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-4xl font-bold text-gray-800">₹{course.price}</p>
                </div>
                <button
                  onClick={handleBuyNow}
                  disabled={loading}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      Buy Now
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Security Badge */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Secure payment powered by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}