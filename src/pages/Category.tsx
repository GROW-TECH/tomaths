import React, { useEffect, useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_LINK;

/* ================= TYPES ================= */
type Course = {
  id: number;
  course_name: string;
};

type Category = {
  id: number;
  course_id: number;
  course_name?: string;
  category_name: string;
  image?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
};

const CategoryPage: React.FC = () => {
  /* ================= STATES ================= */
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [courseId, setCourseId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showImage, setShowImage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const blobUrlRef = useRef<string | null>(null);

  /* ================= CLEANUP ================= */
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  /* ================= URL NORMALIZER (FIX) ================= */
  const normalizeImageUrl = (url: string) => {
    let u = (url || "").trim();

    // convert windows slashes
    u = u.replace(/\\/g, "/");

    // remove "/../" patterns
    u = u.replace(/\/\.\.\//g, "/");

    // remove duplicate "uploads/categories/" if repeated
    u = u.replace(/(uploads\/categories\/)+/g, "uploads/categories/");

    // remove double slashes except after https:
    u = u.replace(/([^:]\/)\/+/g, "$1");

    return u;
  };

  /* ================= IMAGE URL ================= */
  const getImageUrl = (cat: Category): string | null => {
    if (cat.image_url && cat.image_url.trim() !== "") {
      return normalizeImageUrl(cat.image_url);
    }
    return null;
  };

  /* ================= LOAD COURSES ================= */
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch(`${API_BASE}/get_courses.php?action=list`);
        const json = await response.json();
        if (json.success && Array.isArray(json.courses)) {
          setCourses(json.courses);
        } else {
          setError(json.message || "Failed to load courses");
        }
      } catch {
        setError("Network error loading courses");
      }
    };
    loadCourses();
  }, []);

  /* ================= LOAD CATEGORIES ================= */
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/get_Category.php?action=list`);
      const json = await response.json();

      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
      } else {
        setError(json.message || "Failed to load categories");
      }
    } catch {
      setError("Network error loading categories");
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  /* ================= IMAGE CHANGE ================= */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    setImage(file);
    const blob = URL.createObjectURL(file);
    blobUrlRef.current = blob;
    setPreview(blob);
    setError(null);
  };

  /* ================= RESET FORM ================= */
  const resetForm = () => {
    setEditingId(null);
    setCategoryName("");
    setCourseId("");
    setImage(null);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPreview(null);
  };

  /* ================= ADD / UPDATE ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName) {
      setError("Please select a course and enter category name");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    fd.append("action", editingId ? "update" : "create");
    if (editingId) fd.append("id", String(editingId));
    fd.append("course_id", courseId);
    fd.append("category", categoryName);
    if (image) fd.append("image", image);

    try {
      const res = await fetch(`${API_BASE}/get_Category.php`, {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (json.success) {
        setSuccess(json.message || "Category saved successfully");
        resetForm();
        await loadCategories();
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setError(json.message || "Error saving category");
      }
    } catch {
      setError("Network error: Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteCategory = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    const fd = new FormData();
    fd.append("action", "delete");
    fd.append("id", String(id));

    try {
      const res = await fetch(`${API_BASE}/get_Category.php`, {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (json.success) {
        setSuccess(json.message || "Category deleted successfully");
        await loadCategories();
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setError(json.message || "Error deleting category");
      }
    } catch {
      setError("Error deleting category");
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setCategoryName(cat.category_name);
    setCourseId(String(cat.course_id || ""));
    setPreview(getImageUrl(cat));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ================= IMAGE VIEW ================= */
  const openImageModal = (cat: Category) => {
    const url = getImageUrl(cat);
    if (url) {
      setModalError(null);
      setShowImage(url);
    }
  };

  const openImageInNewTab = (cat: Category) => {
    const url = getImageUrl(cat);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>Error: {error}</span>
            <button
              onClick={() => {
                setError(null);
                setSuccess(null);
              }}
              className="text-red-500 hover:text-red-700 font-bold text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex justify-between items-center">
            <span>{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-500 hover:text-green-700 font-bold text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">
            {editingId ? "✏️ Edit Category" : "➕ Add New Category"}
          </h2>

          <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-5">
          
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Image
              </label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full" />
            </div>

            {preview && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <img src={preview} alt="Preview" className="h-32 w-32 object-cover rounded-lg border" />
              </div>
            )}

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:bg-blue-300"
              >
                {loading ? "Saving..." : editingId ? "Update Category" : "Add Category"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">S.No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Image</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {categories.length > 0 ? (
                  categories.map((cat, index) => {
                    const url = getImageUrl(cat);
                    return (
                      <tr key={cat.id}>
                        <td className="px-6 py-4">{index + 1}</td>
                        <td className="px-6 py-4">{cat.category_name}</td>
                        <td className="px-6 py-4">
                          {url ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openImageModal(cat)}
                                className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg"
                              >
                                👁️ View
                              </button>
                              <button
                                onClick={() => openImageInNewTab(cat)}
                                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg"
                                title="Open in new tab"
                              >
                                🔗
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No Image</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(cat.created_at)}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleEdit(cat)} className="text-blue-600 mr-3">
                            ✏️ Edit
                          </button>
                          <button onClick={() => deleteCategory(cat.id)} className="text-red-600">
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowImage(null);
              setModalError(null);
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowImage(null);
                  setModalError(null);
                }}
                className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
              >
                ✕
              </button>

              <div className="p-4">
                {!modalError ? (
                  <img
                    src={showImage}
                    alt="Category"
                    className="w-full max-h-[80vh] object-contain rounded-lg"
                    onError={() => setModalError(`Image Failed to Load: ${showImage}`)}
                  />
                ) : (
                  <div className="text-center p-8">
                    <p className="text-lg font-semibold text-red-600 mb-2">❌ Image Failed to Load</p>
                    <p className="text-sm text-gray-700 break-all mb-3">{modalError}</p>
                    <button
                      onClick={() => window.open(showImage, "_blank", "noopener,noreferrer")}
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Try Opening in New Tab
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;