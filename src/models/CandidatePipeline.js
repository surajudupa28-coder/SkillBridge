import mongoose from 'mongoose';

const CandidatePipelineSchema = new mongoose.Schema({
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stage: { type: String, enum: ['saved', 'interviewing', 'hired'], default: 'saved' },
  notes: { type: String, default: '' },
  skill: { type: String },
  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CandidatePipelineSchema.index({ recruiterId: 1, stage: 1 });
CandidatePipelineSchema.index({ recruiterId: 1, candidateId: 1 }, { unique: true });

export default mongoose.models.CandidatePipeline || mongoose.model('CandidatePipeline', CandidatePipelineSchema);
