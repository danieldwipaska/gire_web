import connectDB from '@/lib/mongodb';
import Integration from '@/models/Integration';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

type IntegrationPayload = {
  userId: string;
  provider: string | 'github';
  githubUsername: string;
  accessToken: string;
  lastSync: string | Date;
  status: 'active' | 'expired';
};

export async function POST(req: NextRequest) {
  const session = await verifyAuth(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  try {
    await Integration.syncIndexes();

    const { provider, githubUsername, accessToken, lastSync, status }: IntegrationPayload = await req.json();

    // Check unique provider + username per user
    const integration = await Integration.exists({
      provider,
      githubUsername,
      userId: session.id,
    });
    if (integration) {
      return NextResponse.json(
        { error: 'Integration Already Exists' },
        { status: 400, statusText: 'BAD REQUEST' },
      );
    }

    const newIntegration = await Integration.create({
      userId: session.id,
      provider,
      githubUsername,
      accessToken,
      lastSync: lastSync ? new Date(lastSync) : new Date(),
      status,
    });

    const sanitized = newIntegration.toObject();
    delete sanitized.accessToken;

    return NextResponse.json(sanitized, { status: 200, statusText: 'OK' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500, statusText: 'INTERNAL SERVER ERROR' });
  }
}

export async function GET(req: NextRequest) {
  const session = await verifyAuth(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  try {
    const integrations = await Integration.find({
      userId: session.id,
    })
      .select('-accessToken')
      .lean();

    return NextResponse.json(integrations, { status: 200, statusText: 'OK' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500, statusText: 'INTERNAL SERVER ERROR' });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifyAuth(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  try {
    const { id } = await req.json();

    const result = await Integration.deleteOne({
      _id: id,
      userId: session.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Integration deleted' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
