import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    const result = await pool.query(
      `SELECT id, activo_id as "activoId", tipo, tipo_documento as "tipoDocumento", tipo_operacion as "tipoOperacion", serie, numero, fecha, cantidad, costo_unitario as "costoUnitario", (cantidad * costo_unitario) as "costoTotal", observaciones, created_at as "createdAt", user_id as "userId" FROM movements WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return NextResponse.json({ movements: result.rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, activoId, tipo, fecha, tipoDocumento, tipoOperacion, serie, numero, cantidad, costoUnitario, observaciones } = body;
    if (!userId || !activoId || !tipo) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    const movId = id ?? crypto.randomUUID();
    await pool.query(
      `INSERT INTO movements (id, user_id, activo_id, tipo, fecha, tipo_documento, tipo_operacion, serie, numero, cantidad, costo_unitario, observaciones, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO UPDATE SET
         activo_id=EXCLUDED.activo_id, tipo=EXCLUDED.tipo,
         fecha=EXCLUDED.fecha, tipo_documento=EXCLUDED.tipo_documento,
         tipo_operacion=EXCLUDED.tipo_operacion, serie=EXCLUDED.serie,
         numero=EXCLUDED.numero, cantidad=EXCLUDED.cantidad,
         costo_unitario=EXCLUDED.costo_unitario,
         observaciones=EXCLUDED.observaciones`,
      [movId, userId, activoId, tipo, fecha, tipoDocumento??'00', tipoOperacion??'', serie??'', numero??'', cantidad??0, costoUnitario??0, observaciones??'', Date.now()]
    );
    return NextResponse.json({ movement: { id: movId, ...body } }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al guardar movimiento' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId } = body;
    if (!id || !userId) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    await pool.query(`DELETE FROM movements WHERE id=$1 AND user_id=$2`, [id, userId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}