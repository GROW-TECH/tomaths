import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Clock,
  IndianRupee,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

/* CONFIG */
const API_BASE = "https://xiadot.com/admin_maths/api";
const RAZORPAY_KEY = "rzp_live_Remrhpj0npbETD";
const DEFAULT_IMG = "/default-unit.png";
const UPLOAD_BASE = "https://xiadot.com/admin_maths/uploads/";

interface Course {
  id: number;
  course_name: string;
  description: string;
  price: string;
  duration: string;
  image?: string;
  image_url?: string | null;
}

interface ApiResponse {
  courses?: Course[];
}

const getImage = (course: Course) => {
  const raw = course.image_url || course.image || "";
  if (!raw) return DEFAULT_IMG;

  const filename = raw.split("/").pop();
  return filename ? UPLOAD_BASE + filename : DEFAULT_IMG;
};

export default function CourseDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPay, setLoadingPay] = useState(false);

  const paymentLock = useRef(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  /* FETCH */
  useEffect(() => {
    const loadCourse = async () => {
      if (!slug) return;

      const id = slug.split("-")[0];

      const res = await fetch(`${API_BASE}/get_courses.php`);
      const json: ApiResponse = await res.json();

      const found = json?.courses?.find(
        (c) => String(c.id) === id
      );

      if (found) setCourse(found);
      setLoading(false);
    };

    loadCourse();
  }, [slug]);

  /* BUY */
  const handleBuyNow = async () => {
    if (!course || !user?.id) return;
    if (paymentLock.current) return;

    paymentLock.current = true;
    setLoadingPay(true);

    try {
      const orderRes = await fetch(`${API_BASE}/create_order.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(course.price) * 100,
        }),
      });

      const orderData = await orderRes.json();

      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: "INR",
        name: "TO Maths",
        description: course.course_name,
        order_id: orderData.order_id,

        handler: async (response: any) => {
          await fetch(`${API_BASE}/verify-payment.php`, {
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

          alert("Payment Success");
          setLoadingPay(false);
          paymentLock.current = false;
        },
      };

      new (window as any).Razorpay(options).open();
    } catch {
      alert("Payment Failed");
      setLoadingPay(false);
      paymentLock.current = false;
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;

  if (!course)
    return (
      <div className="p-10 text-red-600 flex gap-2">
        <AlertCircle /> Course not found
      </div>
    );

  return (
    <div className="w-full min-h-screen bg-[#eef3f8] p-6">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-4"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="w-full bg-white rounded-2xl shadow-lg overflow-hidden grid md:grid-cols-2">

        {/* LEFT IMAGE */}
        <div className="w-full h-[450px] md:h-[600px]">
          <img
            src={getImage(course)}
            alt={course.course_name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex flex-col h-[600px] p-8">

          {/* TOP */}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {course.course_name}
            </h1>

            <p className="text-gray-500 mb-4">
              {course.description}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500">PRICE</p>
                <p className="text-2xl font-bold text-green-700 flex items-center">
                  <IndianRupee size={18} /> {course.price}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500">DURATION</p>
                <p className="text-lg font-semibold flex items-center gap-1">
                  <Clock size={18} /> {course.duration}
                </p>
              </div>
            </div>
          </div>

          {/* WHAT YOU'LL GET */}
          <div className="mt-6 bg-gray-100 rounded-xl p-5">
            <h3 className="font-semibold mb-3">
              What You'll Get:
            </h3>

            <ul className="space-y-2 text-gray-700">
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

          {/* BUY BUTTON */}
          <button
            onClick={handleBuyNow}
            disabled={loadingPay}
            className="mt-auto w-full bg-blue-600 text-white py-4 rounded-xl font-semibold"
          >
            {loadingPay ? "Processing..." : "Buy Now"}
          </button>

        </div>
      </div>
    </div>
  );
}
