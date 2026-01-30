import { useEffect, useState } from "react";
import CourseCard from "./CourseCard";

/* ================= TYPES ================= */



interface ApiCourse {
  id: number;
  course_name: string;
  description: string;
  price: number;
  image_url: string | null;
  paid?: boolean; // ✅ Add payment status
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
    course_name: string;
    description: string;
    price: string;
    duration: string;
    image: string;
    created_at: string;
    paid: boolean;
  }>;
}

/* ================= COMPONENT ================= */

export default function CourseGrid() {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is logged in
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
  }, []);

  // ✅ Load courses without payment check (for non-logged-in users)
  const loadCourses = () => {
    fetch("https://xiadot.com/admin_maths/api/courses.php")
      .then((res) => {
        if (!res.ok) throw new Error("API not reachable");
        return res.json();
      })
      .then((response: ApiResponse) => {
        console.log("COURSES FROM API =", response.data.length);

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error("Invalid API response");
        }
        setCourses(response.data.map(course => ({ ...course, paid: false })));
        setLoading(false);
      })
      .catch((err) => {
        console.error("API ERROR:", err);
        setError("Failed to load courses");
        setLoading(false);
      });
  };

  // ✅ Load courses WITH payment status (for logged-in users)
  const loadCoursesWithPaymentStatus = (userId: number) => {
    // First, get all courses
    fetch("https://xiadot.com/admin_maths/api/courses.php")
      .then((res) => {
        if (!res.ok) throw new Error("API not reachable");
        return res.json();
      })
      .then((response: ApiResponse) => {
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error("Invalid API response");
        }

        // Then, check payment status
        return fetch("https://xiadot.com/admin_maths/api/get_courses.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        })
          .then((res) => res.json())
          .then((paymentData: PaymentCheckResponse) => {
            if (paymentData.success && paymentData.courses) {
              // Merge payment status with course data
              const coursesWithPayment = response.data.map((course) => {
                const paidCourse = paymentData.courses.find(
                  (pc) => pc.id === course.id
                );
                return {
                  ...course,
                  paid: paidCourse?.paid || false,
                };
              });
              setCourses(coursesWithPayment);
            } else {
              setCourses(response.data.map(course => ({ ...course, paid: false })));
            }
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error("API ERROR:", err);
        setError("Failed to load courses");
        setLoading(false);
      });
  };

  if (loading)
    return <p className="text-center py-10 text-gray-500">Loading courses…</p>;

  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4"></div>
     {/*  <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
         <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Courses
          </h2>
          <p className="text-lg text-gray-600">
            Learn from our expertly designed courses
          </p>
        </div>*/}

        {/* ===== FIRST ROW ===== */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center">
  {courses.slice(0, 4).map((course) => {
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
          image: course.image_url ?? "https://via.placeholder.com/400x250",
          isNew: !course.paid,
          slug,
          paid: course.paid || false,
        }}
      />
    );
  })}
</div>  
<br /><br />


{/* ===== SECOND ROW HEADLINE ===== */}
{/* <h2 className="text-4xl md:text-5xl font-extrabold mt-12 mb-8 text-center text-gold-700">
  COMPETITIVE EXAMS
</h2>
<div className="w-24 h-1 bg-gold-500 mx-auto mb-16"></div> */}

{/* ===== SECOND ROW ===== */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center">
  {courses.slice(4).map((course) => {
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
          image: course.image_url ?? "https://via.placeholder.com/400x250",
          isNew: !course.paid,
          slug,
          paid: course.paid || false,
        }}
      />
    );
  })}
</div>

    {/* </div>*/}
    </section>

    
  );
}







  



