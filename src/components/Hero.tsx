export default function Hero() {
  return (
    <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16 md:py-24">
      {/* Optional decorative blobs (venumna remove pannalaam) */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full blur-xl opacity-30"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-200 rounded-full blur-xl opacity-30"></div>

      <div className="relative max-w-7xl mx-auto px-4 flex justify-center">
        <div className="relative">
          {/* Tilt background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl transform rotate-6 scale-105 opacity-20"></div>

          {/* IMAGE ONLY */}
          <img
            src="https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg?auto=compress&cs=tinysrgb&w=800"
            alt="Competitive exams"
            className="relative rounded-3xl shadow-2xl max-h-[500px] object-cover"
          />
        </div>
      </div>
    </div>
  );
}
