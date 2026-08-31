import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://vercel.app';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, role?: string) =>
    api.post('/auth/register', { name, email, password, role }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (name: string) => api.put('/auth/profile', { name }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
};

// Users API
export const usersAPI = {
  getAll: (role?: string) => api.get('/users', { params: { role } }),
  getStats: () => api.get('/users/stats'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    api.post('/users', data),
  update: (id: string, data: { name?: string; email?: string; role?: string }) =>
    api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Courses API
export const coursesAPI = {
  getAll: (params?: { myCourses?: boolean; enrolled?: boolean }) =>
    api.get('/courses', { params }),
  getStats: () => api.get('/courses/stats/all'),
  getById: (id: string) => api.get(`/courses/${id}`),
  create: (title: string, description: string) =>
    api.post('/courses', { title, description }),
  enroll: (id: string) => api.post(`/courses/${id}/enroll`),
  addMaterial: (id: string, title: string, file_url: string) =>
    api.post(`/courses/${id}/materials`, { title, file_url }),
  update: (id: string, data: { title?: string; description?: string }) =>
    api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
};

// Assignments API
export const assignmentsAPI = {
  getAll: (params?: { course_id?: string; myAssignments?: boolean; pending?: boolean }) =>
    api.get('/assignments', { params }),
  getTeacherStats: () => api.get('/assignments/stats/teacher'),
  getPending: () => api.get('/assignments/student/pending'),
  getById: (id: string) => api.get(`/assignments/${id}`),
  create: (data: {
    course_id: string;
    title: string;
    description: string;
    deadline: string;
    max_score: number;
    file_url?: string;
  }) => api.post('/assignments', data),
  submit: (id: string, file_url: string) =>
    api.post(`/assignments/${id}/submit`, { file_url }),
  getSubmissions: (id: string) => api.get(`/assignments/${id}/submissions`),
  grade: (submissionId: string, grade: number, feedback?: string) =>
    api.put(`/assignments/submissions/${submissionId}/grade`, { grade, feedback }),
  getGrades: () => api.get('/assignments/student/grades/all'),
  delete: (id: string) => api.delete(`/assignments/${id}`),
};

// Quizzes API
export const quizzesAPI = {
  getAll: (params?: { course_id?: string; upcoming?: boolean }) =>
    api.get('/quizzes', { params }),
  getUpcoming: () => api.get('/quizzes/student/upcoming'),
  getById: (id: string) => api.get(`/quizzes/${id}`),
  create: (data: {
    course_id: string;
    title: string;
    question_set: { question: string; options: string[]; correct_answer: number }[];
    deadline: string;
    duration_minutes: number;
  }) => api.post('/quizzes', data),
  attempt: (id: string, answers: number[]) =>
    api.post(`/quizzes/${id}/attempt`, { answers }),
  getResults: (id: string) => api.get(`/quizzes/${id}/results`),
  getSubmissions: (id: string) => api.get(`/quizzes/${id}/submissions`),
  delete: (id: string) => api.delete(`/quizzes/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStudent: () => api.get('/dashboard/student'),
  getTeacher: () => api.get('/dashboard/teacher'),
  getAdmin: () => api.get('/dashboard/admin'),
};

// Notifications API
export const notificationsAPI = {
  getAll: (unreadOnly?: boolean) =>
    api.get('/notifications', { params: { unreadOnly } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  create: (data: { user_id: string; message: string; type?: string }) =>
    api.post('/notifications', data),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export default api;
