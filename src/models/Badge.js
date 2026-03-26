import mongoose from 'mongoose';

const BadgeSchema = new mongoose.Schema({
  badgeName: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  criteria: { type: String, required: true },
  icon: { type: String, default: '🏅' },
  category: { type: String, enum: ['teaching', 'skill', 'community', 'rating'], default: 'teaching' },
  thresholds: {
    minSessions: { type: Number },
    minRating: { type: Number },
    minReputation: { type: Number },
    requireVerifiedSkill: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Badge || mongoose.model('Badge', BadgeSchema);
