import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/messages/conversations - Get all conversations for current user
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all unique conversations (grouped by other user)
    const messages = await prisma.message.findMany({
      where: {
        isDeleted: false,
        OR: [
          { fromUserId: currentUser.userId },
          { toUserId: currentUser.userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by the "other" user in the conversation
    const conversationMap = new Map<string, {
      userId: string;
      lastMessage: typeof messages[0] | null;
      unreadCount: number;
      updatedAt: Date | null;
    }>();

    for (const msg of messages) {
      const otherUserId = msg.fromUserId === currentUser.userId
        ? msg.toUserId
        : msg.fromUserId;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: null,
          unreadCount: 0,
          updatedAt: null,
        });
      }

      const conv = conversationMap.get(otherUserId)!;
      // Update last message if this message is newer
      if (!conv.lastMessage || msg.createdAt > conv.lastMessage.createdAt) {
        conv.lastMessage = msg;
        conv.updatedAt = msg.createdAt;
      }
      // Count unread messages
      if (msg.fromUserId === otherUserId && msg.toUserId === currentUser.userId && !msg.isRead) {
        conv.unreadCount++;
      }
    }

    // Get user info for each conversation
    const conversations = await Promise.all(
      Array.from(conversationMap.values()).map(async (conv) => {
        const user = await prisma.user.findUnique({
          where: { id: conv.userId },
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            level: true,
          },
        });
        return {
          user,
          lastMessage: conv.lastMessage ? {
            id: conv.lastMessage.id,
            content: conv.lastMessage.content,
            fromUserId: conv.lastMessage.fromUserId,
            createdAt: conv.lastMessage.createdAt,
          } : null,
          unreadCount: conv.unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

    // Sort by last message time (most recent first)
    conversations.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('GET /api/messages/conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
