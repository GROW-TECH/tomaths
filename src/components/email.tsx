import { useState } from "react";
import { X, ArrowLeft } from "lucide-react";

/* ================= PROPS ================= */
interface EmailLoginPopupProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: any) => void;
}

export default function EmailLoginPopup({
  open,
  onClose,
  onLoginSuccess,
}: EmailLoginPopupProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  // signup fields
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  // login field (email OR mobile)
  const [identifier, setIdentifier] = useState("");

  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!open) return null;

  // ✅ LIVE API
  const API = "https://xiadot.com/admin_maths/api";

  const resetAll = () => {
    setName("");
    setMobile("");
    setEmail("");
    setIdentifier("");
    setPassword("");
    setAcceptTerms(false);
    setMessage("");
  };

  /* ================= REGISTER ================= */
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!name || !mobile || !email || !password) {
      setMessage("All fields are required");
      return;
    }

    if (!acceptTerms) {
      setMessage("Please accept Terms & Privacy Policy");
      return;
    }

    setLoading(true);

    fetch(`${API}/register.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mobile, email, password }),
    })
      .then((res) => res.text())
      .then((text) => {
        console.log("REGISTER RAW RESPONSE:", text);
        const data = JSON.parse(text);

        if (data.success) {
          setMessage("✅ Registered successfully. Please login.");
          setTimeout(() => {
            setMode("login");
            resetAll();
          }, 1500);
        } else {
          setMessage(data.message || "Registration failed");
        }
      })
      .catch((err) => {
        console.error(err);
        setMessage("Server error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  /* ================= LOGIN ================= */
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!identifier || !password) {
      setMessage("Email / Mobile & password required");
      return;
    }

    setLoading(true);

    fetch(`${API}/user_login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    })
      .then((res) => res.text())
      .then((text) => {
        console.log("LOGIN RAW RESPONSE:", text);
        const data = JSON.parse(text);

        if (data.success) {
          setMessage("✅ Login successful");

          // Pass user data to parent component
          if (onLoginSuccess) {
            onLoginSuccess(data.user);
          }

          setTimeout(() => {
            onClose();
            resetAll();
          }, 1000);
        } else {
          setMessage(data.message || "Login failed");
        }
      })
      .catch((err) => {
        console.error(err);
        setMessage("Server error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const inputStyle =
    "w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  const messageStyle = message.includes("✅")
    ? "text-center mt-3 text-sm text-green-600 font-medium"
    : "text-center mt-3 text-sm text-red-600 font-medium";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-md p-6 z-10 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          {mode === "signup" ? (
            <button
              onClick={() => setMode("login")}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-blue-600" />
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Title */}
        <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">
          {mode === "login" ? "Welcome Back 👋" : "Create Account 🚀"}
        </h2>
        <p className="text-center text-sm text-gray-500 mb-4">
          {mode === "login"
            ? "Login with your email or mobile number"
            : "Sign up to get started"}
        </p>

        {/* MESSAGE */}
        {message && <div className={messageStyle}>{message}</div>}

        {/* ================= LOGIN ================= */}
        {mode === "login" && (
          <div className="mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email or Mobile
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter email or mobile number"
                className={inputStyle}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={inputStyle}
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin(e);
                }}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="text-center mt-6 text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  resetAll();
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {/* ================= SIGNUP ================= */}
        {mode === "signup" && (
          <div className="mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className={inputStyle}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                maxLength={10}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 10-digit mobile number"
                className={inputStyle}
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={inputStyle}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className={inputStyle}
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-start gap-3 mt-5 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                id="terms"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <p className="text-center mt-6 text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  resetAll();
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Login
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}