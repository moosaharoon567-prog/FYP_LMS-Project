const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const Course = require('../models/Course');
const { protect, teacherOnly } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { course_id, upcoming } = req.query;
    let query = {};

    if (course_id) {
      query.course_id = course_id;
    }

    if (upcoming === 'true') {
      query.deadline = { $gte: new Date() };
    }

    let quizzes = await Quiz.find(query)
      .populate('course_id', 'title')
      .sort({ deadline: 1 });

    if (req.user.role === 'student') {
      const submissions = await QuizSubmission.find({ student_id: req.user._id });
      const submittedQuizIds = submissions.map(s => s.quiz_id.toString());
      quizzes = quizzes.filter(q => !submittedQuizIds.includes(q._id.toString()));
    }

    res.json(quizzes);
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/student/upcoming', protect, async (req, res) => {
  try {
    const enrolledCourses = await Course.find({ enrolled_students: req.user._id });
    const courseIds = enrolledCourses.map(c => c._id);

    const quizzes = await Quiz.find({
      course_id: { $in: courseIds },
      deadline: { $gte: new Date() }
    }).populate('course_id', 'title');

    const submissions = await QuizSubmission.find({ student_id: req.user._id });
    const takenQuizIds = submissions.map(s => s.quiz_id.toString());

    const upcomingQuizzes = quizzes.filter(q => !takenQuizIds.includes(q._id.toString()));

    res.json(upcomingQuizzes);
  } catch (error) {
    console.error('Get upcoming quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('course_id', 'title');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let quizData = quiz.toObject();
    if (req.user.role === 'student') {
      quizData.question_set = quizData.question_set.map(q => ({
        question: q.question,
        options: q.options
      }));
    }

    res.json(quizData);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/',
  protect,
  teacherOnly,
  [
    body('course_id').notEmpty().withMessage('Course ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('question_set').isArray({ min: 1 }).withMessage('At least one question is required'),
    body('deadline').notEmpty().withMessage('Deadline is required'),
    body('duration_minutes').isNumeric().withMessage('Duration must be a number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { course_id, title, question_set, deadline, duration_minutes } = req.body;

      const course = await Course.findById(course_id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      if (course.teacher_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to create quiz for this course' });
      }

      const quiz = await Quiz.create({
        course_id,
        title,
        question_set,
        deadline: new Date(deadline),
        duration_minutes
      });

      const populatedQuiz = await Quiz.findById(quiz._id)
        .populate('course_id', 'title');

      res.status(201).json(populatedQuiz);
    } catch (error) {
      console.error('Create quiz error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/:id/attempt',
  protect,
  [
    body('answers').isArray().withMessage('Answers must be an array')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { answers } = req.body;
      const quiz = await Quiz.findById(req.params.id);

      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      if (new Date() > new Date(quiz.deadline)) {
        return res.status(400).json({ message: 'Quiz deadline has passed' });
      }

      const course = await Course.findById(quiz.course_id);
      if (!course.enrolled_students.includes(req.user._id)) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }

      const existingSubmission = await QuizSubmission.findOne({
        quiz_id: req.params.id,
        student_id: req.user._id
      });

      if (existingSubmission) {
        return res.status(400).json({ message: 'Already submitted this quiz' });
      }

      let score = 0;
      quiz.question_set.forEach((q, index) => {
        if (answers[index] === q.correct_answer) {
          score++;
        }
      });

      const submission = await QuizSubmission.create({
        quiz_id: req.params.id,
        student_id: req.user._id,
        answers,
        score,
        submitted_at: new Date()
      });

      const populatedSubmission = await QuizSubmission.findById(submission._id)
        .populate('student_id', 'name email')
        .populate('quiz_id', 'title');

      res.status(201).json(populatedSubmission);
    } catch (error) {
      console.error('Submit quiz error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/:id/results', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const submission = await QuizSubmission.findOne({
      quiz_id: req.params.id,
      student_id: req.user._id
    });

    if (!submission) {
      return res.status(404).json({ message: 'No submission found' });
    }

    res.json({
      quiz: {
        title: quiz.title,
        total_questions: quiz.question_set.length,
        question_set: quiz.question_set
      },
      submission: {
        score: submission.score,
        answers: submission.answers,
        submitted_at: submission.submitted_at
      }
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/submissions', protect, teacherOnly, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const course = await Course.findById(quiz.course_id);
    if (course.teacher_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view submissions' });
    }

    const submissions = await QuizSubmission.find({ quiz_id: req.params.id })
      .populate('student_id', 'name email')
      .sort({ submitted_at: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Get quiz submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, teacherOnly, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const course = await Course.findById(quiz.course_id);
    if (course.teacher_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this quiz' });
    }

    await QuizSubmission.deleteMany({ quiz_id: req.params.id });
    await Quiz.deleteOne({ _id: req.params.id });

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
