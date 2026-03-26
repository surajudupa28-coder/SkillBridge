import mongoose from 'mongoose';

const UserSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  planType: { type: String, enum: ['free', 'pro'], default: 'free' },
  status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  paymentStatus: { type: String, enum: ['none', 'pending', 'completed', 'failed'], default: 'none' },
  features: {
    recruiterVisibility: { type: Boolean, default: false },
    placementAccess: { type: Boolean, default: false },
    placementAnalytics: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

UserSubscriptionSchema.index({ planType: 1, status: 1 });

export default mongoose.models.UserSubscription || mongoose.model('UserSubscription', UserSubscriptionSchema);
