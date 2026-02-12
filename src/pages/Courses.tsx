import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";

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

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    course_name: "",
    price: "",
    actual_price: "",
    duration: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    exam_id: "",
    image: null as File | null,
  });

  /* ================= IMAGE ================= */

  const getImage = (course: Course) => {
    if (course.image_url) return course.image_url;
    if (course.image)
      return `https://xiadot.com/admin_maths/uploads/${course.image}`;
    return "https://xiadot.com/admin_maths/uploads/default.png";
  };

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      loadSubCategories(formData.category_id);
    }
  }, [formData.category_id]);

  const loadAll = async () => {
    const [courseRes, catRes, examRes] = await Promise.all([
      axios.get(`${API}/courses.php?action=list`),
      axios.get(`${API}/get_Category.php?action=list`),
      axios.get(`${API}/exam.php?action=list`),
    ]);

    console.log("====================================");
    console.log("courses", courseRes);
    console.log("category", catRes);
    console.log("subcategory", examRes);
    console.log("====================================");
    console.log(courses);
    setCourses(courseRes.data.data || []);
    setCategories(catRes.data.data || []);
    setExams(examRes.data.data || []);
  };

  /* ================= LOAD SUBCATEGORY ================= */

  const loadSubCategories = async (category_id: string) => {
    if (!category_id) {
      setSubCategories([]);
      return;
    }

    const res = await axios.get(
      `${API}/get_subCategory.php?action=list&category_id=${category_id}`,
    );

    setSubCategories(res.data.data || []);
  };


  const loadExams = async (subcategory_id: string) => {
  if (!subcategory_id) return;

  const res = await axios.get(
    `${API}/exam.php?action=list&subcategory_id=${subcategory_id}`
  );

  setExams(res.data.data || []);
};


  /* ================= FORM CHANGE ================= */
const handleChange = async (
  e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;

  if (name === "category_id") {
    setFormData((prev) => ({
      ...prev,
      category_id: value,
      subcategory_id: "",
      exam_id: "",
    }));

    await loadSubCategories(value);
    return;
  }

  if (name === "subcategory_id") {
    setFormData((prev) => ({
      ...prev,
      subcategory_id: value,
      exam_id: "",
    }));

    await loadExams(value);
    return;
  }

  setFormData((prev) => ({ ...prev, [name]: value }));
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

    const fd = new FormData();

    Object.entries(formData).forEach(([k, v]) => {
      if (v !== null && v !== "") {
        fd.append(k, v as any);
      }
    });

    if (editingId) {
      fd.append("id", String(editingId));
      await axios.post(`${API}/update_course.php`, fd);
    } else {
      await axios.post(`${API}/add_course.php`, fd);
    }

    resetForm();
    loadAll();
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this course?")) return;

    const fd = new FormData();
    fd.append("id", String(id));

    await axios.post(`${API}/delete_course.php`, fd);
    loadAll();
  };

  /* ================= EDIT ================= */

const handleEdit = async (c: Course) => {
  setShowForm(true);
  setEditingId(c.id);

  const categoryId = String(c.category_id || "");
  const subcategoryId = String(c.subcategory_id || "");

  // Load subcategories first
  if (categoryId) {
    await loadSubCategories(categoryId);
  }

  // Load exams next
  if (subcategoryId) {
    await loadExams(subcategoryId);
  }

  setFormData({
    course_name: c.course_name || "",
    price: c.price || "",
    actual_price: c.actual_price || "",
    duration: c.duration || "",
    description: c.description || "",
    category_id: categoryId,
    subcategory_id: subcategoryId,
    exam_id: String(c.exam_id || ""),
    image: null,
  });

  setPreviewImage(getImage(c));
};

  /* ================= RESET ================= */

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setPreviewImage(null);

    setFormData({
      course_name: "",
      price: "",
      actual_price: "",
      duration: "",
      description: "",
      category_id: "",
      subcategory_id: "",
      exam_id: "",
      image: null,
    });
  };

  /* ================= UI ================= */

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Courses</h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2"
        >
          {showForm ? <X /> : <Plus />} Add Course
        </button>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow mb-6"
        >
          <input
            name="course_name"
            value={formData.course_name}
            onChange={handleChange}
            placeholder="Course Name"
            className="border p-2 rounded w-full mb-3"
          />

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Course Description"
            className="border p-2 rounded w-full mb-3"
          />

          {/* CATEGORY */}
          <select
            name="category_id"
            value={formData.category_id || ""}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-3"
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.category_name}
              </option>
            ))}
          </select>

          {/* SUBCATEGORY */}
          <select
            name="subcategory_id"
            value={formData.subcategory_id || ""}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-3"
          >
            <option value="">Select SubCategory</option>
            {subcategories.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>

          {/* EXAM */}
          <select
            name="exam_id"
            value={formData.exam_id || ""}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-3"
          >
            <option value="">Select Exam</option>
            {exams.map((e) => (
              <option key={e.id} value={String(e.id)}>
                {e.exam_name}
              </option>
            ))}
          </select>

          <input
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="Duration"
            className="border p-2 rounded w-full mb-3"
          />

          <input
            name="actual_price"
            value={formData.actual_price}
            onChange={handleChange}
            placeholder="Actual Price"
            className="border p-2 rounded w-full mb-3"
          />

          <input
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Offer Price"
            className="border p-2 rounded w-full mb-3"
          />

          <input type="file" onChange={handleImageChange} />

          {previewImage && (
            <img
              src={previewImage}
              className="mt-3 h-32 rounded border object-cover"
            />
          )}

          <button className="bg-green-600 text-white px-4 py-2 rounded mt-3 flex gap-2">
            <Save size={18} /> {editingId ? "Update Course" : "Save Course"}
          </button>
        </form>
      )}

      {/* ================= COURSE LIST ================= */}

      <div className="grid md:grid-cols-3 gap-4">
        {courses.map((c) => {
          const actual = Number(c.actual_price || 0);
          const offer = Number(c.price || 0);

          return (
            <div key={c.id} className="border p-4 rounded shadow">
              <img
                src={getImage(c)}
                className="h-40 w-full object-cover rounded mb-2"
              />

              <h3 className="font-bold">{c.course_name}</h3>

              {c.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                  {c.description}
                </p>
              )}

              {c.duration && (
                <p className="text-sm text-gray-500">Duration : {c.duration}</p>
              )}

              <div className="mt-2 flex items-center gap-2">
                {actual > 0 && (
                  <span className="text-gray-400 line-through text-sm">
                    ₹{actual.toLocaleString()}
                  </span>
                )}

                {offer > 0 && (
                  <span className="text-green-600 text-xl font-bold">
                    ₹{offer.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleEdit(c)}
                  className="flex-1 bg-blue-500 text-white p-2 rounded flex items-center justify-center gap-1"
                >
                  <Edit2 size={16} /> Edit
                </button>

                <button
                  onClick={() => handleDelete(c.id)}
                  className="flex-1 bg-red-600 text-white p-2 rounded flex items-center justify-center gap-1"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
