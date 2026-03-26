import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';
import Badge from '@/models/Badge';
import UserBadge from '@/models/UserBadge';
import Session from '@/models/Session';
import UserSubscription from '@/models/UserSubscription';

const badgeDefs = [
  {
    badgeName: 'Top Mentor',
    description: 'Awarded to mentors with 50+ sessions and rating above 4.5',
    criteria: '50+ sessions, 4.5+ rating',
    icon: '🏆',
    category: 'teaching',
    thresholds: { minSessions: 50, minRating: 4.5 },
  },
  {
    badgeName: 'Rising Mentor',
    description: 'Completed 10+ sessions with great feedback',
    criteria: '10+ sessions in recent activity',
    icon: '🚀',
    category: 'teaching',
    thresholds: { minSessions: 10 },
  },
  {
    badgeName: 'Skill Master',
    description: 'Verified expert-level skill in their domain',
    criteria: 'Expert verified skill',
    icon: '🎯',
    category: 'skill',
    thresholds: { requireVerifiedSkill: true },
  },
  {
    badgeName: 'Highly Rated',
    description: 'Consistently rated above 4.8 by learners',
    criteria: '4.8+ average rating',
    icon: '⭐',
    category: 'rating',
    thresholds: { minRating: 4.8 },
  },
  {
    badgeName: 'Community Builder',
    description: 'Highest number of repeat learners',
    criteria: 'Most repeat learners',
    icon: '🤝',
    category: 'community',
    thresholds: { minSessions: 20 },
  },
];

const rawMentors = [
  { name: 'Aisha Rahman', email: 'aisha.rahman@demo.com', skills: ['Python', 'Machine Learning', 'Deep Learning', 'MLOps'], interests: ['AI', 'Career Transitions'], sessionsCompleted: 148, averageRating: 4.9, mentorLevel: 'expert', verifiedSkills: ['Python', 'Machine Learning'], walletBalance: 780, repeatLearners: 31, sessionCompletionRate: 98 },
  { name: 'Liam Carter', email: 'liam.carter@demo.com', skills: ['Data Engineering', 'Python', 'Airflow', 'Spark'], interests: ['Data Platforms', 'ETL'], sessionsCompleted: 102, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['Data Engineering'], walletBalance: 690, repeatLearners: 24, sessionCompletionRate: 97 },
  { name: 'Sofia Bennett', email: 'sofia.bennett@demo.com', skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'], interests: ['Frontend', 'UI Systems'], sessionsCompleted: 126, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['React', 'Next.js'], walletBalance: 710, repeatLearners: 29, sessionCompletionRate: 98 },
  { name: 'Ethan Brooks', email: 'ethan.brooks@demo.com', skills: ['Node.js', 'Express', 'REST APIs', 'MongoDB'], interests: ['Backend', 'System Design'], sessionsCompleted: 110, averageRating: 4.7, mentorLevel: 'expert', verifiedSkills: ['Node.js'], walletBalance: 650, repeatLearners: 22, sessionCompletionRate: 96 },
  { name: 'Maya Iyer', email: 'maya.iyer@demo.com', skills: ['Flutter', 'Dart', 'Firebase', 'Mobile UI'], interests: ['Mobile Development', 'Cross Platform'], sessionsCompleted: 84, averageRating: 4.7, mentorLevel: 'verified', verifiedSkills: ['Flutter'], walletBalance: 520, repeatLearners: 17, sessionCompletionRate: 95 },
  { name: 'Noah Kim', email: 'noah.kim@demo.com', skills: ['React Native', 'JavaScript', 'Expo', 'Mobile Architecture'], interests: ['Mobile', 'Performance'], sessionsCompleted: 78, averageRating: 4.6, mentorLevel: 'verified', verifiedSkills: ['React Native'], walletBalance: 480, repeatLearners: 14, sessionCompletionRate: 94 },
  { name: 'Olivia Chen', email: 'olivia.chen@demo.com', skills: ['Cybersecurity', 'Network Security', 'SOC Fundamentals', 'SIEM'], interests: ['Blue Team', 'Security Operations'], sessionsCompleted: 96, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['Cybersecurity'], walletBalance: 620, repeatLearners: 20, sessionCompletionRate: 97 },
  { name: 'Arjun Malhotra', email: 'arjun.malhotra@demo.com', skills: ['AWS', 'Cloud Architecture', 'Serverless', 'IAM'], interests: ['Cloud Computing', 'Scalability'], sessionsCompleted: 118, averageRating: 4.9, mentorLevel: 'expert', verifiedSkills: ['AWS'], walletBalance: 760, repeatLearners: 28, sessionCompletionRate: 99 },
  { name: 'Priyanka Das', email: 'priyanka.das@demo.com', skills: ['DevOps', 'Docker', 'Kubernetes', 'CI/CD'], interests: ['Platform Engineering', 'Automation'], sessionsCompleted: 132, averageRating: 4.9, mentorLevel: 'expert', verifiedSkills: ['DevOps', 'Kubernetes'], walletBalance: 790, repeatLearners: 33, sessionCompletionRate: 99 },
  { name: 'Daniel Ortega', email: 'daniel.ortega@demo.com', skills: ['UI Design', 'Figma', 'Design Systems', 'Product Design'], interests: ['UX', 'Prototyping'], sessionsCompleted: 90, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['UI Design'], walletBalance: 580, repeatLearners: 19, sessionCompletionRate: 97 },
  { name: 'Chloe Martin', email: 'chloe.martin@demo.com', skills: ['Product Management', 'Roadmapping', 'User Stories', 'Agile'], interests: ['PM Interviews', 'Execution'], sessionsCompleted: 74, averageRating: 4.7, mentorLevel: 'verified', verifiedSkills: ['Product Management'], walletBalance: 460, repeatLearners: 13, sessionCompletionRate: 95 },
  { name: 'Ryan Foster', email: 'ryan.foster@demo.com', skills: ['Blockchain', 'Solidity', 'Smart Contracts', 'Web3'], interests: ['DeFi', 'Tokenomics'], sessionsCompleted: 69, averageRating: 4.6, mentorLevel: 'verified', verifiedSkills: ['Blockchain'], walletBalance: 430, repeatLearners: 12, sessionCompletionRate: 93 },
  { name: 'Isabella Rossi', email: 'isabella.rossi@demo.com', skills: ['Game Development', 'Unity', 'C#', 'Game Physics'], interests: ['Indie Games', 'Gameplay Systems'], sessionsCompleted: 81, averageRating: 4.7, mentorLevel: 'verified', verifiedSkills: ['Game Development'], walletBalance: 510, repeatLearners: 15, sessionCompletionRate: 95 },
  { name: 'Karan Bedi', email: 'karan.bedi@demo.com', skills: ['Unreal Engine', 'C++', 'Game Design', '3D Pipelines'], interests: ['AAA Pipelines', 'Performance'], sessionsCompleted: 66, averageRating: 4.5, mentorLevel: 'community', verifiedSkills: [], walletBalance: 390, repeatLearners: 9, sessionCompletionRate: 92 },
  { name: 'Nisha Kulkarni', email: 'nisha.kulkarni@demo.com', skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Google Ads'], interests: ['Growth', 'Branding'], sessionsCompleted: 88, averageRating: 4.7, mentorLevel: 'verified', verifiedSkills: ['Digital Marketing'], walletBalance: 530, repeatLearners: 16, sessionCompletionRate: 96 },
  { name: 'Jacob Lee', email: 'jacob.lee@demo.com', skills: ['Content Creation', 'Storytelling', 'Audience Growth', 'Brand Partnerships'], interests: ['Creator Economy', 'Personal Branding'], sessionsCompleted: 61, averageRating: 4.6, mentorLevel: 'community', verifiedSkills: [], walletBalance: 360, repeatLearners: 10, sessionCompletionRate: 92 },
  { name: 'Emily Scott', email: 'emily.scott@demo.com', skills: ['Photography', 'Lighting', 'Photo Editing', 'Visual Composition'], interests: ['Portraits', 'Commercial Work'], sessionsCompleted: 59, averageRating: 4.7, mentorLevel: 'community', verifiedSkills: [], walletBalance: 350, repeatLearners: 9, sessionCompletionRate: 94 },
  { name: 'Marcus Allen', email: 'marcus.allen@demo.com', skills: ['Video Editing', 'Premiere Pro', 'After Effects', 'Color Grading'], interests: ['YouTube', 'Short Form Video'], sessionsCompleted: 72, averageRating: 4.8, mentorLevel: 'verified', verifiedSkills: ['Video Editing'], walletBalance: 470, repeatLearners: 14, sessionCompletionRate: 95 },
  { name: 'Zoya Khan', email: 'zoya.khan@demo.com', skills: ['Public Speaking', 'Presentation Skills', 'Interview Prep', 'Communication'], interests: ['Leadership', 'Confidence'], sessionsCompleted: 93, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['Public Speaking'], walletBalance: 610, repeatLearners: 21, sessionCompletionRate: 97 },
  { name: 'Victor Nguyen', email: 'victor.nguyen@demo.com', skills: ['Career Guidance', 'Resume Strategy', 'LinkedIn Branding', 'Interview Strategy'], interests: ['Career Growth', 'Transitions'], sessionsCompleted: 121, averageRating: 4.9, mentorLevel: 'expert', verifiedSkills: ['Career Guidance'], walletBalance: 740, repeatLearners: 30, sessionCompletionRate: 99 },
  { name: 'Meera Sethi', email: 'meera.sethi@demo.com', skills: ['Startup Mentorship', 'Go-to-Market', 'Founder Coaching', 'Team Building'], interests: ['Early Stage Startups', 'Execution'], sessionsCompleted: 87, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['Startup Mentorship'], walletBalance: 560, repeatLearners: 18, sessionCompletionRate: 97 },
  { name: 'Adrian Silva', email: 'adrian.silva@demo.com', skills: ['Finance', 'Trading', 'Risk Management', 'Technical Analysis'], interests: ['Portfolio Building', 'Markets'], sessionsCompleted: 77, averageRating: 4.6, mentorLevel: 'verified', verifiedSkills: ['Finance'], walletBalance: 495, repeatLearners: 13, sessionCompletionRate: 94 },
  { name: 'Fatima Noor', email: 'fatima.noor@demo.com', skills: ['Data Science', 'Python', 'SQL', 'Tableau'], interests: ['Analytics', 'Business Intelligence'], sessionsCompleted: 97, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['Data Science'], walletBalance: 620, repeatLearners: 20, sessionCompletionRate: 96 },
  { name: 'Ben Turner', email: 'ben.turner@demo.com', skills: ['NLP', 'Python', 'Transformers', 'LLM Fine-Tuning'], interests: ['Generative AI', 'Language Models'], sessionsCompleted: 83, averageRating: 4.7, mentorLevel: 'verified', verifiedSkills: ['NLP'], walletBalance: 540, repeatLearners: 15, sessionCompletionRate: 95 },
  { name: 'Harini Rao', email: 'harini.rao@demo.com', skills: ['Deep Learning', 'PyTorch', 'Computer Vision', 'MLOps'], interests: ['Vision Systems', 'Deployment'], sessionsCompleted: 89, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['Deep Learning'], walletBalance: 580, repeatLearners: 17, sessionCompletionRate: 96 },
  { name: 'George Patel', email: 'george.patel@demo.com', skills: ['Scikit-learn', 'Machine Learning', 'Feature Engineering', 'Model Evaluation'], interests: ['Classical ML', 'Mentorship'], sessionsCompleted: 64, averageRating: 4.6, mentorLevel: 'community', verifiedSkills: [], walletBalance: 390, repeatLearners: 10, sessionCompletionRate: 92 },
  { name: 'Ankit Jain', email: 'ankit.jain@demo.com', skills: ['Next.js', 'TypeScript', 'React', 'SSR'], interests: ['Web Performance', 'Frontend Architecture'], sessionsCompleted: 92, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['Next.js'], walletBalance: 610, repeatLearners: 19, sessionCompletionRate: 97 },
  { name: 'Laura Gomez', email: 'laura.gomez@demo.com', skills: ['Tailwind CSS', 'CSS', 'React', 'Design Systems'], interests: ['Frontend UI', 'Accessibility'], sessionsCompleted: 71, averageRating: 4.7, mentorLevel: 'verified', verifiedSkills: ['Tailwind CSS'], walletBalance: 450, repeatLearners: 13, sessionCompletionRate: 95 },
  { name: 'Omar Haddad', email: 'omar.haddad@demo.com', skills: ['PostgreSQL', 'Node.js', 'Database Design', 'Performance Tuning'], interests: ['Backend', 'Data Modeling'], sessionsCompleted: 99, averageRating: 4.7, mentorLevel: 'expert', verifiedSkills: ['PostgreSQL'], walletBalance: 640, repeatLearners: 21, sessionCompletionRate: 97 },
  { name: 'Grace Liu', email: 'grace.liu@demo.com', skills: ['MongoDB', 'Mongoose', 'Node.js', 'API Design'], interests: ['Backend', 'NoSQL Design'], sessionsCompleted: 86, averageRating: 4.6, mentorLevel: 'verified', verifiedSkills: ['MongoDB'], walletBalance: 520, repeatLearners: 16, sessionCompletionRate: 95 },
  { name: 'Samuel Reed', email: 'samuel.reed@demo.com', skills: ['Kubernetes', 'Docker', 'Helm', 'Observability'], interests: ['DevOps', 'Cloud Native'], sessionsCompleted: 107, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['Kubernetes'], walletBalance: 700, repeatLearners: 24, sessionCompletionRate: 98 },
  { name: 'Ritu Sharma', email: 'ritu.sharma@demo.com', skills: ['Terraform', 'AWS', 'Infrastructure as Code', 'DevOps'], interests: ['Cloud Automation', 'IaC'], sessionsCompleted: 95, averageRating: 4.7, mentorLevel: 'expert', verifiedSkills: ['Terraform'], walletBalance: 630, repeatLearners: 20, sessionCompletionRate: 97 },
  { name: 'Pavel Ivanov', email: 'pavel.ivanov@demo.com', skills: ['Ethical Hacking', 'Penetration Testing', 'OSINT', 'Web Security'], interests: ['Red Team', 'Bug Bounty'], sessionsCompleted: 88, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['Ethical Hacking'], walletBalance: 570, repeatLearners: 18, sessionCompletionRate: 96 },
  { name: 'Hannah Park', email: 'hannah.park@demo.com', skills: ['Network Security', 'Penetration Testing', 'Threat Modeling', 'Security Audits'], interests: ['AppSec', 'Security Reviews'], sessionsCompleted: 73, averageRating: 4.7, mentorLevel: 'verified', verifiedSkills: ['Network Security'], walletBalance: 460, repeatLearners: 12, sessionCompletionRate: 95 },
  { name: 'Imani Cole', email: 'imani.cole@demo.com', skills: ['Swift', 'iOS Development', 'UIKit', 'App Architecture'], interests: ['Mobile', 'User Experience'], sessionsCompleted: 79, averageRating: 4.6, mentorLevel: 'verified', verifiedSkills: ['Swift'], walletBalance: 500, repeatLearners: 14, sessionCompletionRate: 94 },
  { name: 'Takumi Sato', email: 'takumi.sato@demo.com', skills: ['Kotlin', 'Android Development', 'Jetpack Compose', 'Mobile Architecture'], interests: ['Android', 'Performance'], sessionsCompleted: 76, averageRating: 4.6, mentorLevel: 'verified', verifiedSkills: ['Kotlin'], walletBalance: 490, repeatLearners: 13, sessionCompletionRate: 94 },
  { name: 'Gabriel Costa', email: 'gabriel.costa@demo.com', skills: ['Business Strategy', 'Entrepreneurship', 'Unit Economics', 'Market Validation'], interests: ['Startups', 'Business Models'], sessionsCompleted: 68, averageRating: 4.5, mentorLevel: 'community', verifiedSkills: [], walletBalance: 410, repeatLearners: 11, sessionCompletionRate: 92 },
  { name: 'Sarah Ahmed', email: 'sarah.ahmed@demo.com', skills: ['Fundraising', 'Pitch Decks', 'Investor Relations', 'Startup Mentorship'], interests: ['Venture Capital', 'Founder Growth'], sessionsCompleted: 82, averageRating: 4.7, mentorLevel: 'verified', verifiedSkills: ['Fundraising'], walletBalance: 540, repeatLearners: 16, sessionCompletionRate: 95 },
  { name: 'Kevin Moore', email: 'kevin.moore@demo.com', skills: ['Product Analytics', 'SQL', 'A/B Testing', 'Product Management'], interests: ['Data-driven PM', 'Growth'], sessionsCompleted: 91, averageRating: 4.7, mentorLevel: 'verified', verifiedSkills: ['Product Management'], walletBalance: 600, repeatLearners: 19, sessionCompletionRate: 96 },
  { name: 'Aarti Menon', email: 'aarti.menon@demo.com', skills: ['MLOps', 'AWS', 'Kubernetes', 'Model Monitoring'], interests: ['Production ML', 'Scalable AI'], sessionsCompleted: 85, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['MLOps'], walletBalance: 560, repeatLearners: 17, sessionCompletionRate: 96 },
  { name: 'Yash Verma', email: 'yash.verma@demo.com', skills: ['Generative AI', 'Prompt Engineering', 'LLM Apps', 'Python'], interests: ['AI Products', 'Automation'], sessionsCompleted: 67, averageRating: 4.6, mentorLevel: 'community', verifiedSkills: [], walletBalance: 420, repeatLearners: 11, sessionCompletionRate: 93 },
  { name: 'Nora Blake', email: 'nora.blake@demo.com', skills: ['Cloud Security', 'AWS', 'IAM', 'Security Architecture'], interests: ['Security', 'Cloud Governance'], sessionsCompleted: 94, averageRating: 4.8, mentorLevel: 'expert', verifiedSkills: ['Cloud Security'], walletBalance: 610, repeatLearners: 20, sessionCompletionRate: 97 },
];

const sessionSkills = [
  'Python',
  'React',
  'Node.js',
  'Machine Learning',
  'AWS',
  'Docker',
  'Cybersecurity',
  'Product Management',
  'UI Design',
  'Digital Marketing',
  'Data Engineering',
  'Kubernetes',
  'Blockchain',
  'Game Development',
  'Public Speaking',
];

function toSkillObjects(skills) {
  return skills.map((name, index) => ({
    name,
    level: index === 0 ? 'expert' : index < 3 ? 'advanced' : 'intermediate',
  }));
}

function toReputation(rating, sessionsCompleted) {
  const score = Math.round(Math.min(99, rating * 18 + sessionsCompleted * 0.08));
  return Math.max(72, score);
}

function isEligibleForBadge(mentor, badgeName) {
  if (badgeName === 'Top Mentor') return mentor.sessionsCompleted >= 50 && mentor.averageRating >= 4.5;
  if (badgeName === 'Rising Mentor') return mentor.sessionsCompleted >= 10;
  if (badgeName === 'Skill Master') return (mentor.verifiedSkills || []).length > 0;
  if (badgeName === 'Highly Rated') return mentor.averageRating >= 4.8;
  if (badgeName === 'Community Builder') return mentor.repeatLearners >= 10;
  return false;
}

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();

    // Upsert badges
    const badgeMap = new Map();
    for (const badge of badgeDefs) {
      const upserted = await Badge.findOneAndUpdate(
        { badgeName: badge.badgeName },
        { $set: badge },
        { upsert: true, new: true }
      );
      badgeMap.set(upserted.badgeName, upserted);
    }

    // Upsert mentors (idempotent by email)
    const hashedPw = await hashPassword('demo123');

    const mentorDocs = rawMentors.map((m) => ({
      ...m,
      role: 'mentor',
      password: hashedPw,
      skills: toSkillObjects(m.skills),
      reputationScore: toReputation(m.averageRating, m.sessionsCompleted),
      suspended: false,
    }));

    const mentorWriteResult = await User.bulkWrite(
      mentorDocs.map((mentor) => ({
        updateOne: {
          filter: { email: mentor.email },
          update: {
            $setOnInsert: {
              name: mentor.name,
              email: mentor.email,
              password: mentor.password,
              role: mentor.role,
              skills: mentor.skills,
              interests: mentor.interests,
              walletBalance: mentor.walletBalance,
              reputationScore: mentor.reputationScore,
              sessionsCompleted: mentor.sessionsCompleted,
              averageRating: mentor.averageRating,
              mentorLevel: mentor.mentorLevel,
              verifiedSkills: mentor.verifiedSkills,
              suspended: mentor.suspended,
              repeatLearners: mentor.repeatLearners,
              sessionCompletionRate: mentor.sessionCompletionRate,
            },
          },
          upsert: true,
        },
      }))
    );

    const mentorEmails = mentorDocs.map((m) => m.email);
    const mentors = await User.find({ email: { $in: mentorEmails } }).select('_id name email sessionsCompleted averageRating verifiedSkills repeatLearners');

    // Upsert badge awards
    const userBadgeOps = [];
    for (const mentor of mentors) {
      for (const badgeDef of badgeDefs) {
        if (!isEligibleForBadge(mentor, badgeDef.badgeName)) continue;
        const badge = badgeMap.get(badgeDef.badgeName);
        if (!badge) continue;

        userBadgeOps.push({
          updateOne: {
            filter: { userId: mentor._id, badgeId: badge._id },
            update: {
              $setOnInsert: {
                userId: mentor._id,
                badgeId: badge._id,
                awardReason: `Met criteria: ${badge.criteria}`,
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (userBadgeOps.length > 0) {
      await UserBadge.bulkWrite(userBadgeOps);
    }

    // Seed sessions once to avoid endless duplicates
    const existingSessions = await Session.countDocuments();
    let createdSessions = 0;
    if (existingSessions === 0 && mentors.length > 1) {
      const sessionData = [];
      const totalSessions = 60;
      for (let i = 0; i < totalSessions; i++) {
        const mentorIdx = i % mentors.length;
        const learnerIdx = (i + 5) % mentors.length;
        if (mentorIdx === learnerIdx) continue;

        sessionData.push({
          mentor: mentors[mentorIdx]._id,
          learner: mentors[learnerIdx]._id,
          skill: sessionSkills[i % sessionSkills.length],
          scheduledAt: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
          duration: [30, 45, 60][i % 3],
          price: [10, 15, 20, 25][i % 4],
          status: 'completed',
          rating: [4, 4.5, 5, 4.5, 5][i % 5],
          review: ['Great session!', 'Very helpful mentor', 'Learned a lot', 'Excellent explanation', 'Would recommend'][i % 5],
        });
      }

      if (sessionData.length > 0) {
        const insertedSessions = await Session.insertMany(sessionData);
        createdSessions = insertedSessions.length;
      }
    }

    // Upsert subscriptions for first 16 mentors to make data realistic
    const subTargets = mentors.slice(0, 16);
    for (let i = 0; i < subTargets.length; i++) {
      const mentor = subTargets[i];
      const isPro = i < 10;

      await UserSubscription.findOneAndUpdate(
        { userId: mentor._id },
        {
          userId: mentor._id,
          planType: isPro ? 'pro' : 'free',
          status: 'active',
          startDate: new Date(),
          endDate: isPro ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
          paymentStatus: isPro ? 'completed' : 'none',
          features: isPro
            ? { recruiterVisibility: true, placementAccess: true, placementAnalytics: true }
            : { recruiterVisibility: false, placementAccess: false, placementAnalytics: false },
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      message: 'Demo data seeded successfully',
      created: {
        badges: badgeDefs.length,
        mentorsAddedThisRun: mentorWriteResult.upsertedCount || 0,
        mentorsTotalInSeedSet: mentors.length,
        userBadgeAwardsProcessed: userBadgeOps.length,
        sessionsAddedThisRun: createdSessions,
        subscriptionsProcessed: subTargets.length,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
