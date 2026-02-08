import { useEffect, useRef, useState } from "react";
import {
  Clock,
  IndianRupee,
  CheckCircle,
  ArrowLeft,
  ShoppingCart,
  XCircle,
  AlertCircle,
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
}

interface ApiResponse {
  success: boolean;
  courses: Course[];
}

/* ================= COMPONENT ================= */

export default function CourseDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingPay, setLoadingPay] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | null
  >(null);

  const paymentLock = useRef(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  /* ================= FETCH COURSE ================= */

  useEffect(() => {
    const loadCourse = async () => {
      try {
        if (!slug) throw new Error("Invalid URL");

        const id = slug.split("-")[0];

        const res = await fetch(`${API_BASE}/get_courses.php`);
        const json: ApiResponse = await res.json();

        if (!json.success) throw new Error("API error");

        const found = json.courses.find((c) => String(c.id) === String(id));

        console.log("Found course:", found);

        if (!found) throw new Error("Course not found");
        setCourse(found);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingPage(false);
      }
    };

    loadCourse();
  }, [slug]);

  /* ================= LOAD RAZORPAY ================= */

  useEffect(() => {
    if ((window as any).Razorpay) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
  }, []);

  /* ================= BUY NOW ================= */

  const handleBuyNow = async () => {
    if (!course) return;

    if (!user?.id) {
      alert("Please login first");
      return;
    }

    if (paymentLock.current) return;

    paymentLock.current = true;
    setLoadingPay(true);

    try {
      console.log("Offer price:", course.offer_price, "price", course);
      const amount = course.offer_price * 100;

      const orderRes = await fetch(`${API_BASE}/create_order.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const order = await orderRes.json();

      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "TO Maths",
        description: course.course_name,
        order_id: order.order_id,

        handler: async (response: any) => {
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
            setPaymentStatus("success");
          } else {
            setPaymentStatus("failed");
          }

          setLoadingPay(false);
          paymentLock.current = false;
        },
      };

      new (window as any).Razorpay(options).open();
    } catch (err) {
      setPaymentStatus("failed");
      setLoadingPay(false);
      paymentLock.current = false;
    }
  };

  /* ================= UI STATES ================= */

  if (loadingPage)
    return (
      <div className="min-h-screen flex justify-center items-center">
        Loading course...
      </div>
    );

  if (!course)
    return (
      <div className="min-h-screen flex justify-center items-center text-red-600 gap-2">
        <AlertCircle />
        {errorMsg}
      </div>
    );

  if (paymentStatus === "success")
    return (
      <div className="min-h-screen flex justify-center items-center">
        <CheckCircle size={90} className="text-green-600" />
      </div>
    );

  if (paymentStatus === "failed")
    return (
      <div className="min-h-screen flex justify-center items-center">
        <XCircle size={90} className="text-red-600" />
      </div>
    );

  /* ================= MAIN UI ================= */

  return (
    <div className="min-h-screen bg-[#eef5f4]">
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
            className="rounded-2xl w-full object-cover"
            onError={(e) => (e.currentTarget.src = DEFAULT_IMG)}
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

              {/* PRICE */}
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

              {/* DURATION */}
              {course.duration && (
                <div className="bg-gray-100 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-500 mb-1">Course Duration</p>

                  <div className="flex items-center gap-2 font-semibold">
                    <Clock size={18} />
                    {course.duration}
                  </div>
                </div>
              )}

              {/* WHAT YOU'LL GET */}
              <div className="bg-gray-50 rounded-xl p-5 mb-6">
                <h3 className="font-semibold text-lg mb-3">What You'll Get:</h3>

                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={18} />
                    Complete topic-wise test series
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={18} />
                    Comprehensive PDF study materials
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={18} />
                    Instant access after payment
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={18} />
                    Lifetime access to course materials
                  </li>
                </ul>
              </div>
            </div>

            {/* BUY BUTTON */}
            {!course.paid && (
              <button
                onClick={handleBuyNow}
                disabled={loadingPay}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                {loadingPay ? (
                  "Processing..."
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    Buy Now
                  </>
                )}
              </button>
            )}

            {course.paid && (
              <div className="text-green-600 font-semibold mt-6">
                ✔ Already Purchased
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
