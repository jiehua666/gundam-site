import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      userCount,
      mechaCount,
      creationCount,
      commentCount,
      reportPendingCount,
      recentCreations,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.mecha.count({ where: { isDeleted: false } }),
      prisma.creation.count({ where: { isDeleted: false } }),
      prisma.comment.count({ where: { isDeleted: false } }),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.creation.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          author: { select: { id: true, nickname: true, username: true } },
        },
      }),
      prisma.user.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          nickname: true,
          username: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        userCount,
        mechaCount,
        creationCount,
        commentCount,
        reportPendingCount,
      },
      recentCreations,
      recentUsers,
    });
  } catch (error) {
    console.error('GET /api/admin/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
