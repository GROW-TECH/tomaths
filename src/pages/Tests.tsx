import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, ExternalLink } from 'lucide-react';
import { getCourses, Course } from '../lib/api';

const API_BASE_URL = "https://xiadot.com/admin_maths/api";

interface Test {
  id: number;
  test_name: string;
  test_url: string;
  course_id: number;
  course_name?: string;
  created_at: string;
}

function Tests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    test_name: '',
    test_url: '',
    course_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Load tests
  const loadTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/tests.php`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch tests');
      }
      
      setTests(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tests');
      console.error('Failed to load tests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load courses
  const loadCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  useEffect(() => {
    loadTests();
    loadCourses();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      test_name: '',
      test_url: '',
      course_id: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Handle add/edit test
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.test_name || !formData.test_url || !formData.course_id) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);

      const bodyFormData = new FormData();
      bodyFormData.append('test_name', formData.test_name);
      bodyFormData.append('test_url', formData.test_url);
      bodyFormData.append('course_id', formData.course_id);

      if (editingId) {
        bodyFormData.append('id', editingId.toString());
      }

      const endpoint = editingId ? 'update_test.php' : 'add_test.php';
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        body: bodyFormData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to save test');
      }
      
      alert(editingId ? 'Test updated successfully!' : 'Test added successfully!');
      resetForm();
      await loadTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save test');
      console.error('Failed to save test:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (test: Test) => {
    setFormData({
      test_name: test.test_name,
      test_url: test.test_url,
      course_id: test.course_id.toString()
    });
    setEditingId(test.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id: number, testName: string) => {
    if (!confirm(`Are you sure you want to delete "${testName}"?`)) {
      return;
    }
    
    try {
      const bodyFormData = new FormData();
      bodyFormData.append('id', id.toString());

      const response = await fetch(`${API_BASE_URL}/delete_test.php`, {
        method: 'POST',
        body: bodyFormData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete test');
      }
      
      alert('Test deleted successfully!');
      await loadTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete test');
      console.error('Failed to delete test:', err);
    }
  };

  // Filter tests based on search
  const filteredTests = tests.filter(test =>
    test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.course_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tests Management</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition"
        >
          {showForm ? (
            <>
              <X size={20} /> Cancel
            </>
          ) : (
            <>
              <Plus size={20} /> Add Test
            </>
          )}
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          {error}
          <button onClick={() => setError(null)} className="absolute top-3 right-3 font-bold">×</button>
        </div>
      )}
      
      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            {editingId ? 'Edit Test' : 'Add New Test'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Test Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="test_name"
                value={formData.test_name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter test name"
                required
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                name="course_id"
                value={formData.course_id}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.course_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block mb-2 font-medium text-gray-700">
              Test URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="test_url"
              value={formData.test_url}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/test"
              required
            />
          </div>
          
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 flex items-center gap-2 transition"
            >
              <Save size={20} />
              {submitting ? 'Saving...' : editingId ? 'Update Test' : 'Add Test'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      
      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search tests by name or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Tests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Test URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-600">Loading tests...</p>
                  </td>
                </tr>
              ) : filteredTests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No tests found matching your search' : 'No tests found. Add your first test!'}
                  </td>
                </tr>
              ) : (
                filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{test.test_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{test.course_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={test.test_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                      >
                        <span className="truncate max-w-xs">{test.test_url}</span>
                        <ExternalLink size={14} />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(test)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(test.id, test.test_name)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Summary */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          Showing {filteredTests.length} of {tests.length} tests
        </div>
      </div>
    </div>
  );
}

export default Tests;