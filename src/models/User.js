import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'mentor', 'admin', 'company'], default: 'user' },
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
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  otpAttempts: { type: Number, default: 0 },
  repeatLearners: { type: Number, default: 0 },
  sessionCompletionRate: { type: Number, default: 100 },
  embedding: { type: [Number], default: [] },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.index({ 'skills.name': 1 });
UserSchema.index({ reputationScore: -1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
