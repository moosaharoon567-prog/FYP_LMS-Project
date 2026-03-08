const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    let query = { user_id: req.user._id };

    if (unreadOnly === 'true') {
      query.is_read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user_id: req.user._id,
      is_read: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/',
  protect,
  [
    body('user_id').notEmpty().withMessage('User ID is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('type').optional().isIn(['assignment', 'quiz', 'grade', 'course', 'general'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { user_id, message, type } = req.body;

      const notification = await Notification.create({
        user_id,
        message,
        type: type || 'general',
        is_read: false
      });

      res.status(201).json(notification);
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.is_read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.user._id, is_read: false },
      { is_read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await Notification.deleteOne({ _id: req.params.id });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
