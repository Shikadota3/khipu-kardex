import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Listar movimientos (opcionalmente filtrar por activoId)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activoId = searchParams.get('activoId');

    let query = `SELECT id, activo_id AS "activoId", tipo,
                        tipo_documento AS "tipoDocumento",
                        serie, numero, fecha, cantidad,
                        costo_unitario AS "costoUnitario",
                        tipo_operacion AS "tipoOperacion",
                        observaciones, created_at AS "createdAt"
                 FROM system_movements`;

    const params: string[] = [];

    if (activoId) {
      query += ` WHERE activo_id = $1`;
      params.push(activoId);
    }

    query += ` ORDER BY created_at ASC`;

    const result = await pool.query(query, params);
    return NextResponse.json({ movements: result.rows });
  } catch (err) {
    console.error('GET movements error:', err);
    return NextResponse.json({ error: 'Error al obtener movimientos.' }, { status: 500 });
  }
}

// POST - Crear movimiento
export async function POST(req: NextRequest) {
  try {
    const {
      id, activoId, tipo, tipoDocumento, serie, numero, fecha,
      cantidad, costoUnitario, tipoOperacion, observaciones, createdAt
    } = await req.json();

    await pool.query(
      `INSERT INTO system_movements
       (id, activo_id, tipo, tipo_documento, serie, numero, fecha,
        cantidad, costo_unitario, tipo_operacion, observaciones, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [id, activoId, tipo, tipoDocumento, serie, numero, fecha,
       cantidad, costoUnitario, tipoOperacion, observaciones ?? '', createdAt ?? Date.now()]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST movement error:', err);
    return NextResponse.json({ error: 'Error al crear movimiento.' }, { status: 500 });
  }
}

// DELETE - Eliminar movimiento
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await pool.query(`DELETE FROM system_movements WHERE id=$1`, [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE movement error:', err);
    return NextResponse.json({ error: 'Error al eliminar movimiento.' }, { status: 500 });
  }
}