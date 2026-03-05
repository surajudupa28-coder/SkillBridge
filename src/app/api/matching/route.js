import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const skill = searchParams.get('skill');

    const query = { _id: { $ne: authUser._id }, suspended: { $ne: true } };
    if (skill) {
      query['skills.name'] = { $regex: new RegExp(skill, 'i') };
    }

    const mentors = await User.find(query).select('-password').limit(50);

    const learnerInterests = authUser.interests || [];

    const scored = mentors.map(mentor => {
      const mentorSkillNames = mentor.skills.map(s => s.name.toLowerCase());
      let overlap = 0;
      if (learnerInterests.length > 0) {
        overlap = learnerInterests.filter(i => mentorSkillNames.includes(i.toLowerCase())).length / learnerInterests.length;
      } else if (skill) {
        overlap = mentorSkillNames.some(s => s.toLowerCase().includes(skill.toLowerCase())) ? 1 : 0;
      }
      overlap = Math.min(overlap, 1);

      const matchScore = (overlap * 0.6) + ((mentor.reputationScore / 10) * 0.25) + ((mentor.averageRating / 5) * 0.15);

      return {
        _id: mentor._id,
        name: mentor.name,
        skills: mentor.skills,
        averageRating: mentor.averageRating,
        mentorLevel: mentor.mentorLevel,
        sessionsCompleted: mentor.sessionsCompleted,
        reputationScore: mentor.reputationScore,
        verifiedSkills: mentor.verifiedSkills,
        matchScore: Math.round(matchScore * 100) / 100
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ mentors: scored.slice(0, 5) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
