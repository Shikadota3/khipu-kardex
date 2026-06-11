import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    const result = await pool.query(
      `SELECT id, codigo, nombre, unidad_medida as "unidadMedida", unidad_medida_codigo as "unidadMedidaCodigo", tipo_existencia as "tipoExistencia", stock_minimo as "stockMinimo", stock_maximo as "stockMaximo", observaciones, created_at as "createdAt", user_id as "userId" FROM products WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
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
    const prodId = id ?? crypto.randomUUID();
    await pool.query(
      `INSERT INTO products (id, user_id, codigo, nombre, unidad_medida, unidad_medida_codigo, tipo_existencia, stock_minimo, stock_maximo, observaciones, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO UPDATE SET
         codigo=EXCLUDED.codigo, nombre=EXCLUDED.nombre,
         unidad_medida=EXCLUDED.unidad_medida, unidad_medida_codigo=EXCLUDED.unidad_medida_codigo,
         tipo_existencia=EXCLUDED.tipo_existencia, stock_minimo=EXCLUDED.stock_minimo,
         stock_maximo=EXCLUDED.stock_maximo, observaciones=EXCLUDED.observaciones`,
      [prodId, userId, codigo, nombre, unidadMedida??'UNIDADES', unidadMedidaCodigo??'07', tipoExistencia??'01', stockMinimo??0, stockMaximo??0, observaciones??'', Date.now()]
    );
    return NextResponse.json({ product: { id: prodId, ...body } }, { status: 201 });
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
    await pool.query(`DELETE FROM products WHERE id=$1 AND user_id=$2`, [id, userId]);
    await pool.query(`DELETE FROM movements WHERE activo_id=$1 AND user_id=$2`, [id, userId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}