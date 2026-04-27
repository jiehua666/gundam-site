import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if user is banned
    if (user.status === 'banned') {
      if (user.banExpireAt && new Date(user.banExpireAt) < new Date()) {
        // Ban expired, but we'd need to reactivate the user
      } else {
        return NextResponse.json(
          { error: 'Account is banned', banReason: user.banReason },
          { status: 403 }
        );
      }
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate token and set cookie
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          role: user.role,
          level: user.level,
          avatar: user.avatar,
        },
        message: 'Login successful',
      },
      { status: 200 }
    );

    response.cookies.set(setAuthCookie(token));
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
