import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendInteractionNotification } from '@/lib/notifications';

export async function GET(request: NextRequest) {
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

    const collect = await prisma.collect.findFirst({
      where: {
        userId: user.userId,
        targetType,
        targetId,
      },
    });

    return NextResponse.json({ collected: !!collect, collect });
  } catch (error) {
    console.error('GET /api/collects error:', error);
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

    // Check if already collected
    const existing = await prisma.collect.findFirst({
      where: {
        userId: user.userId,
        targetType,
        targetId,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already collected' }, { status: 400 });
    }

    // Create collect
    const collect = await prisma.collect.create({
      data: {
        userId: user.userId,
        targetType,
        targetId,
      },
    });

    // Increment collect count based on target type
    let targetAuthorId: string | null = null;
    let targetTitle: string | null = null;

    if (targetType === 'creation') {
      const creation = await prisma.creation.update({
        where: { id: targetId },
        data: { collectCount: { increment: 1 } },
      });
      targetAuthorId = creation.authorId;
      targetTitle = creation.title;
    }

    // Send notification to author
    if (targetAuthorId && targetAuthorId !== user.userId) {
      await sendInteractionNotification(
        'collect',
        targetAuthorId,
        user.userId,
        user.user.nickname || user.username,
        targetTitle || undefined
      );
    }

    return NextResponse.json({ collect }, { status: 201 });
  } catch (error) {
    console.error('POST /api/collects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    // Find existing collect
    const existing = await prisma.collect.findFirst({
      where: {
        userId: user.userId,
        targetType,
        targetId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not collected yet' }, { status: 400 });
    }

    // Delete collect
    await prisma.collect.delete({
      where: { id: existing.id },
    });

    // Decrement collect count
    if (targetType === 'creation') {
      await prisma.creation.update({
        where: { id: targetId },
        data: { collectCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/collects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
