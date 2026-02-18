import { useEffect, useState, useRef } from "react";
import {
  Clock,
  IndianRupee,
  CheckCircle,
  ArrowLeft,
  ShoppingCart,
  XCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

/* ================= CONFIG ================= */

const API_BASE = "https://xiadot.com/admin_maths/api";
const RAZORPAY_KEY = "rzp_live_Remrhpj0npbETD";
const DEFAULT_IMG = "/default-unit.png";

/* ================= TYPES ================= */

interface Course {
  id: number;
  course_name: string;
  description: string;
  actual_price: number;
  offer_price: number;
  discount: number;
  duration: string;
  image_url?: string | null;
  paid?: boolean;
  remaining_seconds?: number | null;
  highlights?: string[];
}

interface ApiResponse {
  success: boolean;
  courses: Course[];
}

// Placeholder for course content – replace with your actual component
const CourseContent = ({ courseId }: { courseId: number }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <h2 className="text-2xl font-bold mb-4">Course Content</h2>
    <p>Access granted! Course ID: {courseId}</p>
    {/* Render lessons, videos, etc. */}
  </div>
);

/* ================= COMPONENT ================= */

export default function CourseDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Core data
  const [course, setCourse] = useState<Course | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Access status (matches backend responses)
  const [accessStatus, setAccessStatus] = useState<
    "loading" | "active" | "expired" | "not_purchased"
  >("loading");

  // Payment states
  const [loadingPay, setLoadingPay] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{
    type: "success" | "failed" | null;
    message?: string;
  }>({ type: null });

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Prevent duplicate payment intents
  const paymentLock = useRef(false);

  // Popup reminder every 10 minutes
  const [showReminderPopup, setShowReminderPopup] = useState(false);

  // Safely parse user from localStorage
  const getUser = () => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };
  const user = getUser();

  /* ========== 1. FETCH COURSE ========== */

  useEffect(() => {
    const loadCourse = async () => {
      try {
        if (!slug) throw new Error("Invalid URL");

        // Extract numeric ID from slug (e.g., "42-course-name" → "42")
        const idMatch = slug.match(/^(\d+)/);
        if (!idMatch) throw new Error("Invalid course URL");
        const id = idMatch[1];

        // Include user_id so backend can return personalized fields (paid, remaining_seconds)
        const user_id = localStorage.getItem("user_id") || "";
        const url = `${API_BASE}/get_courses.php?user_id=${encodeURIComponent(user_id)}`;
        const res = await fetch(url);
        const json: ApiResponse = await res.json();

        if (!json.success) throw new Error("API error");

        const found = json.courses.find((c) => String(c.id) === id);
        if (!found) throw new Error("Course not found");

        setCourse(found);
        setTimeLeft(found.remaining_seconds ?? null);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingPage(false);
      }
    };

    loadCourse();
  }, [slug]);

  /* ========== 2. CHECK ACCESS STATUS (matches validate_course.php) ========== */

  useEffect(() => {
    if (!course) return;

    const checkAccess = async () => {
      try {
        const user_id = localStorage.getItem("user_id");
        if (!user_id) {
          setAccessStatus("not_purchased");
          return;
        }

        // GET request works because validate_course.php accepts both POST and GET
        const res = await fetch(
          `${API_BASE}/validate_course.php?user_id=${encodeURIComponent(user_id)}&course_id=${course.id}`,
        );
        const data = await res.json();

        // Backend returns { status: "active" | "expired" | "not_purchased" }
        setAccessStatus(data.status || "not_purchased");
      } catch {
        // On network error, assume not purchased
        setAccessStatus("not_purchased");
      }
    };

    checkAccess();
  }, [course]);

  /* ========== 3. COUNTDOWN TIMER ========== */

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || !course?.paid) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, course?.paid]);

  /* ========== 4. LOAD RAZORPAY SCRIPT ========== */

  useEffect(() => {
    if ((window as any).Razorpay) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  /* ========== 5. REFETCH COURSE AFTER PURCHASE ========== */

  const refetchCourse = async () => {
    if (!course) return;
    try {
      const user_id = localStorage.getItem("user_id") || "";
      const url = `${API_BASE}/get_courses.php?user_id=${encodeURIComponent(user_id)}`;
      const res = await fetch(url);
      const json: ApiResponse = await res.json();
      if (json.success) {
        const updated = json.courses.find((c) => c.id === course.id);
        if (updated) {
          setCourse(updated);
          setTimeLeft(updated.remaining_seconds ?? null);
        }
      }
    } catch (err) {
      console.error("Failed to refresh course data", err);
    }
  };

  /* ========== 6. BUY NOW HANDLER ========== */

  const handleBuyNow = async () => {
    if (!course) return;
    if (course.paid) {
      alert("You already own this course");
      return;
    }
    if (!user?.id) {
      alert("Please login first");
      return;
    }
    if (paymentLock.current) return;

    paymentLock.current = true;
    setLoadingPay(true);
    setPaymentStatus({ type: null });

    try {
      const amount = course.offer_price * 100; // Razorpay expects paise

      // 1. Create order
      const orderRes = await fetch(`${API_BASE}/create_order.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!orderRes.ok) throw new Error("Failed to create order");
      const order = await orderRes.json();

      // 2. Configure Razorpay
      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "TO Maths",
        description: course.course_name,
        order_id: order.order_id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/verify-payment.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                user_id: user.id,
                course_id: course.id,
              }),
            });
            const verify = await verifyRes.json();

            if (verify.success) {
              setPaymentStatus({ type: "success" });
              await refetchCourse(); // refresh course data
            } else {
              setPaymentStatus({
                type: "failed",
                message: "Payment verification failed",
              });
            }
          } catch (err) {
            setPaymentStatus({ type: "failed", message: "Verification error" });
          } finally {
            setLoadingPay(false);
            paymentLock.current = false;
          }
        },
        modal: {
          ondismiss: () => {
            // User closed the Razorpay modal without completing
            setLoadingPay(false);
            paymentLock.current = false;
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setPaymentStatus({
        type: "failed",
        message: err.message || "Payment initiation failed",
      });
      setLoadingPay(false);
      paymentLock.current = false;
    }
  };

  /* ========== 7. HELPER: FORMAT TIME (SAFE) ========== */

  const formatTime = (seconds: number): string => {
    // Ensure we never show negative time
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  /* ========== 8. EVERY 10 MINUTES POPUP ========== */

  useEffect(() => {
    // Optionally restrict to active courses only:
    // if (accessStatus !== 'active') return;

    const interval = setInterval(
      () => {
        setShowReminderPopup(true);
      },
      10 * 60 * 1000,
    ); // 10 minutes in milliseconds

    return () => clearInterval(interval);
  }, [accessStatus]); // Re-run if accessStatus changes (if using condition)

  /* ========== 9. UI STATES ========== */

  if (loadingPage) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader className="animate-spin mr-2" /> Loading course...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex justify-center items-center text-red-600 gap-2">
        <AlertCircle />
        {errorMsg || "Course not found"}
      </div>
    );
  }

  // Payment status banner (toast style)
  const renderPaymentStatus = () => {
    if (!paymentStatus.type) return null;
    const isSuccess = paymentStatus.type === "success";
    return (
      <div
        className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${
          isSuccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isSuccess ? <CheckCircle size={20} /> : <XCircle size={20} />}
        <span>
          {isSuccess
            ? "Payment successful! Your course is now accessible."
            : paymentStatus.message || "Payment failed. Please try again."}
        </span>
        <button
          onClick={() => setPaymentStatus({ type: null })}
          className="ml-4 text-gray-600 hover:text-gray-900"
        >
          ×
        </button>
      </div>
    );
  };

  /* ========== 10. MAIN UI ========== */

  return (
    <div className="min-h-screen bg-[#eef5f4]">
      {renderPaymentStatus()}

      {/* HEADER */}
      <div className="bg-white shadow-sm py-4 px-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>
        <h2 className="font-semibold">Back</h2>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-md p-6 grid md:grid-cols-2 gap-8">
          {/* IMAGE */}
          <img
            src={course.image_url || DEFAULT_IMG}
            alt={course.course_name}
            className="rounded-2xl w-full object-cover"
          />

          {/* RIGHT CONTENT */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-3">{course.course_name}</h1>

              {/* DESCRIPTION */}
              {course.description && (
                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{course.description}</p>
                </div>
              )}

              {/* COUNTDOWN TIMER – only for purchased courses with remaining time */}
              {course.paid && timeLeft !== null && timeLeft > 0 && (
                <div className="bg-yellow-100 p-4 rounded-xl mb-6 border border-yellow-300">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock size={20} /> Time Remaining
                  </h3>
                  <div className="text-2xl font-mono font-bold text-yellow-800">
                    {formatTime(timeLeft)}
                  </div>
                </div>
              )}

              {/* ACCESS STATUS HANDLING – uses data from validate_course.php */}
              {accessStatus === "loading" && (
                <div className="bg-gray-100 p-4 rounded-xl mb-6 flex items-center gap-2">
                  <Loader size={18} className="animate-spin" /> Checking
                  access...
                </div>
              )}

              {accessStatus === "expired" && (
                <div className="bg-red-100 p-6 text-center rounded-xl mb-6 border border-red-300">
                  <h2 className="text-red-600 font-bold text-xl">
                    Course Access Expired
                  </h2>
                  <p className="mt-2">
                    You can purchase again to regain access.
                  </p>
                </div>
              )}

              {accessStatus === "active" && (
                <CourseContent courseId={course.id} />
              )}

              {/* PRICE – only show if not purchased */}
              {!course.paid && (
                <div className="bg-green-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-green-700 text-3xl font-bold">
                      <IndianRupee size={18} />
                      {course.offer_price}
                    </div>

                    {course.actual_price > course.offer_price && (
                      <div className="flex items-center text-gray-400 line-through text-lg">
                        <IndianRupee size={16} />
                        {course.actual_price}
                      </div>
                    )}
                  </div>

                  {course.discount > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded mt-2 inline-block">
                      {course.discount}% OFF
                    </span>
                  )}
                </div>
              )}

              {/* DURATION (static) – only for unpaid courses (dynamic based on purchase) */}
              {!course.paid && course.duration && (
                <div className="bg-gray-100 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-500 mb-1">Course Duration</p>
                  <div className="flex items-center gap-2 font-semibold">
                    <Clock size={18} />
                    {course.duration}
                  </div>
                </div>
              )}
            </div>

            {/* HIGHLIGHTS */}
            {course.highlights && course.highlights.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-xl mb-6">
                <h3 className="font-semibold mb-3">Course Highlights</h3>
                <ul className="space-y-2">
                  {course.highlights.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-gray-700"
                    >
                      <CheckCircle size={18} className="text-blue-600 mt-1" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* BUY BUTTON – only if not paid */}
            {!course.paid && (
              <button
                onClick={handleBuyNow}
                disabled={loadingPay}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingPay ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    Buy Now
                  </>
                )}
              </button>
            )}

            {course.paid && (
              <div className="text-green-600 font-semibold mt-6 flex items-center gap-2">
                <CheckCircle size={20} />
                Already Purchased
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EVERY 10 MINUTES REMINDER POPUP */}
      {showReminderPopup && (
        <div className="fixed bottom-4 right-4 z-50 bg-white rounded-2xl shadow-2xl p-6 max-w-sm border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Clock size={20} className="text-blue-500" />
              Reminder
            </h3>
            <button
              onClick={() => setShowReminderPopup(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle size={20} />
            </button>
          </div>
          <p className="mt-3 text-gray-700">
            You've been on this page for 15 minutes. Keep learning! 📚
          </p>
          <button
            onClick={() => setShowReminderPopup(false)}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded-xl font-medium hover:bg-blue-600 transition"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
