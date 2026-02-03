import { syncGitHubData } from '@/lib/github/sync';
import connectDB from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    await syncGitHubData(process.env.USER_ID as string, process.env.GITHUB_SECRET as string);

    return NextResponse.json('Successfully get github data', { status: 200, statusText: 'OK' });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500, statusText: 'INTERNAL SERVER ERROR' });
  }
}
