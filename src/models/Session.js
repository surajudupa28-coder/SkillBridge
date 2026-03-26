import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  price: { type: Number, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'no-show-mentor', 'no-show-learner'], default: 'scheduled' },
  escrowAmount: { type: Number, default: 0 },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
  attendancePercent: { type: Number, default: 0 },
  meetingLink: { type: String },
  createdAt: { type: Date, default: Date.now }
});

SessionSchema.index({ mentor: 1, status: 1 });
SessionSchema.index({ learner: 1, status: 1 });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
