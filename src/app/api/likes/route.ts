import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendInteractionNotification } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType'); // 'creation' | 'mecha' | 'comment'
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const like = await prisma.like.findFirst({
      where: {
        userId: user.userId,
        targetType,
        targetId,
      },
    });

    return NextResponse.json({ liked: !!like, like });
  } catch (error) {
    console.error('GET /api/likes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType, targetId } = body;

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already liked
    const existing = await prisma.like.findFirst({
      where: {
        userId: user.userId,
        targetType,
        targetId,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 });
    }

    // Create like
    const like = await prisma.like.create({
      data: {
        userId: user.userId,
        targetType,
        targetId,
      },
    });

    // Increment like count based on target type
    let targetAuthorId: string | null = null;
    let targetTitle: string | null = null;

    if (targetType === 'creation') {
      const creation = await prisma.creation.update({
        where: { id: targetId },
        data: { likeCount: { increment: 1 } },
      });
      targetAuthorId = creation.authorId;
      targetTitle = creation.title;
    } else if (targetType === 'mecha') {
      const mecha = await prisma.mecha.update({
        where: { id: targetId },
        data: { likeCount: { increment: 1 } },
      });
      targetTitle = mecha.name;
    }

    // Send notification to author
    if (targetAuthorId && targetAuthorId !== user.userId) {
      await sendInteractionNotification(
        'like',
        targetAuthorId,
        user.userId,
        user.user.nickname || user.username,
        targetTitle || undefined
      );
    }

    return NextResponse.json({ like }, { status: 201 });
  } catch (error) {
    console.error('POST /api/likes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find existing like
    const existing = await prisma.like.findFirst({
      where: {
        userId: user.userId,
        targetType,
        targetId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not liked yet' }, { status: 400 });
    }

    // Delete like
    await prisma.like.delete({
      where: { id: existing.id },
    });

    // Decrement like count
    if (targetType === 'creation') {
      await prisma.creation.update({
        where: { id: targetId },
        data: { likeCount: { decrement: 1 } },
      });
    } else if (targetType === 'mecha') {
      await prisma.mecha.update({
        where: { id: targetId },
        data: { likeCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/likes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
