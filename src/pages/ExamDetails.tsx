import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "https://xiadot.com/admin_maths/api";

type Course = {
  id: number;
  course_name: string;
  image_url: string | null;
  price: string;
  duration: string;
};

export default function CoursesBySubCategoryPage() {
  const { subCategoryId } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const res = await fetch(`${API_BASE}/get_courses.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subcategory_id: Number(subCategoryId),
        }),
      });

      const json = await res.json();
      setCourses(json.courses || []);
      setLoading(false);
    };

    load();
  }, [subCategoryId]);

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#545aa5]">
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-white rounded-lg font-semibold"
        >
          ← Back
        </button>

        <h1 className="text-4xl font-extrabold text-white text-center mt-6 mb-10">
          COURSES
        </h1>

        {courses.length === 0 ? (
          <p className="text-white text-center">No courses found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
            {courses.map((c) => (
              <div
                key={c.id}
                className="bg-[#cfd5ff] rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center"
              >
                <img
                  src={c.image_url || "/default-unit.png"}
                  onError={(x) => (x.currentTarget.src = "/default-unit.png")}
                  alt={c.course_name}
                  className="w-24 h-24 object-contain"
                />
                <p className="mt-4 text-xl font-bold text-black text-center uppercase">
                  {c.course_name}
                </p>
                <p className="text-sm text-gray-700 mt-2">₹ {c.price}</p>
                <p className="text-sm text-gray-700">{c.duration}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
