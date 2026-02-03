import connectDB from '@/lib/mongodb';
import Integration from '@/models/Integration';
import { NextRequest, NextResponse } from 'next/server';

type IntegrationPayload = {
  userId: string;
  provider: string | 'github';
  githubUsername: string;
  accessToken: string;
  lastSync: string | Date;
  status: 'active' | 'expired';
};

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const { userId, provider, githubUsername, accessToken, lastSync, status }: IntegrationPayload = await req.json();

    // CHECK UNIQUE PROVIDER
    const integration = await Integration.exists({ provider });
    if (integration) return NextResponse.json({ error: 'Integration Already Exists' }, { status: 400, statusText: 'BAD REQUEST' });

    // ADD TO DATABASE
    const newIntegration = await Integration.create({
      userId,
      provider,
      githubUsername,
      accessToken,
      lastSync: lastSync ? new Date(lastSync) : new Date(),
      status,
    });

    return NextResponse.json(newIntegration, { status: 200, statusText: 'OK' });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500, statusText: 'INTERNAL SERVER ERROR' });
  }
}
