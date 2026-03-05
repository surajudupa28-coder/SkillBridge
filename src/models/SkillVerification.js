import mongoose from 'mongoose';

const SkillVerificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillName: { type: String, required: true },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'testing', 'under-review', 'verified', 'rejected'],
    default: 'unverified'
  },
  stages: {
    declaration: { completed: { type: Boolean, default: false }, completedAt: Date },
    skillTest: { completed: { type: Boolean, default: false }, completedAt: Date, score: { type: Number, default: 0 } },
    portfolio: { completed: { type: Boolean, default: false }, completedAt: Date, score: { type: Number, default: 0 } },
    documents: { completed: { type: Boolean, default: false }, completedAt: Date, score: { type: Number, default: 0 } },
    endorsements: { completed: { type: Boolean, default: false }, completedAt: Date, score: { type: Number, default: 0 } },
    trialSession: { completed: { type: Boolean, default: false }, completedAt: Date, score: { type: Number, default: 0 } },
    monitoring: { completed: { type: Boolean, default: false }, completedAt: Date, score: { type: Number, default: 0 } }
  },
  testScore: { type: Number, default: 0 },
  portfolioScore: { type: Number, default: 0 },
  documentScore: { type: Number, default: 0 },
  endorsementScore: { type: Number, default: 0 },
  trialSessionScore: { type: Number, default: 0 },
  finalVerificationScore: { type: Number, default: 0 },
  attemptsUsed: { type: Number, default: 0 },
  lastAttemptDate: { type: Date },
  verifiedAt: { type: Date },
  rejectedAt: { type: Date },
  reviewNotes: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

SkillVerificationSchema.index({ user: 1, skillName: 1 }, { unique: true });
SkillVerificationSchema.index({ verificationStatus: 1 });
SkillVerificationSchema.index({ user: 1, verificationStatus: 1 });

SkillVerificationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.SkillVerification || mongoose.model('SkillVerification', SkillVerificationSchema);
