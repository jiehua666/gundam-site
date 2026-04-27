import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/users/[id] - 获取用户公开资料
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        role: true,
        level: true,
        totalXp: true,
        createdAt: true,
        userStats: {
          select: {
            checkinDays: true,
            consecutiveDays: true,
            bestConsecutiveDays: true,
            creationCount: true,
            commentCount: true,
            likedCount: true,
            followerCount: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get follower and following counts
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: id } }),
      prisma.follow.count({ where: { followerId: id } }),
    ]);

    // Get user's creations count
    const creationsCount = await prisma.creation.count({
      where: { authorId: id, isDeleted: false },
    });

    return NextResponse.json({
      user: {
        ...user,
        followerCount,
        followingCount,
        creationsCount,
      },
    });
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/users/[id] - 更新用户资料（需要登录且只能更新自己的）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Can only update own profile
    if (currentUser.userId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { nickname, avatar } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(nickname && { nickname }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        role: true,
        level: true,
      },
    });

    return NextResponse.json({ user, message: 'Profile updated' });
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
