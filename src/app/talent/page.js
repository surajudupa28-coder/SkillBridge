'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';

const TABS = ['Talent Search', 'Hiring Pipeline', 'Company Plan'];
const STAGES = ['saved', 'interviewing', 'hired'];
const STAGE_LABELS = { saved: 'Saved', interviewing: 'Interviewing', hired: 'Hired' };
const STAGE_COLORS = {
  saved: 'bg-blue-50 border-blue-200 text-blue-800',
  interviewing: 'bg-amber-50 border-amber-200 text-amber-800',
  hired: 'bg-green-50 border-green-200 text-green-800',
};
const LEVEL_COLORS = {
  community: 'bg-slate-800 text-slate-300',
  verified: 'bg-blue-100 text-blue-700',
  expert: 'bg-purple-100 text-purple-700',
};
const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 'Free',
    description: 'Basic talent search for small teams getting started.',
    features: ['Talent Search', 'Up to 10 Shortlisted Candidates', 'Basic Filters', 'Email Support'],
    color: 'border-slate-700',
    badge: 'bg-slate-800 text-slate-300',
  },
  {
    key: 'professional',
    name: 'Professional',
    price: '$99/mo',
    description: 'Advanced recruiting tools for growing companies.',
    features: ['Everything in Starter', 'Advanced Filters', 'Full Analytics Dashboard', 'Unlimited Shortlist', 'Hiring Pipeline', 'Priority Support'],
    color: 'border-indigo-400',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '$299/mo',
    description: 'Complete platform access for large organizations.',
    features: ['Everything in Professional', 'API Access', 'Custom Integrations', 'Dedicated Account Manager', 'SLA Guarantee', 'Bulk Hiring Tools'],
    color: 'border-purple-400',
    badge: 'bg-purple-100 text-purple-700',
  },
];

export default function TalentPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(0);
  const [talent, setTalent] = useState([]);
  const [skillDist, setSkillDist] = useState([]);
  const [skill, setSkill] = useState('');
  const [searching, setSearching] = useState(false);
  const [placementOnly, setPlacementOnly] = useState(false);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [pipeline, setPipeline] = useState({ saved: [], interviewing: [], hired: [] });
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [pipelineAction, setPipelineAction] = useState(null);

  const [companyPlan, setCompanyPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

  const [savingCandidate, setSavingCandidate] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    if (!isLoaded || !user) router.push('/login');
  }, [user, isLoaded, router]);

  const authHeaders = useCallback(() => ({
    headers: { 'Content-Type': 'application/json' },
  }), []);

  const fetchTalent = useCallback(async (s) => {
    
    setSearching(true);
    try {
      const url = s ? `/api/talent?skill=${encodeURIComponent(s)}` : '/api/talent';
      const res = await fetch(url);
      const data = await res.json();
      setTalent(data.talent || []);
      setSkillDist(data.skillDistribution || []);
    } catch {
      /* network error */
    } finally {
      setSearching(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/talent/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch {
      /* network error */
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchPipeline = useCallback(async () => {
    
    setPipelineLoading(true);
    try {
      const res = await fetch('/api/pipeline');
      const data = await res.json();
      setPipeline({
        saved: data.saved || [],
        interviewing: data.interviewing || [],
        hired: data.hired || [],
      });
      const ids = new Set();
      [...(data.saved || []), ...(data.interviewing || []), ...(data.hired || [])].forEach(e => {
        if (e.candidateId?._id) ids.add(e.candidateId._id);
      });
      setSavedIds(ids);
    } catch {
      /* network error */
    } finally {
      setPipelineLoading(false);
    }
  }, []);

  const fetchCompanyPlan = useCallback(async () => {
    
    setPlanLoading(true);
    try {
      const res = await fetch('/api/subscriptions/company');
      const data = await res.json();
      setCompanyPlan(data);
    } catch {
      /* network error */
    } finally {
      setPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    if ( (user?.role === 'company' || user?.role === 'admin')) {
      fetchTalent('');
      fetchAnalytics();
      fetchPipeline();
      fetchCompanyPlan();
    }
  }, [user, fetchTalent, fetchAnalytics, fetchPipeline, fetchCompanyPlan]);

  const saveToPipeline = async (candidate) => {
    if (savedIds.has(candidate._id)) return;
    setSavingCandidate(candidate._id);
    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        ...authHeaders(),
        body: JSON.stringify({
          candidateId: candidate._id,
          skill: candidate.skills?.[0]?.name || '',
          notes: '',
        }),
      });
      if (res.ok) {
        setSavedIds(prev => new Set([...prev, candidate._id]));
        await fetchPipeline();
      }
    } catch {
      /* network error */
    } finally {
      setSavingCandidate(null);
    }
  };

  const movePipelineEntry = async (entryId, newStage) => {
    
    setPipelineAction(entryId);
    try {
      const res = await fetch(`/api/pipeline/${entryId}`, {
        method: 'PUT',
        ...authHeaders(),
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) await fetchPipeline();
    } catch {
      /* network error */
    } finally {
      setPipelineAction(null);
    }
  };

  const removePipelineEntry = async (entryId, candidateDbId) => {
    
    setPipelineAction(entryId);
    try {
      const res = await fetch(`/api/pipeline/${entryId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        if (candidateDbId) {
          setSavedIds(prev => {
            const next = new Set(prev);
            next.delete(candidateDbId);
            return next;
          });
        }
        await fetchPipeline();
      }
    } catch {
      /* network error */
    } finally {
      setPipelineAction(null);
    }
  };

  const upgradePlan = async (planType) => {
    
    setUpgrading(planType);
    try {
      const res = await fetch('/api/subscriptions/company', {
        method: 'POST',
        ...authHeaders(),
        body: JSON.stringify({ planType }),
      });
      if (res.ok) await fetchCompanyPlan();
    } catch {
      /* network error */
    } finally {
      setUpgrading(null);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (user.role !== 'company' && user.role !== 'admin') {
    return (
      <div className="saas-shell">
        <Sidebar />
        <main className="saas-main">
          <div className="glass-card p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Talent Intelligence</h2>
            <p className="text-slate-400 mb-4">This dashboard is available for company accounts.</p>
            <p className="text-sm text-slate-500">Contact us to upgrade your account for recruiter access.</p>
          </div>
        </main>
      </div>
    );
  }

  const filteredTalent = placementOnly
    ? talent.filter(t => t.verifiedSkills && t.verifiedSkills.length > 0)
    : talent;

  const nextStages = (currentStage) => STAGES.filter(s => s !== currentStage);

  return (
    <div className="saas-shell">
      <Sidebar />
      <main className="saas-main">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Talent Intelligence</h1>
        <p className="text-slate-400 mb-6">Discover top-performing mentors, manage your hiring pipeline, and control your plan</p>

        {/* Analytics Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-400">Placement Candidates</span>
              <span className="text-lg text-indigo-500">&#9670;</span>
            </div>
            {analyticsLoading ? (
              <div className="h-8 w-20 bg-slate-800 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-slate-100">{analytics?.totalCandidates ?? 0}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">Active Pro subscribers</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-400">Top Skills This Month</span>
              <span className="text-lg text-blue-500">&#9733;</span>
            </div>
            {analyticsLoading ? (
              <div className="h-8 w-20 bg-slate-800 rounded animate-pulse"></div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {(analytics?.topSkillsThisMonth || []).slice(0, 3).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                    {s.skill}
                  </span>
                ))}
                {(!analytics?.topSkillsThisMonth || analytics.topSkillsThisMonth.length === 0) && (
                  <span className="text-sm text-slate-500">No data yet</span>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Most in-demand skills</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-400">Avg Reputation Score</span>
              <span className="text-lg text-amber-500">&#9829;</span>
            </div>
            {analyticsLoading ? (
              <div className="h-8 w-20 bg-slate-800 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-slate-100">{analytics?.averageReputationScore ?? 0}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">Across experienced mentors</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-400">Top Performing Mentors</span>
              <span className="text-lg text-green-500">&#9650;</span>
            </div>
            {analyticsLoading ? (
              <div className="h-8 w-20 bg-slate-800 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-slate-100">{analytics?.topPerformingMentors?.length ?? 0}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">5+ sessions completed</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-slate-900/40 rounded-lg border border-slate-700 p-1 w-fit">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === idx
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab 1: Talent Search */}
        {activeTab === 0 && (
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <input
                type="text"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="Filter by skill..."
                onKeyDown={(e) => e.key === 'Enter' && fetchTalent(skill)}
                className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
              />
              <button
                onClick={() => fetchTalent(skill)}
                disabled={searching}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => setPlacementOnly(!placementOnly)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    placementOnly ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      placementOnly ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-slate-300">Placement Ready Only</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 glass-card p-6">
                <h3 className="font-semibold text-slate-100 mb-4">Top Performers</h3>
                {filteredTalent.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-3 font-medium text-slate-400">#</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-400">Name</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-400">Sessions</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-400">Avg Rating</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-400">Completion</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-400">Consistency</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-400">Level</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-400">Verified</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-400">Subscription</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-400">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTalent.map((t, i) => (
                          <tr key={t._id} className="border-b border-slate-800/70 hover:bg-slate-900/40">
                            <td className="py-2 px-3 font-bold text-slate-500">{i + 1}</td>
                            <td className="py-2 px-3 font-medium">{t.name}</td>
                            <td className="py-2 px-3">{t.sessionsTaught}</td>
                            <td className="py-2 px-3">&#9733; {t.averageRating?.toFixed(1)}</td>
                            <td className="py-2 px-3">{t.completionRate}%</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-800 rounded-full h-1.5">
                                  <div
                                    className="bg-indigo-500 h-1.5 rounded-full"
                                    style={{ width: `${t.skillConsistency}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs">{t.skillConsistency}%</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[t.mentorLevel] || 'bg-slate-800 text-slate-300'}`}>
                                {t.mentorLevel}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {t.verifiedSkills && t.verifiedSkills.length > 0 ? (
                                <div className="flex gap-1 flex-wrap">
                                  {t.verifiedSkills.slice(0, 3).map((vs, vi) => (
                                    <span key={vi} className="inline-flex items-center px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium" title={vs}>
                                      &#10003; {typeof vs === 'string' ? vs.slice(0, 8) : 'Verified'}
                                    </span>
                                  ))}
                                  {t.verifiedSkills.length > 3 && (
                                    <span className="text-xs text-slate-500">+{t.verifiedSkills.length - 3}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500">None</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {t.verifiedSkills && t.verifiedSkills.length > 0 ? (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">Pro</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-900/40 text-slate-400 rounded-full text-xs font-medium">Free</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <button
                                onClick={() => saveToPipeline(t)}
                                disabled={savedIds.has(t._id) || savingCandidate === t._id}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                  savedIds.has(t._id)
                                    ? 'bg-green-50 text-green-600 cursor-default'
                                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                } disabled:opacity-60`}
                              >
                                {savingCandidate === t._id
                                  ? 'Saving...'
                                  : savedIds.has(t._id)
                                  ? 'In Pipeline'
                                  : 'Save to Pipeline'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No talent data available</p>
                )}
              </div>
              <div className="glass-card p-6">
                <h3 className="font-semibold text-slate-100 mb-4">Skill Distribution</h3>
                {skillDist.length > 0 ? (
                  <div className="space-y-3">
                    {skillDist.map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-slate-300 truncate flex-1">{s._id}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <div className="w-20 bg-slate-800 rounded-full h-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min((s.count / (skillDist[0]?.count || 1)) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-400 w-6 text-right">{s.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No skill data</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Hiring Pipeline */}
        {activeTab === 1 && (
          <div>
            {pipelineLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {STAGES.map((stage) => (
                  <div key={stage} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-100">{STAGE_LABELS[stage]}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[stage]}`}>
                        {pipeline[stage]?.length || 0}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(pipeline[stage] || []).length === 0 && (
                        <p className="text-slate-500 text-sm text-center py-6">No candidates in this stage</p>
                      )}
                      {(pipeline[stage] || []).map((entry) => {
                        const c = entry.candidateId;
                        if (!c) return null;
                        const isActioning = pipelineAction === entry._id;
                        return (
                          <div
                            key={entry._id}
                            className={`rounded-lg border p-4 ${STAGE_COLORS[stage]} bg-opacity-50`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-slate-100 text-sm">{c.name}</p>
                                {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                              </div>
                              {c.mentorLevel && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[c.mentorLevel] || 'bg-slate-800 text-slate-300'}`}>
                                  {c.mentorLevel}
                                </span>
                              )}
                            </div>
                            {c.skills && c.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {c.skills.slice(0, 4).map((sk, si) => (
                                  <span key={si} className="px-2 py-0.5 bg-slate-900/70 rounded text-xs text-slate-300">
                                    {sk.name || sk}
                                  </span>
                                ))}
                                {c.skills.length > 4 && (
                                  <span className="text-xs text-slate-500">+{c.skills.length - 4}</span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mb-3 text-xs text-slate-300">
                              {c.averageRating != null && (
                                <span>&#9733; {c.averageRating.toFixed(1)}</span>
                              )}
                              {c.reputationScore != null && (
                                <span>Rep: {c.reputationScore.toFixed(1)}</span>
                              )}
                              {c.sessionsCompleted != null && (
                                <span>{c.sessionsCompleted} sessions</span>
                              )}
                            </div>
                            {c.verifiedSkills && c.verifiedSkills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {c.verifiedSkills.slice(0, 3).map((vs, vi) => (
                                  <span key={vi} className="inline-flex items-center px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                                    &#10003; {typeof vs === 'string' ? vs : 'Verified'}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-700 border-opacity-50">
                              {nextStages(stage).map((ns) => (
                                <button
                                  key={ns}
                                  onClick={() => movePipelineEntry(entry._id, ns)}
                                  disabled={isActioning}
                                  className="flex-1 px-2 py-1.5 bg-slate-900/60 rounded-md text-xs font-medium text-slate-300 hover:bg-slate-900/90 border border-slate-700 disabled:opacity-50 transition-colors"
                                >
                                  {isActioning ? '...' : `Move to ${STAGE_LABELS[ns]}`} &#8594;
                                </button>
                              ))}
                              <button
                                onClick={() => removePipelineEntry(entry._id, c._id)}
                                disabled={isActioning}
                                className="px-2 py-1.5 bg-slate-900/60 rounded-md text-xs font-medium text-red-400 hover:bg-red-500/10 border border-slate-700 disabled:opacity-50 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Company Plan */}
        {activeTab === 2 && (
          <div>
            {planLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div>
                <div className="glass-card p-6 mb-8">
                  <h3 className="font-semibold text-slate-100 mb-2">Current Plan</h3>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold capitalize">
                      {companyPlan?.planType || 'starter'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      companyPlan?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {companyPlan?.status || 'active'}
                    </span>
                    {companyPlan?.endDate && (
                      <span className="text-xs text-slate-500">
                        Renews {new Date(companyPlan.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {companyPlan?.features && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(companyPlan.features).map(([feature, enabled]) => (
                        <span
                          key={feature}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            enabled ? 'bg-green-50 text-green-700' : 'bg-slate-900/40 text-slate-500 line-through'
                          }`}
                        >
                          {feature.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PLANS.map((plan) => {
                    const isCurrent = companyPlan?.planType === plan.key;
                    const isUpgrading = upgrading === plan.key;
                    return (
                      <div
                        key={plan.key}
                        className={`rounded-xl shadow-sm border-2 bg-slate-900/40 ${
                          isCurrent ? 'border-indigo-500 ring-2 ring-indigo-100' : plan.color
                        } p-6 flex flex-col`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${plan.badge}`}>
                            {plan.name}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-xs font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-3xl font-bold text-slate-100 mb-2">{plan.price}</p>
                        <p className="text-sm text-slate-400 mb-5">{plan.description}</p>
                        <ul className="flex-1 space-y-2 mb-6">
                          {plan.features.map((f, fi) => (
                            <li key={fi} className="flex items-center gap-2 text-sm text-slate-300">
                              <span className="text-green-500 text-xs">&#10003;</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => upgradePlan(plan.key)}
                          disabled={isCurrent || isUpgrading}
                          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isCurrent
                              ? 'bg-slate-800 text-slate-500 cursor-default'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                          }`}
                        >
                          {isUpgrading
                            ? 'Upgrading...'
                            : isCurrent
                            ? 'Current Plan'
                            : `Upgrade to ${plan.name}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}




