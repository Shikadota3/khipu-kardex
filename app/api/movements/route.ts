// app/api/movements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/movements?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const movements = await prisma.movement.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ movements });
  } catch (error) {
    console.error('GET /api/movements error:', error);
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 });
  }
}

// POST /api/movements
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      userId,
      activoId,
      tipo,
      fecha,
      tipoDocumento,
      tipoOperacion,
      serie,
      numero,
      cantidad,
      costoUnitario,
      costoTotal,
      observaciones,
      createdAt,
    } = body;

    if (!userId || !activoId || !tipo) {
      return NextResponse.json(
        { error: 'userId, activoId y tipo son requeridos' },
        { status: 400 }
      );
    }

    const movement = await prisma.movement.upsert({
      where: { id: id ?? '' },
      update: {
        activoId,
        tipo,
        fecha,
        tipoDocumento,
        tipoOperacion: tipoOperacion ?? '',
        serie,
        numero,
        cantidad,
        costoUnitario,
        costoTotal,
        observaciones: observaciones ?? '',
        createdAt: createdAt ?? Date.now(),
      },
      create: {
        id: id ?? crypto.randomUUID(),
        userId,
        activoId,
        tipo,
        fecha,
        tipoDocumento,
        tipoOperacion: tipoOperacion ?? '',
        serie,
        numero,
        cantidad,
        costoUnitario,
        costoTotal,
        observaciones: observaciones ?? '',
        createdAt: createdAt ?? Date.now(),
      },
    });

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    console.error('POST /api/movements error:', error);
    return NextResponse.json({ error: 'Error al guardar movimiento' }, { status: 500 });
  }
}

// DELETE /api/movements
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'id y userId requeridos' }, { status: 400 });
    }

    // Verificar que el movimiento pertenece al usuario
    const movement = await prisma.movement.findFirst({
      where: { id, userId },
    });

    if (!movement) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
    }

    await prisma.movement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/movements error:', error);
    return NextResponse.json({ error: 'Error al eliminar movimiento' }, { status: 500 });
  }
}