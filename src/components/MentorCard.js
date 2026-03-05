'use client';
import { useRouter } from 'next/navigation';

export default function MentorCard({ mentor, onBook }) {
  const router = useRouter();
  const levelColors = {
    community: 'bg-gray-100 text-gray-700',
    verified: 'bg-blue-100 text-blue-700',
    expert: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${levelColors[mentor.mentorLevel] || levelColors.community}`}>
            {mentor.mentorLevel?.charAt(0).toUpperCase() + mentor.mentorLevel?.slice(1)} Mentor
          </span>
        </div>
        {mentor.matchScore !== undefined && (
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600">{Math.round(mentor.matchScore * 100)}%</p>
            <p className="text-xs text-gray-400">match</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {mentor.skills?.slice(0, 5).map((s, i) => (
          <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
            {typeof s === 'string' ? s : s.name}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span>{'\u2605'} {mentor.averageRating?.toFixed(1)}</span>
        <span>{mentor.sessionsCompleted} sessions</span>
        <span>Rep: {mentor.reputationScore?.toFixed(1)}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => router.push(`/profile/${mentor._id}`)}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          View Profile
        </button>
        <button onClick={() => onBook && onBook(mentor)}
          className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Book Session
        </button>
      </div>
    </div>
  );
}
