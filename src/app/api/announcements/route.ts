import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { status: 'published' },
      orderBy: [
        { isTop: 'desc' },
        { publishedAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        content: true,
        isTop: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('GET /api/announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
