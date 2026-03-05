'use client';

export default function SkillTag({ name, level, verified }) {
  const levelColors = {
    beginner: 'bg-green-50 text-green-700 border-green-200',
    intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
    advanced: 'bg-purple-50 text-purple-700 border-purple-200',
    expert: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${levelColors[level] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      {name}
      {level && <span className="text-[10px] opacity-60">({level})</span>}
      {verified && <span className="text-blue-500" title="Verified">{'\u2713'}</span>}
    </span>
  );
}
