import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const items = await prisma.banner.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/admin/settings/banners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { imageUrl, link } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const maxOrder = await prisma.banner.aggregate({
      _max: { sortOrder: true },
    });

    const banner = await prisma.banner.create({
      data: {
        imageUrl,
        link: link || null,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
        status: 'active',
      },
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/settings/banners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
