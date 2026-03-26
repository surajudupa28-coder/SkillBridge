import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import { getAuthUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const session = await Session.findById(params.id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.learner.toString() !== authUser._id.toString()) {
      return NextResponse.json({ error: 'Only the learner can rate a session' }, { status: 403 });
    }
    if (session.status !== 'completed') {
      return NextResponse.json({ error: 'Can only rate completed sessions' }, { status: 400 });
    }
    if (session.attendancePercent < 70) {
      return NextResponse.json({ error: 'Rating requires at least 70% attendance' }, { status: 400 });
    }

    const { rating, review } = await request.json();
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Suspicious pattern detection
    const recentRatings = await Session.find({
      learner: authUser._id,
      mentor: session.mentor,
      status: 'completed',
      rating: 5
    });
    const suspicious = recentRatings.length >= 3;

    session.rating = rating;
    session.review = review || '';
    await session.save();

    // Recalculate mentor average rating
    const ratedSessions = await Session.find({ mentor: session.mentor, status: 'completed', rating: { $exists: true, $ne: null } });
    const avgRating = ratedSessions.reduce((sum, s) => sum + s.rating, 0) / ratedSessions.length;

    const mentor = await User.findById(session.mentor);
    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }
    mentor.averageRating = Math.round(avgRating * 100) / 100;

    // Reputation score calculation
    const ratingComponent = (mentor.averageRating / 5) * 10 * 0.30;
    const repeatComponent = (Math.min(mentor.repeatLearners, 10) / 10) * 10 * 0.20;
    const completionComponent = (mentor.sessionCompletionRate / 100) * 10 * 0.20;
    const aiComponent = 5 * 0.15; // AI analysis placeholder
    const portfolioScore = mentor.portfolioLinks && mentor.portfolioLinks.length > 0 ? 7 : 3;
    const portfolioComponent = portfolioScore * 0.15;

    mentor.reputationScore = Math.round((ratingComponent + repeatComponent + completionComponent + aiComponent + portfolioComponent) * 100) / 100;

    await mentor.save();

    return NextResponse.json({ session, suspicious, newAvgRating: mentor.averageRating, newReputation: mentor.reputationScore });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
