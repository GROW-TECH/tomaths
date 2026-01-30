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
  // ✅ Safely convert prices to numbers
  const discountedPrice = Number(course.discountedPrice) || 0;
  const originalPrice = Number(course.originalPrice) || 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2 duration-300 w-full max-w-sm relative">
      {/* Badge - NEW or OWNED */}
      <div className="absolute top-4 left-4 z-10">
        {course.paid ? (
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <CheckCircle size={14} />
            OWNED
          </span>
        ) : (
          course.isNew && (
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              NEW
            </span>
          )
        )}
      </div>

      {/* Lock Badge for Unpaid */}
      {!course.paid && (
        <div className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
          <Lock className="text-gray-700" size={18} />
        </div>
      )}

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          className={`w-full h-full object-cover ${
            course.paid ? "" : "opacity-90"
          }`}
        />
        
        {/* Overlay for owned courses */}
        {course.paid && (
          <div className="absolute inset-0 bg-green-500 bg-opacity-10"></div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {course.description}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              ₹{discountedPrice.toFixed(2)}
            </span>
            {originalPrice !== discountedPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">Online</span>
        </div>

        {/* Action Button */}
        {course.paid ? (
          <Link
            to={`/courseDetails?course=${course.id}`}
            className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-center py-3 rounded-lg font-bold transition-all shadow-md"
          >
            Access Now →
          </Link>
        ) : (
          <Link
            to={`/new-courses/${course.slug}`}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-bold transition-all shadow-md"
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
}