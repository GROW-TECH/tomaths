import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, Search } from "lucide-react";

/* ================= API BASE ================= */
const API_BASE = import.meta.env.VITE_API_LINK;

/* ================= TYPES ================= */
interface Category {
  id: number;
  exam: string;
  category_name: string;
}

interface SubCategory {
  id: number;
  category_id: number;
  name: string;
  image: string | null;
  image_url: string | null;
  category_name?: string;
  exam?: string;
}

function SubCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ================= LOAD CATEGORIES ================= */
  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/get_Category.php?action=list`);
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Category API not JSON:", text);
        throw new Error("API not returning JSON");
      }

      if (data && data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      } else if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Category load error:", err);
      setCategories([]);
    }
  };

  /* ================= LOAD SUBCATEGORIES ================= */
  const loadSubCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/get_subCategory.php?action=list`);
      const text = await res.text();

      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("SubCategory API not JSON:", text);
        throw new Error("API not returning JSON");
      }

      let subCategoriesData: SubCategory[] = [];
      if (data && data.success && Array.isArray(data.data)) {
        subCategoriesData = data.data;
      } else if (Array.isArray(data)) {
        subCategoriesData = data;
      } else {
        setError(data?.message || "Failed to load subcategories");
        return;
      }

      // Join subcategories with categories to get category names
      const subCategoriesWithCategoryNames = subCategoriesData.map((sub) => {
        if (sub.category_name) {
          return sub;
        }
        const category = categories.find((cat) => cat.id === sub.category_id);
        return {
          ...sub,
          category_name: category ? category.category_name : "",
          exam: category ? category.exam : "",
        };
      });

      setSubCategories(subCategoriesWithCategoryNames);
      console.log("Loaded subcategories:", subCategoriesWithCategoryNames);
    } catch (err) {
      console.error("Load error:", err);
      setError("Server error (API not JSON)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      loadSubCategories();
    }
  }, [categories]);

  /* ================= HELPERS ================= */
  const resetForm = () => {
    setCategoryId("");
    setSubCategoryName("");
    setImageFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const handleFile = (file: File | null) => {
    setImageFile(file);
    if (preview) URL.revokeObjectURL(preview);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  /* ================= SUBMIT (CREATE / UPDATE) ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId || !subCategoryName) {
      alert("Category and SubCategory required");
      return;
    }

    setSubmitting(true);
    setError(null);

    const action = editingId ? "update" : "create";
    const formData = new FormData();
    formData.append("category_id", categoryId);
    formData.append("name", subCategoryName);
    if (imageFile) formData.append("image", imageFile);

    // Always include the ID for updates, using the field name the backend expects
    if (editingId) {
      formData.append("subcategory_id", editingId.toString());
      // Also include 'id' for backwards compatibility
      formData.append("id", editingId.toString());
    }

    // Build URL with action in query string (most backends read action from $_GET)
    const url = `${API_BASE}/get_subCategory.php?action=${action}`;

    try {
      console.log(`Sending ${action} request to ${url}`);
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      console.log("Raw response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response");
      }

      if (data?.success) {
        resetForm();
        await loadSubCategories();
        alert(
          editingId
            ? "SubCategory updated successfully!"
            : "SubCategory created successfully!",
        );
      } else {
        setError(data?.message || "Save failed");
        alert(`Save failed: ${data?.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Network or server error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (sub: SubCategory) => {
    console.log("Editing subcategory:", sub);
    setError(null);
    setCategoryId(String(sub.category_id));
    setSubCategoryName(sub.name);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(sub.image_url || null);
    setEditingId(sub.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this subcategory?")) return;

    try {
      const formData = new FormData();
      formData.append("id", id.toString());
      formData.append("subcategory_id", id.toString()); // backend compatibility
      formData.append("action", "delete");

      const res = await fetch(`${API_BASE}/get_subCategory.php?action=delete`, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      console.log("Delete response:", text);

      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Delete API not JSON:", text);
        throw new Error("API not returning JSON");
      }

      if (!data || !data.success) {
        alert(data?.message || "Delete failed");
        return;
      }

      setSubCategories((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete failed (API error)");
    }
  };

  /* ================= FILTER ================= */
  const filtered = subCategories.filter((s) => {
    const name = s.name?.toLowerCase() || "";
    const cat = s.category_name?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return name.includes(term) || cat.includes(term);
  });

  /* ================= UI ================= */
  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">SubCategory Management</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setError(null);
              setShowForm(true);
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
        >
          {showForm ? (
            <>
              <X size={18} /> Cancel
            </>
          ) : (
            <>
              <Plus size={18} /> Add SubCategory
            </>
          )}
        </button>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200"
        >
          <div className="col-span-full">
            <h2 className="text-xl font-semibold mb-2">
              {editingId ? "Edit SubCategory" : "Create New SubCategory"}
            </h2>
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name} {cat.exam ? `(${cat.exam})` : ""}
              </option>
            ))}
          </select>

          <input
            placeholder="SubCategory Name"
            value={subCategoryName}
            onChange={(e) => setSubCategoryName(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
              className="border p-2 rounded w-full"
            />
          </div>

          {preview && (
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
              <img
                src={preview}
                className="w-32 h-32 object-cover rounded border"
                alt="Preview"
              />
            </div>
          )}

          <div className="col-span-full flex gap-3 mt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-green-700 transition disabled:opacity-50"
            >
              <Save size={18} />
              {submitting
                ? "Saving..."
                : editingId
                  ? "Update SubCategory"
                  : "Create SubCategory"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* SEARCH */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          placeholder="Search subcategory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 pl-10 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading subcategories...</p>
        </div>
      )}

      {/* GRID */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">No subcategories found</p>
              {searchTerm && (
                <p className="text-gray-400 mt-2">
                  Try a different search term
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Showing {filtered.length} of {subCategories.length}{" "}
                subcategories
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((sub) => (
                  <div
                    key={sub.id}
                    className="border rounded-lg shadow p-3 bg-white hover:shadow-lg transition"
                  >
                    {/* IMAGE DISPLAY */}
                    {(() => {
                      const imageUrl = sub.image_url || sub.image;
                      if (imageUrl) {
                        return (
                          <img
                            src={imageUrl}
                            className="w-full h-40 object-cover rounded mb-2"
                            alt={sub.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "https://via.placeholder.com/300x200?text=Image+Not+Found";
                            }}
                          />
                        );
                      } else {
                        return (
                          <div className="w-full h-40 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        );
                      }
                    })()}

                    <h3 className="font-bold text-lg truncate">{sub.name}</h3>
                    <p className="text-sm text-gray-600 truncate">
                      {sub.category_name || "No Category"}
                      {sub.exam && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({sub.exam})
                        </span>
                      )}
                    </p>
                    {/* <p className="text-xs text-gray-400">
                      ID: {sub.id} | Cat ID: {sub.category_id}
                    </p> */}

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(sub)}
                        className="flex-1 bg-blue-500 text-white p-2 rounded flex items-center justify-center gap-1 hover:bg-blue-600 transition"
                      >
                        <Edit2 size={16} /> Edit
                      </button>

                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="flex-1 bg-red-600 text-white p-2 rounded flex items-center justify-center gap-1 hover:bg-red-700 transition"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default SubCategoryPage;
