import { useState, useEffect } from "react";
import { AlertCircle, BookOpen, X } from "lucide-react";

/* ================= TYPES ================= */
interface User {
  id: number;
  name: string;
}

interface Test {
  id: number;
  test_name: string;
  test_url: string;
  created_at: string;
}

const API_BASE = "https://xiadot.com/admin_maths/api";

export default function TestSeriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  /* ========== SCROLL LOCK FOR MODAL ========== */
  useEffect(() => {
    if (selectedTest) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [selectedTest]);

  /* ========== ESCAPE KEY TO CLOSE MODAL ========== */
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedTest(null);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  /* ========== 🔒 REDUCED DEVTOOLS BLOCKING – NO ALERTS ========== */
  useEffect(() => {
    // 1. Block only the most common shortcuts (no alerts, just prevent)
    const blockShortcuts = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key.toLowerCase() === "u")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 2. Block right‑click (still prevents context menu)
    const blockRightClick = (e: MouseEvent) => e.preventDefault();

    // 3. DevTools detection via debugger – silently redirect if detected
    const detectDevTools = () => {
      const start = performance.now();
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        // No alert – just redirect
        window.location.href = "/";
      }
    };

    // 4. DevTools detection via window size – silently redirect
    const detectViaSize = () => {
      const widthDiff = window.outerWidth - window.innerWidth > 160;
      const heightDiff = window.outerHeight - window.innerHeight > 160;
      if (widthDiff || heightDiff) {
        window.location.href = "/";
      }
    };

    const interval = setInterval(detectDevTools, 2000);
    const sizeInterval = setInterval(detectViaSize, 1500);

    window.addEventListener("keydown", blockShortcuts, true);
    document.addEventListener("contextmenu", blockRightClick);

    // Print blocking – no alert, just prevent
    const blockPrint = (e: Event) => e.preventDefault();
    window.addEventListener("beforeprint", blockPrint);

    return () => {
      window.removeEventListener("keydown", blockShortcuts, true);
      document.removeEventListener("contextmenu", blockRightClick);
      window.removeEventListener("beforeprint", blockPrint);
      clearInterval(interval);
      clearInterval(sizeInterval);
    };
  }, []);

  /* ========== LOAD USER & TESTS ========== */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLoading(false);
      return;
    }
    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      loadTests(userData.id);
    } catch {
      setLoading(false);
    }
  }, []);

  const loadTests = (userId: number) => {
    fetch(`${API_BASE}/get_user_tests.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTests(data.success ? data.tests || [] : []);
      })
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  };

  /* ========== LOADING ========== */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please login to access tests
      </div>
    );

  /* ========== MAIN UI ========== */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded p-6 mb-6">
          <div className="flex items-center gap-3">
            <BookOpen size={32} className="text-blue-600" />
            <h1 className="text-2xl font-bold">Your Test Series</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Welcome, <b>{user.name}</b>
          </p>
        </div>

        {/* Tests Grid */}
        {tests.length === 0 ? (
          <div className="bg-white shadow rounded p-12 text-center">
            <AlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">
              No Tests Available
            </h2>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div key={test.id} className="bg-white shadow rounded">
                <div className="bg-blue-600 text-white p-4 font-semibold">
                  {test.test_name}
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-500">
                    {new Date(test.created_at).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => setSelectedTest(test)}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 mt-4 rounded"
                  >
                    Start Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========== IFRAME MODAL ========== */}
        {selectedTest && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTest(null)}
          >
            <div
              className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold truncate">
                  {selectedTest.test_name}
                </h2>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              {/* IFRAME - with extra sandbox restrictions */}
              <div className="flex-1">
                <iframe
                  src={selectedTest.test_url}
                  title={selectedTest.test_name}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
