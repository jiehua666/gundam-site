import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/follows/followers?userId=xxx - Get user's followers list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const currentUser = await getCurrentUser();

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

    // If current user is logged in, check if they follow each follower
    let users = followers.map((f) => f.follower);
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
    console.error('GET /api/follows/followers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
