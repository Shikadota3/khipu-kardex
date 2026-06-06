import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    await pool.query(`
      INSERT INTO system_users (id, username, password, full_name, role, created_at)
      VALUES (
        'admin-id',
        'admin',
        'khipu-admin-2026',
        'Administrador de Sistema',
        'ADMIN',
        1717200000000
      ) ON CONFLICT (username) DO NOTHING
    `);
    return NextResponse.json({ success: true });
  } catch (err) {
    // Si la tabla no existe aún, no es crítico — el sistema seguirá funcionando
    console.error('Init error (non-critical):', err);
    return NextResponse.json({ success: false });
  }
}