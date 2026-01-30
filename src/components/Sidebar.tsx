import {
  LayoutDashboard,
  BookOpen,
  FileText,
  DollarSign,
  Users,
  GraduationCap,
  LogOut,
  ClipboardList,
  Folder,
  Layers,
} from "lucide-react";

type Page = "dashboard" | "courses" | "tests" | "payments" | "users" | "exam" | "category" | "subcategory";

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const Sidebar = ({ currentPage, onPageChange }: SidebarProps) => {
  const menuItems = [
    { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
    { id: "courses" as Page, label: "Courses", icon: BookOpen },
    { id: "exam" as Page, label: "Exam", icon: ClipboardList },
    { id: "category" as Page, label: "Category", icon: Folder },
    { id: "subcategory" as Page, label: "Subcategory", icon: Layers },
    { id: "tests" as Page, label: "Tests", icon: FileText },
    { id: "payments" as Page, label: "Payments", icon: DollarSign },
    { id: "users" as Page, label: "Users", icon: Users },
  ];

  /* ================= LOGOUT ================= */
 const handleLogout = () => {
  // ✅ remove correct auth keys
  localStorage.removeItem("admin_logged_in");
  localStorage.removeItem("admin_name");
  localStorage.removeItem("admin_email");

  // ✅ notify App.tsx immediately
  window.dispatchEvent(new Event("storage"));
};


  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* LOGO */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-gray-800">
              Thani Oruvan Maths
            </h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* FOOTER + LOGOUT */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
            A
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Admin User</p>
            <p className="text-xs text-gray-500">admin@mathedu.com</p>
          </div>
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
