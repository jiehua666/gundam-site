import { prisma } from './prisma';

// Notification types
export type NotificationType =
  | 'system'       // 系统通知
  | 'like'         // 有人点赞了你的作品
  | 'comment'      // 有人评论了你的内容
  | 'collect'      // 有人收藏了你的作品
  | 'follow'       // 有人关注了你
  | 'level_up'     // 等级提升
  | 'achievement'  // 获得成就
  | 'audit_pass'   // 审核通过
  | 'audit_reject' // 审核拒绝
  | 'creator';     // 创作者通知

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  content?: string;
  data?: Record<string, any>;
}

/**
 * 创建通知
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, content, data } = params;

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        data: data ? JSON.stringify(data) : null,
      },
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * 发送互动通知（点赞、评论、收藏、关注）
 */
export async function sendInteractionNotification(
  type: 'like' | 'comment' | 'collect' | 'follow',
  targetUserId: string,
  actorUserId: string,
  actorNickname: string,
  targetTitle?: string
) {
  const titles: Record<string, string> = {
    like: `${actorNickname} 点赞了你的作品`,
    comment: `${actorNickname} 评论了你的内容`,
    collect: `${actorNickname} 收藏了你的作品`,
    follow: `${actorNickname} 关注了你`,
  };

  const contents: Record<string, string> = {
    like: targetTitle ? `你的作品"${targetTitle}"收到一个赞` : '你的作品收到一个赞',
    comment: targetTitle ? `你的作品"${targetTitle}"收到一条评论` : '你的内容收到一条评论',
    collect: targetTitle ? `你的作品"${targetTitle}"被收藏` : '你的作品被收藏',
    follow: actorNickname ? `${actorNickname}成为了你的粉丝` : '有人关注了你',
  };

  return createNotification({
    userId: targetUserId,
    type,
    title: titles[type],
    content: contents[type],
    data: {
      actorUserId,
      targetUserId,
      targetTitle,
    },
  });
}

/**
 * 发送等级/成就通知
 */
export async function sendAchievementNotification(
  type: 'level_up' | 'achievement',
  userId: string,
  levelOrAchievementName: string,
  description?: string
) {
  const titles: Record<string, string> = {
    level_up: `恭喜！你已升至 ${levelOrAchievementName}`,
    achievement: `恭喜！解锁成就"${levelOrAchievementName}"`,
  };

  return createNotification({
    userId,
    type,
    title: titles[type],
    content: description,
    data: {
      level: type === 'level_up' ? levelOrAchievementName : undefined,
      achievement: type === 'achievement' ? levelOrAchievementName : undefined,
    },
  });
}

/**
 * 发送审核结果通知
 */
export async function sendAuditNotification(
  type: 'audit_pass' | 'audit_reject',
  userId: string,
  contentTitle: string,
  reason?: string
) {
  const titles: Record<string, string> = {
    audit_pass: `恭喜！你的作品"${contentTitle}"审核通过`,
    audit_reject: `很遗憾！你的作品"${contentTitle}"审核未通过`,
  };

  const contents: Record<string, string> = {
    audit_pass: '感谢你的创作，期待更多精彩作品！',
    audit_reject: reason ? `原因：${reason}` : '请修改后重新提交',
  };

  return createNotification({
    userId,
    type,
    title: titles[type],
    content: contents[type],
    data: {
      contentTitle,
      reason,
    },
  });
}

/**
 * 获取用户未读通知数量
 */
export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}
