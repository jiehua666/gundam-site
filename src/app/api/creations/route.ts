import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const mechaId = searchParams.get('mechaId');
    const authorId = searchParams.get('authorId');

    const where: { isDeleted: boolean; status: string; relatedMechaId?: string; authorId?: string } = {
      isDeleted: false,
      status: 'active',
    };

    if (mechaId) {
      where.relatedMechaId = mechaId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    const [creations, total] = await Promise.all([
      prisma.creation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          authorId: true,
          likeCount: true,
          viewCount: true,
          collectCount: true,
          createdAt: true,
          images: {
            where: { type: 'cover' },
            take: 1,
            select: { url: true },
          },
          author: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.creation.count({ where }),
    ]);

    return NextResponse.json({
      creations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/creations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, relatedMechaId, tags, copyrightType, imageUrls } = body;

    // Get current user from token
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/auth');
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const creation = await prisma.creation.create({
      data: {
        authorId: payload.userId,
        title,
        content: content || '',
        relatedMechaId: relatedMechaId || null,
        tags: tags || '',
        copyrightType: copyrightType || 'original',
        status: 'pending',
      },
    });

    // Create images if provided
    if (imageUrls && imageUrls.length > 0) {
      await prisma.creationImage.createMany({
        data: imageUrls.map((url: string, index: number) => ({
          creationId: creation.id,
          type: index === 0 ? 'cover' : 'image',
          url,
        })),
      });
    }

    return NextResponse.json({ creation }, { status: 201 });
  } catch (error) {
    console.error('POST /api/creations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}