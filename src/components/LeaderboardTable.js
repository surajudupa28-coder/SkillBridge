'use client';

export default function LeaderboardTable({ leaders }) {
  if (!leaders || leaders.length === 0) {
    return <p className="text-gray-400 text-sm py-4">No leaders found.</p>;
  }

  const levelColors = {
    community: 'bg-gray-100 text-gray-700',
    verified: 'bg-blue-100 text-blue-700',
    expert: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-500">#</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Skills</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Reputation</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Rating</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Sessions</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Level</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((leader, i) => (
            <tr key={leader._id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-bold text-gray-400">{i + 1}</td>
              <td className="py-3 px-4 font-medium text-gray-900">{leader.name}</td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1">
                  {leader.skills?.slice(0, 3).map((s, j) => (
                    <span key={j} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">
                      {typeof s === 'string' ? s : s.name}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-4 font-semibold text-indigo-600">{leader.reputationScore?.toFixed(1)}</td>
              <td className="py-3 px-4">{'\u2605'} {leader.averageRating?.toFixed(1)}</td>
              <td className="py-3 px-4">{leader.sessionsCompleted}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColors[leader.mentorLevel] || levelColors.community}`}>
                  {leader.mentorLevel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
