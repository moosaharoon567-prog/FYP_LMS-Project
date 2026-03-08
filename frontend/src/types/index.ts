export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  teacher_id: User;
  enrolled_students: User[];
  materials: Material[];
  createdAt: string;
}

export interface Material {
  title: string;
  file_url: string;
  uploaded_at: string;
}

export interface Assignment {
  _id: string;
  course_id: Course;
  teacher_id: User;
  title: string;
  description: string;
  deadline: string;
  max_score: number;
  file_url?: string;
  createdAt: string;
}

export interface Submission {
  _id: string;
  assignment_id: Assignment;
  student_id: User;
  file_url: string;
  submission_time: string;
  grade: number | null;
  feedback: string | null;
}

export interface Quiz {
  _id: string;
  course_id: Course;
  title: string;
  question_set: Question[];
  deadline: string;
  duration_minutes: number;
  createdAt: string;
}

export interface Question {
  question: string;
  options: string[];
  correct_answer?: number;
}

export interface QuizSubmission {
  _id: string;
  quiz_id: Quiz;
  student_id: User;
  answers: number[];
  score: number;
  submitted_at: string;
}

export interface Notification {
  _id: string;
  user_id: string;
  message: string;
  type: 'assignment' | 'quiz' | 'grade' | 'course' | 'general';
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalEnrolled?: number;
  pendingAssignments?: number;
  upcomingQuizzes?: number;
  totalCourses?: number;
  totalStudents?: number;
  pendingGrading?: number;
  totalUsers?: number;
  totalTeachers?: number;
  totalAdmins?: number;
}
