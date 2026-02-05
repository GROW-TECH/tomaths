import { CheckCircle, Lock } from "lucide-react";
import { Link } from "react-router-dom";

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    description: string;
    originalPrice: number;
    discountedPrice: number;
    image: string;
    isNew: boolean;
    slug: string;
    paid?: boolean;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const to = course.paid
    ? `/courseDetails?course=${course.id}`
    : `/new-courses/${course.slug}`;

  return (
    <Link to={to} className="block w-full">
      {/* =====================================================
          ✅ MOBILE VIEW (below md)
          Square tile – EXACT subcategory style
          ===================================================== */}
      <div
        className="
          md:hidden
          relative
          bg-[#ffffff]
          rounded-2xl
          shadow-[0_10px_20px_rgba(0,0,0,0.25)]
          border border-black/10
          overflow-hidden
          cursor-pointer
          active:scale-95
          transition
        "
      >
        {/* BADGES */}
        <div className="absolute top-2 left-2 z-10">
          {course.paid ? (
            <span className="bg-white-600 text-white text-[10px] font-lightbold px-2 py-1 rounded-full flex items-center gap-1 shadow">
              <CheckCircle size={12} />
              OWNED
            </span>
          ) : (
            course.isNew && (
              <span className="bg-blue-700 text-white text-[10px] font-lightbold px-2.5 py-1 rounded-full shadow">
                NEW
              </span>
            )
          )}
        </div>

        {!course.paid && (
          <div className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-1.5 shadow">
            <Lock className="text-gray-700" size={14} />
          </div>
        )}

        {/* IMAGE – PERFECT SQUARE */}
        {/* IMAGE – SAME SIZE AS COMPETITIVE EXAMS */}
        <div className="aspect-[16/9] w-full bg-gray-100 overflow-hidden">
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/default-unit.png";
            }}
          />
        </div>

        {/* TITLE */}
        <div className="bg-white py-6 px-6">
          <p className="text-center text-[16px] font-lightbold text-black leading-tight line-clamp-2">
            {course.title}
          </p>
        </div>
      </div>

      {/* =====================================================
          ✅ DESKTOP VIEW (md and up)
          EXACT like 2nd screenshot (wide cards)
          ===================================================== */}
      <div
        className="
          hidden md:block
          bg-white rounded-2xl shadow-lg overflow-hidden
          hover:shadow-2xl transition-all
          transform hover:-translate-y-1
          duration-300
          relative cursor-pointer
        "
      >
        {/* BADGES */}
        <div className="absolute top-4 left-4 z-10">
          {course.paid ? (
            <span className="bg-white-600 text-white text-xs font-lightbold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
              <CheckCircle size={14} />
              OWNED
            </span>
          ) : (
            course.isNew && (
              <span className="bg-blue-700 text-white text-xs font-lightbold px-3 py-1.5 rounded-full shadow-lg">
                NEW
              </span>
            )
          )}
        </div>

        {!course.paid && (
          <div className="absolute top-4 right-4 z-10 bg-white/90 rounded-full p-2 shadow-lg">
            <Lock className="text-gray-700" size={18} />
          </div>
        )}

        {/* IMAGE – 16:9 wide */}
        <div className="aspect-[16/9] w-full bg-gray-100 overflow-hidden">
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/default-unit.png";
            }}
          />
        </div>

        {/* TITLE */}
        <div className="p-5">
          <h3 className="text-xl font-lightbold text-gray-900 line-clamp-2">
            {course.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
