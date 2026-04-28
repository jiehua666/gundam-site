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
    const status = searchParams.get('status') || 'pending';

    const where: Record<string, unknown> = {};
    if (status !== 'all') {
      where.status = status;
    }

    const items = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        reporter: { select: { id: true, nickname: true, username: true } },
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
