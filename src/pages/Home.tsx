import CourseGrid from "../components/CourseGrid";
import ExamGrid from "../components/ExamGrid";

export default function Home() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-center mt-10">
        PAID COURSES
      </h1>
      <CourseGrid />

      <h1 className="text-4xl font-bold text-center mt-16">
        COMPETITIVE EXAMS
      </h1>
      <ExamGrid />
    </div>
  );
}
