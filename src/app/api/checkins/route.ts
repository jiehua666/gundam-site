import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 计算连续签到奖励 XP
function calculateCheckinXp(consecutiveDays: number): number {
  // 公式: 5 + min(consecutiveDays - 1, 25) * 2
  // 第1天: 5 XP
  // 第2天: 7 XP
  // 第3天: 9 XP
  // ...
  // 第13天+: 29 XP (封顶)
  return 5 + Math.min(Math.max(0, consecutiveDays - 1), 25) * 2;
}

// GET /api/checkins - 获取签到状态和历史
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // 获取用户签到统计
    let userStats = await prisma.userStats.findUnique({
      where: { userId: currentUser.userId },
    });

    // 如果没有统计记录，创建一个
    if (!userStats) {
      userStats = await prisma.userStats.create({
        data: { userId: currentUser.userId },
      });
    }

    // 获取本月签到记录
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const checkins = await prisma.checkin.findMany({
      where: {
        userId: currentUser.userId,
        checkinDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { checkinDate: 'asc' },
    });

    // 检查今天是否已签到（使用 UTC）
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const checkedInToday = checkins.some(c => {
      const checkinDate = new Date(c.checkinDate);
      checkinDate.setUTCHours(0, 0, 0, 0);
      return checkinDate.getTime() === today.getTime();
    });

    // 获取用户补签卡数量
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { checkinCards: true },
    });

    return NextResponse.json({
      checkedInToday,
      checkinDates: checkins.map(c => {
        const d = new Date(c.checkinDate);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      }),
      stats: {
        consecutiveDays: userStats.consecutiveDays,
        totalDays: userStats.checkinDays,
        bestConsecutiveDays: userStats.bestConsecutiveDays,
      },
      checkinCards: user?.checkinCards || 0,
      xpToday: checkedInToday ? calculateCheckinXp(userStats.consecutiveDays) : 0,
    });
  } catch (error) {
    console.error('GET /api/checkins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/checkins - 签到
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { useCard = false, date: targetDateStr } = body; // 是否使用补签卡补签

    // 确定签到日期（使用 UTC 避免时区问题）
    const checkinDate = targetDateStr ? new Date(targetDateStr + 'T00:00:00Z') : new Date();
    checkinDate.setUTCHours(0, 0, 0, 0);

    // 只能补签过去的日期，不能补签今天或未来
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const isBackfill = targetDateStr && checkinDate < today;

    // 检查今天是否已签到
    const existingCheckin = await prisma.checkin.findUnique({
      where: {
        userId_checkinDate: {
          userId: currentUser.userId,
          checkinDate: checkinDate,
        },
      },
    });

    if (existingCheckin && !useCard) {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 400 });
    }

    // 使用补签卡时必须提供目标日期
    if (useCard && isBackfill && existingCheckin) {
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

    // 计算连续签到天数（基于补签日期计算，使用 UTC）
    const yesterday = new Date(checkinDate);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const yesterdayCheckin = await prisma.checkin.findUnique({
      where: {
        userId_checkinDate: {
          userId: currentUser.userId,
          checkinDate: yesterday,
        },
      },
    });

    // 如果昨天没签到，且没有使用补签卡，连续天数重置
    let newConsecutiveDays = 1;
    if (yesterdayCheckin || useCard) {
      newConsecutiveDays = userStats.consecutiveDays + 1;
    }

    // 计算 XP 奖励
    const xpEarned = calculateCheckinXp(newConsecutiveDays);

    // 创建签到记录
    let checkin;
    if (existingCheckin) {
      checkin = existingCheckin;
    } else {
      checkin = await prisma.checkin.create({
        data: {
          userId: currentUser.userId,
          checkinDate: checkinDate,
          xpEarned,
        },
      });
    }

    // 更新用户统计
    const updatedStats = await prisma.userStats.update({
      where: { userId: currentUser.userId },
      data: {
        consecutiveDays: newConsecutiveDays,
        checkinDays: { increment: existingCheckin ? 0 : 1 },
        bestConsecutiveDays: newConsecutiveDays > userStats.bestConsecutiveDays
          ? newConsecutiveDays
          : userStats.bestConsecutiveDays,
        totalXp: { increment: existingCheckin ? 0 : xpEarned },
      },
    });

    // 如果使用了补签卡，扣除
    if (useCard) {
      await prisma.user.update({
        where: { id: currentUser.userId },
        data: { checkinCards: { decrement: 1 } },
      });
    }

    // 检查是否需要更新用户等级
    const level = await calculateLevel(updatedStats.totalXp);
    if (level > userStats.level) {
      await prisma.userStats.update({
        where: { userId: currentUser.userId },
        data: { level },
      });
      await prisma.user.update({
        where: { id: currentUser.userId },
        data: { level },
      });
    }

    return NextResponse.json({
      success: true,
      checkin: {
        date: `${checkinDate.getUTCFullYear()}-${String(checkinDate.getUTCMonth() + 1).padStart(2, '0')}-${String(checkinDate.getUTCDate()).padStart(2, '0')}`,
        xpEarned,
        consecutiveDays: newConsecutiveDays,
        totalDays: updatedStats.checkinDays,
        usedCard: useCard,
      },
    });
  } catch (error) {
    console.error('POST /api/checkins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 根据 XP 计算等级
async function calculateLevel(totalXp: number): Promise<number> {
  // 查询等级表
  const levels = await prisma.level.findMany({
    orderBy: { level: 'desc' },
  });

  for (const lvl of levels) {
    if (totalXp >= lvl.xpRequired) {
      return lvl.level;
    }
  }

  return 1; // 默认1级
}

// DELETE /api/checkins - 删除签到记录（仅管理员）
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查是否是管理员或创始人
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { role: true },
    });

    if (user?.role !== 'admin' && user?.role !== 'founder') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 删除该用户的签到记录
    await prisma.checkin.deleteMany({
      where: { userId },
    });

    // 重置该用户的签到统计
    await prisma.userStats.update({
      where: { userId },
      data: {
        consecutiveDays: 0,
        checkinDays: 0,
        bestConsecutiveDays: 0,
        totalXp: 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/checkins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
