const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const { protect, teacherOnly, adminOnly } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { myCourses, enrolled } = req.query;
    let query = {};

    if (myCourses === 'true' && req.user.role === 'teacher') {
      query.teacher_id = req.user._id;
    }

    if (enrolled === 'true' && req.user.role === 'student') {
      query.enrolled_students = req.user._id;
    }

    const courses = await Course.find(query)
      .populate('teacher_id', 'name email')
      .populate('enrolled_students', 'name email')
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats/all', protect, adminOnly, async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Course.aggregate([
      { $group: { _id: null, total: { $sum: { $size: '$enrolled_students' } } } }
    ]);

    res.json({
      totalCourses,
      totalEnrollments: totalEnrollments[0]?.total || 0
    });
  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher_id', 'name email')
      .populate('enrolled_students', 'name email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/',
  protect,
  teacherOnly,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description } = req.body;

      const course = await Course.create({
        title,
        description,
        teacher_id: req.user._id,
        enrolled_students: [],
        materials: []
      });

      const populatedCourse = await Course.findById(course._id)
        .populate('teacher_id', 'name email');

      res.status(201).json(populatedCourse);
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.enrolled_students.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    course.enrolled_students.push(req.user._id);
    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate('teacher_id', 'name email')
      .populate('enrolled_students', 'name email');

    res.json(populatedCourse);
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/:id/materials',
  protect,
  teacherOnly,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('file_url').trim().notEmpty().withMessage('File URL is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, file_url } = req.body;
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      if (course.teacher_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to add materials to this course' });
      }

      course.materials.push({
        title,
        file_url,
        uploaded_at: new Date()
      });

      await course.save();

      res.json(course);
    } catch (error) {
      console.error('Add material error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put('/:id', protect, teacherOnly, async (req, res) => {
  try {
    const { title, description } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    if (title) course.title = title;
    if (description) course.description = description;

    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate('teacher_id', 'name email')
      .populate('enrolled_students', 'name email');

    res.json(populatedCourse);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, teacherOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    await Assignment.deleteMany({ course_id: req.params.id });
    await Quiz.deleteMany({ course_id: req.params.id });

    await Course.deleteOne({ _id: req.params.id });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
