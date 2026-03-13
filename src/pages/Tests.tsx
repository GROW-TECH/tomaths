import { useState, useEffect, useCallback, useMemo } from "react";
import { Edit2, Trash2, ExternalLink } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_LINK;
const SUBCATEGORY_ENDPOINT =
  import.meta.env.VITE_SUBCATEGORY_ENDPOINT || "get_subCategory.php";

// ================= CONSTANTS =================
const API_ENDPOINTS = {
  TESTS: "tests.php",
  CATEGORIES: "get_Category.php",
  ADD_TEST: "add_test.php",
  UPDATE_TEST: "update_test.php",
  DELETE_TEST: "delete_test.php",
} as const;

const URL_PATTERN = /^https?:\/\/.+/;

// ================= TYPES =================
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
  category_id: number | null;
  subcategory_id: number | null;
  category_name?: string | null;
  subcategory_name?: string | null;
  created_at: string;
}

interface TestFormData {
  test_name: string;
  test_url: string;
  preview_url: string;
  category_id: string;
  subcategory_id: string;
}

interface FormErrors {
  test_name?: string;
  test_url?: string;
  preview_url?: string;
  category_id?: string;
  subcategory_id?: string;
}

// ================= HELPER FUNCTIONS =================
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

const handleApiError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
};

// ================= COMPONENT =================
function Tests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<Subcategory[]>([]); // Store all subcategories
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]); // Filtered by category

  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<TestFormData>({
    test_name: "",
    test_url: "",
    preview_url: "",
    category_id: "",
    subcategory_id: "",
  });

  // ================= API CALLS =================
  const loadTests = useCallback(async () => {
    setLoadingTests(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/${API_ENDPOINTS.TESTS}?t=${Date.now()}`;
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
        category_id: item.category_id ?? null,
        subcategory_id: item.subcategory_id ?? null,
        category_name: item.category_name ?? null,
        subcategory_name: item.subcategory_name ?? null,
        created_at: item.created_at,
      }));
      setTests(mapped);
    } catch (err) {
      console.error("Failed to load tests:", err);
      setError(handleApiError(err));
    } finally {
      setLoadingTests(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/${API_ENDPOINTS.CATEGORIES}?action=list`,
      );
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const text = await res.text();
      console.log("=== RAW CATEGORIES RESPONSE ===", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned invalid JSON for categories");
      }

      const list = extractArray(data, ["categories"]);
      const mapped = list.map((item: any) => ({
        id: Number(item.id),
        category_name:
          item.category_name || item.name || item.title || "Unnamed",
      }));

      setCategories(mapped);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setError(handleApiError(err));
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Load ALL subcategories once
  const loadAllSubcategories = useCallback(async () => {
    setLoadingSubcategories(true);
    setError(null);

    const baseUrl = API_BASE_URL;
    const possibleEndpoints = [
      `${baseUrl}/${SUBCATEGORY_ENDPOINT}?action=list`,
      `${baseUrl}/get_subcategory.php?action=list`,
      `${baseUrl}/get_subCategory.php?action=list`,
      `${baseUrl}/subcategories.php?action=list`,
      `${baseUrl}/subcategory.php?action=list`,
    ];

    const uniqueEndpoints = [...new Set(possibleEndpoints)];
    let lastError = "";

    for (const endpoint of uniqueEndpoints) {
      try {
        console.log("Trying subcategory endpoint:", endpoint);
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

        const text = await res.text();
        console.log(
          `=== RAW SUBCATEGORY RESPONSE ===`,
          text.substring(0, 300),
        );

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Response is not JSON");
        }

        const items = extractArray(data, ["subcategories"]);
        const mapped = items.map((item: any) => ({
          id: Number(item.id),
          subcategory_name: item.subcategory_name || item.name || "Unnamed",
          category_id: Number(item.category_id),
        }));

        setAllSubcategories(mapped);
        setLoadingSubcategories(false);
        return;
      } catch (err) {
        console.warn(`Endpoint failed: ${endpoint}`, err);
        lastError = err instanceof Error ? err.message : "Unknown error";
      }
    }

    console.error("All subcategory endpoints failed:", lastError);
    setAllSubcategories([]);
    setError(`Could not load subcategories. Last error: ${lastError}`);
    setLoadingSubcategories(false);
  }, []);

  useEffect(() => {
    loadTests();
    loadCategories();
    loadAllSubcategories(); // Load all subcategories once
  }, [loadTests, loadCategories, loadAllSubcategories]);

  // Filter subcategories based on selected category
  useEffect(() => {
    if (formData.category_id) {
      const filtered = allSubcategories.filter(
        sub => sub.category_id === Number(formData.category_id)
      );
      console.log(`Filtered subcategories for category ${formData.category_id}:`, filtered);
      setFilteredSubcategories(filtered);
      
      // Clear subcategory selection if current selection doesn't belong to selected category
      if (formData.subcategory_id) {
        const selectedSubBelongsToCategory = filtered.some(
          sub => sub.id === Number(formData.subcategory_id)
        );
        if (!selectedSubBelongsToCategory) {
          setFormData(prev => ({ ...prev, subcategory_id: "" }));
        }
      }
    } else {
      setFilteredSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory_id: "" }));
    }
  }, [formData.category_id, allSubcategories]);

  // ================= VALIDATION =================
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.test_name?.trim()) {
      errors.test_name = "Test name is required";
    }

    if (!formData.test_url?.trim()) {
      errors.test_url = "Test URL is required";
    } else if (!URL_PATTERN.test(formData.test_url)) {
      errors.test_url = "Test URL must start with http:// or https://";
    }

    if (!formData.preview_url?.trim()) {
      errors.preview_url = "Preview URL is required";
    } else if (!URL_PATTERN.test(formData.preview_url)) {
      errors.preview_url = "Preview URL must start with http:// or https://";
    }

    if (!formData.category_id) {
      errors.category_id = "Please select a category";
    }

    if (!formData.subcategory_id) {
      errors.subcategory_id = "Please select a subcategory";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ================= FORM HANDLERS =================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`);

    // Clear error for this field when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      test_name: "",
      test_url: "",
      preview_url: "",
      category_id: "",
      subcategory_id: "",
    });
    setFormErrors({});
    setFilteredSubcategories([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = async (test: Test) => {
    setError(null);
    if (categories.length === 0) await loadCategories();
    
    setFormData({
      test_name: test.test_name,
      test_url: test.test_url,
      preview_url: test.preview_url,
      category_id: test.category_id?.toString() || "",
      subcategory_id: test.subcategory_id?.toString() || "",
    });
    setEditingId(test.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const form = new FormData();
    form.append("test_name", formData.test_name.trim());
    form.append("test_url", formData.test_url.trim());
    form.append("preview_url", formData.preview_url.trim());
    form.append("category_id", formData.category_id);
    form.append("subcategory_id", formData.subcategory_id);
    if (editingId) form.append("id", editingId.toString());

    const url = editingId ? API_ENDPOINTS.UPDATE_TEST : API_ENDPOINTS.ADD_TEST;

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

      if (!result.success) {
        throw new Error(result.message || "Unknown server error");
      }

      alert("Test saved successfully!");
      resetForm();
      loadTests();
    } catch (err) {
      console.error("Failed to save test:", err);
      setError(handleApiError(err));
      alert(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this test?")) return;

    setError(null);

    const form = new FormData();
    form.append("id", id.toString());

    try {
      const res = await fetch(`${API_BASE_URL}/${API_ENDPOINTS.DELETE_TEST}`, {
        method: "POST",
        body: form,
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      loadTests();
    } catch (err) {
      console.error("Failed to delete test:", err);
      setError(handleApiError(err));
      alert("Could not delete test. Please try again.");
    }
  };

  // ================= FILTERING =================
  const filteredTests = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tests.filter(
      (t) =>
        !term ||
        t.test_name.toLowerCase().includes(term) ||
        t.category_name?.toLowerCase().includes(term) ||
        t.subcategory_name?.toLowerCase().includes(term),
    );
  }, [tests, searchTerm]);

  const clearFilters = () => {
    setSearchTerm("");
  };

  // ================= RENDER =================
  return (
    <div className="p-6" role="region" aria-label="Tests management">
      <h1 className="text-3xl font-bold mb-6">Tests Management</h1>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        aria-expanded={showForm}
        aria-controls="test-form"
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-6 transition"
      >
        {showForm ? "Cancel" : "Add Test"}
      </button>

      {showForm && (
        <form
          id="test-form"
          className="bg-white p-6 shadow rounded mb-6 border"
          onSubmit={handleSubmit}
          role="form"
          aria-label={editingId ? "Edit test" : "Add new test"}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <input
                name="test_name"
                placeholder="Test Name"
                value={formData.test_name}
                onChange={handleChange}
                className={`border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 w-full ${
                  formErrors.test_name ? "border-red-500" : ""
                }`}
                aria-invalid={!!formErrors.test_name}
                aria-describedby={
                  formErrors.test_name ? "test-name-error" : undefined
                }
              />
              {formErrors.test_name && (
                <p id="test-name-error" className="text-red-500 text-sm mt-1">
                  {formErrors.test_name}
                </p>
              )}
            </div>

            <div>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={`border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 w-full ${
                  formErrors.category_id ? "border-red-500" : ""
                }`}
                aria-invalid={!!formErrors.category_id}
                aria-describedby={
                  formErrors.category_id ? "category-error" : undefined
                }
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
              {formErrors.category_id && (
                <p id="category-error" className="text-red-500 text-sm mt-1">
                  {formErrors.category_id}
                </p>
              )}
            </div>

            <div>
              <select
                name="subcategory_id"
                value={formData.subcategory_id}
                onChange={handleChange}
                className={`border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 w-full ${
                  formErrors.subcategory_id ? "border-red-500" : ""
                }`}
                required
                disabled={loadingSubcategories || !formData.category_id}
                aria-invalid={!!formErrors.subcategory_id}
                aria-describedby={
                  formErrors.subcategory_id ? "subcategory-error" : undefined
                }
              >
                <option value="">
                  {loadingSubcategories
                    ? "Loading..."
                    : !formData.category_id
                      ? "Select Category first"
                      : filteredSubcategories.length === 0
                        ? "No subcategories for this category"
                        : `Select Subcategory (${filteredSubcategories.length} found)`}
                </option>
                {filteredSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subcategory_name}
                  </option>
                ))}
              </select>
              {formErrors.subcategory_id && (
                <p
                  id="subcategory-error"
                  className="text-red-500 text-sm mt-1"
                >
                  {formErrors.subcategory_id}
                </p>
              )}
            </div>

            <div>
              <input
                name="test_url"
                placeholder="Test URL (https://...)"
                value={formData.test_url}
                onChange={handleChange}
                className={`border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 w-full ${
                  formErrors.test_url ? "border-red-500" : ""
                }`}
                aria-invalid={!!formErrors.test_url}
                aria-describedby={
                  formErrors.test_url ? "test-url-error" : undefined
                }
              />
              {formErrors.test_url && (
                <p id="test-url-error" className="text-red-500 text-sm mt-1">
                  {formErrors.test_url}
                </p>
              )}
            </div>

            <div>
              <input
                name="preview_url"
                placeholder="YouTube URL (https://...)"
                value={formData.preview_url}
                onChange={handleChange}
                className={`border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 w-full ${
                  formErrors.preview_url ? "border-red-500" : ""
                }`}
                aria-invalid={!!formErrors.preview_url}
                aria-describedby={
                  formErrors.preview_url ? "preview-url-error" : undefined
                }
              />
              {formErrors.preview_url && (
                <p
                  id="preview-url-error"
                  className="text-red-500 text-sm mt-1"
                >
                  {formErrors.preview_url}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 mt-4 rounded transition disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving..."
              : editingId
                ? "Update Test"
                : "Add Test"}
          </button>
        </form>
      )}

      <div className="mb-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search tests, categories, subcategories..."
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            onClick={clearFilters}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">S.No</th>
              <th className="p-3 text-left">Test</th>
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
              filteredTests.map((test, index) => (
                <tr key={test.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{test.test_name}</td>
                  <td className="p-3">{test.category_name || "—"}</td>
                  <td className="p-3">{test.subcategory_name || "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      {test.test_url && (
                        <a
                          href={test.test_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open test: ${test.test_name}`}
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
                          aria-label={`Open preview for: ${test.test_name}`}
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

      {!loadingTests && filteredTests.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredTests.length} of {tests.length} tests
        </div>
      )}
    </div>
  );
}

export default Tests;