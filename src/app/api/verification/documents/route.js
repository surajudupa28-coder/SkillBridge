import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DocumentSubmission from '@/models/DocumentSubmission';
import SkillVerification from '@/models/SkillVerification';
import { getAuthUser } from '@/lib/auth';

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

    const { skillName, documentTitle, documentType, issuingOrganization, issueDate, description, fileURL, fileType } = await request.json();

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

    if (verification.verificationStatus === 'unverified' || verification.verificationStatus === 'testing') {
      verification.verificationStatus = 'under-review';
    }
    verification.stages.documents = { ...verification.stages.documents, completed: false };
    await verification.save();

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
