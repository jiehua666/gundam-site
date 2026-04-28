import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/cards/reissue/use - 使用补签卡补签
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { date: targetDateStr } = body as { date?: string };

    if (!targetDateStr) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0);

    // 检查目标日期是否是未来
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate >= today) {
      return NextResponse.json({ error: 'Cannot backfill today or future dates' }, { status: 400 });
    }

    // 检查用户是否有补签卡
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { checkinCards: true },
    });

    if (!user || user.checkinCards <= 0) {
      return NextResponse.json({ error: 'No reissue cards available' }, { status: 400 });
    }

    // 检查该日期是否已签到
    const existingCheckin = await prisma.checkin.findUnique({
      where: {
        userId_checkinDate: {
          userId: currentUser.userId,
          checkinDate: targetDate,
        },
      },
    });

    if (existingCheckin) {
      return NextResponse.json({ error: 'Already checked in on this date' }, { status: 400 });
    }

    // 获取用户统计
    let userStats = await prisma.userStats.findUnique({
      where: { userId: currentUser.userId },
    });

    if (!userStats) {
      userStats = await prisma.userStats.create({
        data: { userId: currentUser.userId },
      });
    }

    // 计算连续签到天数（基于补签日期计算）
    const yesterday = new Date(targetDate);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayCheckin = await prisma.checkin.findUnique({
      where: {
        userId_checkinDate: {
          userId: currentUser.userId,
          checkinDate: yesterday,
        },
      },
    });

    // 使用补签卡时，昨天需要已签到才能继续连续
    let newConsecutiveDays = 1;
    if (yesterdayCheckin) {
      newConsecutiveDays = userStats.consecutiveDays + 1;
    }

    // 计算 XP 奖励
    const xpEarned = 5 + Math.min(Math.max(0, newConsecutiveDays - 1), 25) * 2;

    // 创建签到记录
    const checkin = await prisma.checkin.create({
      data: {
        userId: currentUser.userId,
        checkinDate: targetDate,
        xpEarned,
      },
    });

    // 扣除补签卡
    await prisma.user.update({
      where: { id: currentUser.userId },
      data: { checkinCards: { decrement: 1 } },
    });

    // 更新用户统计
    const updatedStats = await prisma.userStats.update({
      where: { userId: currentUser.userId },
      data: {
        consecutiveDays: newConsecutiveDays,
        checkinDays: { increment: 1 },
        bestConsecutiveDays: newConsecutiveDays > userStats.bestConsecutiveDays
          ? newConsecutiveDays
          : userStats.bestConsecutiveDays,
        totalXp: { increment: xpEarned },
      },
    });

    // 检查是否需要更新用户等级
    const levels = await prisma.level.findMany({
      orderBy: { level: 'desc' },
    });

    let newLevel = userStats.level;
    for (const lvl of levels) {
      if (updatedStats.totalXp >= lvl.xpRequired) {
        newLevel = lvl.level;
        break;
      }
    }

    if (newLevel > userStats.level) {
      await prisma.userStats.update({
        where: { userId: currentUser.userId },
        data: { level: newLevel },
      });
      await prisma.user.update({
        where: { id: currentUser.userId },
        data: { level: newLevel },
      });
    }

    return NextResponse.json({
      success: true,
      checkin: {
        date: targetDate.toISOString().split('T')[0],
        xpEarned,
        consecutiveDays: newConsecutiveDays,
        totalDays: updatedStats.checkinDays,
        usedCard: true,
      },
      remainingCards: (user.checkinCards || 0) - 1,
    });
  } catch (error) {
    console.error('POST /api/cards/reissue/use error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
