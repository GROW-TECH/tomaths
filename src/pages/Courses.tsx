import { useEffect, useState, ChangeEvent, FormEvent, useRef } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Save, X, Loader } from "lucide-react";

const API = import.meta.env.VITE_API_LINK;

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
  category_id?: string; // Will store comma-separated values
  category_name?: string; // For display (single - from API)
  subcategory_id?: string; // Will store comma-separated values
  subcategory_name?: string; // For display (single - from API)
  exam_id?: string;
  exam_name?: string;
  image?: string;
  image_url?: string;
  youtube_url?: string;
  exam_title_id?: string;
  exam_title?: string;   // ✅ ADD THIS

};

type ExamTitle = {
  id: string;
  exam_title: string;
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
    category_id: "", // Will store comma-separated values
    subcategory_id: "", // Will store comma-separated values
    exam_id: "",
    exam_name: "",
    image: null as File | null,
    highlights: [] as string[],
    youtube_url: "",
    exam_title_id: "",
  });

  // State for multi-select dropdowns
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    [],
  );
  const [availableSubCategories, setAvailableSubCategories] = useState<
    SubCategory[]
  >([]);


  const [examTitles, setExamTitles] = useState<ExamTitle[]>([]);
  // Dropdown open states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [subCategoryDropdownOpen, setSubCategoryDropdownOpen] = useState(false);

  // Refs for click outside
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subCategoryDropdownRef = useRef<HTMLDivElement>(null);

  // Add loading states for dropdowns
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);

  // Click outside handler for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (subCategoryDropdownRef.current && !subCategoryDropdownRef.current.contains(event.target as Node)) {
        setSubCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      // Fetch all necessary data
      const [courseRes, catRes, examTitleRes] = await Promise.all([
        axios.get(`${API}/courses.php?action=list`),
        axios.get(`${API}/get_Category.php?action=list`),
        axios.get(`${API}/exam_titles.php?action=list`)
      ]);

      setCourses(courseRes.data.data || []);
      setCategories(catRes.data.data || []);
      setExamTitles(examTitleRes.data.data || []);

      console.log("Loaded courses:", courseRes.data.data);
      // Load all subcategories (to map IDs to names for display)
      // Try to fetch all subcategories directly (if API supports it)
      try {
        const subRes = await axios.get(
          `${API}/get_subCategory.php?action=list`,
        );
        if (subRes.data.data && subRes.data.data.length > 0) {
          setSubCategories(subRes.data.data);
        } else {
          // Fallback: fetch per category (some APIs require category_id)
          const allSubs: SubCategory[] = [];
          const categoriesList = catRes.data.data || [];
          for (const cat of categoriesList) {
            const res = await axios.get(
              `${API}/get_subCategory.php?action=list&category_id=${cat.id}`,
            );
            if (res.data.data) {
              allSubs.push(...res.data.data);
            }
          }
          // Remove duplicates (in case a subcategory belongs to multiple categories)
          const uniqueSubs = allSubs.filter(
            (sub, index, self) =>
              index === self.findIndex((s) => s.id === sub.id),
          );
          setSubCategories(uniqueSubs);
        }
      } catch (err) {
        console.error("Failed to load subcategories", err);
        setSubCategories([]);
      }
    } catch (err) {
      setError("Failed to load data. Please refresh.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOAD SUB‑CATEGORIES ================= */
  const loadSubCategories = async (category_ids: string[]) => {
    console.log("Loading subcategories for categories:", category_ids);
    
    if (!category_ids || category_ids.length === 0) {
      setAvailableSubCategories([]);
      return;
    }

    setLoadingSubCategories(true);
    try {
      // Load subcategories for all selected categories
      const allSubCategories: SubCategory[] = [];

      for (const category_id of category_ids) {
        console.log(`Fetching subcategories for category_id: ${category_id}`);
        const res = await axios.get(
          `${API}/get_subCategory.php?action=list&category_id=${category_id}`,
        );
        console.log(`Response for category ${category_id}:`, res.data);
        
        if (res.data.data) {
          allSubCategories.push(...res.data.data);
        }
      }

      console.log("All subcategories before dedup:", allSubCategories);

      // Remove duplicates based on id
      const uniqueSubCategories = allSubCategories.filter(
        (sub, index, self) => index === self.findIndex((s) => s.id === sub.id),
      );

      console.log("Unique subcategories:", uniqueSubCategories);
      setAvailableSubCategories(uniqueSubCategories);
    } catch (err) {
      console.error("Failed to load subcategories", err);
      setError("Failed to load subcategories");
    } finally {
      setLoadingSubCategories(false);
    }
  };

  /* ================= LOAD EXAMS ================= */
  const loadExams = async (subcategory_ids: string[]) => {
    if (!subcategory_ids || subcategory_ids.length === 0) {
      setExams([]);
      return;
    }

    setLoadingExams(true);
    try {
      // Load exams for all selected subcategories
      const allExams: Exam[] = [];

      for (const subcategory_id of subcategory_ids) {
        const res = await axios.get(
          `${API}/exam.php?action=list&subcategory_id=${subcategory_id}`,
        );
        if (res.data.data) {
          allExams.push(...res.data.data);
        }
      }

      // Remove duplicates based on id
      const uniqueExams = allExams.filter(
        (exam, index, self) =>
          index === self.findIndex((e) => e.id === exam.id),
      );

      setExams(uniqueExams);
    } catch (err) {
      console.error("Failed to load exams", err);
      setError("Failed to load exams");
    } finally {
      setLoadingExams(false);
    }
  };

  /* ================= FORM CHANGE ================= */
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= CATEGORY SELECTION ================= */
  const handleCategoryChange = async (categoryId: string) => {
    let newSelectedCategories: string[];

    if (selectedCategories.includes(categoryId)) {
      // Remove category
      newSelectedCategories = selectedCategories.filter(
        (id) => id !== categoryId,
      );

      // Also remove any subcategories that belong to this category
      const subcategoriesToRemove = availableSubCategories
        .filter((sub) => sub.category_id === categoryId)
        .map((sub) => sub.id);

      setSelectedSubCategories((prev) =>
        prev.filter((id) => !subcategoriesToRemove.includes(id)),
      );

      // Update formData subcategory_id
      const newSelectedSubs = selectedSubCategories.filter(
        (id) => !subcategoriesToRemove.includes(id),
      );
      setFormData((prev) => ({
        ...prev,
        subcategory_id: newSelectedSubs.join(","),
      }));
    } else {
      // Add category
      newSelectedCategories = [...selectedCategories, categoryId];
    }

    setSelectedCategories(newSelectedCategories);

    // Update formData with comma-separated string
    setFormData((prev) => ({
      ...prev,
      category_id: newSelectedCategories.join(","),
    }));

    // Load subcategories for new selection
    await loadSubCategories(newSelectedCategories);
  };

  /* ================= SUBCATEGORY SELECTION ================= */
  const handleSubCategoryChange = async (subCategoryId: string) => {
    let newSelectedSubCategories: string[];

    if (selectedSubCategories.includes(subCategoryId)) {
      // Remove subcategory
      newSelectedSubCategories = selectedSubCategories.filter(
        (id) => id !== subCategoryId,
      );
    } else {
      // Add subcategory
      newSelectedSubCategories = [...selectedSubCategories, subCategoryId];
    }

    setSelectedSubCategories(newSelectedSubCategories);

    // Update formData with comma-separated string
    setFormData((prev) => ({
      ...prev,
      subcategory_id: newSelectedSubCategories.join(","),
    }));

    // Load exams for new selection
    await loadExams(newSelectedSubCategories);
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

    // Append course ID if editing
    if (editingId) {
      fd.append("id", String(editingId));
    }

    // Append all other fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "highlights") return;
      if (value !== null && value !== "") {
        fd.append(key, value as any);
      }
    });

    // Duration parts
    fd.append("duration_value", formData.duration_value);
    fd.append("duration_unit", formData.duration_unit);

    // Highlights as JSON
    fd.append("highlights", JSON.stringify(formData.highlights));

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
    console.log("Editing course:", c);

    // Reset states first
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setAvailableSubCategories([]);

    // Parse duration
    let duration_value = "";
    let duration_unit = "Days";
    if (c.duration) {
      const parts = c.duration.split(" ");
      duration_value = parts[0] || "";
      duration_unit = parts[1] || "Days";
    }

    // Parse category IDs from comma-separated string
    const categoryIds = c.category_id
      ? c.category_id.split(",").filter((id) => id.trim() !== "")
      : [];

    // Parse subcategory IDs from comma-separated string
    const subcategoryIds = c.subcategory_id
      ? c.subcategory_id.split(",").filter((id) => id.trim() !== "")
      : [];

    console.log("Parsed category IDs:", categoryIds);
    console.log("Parsed subcategory IDs:", subcategoryIds);

    // Set selected categories first
    setSelectedCategories(categoryIds);

    // Update formData with the comma-separated strings
    setFormData((prev) => ({
      ...prev,
      category_id: c.category_id || "",
      subcategory_id: c.subcategory_id || "",
    }));

    // Load subcategories based on selected categories
    if (categoryIds.length > 0) {
      await loadSubCategories(categoryIds);
      // After loading subcategories, set the selected subcategories
      setSelectedSubCategories(subcategoryIds);

      // Load exams based on selected subcategories
      if (subcategoryIds.length > 0) {
        await loadExams(subcategoryIds);
      }
    }

    // Find exam name if exam_id exists
    let examName = c.exam_name || "";
    if (c.exam_id && !examName) {
      const foundExam = exams.find((e) => e.id === c.exam_id);
      if (foundExam) {
        examName = foundExam.exam_name;
      }
    }

    setFormData({
      course_name: c.course_name || "",
      price: c.price || "",
      actual_price: c.actual_price || "",
      duration_value,
      duration_unit,
      description: c.description || "",
      category_id: c.category_id || "",
      subcategory_id: c.subcategory_id || "",
      exam_id: c.exam_id || "",
      exam_name: examName,
      image: null,
      highlights: Array.isArray(c.highlights) ? c.highlights : [],
      youtube_url: c.youtube_url || "",
      exam_title_id: c.exam_title_id ? String(c.exam_title_id) : "",
    });

    setPreviewImage(getImageUrl(c));
    setEditingId(c.id);
    setShowForm(true);
    console.log("Exam title from course:", c.exam_title_id);
    console.log("FormData exam_title_id:", String(c.exam_title_id));
    console.log("Edit completed, showForm set to true");
    console.log("Selected categories after edit:", categoryIds);
    console.log("Selected subcategories after edit:", subcategoryIds);
  };

  /* ================= RESET ================= */
  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setPreviewImage(null);
    setNewHighlight("");
    setAvailableSubCategories([]);
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setExams([]);
    setError(null);

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
      exam_name: "",
      image: null,
      highlights: [],
      youtube_url: "",
      exam_title_id: "",
    });
  };

  /* ================= GET CATEGORY NAMES FOR DISPLAY ================= */
  const getCategoryNames = (categoryIds: string): string => {
    if (!categoryIds) return "";
    const ids = categoryIds.split(",").filter((id) => id);
    const names = ids.map((id) => {
      const cat = categories.find((c) => c.id === id);
      return cat ? cat.category_name : id;
    });
    return names.join(", ");
  };

  /* ================= GET SUBCATEGORY NAMES FOR DISPLAY ================= */
  const getSubcategoryNames = (subcategoryIds: string): string => {
    if (!subcategoryIds) return "";
    const ids = subcategoryIds.split(",").filter((id) => id);
    const names = ids.map((id) => {
      const sub = subcategories.find((s) => s.id === id);
      return sub ? sub.name : id; // Now subcategories is globally populated, so names will appear
    });
    return names.join(", ");
  };

  useEffect(() => {
    if (editingId && examTitles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        exam_title_id: String(prev.exam_title_id || "")
      }));
    }
  }, [examTitles]);


  /* ================= UI ================= */
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Exams</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Close" : "Add Exam"}
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

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === "development" && showForm && (
        <div className="text-xs text-gray-400 mb-2 bg-gray-100 p-2 rounded">
          <div>
            Debug: showForm = {showForm ? "true" : "false"}, editingId ={" "}
            {editingId}
          </div>
          <div>Selected Categories: {selectedCategories.join(", ")}</div>
          <div>Selected SubCategories: {selectedSubCategories.join(", ")}</div>
        </div>
      )}

      {/* ================= FORM ================= */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow mb-8 border"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Exam" : "New Exam"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Exam Title (from DB) */}
            {/* Exam Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Exam Title *
              </label>

              <select
  name="exam_title_id"
  value={formData.exam_title_id || ""}
  onChange={handleChange}
  className="border p-2 rounded w-full"
  disabled={examTitles.length === 0}
>
                <option value="">Select Exam Title</option>

                {examTitles.map((title) => (
                  <option key={title.id} value={String(title.id)}>
                    {title.exam_title}
                  </option>
                ))}
              </select>
            </div>


            {/* Course Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Exam Name *
              </label>
              <input
                name="course_name"
                value={formData.course_name}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              />
            </div>

            {/* Categories - Multi-select Dropdown */}
            <div ref={categoryDropdownRef} className="relative">
              <label className="block text-sm font-medium mb-1">
                Categories (Select multiple)
              </label>
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="w-full border p-2 rounded text-left flex justify-between items-center bg-white"
              >
                <span>
                  {selectedCategories.length > 0
                    ? `${selectedCategories.length} categories selected`
                    : "Select categories"}
                </span>
                <span className="text-gray-500">▼</span>
              </button>

              {categoryDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                  {categories.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(c.id)}
                        onChange={() => handleCategoryChange(c.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{c.category_name}</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedCategories.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {selectedCategories.length} categories
                </p>
              )}
            </div>

            {/* Subcategories - Multi-select Dropdown */}
            <div ref={subCategoryDropdownRef} className="relative">
              <label className="block text-sm font-medium mb-1">
                Subcategories (Select multiple)
              </label>
              <button
                type="button"
                onClick={() => setSubCategoryDropdownOpen(!subCategoryDropdownOpen)}
                className="w-full border p-2 rounded text-left flex justify-between items-center bg-white"
                disabled={selectedCategories.length === 0}
              >
                <span>
                  {selectedSubCategories.length > 0
                    ? `${selectedSubCategories.length} subcategories selected`
                    : selectedCategories.length === 0
                      ? "Select categories first"
                      : "Select subcategories"}
                </span>
                <span className="text-gray-500">▼</span>
              </button>

              {subCategoryDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                  {loadingSubCategories ? (
                    <div className="flex justify-center items-center p-4">
                      <Loader size={20} className="animate-spin" />
                    </div>
                  ) : availableSubCategories.length > 0 ? (
                    availableSubCategories.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubCategories.includes(s.id)}
                          onChange={() => handleSubCategoryChange(s.id)}
                          className="rounded"
                          disabled={!selectedCategories.includes(s.category_id)}
                        />
                        <span className="text-sm">{s.name}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 p-2">
                      {selectedCategories.length > 0
                        ? "No subcategories available"
                        : "Select categories first"}
                    </p>
                  )}
                </div>
              )}

              {selectedSubCategories.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {selectedSubCategories.length} subcategories
                </p>
              )}
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

            {/* YouTube URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                YouTube URL (Preview)
              </label>
              <input
                name="youtube_url"
                type="url"
                value={formData.youtube_url}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
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
                Exam Image
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
              {editingId ? "Update Exam" : "Save Exam"}
            </button>
          </div>
        </form>
      )}

      {/* ================= COURSE LIST ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => {
          // Get display names for categories and subcategories
          const categoryDisplay = c.category_id
            ? getCategoryNames(c.category_id)
            : c.category_name;
          const subcategoryDisplay = c.subcategory_id
            ? getSubcategoryNames(c.subcategory_id)
            : c.subcategory_name;

          return (
            <div key={c.id} className="border rounded shadow overflow-hidden">
              <img
                src={getImageUrl(c)}
                alt={c.course_name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{c.course_name} {c.exam_title_id && `(${c.exam_title})`}</h3>

                {/* Display Categories */}
                {categoryDisplay && (
                  <p className="text-sm text-blue-600 mb-1">
                    📚 Categories: {categoryDisplay}
                  </p>
                )}

                {/* Display Subcategories */}
                {subcategoryDisplay && (
                  <p className="text-sm text-green-600 mb-1">
                    📖 Subcategories: {subcategoryDisplay}
                  </p>
                )}
{c.exam_title && (
  <p className="text-sm text-orange-600 font-semibold">
    🎓 Exam Title: {c.exam_title}
  </p>
)}
                {/* Display Exam Name */}
                {c.exam_name && (
                  <p className="text-sm text-purple-600 font-semibold mb-2">
                    📝 Exam: {c.exam_name}
                  </p>
                )}

                {c.description && (
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {c.description}
                  </p>
                )}

                {/* YouTube URL indicator */}
                {c.youtube_url && (
                  <p className="text-sm text-blue-600 truncate">
                    🔗 YouTube: {c.youtube_url}
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
                  <p className="text-sm text-gray-500">
                    Duration: {c.duration}
                  </p>
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
          );
        })}
      </div>

      {courses.length === 0 && !loading && (
        <p className="text-center text-gray-500 py-8">No Exam found.</p>
      )}
    </div>
  );
}