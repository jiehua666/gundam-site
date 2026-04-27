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
      include: {
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
