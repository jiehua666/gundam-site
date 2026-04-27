import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/follows?type=followers&userId=xxx
// GET /api/follows?type=following&userId=xxx
// GET /api/follows?check=targetId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
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

    if (type === 'followers') {
      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
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
      return NextResponse.json({
        users: followers.map((f) => f.follower),
      });
    }

    if (type === 'following') {
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
      return NextResponse.json({
        users: following.map((f) => f.following),
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('GET /api/follows error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/follows - Follow a user
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetId } = body;

    if (!targetId) {
      return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
    }

    if (targetId === currentUser.userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.userId,
          followingId: targetId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already following' }, { status: 400 });
    }

    await prisma.follow.create({
      data: {
        followerId: currentUser.userId,
        followingId: targetId,
      },
    });

    // Update follower count for target user
    await prisma.userStats.upsert({
      where: { userId: targetId },
      update: { followerCount: { increment: 1 } },
      create: { userId: targetId, followerCount: 1 },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/follows error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/follows?targetId=xxx - Unfollow a user
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');

    if (!targetId) {
      return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.userId,
          followingId: targetId,
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
      where: { userId: targetId },
      data: { followerCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/follows error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
