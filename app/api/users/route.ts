import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import * as bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

type UserPayload = {
  name: string;
  email: string;
  password: string;
};

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const { name, email, password }: UserPayload = await req.json();

    // HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // CHECK UNIQUE EMAIL
    const user = await User.exists({ email });
    if (user)
      return NextResponse.json(
        {
          error: 'User Already Exists',
        },
        {
          status: 400,
          statusText: 'BAD REQUEST',
        },
      );

    // ADD TO DATABASE
    const newUser = await User.create({
      email,
      name,
      password: hash,
    });

    return NextResponse.json(newUser, { status: 200, statusText: 'OK' });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500, statusText: 'INTERNAL SERVER ERROR' });
  }
}
