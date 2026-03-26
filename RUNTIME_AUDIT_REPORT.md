# Runtime Bug & Deployment Risk Audit

**Date:** March 26, 2026  
**Severity Distribution:** 5 Critical | 12 High | 8 Medium | 6 Low  
**Status:** ⚠️ SIGNIFICANT ISSUES IDENTIFIED - Do not deploy without fixes

---

## Summary

This audit identified 31 runtime bugs and deployment risks across API route reliability, database operations, frontend-API integration, auth flow, and environment configuration. Many issues could cause silent failures, data inconsistency, or security problems in production.

---

## 1. CRITICAL ISSUES (Must Fix Before Deployment)

### 🔴 CRITICAL-001: Missing Authorization Check in User Profile Endpoint

**File:** [src/app/api/users/[id]/route.js](src/app/api/users/[id]/route.js#L1-L20)  
**Severity:** CRITICAL  
**Issue:** GET endpoint returns any user's profile data with mentor/learner sessions without authorization check.

```javascript
// Line 1-20: No check if authUser can view params.id profile
export async function GET(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // BUG: authUser is authenticated but NO CHECK if they can access params.id
  const user = await User.findById(params.id).select('-password');
  // Returns private session data to any authenticated user
  const mentorSessions = await Session.find({ mentor: user._id })...
  const learnerSessions = await Session.find({ learner: user._id })...
  return NextResponse.json({ user, mentorSessions, learnerSessions });
}
```

**Impact:** Privacy violation - users can view any other user's session history, mentor relationships, earnings.  
**Fix:** Add ownership check:

```javascript
if (authUser._id.toString() !== params.id && authUser.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

### 🔴 CRITICAL-002: Response Handling in Profile Save Function

**File:** [src/app/profile/page.js](src/app/profile/page.js#L143-L148)  
**Severity:** CRITICAL  
**Issue:** Save function doesn't check HTTP response status; exits editing mode even if save fails.

```javascript
// Line 143-148
const save = async () => {
  setSaving(true);
  try {
    await fetch('/api/users/profile', { method: 'PUT', ... });
    setEditing(false); // ❌ Closes form WITHOUT checking res.ok
  } catch {} // ❌ Empty catch block
  finally { setSaving(false); }
};
```

**Impact:** User loses unsaved edits silently if request fails; no error feedback.  
**Fix:**

```javascript
const save = async () => {
  setSaving(true);
  try {
    const res = await fetch('/api/users/profile', { method: 'PUT', ... });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Save failed');
    }
    setEditing(false);
    setActionMsg({ text: 'Profile saved successfully', type: 'success' });
  } catch (err) {
    setActionMsg({ text: err.message, type: 'error' });
  } finally { setSaving(false); }
};
```

---

### 🔴 CRITICAL-003: No GROQ_API_KEY Validation

**File:** [src/lib/groq.js](src/lib/groq.js#L1-L7)  
**Severity:** CRITICAL  
**Issue:** Creates OpenAI client with potentially undefined GROQ_API_KEY without validation. Requests will fail silently.

```javascript
// Line 3
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY, // ❌ No validation, could be undefined
  baseURL: "https://api.groq.com/openai/v1",
});
```

**Impact:** Skill verification, portfolio evaluation, and test grading calls fail silently because API requests fail.  
**Current .env.local:** Has `GROQ_API_KEY` but no validation that it's not empty or invalid.  
**Fix:** Add validation to groq.js:

```javascript
if (!process.env.GROQ_API_KEY) {
  throw new Error(
    "[GROQ Error] GROQ_API_KEY environment variable is not set. AI features will not work.",
  );
}
```

---

### 🔴 CRITICAL-004: Missing Email Configuration Validation

**File:** [src/lib/email.js](src/lib/email.js#L1-L18)  
**Severity:** CRITICAL  
**Issue:** Email library checks credentials at send time but throws error instead of failing gracefully. OTP endpoints will crash if email config is missing.

```javascript
// Line 11-12
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error("Email SMTP credentials are not configured");
}
```

**Problem:** `.env.local` doesn't contain EMAIL_USER or EMAIL_PASS. Any OTP resend/verification will throw error.  
**Routes affected:**

- `/api/auth/resend-email-otp` (Line 31)
- `/api/auth/verify-email-otp` (implied)

**Fix:** Add EMAIL_USER and EMAIL_PASS to .env.local or disable email-based OTP in production.

---

### 🔴 CRITICAL-005: Response Type Inconsistency in AI Endpoints

**File:** [src/app/api/ai/chat/route.js](src/app/api/ai/chat/route.js#L1-L40)  
**Severity:** CRITICAL  
**Issue:** Uses `Response.json()` instead of `NextResponse.json()`. Works in Node runtime but fails in Edge runtime.

```javascript
// Line 18, 20 - Wrong response type
return Response.json({ error: "message is required" }, { status: 400 });
return Response.json({ reply });
// Line 27
return Response.json(
  { error: "Unable to process chat request" },
  { status: 500 },
);
```

**Deployment Risk:** If app is deployed to Vercel Edge Functions, these endpoints will crash with "Response is not defined".  
**Fix:** Change all to `NextResponse`:

```javascript
import { NextResponse } from "next/server";
return NextResponse.json({ error: "message is required" }, { status: 400 });
```

---

## 2. HIGH-SEVERITY ISSUES

### 🟠 HIGH-001: Error Silencing in Talent Page

**File:** [src/app/talent/page.js](src/app/talent/page.js#L75-L87)  
**Severity:** HIGH  
**Issue:** All errors are caught and ignored with `catch { /* network error */ }`. Fails silently.

```javascript
// Line 75-87
const fetchTalent = useCallback(async (s) => {
  setSearching(true);
  try {
    const res = await fetch(url);
    const data = await res.json(); // ❌ No res.ok check
    setTalent(data.talent || []);
  } catch {
    /* network error */
  } finally {
    // ❌ Silent failure
    setSearching(false);
  }
}, []);
```

**Multiple instances:** Lines 104, 115, 125, 140  
**Impact:** Users don't know if data failed to load; stale data persists.  
**Fix:** Add error state and show to user:

```javascript
const [error, setError] = useState("");
const fetchTalent = useCallback(async (s) => {
  setSearching(true);
  setError("");
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load talent");
    const data = await res.json();
    setTalent(data.talent || []);
  } catch (err) {
    setError(err.message);
  } finally {
    setSearching(false);
  }
}, []);
```

---

### 🟠 HIGH-002: Missing Response Status Checks in Client Fetches

**File:** [src/app/profile/page.js](src/app/profile/page.js#L143-L168)  
**Severity:** HIGH  
**Issue:** Multiple fetch calls don't check `res.ok` before assuming success.

**Instances:**

- Line 145: `/api/badges` (no res.ok check)
- Line 147: `/api/users/profile` (no res.ok check)

```javascript
// Line 143-145 - MISSING RES.OK CHECK
useEffect(() => {
  fetch("/api/badges")
    .then((r) => r.json())
    .then((d) => setUserBadges(d.userBadges || []))
    .catch(() => {});
}, []);
```

**Impact:** Failed requests silently set state to potentially invalid data (e.g., `undefined.userBadges`).  
**Fix:** Add status check:

```javascript
fetch("/api/badges")
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((d) => setUserBadges(d.userBadges || []))
  .catch((err) => {
    console.error("Failed to load badges:", err);
    setUserBadges([]);
  });
```

---

### 🟠 HIGH-003: Conditional Dependency Loop in talentPage

**File:** [src/app/talent/page.js](src/app/talent/page.js#L154-L160)  
**Severity:** HIGH  
**Issue:** useEffect has missing dependencies in dependencies array.

```javascript
// Line 154-160
useEffect(() => {
  if (user?.role === "company" || user?.role === "admin") {
    fetchTalent("");
    fetchAnalytics();
    fetchPipeline();
    fetchCompanyPlan();
  }
}, [user, fetchTalent, fetchAnalytics, fetchPipeline, fetchCompanyPlan]);
```

**Problem:** `fetchTalent` depends on `skill` state (line 74), but `skill` is not in deps. When skill changes, fetches don't re-run.  
**Impact:** Stale data after search query changes.

---

### 🟠 HIGH-004: Portfolio Evaluation AI Error Fallback

**File:** [src/lib/portfolioEvaluation.js](src/lib/portfolioEvaluation.js#L38-L65)  
**Severity:** HIGH  
**Issue:** AI evaluation can fail on parsing but returns fallback without logging actual error context.

```javascript
// Line 38-65
try {
  const response = await groq.chat.completions.create(...);
  const parsed = extractJsonObject(response?.choices?.[0]?.message?.content || '');
  // ❌ If parsed is null, this returns 0
  return {
    score: clamp(Number(parsed?.score ?? 0), 0, 30),
    feedback: String(parsed?.feedback || 'Portfolio evaluated.').trim(),
    fallbackScoring: false
  };
} catch (error) {
  console.error('Portfolio evaluation failed:', error);
  return {
    score: fallbackPortfolioScore(...),
    feedback: 'AI portfolio evaluation unavailable. Fallback scoring applied.',
    fallbackScoring: true
  };
}
```

**Problem:** If JSON parsing fails (parsed is null), score becomes 0 without fallback. Also uses fake "score: 0" as not-an-error.  
**Impact:** Portfolio evaluations can unfairly fail users when JSON parsing fails.

---

### 🟠 HIGH-005: Null Reference in Test Submission

**File:** [src/app/api/verification/test/submit/route.js](src/app/api/verification/test/submit/route.js#L28-L40)  
**Severity:** HIGH  
**Issue:** Questions array might be empty/null, but error message is unclear about recovery.

```javascript
// Line 28-40
const allQuestions = Array.isArray(attempt.questions) ? attempt.questions : [];
if (allQuestions.length === 0) {
  return NextResponse.json(
    { error: "Attempt questions missing. Please restart the test." },
    { status: 400 },
  );
}
```

**Problem:** If questions array is missing, user is told to restart, but root cause (database corruption) is not logged.  
**Impact:** Intermittent test failures with no audit trail.

---

### 🟠 HIGH-006: Missing Await on Save Operations

**File:** [src/app/api/sessions/[id]/complete/route.js](src/app/api/sessions/[id]/complete/route.js#L26-L56)  
**Severity:** HIGH (Intermittent)  
**Issue:** Transaction creation might not be awaited properly in error scenarios.

```javascript
// Line 26-56
session.status = 'completed';
session.escrowAmount = 0;
await session.save(); // ✓ Awaited

mentor.walletBalance += mentorPayment;
mentor.sessionsCompleted += 1;
// ... calculations ...
await mentor.save(); // ✓ Awaited

// But Transaction.create might fail without crashing
await Transaction.create({ ... }); // If this fails, response still goes out
```

**Problem:** No error handling if Transaction.create fails. Data already committed to mentor/session.  
**Impact:** Wallet balance updated but transaction not recorded in audit log.

---

### 🟠 HIGH-007: Fetch Response Validation Missing

**File:** [src/app/mentors/page.js](src/app/mentors/page.js#L21-L28)  
**Severity:** HIGH  
**Issue:** `search()` doesn't validate response.ok before using data.

```javascript
// Line 21-28
const search = async () => {
  setSearching(true);
  try {
    const res = await fetch(`/api/matching?skill=...`);
    const data = await res.json(); // ❌ No res.ok check
    setMentors(data.mentors || []);
  } catch {
  } finally {
    setSearching(false);
  }
};
```

**Impact:** 404 or 500 responses are parsed as valid data.

---

### 🟠 HIGH-008: Email Credentials Missing in Production

**File:** [.env.local](.env.local#L1-L6)  
**Severity:** HIGH  
**Issue:** EMAIL_USER and EMAIL_PASS are not defined anywhere. Will crash on OTP send.

```
Missing from .env.local:
EMAIL_USER=<undefined>
EMAIL_PASS=<undefined>
```

**Routes affected:**

- `/api/auth/resend-email-otp` (~line 31)
- `/api/auth/verify-email-otp` (sendEmail call)

**Impact:** Email verification completely broken in production.

---

### 🟠 HIGH-009: Admin Page Role Check Delay

**File:** [src/app/admin/page.js](src/app/admin/page.js#L43-L51)  
**Severity:** HIGH  
**Issue:** Admin page renders before database role is fetched, causing flash.

```javascript
// Line 43-51
useEffect(() => {
  if (isLoaded && user) {
    fetch("/api/users/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setDbUser(d.user);
        if (!d.user || d.user.role !== "admin") router.push("/dashboard");
      })
      .catch(() => router.push("/dashboard"));
  }
}, [user, isLoaded, router]);
```

**Problem:** Component renders admin UI before redirect executes, then blinks away to dashboard.  
**Better:** Use loading state or conditional render:

```javascript
if (!dbUser) return <LoadingSpinner />;
if (dbUser.role !== "admin") return null; // Or redirect earlier
```

---

### 🟠 HIGH-010: Arbitrary AI Token Limits

**File:** [src/lib/portfolioEvaluation.js](src/lib/portfolioEvaluation.js#L49-L52) and [groqEvaluation.js](src/lib/groqEvaluation.js#L30-L33)  
**Severity:** HIGH  
**Issue:** Hard-coded `max_tokens: 250` might cut off responses without retry logic.

```javascript
const response = await groq.chat.completions.create({
  model: PORTFOLIO_MODEL,
  temperature: 0.1,
  max_tokens: 250, // ❌ Arbitrary; might truncate JSON
  messages: [...]
});
```

**Impact:** Large evaluations get truncated, JSON parsing fails, fallback scoring used unfairly.

---

### 🟠 HIGH-011: Unvalidated Route Parameters

**File:** [src/app/api/learning-path/route.js](src/app/api/learning-path/route.js#L15-L20)  
**Severity:** HIGH  
**Issue:** pathId is used without format validation. Could cause injection if not a valid ObjectId.

```javascript
// Line 15-20
const pathId = searchParams.get("pathId");
if (pathId) {
  const path = await LearningPath.findById(pathId); // ❌ pathId not validated
}
```

**Fix:** Validate ObjectId format:

```javascript
if (pathId && !mongoose.Types.ObjectId.isValid(pathId)) {
  return NextResponse.json({ error: "Invalid pathId" }, { status: 400 });
}
```

---

### 🟠 HIGH-012: Context Provider Returns Empty Value

**File:** [src/context/AuthContext.js](src/context/AuthContext.js#L5-L10)  
**Severity:** HIGH  
**Issue:** AuthProvider returns empty context value, but useAuth reads from Clerk hooks.

```javascript
// Line 5-10 - Provider
export function AuthProvider({ children }) {
  return (
    <AuthContext.Provider value={{}}>
      {" "}
      // ❌ Empty value object
      {children}
    </AuthContext.Provider>
  );
}

// Line 13 - Hook reads from Clerk, not context
export const useAuth = () => {
  const { user, isLoaded, isSignedIn } = useUser(); // ❌ Reads from Clerk, not context
  // ...
};
```

**Problem:** AuthProvider is cosmetic; useAuth ignores it entirely. If Clerk changes, it breaks.  
**Impact:** Context is not actually used; creates confusion about auth source.

---

## 3. MEDIUM-SEVERITY ISSUES

### 🟡 MEDIUM-001: Race Condition in useEffect Dependencies

**File:** [src/context/AuthContext.js](src/context/AuthContext.js#L50-L65)  
**Severity:** MEDIUM  
**Issue:** Token loading has mounted flag but never cleans up properly if dependencies change.

```javascript
// Line 50-65
useEffect(() => {
  let mounted = true;
  const loadToken = async () => {
    if (!isLoaded || !isSignedIn) {
      if (mounted) setToken(null);
      return;
    }
    try {
      const t = await getToken();
      if (mounted) setToken(t || null);
    } catch {
      if (mounted) setToken(null);
    }
  };
  loadToken();
  return () => {
    mounted = false;
  };
}, [getToken, isLoaded, isSignedIn]);
```

**Problem:** If `getToken` changes, stale async calls might resolve after cleanup.  
**Impact:** Intermittent "Can't perform a React state update on an unmounted component" warnings.

---

### 🟡 MEDIUM-002: No Null Check Before Portfolio Score Calculation

**File:** [src/app/api/verification/portfolio/route.js](src/app/api/verification/portfolio/route.js#L42-L65)  
**Severity:** MEDIUM  
**Issue:** aiEvaluations array might contain null values if Promise.all partially fails.

```javascript
// Line 42-65
const aiEvaluations = await Promise.all(
  projects.map((project) =>
    evaluatePortfolioForSkill({...})
  )
);

const aiRawAverage = aiEvaluations.length
  ? Math.round(aiEvaluations.reduce((sum, e) => sum + (e.score || 0), 0) / aiEvaluations.length)
  : 0;
```

**Problem:** Promise.all throws on first rejection. If one project evaluation fails, entire portfolio request fails.  
**Fix:** Use `Promise.allSettled` instead:

```javascript
const aiEvaluations = await Promise.allSettled(
  projects.map((project) => evaluatePortfolioForSkill({...}))
);
const results = aiEvaluations
  .map((r) => r.status === 'fulfilled' ? r.value : { score: 0, fallbackScoring: true })
  .filter(Boolean);
```

---

### 🟡 MEDIUM-003: Unvalidated Search Query Input

**File:** [src/app/api/talent/route.js](src/app/api/talent/route.js#L14-L18)  
**Severity:** MEDIUM  
**Issue:** `skill` query parameter is used in regex without escaping special characters.

```javascript
// Line 14-18
const skill = searchParams.get("skill");
const query = { suspended: { $ne: true }, sessionsCompleted: { $gt: 0 } };
if (skill) {
  query["skills.name"] = { $regex: new RegExp(skill, "i") }; // ❌ No escaping
}
```

**Impact:** User can send regex like `.*` to match all skills. Also potential ReDoS attack with crafted regex.  
**Fix:** Escape special regex characters:

```javascript
const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
query["skills.name"] = { $regex: new RegExp(escapedSkill, "i") };
```

---

### 🟡 MEDIUM-004: Inconsistent Database Connection Names

**File:** [src/app/api/matching/route.js](src/app/api/matching/route.js#L1-L3)  
**Severity:** MEDIUM  
**Issue:** Uses `connectDB` instead of `dbConnect`. Both should be the same helper.

```javascript
// Line 1-3 - Inconsistent naming
import connectDB from "@/lib/db";
// vs
import dbConnect from "@/lib/db";
```

**Impact:** If someone removes the older alias, these routes break. Maintenance confusion.  
**Fix:** Standardize to `dbConnect` everywhere.

---

### 🟡 MEDIUM-005: No Validation of JSON Request Bodies

**File:** [src/app/api/verification/documents/route.js](src/app/api/verification/documents/route.js#L31-L45)  
**Severity:** MEDIUM  
**Issue:** Required fields checked but no schema validation.

```javascript
// Line 31-45
const {
  skillName,
  documentTitle,
  documentType,
  issuingOrganization,
  issueDate,
  description,
  fileURL,
  fileType,
  extractedText,
} = await request.json();

if (!skillName || !documentTitle || !documentType || !fileURL) {
  return NextResponse.json({ error: "... are required" }, { status: 400 });
}
```

**Problem:** No validation that fileURL is actually a valid URL, or that fileType matches allowed types.  
**Impact:** Invalid data saved to database.

---

### 🟡 MEDIUM-006: Missing Response Headers

**File:** [src/app/api/verification/route.js](src/app/api/verification/route.js#L1-L20)  
**Severity:** MEDIUM  
**Issue:** Endpoints don't set cache headers or content-type explicitly.

```javascript
// Most routes do:
return NextResponse.json({ data });
// Missing cache control headers for deployment to CDNs
```

**Impact:** Stale data might be served from CDN cache in production.  
**Fix:** Add headers:

```javascript
return NextResponse.json(
  { data },
  { headers: { "Cache-Control": "no-cache, no-store, must-revalidate" } },
);
```

---

### 🟡 MEDIUM-007: Error Messages Might Leak Information

**File:** Multiple route handlers  
**Severity:** MEDIUM  
**Issue:** Database errors are returned directly to client.

```javascript
// Line always returns raw error
return NextResponse.json({ error: error.message }, { status: 500 });
```

**Problem:** MongoDB errors like "ValidationError: path `role` enum" leak schema info.  
**Fix:** Log error server-side, return generic message:

```javascript
catch (error) {
  console.error('Route error:', error);
  return NextResponse.json(
    { error: 'An error occurred processing your request' },
    { status: 500 }
  );
}
```

---

### 🟡 MEDIUM-008: Hardcoded Model Names in groqEvaluation

**File:** [src/lib/groqEvaluation.js](src/lib/groqEvaluation.js#L3)  
**Severity:** MEDIUM  
**Issue:** Model name is hard-coded instead of using env variable.

```javascript
// Line 3
const EVAL_MODEL = "llama3-8b-8192";
```

**Impact:** Can't switch models in production without code change. If model becomes unavailable, app breaks.

---

## 4. LOW-SEVERITY ISSUES

### 🟢 LOW-001: Missing Dependency Array in Profile useEffect

**File:** [src/app/profile/page.js](src/app/profile/page.js#L147-L151)  
**Severity:** LOW  
**Issue:** useEffect fetching badges has empty dependency array but should re-fetch on user change.

```javascript
// Line 147-151
useEffect(() => {
  fetch("/api/badges")
    .then((r) => r.json())
    .then((d) => setUserBadges(d.userBadges || []))
    .catch(() => {});
}, []); // ❌ Empty dependencies
```

**Impact:** Badges don't re-fetch if user changes. Minor issue.  
**Fix:** Add `[loading]` dependency.

---

### 🟢 LOW-002: Incomplete Error Handling in Promise.all

**File:** [src/app/api/verification/portfolio/route.js](src/app/api/verification/portfolio/route.js#L42-L48)  
**Severity:** LOW  
**Issue:** If one project evaluation fails, entire portfolio submission fails.

**Impact:** User loses form data. Already noted in MEDIUM-003.

---

### 🟢 LOW-003: No Timeout on Fetch Calls

**File:** Multiple client components  
**Severity:** LOW  
**Issue:** Client fetches have no timeout. Hanging requests can freeze UI.

**Impact:** If backend is slow/down, UI appears frozen.  
**Fix:** Add AbortController for 10 second timeout.

---

### 🟢 LOW-004: Console Errors Not Structured

**File:** [src/lib/groqEvaluation.js](src/lib/groqEvaluation.js#L60), [portfolioEvaluation.js](src/lib/portfolioEvaluation.js#L73)  
**Severity:** LOW  
**Issue:** Console.error doesn't include operation context.

```javascript
console.error("Portfolio evaluation failed:", error);
```

**Better:**

```javascript
console.error(
  "[PortfolioEvaluation] Failed for skill:",
  skill,
  "error:",
  error,
);
```

---

### 🟢 LOW-005: Unused Imports

**File:** [src/app/api/verification/calculate/route.js](src/app/api/verification/calculate/route.js)  
**Severity:** LOW  
**Issue:** May have unused imports. No refactoring needed per audit scope.

---

### 🟢 LOW-006: Magic Numbers in Scoring

**File:** Multiple verification routes  
**Severity:** LOW  
**Issue:** Weights and thresholds (e.g., 0.5, 0.2 in mentor scoring) are magic numbers.

**Better:** Define constants at top:

```javascript
const MATCH_SCORE_WEIGHTS = {
  skillOverlap: 0.5,
  reputation: 0.2,
  // ...
};
```

---

## 5. ENVIRONMENT CONFIGURATION ISSUES

### Missing Environment Variables

| Variable                          | Status        | Location   | Impact                      |
| --------------------------------- | ------------- | ---------- | --------------------------- |
| MONGODB_URI                       | ✅ Set        | .env.local | Required for DB connection  |
| GROQ_API_KEY                      | ✅ Set        | .env.local | AI features (no validation) |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | ✅ Set        | .env.local | Clerk client-side           |
| CLERK_SECRET_KEY                  | ✅ Set        | .env.local | Clerk server-side           |
| EMAIL_USER                        | ❌ MISSING    | -          | OTP emails                  |
| EMAIL_PASS                        | ❌ MISSING    | -          | OTP emails                  |
| JWT_SECRET                        | ✅ Set        | .env.local | Legacy JWT (if used)        |
| GROQ endpoint                     | ✅ Hard-coded | groq.js:5  | No fallback                 |

---

## 6. DEPLOYMENT RISKS

### 🚨 DEPLOYMENT Risk-001: Edge Runtime Incompatibility

**Issue:** Response.json() instead of NextResponse.json() will fail on Edge Functions  
**Routes:** `/api/ai/chat`, `/api/ai/extract-skills`, `/api/ai/roadmap`  
**Fix Priority:** CRITICAL before Edge deployment

### 🚨 DEPLOYMENT Risk-002: Environment Variables Missing in Deployment Pipeline

**Missing:** EMAIL_USER, EMAIL_PASS  
**Consequence:** OTP feature completely broken in production  
**Fix Priority:** CRITICAL - Add to deployment env vars

### 🚨 DEPLOYMENT Risk-003: No Error Handling for AI API Timeouts

**Issue:** Groq API calls have no timeout. If API is down, requests hang indefinitely.  
**Impact:** Skill verification tests hang forever.  
**Fix:** Add timeout handling:

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);
try {
  const response = await groq.chat.completions.create({
    messages: [...],
    signal: controller.signal
  });
} finally {
  clearTimeout(timeoutId);
}
```

### 🚨 DEPLOYMENT Risk-004: Database Connection Pool Issues

**Issue:** Global mongoose connection caching might leak connections under load.  
**Monitor:** Check MongoDB connection count during load testing.

### 🚨 DEPLOYMENT Risk-005: No Health Check Endpoint

**Missing:** GET /api/health for load balancers  
**Impact:** Vercel/Docker health checks will fail

---

## 7. DEPLOYMENT CHECKLIST

- [ ] Fix all CRITICAL issues (5 items)
- [ ] Add EMAIL_USER and EMAIL_PASS to deployment environment
- [ ] Change Response.json() to NextResponse.json() in AI routes
- [ ] Add GROQ_API_KEY validation to groq.js
- [ ] Add timeout to all AI API calls
- [ ] Replace `catch {}` with proper error handlers in client components
- [ ] Add `res.ok` checks to all fetch calls in components
- [ ] Create .env.example with all required variables
- [ ] Add /api/health endpoint
- [ ] Load test with concurrent AI evaluation requests
- [ ] Verify email service works end-to-end
- [ ] Test MongoDB connection pooling under load

---

## 8. QUICK FIX SUMMARY

**Minimum changes to make deployment-safe:**

1. **Profile save function** - Check res.ok + show error
2. **User profile endpoint** - Add ownership checks
3. **Email config** - Add EMAIL_USER/EMAIL_PASS or disable OTP
4. **AI endpoints** - Use NextResponse instead of Response
5. **Client fetches** - Add res.ok checks and error state
6. **Groq init** - Validate API key exists
7. **Error silencing** - Replace catch {} with real handling

**Estimated effort:** 2-3 hours for all critical fixes

---

## 9. NOTES

- No schema changes required for any fixes
- All fixes are isolated to individual functions/components
- No UI or feature changes needed
- Clerk authentication flow remains unchanged
- All fixes are backward compatible

---

**Report Generated:** GitHub Copilot  
**Next Review:** After applying all CRITICAL fixes
