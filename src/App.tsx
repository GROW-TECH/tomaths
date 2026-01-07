import Navigation from './components/Navigation'
import Hero from './components/Hero'
import CourseGrid from './components/CourseGrid'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navigation />
      <main className="flex-1">
        <Hero />
        <CourseGrid />
      </main>
      <Footer />
    </div>
  )
}
