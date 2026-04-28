import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mecha = await prisma.mecha.findUnique({
      where: { id, isDeleted: false },
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
        powerSystem: true,
        armor: true,
        contentSource: true,
        createdAt: true,
        likeCount: true,
        collectCount: true,
        specs: true,
        palettes: true,
      },
    });

    if (!mecha) {
      return NextResponse.json(
        { error: 'Mecha not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ mecha });
  } catch (error) {
    console.error('GET /api/mechas/:id error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { getCurrentUser, isAdmin } from '@/lib/auth';

// PUT /api/mechas/[id] - 更新机体
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !isAdmin(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 检查机体是否存在
    const mecha = await prisma.mecha.findUnique({
      where: { id, isDeleted: false },
    });

    if (!mecha) {
      return NextResponse.json({ error: 'Mecha not found' }, { status: 404 });
    }

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

    // 更新机体
    const updated = await prisma.mecha.update({
      where: { id },
      data: {
        name: name || mecha.name,
        series: series !== undefined ? series : mecha.series,
        grade: grade !== undefined ? grade : mecha.grade,
        classification: classification !== undefined ? classification : mecha.classification,
        coverImage: coverImage !== undefined ? coverImage : mecha.coverImage,
        summary: summary !== undefined ? summary : mecha.summary,
        height: height !== undefined ? height : mecha.height,
        weight: weight !== undefined ? weight : mecha.weight,
        powerSystem: powerSystem !== undefined ? powerSystem : mecha.powerSystem,
        armor: armor !== undefined ? armor : mecha.armor,
      },
    });

    // 更新规格参数
    if (specs && Array.isArray(specs)) {
      await prisma.mechaSpec.deleteMany({ where: { mechaId: id } });
      if (specs.length > 0) {
        await prisma.mechaSpec.createMany({
          data: specs.map((s: { specKey: string; specValue: string }) => ({
            mechaId: id,
            specKey: s.specKey,
            specValue: s.specValue,
          })),
        });
      }
    }

    // 更新配色方案
    if (palettes && Array.isArray(palettes)) {
      await prisma.paletteScheme.deleteMany({ where: { mechaId: id } });
      if (palettes.length > 0) {
        await prisma.paletteScheme.createMany({
          data: palettes.map((p: { name: string; primaryColor?: string; secondaryColor?: string; accentColor?: string }) => ({
            mechaId: id,
            name: p.name,
            primaryColor: p.primaryColor || null,
            secondaryColor: p.secondaryColor || null,
            accentColor: p.accentColor || null,
          })),
        });
      }
    }

    return NextResponse.json({ success: true, mecha: updated });
  } catch (error) {
    console.error('PUT /api/mechas/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/mechas/[id] - 删除机体
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !isAdmin(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 软删除
    await prisma.mecha.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/mechas/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
