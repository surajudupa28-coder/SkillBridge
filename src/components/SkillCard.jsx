import MentorCard from '@/components/MentorCard.jsx';

const demandColors = {
  High: 'bg-red-500/20 text-red-200 border border-red-400/30',
  Medium: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
  Low: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30',
};

export default function SkillCard({ item, onBook }) {
  const badgeClass = demandColors[item.demand] || 'bg-slate-800 text-slate-300 border border-slate-700';

  return (
    <article className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/20 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-100">{item.skill}</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
          {item.demand} Demand
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-300">{item.description}</p>

      <div className="mt-4 rounded-lg border border-indigo-400/20 bg-indigo-500/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Learning Path</p>
        <p className="mt-1 text-sm text-indigo-100">{item.learningPath}</p>
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-semibold text-slate-200">Mentor Recommendations</h4>
        {Array.isArray(item.mentors) && item.mentors.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-3">
            {item.mentors.map((mentor, index) => (
              <MentorCard
                key={`${item.skill}-${mentor.name}-${index}`}
                mentor={mentor}
                onBook={onBook}
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No mentors found for this skill right now.</p>
        )}
      </div>
    </article>
  );
}