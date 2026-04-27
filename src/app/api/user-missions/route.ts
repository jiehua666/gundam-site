import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/user-missions - 获取用户今日任务进度
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 获取今日任务
    const missions = await prisma.mission.findMany({
      where: {
        isActive: true,
      },
      orderBy: { type: 'asc' },
    });

    // 获取用户今日任务进度
    const userMissions = await prisma.userMission.findMany({
      where: {
        userId: currentUser.userId,
        date: today,
      },
    });

    // 合并数据
    const missionsWithProgress = missions.map((mission) => {
      const userMission = userMissions.find((um) => um.missionId === mission.id);
      return {
        id: mission.id,
        name: mission.name,
        description: mission.description,
        type: mission.type,
        xpReward: mission.xpReward,
        progress: userMission?.progress || 0,
        completed: userMission?.completed || false,
        completedAt: userMission?.completedAt,
      };
    });

    // 按类型分组
    const dailyMissions = missionsWithProgress.filter((m) => m.type === 'daily');
    const weeklyMissions = missionsWithProgress.filter((m) => m.type === 'weekly');
    const achievements = missionsWithProgress.filter((m) => m.type === 'achievement');

    return NextResponse.json({
      dailyMissions,
      weeklyMissions,
      achievements,
      date: today.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('GET /api/user-missions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user-missions - 更新任务进度
// Body: { missionId: string, progress: number }
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { missionId, progress } = body;

    if (!missionId) {
      return NextResponse.json({ error: 'Missing missionId' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 获取任务
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // 检查是否已完成
    const existing = await prisma.userMission.findUnique({
      where: {
        userId_missionId_date: {
          userId: currentUser.userId,
          missionId,
          date: today,
        },
      },
    });

    if (existing?.completed) {
      return NextResponse.json({ error: 'Mission already completed' }, { status: 400 });
    }

    // 更新进度
    const newProgress = progress !== undefined ? progress : (existing?.progress || 0) + 1;
    const isCompleted = newProgress >= 1; // 简化：进度 >= 1 即完成

    const userMission = await prisma.userMission.upsert({
      where: {
        userId_missionId_date: {
          userId: currentUser.userId,
          missionId,
          date: today,
        },
      },
      update: {
        progress: newProgress,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      create: {
        userId: currentUser.userId,
        missionId,
        progress: newProgress,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
        date: today,
      },
    });

    // 如果任务完成且是每日签到任务，触发签到
    if (isCompleted && mission.type === 'daily') {
      // 这里可以添加额外的奖励逻辑
    }

    return NextResponse.json({
      success: true,
      userMission,
      xpEarned: isCompleted && !existing?.completed ? mission.xpReward : 0,
    });
  } catch (error) {
    console.error('POST /api/user-missions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
