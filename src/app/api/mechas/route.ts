import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
