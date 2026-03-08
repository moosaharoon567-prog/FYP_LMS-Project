const mongoose = require('mongoose');

const quizSubmissionSchema = new mongoose.Schema({
  quiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Please provide a quiz']
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a student']
  },
  answers: [{
    type: Number,
    required: [true, 'Please provide answers']
  }],
  score: {
    type: Number,
    required: [true, 'Please provide score'],
    min: [0, 'Score cannot be negative']
  },
  submitted_at: {
    type: Date,
    default: Date.now
  }
});

quizSubmissionSchema.index({ quiz_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('QuizSubmission', quizSubmissionSchema);
