import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/auth';

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
// PUT /api/creations/[id] - 更新作品
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 检查作品是否存在
    const creation = await prisma.creation.findUnique({
      where: { id, isDeleted: false },
    });

    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    // 检查权限：只有作者或管理员可以编辑
    if (creation.authorId !== currentUser.userId && !isAdmin(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      title,
      content,
      relatedMechaId,
      tags,
      copyrightType,
      imageUrls,
    } = body;

    // 更新作品
    const updated = await prisma.creation.update({
      where: { id },
      data: {
        title: title || creation.title,
        content: content !== undefined ? content : creation.content,
        relatedMechaId: relatedMechaId !== undefined ? relatedMechaId : creation.relatedMechaId,
        tags: tags !== undefined ? tags : creation.tags,
        copyrightType: copyrightType || creation.copyrightType,
      },
    });

    // 如果提供了新图片，替换图片
    if (imageUrls && Array.isArray(imageUrls)) {
      // 删除旧图片
      await prisma.creationImage.deleteMany({
        where: { creationId: id },
      });

      // 创建新图片
      if (imageUrls.length > 0) {
        await prisma.creationImage.createMany({
          data: imageUrls.map((url: string, index: number) => ({
            creationId: id,
            url,
            type: 'image',
            sortOrder: index,
          })),
        });
      }
    }

    return NextResponse.json({ success: true, creation: updated });
  } catch (error) {
    console.error('PUT /api/creations/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/creations/[id] - 删除作品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 检查作品是否存在
    const creation = await prisma.creation.findUnique({
      where: { id, isDeleted: false },
    });

    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    // 检查权限：只有作者或管理员可以删除
    if (creation.authorId !== currentUser.userId && !isAdmin(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 软删除
    await prisma.creation.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/creations/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
