// =========================
// Courses.tsx  (DB Integrated Version - Fixed Imports)
// =========================

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import axios from "axios";


/* ---------- Types ---------- */
type Course = {
  id: number;
  course_name: string;
  description?: string;
  price: string;
  duration?: string;
  category_id?: string;
  subcategory_id?: string;
  exam_id?: string;
};

type CourseFormData = {
  course_name: string;
  description: string;
  price: string;
  duration: string;
};

type Category = { id: string; name: string };
type SubCategory = { id: string; name: string; category_id: string };
type Exam = { id: string; name: string; subcategory_id: string };

type ExtendedCourseForm = CourseFormData & {
  category_id: string;
  subcategory_id: string;
  exam_id: string;
};

function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubCategories] = useState<SubCategory[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
const [selectedCategory, setSelectedCategory] = useState("");
const [selectedCourse, setSelectedCourse] = useState("");

  const [formData, setFormData] = useState<ExtendedCourseForm>({
    course_name: "",
    description: "",
    price: "",
    duration: "",
    category_id: "",
    subcategory_id: "",
    exam_id: "",
  });

  /* ---------- API BASE ---------- */
  const API = "https://xiadot.com/admin_maths/api"; // change to your backend URL

  /* ---------- Loaders ---------- */
  const loadCourses = async () => {
  const res = await axios.get(`${API}/courses.php?action=list`);
  setCourses(Array.isArray(res.data.data) ? res.data.data : []);
};


 const loadCategories = async () => {
  const res = await axios.get(`${API}/get_Category.php?action=list`);
  setCategories(Array.isArray(res.data.data) ? res.data.data : []);
};


  const loadSubCategories = async () => {
  const res = await axios.get(`${API}/get_subCategory.php?action=list`);
  setSubCategories(Array.isArray(res.data.data) ? res.data.data : []);
};



const loadExams = async () => {
  const res = await axios.get(`${API}/exam.php?action=list`);
  setExams(Array.isArray(res.data.data) ? res.data.data : []);
};


  useEffect(() => {
    loadCourses();
    loadCategories();
    loadSubCategories();
    loadExams();
  }, []);

//   const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//   const categoryId = e.target.value;
//   setSelectedCategory(categoryId);

//   const filtered = courses.filter(
//     (course) => String(course.category_id) === String(categoryId)
//   );

//   setFilteredCourses(filtered);
// };
// ✅ EXAM FILTER HANDLER
const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const examId = e.target.value;

  const filtered = courses.filter(
    (course) => String(course.exam_id) === String(examId)
  );

  setFilteredCourses(filtered);
};


  /* ---------- Handlers ---------- */
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      course_name: "",
      description: "",
      price: "",
      duration: "",
      category_id: "",
      subcategory_id: "",
      exam_id: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.course_name || !formData.price || !formData.exam_id) {
      alert("Fill all required fields");
      return;
    }

    const payload = {
      course_name: formData.course_name,
      description: formData.description,
      price: formData.price,
      duration: formData.duration,
      category_id: formData.category_id,
      subcategory_id: formData.subcategory_id,
      exam_id: formData.exam_id,
    };

    if (editingId) {
      await axios.post(`${API}/update_course.php`, {
        id: editingId,
        ...payload,
      });
    } else {
      await axios.post(`${API}/add_course.php`, payload);
    }

    resetForm();
    await loadCourses();
  };

  const handleEdit = (course: Course) => {
    setFormData({
      course_name: course.course_name,
      description: course.description || "",
      price: course.price,
      duration: course.duration || "",
      category_id: course.category_id || "",
      subcategory_id: course.subcategory_id || "",
      exam_id: course.exam_id || "",
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this course?")) {
      await axios.post(`${API}/delete_course.php`, { id });
      loadCourses();
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Courses Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex gap-2"
        >
          {showForm ? <X /> : <Plus />} {showForm ? "Cancel" : "Add Course"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="course_name"
              value={formData.course_name}
              onChange={handleInputChange}
              placeholder="Course Name"
              className="border p-2 rounded"
              required
            />

            <input
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Price"
              className="border p-2 rounded"
              required
            />

            <input
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              placeholder="Duration"
              className="border p-2 rounded"
            />

            {/* Category */}
            {/* Category */}
<select
  name="category_id"
  value={formData.category_id}
  onChange={(e) => {
    handleInputChange(e);      // formData update
    handleCategoryChange(e);   // course filter
  }}
  className="border p-2 rounded"
  required
>
  <option value="">Select Category</option>
  {/* {categories.map((c) => (
    <option key={c.id} value={c.id}>
      {c.name}
    </option>
  ))} */}
  <option value="arithmetics">arithmetics</option>
  <option value="algebra">algebra</option>
  <option value="geometry">geometry</option>
</select>


            {/* SubCategory */}
            <select
              name="subcategory_id"
              value={formData.subcategory_id}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            >
              <option value="">Select SubCategory</option>
              {/* {subcategories
                .filter((sc) => sc.category_id === formData.category_id)
                .map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))} */}
              <option value="basic">age</option>
              <option value="advanced">profit</option>

            </select>

            {/* Exam */}
            <select
              name="exam_id"
              value={formData.exam_id}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            >
              <option value="">Select Exam</option>
              {/* {exams
                .filter((ex) => ex.subcategory_id === formData.subcategory_id)
                .map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))} */}
                <option value="IMO - International Mathematics Olympiad">IMO - International Mathematics Olympiad</option>
                <option value="12312">12312</option>
            </select>
          </div>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description"
            className="border p-2 rounded w-full mt-4"
          />

          <div className="mt-4">
            <button className="bg-green-600 text-white px-4 py-2 rounded flex gap-2">
              <Save /> {editingId ? "Update Course" : "Add Course"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map((c) => (
          <div key={c.id} className="border rounded-lg p-4 shadow">
            <h3 className="font-bold text-lg">{c.course_name}</h3>
            <p className="text-gray-600">₹{c.price}</p>
            <p className="text-sm text-gray-500">{c.duration}</p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleEdit(c)}
                className="flex-1 bg-blue-500 text-white p-2 rounded flex justify-center gap-1"
              >
                <Edit2 size={16} /> Edit
              </button>

              <button
                onClick={() => handleDelete(c.id)}
                className="flex-1 bg-red-500 text-white p-2 rounded flex justify-center gap-1"
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

export default Courses;
