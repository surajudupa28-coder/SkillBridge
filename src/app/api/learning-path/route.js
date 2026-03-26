import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LearningPath from '@/models/LearningPath';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const pathId = searchParams.get('pathId');

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If pathId is provided, get a single path
    if (pathId) {
      const path = await LearningPath.findById(pathId);
      if (!path) {
        return NextResponse.json({ error: 'Path not found' }, { status: 404 });
      }
      if (path.userId.toString() !== authUser._id.toString()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json(path);
    }

    // Otherwise, get all paths for the user
    const paths = await LearningPath.find({ userId: authUser._id }).sort({ createdAt: -1 });
    return NextResponse.json(paths);
  } catch (error) {
    console.error('GET /api/learning-path error:', error);
    return NextResponse.json({ error: 'Failed to fetch learning paths' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const { goal, roadmap } = await req.json();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!goal || !roadmap || !roadmap.topics) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Transform roadmap topics to include checklist with completed status
    const topics = roadmap.topics.map(topic => ({
      title: topic.title,
      prerequisites: topic.prerequisites || [],
      estimatedTime: topic.estimatedTime,
      checklist: (topic.checklist || []).map(item => ({
        text: item,
        completed: false
      }))
    }));

    const learningPath = new LearningPath({
      userId: authUser._id,
      goal,
      topics
    });

    learningPath.calculateProgress();
    await learningPath.save();

    return NextResponse.json(learningPath, { status: 201 });
  } catch (error) {
    console.error('POST /api/learning-path error:', error);
    return NextResponse.json({ error: 'Failed to save learning path' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();
    const { pathId, topicIndex, itemIndex } = await req.json();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const path = await LearningPath.findById(pathId);
    if (!path) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    if (path.userId.toString() !== authUser._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Toggle the checklist item
    if (path.topics[topicIndex] && path.topics[topicIndex].checklist[itemIndex]) {
      path.topics[topicIndex].checklist[itemIndex].completed = 
        !path.topics[topicIndex].checklist[itemIndex].completed;
      
      // Calculate new progress
      path.calculateProgress();
      
      // If all items completed, set completedAt
      if (path.progress === 100 && !path.completedAt) {
        path.completedAt = new Date();
      }
      
      await path.save();
    }

    return NextResponse.json(path);
  } catch (error) {
    console.error('PATCH /api/learning-path error:', error);
    return NextResponse.json({ error: 'Failed to update learning path' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const pathId = searchParams.get('pathId');

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const path = await LearningPath.findById(pathId);
    if (!path) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    if (path.userId.toString() !== authUser._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await LearningPath.deleteOne({ _id: pathId });
    return NextResponse.json({ message: 'Learning path deleted' });
  } catch (error) {
    console.error('DELETE /api/learning-path error:', error);
    return NextResponse.json({ error: 'Failed to delete learning path' }, { status: 500 });
  }
}
