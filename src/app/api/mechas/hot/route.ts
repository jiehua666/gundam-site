import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const hotMecha = await prisma.mecha.findMany({
      where: {
        isDeleted: false,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        name: true,
        series: true,
        grade: true,
        classification: true,
        coverImage: true,
        summary: true,
      },
    });

    return NextResponse.json({ mechas: hotMecha });
  } catch (error) {
    console.error('GET /api/mechas/hot error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
