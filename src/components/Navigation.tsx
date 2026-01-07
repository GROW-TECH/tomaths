import { useState } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <span className="text-2xl font-bold text-blue-600">Explore Academy</span>
          </div>

          <div className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Home</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Paid Courses</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Test Series</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Free Weekly Test</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Free Courses</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Quiz</a>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6 text-gray-700" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <a href="#" className="block text-gray-700 hover:text-blue-600 font-medium">Home</a>
            <a href="#" className="block text-gray-700 hover:text-blue-600 font-medium">Paid Courses</a>
            <a href="#" className="block text-gray-700 hover:text-blue-600 font-medium">Test Series</a>
            <a href="#" className="block text-gray-700 hover:text-blue-600 font-medium">Free Weekly Test</a>
            <a href="#" className="block text-gray-700 hover:text-blue-600 font-medium">Free Courses</a>
            <a href="#" className="block text-gray-700 hover:text-blue-600 font-medium">Quiz</a>
          </div>
        )}
      </div>
    </nav>
  )
}
