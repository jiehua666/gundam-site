import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [mechaCount, userCount, creationCount, seriesCount] = await Promise.all([
      prisma.mecha.count({ where: { isDeleted: false, status: 'active' } }),
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.creation.count({ where: { isDeleted: false, status: 'active' } }),
      prisma.mecha.groupBy({
        by: ['series'],
        where: { isDeleted: false, status: 'active' },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      stats: {
        mechaCount,
        userCount,
        creationCount,
        seriesCount: seriesCount.length,
      }
    });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
