import { useState, useEffect, useCallback } from "react";
import { AlertCircle, BookOpen, X, Shield, Loader } from "lucide-react";

interface User {
  id: number;
  name: string;
}

interface Test {
  id: number;
  test_name: string;
  test_url: string;
  created_at: string;
  attempted?: boolean; // from backend
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://tomaths.com/api";
const DEV_MODE = false; // Set to false in production

export default function TestSeriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [startingTestId, setStartingTestId] = useState<number | null>(null);
  const [startedTests, setStartedTests] = useState<Set<number>>(new Set()); // local tracking

  /* ================= CLOSE TEST ================= */
  const closeTest = useCallback((reason?: string) => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (reason) {
      setSecurityWarning(reason);
      setTimeout(() => setSecurityWarning(null), 5000);
    }
    setSelectedTest(null);
  }, []);

  /* ================= SECURITY EFFECTS ================= */
  // Disable text selection globally
  useEffect(() => {
    if (DEV_MODE) return;
    document.body.classList.add("select-none");
    return () => document.body.classList.remove("select-none");
  }, []);

  // Prevent scrolling when test is open
  useEffect(() => {
    document.body.style.overflow = selectedTest ? "hidden" : "auto";
  }, [selectedTest]);

  // Block ESC key during test
  useEffect(() => {
    if (!selectedTest) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", esc, true);
    return () => window.removeEventListener("keydown", esc, true);
  }, [selectedTest]);

  const enterFullscreen = () => {
    if (DEV_MODE) return;
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // Tab switch detection
  useEffect(() => {
    if (!selectedTest || DEV_MODE) return;
    const visibilityHandler = () => {
      if (document.hidden) closeTest("Test closed: Tab switch detected");
    };
    document.addEventListener("visibilitychange", visibilityHandler);
    return () =>
      document.removeEventListener("visibilitychange", visibilityHandler);
  }, [selectedTest, closeTest]);

  // Fullscreen exit detection
  useEffect(() => {
    if (!selectedTest || DEV_MODE) return;
    const fullscreenHandler = () => {
      if (!document.fullscreenElement)
        closeTest("Test closed: Fullscreen exited");
    };
    document.addEventListener("fullscreenchange", fullscreenHandler);
    return () =>
      document.removeEventListener("fullscreenchange", fullscreenHandler);
  }, [selectedTest, closeTest]);

  // Block keyboard shortcuts and right-click
  useEffect(() => {
    if (DEV_MODE) return;
    const blockKeys = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I, J, C (DevTools)
      if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (View Source), Ctrl+S (Save), Ctrl+P (Print)
      if (e.ctrlKey && ["u", "s", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return false;
      }
      // PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard.writeText("").catch(() => {});
        if (selectedTest) closeTest("Test closed: Screenshot attempt detected");
      }
      // Mac screenshot shortcuts
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        if (selectedTest) closeTest("Test closed: Screenshot attempt detected");
      }
    };
    const blockRightClick = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    window.addEventListener("keydown", blockKeys, true);
    document.addEventListener("contextmenu", blockRightClick, true);
    return () => {
      window.removeEventListener("keydown", blockKeys, true);
      document.removeEventListener("contextmenu", blockRightClick, true);
    };
  }, [selectedTest, closeTest]);

  // Block copy/paste/cut
  useEffect(() => {
    if (DEV_MODE) return;
    const disableClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };
    window.addEventListener("copy", disableClipboard, true);
    window.addEventListener("cut", disableClipboard, true);
    window.addEventListener("paste", disableClipboard, true);
    return () => {
      window.removeEventListener("copy", disableClipboard, true);
      window.removeEventListener("cut", disableClipboard, true);
      window.removeEventListener("paste", disableClipboard, true);
    };
  }, []);

  // DevTools detection via window size
  useEffect(() => {
    if (!selectedTest || DEV_MODE) return;
    const detectSize = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold)
        closeTest("Test closed: DevTools detected");
    };
    const detectDebugger = () => {
      const start = performance.now();
      // @ts-ignore
      debugger;
      if (performance.now() - start > 100)
        closeTest("Test closed: Debugger detected");
    };
    const sizeInterval = setInterval(detectSize, 1000);
    const debugInterval = setInterval(detectDebugger, 2000);
    return () => {
      clearInterval(sizeInterval);
      clearInterval(debugInterval);
    };
  }, [selectedTest, closeTest]);

  // Window blur (focus loss)
  useEffect(() => {
    if (!selectedTest || DEV_MODE) return;
    const blurHandler = () => closeTest("Test closed: Window focus lost");
    window.addEventListener("blur", blurHandler);
    return () => window.removeEventListener("blur", blurHandler);
  }, [selectedTest, closeTest]);

  // Mouse leave detection
  useEffect(() => {
    if (!selectedTest || DEV_MODE) return;
    let mouseLeftCount = 0;
    const maxMouseLeave = 3;
    const mouseLeaveHandler = () => {
      mouseLeftCount++;
      if (mouseLeftCount >= maxMouseLeave) {
        closeTest(`Test closed: Mouse left screen ${maxMouseLeave} times`);
      }
    };
    document.addEventListener("mouseleave", mouseLeaveHandler);
    return () => document.removeEventListener("mouseleave", mouseLeaveHandler);
  }, [selectedTest, closeTest]);

  /* ================= LOAD USER AND TESTS ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return setLoading(false);

    const userData = JSON.parse(storedUser);
    setUser(userData);

    // Extract course from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get("course");

    // Pass the extracted course ID to loadTests
    loadTests(userData.id, courseId ? parseInt(courseId) : null);
  }, []);

  // Function to load tests for a user and filter by course if selected
  const loadTests = (userId: number, courseId: number | null) => {
    const bodyData: { user_id: number; course?: number } = { user_id: userId };

    // If courseId is provided, include it in the request body
    if (courseId) {
      bodyData.course = courseId;
    }

    fetch(`${API_BASE}/get_user_tests.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTests(data.tests);
          // Build set of already attempted tests from backend
          const attemptedSet = new Set<number>(
            data.tests.filter((t: Test) => t.attempted).map((t: Test) => t.id),
          );
          setStartedTests(attemptedSet);
        } else {
          setTests([]);
        }
      })
      .finally(() => setLoading(false));
  };

  /* ================= START TEST ================= */
  const startTest = async (test: Test) => {
    if (!user) return;

    // In dev mode, skip backend
    if (DEV_MODE) {
      setSelectedTest(test);
      setTimeout(enterFullscreen, 200);
      return;
    }

    setStartingTestId(test.id);
    setSecurityWarning(null);

    try {
      const response = await fetch(`${API_BASE}/start_test.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          test_id: test.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Mark this test as started locally
        setStartedTests((prev) => new Set(prev).add(test.id));
        // Also update the tests array to set attempted = true for this test
        setTests((prev) =>
          prev.map((t) => (t.id === test.id ? { ...t, attempted: true } : t)),
        );
        setSelectedTest(test);
        setTimeout(enterFullscreen, 200);
      } else {
        setSecurityWarning(data.message || "Unable to start test.");
      }
    } catch (error) {
      setSecurityWarning("Network error. Please check your connection.");
    } finally {
      setStartingTestId(null);
    }
  };

  /* ================= LOADING STATE ================= */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please login to access your tests</p>
        </div>
      </div>
    );

  /* ================= MAIN RENDER ================= */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {securityWarning && (
          <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 animate-pulse">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="font-semibold">{securityWarning}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen size={32} className="text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Your Test Series</h1>
                <p className="text-sm text-gray-600">Welcome, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield size={20} className="text-green-600" />
              <span>Secure Mode Active</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        {!DEV_MODE && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <h3 className="font-semibold text-blue-900 mb-3">
              Security Guidelines
            </h3>
            <ul className="text-sm space-y-2 text-blue-800">
              <li className="bg-red-100 border-l-4 border-red-500 p-3 rounded font-bold text-red-700">
                🚨 You can attend this exam ONLY ONE TIME. Re-entry is strictly
                not allowed.
              </li>
              <li>• Tests will open in fullscreen mode</li>
              <li>• Switching tabs or windows will close the test</li>
              <li>• Screenshots and screen recording are blocked</li>
              <li>• Right-click and developer tools are disabled</li>
              <li>• Ensure stable internet connection before starting</li>
            </ul>
          </div>
        )}

        {/* Tests Grid */}
        {tests.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <AlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              No Tests Available
            </h2>
            <p className="text-gray-500">
              Check back later for new test assignments
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                  <h3 className="font-semibold text-lg">{test.test_name}</h3>
                  <p className="text-xs text-blue-100 mt-1">
                    Created: {new Date(test.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Shield size={16} className="text-green-600" />
                    <span>Secure Test Environment</span>
                  </div>
                  <button
                    onClick={() => startTest(test)}
                    disabled={
                      startedTests.has(test.id) || startingTestId === test.id
                    }
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                      startedTests.has(test.id)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {startedTests.has(test.id) ? (
                      <>
                        <AlertCircle size={20} />
                        Already Attempted
                      </>
                    ) : startingTestId === test.id ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <BookOpen size={20} />
                        Start Test
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Test Modal */}
        {selectedTest && (
          <div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: "none" }}
          >
            <div className="bg-white w-full h-full flex flex-col">
              <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <Shield size={20} className="text-green-600" />
                  <h2 className="font-bold text-lg truncate">
                    {selectedTest.test_name}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to exit the test? Your progress may not be saved.",
                      )
                    ) {
                      closeTest();
                    }
                  }}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  title="Exit Test"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 relative bg-white">
                <iframe
                  src={selectedTest.test_url}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                  title="Test Player"
                  allow="clipboard-write"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
              {!DEV_MODE && (
                <div className="bg-gray-50 border-t px-4 py-2 text-xs text-gray-600 flex items-center justify-center gap-2">
                  <Shield size={14} className="text-green-600" />
                  <span>
                    Secure test mode active - All activities are monitored
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
