import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendInteractionNotification } from '@/lib/notifications';

// GET /api/comments?targetType=creation&targetId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get all comments for this target (for building tree)
    const allComments = await prisma.comment.findMany({
      where: {
        targetType,
        targetId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const total = allComments.length;

    // Build nested comment tree
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create comment objects with empty children
    allComments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree structure
    allComments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id);
      if (comment.parentId && commentMap.has(comment.parentId)) {
        commentMap.get(comment.parentId).replies.push(commentWithReplies);
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    // Sort root comments by createdAt desc, replies by createdAt asc
    rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    rootComments.forEach((comment) => {
      comment.replies.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

    // Paginate root comments
    const paginatedRootComments = rootComments.slice(skip, skip + limit);

    return NextResponse.json({
      comments: paginatedRootComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetType, targetId, content, parentId } = body;

    if (!targetType || !targetId || !content) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Content too long (max 1000 chars)' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        userId: user.userId,
        targetType,
        targetId,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            level: true,
          },
        },
      },
    });

    // Update user stats
    await prisma.userStats.upsert({
      where: { userId: user.userId },
      update: { commentCount: { increment: 1 } },
      create: {
        userId: user.userId,
        commentCount: 1,
      },
    });

    // Get target author and send notification
    let targetAuthorId: string | null = null;
    let targetTitle: string | null = null;

    if (targetType === 'creation') {
      const creation = await prisma.creation.findUnique({
        where: { id: targetId },
        select: { authorId: true, title: true },
      });
      targetAuthorId = creation?.authorId || null;
      targetTitle = creation?.title || null;
    }

    if (targetAuthorId && targetAuthorId !== user.userId) {
      await sendInteractionNotification(
        'comment',
        targetAuthorId,
        user.userId,
        user.user.nickname || user.username,
        targetTitle || undefined
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/comments?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing comment ID' }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check ownership or admin role
    if (comment.userId !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    await prisma.comment.update({
      where: { id },
      data: { isDeleted: true },
    });

    // Decrement comment count if creation
    if (comment.targetType === 'creation') {
      await prisma.creation.update({
        where: { id: comment.targetId },
        data: { commentCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
