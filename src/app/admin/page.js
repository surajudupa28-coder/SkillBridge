'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import DashboardCard from '@/components/DashboardCard';

const TABS = ['Overview', 'Verifications', 'Documents', 'Reports'];

const V_STATUS_COLORS = {
  'unverified': 'bg-slate-800 text-slate-300',
  'testing': 'bg-blue-100 text-blue-700',
  'under-review': 'bg-amber-100 text-amber-700',
  'verified': 'bg-green-100 text-green-700',
  'rejected': 'bg-red-100 text-red-700',
};

const D_STATUS_COLORS = {
  'pending': 'bg-amber-100 text-amber-700',
  'verified': 'bg-green-100 text-green-700',
  'rejected': 'bg-red-100 text-red-700',
};

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [dbUser, setDbUser] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [vFilter, setVFilter] = useState('');
  const [dFilter, setDFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [reviewModal, setReviewModal] = useState(null); // { type: 'verification'|'document', id, action, notes }

  useEffect(() => { if (isLoaded && !user) router.push('/login'); }, [user, isLoaded, router]);
  
  // Fetch DB-backed role for admin gate (not Clerk metadata)
  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/users/profile')
        .then(r => r.json())
        .then(d => {
          if (d.user) setDbUser(d.user);
          if (!d.user || d.user.role !== 'admin') router.push('/dashboard');
        })
        .catch(() => router.push('/dashboard'));
    }
  }, [user, isLoaded, router]);

  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => {});
      fetch('/api/admin/reports').then(r => r.json()).then(d => setReports(d.reports || [])).catch(() => {});
      fetchVerifications('');
      fetchDocuments('');
    }
  }, [isLoaded, user]);

  const fetchVerifications = async (status) => {
    const url = status ? `/api/admin/verifications?status=${status}` : '/api/admin/verifications';
    try {
      const res = await fetch(url);
      const data = await res.json();
      setVerifications(data.verifications || []);
    } catch {}
  };

  const fetchDocuments = async (status) => {
    const url = status ? `/api/admin/documents?status=${status}` : '/api/admin/documents';
    try {
      const res = await fetch(url);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {}
  };

  const updateReport = async (reportId, status) => {
    try {
      await fetch('/api/admin/reports', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId, status }) });
      setReports(reports.map(r => r._id === reportId ? { ...r, status } : r));
      setMsg('Report updated');
    } catch (err) { setMsg(err.message); }
  };

  const suspendUser = async (userId, suspend) => {
    try {
      await fetch('/api/admin/suspend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, suspend }) });
      setMsg(suspend ? 'User suspended' : 'User unsuspended');
    } catch (err) { setMsg(err.message); }
  };

  const handleReviewSubmit = async () => {
    if (!reviewModal) return;
    try {
      if (reviewModal.type === 'verification') {
        const res = await fetch('/api/admin/verifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verificationId: reviewModal.id, action: reviewModal.action, reviewNotes: reviewModal.notes })
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
        setMsg(`Verification ${reviewModal.action}d`);
        fetchVerifications(vFilter);
      } else if (reviewModal.type === 'document') {
        const res = await fetch('/api/admin/documents', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: reviewModal.id, action: reviewModal.action, reviewerNotes: reviewModal.notes })
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
        setMsg(`Document ${reviewModal.action}d`);
        fetchDocuments(dFilter);
      }
    } catch (err) { setMsg(err.message); }
    setReviewModal(null);
  };

  if (!isLoaded || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="saas-shell">
      <Sidebar />
      <main className="saas-main">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mb-6">Manage users, verifications, documents, and reports</p>

        {msg && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex justify-between">
            {msg} <button onClick={() => setMsg('')} className="text-blue-400 hover:text-blue-600">x</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-slate-900/40 rounded-lg p-1 border border-slate-800/80 w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-900/40'}`}>{t}
              {t === 'Documents' && documents.filter(d => d.verificationStatus === 'pending').length > 0 && (
                <span className="ml-1.5 bg-amber-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">{documents.filter(d => d.verificationStatus === 'pending').length}</span>
              )}
              {t === 'Verifications' && verifications.filter(v => v.verificationStatus === 'under-review' || v.verificationStatus === 'testing').length > 0 && (
                <span className="ml-1.5 bg-blue-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">{verifications.filter(v => v.verificationStatus === 'under-review' || v.verificationStatus === 'testing').length}</span>
              )}
            </button>
          ))}
        </div>

        {/* TAB: Overview */}
        {tab === 'Overview' && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <DashboardCard title="Total Users" value={stats.totalUsers} icon="@" color="indigo" />
              <DashboardCard title="Total Sessions" value={stats.totalSessions} icon="#" color="blue" />
              <DashboardCard title="Coins in Circulation" value={`${stats.totalCoins} SC`} icon="$" color="green" />
              <DashboardCard title="Pending Reports" value={stats.pendingReports} icon="!" color="rose" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-semibold text-slate-100 mb-4">Top Mentors</h3>
                <div className="space-y-3">
                  {stats.topMentors?.map((m, i) => (
                    <div key={m._id} className="flex items-center justify-between py-2 border-b border-slate-800/70">
                      <div className="flex items-center gap-3"><span className="text-sm font-bold text-slate-500 w-6">{i + 1}</span><div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-slate-500">{m.sessionsCompleted} sessions</p></div></div>
                      <span className="text-sm font-semibold text-indigo-600">{m.reputationScore?.toFixed(1)}</span>
                    </div>
                  ))}
                  {(!stats.topMentors || stats.topMentors.length === 0) && <p className="text-slate-500 text-sm">No mentors yet</p>}
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-semibold text-slate-100 mb-4">Popular Skills</h3>
                <div className="space-y-2">
                  {stats.popularSkills?.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-slate-300">{s._id}</span>
                      <div className="flex items-center gap-2"><div className="w-24 bg-slate-800 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min((s.count / (stats.popularSkills[0]?.count || 1)) * 100, 100)}%` }}></div></div><span className="text-xs text-slate-400 w-8">{s.count}</span></div>
                    </div>
                  ))}
                  {(!stats.popularSkills || stats.popularSkills.length === 0) && <p className="text-slate-500 text-sm">No sessions yet</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB: Verifications */}
        {tab === 'Verifications' && (
          <div>
            <div className="flex gap-2 mb-4">
              {['', 'testing', 'under-review', 'verified', 'rejected'].map(f => (
                <button key={f} onClick={() => { setVFilter(f); fetchVerifications(f); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${vFilter === f ? 'bg-indigo-600 text-white' : 'bg-slate-900/40 border border-slate-700 text-slate-300 hover:bg-slate-900/70'}`}>
                  {f ? f.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'All'}
                </button>
              ))}
            </div>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-700 bg-slate-900/40">
                    <th className="text-left py-3 px-4 font-medium text-slate-400">User</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Skill</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Test</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Portfolio</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Docs</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Endorse</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Final</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Actions</th>
                  </tr></thead>
                  <tbody>
                    {verifications.map(v => (
                      <tr key={v._id} className="border-b border-slate-800/70 hover:bg-slate-900/40">
                        <td className="py-3 px-4"><div><p className="font-medium">{v.user?.name}</p><p className="text-[10px] text-slate-500">{v.user?.email}</p></div></td>
                        <td className="py-3 px-4 font-medium">{v.skillName}</td>
                        <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${V_STATUS_COLORS[v.verificationStatus] || 'bg-slate-800 text-slate-300'}`}>{v.verificationStatus}</span></td>
                        <td className="py-3 px-4">{v.testScore || '-'}</td>
                        <td className="py-3 px-4">{v.portfolioScore || '-'}</td>
                        <td className="py-3 px-4">{v.documentScore || '-'}</td>
                        <td className="py-3 px-4">{v.endorsementScore || '-'}</td>
                        <td className="py-3 px-4 font-semibold text-indigo-600">{v.finalVerificationScore || '-'}</td>
                        <td className="py-3 px-4">
                          {v.verificationStatus !== 'verified' && (
                            <div className="flex gap-1">
                              <button onClick={() => setReviewModal({ type: 'verification', id: v._id, action: 'approve', notes: '' })} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Approve</button>
                              <button onClick={() => setReviewModal({ type: 'verification', id: v._id, action: 'reject', notes: '' })} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Reject</button>
                            </div>
                          )}
                          {v.verificationStatus === 'verified' && <span className="text-green-600 text-xs font-medium">{'\u2713'} Verified</span>}
                          {v.reviewNotes && <p className="text-[10px] text-slate-500 mt-1 max-w-[150px] truncate" title={v.reviewNotes}>Note: {v.reviewNotes}</p>}
                        </td>
                      </tr>
                    ))}
                    {verifications.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-slate-500">No verification records</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Documents */}
        {tab === 'Documents' && (
          <div>
            <div className="flex gap-2 mb-4">
              {['', 'pending', 'verified', 'rejected'].map(f => (
                <button key={f} onClick={() => { setDFilter(f); fetchDocuments(f); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${dFilter === f ? 'bg-indigo-600 text-white' : 'bg-slate-900/40 border border-slate-700 text-slate-300 hover:bg-slate-900/70'}`}>
                  {f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'}
                </button>
              ))}
            </div>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-700 bg-slate-900/40">
                    <th className="text-left py-3 px-4 font-medium text-slate-400">User</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Skill</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Document</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Organization</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">File</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Actions</th>
                  </tr></thead>
                  <tbody>
                    {documents.map(d => (
                      <tr key={d._id} className="border-b border-slate-800/70 hover:bg-slate-900/40">
                        <td className="py-3 px-4"><p className="font-medium">{d.user?.name}</p></td>
                        <td className="py-3 px-4">{d.skillName}</td>
                        <td className="py-3 px-4"><p className="font-medium max-w-[150px] truncate" title={d.documentTitle}>{d.documentTitle}</p>{d.description && <p className="text-[10px] text-slate-500 max-w-[150px] truncate">{d.description}</p>}</td>
                        <td className="py-3 px-4"><span className="text-xs bg-slate-800 px-1.5 py-0.5 rounded">{d.documentType}</span></td>
                        <td className="py-3 px-4 text-xs">{d.issuingOrganization || '-'}</td>
                        <td className="py-3 px-4"><a href={d.fileURL} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block max-w-[120px]">View File</a></td>
                        <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${D_STATUS_COLORS[d.verificationStatus] || 'bg-slate-800'}`}>{d.verificationStatus}</span></td>
                        <td className="py-3 px-4">{d.scoreAwarded > 0 ? `+${d.scoreAwarded}` : '-'}</td>
                        <td className="py-3 px-4">
                          {d.verificationStatus === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => setReviewModal({ type: 'document', id: d._id, action: 'approve', notes: '' })} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Approve</button>
                              <button onClick={() => setReviewModal({ type: 'document', id: d._id, action: 'reject', notes: '' })} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Reject</button>
                            </div>
                          )}
                          {d.reviewerNotes && <p className="text-[10px] text-slate-500 mt-1 truncate max-w-[150px]">{d.reviewerNotes}</p>}
                        </td>
                      </tr>
                    ))}
                    {documents.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-slate-500">No documents</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Reports */}
        {tab === 'Reports' && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-slate-100 mb-4">Session Reports</h3>
            {reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 font-medium text-slate-400">Reporter</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-400">Reported</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-400">Reason</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-400">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-400">Actions</th>
                  </tr></thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r._id} className="border-b border-slate-800/70">
                        <td className="py-2 px-3">{r.reporter?.name}</td>
                        <td className="py-2 px-3">{r.reported?.name}</td>
                        <td className="py-2 px-3 max-w-xs truncate">{r.reason}</td>
                        <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : r.status === 'reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{r.status}</span></td>
                        <td className="py-2 px-3">
                          <div className="flex gap-1">
                            {r.status === 'pending' && <button onClick={() => updateReport(r._id, 'reviewed')} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Review</button>}
                            {r.status !== 'resolved' && <button onClick={() => updateReport(r._id, 'resolved')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Resolve</button>}
                            <button onClick={() => suspendUser(r.reported?._id, true)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Suspend</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-slate-500 text-sm">No reports</p>}
          </div>
        )}

        {/* Review Notes Modal */}
        {reviewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-1">{reviewModal.action === 'approve' ? 'Approve' : 'Reject'} {reviewModal.type === 'verification' ? 'Verification' : 'Document'}</h3>
              <p className="text-sm text-slate-400 mb-4">Add optional review notes before confirming.</p>
              <textarea value={reviewModal.notes} onChange={e => setReviewModal({ ...reviewModal, notes: e.target.value })}
                rows={3} placeholder="Review notes (optional)..." className="w-full px-3 py-2 border rounded-lg text-sm mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setReviewModal(null)} className="flex-1 px-4 py-2 border border-slate-700 rounded-lg text-sm hover:bg-slate-900/40">Cancel</button>
                <button onClick={handleReviewSubmit}
                  className={`flex-1 px-4 py-2 text-white rounded-lg text-sm ${reviewModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  Confirm {reviewModal.action === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


