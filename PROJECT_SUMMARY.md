# SkillBridge Project Summary

## 1) What SkillBridge Is

SkillBridge is a Next.js 14 platform for mentorship, skill verification, and hiring readiness.
It connects learners, mentors, recruiters, and admins through one product surface that combines:

- mentor discovery and sessions
- AI-assisted learning guidance
- multi-stage skill verification
- talent discovery and hiring pipeline workflows

Primary personas:

- Learners: discover mentors, book sessions, verify skills, and track progress
- Mentors: advertise expertise, run sessions, and build reputation
- Recruiters/Companies: review talent signals and manage candidate pipelines
- Admins: moderate reports, verifications, and platform behavior

---

## 2) Tech Stack (Current)

- Frontend: Next.js 14 App Router, React 18, Tailwind CSS
- Backend: Next.js route handlers under `src/app/api`
- Database: MongoDB via Mongoose
- Authentication: Clerk (current primary), plus legacy auth folders present for compatibility
- AI providers:
  - Groq SDK wrapper (`src/lib/groq.js`)
  - OpenAI-compatible client targeting Groq models (`src/lib/openai.js`)

---

## 3) Current Snapshot (Main App in `src/`)

Measured from current repository state:

- API route handlers (`route.js`): 45
- UI pages (`page.js`): 15
- Data models (`src/models/*.js`): 14

Main app path: `src/`

Additional workspace artifact: `clerk-nextjs/` is present as a separate nested Next.js app scaffold and not the primary runtime for the root project.

---

## 4) Core Feature Areas

### A) Access and Identity

- Clerk provider wired at app layout level
- Clerk middleware route protection with explicit public-route allowlist
- DB-backed user resolution in `getAuthUser`:
  - resolve by `clerkId`
  - fallback by email
  - create/link local Mongo user when needed
- Email OTP flows for verification-sensitive operations

### B) Mentor Discovery and Sessions

- Mentor matching endpoint and shared scoring utility
- Session lifecycle endpoints:
  - create/list/get
  - cancel
  - complete
  - rate
  - report

### C) Wallet and Transactions

- Wallet balance retrieval
- Purchase/credit flow with optional OTP verification
- Transaction logging and history retrieval

### D) Skill Verification (Multi-Stage)

Verification domain includes declaration, test, portfolio, documents, endorsements, trial, and final score calculation.

Implementation highlights:

- skill-specific question generation via Groq with fallback strategy
- questions are persisted on attempt start and reused at submit-time grading
- mixed grading:
  - deterministic MCQ scoring
  - AI-evaluated scenario/explanation scoring
- anti-cheating signals (tab switches, copy/paste, suspicious timing, repeated-answer checks)
- AI confidence score captured and fed into final verification scoring

### E) Talent, Pipeline, and Monetization

- Talent list and talent analytics endpoints
- Candidate pipeline CRUD and stage movement (`saved`, `interviewing`, `hired`)
- User and company subscription endpoints
- Badge definitions and user badge assignment

### F) AI Features

- `POST /api/ai/chat`: concise AI mentor guidance
- `POST /api/ai/roadmap`: personalized learning plan generation
- `POST /api/ai/extract-skills`: profile/goal skill extraction
- `POST /api/ai/trending-skills`: trend generation + mentor attachment using shared mentor scoring

---

## 5) Data Model Inventory

- User
- Session
- Transaction
- Report
- SkillTest
- SkillVerification
- SkillTestAttempt
- DocumentSubmission
- UserSubscription
- CompanySubscription
- Badge
- UserBadge
- CandidatePipeline
- LearningPath

---

## 6) API Capability Groups

- Admin: documents, reports, stats, suspend, verifications
- AI: chat, extract-skills, roadmap, trending-skills
- Auth-related: resend-email-otp, verify-email-otp (legacy auth directory structure also exists)
- Badges and leaderboard
- Career insights and learning path
- Matching and mentor recommendation
- Pipeline management
- Sessions and session moderation actions
- Skills verify/endorse
- Subscriptions (user, company)
- Talent and talent analytics
- Users (profile, by-id)
- Verification lifecycle endpoints
- Wallet operations
- Seed data bootstrap

---

## 7) Known Strengths

- Broad domain coverage across learning, verification, and hiring
- Clean domain-oriented API grouping
- Improved verification integrity through stored question snapshots
- Reusable mentor scoring logic across matching and trending-skills
- Practical AI fallbacks reduce hard failures in user flows

---

## 8) Current Risks and Gaps

### Priority 1: Security and Reliability

1. Some legacy auth scaffolding coexists with Clerk-first flows

- Risk: confusion, drift, or accidental usage of stale paths
- Recommendation: define one canonical auth strategy and deprecate dead routes/files

2. Rate limiting is not consistently enforced across sensitive endpoints

- Risk: abuse and cost spikes (auth, AI, OTP)
- Recommendation: add per-IP and per-user throttling middleware

3. Limited transactional boundaries in critical multi-write operations

- Risk: partial writes for wallet/session/verification updates
- Recommendation: use MongoDB transactions where atomicity is required

### Priority 2: Scale and Operability

1. Some list endpoints are unpaginated or lightly constrained

- Recommendation: add cursor pagination and stricter query limits

2. Observability is basic

- Recommendation: add request IDs, structured logs, and error tracking

3. AI fallback quality is not explicitly surfaced to clients

- Recommendation: return source/quality metadata in responses

### Priority 3: Quality and Product Maturity

1. Automated test coverage is still limited

- Recommendation: add unit + integration tests for auth, verification, wallet, and sessions

2. Verification explainability can improve

- Recommendation: return richer rubric traces for AI-scored responses

---

## 9) Suggested 30-60-90 Plan

### 0-30 Days

- finalize auth strategy around Clerk and retire stale auth surfaces
- add rate limiting and request-level audit metadata
- add smoke tests for critical APIs (verification start/submit, wallet purchase, sessions)

### 31-60 Days

- add pagination and index tuning for high-read endpoints
- add structured monitoring/alerting
- tighten schema validation for AI request/response contracts

### 61-90 Days

- expand end-to-end coverage of core user journeys
- harden admin moderation and verification review workflows
- prepare production runbooks and reliability checklists

---

## 10) Environment Variables (Observed + Platform Required)

Directly referenced in code:

```env
MONGODB_URI=mongodb://localhost:27017/skillbridge
GROQ_API_KEY=your-groq-api-key
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
```

Required by Clerk integration in this app:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

---

## 11) Quick Validation Checklist

1. Clerk sign-in/sign-up redirects and protected routes work.
2. Authenticated API calls resolve a persisted Mongo user via `getAuthUser`.
3. Verification test start stores questions and submit grades against stored questions.
4. Portfolio/doc/test scoring updates verification records correctly.
5. Trending-skills returns skills plus mentor recommendations.
6. Session lifecycle actions (cancel/complete/rate/report) succeed.
7. Wallet endpoints update balance and record transactions.
8. Admin moderation routes enforce protection and return expected data.

---

## 12) Summary Status

- Version: v1.3
- Last Updated: March 26, 2026
- Status: Feature-complete development build with strong AI-assisted verification and hiring flows; next milestone is auth consolidation, reliability hardening, and deeper automated testing.
