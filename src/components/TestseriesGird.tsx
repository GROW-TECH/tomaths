import { useState, useEffect } from "react";
import { AlertCircle, BookOpen } from "lucide-react";

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

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      setLoading(false);
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    loadTests(userData.id);
  }, []);

  /* ================= LOAD TESTS ================= */
  const loadTests = (userId: number) => {
    fetch(`${API_BASE}/get_user_tests.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTests(data.tests || []);
        } else {
          setTests([]);
        }
      })
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  /* ================= NOT LOGGED ================= */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please login to access tests
      </div>
    );
  }

  /* ================= UI ================= */
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

        {/* NO TEST */}
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

                  <a
                    href={test.test_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-blue-600 text-white py-3 mt-4 rounded text-center"
                  >
                    Start Test
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
