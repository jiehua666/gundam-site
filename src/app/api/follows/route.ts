import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/follows?userId=xxx - Get user's following list
// GET /api/follows?check=targetId - Check if current user is following target
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const checkTargetId = searchParams.get('check');

    const currentUser = await getCurrentUser();

    // Check if current user is following a target
    if (checkTargetId && currentUser) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.userId,
            followingId: checkTargetId,
          },
        },
      });
      return NextResponse.json({ following: !!follow });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get following list for user
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If current user is logged in, check if they follow each user in the list
    let users = following.map((f) => f.following);
    if (currentUser) {
      const followings = await prisma.follow.findMany({
        where: {
          followerId: currentUser.userId,
          followingId: { in: users.map((u) => u.id) },
        },
      });
      const followingIds = new Set(followings.map((f) => f.followingId));
      users = users.map((u) => ({
        ...u,
        isFollowing: followingIds.has(u.id),
      }));
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /api/follows error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/follows - Follow a user
// Body: { targetUserId: string }
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
    }

    if (targetUserId === currentUser.userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.userId,
          followingId: targetUserId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already following' }, { status: 400 });
    }

    await prisma.follow.create({
      data: {
        followerId: currentUser.userId,
        followingId: targetUserId,
      },
    });

    // Update follower count for target user
    await prisma.userStats.upsert({
      where: { userId: targetUserId },
      update: { followerCount: { increment: 1 } },
      create: { userId: targetUserId, followerCount: 1 },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/follows error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/follows - Unfollow a user
// Body: { targetUserId: string }
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.userId,
          followingId: targetUserId,
        },
      },
    });

    if (!follow) {
      return NextResponse.json({ error: 'Not following' }, { status: 400 });
    }

    await prisma.follow.delete({
      where: { id: follow.id },
    });

    // Update follower count for target user
    await prisma.userStats.update({
      where: { userId: targetUserId },
      data: { followerCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/follows error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
