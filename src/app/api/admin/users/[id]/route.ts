import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role, isBanned } = body;

    // Prevent self-modification
    if (id === user.userId) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof role === 'string') {
      if (!['user', 'creator', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updateData.role = role;
    }
    if (typeof isBanned === 'boolean') {
      updateData.status = isBanned ? 'banned' : 'active';
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/admin/users/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
