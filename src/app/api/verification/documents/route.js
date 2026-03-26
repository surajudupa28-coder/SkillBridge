import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DocumentSubmission from '@/models/DocumentSubmission';
import SkillVerification from '@/models/SkillVerification';
import { getAuthUser } from '@/lib/auth';
import { extractDocumentText, evaluateDocumentForSkill } from '@/lib/documentEvaluation';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const skillName = searchParams.get('skillName');
    const query = { user: user._id };
    if (skillName) query.skillName = skillName;

    const documents = await DocumentSubmission.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const {
      skillName,
      documentTitle,
      documentType,
      issuingOrganization,
      issueDate,
      description,
      fileURL,
      fileType,
      extractedText
    } = await request.json();

    if (!skillName || !documentTitle || !documentType || !fileURL) {
      return NextResponse.json({ error: 'skillName, documentTitle, documentType, and fileURL are required' }, { status: 400 });
    }

    let verification = await SkillVerification.findOne({ user: user._id, skillName });
    if (!verification) {
      verification = await SkillVerification.create({
        user: user._id, skillName,
        verificationStatus: 'under-review',
        stages: { declaration: { completed: true, completedAt: new Date() } }
      });
    }

    const doc = await DocumentSubmission.create({
      user: user._id,
      skillName,
      verification: verification._id,
      documentTitle,
      documentType,
      issuingOrganization: issuingOrganization || '',
      issueDate: issueDate ? new Date(issueDate) : null,
      description: description || '',
      fileURL,
      fileType: fileType || 'link'
    });

    // INTEGRATION POINT: Skill-aware document verification via Groq.
    const text = await extractDocumentText({
      extractedText,
      fileURL,
      documentTitle,
      issuingOrganization,
      description
    });
    const documentEval = await evaluateDocumentForSkill({ skill: skillName, text });
    const documentRawScore = documentEval.score;
    const scaledDocumentScore = Math.min(Math.round((documentRawScore / 20) * 100), 100);

    doc.scoreAwarded = scaledDocumentScore;
    doc.reviewerNotes = documentEval.reasoning;
    await doc.save();

    verification.documentScore = Math.max(verification.documentScore || 0, scaledDocumentScore);
    verification.stages.documents = {
      ...verification.stages.documents,
      completed: scaledDocumentScore >= 40,
      completedAt: scaledDocumentScore >= 40 ? new Date() : verification.stages.documents?.completedAt,
      score: verification.documentScore
    };

    if (verification.verificationStatus === 'unverified' || verification.verificationStatus === 'testing') {
      verification.verificationStatus = 'under-review';
    }
    await verification.save();

    return NextResponse.json({
      document: doc,
      documentEvaluation: {
        relevanceScore: documentEval.relevanceScore,
        credibilityScore: documentEval.credibilityScore,
        score: documentRawScore,
        reasoning: documentEval.reasoning,
        fallbackScoring: documentEval.fallbackScoring
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
