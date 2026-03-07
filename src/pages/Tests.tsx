import { useState, useEffect, useCallback, useMemo } from "react";
import { Edit2, Trash2, ExternalLink } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_LINK;
const SUBCATEGORY_ENDPOINT =
  import.meta.env.VITE_SUBCATEGORY_ENDPOINT || "get_subCategory.php";

// ================= TYPES =================
interface Course {
  id: number;
  course_name: string;
  description?: string;
}

interface Category {
  id: number;
  category_name: string;
}

interface Subcategory {
  id: number;
  subcategory_name: string;
  category_id: number;
}

interface Test {
  id: number;
  test_name: string;
  test_url: string;
  preview_url: string;
  course_id: number | null;
  category_id: number | null;
  subcategory_id: number | null;
  course_name?: string | null;
  category_name?: string | null;
  subcategory_name?: string | null;
  created_at: string;
}

interface TestFormData {
  test_name: string;
  test_url: string;
  preview_url: string;
  course_id: string;
  category_id: string;
  subcategory_id: string;
}

// ================= COMPONENT =================
function Tests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<TestFormData>({
    test_name: "",
    test_url: "",
    preview_url: "",
    course_id: "",
    category_id: "",
    subcategory_id: "",
  });

  // ================= HELPER =================
  const extractArray = (data: any, extraKeys: string[] = []): any[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      const keys = [
        "data",
        "courses",
        "categories",
        "subcategories",
        "items",
        "result",
        "results",
        ...extraKeys,
      ];
      for (const key of keys) {
        if (Array.isArray(data[key])) return data[key];
      }
      const values = Object.values(data);
      if (values.length > 0 && typeof values[0] === "object")
        return values as any[];
    }
    return [];
  };

  // ================= API CALLS =================
  const loadTests = useCallback(async () => {
    setLoadingTests(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/tests.php?t=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const text = await res.text();
      console.log("=== RAW TESTS RESPONSE ===", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned invalid JSON for tests");
      }

      const testsArray = extractArray(data);
      const mapped = testsArray.map((item: any) => ({
        id: item.id,
        test_name: item.test_name,
        test_url: item.test_url,
        preview_url: item.preview_url,
        course_id: item.course_id ?? null,
        category_id: item.category_id ?? null,
        subcategory_id: item.subcategory_id ?? null,
        course_name: item.course_name ?? null,
        category_name: item.category_name ?? null,
        subcategory_name: item.subcategory_name ?? null,
        created_at: item.created_at,
      }));
      setTests(mapped);
    } catch (err) {
      console.error("Failed to load tests:", err);
      setError(err instanceof Error ? err.message : "Could not load tests.");
    } finally {
      setLoadingTests(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch(`${API_BASE_URL}/get_courses.php?action=list`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const text = await res.text();
      console.log("=== RAW COURSES RESPONSE ===", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned invalid JSON for courses");
      }

      console.log("=== PARSED COURSES DATA ===", data);
      console.log("=== COURSES DATA KEYS ===", Object.keys(data));

      const list = extractArray(data, ["courses"]);
      console.log("=== EXTRACTED COURSES LIST ===", list);

      const mapped = list.map((item: any) => ({
        id: Number(item.id),
        course_name: item.course_name || item.name || item.title || "Unnamed",
        description: item.description,
      }));

      console.log("=== MAPPED COURSES ===", mapped);
      setCourses(mapped);
    } catch (err) {
      console.error("Failed to load courses:", err);
      setError("Could not load courses: " + String(err));
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch(`${API_BASE_URL}/get_Category.php?action=list`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const text = await res.text();
      console.log("=== RAW CATEGORIES RESPONSE ===", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned invalid JSON for categories");
      }

      console.log("=== PARSED CATEGORIES DATA ===", data);

      const list = extractArray(data, ["categories"]);
      console.log("=== EXTRACTED CATEGORIES LIST ===", list);

      const mapped = list.map((item: any) => ({
        id: Number(item.id),
        category_name:
          item.category_name || item.name || item.title || "Unnamed",
      }));

      console.log("=== MAPPED CATEGORIES ===", mapped);
      setCategories(mapped);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setError("Could not load categories: " + String(err));
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadSubcategories = useCallback(async (categoryId: string) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    setLoadingSubcategories(true);
    setError(null);

    const baseUrl = API_BASE_URL;
    const possibleEndpoints = [
      `${baseUrl}/${SUBCATEGORY_ENDPOINT}?action=list&category_id=${categoryId}`,
      `${baseUrl}/get_subcategory.php?action=list&category_id=${categoryId}`,
      `${baseUrl}/get_subCategory.php?action=list&category_id=${categoryId}`,
      `${baseUrl}/subcategories.php?action=list&category_id=${categoryId}`,
      `${baseUrl}/subcategory.php?action=list&category_id=${categoryId}`,
      `${baseUrl}/get_subCategory.php?action=list&cat_id=${categoryId}`,
      `${baseUrl}/subcategories.php?cat_id=${categoryId}`,
    ];

    const uniqueEndpoints = [...new Set(possibleEndpoints)];
    let lastError = "";

    for (const endpoint of uniqueEndpoints) {
      try {
        console.log("Trying subcategory endpoint:", endpoint);
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

        const text = await res.text();
        console.log(`=== RAW SUBCATEGORY RESPONSE ===`, text.substring(0, 300));

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Response is not JSON");
        }

        const items = extractArray(data, ["subcategories"]);
        const mapped = items.map((item: any) => ({
          id: item.id,
          subcategory_name: item.subcategory_name || item.name || "Unnamed",
          category_id: item.category_id,
        }));

        setSubcategories(mapped);
        setLoadingSubcategories(false);
        return;
      } catch (err) {
        console.warn(`Endpoint failed: ${endpoint}`, err);
        lastError = err instanceof Error ? err.message : "Unknown error";
      }
    }

    console.error("All subcategory endpoints failed:", lastError);
    setSubcategories([]);
    setError(`Could not load subcategories. Last error: ${lastError}`);
    setLoadingSubcategories(false);
  }, []);

  useEffect(() => {
    loadTests();
    loadCourses();
    loadCategories();
  }, [loadTests, loadCourses, loadCategories]);

  // ================= FORM HANDLERS =================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`);

    if (name === "category_id") {
      loadSubcategories(value);
      setFormData((prev) => ({
        ...prev,
        category_id: value,
        subcategory_id: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      test_name: "",
      test_url: "",
      preview_url: "",
      course_id: "",
      category_id: "",
      subcategory_id: "",
    });
    setSubcategories([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = async (test: Test) => {
    if (courses.length === 0) await loadCourses();
    if (categories.length === 0) await loadCategories();
    if (test.category_id) await loadSubcategories(test.category_id.toString());

    setFormData({
      test_name: test.test_name,
      test_url: test.test_url,
      preview_url: test.preview_url,
      course_id: test.course_id?.toString() || "",
      category_id: test.category_id?.toString() || "",
      subcategory_id: test.subcategory_id?.toString() || "",
    });
    setEditingId(test.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.test_name?.trim()) {
      alert("Test name is required");
      return;
    }
    if (!formData.test_url?.trim()) {
      alert("Test URL is required");
      return;
    }
    if (!formData.preview_url?.trim()) {
      alert("Preview URL is required");
      return;
    }
    if (!formData.course_id) {
      alert("Please select a course");
      return;
    }
    if (!formData.category_id) {
      alert("Please select a category");
      return;
    }
    if (!formData.subcategory_id) {
      alert("Please select a subcategory");
      return;
    }

    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(formData.test_url)) {
      alert("Test URL must start with http:// or https://");
      return;
    }
    if (!urlPattern.test(formData.preview_url)) {
      alert("Preview URL must start with http:// or https://");
      return;
    }

    const form = new FormData();
    form.append("test_name", formData.test_name.trim());
    form.append("test_url", formData.test_url.trim());
    form.append("preview_url", formData.preview_url.trim());
    form.append("course_id", formData.course_id);
    form.append("category_id", formData.category_id);
    form.append("subcategory_id", formData.subcategory_id);
    if (editingId) form.append("id", editingId.toString());

    const url = editingId ? "update_test.php" : "add_test.php";

    try {
      const res = await fetch(`${API_BASE_URL}/${url}`, {
        method: "POST",
        body: form,
      });
      const responseText = await res.text();
      console.log("Server response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error("Server returned invalid JSON");
      }

      if (!result.success)
        throw new Error(result.message || "Unknown server error");

      alert("Test saved successfully!");
      resetForm();
      loadTests();
    } catch (err) {
      console.error("Failed to save test:", err);
      alert(err instanceof Error ? err.message : "Could not save test.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this test?")) return;

    const form = new FormData();
    form.append("id", id.toString());

    try {
      const res = await fetch(`${API_BASE_URL}/delete_test.php`, {
        method: "POST",
        body: form,
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      loadTests();
    } catch (err) {
      console.error("Failed to delete test:", err);
      alert("Could not delete test. Please try again.");
    }
  };

  // ================= FILTERING =================
  const filteredTests = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tests.filter(
      (t) =>
        t.test_name.toLowerCase().includes(term) ||
        t.course_name?.toLowerCase().includes(term) ||
        t.category_name?.toLowerCase().includes(term) ||
        t.subcategory_name?.toLowerCase().includes(term),
    );
  }, [tests, searchTerm]);

  // ================= RENDER =================
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Tests Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-6 transition"
      >
        {showForm ? "Cancel" : "Add Test"}
      </button>

      {showForm && (
        <form
          className="bg-white p-6 shadow rounded mb-6 border"
          onSubmit={handleSubmit}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="test_name"
              placeholder="Test Name"
              value={formData.test_name}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />

            <select
              name="course_id"
              value={formData.course_id}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            >
              <option value="">
                {loadingCourses
                  ? "Loading Exams..."
                  : `Select Exam (${courses.length} found)`}
              </option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_name}
                </option>
              ))}
            </select>

            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            >
              <option value="">
                {loadingCategories
                  ? "Loading Categories..."
                  : `Select Category (${categories.length} found)`}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category_name}
                </option>
              ))}
            </select>

            <select
              name="subcategory_id"
              value={formData.subcategory_id}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
              disabled={loadingSubcategories || !formData.category_id}
            >
              <option value="">
                {loadingSubcategories
                  ? "Loading..."
                  : !formData.category_id
                    ? "Select Category first"
                    : `Select Subcategory (${subcategories.length} found)`}
              </option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subcategory_name}
                </option>
              ))}
            </select>

            <input
              name="test_url"
              placeholder="Test URL (https://...)"
              value={formData.test_url}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />

            <input
              name="preview_url"
              placeholder="YouTube URL (https://...)"
              value={formData.preview_url}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 mt-4 rounded transition"
          >
            {editingId ? "Update Test" : "Add Test"}
          </button>
        </form>
      )}

      <input
        type="text"
        placeholder="Search tests, courses, categories, subcategories..."
        className="border p-2 mb-4 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Test</th>
              <th className="p-3 text-left">Exam</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Subcategory</th>
              <th className="p-3 text-left">Links</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loadingTests ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Loading tests...
                </td>
              </tr>
            ) : filteredTests.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No tests found.
                </td>
              </tr>
            ) : (
              filteredTests.map((test) => (
                <tr key={test.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{test.test_name}</td>
                  <td className="p-3">{test.course_name || "—"}</td>
                  <td className="p-3">{test.category_name || "—"}</td>
                  <td className="p-3">{test.subcategory_name || "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      {test.test_url && (
                        <a
                          href={test.test_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open test"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink size={20} />
                        </a>
                      )}
                      {test.preview_url && (
                        <a
                          href={test.preview_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open preview"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink size={20} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(test)}
                        aria-label={`Edit ${test.test_name}`}
                        className="text-gray-600 hover:text-blue-600 transition"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(test.id)}
                        aria-label={`Delete ${test.test_name}`}
                        className="text-gray-600 hover:text-red-600 transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Tests;
