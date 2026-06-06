import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const result = await pool.query(
      `SELECT id, username, password, full_name AS "fullName", role, created_at AS "createdAt"
       FROM system_users
       WHERE LOWER(username) = LOWER($1) AND password = $2`,
      [username, password]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}