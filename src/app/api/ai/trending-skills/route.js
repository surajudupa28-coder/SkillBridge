import openai from '@/lib/openai';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';
import { scoreMentors, expandSkillAliases } from '@/lib/mentorMatching';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK_SKILLS = [
  {
    skill: 'React',
    description: 'Frontend library for building UI',
    demand: 'High',
    learningPath: 'JavaScript -> React -> Projects'
  },
  {
    skill: 'Docker',
    description: 'Containerization platform',
    demand: 'High',
    learningPath: 'Linux -> Containers -> Docker -> Deployments'
  }
];

const DEMAND_LEVELS = new Set(['High', 'Medium', 'Low']);

function normalizeSkillList(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function inferExperienceLevel(skills) {
  const total = skills.length;
  if (total >= 8) return 'advanced';
  if (total >= 4) return 'intermediate';
  return 'beginner';
}

function stripCodeFences(text) {
  return String(text || '').replace(/```json|```/gi, '').trim();
}

function isValidSkillObject(item) {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.skill !== 'string' || !item.skill.trim()) return false;
  if (typeof item.description !== 'string' || !item.description.trim()) return false;
  if (typeof item.learningPath !== 'string' || !item.learningPath.trim()) return false;
  if (typeof item.demand !== 'string' || !DEMAND_LEVELS.has(item.demand)) return false;
  return true;
}

function parseAndValidateAiJson(rawText) {
  const cleaned = stripCodeFences(rawText);
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('AI response is not a non-empty array');
  }

  const normalized = parsed
    .filter(isValidSkillObject)
    .map((item) => ({
      skill: item.skill.trim(),
      description: item.description.trim(),
      demand: item.demand,
      learningPath: item.learningPath.trim()
    }));

  if (normalized.length === 0) {
    throw new Error('AI response failed schema validation');
  }

  return normalized;
}

function isMissingSkill(userSkills, skillName) {
  const userSet = new Set(userSkills.map((s) => s.toLowerCase()));
  return !userSet.has(String(skillName).toLowerCase());
}

async function findMentorsForSkill(skillName) {
  const aliases = expandSkillAliases(skillName);
  const regexTerms = aliases.map((alias) => new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

  let mentors = await User.find({
    role: 'mentor',
    suspended: { $ne: true },
    $or: [
      { 'skills.name': { $in: regexTerms } },
      { verifiedSkills: { $in: regexTerms } }
    ]
  })
    .select('name skills averageRating availability mentorLevel sessionsCompleted reputationScore verifiedSkills')
    .limit(80)
    .lean();

  // If strict alias matching returns nothing, broaden to top mentors and score anyway.
  if (!mentors.length) {
    mentors = await User.find({ role: 'mentor', suspended: { $ne: true } })
      .select('name skills averageRating availability mentorLevel sessionsCompleted reputationScore verifiedSkills')
      .sort({ reputationScore: -1, averageRating: -1 })
      .limit(100)
      .lean();
  }

  const scored = scoreMentors({
    mentors,
    authUser: { interests: aliases },
    explicitSkills: aliases,
    skill: skillName,
    limit: 3
  });

  return scored.map((mentor) => ({
    _id: mentor._id,
    name: mentor.name,
    expertise: mentor.expertise,
    rating: mentor.rating,
    availability: Array.isArray(mentor.availability) ? mentor.availability : []
  }));
}

async function attachMentors(skillItems) {
  const withMentors = [];
  for (const item of skillItems) {
    const mentors = await findMentorsForSkill(item.skill);
    withMentors.push({ ...item, mentors });
  }
  return withMentors;
}

function buildPrompt({ userSkills, goal, experienceLevel }) {
  const today = new Date().toISOString().slice(0, 10);
  const skillsText = userSkills.length ? userSkills.join(', ') : 'No skills provided';
  const goalText = goal || 'No specific goal provided';

  return `You are a real-time tech market analyzer.
Date: ${today}

Analyze current global tech trends and return the most in-demand skills TODAY.
Focus on latest trending skills in 2025 and relevance to the user for career growth.
Prioritize these areas: AI/ML, Web Development, Cloud Computing, Cybersecurity, Data Engineering.

User profile:
- Current skills: ${skillsText}
- Career goal: ${goalText}
- Experience level: ${experienceLevel}

Requirements:
- Return ONLY strict JSON (no markdown, no prose)
- Return 6 items maximum
- Each item must be:
  {
    "skill": "",
    "description": "",
    "demand": "High | Medium | Low",
    "learningPath": ""
  }
- Keep skills relevant to the user goal and likely skill gaps.`;
}

async function generateTrendingSkills({ userSkills, goal, experienceLevel }) {
  const completion = await openai.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: 'Return valid JSON only. No markdown fences.'
      },
      {
        role: 'user',
        content: buildPrompt({ userSkills, goal, experienceLevel })
      }
    ],
    temperature: 0.4
  });

  const raw = completion?.choices?.[0]?.message?.content || '';
  const parsed = parseAndValidateAiJson(raw);
  const missing = parsed.filter((item) => isMissingSkill(userSkills, item.skill));

  return missing.length ? missing : parsed;
}

export async function POST(req) {
  try {
    await dbConnect();

    const authUser = await getAuthUser(req);
    const body = await req.json().catch(() => ({}));

    const userSkills = normalizeSkillList(authUser?.skills || body?.skills);
    const goal = String(body?.goal || authUser?.goal || '').trim();
    const experienceLevel = String(body?.experienceLevel || inferExperienceLevel(userSkills));

    const aiSkills = await generateTrendingSkills({ userSkills, goal, experienceLevel });
    const enriched = await attachMentors(aiSkills);

    return Response.json(enriched, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('Trending skills error:', error);

    try {
      await dbConnect();
      const fallback = await attachMentors(FALLBACK_SKILLS);
      return Response.json(fallback, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    } catch {
      return Response.json(FALLBACK_SKILLS, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }
  }
}