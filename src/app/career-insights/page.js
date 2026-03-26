'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';

export default function CareerInsightsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [tab, setTab] = useState('roadmap'); // 'roadmap' or 'learning'

  // AI Roadmap tab states
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const [skills, setSkills] = useState('');
  const [goal, setGoal] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [progress, setProgress] = useState({});

  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [savingPath, setSavingPath] = useState(false);

  // Currently Pursuing Skills tab states
  const [learningPaths, setLearningPaths] = useState([]);
  const [loadingPaths, setLoadingPaths] = useState(false);

  const isPremium =
    subscription?.planType === 'pro' ||
    user?.plan === 'pro' ||
    user?.subscription === 'pro' ||
    user?.currentPlan === 'pro' ||
    user?.planName === 'Pro Placement Plan';

  useEffect(() => {
    if (!isLoaded || !user) router.push('/login');
  }, [user, isLoaded, router]);

  useEffect(() => {
    

    const fetchSubscription = async () => {
      try {
        const res = await fetch('/api/subscriptions/user');

        const data = await res.json();
        if (res.ok) {
          setSubscription(data);
        }
      } catch {
        setSubscription(null);
      }
    };

    fetchSubscription();
  }, [isLoaded]);

  // Load learning paths when tab changes to 'learning'
  useEffect(() => {
    if (tab === 'learning' && isLoaded && user) {
      loadLearningPaths();
    }
  }, [tab, isLoaded, user]);

  if (!isLoaded || !user) {
    return (
      <div className="saas-shell flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const askAI = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loadingAI) return;

    setLoadingAI(true);
    setAnswer('');
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedQuestion }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to get AI response');
      }

      setAnswer(data.reply || 'No response received.');
    } catch (error) {
      setAnswer(error.message || 'Unable to get AI response right now.');
    } finally {
      setLoadingAI(false);
    }
  };

  const generateRoadmap = async () => {
    if (!goal) return;

    setLoadingRoadmap(true);
    setRoadmap(null);
    setMentors([]);
    setProgress({});

    try {
      const roadmapRes = await fetch('/api/ai/roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skills: skills.split(',').map((skill) => skill.trim()).filter(Boolean),
          goal,
        }),
      });

      const roadmapData = await roadmapRes.json();

      if (!roadmapRes.ok || !roadmapData?.roadmap) {
        console.error('Failed to generate roadmap');
        return;
      }

      const generatedRoadmap = roadmapData.roadmap;
      setRoadmap(generatedRoadmap);

      // Extract skill names from topic titles
      if (!generatedRoadmap.topics || generatedRoadmap.topics.length === 0) {
        return;
      }

      const extractedSkills = generatedRoadmap.topics.map(topic => topic.title);

      setLoadingMentors(true);
      const matchRes = await fetch('/api/matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skills: extractedSkills }),
      });

      const matchData = await matchRes.json();
      if (matchRes.ok) {
        setMentors(matchData?.mentors || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMentors(false);
      setLoadingRoadmap(false);
    }
  };

  const toggleChecklist = (topicIndex, itemIndex) => {
    setProgress((prev) => {
      const updated = { ...prev };
      const key = `topic_${topicIndex}`;
      const currentProgress = updated[key] || new Set();
      
      if (currentProgress.has(itemIndex)) {
        currentProgress.delete(itemIndex);
      } else {
        currentProgress.add(itemIndex);
      }
      
      updated[key] = currentProgress;
      return updated;
    });
  };

  const calculateProgress = (topicIndex) => {
    if (!roadmap?.topics?.[topicIndex]) return 0;
    
    const checklist = roadmap.topics[topicIndex].checklist;
    if (checklist.length === 0) return 0;
    
    const key = `topic_${topicIndex}`;
    const completed = progress[key]?.size || 0;
    return Math.round((completed / checklist.length) * 100);
  };

  const saveRoadmap = async () => {
    if (!roadmap || !goal) return;

    setSavingPath(true);
    try {
      const response = await fetch('/api/learning-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal,
          roadmap
        })
      });

      if (response.ok) {
        const savedPath = await response.json();
        alert('Learning path saved! You can now track your progress.');
        // Reset form
        setSkills('');
        setGoal('');
        setRoadmap(null);
        setProgress({});
        setMentors([]);
        // Switch to learning paths tab
        setTab('learning');
      } else {
        alert('Failed to save learning path');
      }
    } catch (error) {
      console.error('Error saving path:', error);
      alert('Error saving learning path');
    } finally {
      setSavingPath(false);
    }
  };

  const loadLearningPaths = async () => {
    setLoadingPaths(true);
    try {
      const response = await fetch('/api/learning-path');

      if (response.ok) {
        const paths = await response.json();
        setLearningPaths(paths);
      }
    } catch (error) {
      console.error('Error loading learning paths:', error);
    } finally {
      setLoadingPaths(false);
    }
  };

  const togglePathChecklist = async (pathId, topicIndex, itemIndex) => {
    try {
      const response = await fetch('/api/learning-path', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pathId,
          topicIndex,
          itemIndex
        })
      });

      if (response.ok) {
        const updatedPath = await response.json();
        // Update the learning paths list with the updated path
        setLearningPaths(paths => 
          paths.map(p => p._id === pathId ? updatedPath : p)
        );
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const deleteRoadmap = async (pathId) => {
    if (!confirm('Are you sure you want to delete this learning path?')) return;

    try {
      const response = await fetch(`/api/learning-path?pathId=${pathId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setLearningPaths(paths => paths.filter(p => p._id !== pathId));
        alert('Learning path deleted');
      }
    } catch (error) {
      console.error('Error deleting path:', error);
    }
  };

  return (
    <div className="saas-shell">
      <Sidebar />
      <main className="saas-main">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-100">Career Insights</h1>
            <p className="text-slate-400 mt-1">Premium AI tools to plan your growth and connect with relevant mentors.</p>
          </div>

          {!isPremium ? (
            <div className="glass-card p-6 text-center">
              <h3 className="text-xl font-semibold text-slate-100">Premium Feature</h3>
              <p className="text-slate-400 mt-2">
                Upgrade to Premium to unlock AI career insights, roadmaps, and mentor matching.
              </p>
              <button
                type="button"
                onClick={() => router.push('/placements')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Upgrade to Premium
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tab Navigation */}
              <div className="flex gap-4 mb-6 border-b border-slate-700">
                <button
                  onClick={() => setTab('roadmap')}
                  className={`pb-3 px-2 font-medium text-sm transition-colors ${
                    tab === 'roadmap'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-300 hover:text-slate-100'
                  }`}
                >
                  AI Roadmap Generator
                </button>
                <button
                  onClick={() => setTab('learning')}
                  className={`pb-3 px-2 font-medium text-sm transition-colors ${
                    tab === 'learning'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-300 hover:text-slate-100'
                  }`}
                >
                  Currently Pursuing Skills
                </button>
              </div>

              {/* AI Roadmap Tab */}
              {tab === 'roadmap' && (
                <div className="space-y-6">
                  <div className="glass-card p-6">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">Ask AI Mentor</h2>
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask about skills, mentors, or your learning path..."
                        className="flex-1 rounded-lg border border-slate-700 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={askAI}
                        disabled={loadingAI}
                        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loadingAI ? 'Thinking...' : 'Ask AI'}
                      </button>
                    </div>
                    {answer && (
                      <div className="mt-4 rounded-lg border border-slate-800/80 bg-slate-900/40 p-4">
                        <p className="text-sm text-slate-300 whitespace-pre-line">{answer}</p>
                      </div>
                    )}
                  </div>

                  <div className="glass-card p-6">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">Generate Your Learning Roadmap</h2>
                    <input
                      type="text"
                      placeholder="Your current skills (e.g. HTML, CSS)"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                    <input
                      type="text"
                      placeholder="Your goal (e.g. Full Stack Developer)"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                    <button
                      type="button"
                      onClick={generateRoadmap}
                      disabled={loadingRoadmap}
                      className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingRoadmap ? 'Generating...' : 'Generate Roadmap'}
                    </button>

                    {roadmap && roadmap.topics && roadmap.topics.length > 0 && (
                      <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-slate-100">Your Learning Path Preview</h3>
                          <button
                            onClick={saveRoadmap}
                            disabled={savingPath}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {savingPath ? 'Saving...' : 'Start Learning Path'}
                          </button>
                        </div>
                        {roadmap.topics.map((topic, topicIndex) => (
                          <div
                            key={topicIndex}
                            className="rounded-lg p-6 border border-slate-700/70 bg-slate-900/40 shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-lg font-semibold text-slate-100">{topic.title}</h4>
                                <p className="text-sm text-slate-400 mt-1">
                                  Estimated time: {topic.estimatedTime}
                                </p>
                              </div>
                              <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                {calculateProgress(topicIndex)}%
                              </span>
                            </div>

                            {topic.prerequisites && topic.prerequisites.length > 0 && (
                              <p className="text-sm text-slate-300 mb-3">
                                Prerequisites: {topic.prerequisites.join(', ')}
                              </p>
                            )}

                            <div className="mt-4 space-y-2">
                              <p className="text-sm font-medium text-slate-300">Learning Checklist:</p>
                              {topic.checklist.map((item, itemIndex) => (
                                <label key={itemIndex} className="flex items-center space-x-3 p-2 hover:bg-slate-900/40 rounded cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={progress[`topic_${topicIndex}`]?.has(itemIndex) || false}
                                    onChange={() => toggleChecklist(topicIndex, itemIndex)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className="text-sm text-slate-300">{item}</span>
                                </label>
                              ))}
                            </div>

                            <div className="mt-4">
                              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${calculateProgress(topicIndex)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(loadingMentors || mentors.length > 0) && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4">Expert Mentors for These Topics</h3>

                        {loadingMentors ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                            <span className="ml-2 text-sm text-slate-400">Finding specialists...</span>
                          </div>
                        ) : mentors.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mentors.map((mentor) => (
                              <div
                                key={mentor._id}
                                className="border border-slate-700/70 rounded-lg p-4 bg-slate-900/40 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-slate-100">{mentor.name}</h4>
                                  <span className="text-sm font-medium text-amber-500">Rating {mentor.averageRating?.toFixed(1) || 'N/A'}</span>
                                </div>

                                <p className="text-sm text-slate-300 mb-3">
                                  Skills: {(mentor.skills || [])
                                    .map((skill) => skill?.name || skill)
                                    .filter(Boolean)
                                    .join(', ')}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => router.push(`/profile/${mentor._id}`)}
                                  className="w-full mt-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                >
                                  View Profile & Connect
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">No mentors found for your learning path yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Currently Pursuing Skills Tab */}
              {tab === 'learning' && (
                <div>
                  {loadingPaths ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <span className="ml-2 text-slate-400">Loading your learning paths...</span>
                    </div>
                  ) : learningPaths.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                      <p className="text-slate-400 mb-4">No active learning paths yet.</p>
                      <button
                        onClick={() => setTab('roadmap')}
                        className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Create Your First Roadmap
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {learningPaths.map((path) => (
                        <div key={path._id} className="glass-card p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-slate-100">Goal: {path.goal}</h3>
                              <p className="text-sm text-slate-400 mt-1">
                                Started {new Date(path.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-indigo-600">{path.progress}%</span>
                              <button
                                onClick={() => deleteRoadmap(path._id)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="bg-slate-800 rounded-full h-3 mb-6 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${path.progress}%` }}
                            />
                          </div>

                          <div className="space-y-4">
                            {path.topics.map((topic, topicIndex) => {
                              const totalItems = topic.checklist.length;
                              const completedItems = topic.checklist.filter(item => item.completed).length;
                              const topicProgress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

                              return (
                                <div key={topicIndex} className="border border-slate-700 rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h4 className="font-semibold text-slate-100">{topic.title}</h4>
                                      <p className="text-sm text-slate-400 mt-1">
                                        {topic.estimatedTime}
                                      </p>
                                    </div>
                                    <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                      {topicProgress}%
                                    </span>
                                  </div>

                                  {topic.prerequisites && topic.prerequisites.length > 0 && (
                                    <p className="text-sm text-slate-300 mb-3">
                                      Prerequisites: {topic.prerequisites.join(', ')}
                                    </p>
                                  )}

                                  <div className="space-y-2 mb-3">
                                    {topic.checklist.map((item, itemIndex) => (
                                      <label key={itemIndex} className="flex items-center space-x-3 p-2 hover:bg-slate-900/40 rounded cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={item.completed}
                                          onChange={() => togglePathChecklist(path._id, topicIndex, itemIndex)}
                                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className={`text-sm flex-1 ${item.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                          {item.text}
                                        </span>
                                      </label>
                                    ))}
                                  </div>

                                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${topicProgress}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {path.progress === 100 && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-700 font-medium">
                                Congratulations! You've completed this learning path!
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}




