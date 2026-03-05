'use client';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
  'no-show-mentor': 'bg-red-100 text-red-700',
  'no-show-learner': 'bg-amber-100 text-amber-700',
};

export default function SessionCard({ session, currentUserId, onComplete, onCancel, onRate, onReport }) {
  const isMentor = session.mentor?._id === currentUserId || session.mentor === currentUserId;
  const otherPerson = isMentor ? session.learner : session.mentor;
  const role = isMentor ? 'Teaching' : 'Learning';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{session.skill}</h3>
          <p className="text-sm text-gray-500">{role} — with {otherPerson?.name || 'Unknown'}</p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[session.status] || 'bg-gray-100 text-gray-700'}`}>
          {session.status}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
        <span>{new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span>{session.duration || 60} min</span>
        <span>{session.price} coins</span>
      </div>
      {session.rating && (
        <div className="text-sm text-gray-600 mb-3">
          Rating: {'\u2605'.repeat(session.rating)}{'\u2606'.repeat(5 - session.rating)}
          {session.review && <span className="ml-2 text-gray-400">— {session.review}</span>}
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {session.status === 'scheduled' && isMentor && (
          <button onClick={() => onComplete && onComplete(session._id)}
            className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Mark Complete
          </button>
        )}
        {session.status === 'scheduled' && (
          <button onClick={() => onCancel && onCancel(session._id)}
            className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
            Cancel
          </button>
        )}
        {session.status === 'completed' && !isMentor && !session.rating && (
          <button onClick={() => onRate && onRate(session)}
            className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
            Rate Session
          </button>
        )}
        {session.status === 'completed' && (
          <button onClick={() => onReport && onReport(session._id)}
            className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            Report
          </button>
        )}
      </div>
    </div>
  );
}
