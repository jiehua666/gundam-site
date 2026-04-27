import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const missions = await prisma.mission.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ missions });
  } catch (error) {
    console.error('GET /api/missions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}