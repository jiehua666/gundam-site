import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    const where: Record<string, unknown> = { isDeleted: false };
    if (filter !== 'all') {
      where.role = filter;
    }

    const items = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        userStats: {
          select: {
            creationCount: true,
            commentCount: true,
          },
        },
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
