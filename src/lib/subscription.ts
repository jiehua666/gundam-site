import { prisma } from './prisma';
import { getCurrentUser } from './auth';

// 订阅档位定义
export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: '免费档',
    price: 0,
    period: '永久',
    features: [
      '看简化版页面',
      '基础互动',
    ],
  },
  basic: {
    id: 'basic',
    name: '基础档',
    price: 9,
    period: '1个月',
    features: [
      '看完整页面',
      '每月5张图',
      '简单收藏',
    ],
  },
  standard: {
    id: 'standard',
    name: '标准档',
    price: 19,
    period: '1个月',
    features: [
      '无限上传',
      '3个3D模型',
      '高级收藏',
    ],
  },
} as const;

export type TierType = keyof typeof SUBSCRIPTION_TIERS;

/**
 * 获取用户当前订阅状态
 */
export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      expireAt: { gt: new Date() },
    },
    orderBy: { expireAt: 'desc' },
  });

  return subscription;
}

/**
 * 检查用户订阅状态（带用户信息）
 */
export async function checkUserSubscription() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { user: null, subscription: null, tier: 'free' as const };
  }

  const subscription = await getUserSubscription(currentUser.userId);
  const tier = (subscription?.tier || 'free') as TierType;

  return {
    user: currentUser,
    subscription,
    tier,
  };
}

/**
 * 检查是否能上传作品
 */
export async function canUploadCreation(): Promise<{
  allowed: boolean;
  reason?: string;
  tier?: TierType;
}> {
  const { subscription, tier } = await checkUserSubscription();

  // 免费档不允许上传
  if (tier === 'free') {
    return { allowed: false, reason: '请升级到基础档或标准档以上传作品' };
  }

  // 检查订阅是否有效
  if (subscription && subscription.status === 'active' && subscription.expireAt > new Date()) {
    return { allowed: true, tier };
  }

  // 订阅已过期
  if (subscription && subscription.expireAt <= new Date()) {
    return { allowed: false, reason: '订阅已过期，请续费', tier };
  }

  return { allowed: true, tier };
}

/**
 * 检查是否能使用高级功能
 */
export async function canUseAdvancedFeature(feature: '3d_model' | 'unlimited_upload' | 'advanced_collect'): Promise<{
  allowed: boolean;
  reason?: string;
  tier?: TierType;
}> {
  const { subscription, tier } = await checkUserSubscription();

  // 免费档和基础档不能使用高级功能
  if (tier === 'free' || tier === 'basic') {
    const featureNames = {
      '3d_model': '3D模型',
      'unlimited_upload': '无限上传',
      'advanced_collect': '高级收藏',
    };
    return {
      allowed: false,
      reason: `此功能需要${feature === '3d_model' ? '标准档' : '标准档'}才能使用`,
    };
  }

  // 标准档检查具体功能
  if (tier === 'standard') {
    if (feature === '3d_model' || feature === 'unlimited_upload' || feature === 'advanced_collect') {
      return { allowed: true, tier };
    }
  }

  // 检查订阅是否有效
  if (subscription && subscription.status === 'active' && subscription.expireAt > new Date()) {
    return { allowed: true, tier };
  }

  return { allowed: false, reason: '订阅已过期', tier };
}

/**
 * 创建或更新订阅
 */
export async function createSubscription(
  userId: string,
  tier: TierType,
  orderId?: string
) {
  const now = new Date();
  let expireAt: Date;

  if (tier === 'free') {
    // 免费档永不过期（实际上是1970年）
    expireAt = new Date('1970-01-01');
  } else {
    // 其他档位从现在开始计算一个月
    expireAt = new Date(now);
    expireAt.setMonth(expireAt.getMonth() + 1);
  }

  // 查找现有订阅
  const existingSubscription = await prisma.subscription.findFirst({
    where: { userId },
  });

  let subscription;
  if (existingSubscription) {
    // 更新现有订阅
    subscription = await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        tier,
        status: 'active',
        startAt: now,
        expireAt,
        orderId,
        autoRenew: true,
      },
    });
  } else {
    // 创建新订阅
    subscription = await prisma.subscription.create({
      data: {
        userId,
        tier,
        status: 'active',
        startAt: now,
        expireAt,
        orderId,
        autoRenew: true,
      },
    });
  }

  return subscription;
}

/**
 * 取消订阅
 */
export async function cancelSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
  });

  if (!subscription) {
    return null;
  }

  return prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'cancelled',
      autoRenew: false,
    },
  });
}

/**
 * 创建订单（模拟支付）
 */
export async function createOrder(
  userId: string,
  tier: TierType,
  paymentMethod: string = 'mock'
) {
  const tierInfo = SUBSCRIPTION_TIERS[tier];
  if (!tierInfo) {
    throw new Error('Invalid tier');
  }

  const order = await prisma.order.create({
    data: {
      userId,
      tier,
      amount: tierInfo.price,
      paymentMethod,
      status: 'pending',
    },
  });

  return order;
}

/**
 * 模拟支付成功回调
 */
export async function completeOrder(orderId: string, transactionId?: string) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'paid',
      transactionId: transactionId || `mock_${Date.now()}`,
      paidAt: new Date(),
    },
  });

  // 创建或更新订阅
  await createSubscription(order.userId, order.tier as TierType, order.id);

  return order;
}
