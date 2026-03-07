const API_BASE_URL = "https://xiadot.com/admin_maths/api";

/* ===============================
   HELPER (FIX JSON PARSE ERROR)
   If server returns HTML (PHP error), this will show it clearly
================================ */
async function parseResponse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // Server returned HTML instead of JSON
    throw new Error(text.slice(0, 300));
  }
}

/* ===============================
   ADMIN AUTH (LOGIN ONLY)
================================ */
export const adminLogin = async (name: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Invalid credentials");
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

/* ===============================
   EXAMS API
================================ */
export interface Exam {
  id: number;
  exam_name: string;
  subject?: string;
  price: string;
  duration?: string;
  image_url?: string;
}

export interface ExamFormData {
  exam_name: string;
  subject?: string;
  price: string;
  duration?: string;
  image?: File;
}

/* Get all exams */
export const getExams = async (): Promise<Exam[]> => {
  const response = await fetch(`${API_BASE_URL}/exam.php?action=list`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await parseResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to fetch exams");
  }

  return data.data || [];
};

/* Add exam */
export const addExam = async (examData: ExamFormData) => {
  const formData = new FormData();
  formData.append("action", "create");
  formData.append("exam_name", examData.exam_name);
  formData.append("subject", examData.subject || "");
  formData.append("price", examData.price);
  formData.append("duration", examData.duration || "");

  if (examData.image) {
    formData.append("image", examData.image);
  }

  const response = await fetch(`${API_BASE_URL}/exam.php`, {
    method: "POST",
    body: formData,
  });

  const data = await parseResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to save exam");
  }

  return data;
};

/* Update exam */
export const updateExam = async (id: number, examData: ExamFormData) => {
  const formData = new FormData();
  formData.append("action", "update");
  formData.append("id", id.toString());
  formData.append("exam_name", examData.exam_name);
  formData.append("subject", examData.subject || "");
  formData.append("price", examData.price);
  formData.append("duration", examData.duration || "");

  if (examData.image) {
    formData.append("image", examData.image);
  }

  const response = await fetch(`${API_BASE_URL}/exam.php`, {
    method: "POST",
    body: formData,
  });

  const data = await parseResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to update exam");
  }

  return data;
};

/* Delete exam */
export const deleteExam = async (id: number) => {
  const formData = new FormData();
  formData.append("action", "delete");
  formData.append("id", id.toString());

  const response = await fetch(`${API_BASE_URL}/exam.php`, {
    method: "POST",
    body: formData,
  });

  const data = await parseResponse(response);

  if (!data.success) {
    throw new Error(data.message || "Failed to delete exam");
  }

  return data;
};

/* ===============================
   COURSES API
================================ */
export interface Course {
  id: number;
  course_name: string;
  description: string;
  price: string;
  duration: string;
  image: string;
  image_url: string;
  formatted_price: string;
  created_at: string;
}

export interface CourseFormData {
  course_name: string;
  description: string;
  price: string;
  duration: string;
  image?: File;
}

// Get all courses
export const getCourses = async (): Promise<Course[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses.php`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await parseResponse(response);

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch courses");
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
};

// Add new course
export const addCourse = async (courseData: CourseFormData) => {
  try {
    const formData = new FormData();
    formData.append("course_name", courseData.course_name);
    formData.append("description", courseData.description);
    formData.append("price", courseData.price);
    formData.append("duration", courseData.duration);

    if (courseData.image) {
      formData.append("image", courseData.image);
    }

    const response = await fetch(`${API_BASE_URL}/add_course.php`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await parseResponse(response);

    if (!data.success) {
      throw new Error(data.message || "Failed to add course");
    }

    return data;
  } catch (error) {
    console.error("Error adding course:", error);
    throw error;
  }
};

// Update course
export const updateCourse = async (id: number, courseData: CourseFormData) => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("course_name", courseData.course_name);
    formData.append("description", courseData.description);
    formData.append("price", courseData.price);
    formData.append("duration", courseData.duration);

    if (courseData.image) {
      formData.append("image", courseData.image);
    }

    const response = await fetch(`${API_BASE_URL}/update_course.php`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await parseResponse(response);

    if (!data.success) {
      throw new Error(data.message || "Failed to update course");
    }

    return data;
  } catch (error) {
    console.error("Error updating course:", error);
    throw error;
  }
};

// Delete course
export const deleteCourse = async (id: number) => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(`${API_BASE_URL}/delete_course.php`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await parseResponse(response);

    if (!data.success) {
      throw new Error(data.message || "Failed to delete course");
    }

    return data;
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
};

/* ===============================
   TESTS API
================================ */
export interface Test {
  id: number;
  test_name: string;
  course_id: number;
  course_name?: string;
  duration: number;
  total_marks: number;
  passing_marks: number;
  description: string;
  status: string;
  created_at: string;
}

export interface TestFormData {
  test_name: string;
  course_id: string;
  duration: string;
  total_marks: string;
  passing_marks: string;
  description: string;
  status: string;
}

// Get all tests
export const getTests = async (): Promise<Test[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tests.php`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await parseResponse(response);

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch tests");
    }

    return data.data || [];
  } catch (error) {
    console.error("Error fetching tests:", error);
    throw error;
  }
};

// Add new test
export const addTest = async (testData: TestFormData) => {
  try {
    const formData = new FormData();
    Object.keys(testData).forEach((key) => {
      formData.append(key, testData[key as keyof TestFormData]);
    });

    const response = await fetch(`${API_BASE_URL}/add_test.php`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await parseResponse(response);

    if (!data.success) {
      throw new Error(data.message || "Failed to add test");
    }

    return data;
  } catch (error) {
    console.error("Error adding test:", error);
    throw error;
  }
};

// Update test
export const updateTest = async (id: number, testData: TestFormData) => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    Object.keys(testData).forEach((key) => {
      formData.append(key, testData[key as keyof TestFormData]);
    });

    const response = await fetch(`${API_BASE_URL}/update_test.php`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await parseResponse(response);

    if (!data.success) {
      throw new Error(data.message || "Failed to update test");
    }

    return data;
  } catch (error) {
    console.error("Error updating test:", error);
    throw error;
  }
};

// Delete test
export const deleteTest = async (id: number) => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(`${API_BASE_URL}/delete_test.php`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await parseResponse(response);

    if (!data.success) {
      throw new Error(data.message || "Failed to delete test");
    }

    return data;
  } catch (error) {
    console.error("Error deleting test:", error);
    throw error;
  }
};
