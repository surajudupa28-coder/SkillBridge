import mongoose from 'mongoose';

const UserBadgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: true },
  awardedAt: { type: Date, default: Date.now },
  awardReason: { type: String }
});

UserBadgeSchema.index({ userId: 1 });
UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export default mongoose.models.UserBadge || mongoose.model('UserBadge', UserBadgeSchema);
