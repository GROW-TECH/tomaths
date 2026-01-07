import CourseCard from './CourseCard'

const courses = [
  {
    id: 1,
    title: 'Aptitude Topic-wise Test Series',
    originalPrice: 1000,
    discountedPrice: 299,
    image: 'https://images.pexels.com/photos/3862630/pexels-photo-3862630.jpeg?auto=compress&cs=tinysrgb&w=600',
    isNew: true,
  },
  {
    id: 2,
    title: 'Aptitude Master Course by SK',
    originalPrice: 2000,
    discountedPrice: 1000,
    image: 'https://images.pexels.com/photos/4195325/pexels-photo-4195325.jpeg?auto=compress&cs=tinysrgb&w=600',
    isNew: true,
  },
  {
    id: 3,
    title: 'BANK RRB SSC Mastery Course',
    originalPrice: 15000,
    discountedPrice: 10500,
    image: 'https://images.pexels.com/photos/3808617/pexels-photo-3808617.jpeg?auto=compress&cs=tinysrgb&w=600',
    isNew: true,
  },
  {
    id: 4,
    title: 'TNPSC Group I Mastery',
    originalPrice: 5000,
    discountedPrice: 3500,
    image: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=600',
    isNew: false,
  },
  {
    id: 5,
    title: 'TNPSC Group II Complete Guide',
    originalPrice: 4000,
    discountedPrice: 2500,
    image: 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=600',
    isNew: false,
  },
  {
    id: 6,
    title: 'Reasoning & Logic Mastery',
    originalPrice: 3000,
    discountedPrice: 1999,
    image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=600',
    isNew: true,
  },
  {
    id: 7,
    title: 'English Language Excellence',
    originalPrice: 2500,
    discountedPrice: 1499,
    image: 'https://images.pexels.com/photos/5212317/pexels-photo-5212317.jpeg?auto=compress&cs=tinysrgb&w=600',
    isNew: false,
  },
  {
    id: 8,
    title: 'General Knowledge Booster',
    originalPrice: 2000,
    discountedPrice: 999,
    image: 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=600',
    isNew: true,
  },
]

export default function CourseGrid() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Courses
          </h2>
          <p className="text-lg text-gray-600">
            Master your skills with our comprehensive course offerings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  )
}
