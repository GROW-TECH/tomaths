import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, Clock } from 'lucide-react';
import {
  getExams,
  addExam,
  updateExam,
  deleteExam,
  Exam,
  ExamFormData,
} from '../lib/api';

function Exams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ExamFormData>({
    exam_name: '',
    subject: '',
    price: '',
    duration: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load exams
  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExams();
      setExams(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load exams');
      console.error('Load exams error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  // Handle input (supports input + textarea)
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Reset
  const resetForm = () => {
    setFormData({
      exam_name: '',
      subject: '',
      price: '',
      duration: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.exam_name || !formData.price) {
      alert('Exam name and price required');
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
        alert('Exam updated successfully!');
      } else {
        await addExam(payload);
        alert('Exam added successfully!');
      }

      resetForm();
      await loadExams();
    } catch (err: any) {
      console.error('Save exam error:', err);
      setError(err?.message || 'Failed to save exam');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit
  const handleEdit = (exam: Exam) => {
    setFormData({
      exam_name: exam.exam_name,
      subject: exam.subject || '',
      price: exam.price,
      duration: exam.duration || '',
    });
    setImageFile(null); // important: old image should not be auto-uploaded again
    setImagePreview(exam.image_url || null);
    setEditingId(exam.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}" exam?`)) return;

    try {
      setError(null);
      await deleteExam(id);
      alert('Exam deleted successfully!');
      await loadExams();
    } catch (err: any) {
      console.error('Delete exam error:', err);
      setError(err?.message || 'Failed to delete exam');
    }
  };

  // Filter
  const filteredExams = exams.filter(exam =>
    exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Exams Management</h1>

        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'Add Exam'}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          {error}
          <button
            onClick={() => setError(null)}
            className="absolute top-3 right-3 text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            {editingId ? 'Edit Exam' : 'Add New Exam'}
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
                className="w-full border border-gray-300 px-4 py-2 rounded-lg"
                placeholder="Enter exam name"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Subject
              </label>
              <input
                name="subject"
                value={formData.subject || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg"
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
                className="w-full border border-gray-300 px-4 py-2 rounded-lg"
                placeholder="Enter price"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Duration
              </label>
              <input
                name="duration"
                value={formData.duration || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg"
                placeholder="e.g., 2 hours, 30 mins"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium text-gray-700">
                Exam Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg"
              />
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
                className="w-48 h-48 object-cover rounded-lg border-2 border-gray-300"
              />
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Save size={18} />
              {submitting ? 'Saving...' : editingId ? 'Update Exam' : 'Add Exam'}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* GRID */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">All Exams</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading exams...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No exams found matching your search' : 'No exams available. Add your first exam!'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map(exam => (
                <div key={exam.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {exam.image_url ? (
                    <img src={exam.image_url} alt={exam.exam_name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="font-bold text-xl text-gray-800 mb-2">{exam.exam_name}</h3>

                    {exam.subject && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {exam.subject}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="text-green-600 font-bold text-xl">
                        ₹{Number(exam.price).toLocaleString('en-IN')}
                      </div>

                      {exam.duration && (
                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                          <Clock size={16} />
                          <span>{exam.duration}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(exam)}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exam.id, exam.exam_name)}
                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-sm text-gray-600 text-center">
              Showing {filteredExams.length} of {exams.length} exams
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Exams;