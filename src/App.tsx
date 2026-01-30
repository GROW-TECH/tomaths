import { Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import CourseGrid from "./components/CourseGrid";
import ExamGrid from "./components/ExamGrid"; // ✅ ADD
import Footer from "./components/Footer"; 
import CourseDetails from "./pages/CourseDetails";
import TestSeriesGrid from "./components/TestseriesGird";
import PaidCoursesPage from "./pages/paid-courses";
import ExamDetails from "./pages/ExamDetails";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navigation />

      <main className="flex-1">
        <Routes>
          <Route
  path="/"
  element={
    <>
      <Hero />

      {/* COURSES */}
      <section className="mt-16">
        <h1 className="text-5xl font-extrabold text-center mb-10">
          COURSES
        </h1>
        <CourseGrid />
      </section>

      {/* COMPETITIVE EXAMS */}
      <section className="mt-24">
        <h1 className="text-5xl font-extrabold text-center mb-10">
          COMPETITIVE EXAMS
        </h1>
        <ExamGrid />
      </section>
    </>
  }
/>



          <Route path="/paid-courses" element={<PaidCoursesPage />} />
          <Route path="/new-courses/:slug" element={<CourseDetails />} />
          <Route path="/test-series" element={<TestSeriesGrid />} />
          <Route path="/exams/:id" element={<ExamDetails />} />
          
        

        </Routes>
      </main>

      <Footer />
    </div>
  );
}
