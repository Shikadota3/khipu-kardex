// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

// POST /api/products
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      userId,
      codigo,
      nombre,
      unidadMedida,
      unidadMedidaCodigo,
      tipoExistencia,
      stockMinimo,
      stockMaximo,
      observaciones,
    } = body;

    if (!userId || !codigo || !nombre) {
      return NextResponse.json(
        { error: 'userId, codigo y nombre son requeridos' },
        { status: 400 }
      );
    }

    const product = await prisma.product.upsert({
      where: { id: id ?? '' },
      update: {
        codigo,
        nombre,
        unidadMedida,
        unidadMedidaCodigo,
        tipoExistencia,
        stockMinimo: stockMinimo ?? 0,
        stockMaximo: stockMaximo ?? 0,
        observaciones: observaciones ?? '',
      },
      create: {
        id: id ?? crypto.randomUUID(),
        userId,
        codigo,
        nombre,
        unidadMedida,
        unidadMedidaCodigo,
        tipoExistencia,
        stockMinimo: stockMinimo ?? 0,
        stockMaximo: stockMaximo ?? 0,
        observaciones: observaciones ?? '',
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ error: 'Error al guardar producto' }, { status: 500 });
  }
}

// DELETE /api/products
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'id y userId requeridos' }, { status: 400 });
    }

    // Verificar que el producto pertenece al usuario
    const product = await prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Eliminar movimientos del producto primero (integridad referencial)
    await prisma.movement.deleteMany({
      where: { activoId: id, userId },
    });

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/products error:', error);
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}