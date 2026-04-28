import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  checkUserSubscription,
  createSubscription,
  cancelSubscription,
  createOrder,
  completeOrder,
  SUBSCRIPTION_TIERS,
  TierType,
} from '@/lib/subscription';

// GET /api/subscription - 获取当前用户订阅状态
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription, tier } = await checkUserSubscription();

    // 计算剩余天数
    let remainingDays = null;
    if (subscription && subscription.expireAt) {
      const now = new Date();
      const expireAt = new Date(subscription.expireAt);
      const diffTime = expireAt.getTime() - now.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      subscription: subscription ? {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        startAt: subscription.startAt,
        expireAt: subscription.expireAt,
        autoRenew: subscription.autoRenew,
      } : null,
      tier,
      remainingDays,
      tiers: SUBSCRIPTION_TIERS,
    });
  } catch (error) {
    console.error('GET /api/subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/subscription - 创建订阅（模拟支付）
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { tier, paymentMethod = 'mock' } = body as {
      tier: TierType;
      paymentMethod?: string;
    };

    // 验证 tier
    if (!tier || !SUBSCRIPTION_TIERS[tier]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // 免费档直接订阅
    if (tier === 'free') {
      const subscription = await createSubscription(currentUser.userId, tier);
      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          tier: subscription.tier,
          status: subscription.status,
          startAt: subscription.startAt,
          expireAt: subscription.expireAt,
        },
      });
    }

    // 其他档位创建订单
    const order = await createOrder(currentUser.userId, tier, paymentMethod);

    // 模拟支付成功（直接完成订单）
    const paidOrder = await completeOrder(order.id);

    // 获取更新后的订阅
    const { subscription } = await checkUserSubscription();

    return NextResponse.json({
      success: true,
      order: {
        id: paidOrder.id,
        tier: paidOrder.tier,
        amount: paidOrder.amount,
        status: paidOrder.status,
        paidAt: paidOrder.paidAt,
      },
      subscription: subscription ? {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        startAt: subscription.startAt,
        expireAt: subscription.expireAt,
      } : null,
    });
  } catch (error) {
    console.error('POST /api/subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/subscription - 取消订阅
export async function DELETE() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await cancelSubscription(currentUser.userId);

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled',
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error('DELETE /api/subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
