import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/user-cards - 获取用户卡牌收藏
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userCards = await prisma.userCard.findMany({
      where: { userId: currentUser.userId },
      include: {
        card: true,
      },
      orderBy: { obtainedAt: 'desc' },
    });

    // 计算统计信息
    const totalCards = userCards.length;
    const totalCount = userCards.reduce((sum, uc) => sum + uc.count, 0);

    // 按稀有度分组
    const byRarity = {
      common: userCards.filter(uc => uc.card.rarity === 'common').length,
      rare: userCards.filter(uc => uc.card.rarity === 'rare').length,
      epic: userCards.filter(uc => uc.card.rarity === 'epic').length,
      legendary: userCards.filter(uc => uc.card.rarity === 'legendary').length,
    };

    return NextResponse.json({
      userCards,
      stats: {
        totalCards,
        totalCount,
        byRarity,
      },
    });
  } catch (error) {
    console.error('GET /api/user-cards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user-cards - 添加卡牌到收藏
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cardId, count = 1 } = body;

    if (!cardId) {
      return NextResponse.json({ error: 'Missing cardId' }, { status: 400 });
    }

    // 检查卡牌是否存在
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // 添加或更新用户卡牌
    const userCard = await prisma.userCard.upsert({
      where: {
        userId_cardId: {
          userId: currentUser.userId,
          cardId,
        },
      },
      update: {
        count: { increment: count },
      },
      create: {
        userId: currentUser.userId,
        cardId,
        count,
      },
      include: {
        card: true,
      },
    });

    return NextResponse.json({
      success: true,
      userCard,
    });
  } catch (error) {
    console.error('POST /api/user-cards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
