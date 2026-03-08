const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Please provide a question'],
    maxlength: [500, 'Question cannot be more than 500 characters']
  },
  options: [{
    type: String,
    required: [true, 'Please provide options']
  }],
  correct_answer: {
    type: Number,
    required: [true, 'Please provide the correct answer index'],
    min: [0, 'Correct answer index must be non-negative']
  }
});

const quizSchema = new mongoose.Schema({
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Please provide a course']
  },
  title: {
    type: String,
    required: [true, 'Please provide a quiz title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  question_set: [questionSchema],
  deadline: {
    type: Date,
    required: [true, 'Please provide a deadline']
  },
  duration_minutes: {
    type: Number,
    required: [true, 'Please provide duration in minutes'],
    min: [1, 'Duration must be at least 1 minute']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quiz', quizSchema);
