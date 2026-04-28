import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/messages/:id/read - Mark message as read
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

    // Can only mark messages sent to you as read
    if (message.toUserId !== currentUser.userId) {
      return NextResponse.json({ error: 'Cannot mark this message as read' }, { status: 403 });
    }

    await prisma.message.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/messages/:id/read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
