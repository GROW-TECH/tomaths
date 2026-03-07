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
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://tomaths.com/api";
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SKfxWEp5I2prcN";
const DEFAULT_IMG = "/logo.png";

/* ================= TYPES ================= */
interface Course {
  id: number;
  category_id?: number;
  name?: string;
  course_name?: string;
  description?: string;
  actual_price?: number;
  offer_price?: number;
  price?: number | string;
  discount?: number;
  duration?: string;
  image?: string;
  image_url?: string | null;
  paid?: boolean;
  remaining_seconds?: number | null;
  highlights?: string[];
  youtube_url?: string | null;
}

interface ApiResponse {
  success: boolean;
  courses: Course[];
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function getYouTubeEmbedUrl(input: string): string | null {
  if (!input) return null;
  const iframeSrcMatch = input.match(/src="([^"]+)"/);
  const url = iframeSrcMatch ? iframeSrcMatch[1] : input;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
    /youtube\.com\/v\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    }
  }
  console.warn("Could not extract YouTube video ID from:", input);
  return null;
}

export default function CourseDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [accessStatus, setAccessStatus] = useState<
    "loading" | "active" | "expired" | "not_purchased"
  >("loading");
  const [loadingPay, setLoadingPay] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{
    type: "success" | "failed" | null;
    message?: string;
  }>({ type: null });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const paymentLock = useRef(false);




  useEffect(() => {
    const loadCourse = async () => {
      try {
        if (!slug) throw new Error("Invalid URL");
        const idMatch = slug.match(/^(\d+)/);
        if (!idMatch) throw new Error("Invalid course URL");
        const id = idMatch[1];

        const attempts = [
          () =>
            fetch(`${API_BASE}/get_subCategory.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "list", subcategory_id: id }),
            }),
          () =>
            fetch(
              `${API_BASE}/get_subCategory.php?action=list&subcategory_id=${id}`,
            ),
          () =>
            fetch(
              `${API_BASE}/get_courses.php?user_id=${localStorage.getItem("user_id") || ""}`,
            ),
        ];

        let found = null;
        for (const attempt of attempts) {
          try {
            const res = await attempt();
            const json = await res.json();
            if (json.success && json.courses) {
              found = json.courses.find((c: Course) => String(c.id) === id);
              if (found) break;
            }
            if (json.success && json.data) {
              const courses = json.data.courses || json.data;
              found = courses.find((c: Course) => String(c.id) === id);
              if (found) break;
            }
          } catch (e) {
            console.log("Attempt failed:", e);
          }
        }

        if (!found) throw new Error("Course not found");
        setCourse(found);
        // console.log("Loaded course:", found);
        setTimeLeft(found.remaining_seconds ?? null);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        setErrorMsg(error.message);
      } finally {
        setLoadingPage(false);
      }
    };
    loadCourse();
  }, [slug]);

  useEffect(() => {
    console.log("Course details : ", course);

    if (!course) return;
    const checkAccess = async () => {
      try {
const storedUser = localStorage.getItem("user");
const user = storedUser ? JSON.parse(storedUser) : null;
const user_id = user?.id;

// console.log("Checking access for user_id:", user_id, "course_id:", course.id);
        if (!user_id) {
          setAccessStatus("not_purchased");
          return;
        }
        const res = await fetch(
          `${API_BASE}/validate_course.php?user_id=${encodeURIComponent(user_id)}&course_id=${course.id}`,
        );
        const data = await res.json();
        console.log("Access check response:", data);
        setAccessStatus(data.status || "not_purchased");
      } catch {
        setAccessStatus("not_purchased");
      }
    };
    checkAccess();
  }, [course] );

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || !course?.paid) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, course?.paid]);

  useEffect(() => {
    if (window.Razorpay) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const refetchCourse = async () => {
    if (!course) return;
    try {
      // const user_id = localStorage.getItem("user") || "";
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const user_id = user?.id;
      const url = `${API_BASE}/get_courses.php?user_id=${encodeURIComponent(user_id)}`;
      const res = await fetch(url);
      const json: ApiResponse = await res.json();
      if (json.success) {
        const updated = json.courses.find((c: Course) => c.id === course.id);
        if (updated) {
          setCourse(updated);
          setTimeLeft(updated.remaining_seconds ?? null);
        }
      }
    } catch (err) {
      console.error("Failed to refresh course data", err);
    }
  };

  const handleBuyNow = async () => {
    if (!course) return;
    if (course.paid) {
      alert("You already own this course");
      return;
    }
    const storedUser = localStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    if (!currentUser?.id) {
      console.log("Trigger login popup");

      window.dispatchEvent(new Event("open-login-popup"));
      return;
    }
    if (paymentLock.current) return;

    paymentLock.current = true;
    setLoadingPay(true);
    setPaymentStatus({ type: null });

    try {
      const price = course.offer_price ?? course.price ?? 0;
      const amount = Number(price) * 100;
      if (isNaN(amount) || amount <= 0) {
        alert("Invalid course price. Please contact support.");
        setLoadingPay(false);
        paymentLock.current = false;
        return;
      }

      const orderRes = await fetch(`${API_BASE}/create_order.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!orderRes.ok) throw new Error("Failed to create order");
      const order = await orderRes.json();

      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "TO Maths",
        description: course.course_name,
        order_id: order.order_id,
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/verify-payment.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                user_id: currentUser.id,
                course_id: course.id,
              }),
            });
            const verify = await verifyRes.json();
            console.log("Verification response:", verify); // <-- Log full response

            if (verify.success) {
              setPaymentStatus({ type: "success" });
              await refetchCourse();
            } else {
              // Show the actual error message from the server
              setPaymentStatus({
                type: "failed",
                message: verify.message || "Payment verification failed",
              });
              // Log SQL error if present (for debugging)
              if (verify.sql_error) {
                console.error("SQL Error from server:", verify.sql_error);
              }
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
            setLoadingPay(false);
            paymentLock.current = false;
          },
        },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setPaymentStatus({
        type: "failed",
        message: error.message || "Payment initiation failed",
      });
      setLoadingPay(false);
      paymentLock.current = false;
    }
  };

  useEffect(() => {
    if (course?.youtube_url) {
      const url = getYouTubeEmbedUrl(course.youtube_url);
      setEmbedUrl(url);
    } else {
      setEmbedUrl(null);
    }
  }, [course]);

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

  const actualPrice = course.actual_price ?? 0;
  const offerPrice = course.offer_price ?? course.price ?? 0;
  const numericOffer =
    typeof offerPrice === "string" ? parseFloat(offerPrice) : offerPrice;
  const showDiscount = actualPrice > numericOffer;

  const renderPaymentStatus = () => {
    if (!paymentStatus.type) return null;
    const isSuccess = paymentStatus.type === "success";
    return (
      <div
        className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${isSuccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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

  return (
    <div className="min-h-screen bg-[#eef5f4]">
      {renderPaymentStatus()}

      <div className="bg-white shadow-sm py-4 px-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>
        <h2 className="font-semibold">Back</h2>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-md p-6 grid md:grid-cols-2 gap-8">
          <img
            src={course.image_url || course.image || DEFAULT_IMG}
            alt={course.course_name || course.name || "Course"}
            className="rounded-2xl w-full object-cover"
          />

          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-3">
                {course.course_name || course.name || "Course"}
              </h1>

              {!course.description &&
                !course.price &&
                !course.duration &&
                !course.highlights && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <p className="text-yellow-800">
                      Course details are being updated. Please check back later.
                    </p>
                  </div>
                )}

              {course.description && (
                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{course.description}</p>
                </div>
              )}

              {accessStatus === "loading" && (
                <div className="bg-gray-100 p-4 rounded-xl mb-6 flex items-center gap-2">
                  <Loader size={18} className="animate-spin" /> Checking
                  access...
                </div>
              )}
           
              {!course.paid && (
                <div className="bg-green-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold mb-3">Course Price</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-green-700 text-3xl font-bold">
                      <IndianRupee size={18} />
                      {offerPrice}
                    </div>
                    {showDiscount && (
                      <div className="flex items-center text-gray-400 line-through text-lg">
                        <IndianRupee size={16} />
                        {actualPrice}
                      </div>
                    )}
                  </div>
                  {course.discount && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded mt-2 inline-block">
                      {course.discount}% OFF
                    </span>
                  )}
                </div>
              )}

              {!course.paid && course.duration && (
                <div className="bg-gray-100 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-500 mb-1">Course Duration</p>
                  <div className="flex items-center gap-2 font-semibold">
                    <Clock size={18} />
                    {course.duration}
                  </div>
                </div>
              )}

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

              {course.youtube_url && embedUrl && (
                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                  <h3 className="font-semibold mb-3">Course Preview</h3>
                  <div className="aspect-video w-full">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full rounded-xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Course Preview"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Video is muted – click the speaker to unmute
                  </p>
                </div>
              )}
            </div>

              {/* NOT PURCHASED */}
              {accessStatus === "not_purchased" && (
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

              {/* ACTIVE COURSE */}
              {accessStatus === "active" && (
                <button
                  onClick={() => navigate(`/test-series?course=${course.id}`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Go To Course
                </button>
              )}

              {/* EXPIRED COURSE */}
              {accessStatus === "expired" && (
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                >
                  <Clock size={20} />
                  Renew Course
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
    </div>
  );
}
