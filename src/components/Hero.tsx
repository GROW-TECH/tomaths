export default function Hero() {
  return (
    <div className="relative bg-gradient-to-r from-blue-50 to-blue-100 py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Learn, Master, Succeed
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Explore Academy offers comprehensive courses and test series to help you master competitive exams and professional skills.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition">
              Explore Courses
            </button>
          </div>
          <div className="hidden md:block">
            <img
              src="https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Learning"
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
