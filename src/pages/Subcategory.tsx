import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, Search } from "lucide-react";

/* ================= API BASE ================= */
const API_BASE = "https://xiadot.com/admin_maths/api";

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

  /* ================= LOAD CATEGORY ================= */
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

  /* ================= LOAD SUBCATEGORY ================= */
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

      if (data && data.success && Array.isArray(data.data)) {
        setSubCategories(data.data);
      } else if (Array.isArray(data)) {
        setSubCategories(data);
      } else {
        setError(data?.message || "Failed to load subcategories");
      }
    } catch (err) {
      console.error("Load error:", err);
      setError("Server error (API not JSON)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadSubCategories();
  }, []);

  /* ================= HELPERS ================= */
  const resetForm = () => {
    setCategoryId("");
    setSubCategoryName("");
    setImageFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setEditingId(null);
    setShowForm(false);
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

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId || !subCategoryName) {
      alert("Category and SubCategory required");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("category_id", categoryId);
    formData.append("name", subCategoryName);
    if (imageFile) formData.append("image", imageFile);
    if (editingId) formData.append("id", editingId.toString());

    try {
      const url = editingId
        ? `${API_BASE}/get_subCategory.php?action=update`
        : `${API_BASE}/get_subCategory.php?action=create`;

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();

      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Submit API not JSON:", text);
        throw new Error("API not returning JSON");
      }

      if (!data || !data.success) {
        alert(data?.message || "Save failed");
        return;
      }

      resetForm();
      await loadSubCategories();
    } catch (err) {
      console.error("Submit error:", err);
      alert("Save failed (API error)");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (sub: SubCategory) => {
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
      const fd = new FormData();
      fd.append("id", id.toString());

      const res = await fetch(`${API_BASE}/get_subCategory.php?action=delete`, {
        method: "POST",
        body: fd,
      });

      const text = await res.text();

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
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
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

      {/* FORM */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border p-2 rounded"
            required
          >
            <option value="">Select Category</option>
             {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name} ({cat.exam})
              </option>
            ))} 
            
          </select>

          <input
            placeholder="SubCategory Name"
            value={subCategoryName}
            onChange={(e) => setSubCategoryName(e.target.value)}
            className="border p-2 rounded"
            required
          />

          <input
            type="file"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
            className="border p-2 rounded"
          />

          {preview && (
            <img
              src={preview}
              className="w-32 h-32 object-cover rounded border"
              alt="Preview"
            />
          )}

          <div className="col-span-full flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 text-white px-6 py-2 rounded flex items-center gap-2"
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
              className="bg-gray-500 text-white px-6 py-2 rounded"
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
          className="border p-2 pl-10 w-full rounded"
        />
      </div>

      {/* LOADING */}
      {loading && <p>Loading subcategories...</p>}

      {/* ERROR */}
      {error && <p className="text-red-600 mb-3">{error}</p>}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((sub) => (
          <div
            key={sub.id}
            className="border rounded-lg shadow p-3 bg-white hover:shadow-lg transition"
          >
            {sub.image_url ? (
              <img
                src={sub.image_url}
                className="w-full h-40 object-cover rounded mb-2"
                alt={sub.name}
              />
            ) : (
              <div className="w-full h-40 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}

            <h3 className="font-bold text-lg">{sub.name}</h3>
            <p className="text-sm text-gray-500">
              Category: {sub.category_name}
            </p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleEdit(sub)}
                className="flex-1 bg-blue-500 text-white p-2 rounded flex items-center justify-center gap-1"
              >
                <Edit2 size={16} /> Edit
              </button>

              <button
                onClick={() => handleDelete(sub.id)}
                className="flex-1 bg-red-600 text-white p-2 rounded flex items-center justify-center gap-1"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SubCategoryPage;
