'use client';
import { useState, useEffect } from 'react';

const statusColors = {
  scheduled: 'bg-blue-500/20 text-blue-200 border border-blue-400/30',
  completed: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30',
  cancelled: 'bg-slate-700/60 text-slate-200 border border-slate-600',
  'no-show-mentor': 'bg-rose-500/20 text-rose-200 border border-rose-400/30',
  'no-show-learner': 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
};

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function SessionCard({ session, currentUserId, onComplete, onCancel, onRate, onReport }) {
  const isMentor = session.mentor?._id === currentUserId || session.mentor === currentUserId;
  const otherPerson = isMentor ? session.learner : session.mentor;
  const role = isMentor ? 'Teaching' : 'Learning';

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (session.status !== 'scheduled') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session.status]);

  const startMs = session.scheduledAt ? new Date(session.scheduledAt).getTime() : null;
  const endMs = startMs ? startMs + (session.duration || 60) * 60 * 1000 : null;
  const sessionActive = startMs && endMs && now >= startMs && now <= endMs;
  const sessionNotStarted = startMs && now < startMs;

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/20 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-100">{session.skill}</h3>
          <p className="text-sm text-slate-400">{role} — with {otherPerson?.name || 'Unknown'}</p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[session.status] || 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
          {session.status}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
        <span>{new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span>{session.duration || 60} min</span>
        <span>{session.price} coins</span>
      </div>
      {session.rating && (
        <div className="text-sm text-slate-300 mb-3">
          Rating: {'\u2605'.repeat(session.rating)}{'\u2606'.repeat(5 - session.rating)}
          {session.review && <span className="ml-2 text-slate-500">— {session.review}</span>}
        </div>
      )}

      {session.status === 'scheduled' && session.meetingLink && (
        <div className="mb-3">
          {sessionActive ? (
            <button
              onClick={() => window.open(session.meetingLink, '_blank')}
              className="w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Join Session
            </button>
          ) : sessionNotStarted ? (
            <p className="text-sm text-slate-300 bg-slate-800/70 rounded-lg px-3 py-2 border border-slate-700">
              Session starts in: <span className="font-mono font-semibold text-indigo-600">{formatCountdown(startMs - now)}</span>
            </p>
          ) : null}
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
            className="px-3 py-1.5 text-xs bg-slate-800 text-slate-200 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">
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
            className="px-3 py-1.5 text-xs border border-red-500/40 text-red-300 rounded-lg hover:bg-red-500/10 transition-colors">
            Report
          </button>
        )}
      </div>
    </div>
  );
}
