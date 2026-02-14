import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Save, X, Loader } from "lucide-react";

const API = "https://xiadot.com/admin_maths/api";

/* ================= TYPES ================= */
type Category = { id: string; category_name: string };
type SubCategory = { id: string; category_id: string; name: string };
type Exam = { id: string; exam_name: string };

type Course = {
  id: number;
  course_name: string;
  price: string;
  actual_price?: string;
  duration?: string;
  description?: string;
  highlights?: string[];
  category_id?: string;
  category_name?: string;
  subcategory_id?: string;
  subcategory_name?: string;
  exam_id?: string;
  exam_name?: string;
  image?: string;
  image_url?: string;
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubCategories] = useState<SubCategory[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [newHighlight, setNewHighlight] = useState("");

  const [formData, setFormData] = useState({
    course_name: "",
    price: "",
    actual_price: "",
    duration_value: "",
    duration_unit: "Days",
    description: "",
    category_id: "",
    subcategory_id: "",
    exam_id: "",
    image: null as File | null,
    highlights: [] as string[],
  });

  /* ================= IMAGE HELPER ================= */
  const getImageUrl = (course: Course): string => {
    if (course.image_url) return course.image_url;
    if (course.image)
      return `https://xiadot.com/admin_maths/uploads/${course.image}`;
    return "https://xiadot.com/admin_maths/uploads/default.png";
  };

  /* ================= LOAD INITIAL DATA ================= */
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [courseRes, catRes, examRes] = await Promise.all([
        axios.get(`${API}/courses.php?action=list`),
        axios.get(`${API}/get_Category.php?action=list`),
        axios.get(`${API}/exam.php?action=list`),
      ]);
      setCourses(courseRes.data.data || []);
      setCategories(catRes.data.data || []);
      setExams(examRes.data.data || []);
    } catch (err) {
      setError("Failed to load data. Please refresh.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOAD SUB‑CATEGORIES ================= */
  const loadSubCategories = async (category_id: string) => {
    if (!category_id) {
      setSubCategories([]);
      return;
    }
    try {
      const res = await axios.get(
        `${API}/get_subCategory.php?action=list&category_id=${category_id}`,
      );
      setSubCategories(res.data.data || []);
    } catch (err) {
      console.error("Failed to load subcategories", err);
      setError("Failed to load subcategories");
    }
  };

  /* ================= LOAD EXAMS ================= */
  const loadExams = async (subcategory_id: string) => {
    if (!subcategory_id) {
      setExams([]);
      return;
    }
    try {
      const res = await axios.get(
        `${API}/exam.php?action=list&subcategory_id=${subcategory_id}`,
      );
      setExams(res.data.data || []);
    } catch (err) {
      console.error("Failed to load exams", err);
      setError("Failed to load exams");
    }
  };

  /* ================= FORM CHANGE ================= */
  const handleChange = async (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "category_id") {
      setFormData((prev) => ({
        ...prev,
        category_id: value,
        subcategory_id: "",
        exam_id: "",
      }));
      setExams([]);
      await loadSubCategories(value);
      return;
    }

    if (name === "subcategory_id") {
      setFormData((prev) => ({
        ...prev,
        subcategory_id: value,
        exam_id: "",
      }));
      setExams([]);
      await loadExams(value);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= HIGHLIGHTS ================= */
  const addHighlight = () => {
    if (newHighlight.trim()) {
      setFormData((prev) => ({
        ...prev,
        highlights: [...prev.highlights, newHighlight.trim()],
      }));
      setNewHighlight("");
    }
  };

  const removeHighlight = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  /* ================= IMAGE CHANGE ================= */
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.course_name.trim()) {
      alert("Course name is required");
      return;
    }

    const fd = new FormData();

    // Append normal fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "highlights") return;

      if (value !== null && value !== "") {
        fd.append(key, value as any);
      }
    });

    // 🔥 VERY IMPORTANT — send duration parts
    fd.append("duration_value", formData.duration_value);
    fd.append("duration_unit", formData.duration_unit);

    // 🔥 Send highlights as JSON
    fd.append("highlights", JSON.stringify(formData.highlights));

    if (editingId) {
      fd.append("id", String(editingId));
    }

    setLoading(true);
    setError(null);

    try {
      const url = editingId
        ? `${API}/update_course.php`
        : `${API}/add_course.php`;

      await axios.post(url, fd);

      resetForm();
      await loadAll();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this course?")) return;

    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("id", String(id));
      await axios.post(`${API}/delete_course.php`, fd);
      await loadAll();
    } catch (err) {
      setError("Failed to delete course.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = async (c: Course) => {
    // Parse duration
    let duration_value = "";
    let duration_unit = "Days";
    if (c.duration) {
      const parts = c.duration.split(" ");
      duration_value = parts[0] || "";
      duration_unit = parts[1] || "Days";
    }

    // Load dependent dropdowns
    if (c.category_id) {
      await loadSubCategories(c.category_id);
    }
    if (c.subcategory_id) {
      await loadExams(c.subcategory_id);
    }

    setFormData({
      course_name: c.course_name || "",
      price: c.price || "",
      actual_price: c.actual_price || "",
      duration_value,
      duration_unit,
      description: c.description || "",
      category_id: String(c.category_id || ""),
      subcategory_id: String(c.subcategory_id || ""),
      exam_id: String(c.exam_id || ""),
      image: null,
      highlights: Array.isArray(c.highlights) ? c.highlights : [],
    });

    setPreviewImage(getImageUrl(c));
    setEditingId(c.id);
    setShowForm(true);
  };

  /* ================= RESET ================= */
  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setPreviewImage(null);
    setNewHighlight("");
    setSubCategories([]);
    setExams([]);

    setFormData({
      course_name: "",
      price: "",
      actual_price: "",
      duration_value: "",
      duration_unit: "Days",
      description: "",
      category_id: "",
      subcategory_id: "",
      exam_id: "",
      image: null,
      highlights: [],
    });
  };

  /* ================= UI ================= */
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Courses</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Close" : "Add Course"}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
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
            {editingId ? "Edit Course" : "New Course"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Course Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Course Name *
              </label>
              <input
                name="course_name"
                value={formData.course_name}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Subcategory
              </label>
              <select
                name="subcategory_id"
                value={formData.subcategory_id}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                disabled={!formData.category_id}
              >
                <option value="">Select Subcategory</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Exam */}
            <div>
              <label className="block text-sm font-medium mb-1">Exam</label>
              <select
                name="exam_id"
                value={formData.exam_id}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                disabled={!formData.subcategory_id}
              >
                <option value="">Select Exam</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.exam_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            {/* Actual Price */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Actual Price
              </label>
              <input
                name="actual_price"
                value={formData.actual_price}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            {/* Duration Value & Unit */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Duration
                </label>
                <input
                  name="duration_value"
                  type="number"
                  value={formData.duration_value}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                  placeholder="e.g. 30"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select
                  name="duration_unit"
                  value={formData.duration_unit}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option>Days</option>
                  <option>Hrs</option>
                  <option>Months</option>
                  <option>Years</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="border p-2 rounded w-full"
              />
            </div>

            {/* Highlights */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Highlights
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="e.g. 24/7 Support"
                  className="border p-2 rounded flex-1"
                />
                <button
                  type="button"
                  onClick={addHighlight}
                  className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1"
                >
                  <Plus size={18} /> Add
                </button>
              </div>
              <div className="space-y-1">
                {formData.highlights.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-100 p-2 rounded"
                  >
                    <span>{h}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Course Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="border p-2 rounded w-full"
              />
              {previewImage && (
                <div className="mt-2">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="h-32 w-auto rounded border object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex justify-end gap-2 mt-6">
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
              {editingId ? "Update Course" : "Save Course"}
            </button>
          </div>
        </form>
      )}

      {/* ================= COURSE LIST ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => (
          <div key={c.id} className="border rounded shadow overflow-hidden">
            <img
              src={getImageUrl(c)}
              alt={c.course_name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{c.course_name}</h3>
              {c.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {c.description}
                </p>
              )}

              {/* Highlights */}
              {Array.isArray(c.highlights) && c.highlights.length > 0 && (
                <div className="mb-2">
                  <span className="text-sm font-semibold">Highlights:</span>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {c.highlights.slice(0, 3).map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                    {c.highlights.length > 3 && (
                      <li>+{c.highlights.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}

              {c.duration && (
                <p className="text-sm text-gray-500">Duration: {c.duration}</p>
              )}

              {/* Price */}
              <div className="mt-2 flex items-center gap-2">
                {Number(c.actual_price) > 0 && (
                  <span className="text-gray-400 line-through text-sm">
                    ₹{Number(c.actual_price).toLocaleString()}
                  </span>
                )}
                {Number(c.price) > 0 && (
                  <span className="text-green-600 text-xl font-bold">
                    ₹{Number(c.price).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(c)}
                  className="flex-1 bg-blue-500 text-white py-2 rounded flex items-center justify-center gap-1 hover:bg-blue-600"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded flex items-center justify-center gap-1 hover:bg-red-700"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && !loading && (
        <p className="text-center text-gray-500 py-8">No courses found.</p>
      )}
    </div>
  );
}
