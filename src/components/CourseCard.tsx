// CourseCard.tsx
import { CheckCircle, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export interface Course {
  id: number;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  image: string;
  isNew: boolean;
  slug: string;
  paid?: boolean;
  examTitle?: string; // used for grouping
}

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const to = course.paid
    ? `/courseDetails?course=${course.id}`
    : `/new-courses/${course.slug}`;

  return (
    <Link to={to} className="block w-full">
      {/* Mobile View */}
      <div className="md:hidden relative bg-white rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.25)] border border-black/10 overflow-hidden cursor-pointer active:scale-95 transition">
        {/* Top-left badge */}
        <div className="absolute top-2 left-2 z-10">
          {course.paid ? (
            <span className="bg-green-600 text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow">
              <CheckCircle size={12} />
              OWNED
            </span>
          ) : course.isNew ? (
            <span className="bg-blue-700 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow">
              NEW
            </span>
          ) : null}
        </div>

        {/* Lock icon for unpaid */}
        {!course.paid && (
          <div className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-1.5 shadow">
            <Lock className="text-gray-700" size={14} />
          </div>
        )}

        {/* Thumbnail */}
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

        {/* Text */}
        <div className="bg-white py-4 px-4">
          {/* {course.examTitle && (
            // <p className="text-center text-xs font-medium text-orange-600 mb-1 line-clamp-1">
            //   {course.examTitle}
            // </p>
          )} */}
          <p className="text-center text-[16px] font-semibold text-black leading-tight line-clamp-2">
            {course.title}
          </p>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex md:flex-col bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative cursor-pointer">
        {/* Top-left badge */}
        <div className="absolute top-4 left-4 z-10">
          {course.paid ? (
            <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
              <CheckCircle size={14} />
              OWNED
            </span>
          ) : course.isNew ? (
            <span className="bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
              NEW
            </span>
          ) : null}
        </div>

        {/* Lock icon for unpaid */}
        {!course.paid && (
          <div className="absolute top-4 right-4 z-10 bg-white/90 rounded-full p-2 shadow-lg">
            <Lock className="text-gray-700" size={18} />
          </div>
        )}

        {/* Thumbnail */}
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

        <div className="p-5 flex flex-col flex-1">
          {/* {course.examTitle && (
            <p className="text-sm font-medium text-orange-600 mb-1 line-clamp-1">
              {course.examTitle}
            </p>
          )} */}
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 flex-1">
            {course.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
