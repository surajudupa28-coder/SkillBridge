import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DocumentSubmission from '@/models/DocumentSubmission';
import SkillVerification from '@/models/SkillVerification';
import { getAuthUser } from '@/lib/auth';

const DOCUMENT_SCORES = {
  'professional-certification': 20,
  'industry-credential': 25,
  'project-portfolio': 15,
  'course-certificate': 10,
  'competition-award': 10,
  'github-repo': 15,
  'research-paper': 10,
  'project-documentation': 5,
  'other': 5
};

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query = {};
    if (status) query.verificationStatus = status;

    const documents = await DocumentSubmission.find(query)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    await dbConnect();

    const { documentId, action, reviewerNotes } = await request.json();
    if (!documentId || !action) return NextResponse.json({ error: 'documentId and action required' }, { status: 400 });

    const doc = await DocumentSubmission.findById(documentId);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    doc.reviewedBy = user._id;
    doc.reviewDate = new Date();
    doc.reviewerNotes = reviewerNotes || '';

    if (action === 'approve') {
      doc.verificationStatus = 'verified';
      doc.scoreAwarded = DOCUMENT_SCORES[doc.documentType] || 5;
    } else if (action === 'reject') {
      doc.verificationStatus = 'rejected';
      doc.scoreAwarded = 0;
    }
    await doc.save();

    // Recalculate total document score for the verification
    const verifiedDocs = await DocumentSubmission.find({
      user: doc.user, skillName: doc.skillName, verificationStatus: 'verified'
    });

    const rawDocScore = verifiedDocs.reduce((sum, d) => sum + (d.scoreAwarded || 0), 0);
    const cappedDocScore = Math.min(rawDocScore, 100); // Raw points capped
    const scaledDocScore = Math.min(Math.round((rawDocScore / 25) * 100), 100); // Scale so 25 raw = 100%

    const verification = await SkillVerification.findOne({ user: doc.user, skillName: doc.skillName });
    if (verification) {
      verification.documentScore = scaledDocScore;
      verification.stages.documents = {
        completed: verifiedDocs.length >= 1,
        completedAt: verifiedDocs.length >= 1 ? new Date() : undefined,
        score: scaledDocScore
      };
      await verification.save();
    }

    return NextResponse.json({ document: doc, rawDocScore, scaledDocScore });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
