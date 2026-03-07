import { useEffect, useState } from "react";
import CourseCard from "./CourseCard";
import ScrollToTop from "./ScrollToTop";

/* ================= TYPES ================= */
interface ApiCourse {
  id: number;
  course_name: string;
  description: string;
  price: number;
  actual_price?: number;
  image_url: string | null;
  exam_title?: string;
  paid?: boolean;
}

interface ApiResponse {
  success: boolean;
  data: ApiCourse[];
}

interface PaymentCheckResponse {
  success: boolean;
  courses: Array<{ id: number; paid: boolean }>;
}

export default function CourseGrid() {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://tomaths.com/api";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        loadCoursesWithPaymentStatus(userData.id);
      } catch {
        loadCourses();
      }
    } else {
      loadCourses();
    }
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/courses.php?action=list`);
      const response: ApiResponse = await res.json();

      setCourses(response.data.map((c) => ({ ...c, paid: false })));
    } catch {
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const loadCoursesWithPaymentStatus = async (userId: number) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/courses.php?action=list`);
      const response: ApiResponse = await res.json();

      const payRes = await fetch(`${API_BASE}/get_courses.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      const paymentData: PaymentCheckResponse = await payRes.json();

      const updated = response.data.map((course) => {
        const paidCourse = paymentData.courses.find(
          (pc) => pc.id === course.id,
        );

        return {
          ...course,
          paid: paidCourse?.paid || false,
        };
      });

      setCourses(updated);
    } catch {
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <p className="text-center py-10 text-gray-500">Loading courses…</p>;

  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;

  /* ================= GROUP BY exam_title ================= */

  const groupedCourses = courses.reduce((acc: any, course) => {
    const key = course.exam_title || "Other";

    if (!acc[key]) acc[key] = [];

    acc[key].push(course);

    return acc;
  }, {});

  return (
    <section className="bg-white py-8 md:py-14">
      <ScrollToTop />

      <div className="max-w-7xl mx-auto px-4">
        {Object.entries(groupedCourses).map(([examTitle, list]: any) => (
          <div key={examTitle} className="mb-12">
            {/* Category Title */}
            <h2 className="text-xl md:text-2xl font-bold mb-6">{examTitle}</h2>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {list.map((course: ApiCourse) => {
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
                      originalPrice: course.actual_price ?? course.price,
                      discountedPrice: course.price,
                      image:
                        course.image_url ??
                        "https://via.placeholder.com/400x250",
                      isNew: !course.paid,
                      slug,
                      paid: course.paid || false,
                      examTitle: course.exam_title,
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
