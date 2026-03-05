import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import SkillTest from '@/models/SkillTest';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const body = await request.json();
    const { skills, interests, portfolioLinks, availability } = body;

    const updates = {};
    if (skills) updates.skills = skills;
    if (interests) updates.interests = interests;
    if (portfolioLinks) updates.portfolioLinks = portfolioLinks;
    if (availability) updates.availability = availability;

    const user = await User.findByIdAndUpdate(authUser._id, updates, { new: true }).select('-password');

    // Check mentor level upgrade
    let newLevel = 'community';
    if (user.sessionsCompleted >= 10 && user.averageRating >= 4.2 && user.repeatLearners >= 3) {
      newLevel = 'verified';
    }

    const skillTests = await SkillTest.find({ user: user._id, passed: true });
    const hasEndorsements = skillTests.some(t => t.endorsements && t.endorsements.length >= 2);
    if (newLevel === 'verified' && user.verifiedSkills.length >= 1 && hasEndorsements && user.portfolioLinks.length >= 1) {
      newLevel = 'expert';
    }

    if (newLevel !== user.mentorLevel) {
      user.mentorLevel = newLevel;
      await user.save();
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
