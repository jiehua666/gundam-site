import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/cards - 获取所有卡牌
export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      orderBy: [
        { rarity: 'asc' },
        { name: 'asc' }
      ],
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('GET /api/cards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
