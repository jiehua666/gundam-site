import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/cards/reissue - 获取用户拥有的补签卡数量
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { checkinCards: true },
    });

    return NextResponse.json({
      checkinCards: user?.checkinCards || 0,
    });
  } catch (error) {
    console.error('GET /api/cards/reissue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
