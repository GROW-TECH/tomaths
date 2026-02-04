import { Routes, Route } from "react-router-dom";

import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import CourseGrid from "./components/CourseGrid";
import ExamGrid from "./components/ExamGrid";
import Footer from "./components/Footer";
import TestSeriesGrid from "./components/TestseriesGird";

import CourseDetails from "./pages/CourseDetails";
import PaidCoursesPage from "./pages/paid-courses";
import ExamDetails from "./pages/ExamDetails";
import CoursesBySubCategoryPage from "./pages/CoursesBySubCategoryPage";
import CourseListPage from "./pages/CourseListPage";

import ScrollToTop from "./components/ScrollToTop";

/* ================= APP COMPONENT ================= */

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ✅ GLOBAL SCROLL FIX */}
      <ScrollToTop />

      {/* ✅ HEADER */}
      <Navigation />

      {/* ✅ MAIN CONTENT */}
      <main className="flex-1">
        <Routes>
          {/* ================= HOME ================= */}
          <Route
            path="/"
            element={
              <>
                <Hero />

                {/* COURSES */}
                <section className="mt-16">
                  <h1 className="text-3xl font-lightbold text-center mb-10">
                    COURSES
                  </h1>
                  <CourseGrid />
                </section>

                {/* COMPETITIVE EXAMS */}
                <section className="mt-24">
                  <h1 className="text-3xl font-lightbold text-center mb-10">
                    COMPETITIVE EXAMS
                  </h1>
                  <ExamGrid />
                </section>
              </>
            }
          />

          {/* ================= PAID COURSES ================= */}
          <Route path="/paid-courses" element={<PaidCoursesPage />} />

          {/* ================= COURSE DETAILS ================= */}
          <Route path="/new-courses/:slug" element={<CourseDetails />} />

          {/* ================= TEST SERIES ================= */}
          <Route path="/test-series" element={<TestSeriesGrid />} />

          {/* ================= EXAM DETAILS ================= */}
          <Route path="/exams/:id" element={<ExamDetails />} />

          {/* ================= SUB CATEGORY ================= */}
          <Route
            path="/courses/subcategory/:subCategoryId"
            element={<CoursesBySubCategoryPage />}
          />

          {/* ================= COURSE LIST ================= */}
          <Route path="/courses/:slug" element={<CourseListPage />} />
        </Routes>
      </main>

      {/* ✅ FOOTER */}
      <Footer />
    </div>
  );
}
