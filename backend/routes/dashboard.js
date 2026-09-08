const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/student', protect, async (req, res) => {
  try {
    const studentId = req.user._id;

    const enrolledCoursesRaw = await Course.find({ enrolled_students: studentId })
      .populate('teacher_id', 'name')
      .limit(5);

    const enrolledCourses = enrolledCoursesRaw.filter(c => c.teacher_id);
    const courseIds = enrolledCourses.map(c => c._id);
    const assignments = await Assignment.find({
      course_id: { $in: courseIds },
      deadline: { $gte: new Date() }
    }).populate('course_id', 'title');

    const submissions = await Submission.find({ student_id: studentId });
    const submittedIds = submissions.map(s => s.assignment_id.toString());
    const pendingAssignments = assignments.filter(a => !submittedIds.includes(a._id.toString())).slice(0, 5);

    const quizzes = await Quiz.find({
      course_id: { $in: courseIds },
      deadline: { $gte: new Date() }
    }).populate('course_id', 'title');

    const quizSubmissions = await QuizSubmission.find({ student_id: studentId });
    const takenQuizIds = quizSubmissions.map(s => s.quiz_id.toString());
    const upcomingQuizzes = quizzes.filter(q => !takenQuizIds.includes(q._id.toString())).slice(0, 5);

    const recentGrades = await Submission.find({
      student_id: studentId,
      grade: { $ne: null }
    })
      .populate('assignment_id', 'title max_score course_id')
      .sort({ submission_time: -1 })
      .limit(5);

    const recentQuizGrades = await QuizSubmission.find({ student_id: studentId })
      .populate('quiz_id', 'title question_set course_id')
      .sort({ submitted_at: -1 })
      .limit(5);

    res.json({
      enrolledCourses,
      pendingAssignments,
      upcomingQuizzes,
      recentGrades,
      recentQuizGrades,
      stats: {
        totalEnrolled: enrolledCourses.length,
        pendingAssignments: pendingAssignments.length,
        upcomingQuizzes: upcomingQuizzes.length
      }
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/teacher', protect, async (req, res) => {
  try {
    const teacherId = req.user._id;

    const myCourses = await Course.find({ teacher_id: teacherId })
      .populate('enrolled_students', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const allCourses = await Course.find({ teacher_id: teacherId });
    const totalStudents = allCourses.reduce((sum, course) => sum + course.enrolled_students.length, 0);

    const assignmentDocs = await Assignment.find({ teacher_id: teacherId }).select('_id');
    const assignmentIds = assignmentDocs.map(a => a._id);
    const pendingGrading = await Submission.countDocuments({
      assignment_id: { $in: assignmentIds },
      grade: null
    });

    const recentSubmissionsRaw = await Submission.find({
      assignment_id: { $in: assignmentIds }
    })
      .populate('student_id', 'name')
      .populate('assignment_id', 'title course_id max_score')
      .sort({ submission_time: -1 })
      .limit(20);
    const recentSubmissions = recentSubmissionsRaw
      .filter(s => s.student_id && s.assignment_id)
      .slice(0, 5);

    const recentAssignments = await Assignment.find({ teacher_id: teacherId })
      .populate('course_id', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    const quizIds = await Quiz.find({ course_id: { $in: allCourses.map(c => c._id) } }).select('_id');
    const recentQuizSubmissionsRaw = await QuizSubmission.find({
      quiz_id: { $in: quizIds.map(q => q._id) }
    })
      .populate('student_id', 'name')
      .populate('quiz_id', 'title question_set course_id')
      .sort({ submitted_at: -1 })
      .limit(20);
    const recentQuizSubmissions = recentQuizSubmissionsRaw
      .filter(s => s.student_id && s.quiz_id)
      .slice(0, 5);

    res.json({
      myCourses,
      recentSubmissions,
      recentAssignments,
      recentQuizSubmissions,
      stats: {
        totalCourses: allCourses.length,
        totalStudents,
        pendingGrading
      }
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/admin', protect, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const totalCourses = await Course.countDocuments();

    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentCourses = await Course.find()
      .populate('teacher_id', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        totalCourses
      },
      recentUsers,
      recentCourses
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
