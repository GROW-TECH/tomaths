import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import AdminImageUpload from "./pages/images";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Exam from "./pages/Exam";
import Category from "./pages/Category";
import SubCategory from "./pages/Subcategory";
import Tests from "./pages/Tests";
import Payments from "./pages/Payments";
import Users from "./pages/Users";
import Login from "./pages/Login";
import ExamTitlePage from "./pages/ExamTitle";
import Settings from "./pages/Setting";

type Page =
  | "images"
  | "dashboard"
  | "courses"
  | "tests"
  | "payments"
  | "users"
  | "exam title"
  | "exam"
  | "category"
  | "subcategory"
  | "Settings";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem("admin_logged_in") === "true");
  }, []);

  useEffect(() => {
    const handler = () => {
      setIsAuthenticated(localStorage.getItem("admin_logged_in") === "true");
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "images":
        return <AdminImageUpload />;
      case "dashboard":
        return <Dashboard />;
      case "users":
        return <Users />;
      case "exam title":
        return <ExamTitlePage />;
      case "exam":
        return <Exam />;
      case "category":
        return <Category />;
      case "subcategory":
        return <SubCategory />;
      case "tests":
        return <Tests />;
      case "courses":
        return <Courses />;
      case "payments":
        return <Payments />;
      case "Settings":
        return <Settings />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">{renderPage()}</main>
    </div>
  );
}

export default App;
