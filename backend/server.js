const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import models
const { User, Course, Assignment, Submission, Quiz, QuizSubmission, Notification } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const assignmentRoutes = require('./routes/assignments');
const quizRoutes = require('./routes/quizzes');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database and initialize default data
const initializeApp = async () => {
  try {
    await connectDB();
    await createDefaultUsers();
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Initialization error:', error);
  }
};

// Create default users
const createDefaultUsers = async () => {
  const defaultUsers = [
    { name: 'Student User', email: 'student@example.com', password: 'student123', role: 'student' },
    { name: 'Ali Khan', email: 'ali@example.com', password: 'pass123', role: 'student' },
    { name: 'Sara Ahmed', email: 'sara@example.com', password: 'pass123', role: 'student' },
    { name: 'Teacher User', email: 'teacher@example.com', password: 'teacher123', role: 'teacher' },
    { name: 'Ahmed Hassan', email: 'ahmed@example.com', password: 'pass123', role: 'teacher' },
    { name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'admin' }
  ];

  for (const userData of defaultUsers) {
    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create(userData);
        console.log(`Created default user: ${userData.email}`);
      }
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error.message);
    }
  }
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LMS API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Learning Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      courses: '/api/courses',
      assignments: '/api/assignments',
      quizzes: '/api/quizzes',
      notifications: '/api/notifications',
      dashboard: '/api/dashboard'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

initializeApp().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});
