import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/messages - Get conversation list
// GET /api/messages?withUserId=xxx - Get messages with specific user
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get('withUserId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get conversation with specific user
    if (withUserId) {
      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: {
            isDeleted: false,
            OR: [
              { fromUserId: currentUser.userId, toUserId: withUserId },
              { fromUserId: withUserId, toUserId: currentUser.userId },
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
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.message.count({
          where: {
            isDeleted: false,
            OR: [
              { fromUserId: currentUser.userId, toUserId: withUserId },
              { fromUserId: withUserId, toUserId: currentUser.userId },
            ],
          },
        }),
      ]);

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          fromUserId: withUserId,
          toUserId: currentUser.userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return NextResponse.json({
        messages: messages.reverse(), // Oldest first for chat view
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Get conversation list (latest message from each conversation)
    const conversations = await prisma.message.groupBy({
      by: ['fromUserId', 'toUserId'],
      where: {
        isDeleted: false,
        OR: [
          { fromUserId: currentUser.userId },
          { toUserId: currentUser.userId },
        ],
      },
      _count: true,
      _max: { createdAt: true },
    });

    // Get user info for each conversation
    const conversationList = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.fromUserId === currentUser.userId
          ? conv.toUserId
          : conv.fromUserId;

        const otherUser = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        });

        const lastMessage = await prisma.message.findFirst({
          where: {
            isDeleted: false,
            OR: [
              { fromUserId: conv.fromUserId, toUserId: conv.toUserId },
              { fromUserId: conv.toUserId, toUserId: conv.fromUserId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        // Count unread messages
        const unreadCount = await prisma.message.count({
          where: {
            fromUserId: otherUserId,
            toUserId: currentUser.userId,
            isRead: false,
            isDeleted: false,
          },
        });

        return {
          user: otherUser,
          lastMessage,
          unreadCount,
          updatedAt: conv._max.createdAt,
        };
      })
    );

    // Sort by last message time
    conversationList.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ conversations: conversationList });
  } catch (error) {
    console.error('GET /api/messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { toUserId, content } = body;

    if (!toUserId || !content) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Content too long (max 500 chars)' }, { status: 400 });
    }

    if (toUserId === currentUser.userId) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        fromUserId: currentUser.userId,
        toUserId,
        content: content.trim(),
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
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('POST /api/messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/messages - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fromUserId } = body;

    await prisma.message.updateMany({
      where: {
        fromUserId,
        toUserId: currentUser.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
