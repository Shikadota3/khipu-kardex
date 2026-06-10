import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({});
    
    const result = await pool.query(
      'SELECT valuation_method, empresa_config FROM user_config WHERE user_id = $1',
      [userId]
    );
    
    const row = result.rows[0];
    if (!row) return NextResponse.json({});
    
    return NextResponse.json({
      valuationMethod: row.valuation_method,
      empresaConfig: row.empresa_config ? JSON.parse(row.empresa_config) : null
    });
  } catch (err) {
    console.error('Error config GET:', err);
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, valuationMethod, empresaConfig } = body;
    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    
    await pool.query(`
      INSERT INTO user_config (user_id, valuation_method, empresa_config)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE 
      SET valuation_method = COALESCE($2, user_config.valuation_method),
          empresa_config = COALESCE($3, user_config.empresa_config)
    `, [userId, valuationMethod || null, empresaConfig ? JSON.stringify(empresaConfig) : null]);
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error config POST:', err);
    return NextResponse.json({ error: 'Error guardando config' }, { status: 500 });
  }
}