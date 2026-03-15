// src/services/api.js
export const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP error ${res.status}`);
  return data;
};

export const loginAdmin = async ({ username, password }) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
};

export const fetchStudents = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/students${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const createStudent = async (data) => {
  const res = await fetch(`${BASE_URL}/students`, { method:'POST', headers:getAuthHeaders(), body:JSON.stringify(data) });
  return handleResponse(res);
};

export const updateStudent = async (id, data) => {
  const res = await fetch(`${BASE_URL}/students/${id}`, { method:'PUT', headers:getAuthHeaders(), body:JSON.stringify(data) });
  return handleResponse(res);
};

export const deleteStudent = async (id) => {
  const res = await fetch(`${BASE_URL}/students/${id}`, { method:'DELETE', headers:getAuthHeaders() });
  return handleResponse(res);
};

export const fetchStudentCourses = async (studentId) => {
  const res = await fetch(`${BASE_URL}/students/${studentId}/courses`, { headers:getAuthHeaders() });
  return handleResponse(res);
};

export const assignCourseToStudent = async (studentId, courseId, details = {}) => {
  const res = await fetch(`${BASE_URL}/students/${studentId}/courses`, {
    method:'POST', headers:getAuthHeaders(), body:JSON.stringify({ course_id:courseId, ...details })
  });
  return handleResponse(res);
};

export const removeCourseFromStudent = async (studentId, courseId) => {
  const res = await fetch(`${BASE_URL}/students/${studentId}/courses/${courseId}`, { method:'DELETE', headers:getAuthHeaders() });
  return handleResponse(res);
};

export const fetchAdmins = async () => {
  const res = await fetch(`${BASE_URL}/admins`, { headers:getAuthHeaders() });
  return handleResponse(res);
};

export const fetchAdminCount = async () => {
  const res = await fetch(`${BASE_URL}/admins/count`, { headers:getAuthHeaders() });
  return handleResponse(res);
};

export const createAdmin = async (data) => {
  const res = await fetch(`${BASE_URL}/admins`, { method:'POST', headers:getAuthHeaders(), body:JSON.stringify(data) });
  return handleResponse(res);
};

export const updateAdmin = async (id, data) => {
  const res = await fetch(`${BASE_URL}/admins/${id}`, { method:'PUT', headers:getAuthHeaders(), body:JSON.stringify(data) });
  return handleResponse(res);
};

export const deleteAdmin = async (id) => {
  const res = await fetch(`${BASE_URL}/admins/${id}`, { method:'DELETE', headers:getAuthHeaders() });
  return handleResponse(res);
};

export const fetchIntakes = async () => {
  const res = await fetch(`${BASE_URL}/intakes`, { headers:getAuthHeaders() });
  return handleResponse(res);
};

export const fetchIntakeCount = async () => {
  const res = await fetch(`${BASE_URL}/intakes/count`, { headers:getAuthHeaders() });
  return handleResponse(res);
};

export const fetchIntakeStudents = async (id) => {
  const res = await fetch(`${BASE_URL}/intakes/${id}/students`, { headers:getAuthHeaders() });
  return handleResponse(res);
};

export const createIntake = async (data) => {
  const res = await fetch(`${BASE_URL}/intakes`, { method:'POST', headers:getAuthHeaders(), body:JSON.stringify(data) });
  return handleResponse(res);
};

export const deleteIntake = async (id) => {
  const res = await fetch(`${BASE_URL}/intakes/${id}`, { method:'DELETE', headers:getAuthHeaders() });
  return handleResponse(res);
};

export const assignCourseToIntake = async (intakeId, courseId) => {
  const res = await fetch(`${BASE_URL}/intakes/${intakeId}/courses`, {
    method:'POST', headers:getAuthHeaders(), body:JSON.stringify({ course_id:courseId })
  });
  return handleResponse(res);
};

export const removeCourseFromIntake = async (intakeId, courseId) => {
  const res = await fetch(`${BASE_URL}/intakes/${intakeId}/courses/${courseId}`, { method:'DELETE', headers:getAuthHeaders() });
  return handleResponse(res);
};

export const fetchCourses = async () => {
  const res = await fetch(`${BASE_URL}/courses`, { headers:getAuthHeaders() });
  return handleResponse(res);
};

export const fetchCourseCount = async () => {
  const res = await fetch(`${BASE_URL}/courses/count`, { headers:getAuthHeaders() });
  return handleResponse(res);
};

export const createCourse = async (data) => {
  const res = await fetch(`${BASE_URL}/courses`, { method:'POST', headers:getAuthHeaders(), body:JSON.stringify(data) });
  return handleResponse(res);
};

export const updateCourse = async (id, data) => {
  const res = await fetch(`${BASE_URL}/courses/${id}`, { method:'PUT', headers:getAuthHeaders(), body:JSON.stringify(data) });
  return handleResponse(res);
};

export const deleteCourse = async (id) => {
  const res = await fetch(`${BASE_URL}/courses/${id}`, { method:'DELETE', headers:getAuthHeaders() });
  return handleResponse(res);
};

export const fetchLogs = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/logs${query ? `?${query}` : ''}`, { headers:getAuthHeaders() });
  return handleResponse(res);
};