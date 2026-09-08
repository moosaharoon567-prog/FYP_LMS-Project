const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const { protect, teacherOnly } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { course_id, myAssignments, pending } = req.query;
    let query = {};

    if (course_id) {
      query.course_id = course_id;
    }

    if (myAssignments === 'true' && req.user.role === 'teacher') {
      query.teacher_id = req.user._id;
    }

    let assignments = await Assignment.find(query)
      .populate('course_id', 'title')
      .populate('teacher_id', 'name email')
      .sort({ createdAt: -1 });

    if (pending === 'true' && req.user.role === 'student') {
      const submissions = await Submission.find({ student_id: req.user._id });
      const submittedAssignmentIds = submissions.map(s => s.assignment_id.toString());
      assignments = assignments.filter(a => !submittedAssignmentIds.includes(a._id.toString()));
    }

    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats/teacher', protect, teacherOnly, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const assignments = await Assignment.find({ teacher_id: teacherId });
    const assignmentIds = assignments.map(a => a._id);
    
    const pendingSubmissions = await Submission.countDocuments({
      assignment_id: { $in: assignmentIds },
      grade: null
    });

    res.json({
      totalAssignments: assignments.length,
      pendingGrading: pendingSubmissions
    });
  } catch (error) {
    console.error('Get assignment stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/student/pending', protect, async (req, res) => {
  try {
    const enrolledCourses = await Course.find({ enrolled_students: req.user._id });
    const courseIds = enrolledCourses.map(c => c._id);

    const assignments = await Assignment.find({
      course_id: { $in: courseIds },
      deadline: { $gte: new Date() }
    }).populate('course_id', 'title');

    const submissions = await Submission.find({ student_id: req.user._id });
    const submittedIds = submissions.map(s => s.assignment_id.toString());

    const pendingAssignments = assignments.filter(a => !submittedIds.includes(a._id.toString()));

    res.json(pendingAssignments);
  } catch (error) {
    console.error('Get pending assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course_id', 'title')
      .populate('teacher_id', 'name email');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
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
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('deadline').notEmpty().withMessage('Deadline is required'),
    body('max_score').isNumeric().withMessage('Max score must be a number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { course_id, title, description, deadline, max_score, file_url } = req.body;

      const course = await Course.findById(course_id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      if (course.teacher_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to create assignment for this course' });
      }

      const assignment = await Assignment.create({
        course_id,
        teacher_id: req.user._id,
        title,
        description,
        deadline: new Date(deadline),
        max_score,
        file_url: file_url || null
      });

      const populatedAssignment = await Assignment.findById(assignment._id)
        .populate('course_id', 'title')
        .populate('teacher_id', 'name email');

      res.status(201).json(populatedAssignment);
    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/:id/submit',
  protect,
  [
    body('file_url').trim().notEmpty().withMessage('File URL is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { file_url } = req.body;
      const assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      const course = await Course.findById(assignment.course_id);
      if (!course.enrolled_students.includes(req.user._id)) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }

      const existingSubmission = await Submission.findOne({
        assignment_id: req.params.id,
        student_id: req.user._id
      });

      if (existingSubmission) {
        return res.status(400).json({ message: 'Already submitted this assignment' });
      }

      const submission = await Submission.create({
        assignment_id: req.params.id,
        student_id: req.user._id,
        file_url,
        submission_time: new Date()
      });

      const populatedSubmission = await Submission.findById(submission._id)
        .populate('student_id', 'name email')
        .populate('assignment_id', 'title');

      res.status(201).json(populatedSubmission);
    } catch (error) {
      console.error('Submit assignment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);
router.get('/:id/my-submission', protect, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      assignment_id: req.params.id,
      student_id: req.user._id
    })
      .populate('assignment_id', 'title max_score')
      .sort({ submission_time: -1 });

    if (!submission) {
      return res.status(404).json({ message: 'No submission found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Get student submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/submissions', protect, teacherOnly, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacher_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view submissions' });
    }

    const submissions = await Submission.find({ assignment_id: req.params.id })
      .populate('student_id', 'name email')
      .populate('assignment_id', 'title max_score')
      .sort({ submission_time: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put(
  '/submissions/:id/grade',
  protect,
  teacherOnly,
  [
    body('grade').isNumeric().withMessage('Grade must be a number'),
    body('feedback').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { grade, feedback } = req.body;
      const submission = await Submission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      const assignment = await Assignment.findById(submission.assignment_id);
      if (assignment.teacher_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to grade this submission' });
      }

      if (grade > assignment.max_score) {
        return res.status(400).json({ message: `Grade cannot exceed max score of ${assignment.max_score}` });
      }

      submission.grade = grade;
      submission.feedback = feedback || null;
      await submission.save();

      const populatedSubmission = await Submission.findById(submission._id)
        .populate('student_id', 'name email')
        .populate('assignment_id', 'title max_score');

      res.json(populatedSubmission);
    } catch (error) {
      console.error('Grade submission error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/student/grades/all', protect, async (req, res) => {
  try {
    const submissions = await Submission.find({
      student_id: req.user._id,
      grade: { $ne: null }
    })
      .populate('assignment_id', 'title max_score course_id')
      .sort({ submission_time: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, teacherOnly, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacher_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this assignment' });
    }

    await Submission.deleteMany({ assignment_id: req.params.id });
    await Assignment.deleteOne({ _id: req.params.id });

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
