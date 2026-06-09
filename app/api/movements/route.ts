import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    const result = await pool.query(`SELECT * FROM movements WHERE "userId" = $1 ORDER BY "createdAt" ASC`, [userId]);
    return NextResponse.json({ movements: result.rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, activoId, tipo, fecha, tipoDocumento, tipoOperacion, serie, numero, cantidad, costoUnitario, costoTotal, observaciones, createdAt } = body;
    if (!userId || !activoId || !tipo) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    const movId = id ?? crypto.randomUUID();
    await pool.query(
      `INSERT INTO movements (id, "userId", "activoId", tipo, fecha, "tipoDocumento", "tipoOperacion", serie, numero, cantidad, "costoUnitario", "costoTotal", observaciones, "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (id) DO UPDATE SET
         "activoId"=EXCLUDED."activoId", tipo=EXCLUDED.tipo,
         fecha=EXCLUDED.fecha, "tipoDocumento"=EXCLUDED."tipoDocumento",
         "tipoOperacion"=EXCLUDED."tipoOperacion", serie=EXCLUDED.serie,
         numero=EXCLUDED.numero, cantidad=EXCLUDED.cantidad,
         "costoUnitario"=EXCLUDED."costoUnitario",
         "costoTotal"=EXCLUDED."costoTotal",
         observaciones=EXCLUDED.observaciones`,
      [movId, userId, activoId, tipo, fecha, tipoDocumento??'00', tipoOperacion??'', serie??'', numero??'', cantidad??0, costoUnitario??0, costoTotal??0, observaciones??'', createdAt??Date.now()]
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
    const check = await pool.query(`SELECT id FROM movements WHERE id=$1 AND "userId"=$2`, [id, userId]);
    if (check.rowCount === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    await pool.query(`DELETE FROM movements WHERE id=$1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}