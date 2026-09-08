import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { Courses } from '@/pages/Courses';
import { CourseDetail } from '@/pages/CourseDetail';
import { AssignmentSubmit } from '@/pages/AssignmentSubmit';
import { AssignmentGrade } from '@/pages/AssignmentGrade';
import { QuizTake } from '@/pages/QuizTake'; 
import { QuizSubmissions } from '@/pages/QuizSubmissions';
import { UserManagement } from '@/pages/UserManagement';
import { Settings } from '@/pages/Settings';

function App() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id"
        element={
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments/:id/submit"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AssignmentSubmit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments/:id/grade"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <AssignmentGrade />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quizzes/:id/take"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <QuizTake />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quizzes/:id/submissions"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <QuizSubmissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}

export default App;
