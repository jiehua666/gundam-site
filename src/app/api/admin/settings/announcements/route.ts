import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const items = await prisma.announcement.findMany({
      orderBy: [
        { isTop: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/admin/settings/announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, isTop } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        isTop: isTop || false,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/settings/announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
