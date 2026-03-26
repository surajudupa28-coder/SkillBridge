import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

const roleSkillMap = {
  "Machine Learning Engineer": [
    "Python",
    "Statistics",
    "Linear Algebra",
    "Machine Learning",
    "Deep Learning",
    "PyTorch",
    "Model Deployment"
  ],
  "Frontend Developer": [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "TypeScript",
    "State Management"
  ],
  "Backend Developer": [
    "Node.js",
    "Databases",
    "APIs",
    "System Design",
    "Authentication",
    "Scalability"
  ]
};

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { targetRole, currentSkills } = await request.json();

    if (!targetRole) {
      return NextResponse.json({ error: 'targetRole is required' }, { status: 400 });
    }

    const requiredSkills = roleSkillMap[targetRole];
    if (!requiredSkills) {
      return NextResponse.json(
        { error: 'Unknown role. Available roles: ' + Object.keys(roleSkillMap).join(', ') },
        { status: 400 }
      );
    }

    const normalizedCurrent = (currentSkills || []).map(s => s.toLowerCase().trim());
    const missingSkills = requiredSkills.filter(
      skill => !normalizedCurrent.includes(skill.toLowerCase())
    );

    let recommendedMentors = [];
    if (missingSkills.length > 0) {
      recommendedMentors = await User.find({
        _id: { $ne: user._id },
        suspended: { $ne: true },
        'skills.name': {
          $in: missingSkills.map(s => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'))
        }
      })
        .select('name email skills mentorLevel averageRating sessionsCompleted reputationScore verifiedSkills')
        .sort({ reputationScore: -1 })
        .limit(12)
        .lean();

      recommendedMentors = recommendedMentors.map(mentor => {
        const mentorSkillNames = mentor.skills.map(s => s.name.toLowerCase());
        const matchingSkills = missingSkills.filter(s => mentorSkillNames.includes(s.toLowerCase()));
        return { ...mentor, matchingSkills };
      });

      recommendedMentors.sort((a, b) => b.matchingSkills.length - a.matchingSkills.length);
    }

    return NextResponse.json({ missingSkills, recommendedMentors });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ availableRoles: Object.keys(roleSkillMap) });
}
