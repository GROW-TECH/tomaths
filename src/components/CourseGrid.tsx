import { useEffect, useState } from "react";
import CourseCard from "./CourseCard";
import ScrollToTop from "./ScrollToTop";

/* ================= TYPES ================= */

interface ApiCourse {
  id: number;
  course_name: string;
  description: string;
  price: number;
  image_url: string | null;
  paid?: boolean;
}

interface ApiResponse {
  success: boolean;
  data: ApiCourse[];
  count: number;
  message: string;
}

interface PaymentCheckResponse {
  success: boolean;
  courses: Array<{
    id: number;
    paid: boolean;
  }>;
}

/* ================= COMPONENT ================= */

export default function CourseGrid() {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        loadCoursesWithPaymentStatus(userData.id);
      } catch (e) {
        console.error("Failed to parse user", e);
        loadCourses();
      }
    } else {
      loadCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Load courses without payment check (for non-logged-in users)
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("https://xiadot.com/admin_maths/api/courses.php");
      if (!res.ok) throw new Error("API not reachable");

      const response: ApiResponse = await res.json();

      if (!response.success || !Array.isArray(response.data)) {
        throw new Error("Invalid API response");
      }

      setCourses(response.data.map((course) => ({ ...course, paid: false })));
    } catch (err) {
      console.error("API ERROR:", err);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load courses WITH payment status (for logged-in users)
  const loadCoursesWithPaymentStatus = async (userId: number) => {
    try {
      setLoading(true);
      setError(null);

      // 1) get all courses
      const res = await fetch("https://xiadot.com/admin_maths/api/courses.php");
      if (!res.ok) throw new Error("API not reachable");

      const response: ApiResponse = await res.json();

      if (!response.success || !Array.isArray(response.data)) {
        throw new Error("Invalid API response");
      }

      // 2) get payment status
      const payRes = await fetch(
        "https://xiadot.com/admin_maths/api/get_courses.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        },
      );

      const paymentData: PaymentCheckResponse = await payRes.json();

      if (paymentData.success && Array.isArray(paymentData.courses)) {
        const coursesWithPayment = response.data.map((course) => {
          const paidCourse = paymentData.courses.find(
            (pc) => pc.id === course.id,
          );
          return { ...course, paid: paidCourse?.paid || false };
        });

        setCourses(coursesWithPayment);
      } else {
        setCourses(response.data.map((course) => ({ ...course, paid: false })));
      }
    } catch (err) {
      console.error("API ERROR:", err);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <p className="text-center py-10 text-gray-500">Loading courses…</p>;

  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;

  return (
    <section className="bg-[#ffffff] py-8 md:py-14">
      <ScrollToTop />
      {/* ✅ Desktop heading (like your 2nd image)
      <h1 className="hidden md:block text-center text-5xl font-extrabold text-black mb-10">
        COMPETITIVE EXAMS
      </h1>

      {/* ✅ Mobile heading inside panel (optional) */}
      {/* <div className="md:hidden mx-auto w-full max-w-[420px] px-3 mb-3">
        <div className="rounded-[28px] bg-slate-600/80 p-5 shadow-xl">
          <h1 className="text-center text-white text-4xl font-extrabold tracking-widest">
            COURSES
          </h1>
        </div>
      </div> */}

      {/* ✅ ONE GRID for BOTH: MOBILE=2 columns, DESKTOP=4 columns */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 place-items-stretch">
          {courses.map((course) => {
            const slug =
              course.id +
              "-" +
              course.course_name.toLowerCase().replace(/\s+/g, "-");

            return (
              <CourseCard
                key={course.id}
                course={{
                  id: course.id,
                  title: course.course_name,
                  description: course.description,
                  originalPrice: course.price,
                  discountedPrice: course.price,
                  image:
                    course.image_url ?? "https://via.placeholder.com/400x250",
                  isNew: !course.paid,
                  slug,
                  paid: course.paid || false,
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
