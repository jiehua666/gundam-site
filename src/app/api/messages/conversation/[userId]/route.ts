import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/messages/conversation/:userId - Get conversation with specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          isDeleted: false,
          OR: [
            { fromUserId: currentUser.userId, toUserId: userId },
            { fromUserId: userId, toUserId: currentUser.userId },
          ],
        },
        include: {
          fromUser: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
            },
          },
          toUser: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: {
          isDeleted: false,
          OR: [
            { fromUserId: currentUser.userId, toUserId: userId },
            { fromUserId: userId, toUserId: currentUser.userId },
          ],
        },
      }),
    ]);

    // Mark messages sent to current user as read
    await prisma.message.updateMany({
      where: {
        fromUserId: userId,
        toUserId: currentUser.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    // Get the other user's info
    const otherUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        level: true,
      },
    });

    return NextResponse.json({
      messages,
      otherUser,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/messages/conversation/:userId error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
