# Learning Management System (LMS)

A full-featured Learning Management System built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

### User Roles
- **Student**: Enroll in courses, submit assignments, take quizzes, view grades
- **Teacher**: Create courses, upload materials, create assignments/quizzes, grade submissions
- **Admin**: Manage users, view all courses, system statistics

### Core Features
- User authentication with JWT
- Course management with enrollment
- Assignment creation and submission
- Quiz creation with timer
- Grading system
- User management (Admin)
- Profile and password management

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB Atlas with Mongoose
- JWT Authentication
- bcrypt password hashing
- express-validator

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- React Router v6
- Axios
- date-fns
- Lucide icons

## Default Accounts

The system automatically creates these accounts on first run:

| Email | Password | Role |
|-------|----------|------|
| student@example.com | student123 | Student |
| ali@example.com | pass123 | Student |
| sara@example.com | pass123 | Student |
| teacher@example.com | teacher123 | Teacher |
| ahmed@example.com | pass123 | Teacher |
| admin@example.com | admin123 | Admin |

## Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. The `.env` file is already configured with MongoDB Atlas connection.

4. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/stats` - Get user statistics
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (Teacher)
- `POST /api/courses/:id/enroll` - Enroll in course
- `POST /api/courses/:id/materials` - Add material (Teacher)

### Assignments
- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Create assignment (Teacher)
- `POST /api/assignments/:id/submit` - Submit assignment
- `PUT /api/assignments/submissions/:id/grade` - Grade submission

### Quizzes
- `GET /api/quizzes` - Get quizzes
- `POST /api/quizzes` - Create quiz (Teacher)
- `POST /api/quizzes/:id/attempt` - Attempt quiz

### Dashboard
- `GET /api/dashboard/student` - Student dashboard data
- `GET /api/dashboard/teacher` - Teacher dashboard data
- `GET /api/dashboard/admin` - Admin dashboard data

## Project Structure

```
lms/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Course.js          # Course model
│   │   ├── Assignment.js      # Assignment model
│   │   ├── Submission.js      # Submission model
│   │   ├── Quiz.js            # Quiz model
│   │   ├── QuizSubmission.js  # Quiz submission model
│   │   └── Notification.js    # Notification model
│   ├── routes/
│   │   ├── auth.js            # Auth routes
│   │   ├── users.js           # User routes
│   │   ├── courses.js         # Course routes
│   │   ├── assignments.js     # Assignment routes
│   │   ├── quizzes.js         # Quiz routes
│   │   ├── notifications.js   # Notification routes
│   │   └── dashboard.js       # Dashboard routes
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/              # UI components
    │   │   └── layout/          # Layout components
    │   ├── context/
    │   │   └── AuthContext.tsx  # Authentication context
    │   ├── lib/
    │   │   ├── api.ts           # API functions
    │   │   └── utils.ts         # Utility functions
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── StudentDashboard.tsx
    │   │   ├── TeacherDashboard.tsx
    │   │   ├── AdminDashboard.tsx
    │   │   ├── Courses.tsx
    │   │   ├── CourseDetail.tsx
    │   │   ├── AssignmentSubmit.tsx
    │   │   ├── AssignmentGrade.tsx
    │   │   ├── QuizTake.tsx
    │   │   ├── UserManagement.tsx
    │   │   └── Settings.tsx
    │   ├── types/
    │   │   └── index.ts         # TypeScript types
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── tailwind.config.js
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected routes
- Role-based access control
- Input validation with express-validator
- CORS enabled

## License

MIT
