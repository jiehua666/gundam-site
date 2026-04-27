import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    const creation = await prisma.creation.findUnique({
      where: { id, isDeleted: false },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            level: true,
          },
        },
        mecha: {
          select: {
            id: true,
            name: true,
            series: true,
            grade: true,
            coverImage: true,
          },
        },
      },
    });

    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    // 数据库去重：同一用户 24 小时内多次访问只计 1 次
    if (currentUser) {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // 查询是否在 24 小时内有浏览记录
        const existingView = await prisma.viewHistory.findUnique({
          where: {
            userId_targetType_targetId: {
              userId: currentUser.userId,
              targetType: 'creation',
              targetId: id,
            },
          },
        });

        if (existingView && existingView.viewedAt > twentyFourHoursAgo) {
          // 24 小时内已访问过，不计数
          return NextResponse.json({ creation, viewed: false });
        }

        // 创建或更新浏览记录
        await prisma.viewHistory.upsert({
          where: {
            userId_targetType_targetId: {
              userId: currentUser.userId,
              targetType: 'creation',
              targetId: id,
            },
          },
          update: {
            viewedAt: new Date(),
          },
          create: {
            userId: currentUser.userId,
            targetType: 'creation',
            targetId: id,
          },
        });

        // 计数
        await prisma.creation.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        });
      } catch (viewError) {
        console.error('View tracking error:', viewError);
        // 浏览记录失败不影响主流程
      }
    }

    return NextResponse.json({ creation, viewed: true });
  } catch (error) {
    console.error('GET /api/creations/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}