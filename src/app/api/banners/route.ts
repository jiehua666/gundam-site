import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        imageUrl: true,
        link: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('GET /api/banners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
