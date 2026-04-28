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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action || !['resolve', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const newStatus = action === 'resolve' ? 'resolved' : 'dismissed';

    await prisma.report.update({
      where: { id },
      data: {
        status: newStatus,
        handlerId: user.userId,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('PUT /api/admin/reports/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
