import React, { useEffect, useState } from "react";

const API_BASE = "https://xiadot.com/admin_maths/api";

/* ================= TYPES ================= */
type Exam = {
  id: number;
  exam_name: string;
};

type Category = {
  id: number;
  exam_name: string;
  category_name: string;
  image?: string;
};

const CategoryPage: React.FC = () => {
  /* ================= STATES ================= */
  const [exams, setExams] = useState<Exam[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [examId, setExamId] = useState("");
  const [categoryName, setCategoryName] = useState("");

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 🔥 NEW: modal image state
  const [showImage, setShowImage] = useState<string | null>(null);

  /* ================= LOAD EXAMS ================= */
  useEffect(() => {
    fetch(`${API_BASE}/exam.php?action=list`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setExams(json.data);
      });
  }, []);

  /* ================= LOAD CATEGORIES ================= */
  const loadCategories = () => {
    fetch(`${API_BASE}/get_Category.php?action=list`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategories(json.data);
      });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  /* ================= IMAGE CHANGE ================= */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  /* ================= ADD / UPDATE ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!examId || !categoryName) {
      alert("Select exam & enter category");
      return;
    }

    setLoading(true);

    const fd = new FormData();
    fd.append("exam_id", examId);
    fd.append("category", categoryName);

    if (image) fd.append("image", image);

    if (editingId) {
      fd.append("id", String(editingId));
      fd.append("action", "update");
    } else {
      fd.append("action", "create");
    }

    const res = await fetch(`${API_BASE}/get_Category.php`, {
      method: "POST",
      body: fd,
    });

    const json = await res.json();
    alert(json.message);

    // reset
    setEditingId(null);
    setCategoryName("");
    setExamId("");
    setImage(null);
    setPreview(null);
    setLoading(false);

    loadCategories();
  };

  /* ================= DELETE ================= */
  const deleteCategory = async (id: number) => {
    if (!window.confirm("Delete category?")) return;

    const fd = new FormData();
    fd.append("id", String(id));
    fd.append("action", "delete");

    await fetch(`${API_BASE}/get_Category.php`, {
      method: "POST",
      body: fd,
    });

    loadCategories();
  };

  /* ================= EDIT ================= */
  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setCategoryName(cat.category_name);

    const exam = exams.find((e) => e.exam_name === cat.exam_name);
    if (exam) setExamId(String(exam.id));

    if (cat.image) {
      setPreview(`https://xiadot.com/admin_maths/${cat.image}`);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Category Management</h2>

      {/* ===== FORM ===== */}
      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="mb-6 max-w-md"
      >
        <select
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          className="border p-2 w-full mb-3"
        >
          <option value="">Select Exam</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.exam_name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Category name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="border p-2 w-full mb-3"
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="border p-2 w-full mb-3"
        />

        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="h-24 mb-3 rounded border object-cover"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading
            ? "Saving..."
            : editingId
            ? "Update Category"
            : "Add Category"}
        </button>
      </form>

      {/* ===== LIST ===== */}
      <table className="border w-full max-w-4xl">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">Exam</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Image</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {categories.map((cat, i) => (
            <tr key={cat.id}>
              <td className="border p-2">{i + 1}</td>
              <td className="border p-2">{cat.exam_name}</td>
              <td className="border p-2">{cat.category_name}</td>

              {/* 🔥 IMAGE VIEW BUTTON */}
              <td className="border p-2 text-center">
                {cat.image ? (
                  <button
                    onClick={() =>
                      setShowImage(
                        `https://xiadot.com/admin_maths/${cat.image}`,
                      )
                    }
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    View
                  </button>
                ) : (
                  <span className="text-gray-400">No Image</span>
                )}
              </td>

              <td className="border p-2 space-x-3">
                <button
                  onClick={() => handleEdit(cat)}
                  className="text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔥 IMAGE MODAL */}
      {showImage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg relative max-w-lg w-full">
            <button
              onClick={() => setShowImage(null)}
              className="absolute top-2 right-2 text-red-600 font-bold text-xl"
            >
              ✕
            </button>

            <img
              src={showImage}
              alt="Category"
              className="w-full max-h-[80vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
