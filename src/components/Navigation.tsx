import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {

  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import EmailLoginPopup from "./email";

/* ================= USER TYPE ================= */
interface User {
  id?: number;
  name?: string;
  email?: string;
  mobile?: string;
  role?: string;
}

/* ================= AVATAR COLORS ================= */
const avatarColors = [
  "bg-blue-600",
  "bg-green-600",
  "bg-purple-600",
  "bg-pink-600",
  "bg-indigo-600",
  "bg-red-600",
  "bg-yellow-600",
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ================= LOAD USER ON MOUNT ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem("user");
      }
    }
  }, []);

  /* ================= CLOSE DROPDOWN ON OUTSIDE CLICK ================= */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "text-blue-600 font-semibold"
      : "text-gray-700 hover:text-blue-600";

  /* ================= HANDLE LOGIN SUCCESS ================= */
  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setDropdownOpen(false);
  };

  /* ================= GET INITIAL FOR AVATAR ================= */
  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <>
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* LOGO */}
          <div className="flex items-center gap-2">
            <img src="logo.png" className="h-12 w-12" alt="TO Maths Logo" />
            <span className="font-semibold text-lg text-blue-600">
Thani Oruvan Maths            </span>
          </div>

          {/* MENU */}
          <div className="hidden md:flex gap-8 text-sm font-medium">
            <NavLink to="/" className={navLinkClass}>
              Home Page
            </NavLink>
            <NavLink to="/paid-courses" className={navLinkClass}>
              Paid Courses
            </NavLink>
            <NavLink to="/test-series" className={navLinkClass}>
              Test Series
            </NavLink>
            
            
            
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 relative">
           

            {/* ================= PROFILE / AVATAR ================= */}
            {user ? (
              <div ref={dropdownRef} className="relative">
                {/* Avatar */}
                <div
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`h-10 w-10 rounded-full text-white flex items-center justify-center font-bold text-lg uppercase cursor-pointer transition-transform hover:scale-105 ${getAvatarColor(
                    user.name || user.email || "U"
                  )}`}
                >
                  {getInitial()}
                </div>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white border rounded-lg shadow-lg z-50">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.email || user.mobile || ""}
                      </p>
                    </div>

                  

                   

                    <div className="border-t">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                         Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setEmailOpen(true)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <UserCircleIcon className="h-9 w-9 text-blue-600" />
              </button>
            )}

            {/* MOBILE MENU */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2"
            >
              {menuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-6 py-4 space-y-4">
            <NavLink
              to="/"
              onClick={() => setMenuOpen(false)}
              className="block py-2"
            >
              Home Page
            </NavLink>
            <NavLink
              to="/paid-courses"
              onClick={() => setMenuOpen(false)}
              className="block py-2"
            >
              Paid Courses
            </NavLink>
            <NavLink
              to="/test-series"
              onClick={() => setMenuOpen(false)}
              className="block py-2"
            >
              Test Series
            </NavLink>
            
            

            {/* Mobile User Section */}
            {user && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-semibold text-gray-900">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="mt-2 text-sm text-red-600 font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* LOGIN / SIGNUP POPUP */}
      <EmailLoginPopup
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}