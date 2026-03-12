import { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  BookOpen,
  
  Shield,
  Loader,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FileText,
} from "lucide-react";

interface User {
  id: number;
  name: string;
}

interface Test {
  id: number;
  test_name: string;
  test_url: string;
  created_at: string;
  attempted?: boolean;
  category_id: number;
  category_name: string;
  subcategory_id: number;
  subcategory_name: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://tomaths.com/api";
const DEV_MODE = true; // Set to false to enable fullscreen and all security features

export default function TestSeriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [startingTestId, setStartingTestId] = useState<number | null>(null);
  const [startedTests, setStartedTests] = useState<Set<number>>(new Set());

  // Category expanded state
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set(),
  );
  const [expandedSubcategories, setExpandedSubcategories] = useState<
    Set<string>
  >(new Set());

  // Group tests by category and subcategory with IDs
  const groupedTests = useCallback(() => {
    const groups = new Map<
      number,
      {
        id: number;
        name: string;
        subcategories: Map<
          number,
          {
            id: number;
            name: string;
            tests: Test[];
          }
        >;
      }
    >();

    tests.forEach((test) => {
      // Get or create category
      if (!groups.has(test.category_id)) {
        groups.set(test.category_id, {
          id: test.category_id,
          name: test.category_name,
          subcategories: new Map(),
        });
      }

      const categoryGroup = groups.get(test.category_id)!;

      // Get or create subcategory
      if (!categoryGroup.subcategories.has(test.subcategory_id)) {
        categoryGroup.subcategories.set(test.subcategory_id, {
          id: test.subcategory_id,
          name: test.subcategory_name,
          tests: [],
        });
      }

      // Add test to subcategory
      categoryGroup.subcategories.get(test.subcategory_id)!.tests.push(test);
    });

    return groups;
  }, [tests]);

  // Toggle category expansion
  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Toggle subcategory expansion
  const toggleSubcategory = (subcategoryKey: string) => {
    setExpandedSubcategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryKey)) {
        newSet.delete(subcategoryKey);
      } else {
        newSet.add(subcategoryKey);
      }
      return newSet;
    });
  };

  // Reset function for debugging stuck test states
  const resetTestState = () => {
    console.log("Resetting test state...");
    setStartedTests(new Set());
    setSecurityWarning(null);
    setExpandedCategories(new Set());
    setExpandedSubcategories(new Set());
    // Reload tests
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      const urlParams = new URLSearchParams(window.location.search);
      const courseId = urlParams.get("course");
      loadTests(userData.id, courseId ? parseInt(courseId) : null);
    }
  };

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
    try {
      document.documentElement.requestFullscreen();
    } catch (error) {
      console.error("Fullscreen request failed:", error);
    }
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
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && ["u", "s", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return false;
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard.writeText("").catch(() => {});
        if (selectedTest) closeTest("Test closed: Screenshot attempt detected");
      }
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

  // Show loading indicator when test is selected
  useEffect(() => {
    const loadingElement = document.getElementById("iframe-loading");
    if (loadingElement) {
      if (selectedTest) {
        loadingElement.style.opacity = "1";
        const timer = setTimeout(() => {
          loadingElement.style.opacity = "0";
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        loadingElement.style.opacity = "0";
      }
    }
  }, [selectedTest]);

  /* ================= LOAD USER AND TESTS ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return setLoading(false);

    const userData = JSON.parse(storedUser);
    setUser(userData);

    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get("course");

    loadTests(userData.id, courseId ? parseInt(courseId) : null);
  }, []);

  // Function to load tests for a user and filter by course if selected
  const loadTests = useCallback(
    async (userId: number, courseId: number | null) => {
      const bodyData: { user_id: number; course?: number } = {
        user_id: userId,
      };

      if (courseId) {
        bodyData.course = courseId;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${API_BASE}/get_user_tests.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          console.log("Tests loaded from API:", data.tests);
          setTests(data.tests);

          const attemptedSet = new Set<number>(
            data.tests.filter((t: Test) => t.attempted).map((t: Test) => t.id),
          );
          console.log("Attempted tests from API:", Array.from(attemptedSet));
          setStartedTests(attemptedSet);

          // Automatically expand first category
          if (data.tests.length > 0) {
            const firstCategoryId = data.tests[0].category_id;
            setExpandedCategories(new Set([firstCategoryId]));
          }

          preloadTestUrls(data.tests);
        } else {
          console.log("API returned failure");
          setTests([]);
          setStartedTests(new Set());
        }
      } catch (error) {
        console.error("Error loading tests:", error);
        setTests([]);
        setStartedTests(new Set());
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Preload test URLs for faster startup
  const preloadTestUrls = useCallback((testsToPreload: Test[]) => {
    const preloadNext = (index: number) => {
      if (index >= testsToPreload.length) return;

      const test = testsToPreload[index];
      if (!test.attempted && test.test_url) {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = test.test_url;
        link.as = "document";
        document.head.appendChild(link);

        setTimeout(() => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        }, 5000);
      }

      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => preloadNext(index + 1), { timeout: 1000 });
      } else {
        setTimeout(() => preloadNext(index + 1), 100);
      }
    };

    preloadNext(0);
  }, []);

  /* ================= START TEST ================= */
  const startTest = async (test: Test) => {
    if (!user) return;

    if (DEV_MODE) {
      console.log("DEV_MODE: Bypassing attempted test check");
      setSelectedTest(test);
      setTimeout(enterFullscreen, 200);
      return;
    }

    if (startedTests.has(test.id)) {
      console.log("Test already attempted, showing warning");
      setSecurityWarning("You have already attempted this test.");
      return;
    }

    if (!test.test_url) {
      setSecurityWarning("Test URL is missing. Please contact support.");
      return;
    }

    try {
      new URL(test.test_url);
    } catch (error) {
      setSecurityWarning("Invalid test URL format. Please contact support.");
      return;
    }

    setStartingTestId(test.id);
    setSecurityWarning(null);

    try {
      const maxRetries = 2;
      let retryCount = 0;
      let response: Response;

      while (retryCount <= maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          response = await fetch(`${API_BASE}/start_test.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.id,
              test_id: test.id,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount > maxRetries) throw error;
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount),
          );
        }
      }

      if (!response!.ok) {
        throw new Error(`Server error: ${response!.status}`);
      }

      const data = await response!.json();

      if (data.success) {
        setStartedTests((prev) => {
          const newSet = new Set(prev).add(test.id);
          console.log("Updated started tests:", Array.from(newSet));
          return newSet;
        });

        setTests((prev) =>
          prev.map((t) => (t.id === test.id ? { ...t, attempted: true } : t)),
        );

        setSelectedTest(test);
        setTimeout(enterFullscreen, 200);
      } else {
        setSecurityWarning(data.message || "Unable to start test.");
      }
    } catch (error) {
      console.error("Start test error:", error);
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        setSecurityWarning(
          "Request timeout. Please check your connection and try again.",
        );
      } else {
        setSecurityWarning(
          "Network error. Please check your connection and try again.",
        );
      }
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
  const groupedByCategory = groupedTests();
  const categoryIds = Array.from(groupedByCategory.keys()).sort((a, b) => {
    const catA = groupedByCategory.get(a);
    const catB = groupedByCategory.get(b);
    return (catA?.name || "").localeCompare(catB?.name || "");
  });

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
            <div className="flex items-center gap-4">
              {DEV_MODE && (
                <button
                  onClick={resetTestState}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                >
                  Reset State
                </button>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield size={20} className="text-green-600" />
                <span>Secure Mode Active</span>
              </div>
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
              <li>• Tests will open in fullscreen mode</li>
              <li>• Switching tabs or windows will close the test</li>
              <li>• Screenshots and screen recording are blocked</li>
              <li>• Right-click and developer tools are disabled</li>
              <li>• Ensure stable internet connection before starting</li>
            </ul>
          </div>
        )}

        {/* Tests by Category */}
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
          <div className="space-y-4">
            {categoryIds.map((categoryId) => {
              const category = groupedByCategory.get(categoryId)!;
              const subcategories = Array.from(
                category.subcategories.entries(),
              ).sort(([, a], [, b]) => a.name.localeCompare(b.name));

              return (
                <div
                  key={categoryId}
                  className="bg-white shadow rounded-lg overflow-hidden"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(categoryId)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 transition-colors border-b"
                  >
                    <div className="flex items-center gap-3">
                      {expandedCategories.has(categoryId) ? (
                        <ChevronDown size={20} className="text-blue-600" />
                      ) : (
                        <ChevronRight size={20} className="text-blue-600" />
                      )}
                      <FolderOpen size={24} className="text-blue-600" />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          {category.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        (
                        {Array.from(category.subcategories.values()).reduce(
                          (acc, sub) => acc + sub.tests.length,
                          0,
                        )}{" "}
                        tests)
                      </span>
                    </div>
                  </button>

                  {/* Subcategories */}
                  {expandedCategories.has(categoryId) && (
                    <div className="p-4 space-y-3">
                      {subcategories.map(([subId, subcategory]) => {
                        const subcategoryKey = `${categoryId}-${subId}`;
                        return (
                          <div
                            key={subcategoryKey}
                            className="border rounded-lg overflow-hidden"
                          >
                            {/* Subcategory Header */}
                            <button
                              onClick={() => toggleSubcategory(subcategoryKey)}
                              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {expandedSubcategories.has(subcategoryKey) ? (
                                  <ChevronDown
                                    size={16}
                                    className="text-gray-600"
                                  />
                                ) : (
                                  <ChevronRight
                                    size={16}
                                    className="text-gray-600"
                                  />
                                )}
                                <FileText size={18} className="text-gray-600" />
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {subcategory.name}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  ({subcategory.tests.length} tests)
                                </span>
                              </div>
                            </button>

                            {/* Tests Grid */}
                            {expandedSubcategories.has(subcategoryKey) && (
                              <div className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {subcategory.tests.map((test) => (
                                  <div
                                    key={test.id}
                                    className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                  >
                                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3">
                                      <h3 className="font-semibold text-base">
                                        {test.test_name}
                                      </h3>
                                      <p className="text-xs text-blue-100 mt-1">
                                        Created:{" "}
                                        {new Date(
                                          test.created_at,
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="p-4">
                                      <div className="flex flex-col gap-1 mb-3 text-xs">
                                        <div className="flex items-center gap-2 text-gray-600">
                                          <span className="font-medium">
                                            Category:
                                          </span>
                                          <span>{test.category_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                          <span className="font-medium">
                                            Subcategory:
                                          </span>
                                          <span>{test.subcategory_name}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                                        <Shield
                                          size={14}
                                          className="text-green-600"
                                        />
                                        <span>Secure Environment</span>
                                      </div>
                                      <button
                                        onClick={() => startTest(test)}
                                        disabled={
                                          startedTests.has(test.id) ||
                                          startingTestId === test.id
                                        }
                                        className={`w-full py-2 px-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${
                                          startedTests.has(test.id)
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                        }`}
                                      >
                                        {startedTests.has(test.id) ? (
                                          <>
                                            <AlertCircle size={16} />
                                            Attempted
                                          </>
                                        ) : startingTestId === test.id ? (
                                          <>
                                            <Loader
                                              size={16}
                                              className="animate-spin"
                                            />
                                            <span>Starting...</span>
                                          </>
                                        ) : (
                                          <>
                                            <BookOpen size={16} />
                                            Start Test
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
                {/* <div className="flex items-center gap-3">
                  {/* <Shield size={20} className="text-green-600" /> */}
                {/* <div> */}
                {/* <h2 className="font-bold text-lg truncate">
                      {/* {selectedTest.test_name} */}
                {/* </h2> */}
                {/* <div className="flex items-center gap-4 text-xs text-gray-600 mt-1"> */}
                {/* <span>Category: {selectedTest.category_name}</span>
                      <span>Subcategory: {selectedTest.subcategory_name}</span> */}
                {/* </div> */}
                {/* </div> */}
                {/* </div> */}
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
                  {/* <X size={24} /> */}
                </button>
              </div>
              <div className="flex-1 relative bg-white">
                <iframe
                  src={selectedTest.test_url}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation allow-modals"
                  title="Test Player"
                  allow="clipboard-read clipboard-write"
                  onError={(e) => {
                    console.error("Test iframe error:", e);
                    setSecurityWarning(
                      "Failed to load test content. Please check your connection.",
                    );
                  }}
                  onLoad={() => {
                    console.log("Test iframe loaded successfully");
                  }}
                  onLoadStart={() => {
                    console.log("Starting to load test iframe");
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="text-center opacity-0 transition-opacity duration-300"
                    id="iframe-loading"
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading test...</p>
                  </div>
                </div>
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
