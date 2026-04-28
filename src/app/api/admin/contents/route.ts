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
    const type = searchParams.get('type') || 'creations';
    const status = searchParams.get('status') || 'all';

    const where: Record<string, unknown> = { isDeleted: false };

    if (status !== 'all') {
      where.status = status;
    }

    if (type === 'creations') {
      const items = await prisma.creation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          author: { select: { id: true, nickname: true, username: true } },
        },
      });
      return NextResponse.json({ items });
    } else {
      const items = await prisma.mecha.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
      });
      return NextResponse.json({ items });
    }
  } catch (error) {
    console.error('GET /api/admin/contents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
