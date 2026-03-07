import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  Clock,
  Upload,
  AlertCircle,
} from "lucide-react";
import {
  getExams,
  addExam,
  updateExam,
  deleteExam,
  Exam,
  ExamFormData,
} from "../lib/api";

function Exams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ExamFormData>({
    exam_name: "",
    subject: "",
    price: "",
    duration: "",
    description: "", // Added missing field
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof ExamFormData, string>>
  >({});

  // Load exams
  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExams();
      setExams(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load exams");
      console.error("Load exams error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle input (supports input + textarea)
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name as keyof ExamFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ExamFormData, string>> = {};

    if (!formData.exam_name?.trim()) {
      errors.exam_name = "Exam name is required";
    }

    if (!formData.price?.trim()) {
      errors.price = "Price is required";
    } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      errors.price = "Please enter a valid price";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset
  const resetForm = () => {
    setFormData({
      exam_name: "",
      subject: "",
      price: "",
      duration: "",
      description: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setShowForm(false);
    setFormErrors({});
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: ExamFormData = {
        ...formData,
        image: imageFile || undefined,
      };

      if (editingId) {
        await updateExam(editingId, payload);
        setSuccessMessage("Exam updated successfully!");
      } else {
        await addExam(payload);
        setSuccessMessage("Exam added successfully!");
      }

      resetForm();
      await loadExams();
    } catch (err: any) {
      console.error("Save exam error:", err);
      setError(err?.message || "Failed to save exam");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit
  const handleEdit = (exam: Exam) => {
    setFormData({
      exam_name: exam.exam_name,
      subject: exam.subject || "",
      price: exam.price,
      duration: exam.duration || "",
      description: exam.description || "",
    });
    setImageFile(null);
    setImagePreview(exam.image_url || null);
    setEditingId(exam.id);
    setShowForm(true);
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" exam?`)) return;

    try {
      setError(null);
      await deleteExam(id);
      setSuccessMessage("Exam deleted successfully!");
      await loadExams();
    } catch (err: any) {
      console.error("Delete exam error:", err);
      setError(err?.message || "Failed to delete exam");
    }
  };

  // Filter
  const filteredExams = exams.filter(
    (exam) =>
      exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Exams Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your exams, pricing, and details
            </p>
          </div>

          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showForm
                ? "bg-gray-500 hover:bg-gray-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
            {showForm ? "Cancel" : "Add Exam"}
          </button>
        </div>

        {/* MESSAGES */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 relative flex items-start gap-3">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {/* FORM */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-lg mb-6 border-t-4 border-blue-500"
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 size={24} className="text-blue-500" />
                  Edit Exam
                </>
              ) : (
                <>
                  <Plus size={24} className="text-green-500" />
                  Add New Exam
                </>
              )}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Exam Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="exam_name"
                  value={formData.exam_name}
                  onChange={handleInputChange}
                  className={`w-full border ${formErrors.exam_name ? "border-red-500" : "border-gray-300"} px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter exam name"
                />
                {formErrors.exam_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.exam_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Subject
                </label>
                <input
                  name="subject"
                  value={formData.subject || ""}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subject"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  className={`w-full border ${formErrors.price ? "border-red-500" : "border-gray-300"} px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                />
                {formErrors.price && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Duration
                </label>
                <input
                  name="duration"
                  value={formData.duration || ""}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2 hours, 30 mins"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter exam description..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-gray-700">
                  Exam Image
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="flex-1 border border-gray-300 px-4 py-2 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Max file size: 5MB. Supported: JPG, PNG, GIF
                </p>
              </div>
            </div>

            {imagePreview && (
              <div className="mt-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Image Preview
                </label>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-48 h-48 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                />
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editingId ? "Update Exam" : "Add Exam"}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* SEARCH */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search exams by name, subject, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* GRID */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">All Exams</h2>
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {filteredExams.length}{" "}
              {filteredExams.length === 1 ? "exam" : "exams"}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading exams...</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search size={48} className="mx-auto" />
              </div>
              <p className="text-gray-500 text-lg">
                {searchTerm
                  ? "No exams found matching your search"
                  : 'No exams available. Click "Add Exam" to create your first exam!'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 bg-white"
                  >
                    {exam.image_url ? (
                      <img
                        src={exam.image_url}
                        alt={exam.exam_name}
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Upload size={32} className="text-gray-400" />
                      </div>
                    )}

                    <div className="p-5">
                      <h3 className="font-bold text-xl text-gray-800 mb-2 line-clamp-1">
                        {exam.exam_name}
                      </h3>

                      {exam.subject && (
                        <p className="text-sm text-blue-600 font-medium mb-2">
                          📚 {exam.subject}
                        </p>
                      )}

                      {exam.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {exam.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-green-600 font-bold text-2xl">
                          ₹{Number(exam.price).toLocaleString("en-IN")}
                        </div>

                        {exam.duration && (
                          <div className="flex items-center gap-1 text-gray-600 text-sm bg-gray-100 px-2 py-1 rounded-full">
                            <Clock size={14} />
                            <span>{exam.duration}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(exam)}
                          className="flex-1 bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(exam.id, exam.exam_name)}
                          className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-sm text-gray-600 text-center border-t pt-4">
                Showing {filteredExams.length} of {exams.length} exams
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Exams;
