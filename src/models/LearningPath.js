import mongoose from 'mongoose';

const LearningPathSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goal: {
    type: String,
    required: true
  },
  topics: [
    {
      title: {
        type: String,
        required: true
      },
      prerequisites: [String],
      estimatedTime: String,
      checklist: [
        {
          text: {
            type: String,
            required: true
          },
          completed: {
            type: Boolean,
            default: false
          }
        }
      ]
    }
  ],
  progress: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
});

// Calculate progress automatically
LearningPathSchema.methods.calculateProgress = function () {
  const allItems = this.topics.reduce((acc, topic) => acc + topic.checklist.length, 0);
  if (allItems === 0) return 0;
  
  const completedItems = this.topics.reduce(
    (acc, topic) => acc + topic.checklist.filter(item => item.completed).length,
    0
  );
  
  this.progress = Math.round((completedItems / allItems) * 100);
  return this.progress;
};

LearningPathSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.LearningPath || mongoose.model('LearningPath', LearningPathSchema);
