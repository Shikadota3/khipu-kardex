import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    const result = await pool.query(`SELECT * FROM products WHERE "userId" = $1 ORDER BY "createdAt" ASC`, [userId]);
    return NextResponse.json({ products: result.rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, codigo, nombre, unidadMedida, unidadMedidaCodigo, tipoExistencia, stockMinimo, stockMaximo, observaciones } = body;
    if (!userId || !codigo || !nombre) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    const productId = id ?? crypto.randomUUID();
    await pool.query(
      `INSERT INTO products (id, "userId", codigo, nombre, "unidadMedida", "unidadMedidaCodigo", "tipoExistencia", "stockMinimo", "stockMaximo", observaciones, "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO UPDATE SET
         codigo=EXCLUDED.codigo, nombre=EXCLUDED.nombre,
         "unidadMedida"=EXCLUDED."unidadMedida",
         "unidadMedidaCodigo"=EXCLUDED."unidadMedidaCodigo",
         "tipoExistencia"=EXCLUDED."tipoExistencia",
         "stockMinimo"=EXCLUDED."stockMinimo",
         "stockMaximo"=EXCLUDED."stockMaximo",
         observaciones=EXCLUDED.observaciones`,
      [productId, userId, codigo, nombre, unidadMedida??'UNIDADES', unidadMedidaCodigo??'07', tipoExistencia??'01', stockMinimo??0, stockMaximo??0, observaciones??'', Date.now()]
    );
    return NextResponse.json({ product: { id: productId, ...body } }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al guardar producto' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId } = body;
    if (!id || !userId) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    const check = await pool.query(`SELECT id FROM products WHERE id=$1 AND "userId"=$2`, [id, userId]);
    if (check.rowCount === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    await pool.query(`DELETE FROM movements WHERE "activoId"=$1 AND "userId"=$2`, [id, userId]);
    await pool.query(`DELETE FROM products WHERE id=$1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}