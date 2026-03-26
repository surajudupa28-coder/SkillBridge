import mongoose from 'mongoose';

const CompanySubscriptionSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  planType: { type: String, enum: ['starter', 'professional', 'enterprise'], default: 'starter' },
  status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  paymentStatus: { type: String, enum: ['none', 'pending', 'completed', 'failed'], default: 'none' },
  features: {
    talentSearch: { type: Boolean, default: true },
    advancedFilters: { type: Boolean, default: false },
    fullAnalytics: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    unlimitedShortlist: { type: Boolean, default: false },
    hiringPipeline: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.CompanySubscription || mongoose.model('CompanySubscription', CompanySubscriptionSchema);
