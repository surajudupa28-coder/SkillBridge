import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  questionId: { type: Number, required: true },
  questionType: { type: String, enum: ['mcq', 'scenario', 'explanation'], required: true },
  selectedAnswer: { type: String },
  textAnswer: { type: String },
  isCorrect: { type: Boolean },
  aiEvaluation: {
    score: { type: Number },
    feedback: { type: String },
    fallbackScoring: { type: Boolean }
  },
  timeSpent: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false }
}, { _id: false });

const AttemptQuestionSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  questionType: { type: String, enum: ['mcq', 'scenario', 'explanation'], required: true },
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String },
  expectedConcepts: [{ type: String }],
  difficulty: { type: String }
}, { _id: false });

const SkillTestAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillName: { type: String, required: true },
  verification: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillVerification' },
  questions: [AttemptQuestionSchema],
  answers: [AnswerSchema],
  score: { type: Number, default: 0 },
  aiConfidenceScore: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 13 },
  passed: { type: Boolean, default: false },
  timeTaken: { type: Number, default: 0 },
  timeLimit: { type: Number, default: 1800 },
  startedAt: { type: Date },
  completedAt: { type: Date },
  status: { type: String, enum: ['in-progress', 'completed', 'timed-out', 'invalidated'], default: 'in-progress' },
  cheatingFlags: {
    tabSwitches: { type: Number, default: 0 },
    copyPasteAttempts: { type: Number, default: 0 },
    suspiciouslyFastAnswers: { type: Number, default: 0 },
    identicalToOtherAttempts: { type: Boolean, default: false },
    totalFlags: { type: Number, default: 0 }
  },
  flaggedForReview: { type: Boolean, default: false },
  invalidated: { type: Boolean, default: false },
  invalidationReason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

SkillTestAttemptSchema.index({ user: 1, skillName: 1, createdAt: -1 });

export default mongoose.models.SkillTestAttempt || mongoose.model('SkillTestAttempt', SkillTestAttemptSchema);
