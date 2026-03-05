import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'company'], default: 'user' },
  skills: [{ name: { type: String }, level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' } }],
  interests: [String],
  walletBalance: { type: Number, default: 100 },
  reputationScore: { type: Number, default: 5 },
  sessionsCompleted: { type: Number, default: 0 },
  averageRating: { type: Number, default: 5 },
  mentorLevel: { type: String, enum: ['community', 'verified', 'expert'], default: 'community' },
  verifiedSkills: [String],
  portfolioLinks: [String],
  availability: [{ day: String, startTime: String, endTime: String }],
  suspended: { type: Boolean, default: false },
  repeatLearners: { type: Number, default: 0 },
  sessionCompletionRate: { type: Number, default: 100 },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.index({ 'skills.name': 1 });
UserSchema.index({ reputationScore: -1 });
UserSchema.index({ email: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
