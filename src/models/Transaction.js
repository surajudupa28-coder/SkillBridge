import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  reason: { type: String },
  purpose: { type: String, enum: ['subscription', 'coins', 'session', 'other'], default: 'other' },
  counterparty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  // Razorpay payment fields
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'successful', 'failed'], default: 'pending' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ razorpayOrderId: 1 });
TransactionSchema.index({ purpose: 1, paymentStatus: 1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
