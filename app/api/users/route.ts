import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, username, password, full_name AS "fullName", role, created_at AS "createdAt"
       FROM system_users ORDER BY created_at ASC`
    );
    return NextResponse.json({ users: result.rows });
  } catch (err) {
    console.error('GET users error:', err);
    return NextResponse.json({ error: 'Error al obtener usuarios.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, username, password, fullName, role, createdAt } = await req.json();
    await pool.query(
      `INSERT INTO system_users (id, username, password, full_name, role, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, username, password, fullName, role, createdAt ?? Date.now()]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('POST users error:', err);
    if (err.code === '23505') {
      return NextResponse.json({ error: 'El usuario ya existe.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear usuario.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, username, password, fullName, role } = await req.json();
    await pool.query(
      `UPDATE system_users SET username=$1, password=$2, full_name=$3, role=$4 WHERE id=$5`,
      [username, password, fullName, role, id]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT users error:', err);
    return NextResponse.json({ error: 'Error al actualizar usuario.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await pool.query(`DELETE FROM system_users WHERE id=$1`, [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE users error:', err);
    return NextResponse.json({ error: 'Error al eliminar usuario.' }, { status: 500 });
  }
}