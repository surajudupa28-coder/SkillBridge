'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import SkillTag from '@/components/SkillTag';

const STATUS_CONFIG = {
  'unverified': { color: 'bg-slate-800 text-slate-300 border border-slate-700', label: 'Unverified' },
  'testing': { color: 'bg-blue-500/20 text-blue-200 border border-blue-400/30', label: 'Testing' },
  'under-review': { color: 'bg-amber-500/20 text-amber-200 border border-amber-400/30', label: 'Under Review' },
  'verified': { color: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30', label: 'Verified' },
  'rejected': { color: 'bg-rose-500/20 text-rose-200 border border-rose-400/30', label: 'Rejected' },
};

const DOC_STATUS = {
  'pending': 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
  'verified': 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30',
  'rejected': 'bg-rose-500/20 text-rose-200 border border-rose-400/30',
};

const DOC_TYPES = [
  { value: 'professional-certification', label: 'Professional Certification' },
  { value: 'course-certificate', label: 'Course Certificate' },
  { value: 'industry-credential', label: 'Industry Credential' },
  { value: 'project-portfolio', label: 'Project Portfolio' },
  { value: 'research-paper', label: 'Research Paper' },
  { value: 'competition-award', label: 'Competition Award' },
  { value: 'github-repo', label: 'GitHub Repository' },
  { value: 'project-documentation', label: 'Project Documentation' },
  { value: 'other', label: 'Other' },
];

const STAGES = ['declaration', 'skillTest', 'portfolio', 'documents', 'endorsements', 'trialSession', 'monitoring'];
const STAGE_LABELS = { declaration: 'Declaration', skillTest: 'Skill Test', portfolio: 'Portfolio', documents: 'Documents', endorsements: 'Endorsements', trialSession: 'Trial Session', monitoring: 'Monitoring' };

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Profile editing state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ skills: [], interests: [], portfolioLinks: [], availability: [] });
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' });
  const [newInterest, setNewInterest] = useState('');
  const [newLink, setNewLink] = useState('');
  const [saving, setSaving] = useState(false);

  // Verification state
  const [verifications, setVerifications] = useState([]);
  const [skillDocs, setSkillDocs] = useState({});
  const [loadingVerifications, setLoadingVerifications] = useState(true);
  const [actionMsg, setActionMsg] = useState({ text: '', type: 'info' });

  // Test modal state
  const [testModal, setTestModal] = useState(null); // { skillName, attempt, questions, currentQ, answers, cheatingData, timeLeft, result }
  const timerRef = useRef(null);
  const testStartRef = useRef(null);

  // Document modal state
  const [docModal, setDocModal] = useState(null); // { skillName }
  const [docForm, setDocForm] = useState({ documentTitle: '', documentType: 'professional-certification', issuingOrganization: '', issueDate: '', description: '', fileURL: '', fileType: 'link' });

  // Portfolio modal state
  const [portfolioModal, setPortfolioModal] = useState(null);
  const [portfolioProjects, setPortfolioProjects] = useState([{ title: '', description: '', techUsed: '', demoLink: '', repoLink: '' }]);

  // Badges state
  const [userBadges, setUserBadges] = useState([]);
  const hydratedUserIdRef = useRef(null);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  useEffect(() => {
    if (!user?.id) return;
    if (hydratedUserIdRef.current === user.id) return;
    setForm({ skills: user.skills || [], interests: user.interests || [], portfolioLinks: user.portfolioLinks || [], availability: user.availability || [] });
    hydratedUserIdRef.current = user.id;
  }, [user?.id]);

  // Fetch verifications
  const fetchVerifications = useCallback(async () => {
    
    try {
      const res = await fetch('/api/verification');
      const data = await res.json();
      setVerifications(data.verifications || []);
      // Fetch docs per skill
      const docMap = {};
      for (const v of (data.verifications || [])) {
        const dRes = await fetch(`/api/verification/documents?skillName=${encodeURIComponent(v.skillName)}`);
        const dData = await dRes.json();
        docMap[v.skillName] = dData.documents || [];
      }
      setSkillDocs(docMap);
    } catch {} finally { setLoadingVerifications(false); }
  }, []);

  useEffect(() => { fetchVerifications(); }, [fetchVerifications]);

  // Fetch user badges
  useEffect(() => {
    
    fetch('/api/badges')
      .then(r => r.json()).then(d => setUserBadges(d.userBadges || [])).catch(() => {});
  }, []);

  // Profile editing functions
  const addSkill = () => {
    if (newSkill.name?.trim()) {
      setForm(prevForm => ({ ...prevForm, skills: [...prevForm.skills, { ...newSkill }] }));
      setNewSkill({ name: '', level: 'intermediate' });
    }
  };
  const removeSkill = (i) => setForm(prevForm => ({ ...prevForm, skills: prevForm.skills.filter((_, idx) => idx !== i) }));
  const addInterest = () => {
    if (newInterest?.trim()) {
      setForm(prevForm => ({ ...prevForm, interests: [...prevForm.interests, newInterest.trim()] }));
      setNewInterest('');
    }
  };
  const removeInterest = (i) => setForm(prevForm => ({ ...prevForm, interests: prevForm.interests.filter((_, idx) => idx !== i) }));
  const addLink = () => {
    if (newLink?.trim()) {
      setForm(prevForm => ({ ...prevForm, portfolioLinks: [...prevForm.portfolioLinks, newLink.trim()] }));
      setNewLink('');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');
      setActionMsg({ text: 'Profile saved successfully', type: 'success' });
      setEditing(false);
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally { setSaving(false); }
  };

  // Verification actions
  const startVerification = async (skillName) => {
    try {
      const res = await fetch('/api/verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skillName }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMsg({ text: `Verification started for ${skillName}`, type: 'success' });
      fetchVerifications();
    } catch (err) { setActionMsg({ text: err.message, type: 'error' }); }
  };

  // === SKILL TEST ===
  const startTest = async (skillName) => {
    try {
      console.log(`[Client] Starting test for skill: ${skillName}`);
      const res = await fetch('/api/verification/test/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skillName }) });
      const data = await res.json();
      
      if (!res.ok) {
        console.error(`[Client] API Error:`, data);
        throw new Error(data.error || 'Failed to start test');
      }

      console.log(`[Client] Received API response:`, { 
        questionsCount: data.questions?.mcq?.length + data.questions?.scenario?.length + data.questions?.explanation?.length,
        source: data.questions?.source || 'unknown'
      });

      if (!data.questions || !data.questions.mcq) {
        console.error(`[Client] Invalid questions object:`, data);
        throw new Error('Server returned invalid questions format');
      }

      const allQs = [...(data.questions.mcq || []), ...(data.questions.scenario || []), ...(data.questions.explanation || [])];
      console.log(`[Client] Total questions to display: ${allQs.length}`);

      setTestModal({
        skillName, attempt: data.attempt, questions: allQs, currentQ: 0,
        answers: allQs.map(q => ({ questionNumber: q.questionNumber, questionType: q.questionType, selectedAnswer: '', textAnswer: '', timeSpent: 0 })),
        cheatingData: { tabSwitches: 0, copyPasteAttempts: 0 }, timeLeft: data.questions.timeLimit || 1800, result: null
      });
      testStartRef.current = Date.now();

      // Start timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTestModal(prev => {
          if (!prev || prev.result) { clearInterval(timerRef.current); return prev; }
          const newTime = prev.timeLeft - 1;
          if (newTime <= 0) { clearInterval(timerRef.current); submitTest(prev); return { ...prev, timeLeft: 0 }; }
          return { ...prev, timeLeft: newTime };
        });
      }, 1000);

      // Anti-cheat: tab switch detection
      const handleVisibility = () => {
        if (document.hidden) {
          setTestModal(prev => prev ? { ...prev, cheatingData: { ...prev.cheatingData, tabSwitches: prev.cheatingData.tabSwitches + 1 } } : prev);
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      // Store cleanup ref
      window.__skillTestCleanup = () => { document.removeEventListener('visibilitychange', handleVisibility); };
    } catch (err) { 
      console.error('[Client] Test start error:', err);
      setActionMsg({ text: err.message, type: 'error' }); 
    }
  };

  const submitTest = async (modalState) => {
    const state = modalState || testModal;
    if (!state || !state.attempt) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (window.__skillTestCleanup) { window.__skillTestCleanup(); delete window.__skillTestCleanup; }
    try {
      const res = await fetch('/api/verification/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: state.attempt._id, answers: state.answers, cheatingData: state.cheatingData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTestModal(prev => ({ ...prev, result: data }));
      fetchVerifications();
    } catch (err) { setActionMsg({ text: err.message, type: 'error' }); }
  };

  const updateAnswer = (field, value) => {
    setTestModal(prev => {
      if (!prev) return prev;
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQ] = { ...newAnswers[prev.currentQ], [field]: value, timeSpent: (Date.now() - (testStartRef.current || Date.now())) / 1000 };
      return { ...prev, answers: newAnswers };
    });
  };

  // === DOCUMENT UPLOAD ===
  const submitDocument = async () => {
    if (!docModal) return;
    try {
      const res = await fetch('/api/verification/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...docForm, skillName: docModal.skillName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMsg({ text: 'Document submitted for review', type: 'success' });
      setDocModal(null);
      setDocForm({ documentTitle: '', documentType: 'professional-certification', issuingOrganization: '', issueDate: '', description: '', fileURL: '', fileType: 'link' });
      fetchVerifications();
    } catch (err) { setActionMsg({ text: err.message, type: 'error' }); }
  };

  // === PORTFOLIO ===
  const submitPortfolio = async () => {
    if (!portfolioModal) return;
    try {
      const projects = portfolioProjects.filter(p => p.title.trim()).map(p => ({ ...p, techUsed: p.techUsed.split(',').map(t => t.trim()).filter(Boolean) }));
      const res = await fetch('/api/verification/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName: portfolioModal.skillName, projects })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMsg({ text: `Portfolio submitted. Score: ${data.portfolioScore}/100`, type: 'success' });
      setPortfolioModal(null);
      setPortfolioProjects([{ title: '', description: '', techUsed: '', demoLink: '', repoLink: '' }]);
      fetchVerifications();
    } catch (err) { setActionMsg({ text: err.message, type: 'error' }); }
  };

  // === CALCULATE FINAL SCORE ===
  const calculateScore = async (skillName) => {
    try {
      const res = await fetch('/api/verification/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const msg = data.passed
        ? `${skillName} VERIFIED! Final score: ${data.finalScore}/100`
        : `Score: ${data.finalScore}/100 (need 75 to verify). Test:${data.breakdown.test} Portfolio:${data.breakdown.portfolio} Docs:${data.breakdown.documents} Endorsements:${data.breakdown.endorsements} Trial:${data.breakdown.trialSession}`;
      setActionMsg({ text: msg, type: data.passed ? 'success' : 'info' });
      fetchVerifications();
    } catch (err) { setActionMsg({ text: err.message, type: 'error' }); }
  };

  // Helper
  const getVerification = (skillName) => verifications.find(v => v.skillName === skillName);
  const getProgress = (v) => {
    if (!v || !v.stages) return 0;
    const completed = STAGES.filter(s => v.stages[s]?.completed).length;
    return Math.round((completed / STAGES.length) * 100);
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const levelColors = { community: 'bg-slate-800 text-slate-300 border border-slate-700', verified: 'bg-blue-500/20 text-blue-200 border border-blue-400/30', expert: 'bg-purple-500/20 text-purple-200 border border-purple-400/30' };
  const verifiedSkillSet = new Set((user.verifiedSkills || []).map((s) => String(s || '').trim().toLowerCase()));
  const verifiedTeachingSkills = (user.skills || []).filter((s) => verifiedSkillSet.has(String(s?.name || '').trim().toLowerCase()));
  const pendingTeachingSkillsCount = Math.max((user.skills || []).length - verifiedTeachingSkills.length, 0);

  return (
    <div className="saas-shell">
      <Sidebar />
      <main className="saas-main">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-100">My Profile</h1>
          <button type="button" onClick={() => setEditing(!editing)} className="px-4 py-2 text-sm border border-slate-700 rounded-lg hover:bg-slate-900/40 transition-colors cursor-pointer">{editing ? 'Cancel' : 'Edit Profile'}</button>
        </div>

        {actionMsg.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex justify-between ${actionMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : actionMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
            {actionMsg.text}
            <button onClick={() => setActionMsg({ text: '', type: 'info' })} className="ml-2 opacity-60 hover:opacity-100">x</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Profile Card */}
          <div className="space-y-6">
            <div className="glass-card p-6 overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-indigo-500/20 via-cyan-500/10 to-transparent pointer-events-none" />
              <div className="text-center mb-4 relative">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-slate-200 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-700 mx-auto mb-3 ring-4 ring-indigo-500/20">{user.name?.charAt(0)?.toUpperCase()}</div>
                <h2 className="text-lg font-semibold text-slate-100">{user.name}</h2>
                <p className="text-sm text-slate-400">{user.email}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${levelColors[user.mentorLevel]}`}>{user.mentorLevel?.charAt(0).toUpperCase() + user.mentorLevel?.slice(1)} Mentor</span>
              </div>
              <div className="space-y-3 text-sm relative">
                <div className="flex justify-between rounded-lg bg-slate-900/40 border border-slate-800 px-3 py-2"><span className="text-slate-400">Reputation</span><span className="font-medium text-slate-100">{user.reputationScore?.toFixed(1)}/10</span></div>
                <div className="flex justify-between rounded-lg bg-slate-900/40 border border-slate-800 px-3 py-2"><span className="text-slate-400">Rating</span><span className="font-medium text-slate-100">{'\u2605'} {user.averageRating?.toFixed(1)}</span></div>
                <div className="flex justify-between rounded-lg bg-slate-900/40 border border-slate-800 px-3 py-2"><span className="text-slate-400">Sessions</span><span className="font-medium text-slate-100">{user.sessionsCompleted}</span></div>
                <div className="flex justify-between rounded-lg bg-slate-900/40 border border-slate-800 px-3 py-2"><span className="text-slate-400">Wallet</span><span className="font-medium text-slate-100">{user.walletBalance} SC</span></div>
                <div className="flex justify-between rounded-lg bg-slate-900/40 border border-slate-800 px-3 py-2"><span className="text-slate-400">Verified Skills</span><span className="font-medium text-slate-100">{user.verifiedSkills?.length || 0}</span></div>
              </div>
            </div>

            {/* Verified Skills Summary */}
            {user.verifiedSkills?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-semibold text-slate-100 mb-3">Verified Badges</h3>
                <div className="space-y-2">
                  {user.verifiedSkills.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <span className="text-emerald-300 font-bold">{'\u2713'}</span>
                      <span className="text-sm font-medium text-emerald-100">{s}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-1.5 py-0.5 rounded-full ml-auto border border-emerald-400/30">Verified</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements & Badges */}
            {userBadges.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-semibold text-slate-100 mb-3">Achievements & Badges</h3>
                <div className="space-y-2">
                  {userBadges.map((ub, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      <span className="text-2xl">{ub.badge?.icon || '\uD83C\uDFC5'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-indigo-100">{ub.badge?.badgeName}</p>
                        <p className="text-xs text-indigo-300 truncate">{ub.badge?.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-2 space-y-6">
            {/* === SKILLS I TEACH === */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-slate-100 mb-3">Skills I Teach</h3>
              {editing ? (
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">{form.skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs">{s.name} ({s.level}) <button onClick={() => removeSkill(i)} className="text-indigo-400 hover:text-red-500">x</button></span>
                  ))}</div>
                  <div className="flex gap-2">
                    <input value={newSkill.name} onChange={e => setNewSkill({ ...newSkill, name: e.target.value })} placeholder="Skill name" className="flex-1 px-3 py-1.5 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <select value={newSkill.level} onChange={e => setNewSkill({ ...newSkill, level: e.target.value })} className="px-3 py-1.5 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option>
                    </select>
                    <button type="button" onClick={() => addSkill()} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">Add</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {verifiedTeachingSkills.length > 0 ? verifiedTeachingSkills.map((s, i) => (
                      <SkillTag key={i} name={s.name} level={s.level} verified={true} />
                    )) : <p className="text-slate-500 text-sm">No verified teaching skills yet</p>}
                  </div>
                  {pendingTeachingSkillsCount > 0 && (
                    <p className="text-xs text-amber-600 mt-3">
                      {pendingTeachingSkillsCount} skill{pendingTeachingSkillsCount > 1 ? 's are' : ' is'} pending verification and hidden here until verified.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* === SKILL VERIFICATION SECTION === */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-100">Skill Verification</h3>
                <span className="text-xs text-slate-500">Complete stages to earn verified badges</span>
              </div>

              {user.skills?.length > 0 ? (
                <div className="space-y-4">
                  {user.skills.map((skill, idx) => {
                    const v = getVerification(skill.name);
                    const progress = getProgress(v);
                    const status = v?.verificationStatus || 'unverified';
                    const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG['unverified'];
                    const docs = skillDocs[skill.name] || [];
                    const attemptsRemaining = v?.attemptsRemaining ?? 3;

                    return (
                      <div key={idx} className="border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-colors">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-slate-100">{skill.name}</h4>
                            <span className="text-xs text-slate-500">({skill.level})</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                            {status === 'verified' && <span className="text-green-600 font-bold">{'\u2713'}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            {docs.length > 0 && <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">{docs.length} doc{docs.length !== 1 ? 's' : ''}</span>}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Verification Progress</span><span>{progress}%</span></div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all ${status === 'verified' ? 'bg-green-500' : status === 'rejected' ? 'bg-red-400' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>

                        {/* Stages */}
                        <div className="grid grid-cols-7 gap-1 mb-3">
                          {STAGES.map(s => {
                            const done = v?.stages?.[s]?.completed;
                            const score = v?.stages?.[s]?.score;
                            return (
                              <div key={s} className={`text-center p-1.5 rounded ${done ? 'bg-green-50' : 'bg-slate-900/40'}`}>
                                <div className={`text-sm ${done ? 'text-green-600' : 'text-gray-300'}`}>{done ? '\u2713' : '\u25CB'}</div>
                                <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{STAGE_LABELS[s]}</div>
                                {score !== undefined && score > 0 && <div className="text-[9px] font-medium text-indigo-600">{score}</div>}
                              </div>
                            );
                          })}
                        </div>

                        {/* Scores */}
                        {v && (v.testScore > 0 || v.portfolioScore > 0 || v.documentScore > 0 || v.endorsementScore > 0 || v.trialSessionScore > 0) && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {v.testScore > 0 && <span className="text-xs bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded">Test: {v.testScore}</span>}
                            {v.portfolioScore > 0 && <span className="text-xs bg-purple-500/20 text-purple-200 border border-purple-400/30 px-2 py-0.5 rounded">Portfolio: {v.portfolioScore}</span>}
                            {v.documentScore > 0 && <span className="text-xs bg-amber-500/20 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded">Docs: {v.documentScore}</span>}
                            {v.endorsementScore > 0 && <span className="text-xs bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded">Endorsements: {v.endorsementScore}</span>}
                            {v.trialSessionScore > 0 && <span className="text-xs bg-rose-500/20 text-rose-200 border border-rose-400/30 px-2 py-0.5 rounded">Trial: {v.trialSessionScore}</span>}
                            {v.finalVerificationScore > 0 && <span className="text-xs bg-indigo-500/20 text-indigo-100 border border-indigo-400/30 px-2 py-1 rounded font-semibold">Final: {v.finalVerificationScore}/100</span>}
                          </div>
                        )}

                        {/* Action buttons */}
                        {status !== 'verified' && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {!v && <button onClick={() => startVerification(skill.name)} className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Start Verification</button>}
                            {(status === 'testing' || status === 'under-review' || status === 'unverified' || status === 'rejected') && (
                              <>
                                <button onClick={() => startTest(skill.name)} disabled={attemptsRemaining <= 0}
                                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
                                  Take Skill Test {attemptsRemaining < 3 && `(${attemptsRemaining} left)`}
                                </button>
                                <button onClick={() => { setDocModal({ skillName: skill.name }); setDocForm({ documentTitle: '', documentType: 'professional-certification', issuingOrganization: '', issueDate: '', description: '', fileURL: '', fileType: 'link' }); }}
                                  className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600">Upload Document</button>
                                <button onClick={() => { setPortfolioModal({ skillName: skill.name }); setPortfolioProjects([{ title: '', description: '', techUsed: '', demoLink: '', repoLink: '' }]); }}
                                  className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700">Submit Portfolio</button>
                              </>
                            )}
                            {v && <button onClick={() => calculateScore(skill.name)} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">Calculate Final Score</button>}
                          </div>
                        )}

                        {/* Documents list */}
                        {docs.length > 0 && (
                          <div className="border-t border-slate-800/70 pt-3 mt-2">
                            <p className="text-xs font-medium text-slate-400 mb-2">Supporting Documents</p>
                            <div className="space-y-1.5">
                              {docs.map((d, di) => (
                                <div key={di} className="flex items-center justify-between py-1.5 px-3 bg-slate-900/40 border border-slate-800/80 rounded-lg">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-200 truncate">{d.documentTitle}</p>
                                    <p className="text-[10px] text-slate-500">{DOC_TYPES.find(t => t.value === d.documentType)?.label || d.documentType}{d.issuingOrganization ? ` - ${d.issuingOrganization}` : ''}</p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    {d.scoreAwarded > 0 && <span className="text-[10px] text-indigo-300 font-medium">+{d.scoreAwarded}pts</span>}
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${DOC_STATUS[d.verificationStatus] || 'bg-slate-800 text-slate-300'}`}>{d.verificationStatus}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Add skills above to begin verification</p>
              )}
            </div>

            {/* === INTERESTS === */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-slate-100 mb-3">Skills I Want to Learn</h3>
              {editing ? (
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">{form.interests.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/15 text-emerald-200 border border-emerald-400/25 rounded text-xs">{s} <button type="button" onClick={() => removeInterest(i)} className="text-emerald-300 hover:text-red-400">x</button></span>
                  ))}</div>
                  <div className="flex gap-2">
                    <input value={newInterest} onChange={e => setNewInterest(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }} placeholder="Interest" className="flex-1 px-3 py-1.5 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <button type="button" onClick={() => addInterest()} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors cursor-pointer font-medium">Add</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.interests?.length > 0 ? user.interests.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-emerald-500/15 text-emerald-200 border border-emerald-400/25 rounded-lg text-xs font-medium">{s}</span>
                  )) : <p className="text-slate-500 text-sm">No interests added yet</p>}
                </div>
              )}
            </div>

            {/* === PORTFOLIO LINKS === */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-slate-100 mb-3">Portfolio Links</h3>
              {editing ? (
                <div>
                  <div className="space-y-1 mb-3">{form.portfolioLinks.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm"><span className="text-blue-600 truncate flex-1">{l}</span><button onClick={() => setForm({ ...form, portfolioLinks: form.portfolioLinks.filter((_, idx) => idx !== i) })} className="text-slate-500 hover:text-red-500">x</button></div>
                  ))}</div>
                  <div className="flex gap-2">
                    <input value={newLink} onChange={e => setNewLink(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} placeholder="https://..." className="flex-1 px-3 py-1.5 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => addLink()} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">Add</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {user.portfolioLinks?.length > 0 ? user.portfolioLinks.map((l, i) => (<p key={i} className="text-sm text-blue-600 hover:underline truncate">{l}</p>)) : <p className="text-slate-500 text-sm">No portfolio links added</p>}
                </div>
              )}
            </div>

            {editing && <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Save Profile'}</button>}
          </div>
        </div>

        {/* ===== TEST MODAL ===== */}
        {testModal && !testModal.result && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onCopy={e => { e.preventDefault(); setTestModal(prev => ({ ...prev, cheatingData: { ...prev.cheatingData, copyPasteAttempts: prev.cheatingData.copyPasteAttempts + 1 } })); }} onPaste={e => { e.preventDefault(); setTestModal(prev => ({ ...prev, cheatingData: { ...prev.cheatingData, copyPasteAttempts: prev.cheatingData.copyPasteAttempts + 1 } })); }}>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-950 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h3 className="font-semibold text-slate-100">Skill Test: {testModal.skillName}</h3>
                  <p className="text-xs text-slate-500">Question {testModal.currentQ + 1} of {testModal.questions.length}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-sm font-mono font-bold ${testModal.timeLeft < 300 ? 'text-red-600' : 'text-slate-300'}`}>
                    {Math.floor(testModal.timeLeft / 60)}:{(testModal.timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  {testModal.cheatingData.tabSwitches > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded">Tab switches: {testModal.cheatingData.tabSwitches}</span>}
                </div>
              </div>

              <div className="px-6 py-5">
                {/* Progress dots */}
                <div className="flex gap-1 mb-5 flex-wrap">{testModal.questions.map((_, qi) => (
                  <button key={qi} onClick={() => setTestModal(p => ({ ...p, currentQ: qi }))}
                    className={`w-6 h-6 rounded-full text-[10px] font-medium ${qi === testModal.currentQ ? 'bg-indigo-600 text-white' : testModal.answers[qi]?.selectedAnswer || testModal.answers[qi]?.textAnswer ? 'bg-green-100 text-green-700' : 'bg-slate-800 text-slate-400'}`}>{qi + 1}</button>
                ))}</div>

                {(() => {
                  const q = testModal.questions[testModal.currentQ];
                  const ans = testModal.answers[testModal.currentQ];
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${q.questionType === 'mcq' ? 'bg-blue-100 text-blue-700' : q.questionType === 'scenario' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{q.questionType.toUpperCase()}</span>
                        {q.difficulty && <span className="text-[10px] text-slate-500">{q.difficulty}</span>}
                      </div>
                      <p className="text-sm font-medium text-slate-100 mb-4">{q.question}</p>

                      {q.questionType === 'mcq' && q.options ? (
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => (
                            <label key={oi} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${ans?.selectedAnswer === oi.toString() ? 'border-indigo-500 bg-indigo-50' : 'border-slate-800/80 hover:border-slate-700'}`}>
                              <input type="radio" name="mcq" value={oi} checked={ans?.selectedAnswer === oi.toString()} onChange={() => updateAnswer('selectedAnswer', oi.toString())} className="accent-indigo-600" />
                              <span className="text-sm text-slate-300">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea value={ans?.textAnswer || ''} onChange={e => updateAnswer('textAnswer', e.target.value)}
                          rows={6} placeholder="Write your answer here..." className="w-full px-4 py-3 border border-slate-700 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" />
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="sticky bottom-0 bg-slate-950 border-t border-slate-800/80 px-6 py-4 flex items-center justify-between rounded-b-2xl">
                <button onClick={() => setTestModal(p => ({ ...p, currentQ: Math.max(0, p.currentQ - 1) }))} disabled={testModal.currentQ === 0}
                  className="px-4 py-2 text-sm border border-slate-700 rounded-lg hover:bg-slate-900/40 disabled:opacity-40">Previous</button>
                <div className="flex gap-2">
                  {testModal.currentQ < testModal.questions.length - 1 ? (
                    <button onClick={() => setTestModal(p => ({ ...p, currentQ: p.currentQ + 1 }))} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Next</button>
                  ) : (
                    <button onClick={() => submitTest()} className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Submit Test</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEST RESULT MODAL */}
        {testModal?.result && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 w-full max-w-md text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 ${testModal.result.attempt.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                {testModal.result.attempt.passed ? '\u2713' : '\u2717'}
              </div>
              <h3 className="text-xl font-bold mb-2">{testModal.result.attempt.passed ? 'Test Passed!' : 'Test Not Passed'}</h3>
              <p className="text-3xl font-bold text-indigo-600 mb-2">{testModal.result.totalScore}/100</p>
              <div className="flex justify-center gap-4 text-sm text-slate-400 mb-4">
                <span>MCQ: {testModal.result.correctMCQ}/{testModal.result.totalMCQ}</span>
                <span>Text: {testModal.result.textScore}/30</span>
              </div>
              {testModal.result.attempt.flaggedForReview && <p className="text-xs text-amber-600 mb-3">Flagged for review due to suspicious activity</p>}
              {testModal.result.attempt.status === 'invalidated' && <p className="text-xs text-red-600 mb-3">Attempt invalidated: excessive cheating flags</p>}
              <p className="text-sm text-slate-400 mb-6">{testModal.result.attempt.passed ? 'Great work! Your skill test stage is now complete.' : 'You need 70/100 to pass. Review the material and try again.'}</p>
              <button onClick={() => setTestModal(null)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Close</button>
            </div>
          </div>
        )}

        {/* ===== DOCUMENT UPLOAD MODAL ===== */}
        {docModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-1">Upload Supporting Document</h3>
              <p className="text-sm text-slate-400 mb-4">for {docModal.skillName}</p>
              <div className="space-y-3">
                <div><label className="block text-xs font-medium text-slate-300 mb-1">Document Title *</label><input value={docForm.documentTitle} onChange={e => setDocForm({ ...docForm, documentTitle: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. AWS Certified Developer" /></div>
                <div><label className="block text-xs font-medium text-slate-300 mb-1">Document Type *</label><select value={docForm.documentType} onChange={e => setDocForm({ ...docForm, documentType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">{DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-slate-300 mb-1">Issuing Organization</label><input value={docForm.issuingOrganization} onChange={e => setDocForm({ ...docForm, issuingOrganization: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Amazon Web Services" /></div>
                <div><label className="block text-xs font-medium text-slate-300 mb-1">Issue Date</label><input type="date" value={docForm.issueDate} onChange={e => setDocForm({ ...docForm, issueDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-slate-300 mb-1">Description</label><textarea value={docForm.description} onChange={e => setDocForm({ ...docForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Brief description of this document..." /></div>
                <div><label className="block text-xs font-medium text-slate-300 mb-1">File URL / Link *</label><input value={docForm.fileURL} onChange={e => setDocForm({ ...docForm, fileURL: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://drive.google.com/... or https://github.com/..." /><p className="text-[10px] text-slate-500 mt-1">Paste a link to your document (Google Drive, Dropbox, GitHub, etc.)</p></div>
                <div><label className="block text-xs font-medium text-slate-300 mb-1">File Type</label><select value={docForm.fileType} onChange={e => setDocForm({ ...docForm, fileType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="link">External Link</option><option value="pdf">PDF</option><option value="docx">DOCX</option><option value="zip">ZIP</option><option value="png">PNG</option><option value="jpg">JPG</option></select></div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setDocModal(null)} className="flex-1 px-4 py-2 border border-slate-700 rounded-lg text-sm hover:bg-slate-900/40">Cancel</button>
                <button onClick={submitDocument} disabled={!docForm.documentTitle || !docForm.fileURL} className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 disabled:opacity-40">Submit for Review</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== PORTFOLIO MODAL ===== */}
        {portfolioModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-1">Submit Portfolio</h3>
              <p className="text-sm text-slate-400 mb-4">for {portfolioModal.skillName}</p>
              <div className="space-y-4">
                {portfolioProjects.map((p, pi) => (
                  <div key={pi} className="border border-slate-800/80 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2"><span className="text-xs font-medium text-slate-300">Project {pi + 1}</span>{pi > 0 && <button onClick={() => setPortfolioProjects(portfolioProjects.filter((_, i) => i !== pi))} className="text-xs text-red-500">Remove</button>}</div>
                    <div className="space-y-2">
                      <input value={p.title} onChange={e => { const np = [...portfolioProjects]; np[pi] = { ...np[pi], title: e.target.value }; setPortfolioProjects(np); }} placeholder="Project title" className="w-full px-3 py-1.5 border rounded-lg text-sm" />
                      <textarea value={p.description} onChange={e => { const np = [...portfolioProjects]; np[pi] = { ...np[pi], description: e.target.value }; setPortfolioProjects(np); }} placeholder="Description" rows={2} className="w-full px-3 py-1.5 border rounded-lg text-sm" />
                      <input value={p.techUsed} onChange={e => { const np = [...portfolioProjects]; np[pi] = { ...np[pi], techUsed: e.target.value }; setPortfolioProjects(np); }} placeholder="Technologies (comma-separated)" className="w-full px-3 py-1.5 border rounded-lg text-sm" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={p.demoLink} onChange={e => { const np = [...portfolioProjects]; np[pi] = { ...np[pi], demoLink: e.target.value }; setPortfolioProjects(np); }} placeholder="Demo link" className="w-full px-3 py-1.5 border rounded-lg text-sm" />
                        <input value={p.repoLink} onChange={e => { const np = [...portfolioProjects]; np[pi] = { ...np[pi], repoLink: e.target.value }; setPortfolioProjects(np); }} placeholder="Repo link" className="w-full px-3 py-1.5 border rounded-lg text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setPortfolioProjects([...portfolioProjects, { title: '', description: '', techUsed: '', demoLink: '', repoLink: '' }])} className="mt-3 text-xs text-indigo-600 hover:underline">+ Add Another Project</button>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setPortfolioModal(null)} className="flex-1 px-4 py-2 border border-slate-700 rounded-lg text-sm hover:bg-slate-900/40">Cancel</button>
                <button onClick={submitPortfolio} disabled={!portfolioProjects.some(p => p.title.trim())} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-40">Submit Portfolio</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}




