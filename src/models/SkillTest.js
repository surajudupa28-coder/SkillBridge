import mongoose from 'mongoose';

const SkillTestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: String, required: true },
  score: { type: Number },
  passed: { type: Boolean, default: false },
  endorsements: [{ endorser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, comment: String, createdAt: { type: Date, default: Date.now } }],
  portfolioUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.SkillTest || mongoose.model('SkillTest', SkillTestSchema);
