import { useEffect, useState, FormEvent } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Save, X, Loader } from "lucide-react";

const API = import.meta.env.VITE_API_LINK;

/* ================= TYPES ================= */
type ExamTitle = {
  id: number;
  exam_title: string;
  created_at?: string;
  updated_at?: string;
};

export default function ExamTitlePage() {
  const [examTitles, setExamTitles] = useState<ExamTitle[]>([]);
  const [examTitle, setExamTitle] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* ================= LOAD DATA ================= */
  const loadExamTitles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/exam_titles.php?action=list`);
      if (res.data.success) {
        setExamTitles(res.data.data || []);
      } else {
        setError(res.data.message || "Failed to load exam titles");
      }
    } catch (err) {
      console.error(err);
      setError("Network error loading exam titles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamTitles();
  }, []);

  /* ================= RESET FORM ================= */
  const resetForm = () => {
    setEditingId(null);
    setExamTitle("");
    setShowForm(false);
  };

  /* ================= SUBMIT (CREATE / UPDATE) ================= */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!examTitle.trim()) {
      setError("Exam title is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    fd.append("action", editingId ? "update" : "create");
    fd.append("exam_title", examTitle);
    if (editingId) fd.append("id", String(editingId));

    try {
      const res = await axios.post(`${API}/exam_titles.php`, fd);
      if (res.data.success) {
        setSuccess(res.data.message || "Saved successfully");
        resetForm();
        loadExamTitles();
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setError(res.data.message || "Error saving data");
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this exam title?")) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    fd.append("action", "delete");
    fd.append("id", String(id));

    try {
      const res = await axios.post(`${API}/exam_titles.php`, fd);
      if (res.data.success) {
        setSuccess(res.data.message || "Deleted successfully");
        loadExamTitles();
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setError(res.data.message || "Error deleting");
      }
    } catch (err) {
      console.error(err);
      setError("Network error deleting");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (item: ExamTitle) => {
    setEditingId(item.id);
    setExamTitle(item.exam_title);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Exam Titles</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Close" : "Add Exam Title"}
        </button>
      </div>

      {/* Error / Success messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-700 font-bold"
          >
            <X size={18} />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-700 font-bold"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Global loading spinner */}
      {loading && (
        <div className="flex justify-center items-center py-4">
          <Loader className="animate-spin" size={24} />
          <span className="ml-2">Loading...</span>
        </div>
      )}

      {/* ================= FORM ================= */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow mb-8 border"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Exam Title" : "New Exam Title"}
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Exam Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Enter exam title"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              <Save size={18} />
              {editingId ? "Update" : "Save"}
            </button>
          </div>
        </form>
      )}

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded shadow overflow-hidden border">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                S.No
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                Exam Title
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {examTitles.length > 0 ? (
              examTitles.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4">{item.exam_title}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No exam titles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
