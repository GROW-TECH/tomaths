import React, { useEffect, useState } from "react";

const API_BASE = "https://xiadot.com/admin_maths/api";

// 🔁 change path if your API folder name is different

/* ================= TYPES ================= */
type Exam = {
  id: number;
  exam_name: string;
};

type Category = {
  id: number;
  exam_name: string;
  category_name: string;
};

const CategoryPage: React.FC = () => {
  /* ================= STATES ================= */
  const [exams, setExams] = useState<Exam[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [examId, setExamId] = useState("");
  const [categoryName, setCategoryName] = useState("");

  const [loading, setLoading] = useState(false);

  /* ================= LOAD EXAMS ================= */
  useEffect(() => {
    fetch(`${API_BASE}/exam.php?action=list`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setExams(json.data); // ✅ IMPORTANT FIX
        }
      })
      .catch((err) => console.error("Exam load error", err));
  }, []);

  /* ================= LOAD CATEGORIES ================= */
  const loadCategories = () => {
    fetch(`${API_BASE}/get_Category.php?action=list`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setCategories(json.data);
        }
      });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  /* ================= SUBMIT ================= */
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

    await fetch(`${API_BASE}/get_Category.php?action=create`, {
      method: "POST",
      body: fd,
    });

    setCategoryName("");
    setExamId("");
    setLoading(false);

    loadCategories();
    alert("Category added");
  };

  /* ================= DELETE ================= */
  const deleteCategory = async (id: number) => {
    if (!window.confirm("Delete category?")) return;

    const fd = new FormData();
    fd.append("id", String(id));

    await fetch(`${API_BASE}/get_Category.php?action=delete`, {
      method: "POST",
      body: fd,
    });

    loadCategories();
  };

  /* ================= UI ================= */
  return (
    <div className="p-6">

      <h2 className="text-xl font-bold mb-4">Category Management</h2>

      {/* ===== FORM ===== */}
      <form onSubmit={handleSubmit} className="mb-6 max-w-md">

        {/* EXAM DROPDOWN */}
        <select
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          className="border p-2 w-full mb-3"
          required
        >
          <option value="">Select Exam</option>

          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.exam_name}
            </option>
          ))}
        </select>

        {/* CATEGORY INPUT */}
        <input
          type="text"
          placeholder="Category name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="border p-2 w-full mb-3"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Saving..." : "Add Category"}
        </button>
      </form>

      {/* ===== LIST ===== */}
      <table className="border w-full max-w-3xl">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">Exam</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {categories.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center p-4">
                No categories found
              </td>
            </tr>
          )}

          {categories.map((cat, i) => (
            <tr key={cat.id}>
              <td className="border p-2">{i + 1}</td>
              <td className="border p-2">{cat.exam_name}</td>
              <td className="border p-2">{cat.category_name}</td>
              <td className="border p-2">
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

    </div>
  );
};

export default CategoryPage;
