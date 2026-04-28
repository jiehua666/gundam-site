import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const series = searchParams.get('series');
    const grade = searchParams.get('grade');
    const classification = searchParams.get('classification');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Prisma.MechaWhereInput = {
      isDeleted: false,
      status: 'active',
    };

    if (series) {
      where.series = series;
    }

    if (grade) {
      where.grade = grade;
    }

    if (classification) {
      where.classification = classification;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { series: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    const orderBy: Prisma.MechaOrderByWithRelationInput = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [mechas, total] = await Promise.all([
      prisma.mecha.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          series: true,
          grade: true,
          classification: true,
          coverImage: true,
          summary: true,
          height: true,
          weight: true,
          createdAt: true,
        },
      }),
      prisma.mecha.count({ where }),
    ]);

    return NextResponse.json({
      mechas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/mechas error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/mechas - 创建机体
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !isAdmin(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      series,
      grade,
      classification,
      coverImage,
      summary,
      height,
      weight,
      powerSystem,
      armor,
      specs,
      palettes,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const mecha = await prisma.mecha.create({
      data: {
        name,
        series: series || null,
        grade: grade || null,
        classification: classification || null,
        coverImage: coverImage || null,
        summary: summary || null,
        height: height || null,
        weight: weight || null,
        powerSystem: powerSystem || null,
        armor: armor || null,
        status: 'active',
        specs: specs ? {
          create: specs.map((s: { specKey: string; specValue: string }) => ({
            specKey: s.specKey,
            specValue: s.specValue,
          })),
        } : undefined,
        palettes: palettes ? {
          create: palettes.map((p: { name: string; primaryColor?: string; secondaryColor?: string; accentColor?: string }) => ({
            name: p.name,
            primaryColor: p.primaryColor || null,
            secondaryColor: p.secondaryColor || null,
            accentColor: p.accentColor || null,
          })),
        } : undefined,
      },
    });

    return NextResponse.json({ mecha }, { status: 201 });
  } catch (error) {
    console.error('POST /api/mechas error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
