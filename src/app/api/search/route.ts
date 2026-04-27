import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (q.length < 2) {
      return NextResponse.json({ mechas: [], creations: [], users: [] });
    }

    const mechas = await prisma.mecha.findMany({
      where: {
        isDeleted: false,
        status: 'active',
        OR: [
          { name: { contains: q } },
          { series: { contains: q } },
          { summary: { contains: q } },
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        series: true,
        grade: true,
        coverImage: true,
      },
    });

    const creations = await prisma.creation.findMany({
      where: {
        isDeleted: false,
        status: 'active',
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      take: 10,
      select: {
        id: true,
        title: true,
        authorId: true,
        images: {
          where: { type: 'cover' },
          take: 1,
          select: { url: true },
        },
      },
    });

    const users = await prisma.user.findMany({
      where: {
        isDeleted: false,
        OR: [
          { username: { contains: q } },
          { nickname: { contains: q } },
        ],
      },
      take: 10,
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        role: true,
      },
    });

    return NextResponse.json({ mechas, creations, users });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
