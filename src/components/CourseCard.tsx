interface CourseCardProps {
  course: {
    id: number
    title: string
    originalPrice: number
    discountedPrice: number
    image: string
    isNew: boolean
  }
}

export default function CourseCard({ course }: CourseCardProps) {
  const discount = Math.round(((course.originalPrice - course.discountedPrice) / course.originalPrice) * 100)

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition duration-300 overflow-hidden">
      <div className="relative">
        <img
          src={course.image}
          alt={course.title}
          className="w-full h-48 object-cover"
        />
        {course.isNew && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded">
            NEW
          </span>
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded">
            {discount}% OFF
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 h-14">
          {course.title}
        </h3>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">₹{course.discountedPrice}</span>
            <span className="text-sm text-gray-400 line-through">₹{course.originalPrice}</span>
          </div>
        </div>

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition">
          View Details
        </button>
      </div>
    </div>
  )
}
