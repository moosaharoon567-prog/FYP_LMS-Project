const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Please provide an assignment']
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a student']
  },
  file_url: {
    type: String,
    required: [true, 'Please provide a file URL']
  },
  submission_time: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: Number,
    default: null,
    min: [0, 'Grade cannot be negative']
  },
  feedback: {
    type: String,
    default: null,
    maxlength: [1000, 'Feedback cannot be more than 1000 characters']
  }
});

submissionSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
