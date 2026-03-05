import mongoose from 'mongoose';

const DocumentSubmissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillName: { type: String, required: true },
  verification: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillVerification' },
  documentTitle: { type: String, required: true },
  documentType: {
    type: String,
    enum: ['professional-certification', 'course-certificate', 'industry-credential', 'project-portfolio', 'research-paper', 'competition-award', 'github-repo', 'project-documentation', 'other'],
    required: true
  },
  issuingOrganization: { type: String },
  issueDate: { type: Date },
  description: { type: String },
  fileURL: { type: String, required: true },
  fileType: { type: String },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  reviewerNotes: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewDate: { type: Date },
  scoreAwarded: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

DocumentSubmissionSchema.index({ user: 1, skillName: 1 });
DocumentSubmissionSchema.index({ verificationStatus: 1 });
DocumentSubmissionSchema.index({ user: 1, verificationStatus: 1 });

export default mongoose.models.DocumentSubmission || mongoose.model('DocumentSubmission', DocumentSubmissionSchema);
