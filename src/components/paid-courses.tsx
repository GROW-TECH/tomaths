import { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Lock, 
  Clock, 
  BookOpen, 
  Sparkles, 
  AlertCircle,
  TrendingUp,
  Award,
  Star
} from "lucide-react";

/* ================= TYPES ================= */
interface User {
  id: number;
  name: string;
  email: string;
}

interface Course {
  id: number;
  course_name: string;
  description: string;
  price: string;
  duration: string;
  image: string;
  created_at: string;
  paid: boolean;
}

/* ================= CONFIG ================= */
const API_BASE = "https://xiadot.com/admin_maths/api";
const RAZORPAY_KEY = "rzp_live_Remrhpj0npbETD";



export default function PaidCoursesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  /* ================= LOAD USER & COURSES ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        loadCourses(userData.id);
      } catch (e) {
        console.error("Failed to parse user", e);
        loadCourses(0);
      }
    } else {
      loadCourses(0);
    }
  }, []);

  /* ================= LOAD COURSES ================= */
  const loadCourses = (userId: number) => {
    setLoading(true);
    fetch(`${API_BASE}/get_courses.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.courses) {
          setCourses(data.courses);
        } else {
          setMessage("Failed to load courses");
          setMessageType("error");
        }
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
        setMessage("Failed to load courses");
        setMessageType("error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  /* ================= PAYMENT HANDLER ================= */
  const handlePayment = (course: Course) => {
    if (!user) {
      setMessage("Please login to purchase this course");
      setMessageType("error");
      return;
    }

    setPaymentLoading(course.id);
    setMessage("");

    fetch(`${API_BASE}/create_order.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(course.price) }),
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
          description: course.course_name,
          order_id: orderData.order_id,
          handler: (response: any) => {
            verifyPayment(response, course.id);
          },
          modal: {
            ondismiss: () => {
              setPaymentLoading(null);
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
        setPaymentLoading(null);
      });
  };

  /* ================= VERIFY PAYMENT ================= */
  const verifyPayment = (response: any, courseId: number) => {
    fetch(`${API_BASE}/verify_payment.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        user_id: user?.id,
        course_id: courseId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage("✅ Payment successful! Course unlocked.");
          setMessageType("success");
          
          if (user) {
            loadCourses(user.id);
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
        setPaymentLoading(null);
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
          <p className="mt-6 text-gray-700 font-semibold text-lg">Loading courses...</p>
        </div>
      </div>
    );
  }

  const paidCourses = courses.filter(c => c.paid);
  const unpaidCourses = courses.filter(c => !c.paid);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl shadow-2xl p-8 sm:p-12 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -ml-32 -mb-32"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <TrendingUp className="text-white" size={32} />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                Premium Courses
              </h1>
            </div>
            <p className="text-blue-100 text-lg sm:text-xl max-w-3xl mb-6">
              Master competitive exams with our comprehensive test series and study materials
            </p>
            
            {user && (
              <div className="flex flex-wrap gap-4 items-center">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-5 py-3 rounded-xl border border-white border-opacity-30">
                  <p className="text-blue-100 text-sm">Welcome back,</p>
                  <p className="text-white font-bold text-lg">{user.name}</p>
                </div>
                <div className="bg-green-500 bg-opacity-90 px-5 py-3 rounded-xl">
                  <p className="text-white font-semibold flex items-center gap-2">
                    <Award size={20} />
                    {paidCourses.length} Course{paidCourses.length !== 1 ? 's' : ''} Owned
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {message && (
          <div
            className={`rounded-xl shadow-lg p-5 mb-8 border-l-4 ${
              messageType === "success"
                ? "bg-green-50 border-green-500 text-green-700"
                : messageType === "error"
                ? "bg-red-50 border-red-500 text-red-700"
                : "bg-blue-50 border-blue-500 text-blue-700"
            }`}
          >
            <div className="flex items-center gap-3">
              {messageType === "success" && <CheckCircle size={24} />}
              {messageType === "error" && <AlertCircle size={24} />}
              {messageType === "info" && <AlertCircle size={24} />}
              <span className="font-semibold text-lg">{message}</span>
            </div>
          </div>
        )}

        {/* My Courses Section */}
        {paidCourses.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="text-green-600" size={32} />
              <h2 className="text-3xl font-bold text-gray-800">
                My Courses ({paidCourses.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paidCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  onBuy={handlePayment}
                  isLoading={paymentLoading === course.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Courses Section */}
        {unpaidCourses.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="text-blue-600" size={32} />
              <h2 className="text-3xl font-bold text-gray-800">
                Available Courses ({unpaidCourses.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unpaidCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  onBuy={handlePayment}
                  isLoading={paymentLoading === course.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Courses */}
        {courses.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
            <div className="bg-gray-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={64} className="text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-700 mb-3">
              No Courses Available
            </h2>
            <p className="text-gray-500 text-lg">
              New courses will be added soon. Stay tuned!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= COURSE CARD COMPONENT ================= */
function CourseCard({ 
  course, 
  onBuy,
  isLoading 
}: { 
  course: Course; 
  onBuy: (course: Course) => void;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2 duration-300">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden">
        {course.image ? (
          <img 
            src={course.image} 
            alt={course.course_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="text-white opacity-50" size={64} />
          </div>
        )}
        
        {/* Paid Badge */}
        {course.paid && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <CheckCircle size={18} />
            <span className="font-bold text-sm">Owned</span>
          </div>
        )}
        
        {/* Lock Badge */}
        {!course.paid && (
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 text-gray-700 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <Lock size={18} />
            <span className="font-bold text-sm">Locked</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
          {course.course_name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {course.description || "Comprehensive course with detailed study materials and practice tests"}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{course.duration || "Self-paced"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <span>4.8</span>
          </div>
        </div>

        {/* Price & Action */}
        {course.paid ? (
          <a
            href={`/test-series?course=${course.id}`}
            className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-center py-4 rounded-xl font-bold text-lg transition-all shadow-md"
          >
            Access Course →
          </a>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-600">₹{course.price}</p>
              <p className="text-xs text-gray-500">One-time payment</p>
            </div>
            <button
              onClick={() => onBuy(course)}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Processing..." : "Buy Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}