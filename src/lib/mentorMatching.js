function normalizeSkill(value) {
  return String(value || '').trim().toLowerCase();
}

function uniqueSkills(skills = []) {
  return [...new Set(skills.map(normalizeSkill).filter(Boolean))];
}

function getMentorSkillNames(mentor) {
  const fromSkills = Array.isArray(mentor?.skills)
    ? mentor.skills.map((s) => (typeof s === 'string' ? s : s?.name))
    : [];
  const fromVerified = Array.isArray(mentor?.verifiedSkills) ? mentor.verifiedSkills : [];
  return uniqueSkills([...fromSkills, ...fromVerified]);
}

function overlapRatio(targetSkills, mentorSkills) {
  if (!targetSkills.length || !mentorSkills.length) return 0;

  const matched = targetSkills.filter((target) =>
    mentorSkills.some((mentorSkill) => mentorSkill === target || mentorSkill.includes(target) || target.includes(mentorSkill))
  ).length;

  return matched / targetSkills.length;
}

export function scoreMentors({ mentors, authUser, explicitSkills = [], skill = '', limit = 5 }) {
  const targetSkills = uniqueSkills(explicitSkills);
  const learnerInterests = uniqueSkills(authUser?.interests || []);
  const singleSkill = normalizeSkill(skill);

  const scored = (Array.isArray(mentors) ? mentors : []).map((mentor) => {
    const mentorSkillNames = getMentorSkillNames(mentor);

    let overlap = 0;
    if (targetSkills.length > 0) {
      overlap = overlapRatio(targetSkills, mentorSkillNames);
    } else if (learnerInterests.length > 0) {
      overlap = overlapRatio(learnerInterests, mentorSkillNames);
    } else if (singleSkill) {
      overlap = mentorSkillNames.some((s) => s === singleSkill || s.includes(singleSkill) || singleSkill.includes(s)) ? 1 : 0;
    }

    const normalizedReputation = Math.min((mentor.reputationScore || 0) / 100, 1);
    const normalizedRating = Math.min((mentor.averageRating || 0) / 5, 1);
    const normalizedSessions = Math.min((mentor.sessionsCompleted || 0) / 120, 1);

    const verifiedBoost = mentorSkillNames.length > 0 ? Math.min((mentor.verifiedSkills || []).length / 4, 1) : 0;
    const levelBoost = mentor.mentorLevel === 'expert' ? 1 : mentor.mentorLevel === 'verified' ? 0.6 : 0.3;

    const matchScore =
      overlap * 0.5 +
      normalizedReputation * 0.2 +
      normalizedRating * 0.15 +
      normalizedSessions * 0.1 +
      verifiedBoost * 0.03 +
      levelBoost * 0.02;

    return {
      _id: mentor._id,
      name: mentor.name,
      skills: mentor.skills,
      averageRating: mentor.averageRating,
      mentorLevel: mentor.mentorLevel,
      sessionsCompleted: mentor.sessionsCompleted,
      reputationScore: mentor.reputationScore,
      verifiedSkills: mentor.verifiedSkills,
      availability: mentor.availability,
      matchScore: Math.round(matchScore * 100) / 100,
      expertise: mentorSkillNames.slice(0, 4).join(', '),
      rating: Number(mentor.averageRating || 0)
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored.slice(0, limit);
}

export function expandSkillAliases(skillName) {
  const normalized = normalizeSkill(skillName);
  const aliasMap = {
    react: ['react', 'next.js', 'javascript', 'typescript', 'frontend'],
    docker: ['docker', 'kubernetes', 'devops', 'containerization', 'cloud'],
    'frontend development': ['frontend', 'react', 'next.js', 'javascript', 'typescript', 'css'],
    'machine learning': ['machine learning', 'deep learning', 'python', 'mlops', 'data science'],
    cybersecurity: ['cybersecurity', 'network security', 'ethical hacking', 'appsec', 'security'],
    'data engineering': ['data engineering', 'spark', 'airflow', 'etl', 'sql', 'python']
  };

  const aliases = aliasMap[normalized] || [normalized];
  return uniqueSkills(aliases);
}
