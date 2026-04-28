import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/messages/:id/recall - Recall a message within 2 minutes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Can only recall your own messages
    if (message.fromUserId !== currentUser.userId) {
      return NextResponse.json({ error: 'Cannot recall this message' }, { status: 403 });
    }

    // Check if within 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (message.createdAt < twoMinutesAgo) {
      return NextResponse.json({ error: 'Cannot recall message after 2 minutes' }, { status: 400 });
    }

    // Soft delete the message
    await prisma.message.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/messages/:id/recall error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
