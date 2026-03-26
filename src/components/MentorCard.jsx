export default function MentorCard({ mentor, onBook }) {
  const ratingValue = Number(mentor?.rating || 0);
  const rating = Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : '0.0';

  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <h5 className="text-sm font-semibold text-slate-100">{mentor?.name || 'Mentor'}</h5>
        <span className="text-xs font-medium text-indigo-300">⭐ {rating}</span>
      </div>

      <p className="mt-2 text-xs text-slate-300">
        Expertise: {mentor?.expertise || 'General mentoring'}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Availability: {Array.isArray(mentor?.availability) && mentor.availability.length > 0 ? 'Available' : 'Flexible'}
      </p>

      <button
        type="button"
        onClick={() => onBook?.(mentor)}
        className="mt-3 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
      >
        Book Session
      </button>
    </div>
  );
}